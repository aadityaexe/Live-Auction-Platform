import { Router } from "express";
import {
  initiatePayment,
  verifyPayment,
  getPaymentByOrderId,
  handleRazorpayWebhook,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/webhooks/razorpay", handleRazorpayWebhook);

router.use(authenticate);
router.post("/orders", initiatePayment);
router.post("/verify", verifyPayment);
router.get("/order/:orderId", getPaymentByOrderId);

export default router;
