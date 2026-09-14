import { Router } from "express";
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/auth.controller.js";

const router = Router();

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Refresh access token
router.post("/refresh", refreshToken);

// Logout user
router.post("/logout", logoutUser);

export default router;