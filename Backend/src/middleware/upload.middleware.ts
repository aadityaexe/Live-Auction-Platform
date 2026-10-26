import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../errors/AppError.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
  },
  fileFilter,
});
