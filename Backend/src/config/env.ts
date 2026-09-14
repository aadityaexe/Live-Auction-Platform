import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined in .env`);
  }

  return value;
};

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT) || 3000,

  MONGO_URI: requiredEnv("MONGO_URI"),

  SALT_ROUNDS: Number(process.env.SALT_ROUNDS || 10),

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  JWT_ACCESS_TOKEN_SECRET:
    process.env.JWT_ACCESS_TOKEN_SECRET || requiredEnv("JWT_SECRET"),

  JWT_REFRESH_TOKEN_SECRET:
    process.env.JWT_REFRESH_TOKEN_SECRET || requiredEnv("JWT_REFRESH_SECRET"),

  JWT_ACCESS_EXPIRY:
    process.env.JWT_ACCESS_EXPIRY || "15m",

  JWT_REFRESH_EXPIRY:
    process.env.JWT_REFRESH_EXPIRY || "7d",

  CLIENT_URL:
    process.env.CLIENT_URL || "http://localhost:5173",

  LOG_LEVEL:
    process.env.LOG_LEVEL || "info",
};

export default config;