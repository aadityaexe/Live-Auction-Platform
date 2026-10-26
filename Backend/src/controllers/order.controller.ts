import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import * as orderService from "../services/order.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await orderService.getUserOrders(
    req.user!.id,
    req.user!.role as "BUYER" | "SELLER" | "ADMIN",
    page ? Number(page) : 1,
    limit ? Number(limit) : 20
  );
  res.status(200).json({ success: true, ...result });
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = String(req.params.orderId);
  const order = await orderService.getOrderById(orderId, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = String(req.params.orderId);
  const { status } = req.body;
  if (!status || (status !== "SHIPPED" && status !== "DELIVERED")) {
    throw new AppError("Status must be either SHIPPED or DELIVERED", 400, ERROR_CODES.BAD_REQUEST);
  }
  const order = await orderService.updateOrderStatus(orderId, req.user!.id, req.user!.role, status);
  res.status(200).json({ success: true, data: order });
});

export const updateFulfillment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = String(req.params.orderId);
  const { trackingNumber, trackingCarrier, status } = req.body;
  const order = await orderService.updateFulfillment(
    orderId,
    req.user!.id,
    req.user!.role,
    { trackingNumber, trackingCarrier, status }
  );
  res.status(200).json({ success: true, data: order });
});

export const claimItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = String(req.params.orderId);
  const order = await orderService.claimItem(orderId, req.user!.id);
  res.status(200).json({ success: true, data: order });
});