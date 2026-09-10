import mongoose from "mongoose";
import config from "./env.js";

export const connectDB = async () => {
  try {
    console.log("config.MONGO_URI:", config.MONGO_URI);

    await mongoose.connect(config.MONGO_URI);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};