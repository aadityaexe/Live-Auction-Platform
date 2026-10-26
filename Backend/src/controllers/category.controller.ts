import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Category from "../models/Category.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError("Category already exists", 409, ERROR_CODES.CONFLICT);
  const category = await Category.create({ name, slug, description });
  res.status(201).json({ success: true, data: category });
});