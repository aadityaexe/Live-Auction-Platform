import mongoose from "mongoose";
import { User, IUser } from "../models/User.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { logger } from "../logger/logger.js";
import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import Order from "../models/Order.js";

interface UpdateProfileData {
  username?: string;
  bio?: string;
  profilePicture?: string;
}

export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).select("-password -__v -isDeleted -deletedAt");
  if (!user) throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  return user;
};

export const updateMe = async (userId: string, data: UpdateProfileData): Promise<IUser> => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError("Invalid user ID", 400, ERROR_CODES.INVALID_OBJECT_ID);

  if (data.username) {
    const existing = await User.findOne({ username: data.username, _id: { $ne: new mongoose.Types.ObjectId(userId) } });
    if (existing) throw new AppError("Username is already taken", 409, ERROR_CODES.USER_EXISTS);
  }

  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true })
    .select("-password -__v -isDeleted -deletedAt");
  if (!user) throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);

  logger.info("User profile updated", { userId });
  return user;
};

export const getAllUsers = async (page = 1, limit = 20, role?: string, search?: string) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;
  const filter: Record<string, unknown> = { isDeleted: false };
  if (role) filter.role = role;
  if (search) filter.$or = [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  const [users, total] = await Promise.all([
    User.find(filter).select("-password -__v -isDeleted -deletedAt").sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(filter),
  ]);
  return { users, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const setUserActiveStatus = async (targetUserId: string, isActive: boolean) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId))
    throw new AppError("Invalid user ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
  const user = await User.findByIdAndUpdate(targetUserId, { $set: { isActive } }, { new: true }).select("-password");
  if (!user) throw new AppError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  logger.info(`User ${isActive ? "activated" : "suspended"}`, { targetUserId });
  return user;
};

export const getMyActiveBids = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError("Invalid user ID", 400, ERROR_CODES.INVALID_OBJECT_ID);
    
  const uniqueAuctionIds = await Bid.distinct("auctionId", { bidderId: new mongoose.Types.ObjectId(userId), status: "ACCEPTED" });
  
  const auctions = await Auction.find({ 
    _id: { $in: uniqueAuctionIds },
    status: { $in: ["LIVE", "ENDING"] }
  }).select("_id title currentPrice status images endTime").lean();

  const activeBids = await Promise.all(auctions.map(async (auction) => {
    const highestBid = await Bid.findOne({ 
      auctionId: auction._id, 
      bidderId: new mongoose.Types.ObjectId(userId), 
      status: "ACCEPTED" 
    }).sort({ amount: -1 }).select("amount").lean();
    
    return {
      auction,
      myBid: highestBid?.amount || 0
    };
  }));

  return activeBids;
};

export const getWonAuctions = async (userId: string, page = 1, limit = 20) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError("Invalid user ID", 400, ERROR_CODES.INVALID_OBJECT_ID);

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [auctions, total] = await Promise.all([
    Auction.find({
      winnerId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["PAYMENT_PENDING", "PAYMENT_COMPLETED", "FULFILLED", "ENDED"] },
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("sellerId", "username email profilePicture")
      .lean(),
    Auction.countDocuments({
      winnerId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["PAYMENT_PENDING", "PAYMENT_COMPLETED", "FULFILLED", "ENDED"] },
    }),
  ]);

  const wonAuctions = await Promise.all(
    auctions.map(async (auction) => {
      const order = await Order.findOne({ auctionId: auction._id, buyerId: userId })
        .select("_id status paymentStatus finalAmount paymentDeadline createdAt trackingNumber trackingCarrier")
        .lean();
      return { auction, order };
    })
  );

  return {
    wonAuctions,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  };
};
