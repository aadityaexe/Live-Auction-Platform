import { CorsOptions } from "cors";
import config from "./env.js";

const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  if (config.CLIENT_URL) origins.add(config.CLIENT_URL);
  if (config.CORS_ORIGINS) {
    config.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }
  return Array.from(origins);
};

const allowedOrigins = getAllowedOrigins();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, health checks, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, also allow localhost variants
    if (config.NODE_ENV === "development" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24h preflight cache
};

export default corsOptions;