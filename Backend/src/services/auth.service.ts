import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import crypto from "crypto";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import {
  generateAccessToken,
} from "../utils/jwt.js";

import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { UserRole } from "../models/User.js";
import { logger } from "../logger/logger.js";
import config from "../config/env.js";
import * as otpService from "./otp.service.js";
import * as emailService from "./email.service.js";

const createRefreshToken = async (userId: string, ipAddress: string) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshToken = await RefreshToken.create({
    user: userId,
    token,
    expiresAt,
    createdByIp: ipAddress,
  });

  return refreshToken.token;
};

export const register = async (
  username: string,
  email: string,
  password: string,
  ipAddress: string,
  role: UserRole = "BUYER"
) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new AppError(
      "User with this email or username already exists",
      409,
      ERROR_CODES.USER_EXISTS
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role,
    loginAttempts: 0,
  });

  logger.info("New user registered", { userId: user._id.toString(), role });

  otpService.sendOtp(user.email, "EMAIL_VERIFICATION", user.username).catch((err) => {
    logger.warn("Failed to dispatch initial verification OTP", { error: err.message, email: user.email });
  });

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = await createRefreshToken(user._id.toString(), ipAddress);

  return { user, accessToken, refreshToken };
};

export const login = async (email: string, password: string, ipAddress: string) => {
  const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");

  if (!user) {
    throw new AppError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(
      `Account locked due to too many failed attempts. Try again later.`,
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= config.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + config.LOGIN_LOCKOUT_MINUTES);
      user.lockUntil = lockUntil;
      logger.warn("User account locked", { userId: user._id.toString() });
    }
    await user.save();
    throw new AppError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (user.isDeleted) {
    throw new AppError("This account has been deleted", 403, ERROR_CODES.ACCOUNT_DELETED);
  }

  if (!user.isActive) {
    throw new AppError("This account is inactive", 403, ERROR_CODES.ACCOUNT_INACTIVE);
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  logger.info("User logged in", { userId: user._id.toString() });

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = await createRefreshToken(user._id.toString(), ipAddress);

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string, ipAddress: string) => {
  const refreshToken = await RefreshToken.findOne({ token }).populate("user");

  if (!refreshToken || !refreshToken.user) {
    throw new AppError("Invalid refresh token", 401, ERROR_CODES.INVALID_REFRESH_TOKEN);
  }

  const user = refreshToken.user as any;

  // token reuse: revoke all tokens if compromised
  if (!refreshToken.isActive) {
    logger.warn("Token reuse detected, revoking all user tokens", { userId: user._id.toString() });
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
    throw new AppError("Invalid refresh token", 401, ERROR_CODES.INVALID_REFRESH_TOKEN);
  }

  refreshToken.revokedAt = new Date();
  const newRefreshTokenString = crypto.randomBytes(40).toString("hex");
  refreshToken.replacedByToken = newRefreshTokenString;
  await refreshToken.save();

  if (user.isDeleted || !user.isActive) {
    throw new AppError("Account is deleted or inactive", 403, ERROR_CODES.ACCOUNT_INACTIVE);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const newRefreshToken = await RefreshToken.create({
    user: user._id,
    token: newRefreshTokenString,
    expiresAt,
    createdByIp: ipAddress,
  });

  const accessToken = generateAccessToken(user._id.toString(), user.role);

  return { accessToken, refreshToken: newRefreshToken.token };
};

export const logout = async (token: string) => {
  if (token) {
    await RefreshToken.findOneAndUpdate({ token }, { revokedAt: new Date() });
  }
};

export const sendVerificationOtp = async (identifier: string) => {
  let user;
  if (identifier.includes("@")) {
    user = await User.findOne({ email: identifier.toLowerCase().trim() });
  } else {
    user = await User.findById(identifier);
  }

  if (!user) {
    throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400, ERROR_CODES.BAD_REQUEST);
  }

  return await otpService.sendOtp(user.email, "EMAIL_VERIFICATION", user.username);
};

export const verifyEmail = async (email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.isVerified) {
    return user;
  }

  await otpService.verifyOtp(normalizedEmail, otp, "EMAIL_VERIFICATION");

  user.isVerified = true;
  await user.save();

  logger.info("User email successfully verified", { userId: user._id.toString(), email: user.email });
  return user;
};

export const forgotPassword = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Return generic success to prevent email enumeration attacks
    return {
      success: true,
      message: `If an account with ${normalizedEmail} exists, a reset code has been sent.`,
    };
  }

  if (user.isDeleted || !user.isActive) {
    throw new AppError("Account is inactive or deleted", 403, ERROR_CODES.ACCOUNT_INACTIVE);
  }

  return await otpService.sendOtp(user.email, "PASSWORD_RESET", user.username);
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.isDeleted || !user.isActive) {
    throw new AppError("Account is inactive or deleted", 403, ERROR_CODES.ACCOUNT_INACTIVE);
  }

  await otpService.verifyOtp(normalizedEmail, otp, "PASSWORD_RESET");

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });

  logger.info("User password successfully reset via OTP", { userId: user._id.toString() });

  emailService.sendPasswordResetSuccessEmail(user.email, user.username).catch((err) => {
    logger.warn("Failed to send password reset confirmation email", { error: err.message });
  });

  return {
    success: true,
    message: "Password reset successfully. You can now login with your new password.",
  };
};