import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { generateRefreshToken } from "../utils/jwt.js";
const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post(
  "/refresh",
  generateRefreshToken
);
export default router;