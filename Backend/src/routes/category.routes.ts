import { Router } from "express";
import { getCategories, createCategory } from "../controllers/category.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { createCategorySchema } from "../validators/category.validator.js";

const router = Router();

router.get("/", getCategories);
router.post("/", authenticate, requireRole("ADMIN"), validate(createCategorySchema), createCategory);

export default router;