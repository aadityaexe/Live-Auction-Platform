import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { logger } from "../logger/logger.js";
import {
  GetAuctionsQuery,
  validateObjectId,
  buildAuctionQuery,
} from "./auction.query.js";

export { GetAuctionsQuery };

interface CreateAuctionData {
  title: string;
  description: string;
  images?: string[];
  categoryId?: string;
  startingPrice: number;
  minimumIncrement: number;
  reservePrice?: number;
  startTime: Date;
  endTime: Date;
}

export const createAuction = async (
  data: CreateAuctionData,
  userId: string
) => {
  validateObjectId(userId, "user ID");

  if (data.categoryId) {
    validateObjectId(data.categoryId, "category ID");
  }

  if (data.startingPrice <= 0) {
    throw new AppError(
      "Starting price must be greater than 0",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  if (data.minimumIncrement <= 0) {
    throw new AppError(
      "Minimum increment must be greater than 0",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (endTime <= startTime) {
    throw new AppError(
      "End time must be after start time",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  if (data.reservePrice !== undefined && data.reservePrice < data.startingPrice) {
    throw new AppError(
      "Reserve price cannot be lower than starting price",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  const auction = await Auction.create({
    ...data,
    sellerId: new mongoose.Types.ObjectId(userId),
    currentPrice: data.startingPrice,
    status: "SCHEDULED",
    bidCount: 0,
    viewCount: 0,
    watchCount: 0,
    version: 1,
    extensionCount: 0,
    maxExtensionSeconds: 300,
  });

  logger.info("Auction created", {
    auctionId: auction._id.toString(),
    sellerId: userId,
  });

  return auction;
};

export const getAuctions = async (query: GetAuctionsQuery = {}) => {
  const { filter, sort, safePage, safeLimit, skip } = await buildAuctionQuery(query);

  if (!filter) {
    return {
      auctions: [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: 0,
        pages: 0,
      },
    };
  }

  const [auctions, total] = await Promise.all([
    Auction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Auction.countDocuments(filter),
  ]);

  return {
    auctions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
};

export const getAuctionById = async (auctionId: string) => {
  validateObjectId(auctionId, "auction ID");

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.AUCTION_NOT_FOUND
    );
  }

  return auction;
};

export const updateAuction = async (
  auctionId: string,
  userId: string,
  data: Partial<CreateAuctionData>
) => {
  validateObjectId(auctionId, "auction ID");
  validateObjectId(userId, "user ID");

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.AUCTION_NOT_FOUND
    );
  }

  if (auction.sellerId.toString() !== userId) {
    throw new AppError(
      "You are not authorized to update this auction",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (auction.status !== "SCHEDULED") {
    throw new AppError(
      "Only scheduled auctions can be updated. You cannot edit an auction that has already started.",
      400,
      ERROR_CODES.AUCTION_NOT_SCHEDULED
    );
  }

  const newStartTime = data.startTime
    ? new Date(data.startTime)
    : auction.startTime;
  const newEndTime = data.endTime
    ? new Date(data.endTime)
    : auction.endTime;

  if (newEndTime <= newStartTime) {
    throw new AppError(
      "End time must be after start time",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  if (
    data.reservePrice !== undefined &&
    data.startingPrice !== undefined &&
    data.reservePrice < data.startingPrice
  ) {
    throw new AppError(
      "Reserve price cannot be lower than starting price",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  const { startingPrice, ...safeData } = data;

  if (startingPrice !== undefined) {
    if (startingPrice <= 0) {
      throw new AppError(
        "Starting price must be greater than 0",
        400,
        ERROR_CODES.BAD_REQUEST
      );
    }
    auction.startingPrice = startingPrice;
    auction.currentPrice = startingPrice;
  }

  Object.assign(auction, safeData);

  await auction.save();

  logger.info("Auction updated", { auctionId, userId });

  return auction;
};

export const cancelAuction = async (
  auctionId: string,
  userId: string
) => {
  validateObjectId(auctionId, "auction ID");
  validateObjectId(userId, "user ID");

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.AUCTION_NOT_FOUND
    );
  }

  if (auction.sellerId.toString() !== userId) {
    throw new AppError(
      "You are not authorized to cancel this auction",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (
    auction.status === "ENDED" ||
    auction.status === "CANCELLED" ||
    auction.status === "PAYMENT_PENDING" ||
    auction.status === "PAYMENT_COMPLETED" ||
    auction.status === "FULFILLED"
  ) {
    throw new AppError(
      `Cannot cancel an auction with status: ${auction.status}`,
      400,
      ERROR_CODES.INVALID_STATE_TRANSITION
    );
  }

  if (auction.status === "LIVE" && auction.bidCount > 0) {
    throw new AppError(
      "Cannot cancel a live auction that already has bids",
      400,
      ERROR_CODES.INVALID_STATE_TRANSITION
    );
  }

  const updated = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      sellerId: new mongoose.Types.ObjectId(userId),
      status: { $nin: ["ENDED", "CANCELLED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "FULFILLED"] },
    },
    { $set: { status: "CANCELLED" } },
    { new: true }
  );

  if (!updated) {
    throw new AppError(
      "Could not cancel auction. The auction state may have changed.",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  logger.info("Auction cancelled", { auctionId, userId });

  return updated;
};