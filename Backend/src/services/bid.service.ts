import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import { AppError } from "../errors/AppError.js";

export const createBidService = async (
  auctionId: string,
  bidderId: string,
  amount: number,
  requestId: string
) => {
  // Idempotency check 1: check if bid already exists
  const existingBid = await Bid.findOne({ auctionId, bidderId, requestId });
  if (existingBid) {
    return existingBid;
  }

  // 1. Fetch current auction state
  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new AppError("Auction not found", 404, "NOT_FOUND");
  }

  // 2. Validate auction state
  if (auction.status !== "LIVE" && auction.status !== "ENDING") {
    throw new AppError("Auction is not active", 400, "BAD_REQUEST");
  }

  if (new Date() >= auction.endTime) {
    throw new AppError("Auction has ended", 400, "BAD_REQUEST");
  }

  // 3. Prevent seller from bidding on their own auction
  if (auction.sellerId.toString() === bidderId) {
    throw new AppError("Seller cannot bid on their own auction", 403, "FORBIDDEN");
  }

  // 4. Validate bid amount
  const minimumRequiredBid = auction.currentPrice + auction.minimumIncrement;
  if (amount < minimumRequiredBid) {
    throw new AppError(
      `Bid amount must be at least ${minimumRequiredBid}`,
      400,
      "BAD_REQUEST"

    );
  }

  // 5. Atomic Update to prevent Race Conditions
  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      status: { $in: ["LIVE", "ENDING"] },
      currentPrice: auction.currentPrice, // The exact price we validated against
      endTime: { $gt: new Date() },
    },
    {
      $set: {
        currentPrice: amount,
        highestBidderId: new mongoose.Types.ObjectId(bidderId),
      },
      $inc: {
        bidCount: 1,
        version: 1,
      },
    },
    { new: true }
  );

  // If update failed, another bid came in first or auction ended
  if (!updatedAuction) {
    throw new AppError(
      "Someone placed a higher bid or auction ended. Please refresh and try again.",
      409, // Conflict
      "CONFLICT"
    );
  }

  try {
    // 6. Create Bid History Record
    const bid = new Bid({
      auctionId: updatedAuction._id,
      bidderId: new mongoose.Types.ObjectId(bidderId),
      amount,
      previousAmount: auction.currentPrice,
      bidType: "MANUAL",
      status: "ACCEPTED",
      requestId,
      sequenceNumber: updatedAuction.bidCount,
    });

    await bid.save();
    return bid;
  } catch (error: any) {
    // Idempotency check 2: Handle race condition where the same requestId was sent simultaneously
    if (error.code === 11000) {
      const duplicateBid = await Bid.findOne({ auctionId, bidderId, requestId });
      if (duplicateBid) return duplicateBid;
    }
    throw error;
  }
};
