import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { AppError } from "../errors/AppError.js";
import { uploadImageBuffer, deleteImage } from "../services/cloudinary.service.js";

export const uploadImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    throw new AppError("No image files provided for upload", 400, "NO_FILES_PROVIDED");
  }

  const uploadPromises = files.map((file) => uploadImageBuffer(file.buffer));
  const results = await Promise.all(uploadPromises);

  const urls = results.map((r) => r.url);

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    data: {
      urls,
      count: urls.length,
    },
  });
});

export const uploadSingleImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    throw new AppError("No image file provided for upload", 400, "NO_FILE_PROVIDED");
  }

  const result = await uploadImageBuffer(file.buffer);

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

export const deleteImageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicId } = req.body;
  if (!publicId) {
    throw new AppError("publicId is required to delete an image", 400, "BAD_REQUEST");
  }

  const deleted = await deleteImage(publicId);

  res.status(200).json({
    success: true,
    message: deleted ? "Image deleted successfully" : "Image could not be deleted or not found",
    data: { deleted },
  });
});
