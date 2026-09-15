import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        // Return first error message
        const zodError = error as any;
        const message = zodError.errors?.[0]?.message || zodError.issues?.[0]?.message || "Validation Error";
        next(new AppError(message, 400, "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };