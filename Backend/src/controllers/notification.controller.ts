import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import * as notificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, unread } = req.query;
  const result = await notificationService.getUserNotifications(
    req.user!.id,
    page ? Number(page) : 1,
    limit ? Number(limit) : 20,
    unread === "true"
  );
  res.status(200).json({ success: true, ...result });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notificationId = String(req.params.notificationId);
  const notification = await notificationService.markNotificationRead(notificationId, req.user!.id);
  res.status(200).json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationService.markAllRead(req.user!.id);
  res.status(200).json({ success: true, ...result });
});