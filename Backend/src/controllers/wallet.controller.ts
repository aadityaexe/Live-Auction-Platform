import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getWallet,
  getTransactions,
  depositFunds,
  withdrawFunds,
  initiateDeposit,
  verifyDeposit,
} from "../services/wallet.service.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUserWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const wallet = await getWallet(userId);

  res.status(200).json({
    status: "success",
    data: {
      id: wallet._id,
      balance: wallet.balance.toString(),
      heldBalance: wallet.heldBalance.toString(),
      availableBalance: wallet.availableBalance,
      currency: wallet.currency,
      status: wallet.status,
    },
  });
});

export const getUserTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await getTransactions(userId, page, limit);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const handleDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const { amount, notes, idempotencyKey: bodyKey } = req.body;
  const idempotencyKey = (req.headers["idempotency-key"] as string) || bodyKey;
  const numAmount = parseFloat(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw new AppError("A valid positive amount is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const tx = await depositFunds(userId, numAmount, notes, idempotencyKey);
  const wallet = await getWallet(userId);

  res.status(200).json({
    status: "success",
    message: "Funds successfully deposited into wallet",
    data: {
      wallet: {
        id: wallet._id,
        balance: wallet.balance.toString(),
        heldBalance: wallet.heldBalance.toString(),
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
        status: wallet.status,
      },
      transaction: tx,
    },
  });
});

export const handleWithdraw = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const { amount, notes, idempotencyKey: bodyKey } = req.body;
  const idempotencyKey = (req.headers["idempotency-key"] as string) || bodyKey;
  const numAmount = parseFloat(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw new AppError("A valid positive amount is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const tx = await withdrawFunds(userId, numAmount, notes, idempotencyKey);
  const wallet = await getWallet(userId);

  res.status(200).json({
    status: "success",
    message: "Funds successfully withdrawn from wallet",
    data: {
      wallet: {
        id: wallet._id,
        balance: wallet.balance.toString(),
        heldBalance: wallet.heldBalance.toString(),
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
        status: wallet.status,
      },
      transaction: tx,
    },
  });
});

export const handleInitiateDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

  const num = parseFloat(req.body.amount);
  if (!num || isNaN(num) || num <= 0) {
    throw new AppError("A valid positive amount is required", 400, ERROR_CODES.BAD_REQUEST);
  }

  const data = await initiateDeposit(userId, num);
  res.status(200).json({ status: "success", data });
});

export const handleVerifyDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Payment details missing", 400, ERROR_CODES.BAD_REQUEST);
  }

  const result = await verifyDeposit(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature);
  res.status(200).json({
    status: "success",
    message: "Deposit confirmed and wallet credited",
    data: {
      wallet: {
        id: result.wallet._id,
        balance: result.wallet.balance.toString(),
        heldBalance: result.wallet.heldBalance.toString(),
        availableBalance: result.wallet.availableBalance,
        currency: result.wallet.currency,
        status: result.wallet.status,
      },
      transaction: result.transaction,
    },
  });
});
