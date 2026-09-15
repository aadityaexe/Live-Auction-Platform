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
import { createBid } from "../controllers/bid.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createAuctionSchema),
  createAuction
);

router.get(
  "/",
  getAuctions
);

router.get(
  "/:auctionId",
  getAuctionById
);

router.patch(
  "/:auctionId",
  authenticate,
  validate(updateAuctionSchema),
  updateAuction
);

router.delete(
  "/:auctionId",
  authenticate,
  deleteAuction
);

// Bid routes
router.post(
  "/:auctionId/bids",
  authenticate,
  validate(createBidSchema),
  createBid
);

export default router;