import rateLimit from "express-rate-limit";
import config from "../config/env.js";

export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  }
});

export const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  }
});

export const bidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.BID_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Bidding too fast. Please slow down.",
    code: "RATE_LIMIT_EXCEEDED"
  }
});
