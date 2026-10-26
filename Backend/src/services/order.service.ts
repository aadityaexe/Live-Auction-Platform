import mongoose from "mongoose";
import Order from "../models/Order.js";
import Auction from "../models/Auction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { createNotification } from "./notification.service.js";
import { getIO } from "../sockets/socket.js";
import { logger } from "../logger/logger.js";

export const getUserOrders = async (userId: string, role: "BUYER" | "SELLER" | "ADMIN", page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;
  const filter: Record<string, unknown> = {};
  if (role === "BUYER") filter.buyerId = new mongoose.Types.ObjectId(userId);
  else if (role === "SELLER") filter.sellerId = new mongoose.Types.ObjectId(userId);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("auctionId", "title images status")
      .populate("buyerId", "username email")
      .populate("sellerId", "username email")
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const getOrderById = async (orderId: string, userId: string, role: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new AppError("Invalid order ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  const order = await Order.findById(orderId)
    .populate("auctionId", "title images status description")
    .populate("buyerId", "username email profilePicture")
    .populate("sellerId", "username email profilePicture")
    .populate("winningBidId", "amount createdAt");
  if (!order) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);
  const buyerIdStr = (order.buyerId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString() ?? order.buyerId.toString();
  const sellerIdStr = (order.sellerId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString() ?? order.sellerId.toString();
  if (role !== "ADMIN" && buyerIdStr !== userId && sellerIdStr !== userId)
    throw new AppError("You are not authorized to view this order", 403, ERROR_CODES.FORBIDDEN);
  return order;
};

export const updateOrderStatus = async (
  orderId: string,
  userId: string,
  role: string,
  newStatus: "SHIPPED" | "DELIVERED"
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);

  const buyerIdStr = (order.buyerId as any)._id?.toString() || order.buyerId.toString();
  const sellerIdStr = (order.sellerId as any)._id?.toString() || order.sellerId.toString();

  if (newStatus === "SHIPPED") {
    if (role !== "ADMIN" && sellerIdStr !== userId) {
      throw new AppError("Only the seller or admin can mark an order as shipped", 403, ERROR_CODES.FORBIDDEN);
    }
    if (order.status !== "PROCESSING") {
      throw new AppError(`Cannot mark order as shipped from status ${order.status}`, 400, ERROR_CODES.BAD_REQUEST);
    }
    order.status = "SHIPPED";
    await order.save();

    createNotification({
      userId: buyerIdStr,
      type: "ORDER_UPDATE",
      title: "Order Shipped",
      message: `Your item for Order #${order.orderNumber} has been shipped by the seller.`,
      data: { orderId: order._id.toString() }
    }).catch(err => logger.error("Failed to notify buyer of shipment", { error: err instanceof Error ? err.message : String(err) }));

    try {
      const io = getIO();
      io.to(`user:${buyerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: "SHIPPED" });
      io.to(`user:${sellerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: "SHIPPED" });
    } catch {}

    return order;
  }

  if (newStatus === "DELIVERED") {
    if (role !== "ADMIN" && buyerIdStr !== userId && sellerIdStr !== userId) {
      throw new AppError("You are not authorized to mark this order as delivered", 403, ERROR_CODES.FORBIDDEN);
    }
    if (order.status !== "SHIPPED" && order.status !== "PROCESSING") {
      throw new AppError(`Cannot mark order as delivered from status ${order.status}`, 400, ERROR_CODES.BAD_REQUEST);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const currentOrder = await Order.findById(orderId).session(session);
      if (!currentOrder) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);
      if (currentOrder.status === "DELIVERED") {
        await session.abortTransaction();
        return currentOrder;
      }

      currentOrder.status = "DELIVERED";
      await currentOrder.save({ session });

      if (currentOrder.paymentStatus === "PAID" && currentOrder.sellerId) {
        const sellerWallet = await Wallet.findOne({ userId: currentOrder.sellerId }).session(session);
        if (sellerWallet) {
          const amountNum = Number(currentOrder.finalAmount);
          const currentBal = parseFloat(sellerWallet.balance.toString());
          const currentHeld = parseFloat(sellerWallet.heldBalance.toString());
          const newBal = currentBal + amountNum;
          const newHeld = Math.max(0, currentHeld - amountNum);

          // escrow release: move from held to spendable balance
          sellerWallet.balance = mongoose.Types.Decimal128.fromString(newBal.toFixed(2));
          sellerWallet.heldBalance = mongoose.Types.Decimal128.fromString(newHeld.toFixed(2));
          sellerWallet.version += 1;
          await sellerWallet.save({ session });

          await WalletTransaction.create([{
            walletId: sellerWallet._id,
            userId: currentOrder.sellerId,
            type: "RELEASE",
            amount: mongoose.Types.Decimal128.fromString(amountNum.toFixed(2)),
            balanceBefore: mongoose.Types.Decimal128.fromString(currentBal.toFixed(2)),
            balanceAfter: mongoose.Types.Decimal128.fromString(newBal.toFixed(2)),
            status: "COMPLETED",
            referenceId: currentOrder._id.toString(),
            description: `Escrow funds released for delivered Order #${currentOrder.orderNumber}`
          }], { session });
        }
      }

      await Auction.findByIdAndUpdate(
        currentOrder.auctionId,
        { status: "FULFILLED" },
        { session }
      );

      await session.commitTransaction();

      createNotification({
        userId: sellerIdStr,
        type: "ORDER_UPDATE",
        title: "Escrow Funds Released",
        message: `₹${currentOrder.finalAmount} for Order #${currentOrder.orderNumber} has been released to your available balance.`,
        data: { orderId: currentOrder._id.toString() }
      }).catch(err => logger.error("Failed to notify seller of escrow release", { error: err instanceof Error ? err.message : String(err) }));

      createNotification({
        userId: buyerIdStr,
        type: "ORDER_UPDATE",
        title: "Order Delivered",
        message: `Order #${currentOrder.orderNumber} has been marked as delivered.`,
        data: { orderId: currentOrder._id.toString() }
      }).catch(err => logger.error("Failed to notify buyer of delivery", { error: err instanceof Error ? err.message : String(err) }));

      try {
        const io = getIO();
        io.to(`user:${buyerIdStr}`).emit("order:updated", { orderId: currentOrder._id.toString(), status: "DELIVERED" });
        io.to(`user:${sellerIdStr}`).emit("order:updated", { orderId: currentOrder._id.toString(), status: "DELIVERED" });
      } catch {}

      return currentOrder;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  throw new AppError("Invalid status transition", 400, ERROR_CODES.BAD_REQUEST);
};

export const updateFulfillment = async (
  orderId: string,
  userId: string,
  role: string,
  data: { trackingNumber?: string; trackingCarrier?: string; status?: "SHIPPED" }
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new AppError("Invalid order ID", 400, ERROR_CODES.INVALID_OBJECT_ID);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);

  const sellerIdStr = (order.sellerId as any)._id?.toString() || order.sellerId.toString();
  if (role !== "ADMIN" && sellerIdStr !== userId)
    throw new AppError("Only the seller or admin can update fulfillment", 403, ERROR_CODES.FORBIDDEN);

  if (order.paymentStatus !== "PAID")
    throw new AppError("Cannot update fulfillment until payment is confirmed", 400, ERROR_CODES.BAD_REQUEST);

  if (data.trackingNumber !== undefined) order.trackingNumber = data.trackingNumber;
  if (data.trackingCarrier !== undefined) order.trackingCarrier = data.trackingCarrier;
  if (data.status === "SHIPPED" && order.status === "PROCESSING") {
    order.status = "SHIPPED";
  }

  await order.save();

  const buyerIdStr = (order.buyerId as any)._id?.toString() || order.buyerId.toString();
  createNotification({
    userId: buyerIdStr,
    type: "ORDER_UPDATE",
    title: "Order Shipped",
    message: `Your item for Order #${order.orderNumber} has been shipped.${data.trackingNumber ? ` Tracking: ${data.trackingNumber}` : ""}`,
    data: { orderId: order._id.toString(), trackingNumber: data.trackingNumber }
  }).catch(err => logger.error("Failed to notify buyer of fulfillment update", { error: err instanceof Error ? err.message : String(err) }));

  try {
    const io = getIO();
    io.to(`user:${buyerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: order.status, trackingNumber: order.trackingNumber });
    io.to(`user:${sellerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: order.status });
  } catch {}

  logger.info("Fulfillment updated", { orderId, userId, tracking: data.trackingNumber });
  return order;
};

export const claimItem = async (orderId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new AppError("Invalid order ID", 400, ERROR_CODES.INVALID_OBJECT_ID);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError("Order not found", 404, ERROR_CODES.NOT_FOUND);

    const buyerIdStr = (order.buyerId as any)._id?.toString() || order.buyerId.toString();
    if (buyerIdStr !== userId)
      throw new AppError("Only the winning buyer can claim this item", 403, ERROR_CODES.FORBIDDEN);

    if (order.paymentStatus !== "PAID")
      throw new AppError("Payment must be completed before claiming", 400, ERROR_CODES.BAD_REQUEST);

    const claimableStatuses = ["PROCESSING", "SHIPPED", "DELIVERED"];
    if (!claimableStatuses.includes(order.status))
      throw new AppError(`Cannot claim item with order status: ${order.status}`, 400, ERROR_CODES.BAD_REQUEST);

    if (order.claimedAt)
      throw new AppError("Item has already been claimed", 409, ERROR_CODES.CONFLICT);

    order.claimedAt = new Date();
    order.status = "COMPLETED";
    await order.save({ session });

    // Release escrow funds to seller if not yet released
    const sellerIdStr = (order.sellerId as any)._id?.toString() || order.sellerId.toString();
    if (order.paymentStatus === "PAID" && order.sellerId) {
      const existingRelease = await WalletTransaction.findOne({
        referenceId: order._id.toString(),
        type: "RELEASE",
      }).session(session);

      if (!existingRelease) {
        const sellerWallet = await Wallet.findOne({ userId: order.sellerId }).session(session);
        if (sellerWallet) {
          const amountNum = Number(order.finalAmount);
          const currentBal = parseFloat(sellerWallet.balance.toString());
          const currentHeld = parseFloat(sellerWallet.heldBalance.toString());
          const newBal = currentBal + amountNum;
          const newHeld = Math.max(0, currentHeld - amountNum);

          // escrow release: move from held to spendable balance
          sellerWallet.balance = mongoose.Types.Decimal128.fromString(newBal.toFixed(2));
          sellerWallet.heldBalance = mongoose.Types.Decimal128.fromString(newHeld.toFixed(2));
          sellerWallet.version += 1;
          await sellerWallet.save({ session });

          await WalletTransaction.create([{
            walletId: sellerWallet._id,
            userId: order.sellerId,
            type: "RELEASE",
            amount: mongoose.Types.Decimal128.fromString(amountNum.toFixed(2)),
            balanceBefore: mongoose.Types.Decimal128.fromString(currentBal.toFixed(2)),
            balanceAfter: mongoose.Types.Decimal128.fromString(newBal.toFixed(2)),
            status: "COMPLETED",
            referenceId: order._id.toString(),
            description: `Escrow funds released upon buyer claim for Order #${order.orderNumber}`,
          }], { session });
        }
      }
    }

    await Auction.findByIdAndUpdate(
      order.auctionId,
      { status: "FULFILLED" },
      { session }
    );

    await session.commitTransaction();

    createNotification({
      userId: sellerIdStr,
      type: "ORDER_UPDATE",
      title: "Item Claimed & Funds Released",
      message: `The buyer confirmed receipt for Order #${order.orderNumber}. Escrow funds of ₹${order.finalAmount} have been released to your wallet.`,
      data: { orderId: order._id.toString() },
    }).catch(() => {});

    createNotification({
      userId: buyerIdStr,
      type: "ORDER_UPDATE",
      title: "Item Claimed Successfully",
      message: `You have confirmed receipt and completed Order #${order.orderNumber}. Thank you for participating!`,
      data: { orderId: order._id.toString() },
    }).catch(() => {});

    try {
      const io = getIO();
      io.to(`user:${buyerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: "COMPLETED" });
      io.to(`user:${sellerIdStr}`).emit("order:updated", { orderId: order._id.toString(), status: "COMPLETED" });
    } catch {}

    logger.info("Item claimed and escrow released", { orderId, userId });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};