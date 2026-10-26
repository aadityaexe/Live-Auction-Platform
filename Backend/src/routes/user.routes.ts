import { Router } from "express";
import { getMe, updateMe, getAllUsers, suspendUser, activateUser, getMyActiveBids, getMyWonAuctions } from "../controllers/user.controller.js";
import { getWatchlist } from "../controllers/watchlist.controller.js";
import { handleDeposit, handleWithdraw } from "../controllers/wallet.controller.js";
import { authenticate, authenticateStrict, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateUserSchema } from "../validators/user.validator.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, validate(updateUserSchema), updateMe);
router.get("/me/watchlist", authenticate, getWatchlist);
router.get("/me/bids", authenticate, requireRole("BUYER"), getMyActiveBids);
router.get("/me/active-bids", authenticate, requireRole("BUYER"), getMyActiveBids);
router.get("/me/won-auctions", authenticate, requireRole("BUYER", "ADMIN"), getMyWonAuctions);

router.post("/me/wallet/deposit", authenticate, handleDeposit);
router.post("/me/wallet/withdraw", authenticate, handleWithdraw);

router.get("/", authenticate, requireRole("ADMIN"), getAllUsers);
router.patch("/:userId/suspend", authenticateStrict, requireRole("ADMIN"), suspendUser);
router.patch("/:userId/activate", authenticateStrict, requireRole("ADMIN"), activateUser);

export default router;