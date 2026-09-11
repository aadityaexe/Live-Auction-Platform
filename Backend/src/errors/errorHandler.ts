// src/errors/errorHandler.ts

import {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "./AppError.js";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl}`,
    error
  );

  // Our custom AppError


  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }


  // --------------------------------
  // JWT errors
  // --------------------------------

  if (
    error instanceof Error &&
    error.name === "JsonWebTokenError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }


  if (
    error instanceof Error &&
    error.name === "TokenExpiredError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }


  // --------------------------------
  // MongoDB duplicate key error
  // --------------------------------

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    return res.status(409).json({
      success: false,
      message: "Duplicate value already exists",
      code: "DUPLICATE_VALUE",
    });
  }


  // --------------------------------
  // Mongoose validation error
  // --------------------------------

  if (
    error instanceof Error &&
    error.name === "ValidationError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  }


  // --------------------------------
  // Unknown error
  // --------------------------------

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};