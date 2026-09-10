import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";

import { AppError } from "./src/errors/AppError.js";
import { errorHandler } from "./src/errors/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);

// Handle unknown routes
app.use((req, res, next) => {
  next(
    new AppError(
      `Route ${req.originalUrl} not found`,
      404,
      "NOT_FOUND"
    )
  );
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});