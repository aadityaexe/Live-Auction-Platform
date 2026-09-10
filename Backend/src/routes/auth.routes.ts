import { Router } from "express";
import { registerUser, loginUser, getUserById, allUsers } from "../controllers/auth.controller.js";
const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/user/:id", getUserById);

router.get("/users", allUsers);

export default router;