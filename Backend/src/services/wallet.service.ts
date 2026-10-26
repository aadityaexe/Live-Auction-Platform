import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import config from "../config/env.js";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export const getWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, heldBalance: 0 });
  }
  return wallet;
};

export const getTransactions = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    WalletTransaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments({ userId })
  ]);
  return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const processTransaction = async (
  userId: string,
  amount: number,
  type: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE" | "REFUND" | "ADJUSTMENT",
  referenceId?: string,
  description?: string,
  idempotencyKey?: string
) => {
  if (amount < 0) throw new AppError("Invalid amount", 400, ERROR_CODES.BAD_REQUEST);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (idempotencyKey) {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey }).session(session);
      if (existingTx) {
        await session.abortTransaction();
        return existingTx;
      }
    }

    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) wallet = await Wallet.create([{ userId, balance: 0, heldBalance: 0 }], { session }).then(res => res[0]);
    if (!wallet) throw new AppError("Could not access wallet", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);

    if (wallet.status !== "ACTIVE") {
      throw new AppError("Wallet is not active", 400, ERROR_CODES.BAD_REQUEST);
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    const currentHeldBalance = parseFloat(wallet.heldBalance.toString());
    let newBalance = currentBalance;
    let newHeldBalance = currentHeldBalance;

    if (type === "DEBIT" || type === "HOLD") {
      const available = currentBalance - currentHeldBalance;
      if (available < amount) {
        throw new AppError("Insufficient funds", 400, ERROR_CODES.BAD_REQUEST);
      }
    }

    if (type === "CREDIT" || type === "REFUND") {
      newBalance += amount;
    } else if (type === "DEBIT") {
      newBalance -= amount;
    } else if (type === "HOLD") {
      newHeldBalance += amount;
    } else if (type === "RELEASE") {
      newHeldBalance = Math.max(0, currentHeldBalance - amount);
    } else if (type === "ADJUSTMENT") {
      newBalance += amount;
    }

    // Ensure 2-decimal currency precision
    newBalance = Math.round(newBalance * 100) / 100;
    newHeldBalance = Math.round(newHeldBalance * 100) / 100;

    wallet.balance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
    wallet.heldBalance = mongoose.Types.Decimal128.fromString(newHeldBalance.toFixed(2));
    wallet.version += 1;
    await wallet.save({ session });

    const tx = await WalletTransaction.create([{
      walletId: wallet._id,
      userId,
      type,
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      balanceBefore: mongoose.Types.Decimal128.fromString(currentBalance.toString()),
      balanceAfter: wallet.balance,
      status: "COMPLETED",
      referenceId,
      idempotencyKey,
      description
    }], { session });

    await session.commitTransaction();
    return tx[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const depositFunds = async (
  userId: string,
  amount: number,
  notes?: string,
  idempotencyKey?: string
) => {
  if (amount <= 0 || isNaN(amount)) {
    throw new AppError("Deposit amount must be greater than 0", 400, ERROR_CODES.BAD_REQUEST);
  }
  return await processTransaction(
    userId,
    amount,
    "CREDIT",
    `DEP-${Date.now()}`,
    notes || "Direct manual deposit into wallet",
    idempotencyKey
  );
};

export const withdrawFunds = async (
  userId: string,
  amount: number,
  notes?: string,
  idempotencyKey?: string
) => {
  if (amount <= 0 || isNaN(amount)) {
    throw new AppError("Withdrawal amount must be greater than 0", 400, ERROR_CODES.BAD_REQUEST);
  }
  return await processTransaction(
    userId,
    amount,
    "DEBIT",
    `WTH-${Date.now()}`,
    notes || "Direct manual withdrawal from wallet",
    idempotencyKey
  );
};
export const initiateDeposit = async (userId: string, amount: number) => {
  if (amount <= 0 || isNaN(amount)) {
    throw new AppError("Deposit amount must be greater than 0", 400, ERROR_CODES.BAD_REQUEST);
  }

  const amountInPaise = Math.round(amount * 100);
  const receipt = `dep_${userId.slice(-6)}_${Date.now()}`;

  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
  });

  return {
    providerOrderId: rzpOrder.id,
    amount,
    currency: "INR",
    keyId: config.RAZORPAY_KEY_ID,
  };
};

export const verifyDeposit = async (
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) => {
  const expected = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected !== signature) {
    throw new AppError("Invalid payment signature", 400, ERROR_CODES.BAD_REQUEST);
  }

  // idempotency — don't credit twice for the same Razorpay payment
  const existing = await WalletTransaction.findOne({ referenceId: razorpayPaymentId });
  if (existing) {
    const wallet = await getWallet(userId);
    return { wallet, transaction: existing };
  }

  const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
  const amount = Number(rzpOrder.amount) / 100;

  const tx = await processTransaction(
    userId,
    amount,
    "CREDIT",
    razorpayPaymentId,
    `Wallet deposit via Razorpay (${razorpayPaymentId})`,
    razorpayPaymentId
  );

  const wallet = await getWallet(userId);
  return { wallet, transaction: tx };
};
