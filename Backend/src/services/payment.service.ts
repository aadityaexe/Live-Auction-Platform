import Razorpay from "razorpay";
import crypto from "crypto";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Auction from "../models/Auction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";
import { createNotification } from "./notification.service.js";
import { getIO } from "../sockets/socket.js";
import { logger } from "../logger/logger.js";
import config from "../config/env.js";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export const createPaymentOrder = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, buyerId: userId });
  if (!order) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);

  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", 400, ERROR_CODES.BAD_REQUEST);
  }

  let payment = await Payment.findOne({
    orderId: order._id,
    userId: userId,
    status: { $in: ["CREATED", "PENDING"] },
  });

  if (!payment) {
    const amountInPaise = Math.round(Number(order.finalAmount) * 100);

    let rzpOrderId: string;
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.orderNumber,
      });
      rzpOrderId = rzpOrder.id;
    } catch (rzpErr) {
      if (process.env.NODE_ENV !== "production") {
        logger.warn("Razorpay API call failed in dev; using sandbox mock order ID", { error: String(rzpErr) });
        rzpOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      } else {
        throw rzpErr;
      }
    }

    payment = await Payment.create({
      orderId: order._id,
      auctionId: order.auctionId,
      userId: userId,
      amount: order.finalAmount,
      currency: "INR",
      provider: "RAZORPAY",
      providerOrderId: rzpOrderId,
      status: "CREATED",
    });
  }

  return {
    paymentId: payment._id,
    providerOrderId: payment.providerOrderId,
    amount: payment.amount,
    currency: payment.currency,
    keyId: config.RAZORPAY_KEY_ID,
  };
};

export const verifyPaymentSignature = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) => {
  const secret = config.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Razorpay secret not configured");

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== signature) {
    throw new AppError("Invalid payment signature", 400, ERROR_CODES.BAD_REQUEST);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOne({ providerOrderId: razorpayOrderId }).session(session);
    if (!payment) throw new AppError("Payment not found", 404, ERROR_CODES.NOT_FOUND);

    if (payment.status === "PAID") {
      await session.abortTransaction();
      return { success: true, alreadyPaid: true };
    }

    payment.status = "PAID";
    payment.providerPaymentId = razorpayPaymentId;
    payment.verifiedAt = new Date();
    await payment.save({ session });

    const order = await Order.findById(payment.orderId).session(session);
    if (order) {
      order.paymentStatus = "PAID";
      order.status = "PROCESSING";
      order.paidAt = new Date();
      await order.save({ session });

      await Auction.findByIdAndUpdate(
        order.auctionId,
        { status: "PAYMENT_COMPLETED" },
        { session }
      );

      if (order.sellerId) {
        let sellerWallet = await Wallet.findOne({ userId: order.sellerId }).session(session);
        if (!sellerWallet) {
          const created = await Wallet.create([{ userId: order.sellerId, balance: 0, heldBalance: 0 }], { session });
          sellerWallet = created[0];
        }

        if (sellerWallet) {
          const amountNum = Number(order.finalAmount);
          const currentBal = parseFloat(sellerWallet.balance.toString());
          const currentHeld = parseFloat(sellerWallet.heldBalance.toString());

          // money is held in escrow — only heldBalance increases, balance unchanged
          sellerWallet.heldBalance = mongoose.Types.Decimal128.fromString((currentHeld + amountNum).toFixed(2));
          sellerWallet.version += 1;
          await sellerWallet.save({ session });

          await WalletTransaction.create([{
            walletId: sellerWallet._id,
            userId: order.sellerId,
            type: "HOLD",
            amount: mongoose.Types.Decimal128.fromString(amountNum.toFixed(2)),
            balanceBefore: mongoose.Types.Decimal128.fromString(currentBal.toFixed(2)),
            balanceAfter: mongoose.Types.Decimal128.fromString(currentBal.toFixed(2)),
            status: "COMPLETED",
            referenceId: order._id.toString(),
            description: `Escrow hold for Order #${order.orderNumber}`
          }], { session });
        }
      }
    }

    await session.commitTransaction();

    if (order) {
      createNotification({
        userId: order.buyerId.toString(),
        type: "PAYMENT_RECEIVED",
        title: "Payment Confirmed",
        message: `Your payment of ₹${order.finalAmount} for Order #${order.orderNumber} was confirmed.`,
        data: { orderId: order._id.toString(), paymentId: payment._id.toString() }
      }).catch(err => logger.error("Failed to notify buyer of payment", { error: err instanceof Error ? err.message : String(err) }));

      if (order.sellerId) {
        createNotification({
          userId: order.sellerId.toString(),
          type: "PAYMENT_RECEIVED",
          title: "Payment Received in Escrow",
          message: `Buyer completed payment of ₹${order.finalAmount} for Order #${order.orderNumber}. Funds are securely held in escrow until delivery.`,
          data: { orderId: order._id.toString(), paymentId: payment._id.toString() }
        }).catch(err => logger.error("Failed to notify seller of escrow hold", { error: err instanceof Error ? err.message : String(err) }));
      }

      try {
        const io = getIO();
        io.to(`user:${order.buyerId.toString()}`).emit("order:updated", {
          orderId: order._id.toString(),
          status: "PROCESSING",
          paymentStatus: "PAID"
        });
        if (order.sellerId) {
          io.to(`user:${order.sellerId.toString()}`).emit("order:updated", {
            orderId: order._id.toString(),
            status: "PROCESSING",
            paymentStatus: "PAID"
          });
        }
      } catch {
      }
    }

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
