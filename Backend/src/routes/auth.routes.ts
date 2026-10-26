import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  sendVerificationOtp,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  sendVerificationOtpSchema,
  verifyEmailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", logoutUser);

router.post("/send-verification-otp", authLimiter, validate(sendVerificationOtpSchema), sendVerificationOtp);
router.post("/verify-email-otp", authLimiter, validate(verifyEmailOtpSchema), verifyEmail);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;