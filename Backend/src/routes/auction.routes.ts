import { Router } from "express";

import {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
} from "../controllers/auction.controller.js";

import { validate } from "../middleware/validation.middleware.js";

import {
  createAuctionSchema,
  updateAuctionSchema,
} from "../validators/auction.validator.js";

import { createBidSchema } from "../validators/bid.validator.js";
import { createBid, getBidHistory } from "../controllers/bid.controller.js";
import { addToWatchlist, removeFromWatchlist, checkWatchlist } from "../controllers/watchlist.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

import { bidLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.get("/", getAuctions);
router.get("/:auctionId", getAuctionById);
router.get("/:auctionId/bids", getBidHistory);

router.post("/", authenticate, requireRole("SELLER", "ADMIN"), validate(createAuctionSchema), createAuction);
router.patch("/:auctionId", authenticate, requireRole("SELLER", "ADMIN"), validate(updateAuctionSchema), updateAuction);
router.delete("/:auctionId", authenticate, requireRole("SELLER", "ADMIN"), deleteAuction);

router.post("/:auctionId/bids", bidLimiter, authenticate, requireRole("BUYER", "ADMIN"), validate(createBidSchema), createBid);

router.post("/:auctionId/watchlist", authenticate, addToWatchlist);
router.delete("/:auctionId/watchlist", authenticate, removeFromWatchlist);
router.get("/:auctionId/watchlist", authenticate, checkWatchlist);

export default router;