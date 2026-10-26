import { Router } from "express";
import { getOrders, getOrderById, updateOrderStatus, updateFulfillment, claimItem } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getOrders);
router.get("/:orderId", authenticate, getOrderById);
router.patch("/:orderId/status", authenticate, updateOrderStatus);
router.patch("/:orderId/fulfillment", authenticate, updateFulfillment);
router.post("/:orderId/claim", authenticate, claimItem);

export default router;