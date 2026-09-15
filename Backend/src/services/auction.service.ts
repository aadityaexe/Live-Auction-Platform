import Auction from "../models/Auction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

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
  const auction = await Auction.create({
    ...data,

    sellerId: userId,

    currentPrice: data.startingPrice,

    status: "SCHEDULED",

    bidCount: 0,
    viewCount: 0,
    watchCount: 0,

    version: 1,

    extensionCount: 0,
    maxExtensionSeconds: 300,
  });

  return auction;
};

export const getAuctions = async () => {
  return Auction.find({
    status: {
      $in: ["SCHEDULED", "LIVE", "ENDING"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();
};

export const getAuctionById = async (
  auctionId: string
) => {
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return auction;
};

export const updateAuction = async (
  auctionId: string,
  userId: string,
  data: Partial<CreateAuctionData>
) => {
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  if (auction.sellerId.toString() !== userId) {
    throw new AppError(
      "You are not allowed to update this auction",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (auction.status !== "SCHEDULED") {
    throw new AppError(
      "Only scheduled auctions can be updated",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  if (
    data.startTime &&
    data.endTime &&
    data.endTime <= data.startTime
  ) {
    throw new AppError(
      "End time must be after start time",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  Object.assign(auction, data);

  await auction.save();

  return auction;
};

export const cancelAuction = async (
  auctionId: string,
  userId: string
) => {
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw new AppError(
      "Auction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  if (auction.sellerId.toString() !== userId) {
    throw new AppError(
      "You are not allowed to cancel this auction",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (auction.status === "LIVE") {
    throw new AppError(
      "Live auctions cannot be cancelled",
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }

  auction.status = "CANCELLED";

  await auction.save();

  return auction;
};