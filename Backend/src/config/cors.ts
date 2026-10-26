import { CorsOptions } from "cors";
import config from "./env.js";

const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  if (config.CLIENT_URL) {
    origins.add(config.CLIENT_URL.trim().replace(/\/+$/, ""));
  }
  if (config.CORS_ORIGINS) {
    config.CORS_ORIGINS.split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }
  return Array.from(origins);
};

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/+$/, "");

  const allowed = getAllowedOrigins();
  if (allowed.includes(normalized)) {
    return true;
  }

  // Allow Render deployed domains
  if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(normalized)) {
    return true;
  }

  // Allow localhost in development
  if (config.NODE_ENV === "development" && /^https?:\/\/localhost(:\d+)?$/.test(normalized)) {
    return true;
  }

  return false;
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "idempotency-key"],
  maxAge: 86400,
};

export default corsOptions;