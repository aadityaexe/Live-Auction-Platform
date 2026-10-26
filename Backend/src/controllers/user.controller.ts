import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyWonAuctions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await userService.getWonAuctions(req.user!.id, page, limit);
  res.status(200).json({ success: true, ...result });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getMe(req.user!.id);
  res.status(200).json({ success: true, data: user });
});

export const getMyActiveBids = asyncHandler(async (req: AuthRequest, res: Response) => {
  const activeBids = await userService.getMyActiveBids(req.user!.id);
  res.status(200).json({ success: true, activeBids });
});

export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, bio, profilePicture } = req.body;
  const user = await userService.updateMe(req.user!.id, { username, bio, profilePicture });
  res.status(200).json({ success: true, message: "Profile updated", data: user });
});

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, role, search } = req.query;
  const result = await userService.getAllUsers(
    page ? Number(page) : 1,
    limit ? Number(limit) : 20,
    role ? String(role) : undefined,
    search ? String(search) : undefined
  );
  res.status(200).json({ success: true, ...result });
});

export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.params.userId);
  const user = await userService.setUserActiveStatus(userId, false);
  res.status(200).json({ success: true, message: "User suspended", data: user });
});

export const activateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.params.userId);
  const user = await userService.setUserActiveStatus(userId, true);
  res.status(200).json({ success: true, message: "User activated", data: user });
});