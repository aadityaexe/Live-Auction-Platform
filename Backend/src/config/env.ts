import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optionalEnv = (name: string, fallback: string): string =>
  process.env[name] || fallback;

const optionalInt = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) throw new Error(`${name} must be a number, got "${raw}"`);
  return parsed;
};

const optionalBool = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === "true" || raw === "1";
};

const config = {
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: optionalInt("PORT", 5000),

  MONGO_URI: requiredEnv("MONGO_URI"),
  MONGO_POOL_SIZE: optionalInt("MONGO_POOL_SIZE", 10),

  SALT_ROUNDS: optionalInt("SALT_ROUNDS", 12),
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || requiredEnv("JWT_SECRET"),
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || requiredEnv("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: optionalEnv("JWT_ACCESS_EXPIRY", "15m"),
  JWT_REFRESH_EXPIRY: optionalEnv("JWT_REFRESH_EXPIRY", "7d"),
  MAX_LOGIN_ATTEMPTS: optionalInt("MAX_LOGIN_ATTEMPTS", 5),
  LOGIN_LOCKOUT_MINUTES: optionalInt("LOGIN_LOCKOUT_MINUTES", 15),

  CLIENT_URL: optionalEnv("CLIENT_URL", "http://localhost:5173"),
  CORS_ORIGINS: optionalEnv("CORS_ORIGINS", ""),

  LOG_LEVEL: optionalEnv("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",

  RATE_LIMIT_WINDOW_MS: optionalInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: optionalInt("RATE_LIMIT_MAX", 3000),
  AUTH_RATE_LIMIT_MAX: optionalInt("AUTH_RATE_LIMIT_MAX", 50),
  BID_RATE_LIMIT_MAX: optionalInt("BID_RATE_LIMIT_MAX", 200),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: optionalInt("SMTP_PORT", 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: optionalEnv("SMTP_FROM", "noreply@auction.local"),

  ENABLE_SOFT_CLOSE: optionalBool("ENABLE_SOFT_CLOSE", false),
  ENABLE_EMAIL: optionalBool("ENABLE_EMAIL", false),
  ENABLE_METRICS: optionalBool("ENABLE_METRICS", false),

  SENTRY_DSN: process.env.SENTRY_DSN || "",
  METRICS_TOKEN: process.env.METRICS_TOKEN || "",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
} as const;

if (config.NODE_ENV === "production") {
  if (config.JWT_ACCESS_TOKEN_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (config.JWT_REFRESH_TOKEN_SECRET.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters in production");
  }
}

export default config;