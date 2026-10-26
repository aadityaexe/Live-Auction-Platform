import mongoose from "mongoose";
import Notification, { NotificationType } from "../models/Notification.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { getIO } from "../sockets/socket.js";
import { logger } from "../logger/logger.js";

export const getUserNotifications = async (userId: string, page = 1, limit = 20, unreadOnly = false) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (unreadOnly) filter.isRead = false;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false }),
  ]);
  return { notifications, unreadCount, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId))
    throw new AppError("Invalid notification ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: new mongoose.Types.ObjectId(userId) },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new AppError("Notification not found", 404, ERROR_CODES.NOT_FOUND);
  return notification;
};

export const markAllRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount };
};

export const createNotification = async (params: {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) => {
  const notification = await Notification.create({
    userId: typeof params.userId === "string" ? new mongoose.Types.ObjectId(params.userId) : params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data,
  });
  try {
    const io = getIO();
    io.to(`user:${String(params.userId)}`).emit("notification:new", {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    logger.error("Socket emit for notification failed", { error: err instanceof Error ? err.message : String(err) });
  }
  return notification;
};