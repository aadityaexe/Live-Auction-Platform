import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { 
  getStats, 
  getUsers, 
  updateUserDetails, 
  updateUserStatus, 
  getAuctions, 
  deleteAuction, 
  getAllOrders, 
  adjustWallet, 
  updateAuctionStatus 
} from "../controllers/admin.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", asyncHandler(getStats));
router.get("/users", asyncHandler(getUsers));
router.patch("/users/:id", asyncHandler(updateUserDetails));
router.patch("/users/:id/status", asyncHandler(updateUserStatus));
router.patch("/users/:id/wallet", asyncHandler(adjustWallet));
router.get("/auctions", asyncHandler(getAuctions));
router.patch("/auctions/:id/status", asyncHandler(updateAuctionStatus));
router.delete("/auctions/:id", asyncHandler(deleteAuction));
router.get("/orders", asyncHandler(getAllOrders));

export default router;
