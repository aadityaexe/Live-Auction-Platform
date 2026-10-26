import { Response, Request } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { createBidService } from "../services/bid.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Bid from "../models/Bid.js";
import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export const createBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { auctionId } = req.params;
  const { amount, requestId } = req.body;
  const bidderId = req.user!.id;
  const bid = await createBidService(auctionId as string, bidderId, amount, requestId as string);
  res.status(201).json({ success: true, message: "Bid placed successfully", data: bid });
});

export const getBidHistory = asyncHandler(async (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 50);

  if (!mongoose.Types.ObjectId.isValid(auctionId as string))
    throw new AppError("Invalid auction ID", 400, ERROR_CODES.INVALID_OBJECT_ID);

  const skip = (Math.max(1, page) - 1) * limit;
  const [bids, total] = await Promise.all([
    Bid.find({ auctionId: new mongoose.Types.ObjectId(auctionId as string), status: "ACCEPTED" })
      .sort({ sequenceNumber: -1 })
      .skip(skip)
      .limit(limit)
      .populate("bidderId", "username")
      .lean(),
    Bid.countDocuments({ auctionId: new mongoose.Types.ObjectId(auctionId as string), status: "ACCEPTED" }),
  ]);
  res.status(200).json({ success: true, data: bids, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});