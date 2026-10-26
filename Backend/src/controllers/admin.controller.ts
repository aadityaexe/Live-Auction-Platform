import mongoose from "mongoose";
import { Request, Response } from "express";
import { User } from "../models/User.js";
import Auction from "../models/Auction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Order from "../models/Order.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export const getStats = async (_req: Request, res: Response) => {
  const [totalUsers, totalAuctions, liveAuctions] = await Promise.all([
    User.countDocuments(),
    Auction.countDocuments(),
    Auction.countDocuments({ status: "LIVE" }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalUsers,
      totalAuctions,
      liveAuctions,
    },
  });
};

export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const users = await User.find().select("-password").skip(skip).limit(limit).lean();
  const total = await User.countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
    throw new AppError("Invalid status", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
  if (!user) {
    throw new AppError("User not found", 404, ERROR_CODES.NOT_FOUND);
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
};

export const getAuctions = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const auctions = await Auction.find().populate("sellerId", "username email").skip(skip).limit(limit).lean();
  const total = await Auction.countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      auctions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

export const deleteAuction = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const auction = await Auction.findByIdAndDelete(id);
  if (!auction) {
    throw new AppError("Auction not found", 404, ERROR_CODES.NOT_FOUND);
  }

  res.status(200).json({
    status: "success",
    message: "Auction deleted successfully",
  });
};

export const updateUserDetails = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { username, email, role, bio, walletBalance, isActive, isVerified } = req.body;

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404, ERROR_CODES.NOT_FOUND);

  if (username && username !== user.username) {
    const existing = await User.findOne({ username, _id: { $ne: id } });
    if (existing) throw new AppError("Username already taken", 400, ERROR_CODES.CONFLICT);
    user.username = username;
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) throw new AppError("Email already in use", 400, ERROR_CODES.CONFLICT);
    user.email = email;
  }

  if (role && ["BUYER", "SELLER", "ADMIN"].includes(role)) {
    user.role = role;
  }

  if (typeof bio === "string") user.bio = bio;
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (typeof isVerified === "boolean") user.isVerified = isVerified;

  if (typeof walletBalance === "number" && !isNaN(walletBalance)) {
    const balanceNum = Math.max(0, walletBalance);
    user.walletBalance = balanceNum;

    let wallet = await Wallet.findOne({ userId: id });
    const currentBal = wallet ? parseFloat(wallet.balance.toString()) : 0;
    const diff = balanceNum - currentBal;

    if (!wallet) {
      wallet = await Wallet.create({ userId: id, balance: balanceNum, heldBalance: 0 });
    } else {
      wallet.balance = mongoose.Types.Decimal128.fromString(balanceNum.toString());
      wallet.version += 1;
      await wallet.save();
    }

    if (diff !== 0) {
      await WalletTransaction.create({
        walletId: wallet._id,
        userId: id,
        type: diff > 0 ? "CREDIT" : "DEBIT",
        amount: mongoose.Types.Decimal128.fromString(Math.abs(diff).toString()),
        balanceBefore: mongoose.Types.Decimal128.fromString(currentBal.toString()),
        balanceAfter: mongoose.Types.Decimal128.fromString(balanceNum.toString()),
        status: "COMPLETED",
        description: `Admin manual balance adjustment to ₹${balanceNum}`
      });
    }
  }

  await user.save();
  const userObj = user.toObject();
  delete (userObj as any).password;

  res.status(200).json({
    status: "success",
    message: "User details updated successfully",
    data: { user: userObj },
  });
};

export const adjustWallet = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { amount } = req.body;
  if (typeof amount !== "number" || isNaN(amount)) throw new AppError("Invalid amount", 400, ERROR_CODES.VALIDATION_ERROR);
  
  const user = await User.findById(id).select("-password");
  if (!user) throw new AppError("User not found", 404, ERROR_CODES.NOT_FOUND);
  
  const newBalance = Math.max(0, user.walletBalance + amount);
  user.walletBalance = newBalance;
  await user.save();

  let wallet = await Wallet.findOne({ userId: id });
  const currentBal = wallet ? parseFloat(wallet.balance.toString()) : 0;
  const targetBal = Math.max(0, currentBal + amount);

  if (!wallet) {
    wallet = await Wallet.create({ userId: id, balance: targetBal, heldBalance: 0 });
  } else {
    wallet.balance = mongoose.Types.Decimal128.fromString(targetBal.toString());
    wallet.version += 1;
    await wallet.save();
  }

  await WalletTransaction.create({
    walletId: wallet._id,
    userId: id,
    type: amount >= 0 ? "CREDIT" : "DEBIT",
    amount: mongoose.Types.Decimal128.fromString(Math.abs(amount).toString()),
    balanceBefore: mongoose.Types.Decimal128.fromString(currentBal.toString()),
    balanceAfter: wallet.balance,
    status: "COMPLETED",
    description: `Admin manual wallet adjustment of ${amount >= 0 ? "+" : ""}${amount}`
  });
  
  res.status(200).json({
    status: "success",
    data: { user },
  });
};

export const updateAuctionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const auction = await Auction.findByIdAndUpdate(id, { status }, { new: true });
  if (!auction) throw new AppError("Auction not found", 404, ERROR_CODES.NOT_FOUND);
  
  res.status(200).json({
    status: "success",
    data: { auction },
  });
};

export const getAllOrders = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const orders = await Order.find().populate("buyerId", "username email").populate("sellerId", "username email").populate("auctionId", "title").skip(skip).limit(limit).lean();
  const total = await Order.countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};
