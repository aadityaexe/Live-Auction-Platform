import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { createPaymentOrder, verifyPaymentSignature } from "../services/payment.service.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { logger } from "../logger/logger.js";
import crypto from "crypto";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Auction from "../models/Auction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";
import { createNotification } from "../services/notification.service.js";
import { getIO } from "../sockets/socket.js";
import config from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const initiatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  const userId = req.user?.id || req.user?.userId;

  if (!orderId || !userId) {
    throw new AppError("Order ID is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const paymentDetails = await createPaymentOrder(orderId, userId);

  res.status(200).json({
    status: "success",
    data: paymentDetails,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Payment details missing", 400, ERROR_CODES.BAD_REQUEST);
  }

  const result = await verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getPaymentByOrderId = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.id || req.user?.userId;

  const payment = await Payment.findOne({
    orderId,
    userId,
  }).sort({ createdAt: -1 });

  if (!payment) {
    throw new AppError("Payment record not found", 404, ERROR_CODES.NOT_FOUND);
  }

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const secret = config.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("Razorpay webhook secret not configured.");
    res.status(500).send("Webhook configuration error");
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = (req as any).rawBody ? (req as any).rawBody.toString("utf8") : JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    logger.warn("Invalid Razorpay webhook signature");
    res.status(400).send("Invalid signature");
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = payload.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (orderId && paymentId) {
      const session = await mongoose.startSession();
      session.startTransaction();
      let orderToNotify: any = null;
      let paymentToNotify: any = null;
      try {
        const payment = await Payment.findOne({ providerOrderId: orderId }).session(session);
        if (payment && payment.status !== "PAID") {
          payment.status = "PAID";
          payment.providerPaymentId = paymentId;
          payment.verifiedAt = new Date();
          if (!payment.webhookEventReferences) payment.webhookEventReferences = [];
          payment.webhookEventReferences.push(req.body.id);
          await payment.save({ session });
          paymentToNotify = payment;

          const order = await Order.findById(payment.orderId).session(session);
          if (order && order.paymentStatus !== "PAID") {
            order.paymentStatus = "PAID";
            order.status = "PROCESSING";
            order.paidAt = new Date();
            await order.save({ session });
            orderToNotify = order;

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

                // Escrow hold: only heldBalance increases, spendable balance unchanged
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
        }
        await session.commitTransaction();

        if (orderToNotify && paymentToNotify) {
          createNotification({
            userId: orderToNotify.buyerId.toString(),
            type: "PAYMENT_RECEIVED",
            title: "Payment Confirmed",
            message: `Your payment of ₹${orderToNotify.finalAmount} for Order #${orderToNotify.orderNumber} was confirmed.`,
            data: { orderId: orderToNotify._id.toString(), paymentId: paymentToNotify._id.toString() }
          }).catch(err => logger.error("Failed to send webhook buyer notification", { err }));

          if (orderToNotify.sellerId) {
            createNotification({
              userId: orderToNotify.sellerId.toString(),
              type: "PAYMENT_RECEIVED",
              title: "Payment Received in Escrow",
              message: `Buyer completed payment of ₹${orderToNotify.finalAmount} for Order #${orderToNotify.orderNumber}. Funds are securely held in escrow until delivery.`,
              data: { orderId: orderToNotify._id.toString(), paymentId: paymentToNotify._id.toString() }
            }).catch(err => logger.error("Failed to send webhook seller notification", { err }));
          }

          try {
            const io = getIO();
            io.to(`user:${orderToNotify.buyerId.toString()}`).emit("order:updated", {
              orderId: orderToNotify._id.toString(),
              status: "PROCESSING",
              paymentStatus: "PAID"
            });
            if (orderToNotify.sellerId) {
              io.to(`user:${orderToNotify.sellerId.toString()}`).emit("order:updated", {
                orderId: orderToNotify._id.toString(),
                status: "PROCESSING",
                paymentStatus: "PAID"
              });
            }
          } catch {
            // Socket may not be initialized in non-server contexts
          }
        }
      } catch (err: any) {
        await session.abortTransaction();
        logger.error("Webhook processing error: ", err instanceof Error ? err : new Error(String(err)));
      } finally {
        session.endSession();
      }
    }
  }

  res.status(200).send("Webhook received");
});
