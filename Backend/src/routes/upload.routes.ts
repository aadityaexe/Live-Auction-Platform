import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { uploadImages, uploadSingleImage, deleteImageHandler } from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/images",
  authenticate,
  requireRole("SELLER", "ADMIN"),
  upload.array("images", 10),
  uploadImages
);

router.post(
  "/image",
  authenticate,
  requireRole("SELLER", "ADMIN"),
  upload.single("image"),
  uploadSingleImage
);

router.delete(
  "/image",
  authenticate,
  requireRole("SELLER", "ADMIN"),
  deleteImageHandler
);

export default router;
