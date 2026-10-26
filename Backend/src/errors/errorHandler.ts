import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError.js";
import { logger } from "../logger/logger.js";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`${req.method} ${req.originalUrl}`, {
    error:
      error instanceof Error
        ? { message: error.message, name: error.name }
        : String(error),
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof Error && error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (error instanceof Error && error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired. Please login again.",
      code: "TOKEN_EXPIRED",
    });
  }

  if (
    error instanceof Error &&
    error.name === "CastError" &&
    (error as any).kind === "ObjectId"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      code: "INVALID_OBJECT_ID",
    });
  }

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

  if (error instanceof Error && error.name === "ValidationError") {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  }

  const isDev = process.env.NODE_ENV === "development";

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    ...(isDev && error instanceof Error
      ? { detail: error.message, stack: error.stack }
      : {}),
  });
};