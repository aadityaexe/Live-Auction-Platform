import { Router } from "express";
import { getUserWallet, getUserTransactions, handleDeposit, handleWithdraw, handleInitiateDeposit, handleVerifyDeposit } from "../controllers/wallet.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getUserWallet);
router.get("/transactions", getUserTransactions);
router.post("/deposit", handleDeposit);
router.post("/deposit/initiate", handleInitiateDeposit);
router.post("/deposit/verify", handleVerifyDeposit);
router.post("/withdraw", handleWithdraw);

export default router;
