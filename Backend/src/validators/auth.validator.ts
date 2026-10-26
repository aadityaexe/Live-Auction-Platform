import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters"),

  role: z
    .enum(["BUYER", "SELLER"])
    .optional()
    .default("BUYER"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const sendVerificationOtpSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters"),
});

