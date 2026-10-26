import mongoose from "mongoose";
import config from "./env.js";
import { logger } from "../logger/logger.js";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("Failed to connect to MongoDB", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};