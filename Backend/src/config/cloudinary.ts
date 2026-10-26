import { v2 as cloudinary } from "cloudinary";
import config from "./env.js";
import { AppError } from "../errors/AppError.js";

let configured = false;

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    config.CLOUDINARY_CLOUD_NAME &&
    config.CLOUDINARY_API_KEY &&
    config.CLOUDINARY_API_SECRET
  );
};

export const configureCloudinary = () => {
  if (configured) return cloudinary;

  if (!isCloudinaryConfigured()) {
    throw new AppError(
      "Cloudinary is not configured. Please specify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
      400,
      "CLOUDINARY_NOT_CONFIGURED"
    );
  }

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
  return cloudinary;
};

if (isCloudinaryConfigured()) {
  configureCloudinary();
}

export { cloudinary };
export default cloudinary;
