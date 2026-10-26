import { UploadApiResponse } from "cloudinary";
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { AppError } from "../errors/AppError.js";
import { logger } from "../logger/logger.js";

export { isCloudinaryConfigured };

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadImageBuffer = (
  buffer: Buffer,
  folder = "live_auction/auctions"
): Promise<UploadResult> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          logger.error("Cloudinary upload failed", { error: error?.message });
          return reject(
            new AppError(
              error?.message || "Failed to upload image to Cloudinary",
              500,
              "UPLOAD_FAILED"
            )
          );
        }
        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
  if (!isCloudinaryConfigured()) return false;
  configureCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    logger.warn("Failed to delete image from Cloudinary", { publicId, error });
    return false;
  }
};
