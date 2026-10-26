import crypto from "crypto";
import { Otp, OtpPurpose } from "../models/Otp.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import * as emailService from "./email.service.js";
import { logger } from "../logger/logger.js";

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

export const hashOtp = (otp: string): string => {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
};

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const sendOtp = async (
  email: string,
  purpose: OtpPurpose,
  username?: string
): Promise<{ success: boolean; message: string; cooldownSeconds: number }> => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose });
  if (existingOtp) {
    const timeSinceLastOtp = (Date.now() - existingOtp.updatedAt.getTime()) / 1000;
    if (timeSinceLastOtp < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastOtp);
      throw new AppError(
        `Please wait ${waitTime} seconds before requesting another code`,
        429,
        ERROR_CODES.OTP_RATE_LIMIT
      );
    }
  }

  const plainOtp = generateOtp();
  const otpHash = hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      email: normalizedEmail,
      purpose,
      otpHash,
      attempts: 0,
      expiresAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let emailSent = false;
  if (purpose === "EMAIL_VERIFICATION") {
    emailSent = await emailService.sendVerificationEmail(normalizedEmail, plainOtp, username);
  } else if (purpose === "PASSWORD_RESET") {
    emailSent = await emailService.sendPasswordResetEmail(normalizedEmail, plainOtp, username);
  }

  logger.info(`OTP generated and sent for purpose: ${purpose}`, {
    email: normalizedEmail,
    emailSent,
  });

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
};

export const verifyOtp = async (
  email: string,
  plainOtp: string,
  purpose: OtpPurpose
): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose });

  if (!otpRecord) {
    throw new AppError(
      "No active verification code found or it has expired. Please request a new code.",
      400,
      ERROR_CODES.OTP_EXPIRED
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    await otpRecord.deleteOne();
    throw new AppError(
      "Verification code has expired. Please request a new code.",
      400,
      ERROR_CODES.OTP_EXPIRED
    );
  }

  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    await otpRecord.deleteOne();
    throw new AppError(
      "Too many incorrect attempts. Please request a new code.",
      400,
      ERROR_CODES.INVALID_OTP
    );
  }

  const hash = hashOtp(plainOtp);
  if (hash !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = MAX_VERIFY_ATTEMPTS - otpRecord.attempts;
    throw new AppError(
      `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      400,
      ERROR_CODES.INVALID_OTP
    );
  }

  await otpRecord.deleteOne();
  return true;
};
