import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || "Validation Error";
        next(new AppError(message, 400, "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };