import { Request, Response } from "express";

import * as authService from "../services/auth.service.js";

import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookies.js";

import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const registerUser = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { username, email, password, role } = req.body;
  const ipAddress = req.ip || "unknown";

  const result = await authService.register(username, email, password, ipAddress, role);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: result.user._id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      isVerified: result.user.isVerified,
    },
    accessToken: result.accessToken,
  });
});

export const loginUser = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || "unknown";

  const result = await authService.login(email, password, ipAddress);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: result.user._id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      lastLogin: result.user.lastLogin,
      isVerified: result.user.isVerified,
      isActive: result.user.isActive,
    },
    accessToken: result.accessToken,
  });
});

export const refreshToken = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const token = req.cookies?.refreshToken;
  const ipAddress = req.ip || "unknown";

  if (!token) {
    throw new AppError(
      "Refresh token is required",
      401,
      ERROR_CODES.REFRESH_TOKEN_REQUIRED
    );
  }

  const result = await authService.refreshAccessToken(token, ipAddress);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(200).json({
    success: true,
    accessToken: result.accessToken,
  });
});

export const logoutUser = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await authService.logout(token);
  }

  clearRefreshTokenCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const sendVerificationOtp = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const email = req.body?.email || (req as any).user?.email;
  const userId = (req as any).user?.id;

  const targetIdentifier = email || userId;
  if (!targetIdentifier) {
    throw new AppError("Email is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const result = await authService.sendVerificationOtp(targetIdentifier);

  return res.status(200).json({
    success: true,
    message: result.message,
    cooldownSeconds: result.cooldownSeconds,
  });
});

export const verifyEmail = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and 6-digit OTP code are required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const user = await authService.verifyEmail(email, otp);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

export const forgotPassword = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const result = await authService.forgotPassword(email);

  return res.status(200).json({
    success: true,
    message: result.message,
    cooldownSeconds: (result as any).cooldownSeconds || 60,
  });
});

export const resetPassword = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new AppError("Email, verification code, and new password are required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const result = await authService.resetPassword(email, otp, newPassword);

  clearRefreshTokenCookie(res);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});