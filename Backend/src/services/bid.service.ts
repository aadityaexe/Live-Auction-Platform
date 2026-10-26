import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { getIO } from "../sockets/socket.js";
import { logger } from "../logger/logger.js";

export const createBidService = async (
  auctionId: string,
  bidderId: string,
  amount: number,
  requestId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    throw new AppError("Invalid auction ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  }
  if (!mongoose.Types.ObjectId.isValid(bidderId)) {
    throw new AppError("Invalid bidder ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  }

  const existingBid = await Bid.findOne({ auctionId, bidderId, requestId });
  if (existingBid) {
    logger.info("Duplicate bid request — returning existing bid", {
      requestId,
      bidId: existingBid._id.toString(),
    });
    return existingBid;
  }

  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new AppError("Auction not found", 404, ERROR_CODES.AUCTION_NOT_FOUND);
  }

  if (auction.status !== "LIVE" && auction.status !== "ENDING") {
    throw new AppError(
      "Bids can only be placed on live auctions",
      400,
      ERROR_CODES.AUCTION_NOT_ACTIVE
    );
  }

  const now = new Date();
  if (now < auction.startTime) {
    throw new AppError(
      "Auction has not started yet",
      400,
      ERROR_CODES.AUCTION_NOT_ACTIVE
    );
  }

  if (now >= auction.endTime) {
    throw new AppError(
      "Auction has already ended",
      400,
      ERROR_CODES.AUCTION_ENDED
    );
  }

  if (auction.sellerId.toString() === bidderId) {
    throw new AppError(
      "Sellers cannot bid on their own auctions",
      403,
      ERROR_CODES.SELLER_CANNOT_BID
    );
  }

  const minimumRequiredBid = auction.currentPrice + auction.minimumIncrement;
  if (amount < minimumRequiredBid) {
    throw new AppError(
      `Bid must be at least ${minimumRequiredBid} (current: ${auction.currentPrice} + increment: ${auction.minimumIncrement})`,
      400,
      ERROR_CODES.BID_AMOUNT_TOO_LOW
    );
  }

  const capturedCurrentPrice = auction.currentPrice;

  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(auctionId),
      status: { $in: ["LIVE", "ENDING"] },
      currentPrice: capturedCurrentPrice,
      endTime: { $gt: now },
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

  if (!updatedAuction) {
    throw new AppError(
      "A higher bid was placed simultaneously. Please refresh and try again.",
      409,
      ERROR_CODES.BID_CONFLICT
    );
  }

  try {
    const bid = new Bid({
      auctionId: new mongoose.Types.ObjectId(auctionId),
      bidderId: new mongoose.Types.ObjectId(bidderId),
      amount,
      previousAmount: capturedCurrentPrice,
      bidType: "MANUAL",
      status: "ACCEPTED",
      requestId,
      sequenceNumber: updatedAuction.bidCount,
    });

    await bid.save();

    logger.info("Bid placed successfully", {
      bidId: bid._id.toString(),
      auctionId,
      bidderId,
      amount,
      previousAmount: capturedCurrentPrice,
    });

    try {
      const io = getIO();
      io.to(`auction:${auctionId}`).emit("auction:bid", {
        auctionId: updatedAuction._id,
        bidId: bid._id,
        amount,
        previousAmount: capturedCurrentPrice,
        bidderId,
        currentPrice: updatedAuction.currentPrice,
        bidCount: updatedAuction.bidCount,
        createdAt: bid.createdAt,
      });
    } catch (socketError) {
      logger.error("Socket broadcast failed after bid", {
        auctionId,
        bidId: bid._id.toString(),
        error:
          socketError instanceof Error
            ? socketError.message
            : String(socketError),
      });
    }

    const previousHighestBidderId = auction.highestBidderId;
    if (
      previousHighestBidderId &&
      previousHighestBidderId.toString() !== bidderId
    ) {
      Notification.create({
        userId: previousHighestBidderId,
        type: "OUTBID",
        title: "You've been outbid!",
        message: `Someone placed a higher bid of ₹${amount.toLocaleString("en-IN")} on an auction you were winning.`,
        data: { auctionId, newBidAmount: amount },
      })
        .then((notif) => {
          try {
            const io = getIO();
            io.to(`user:${previousHighestBidderId}`).emit("notification:new", {
              id: notif._id,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              data: notif.data,
              createdAt: notif.createdAt,
            });
          } catch { /* socket may not be ready */ }
        })
        .catch((err: unknown) => {
          logger.error("OUTBID notification failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }

    return bid;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      const duplicateBid = await Bid.findOne({ auctionId, bidderId, requestId });
      if (duplicateBid) {
        logger.info("Concurrent duplicate request resolved", { requestId });
        return duplicateBid;
      }
    }
    throw error;
  }
};
