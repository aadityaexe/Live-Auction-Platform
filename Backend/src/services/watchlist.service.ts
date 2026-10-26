import mongoose from "mongoose";
import Watchlist from "../models/Watchlist.js";
import Auction from "../models/Auction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { logger } from "../logger/logger.js";

export const addToWatchlist = async (userId: string, auctionId: string) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId))
    throw new AppError("Invalid auction ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  const auction = await Auction.findById(auctionId).select("_id");
  if (!auction) throw new AppError("Auction not found", 404, ERROR_CODES.AUCTION_NOT_FOUND);
  try {
    const item = await Watchlist.create({
      userId: new mongoose.Types.ObjectId(userId),
      auctionId: new mongoose.Types.ObjectId(auctionId),
    });
    await Auction.findByIdAndUpdate(auctionId, { $inc: { watchCount: 1 } });
    logger.info("Added to watchlist", { userId, auctionId });
    return item;
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000)
      throw new AppError("Auction already in watchlist", 409, ERROR_CODES.CONFLICT);
    throw err;
  }
};

export const removeFromWatchlist = async (userId: string, auctionId: string) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId))
    throw new AppError("Invalid auction ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  const result = await Watchlist.findOneAndDelete({
    userId: new mongoose.Types.ObjectId(userId),
    auctionId: new mongoose.Types.ObjectId(auctionId),
  });
  if (!result) throw new AppError("Watchlist item not found", 404, ERROR_CODES.NOT_FOUND);
  await Auction.findByIdAndUpdate(auctionId, { $inc: { watchCount: -1 } });
  logger.info("Removed from watchlist", { userId, auctionId });
  return result;
};

export const getUserWatchlist = async (userId: string, page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;
  const [items, total] = await Promise.all([
    Watchlist.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("auctionId", "title images currentPrice status endTime startTime bidCount")
      .lean(),
    Watchlist.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
  ]);
  return { watchlist: items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const isWatchlisted = async (userId: string, auctionId: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) return false;
  const item = await Watchlist.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    auctionId: new mongoose.Types.ObjectId(auctionId),
  });
  return !!item;
};