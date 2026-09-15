import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { createBidService } from "../services/bid.service.js";
import { AppError } from "../errors/AppError.js";

export const createBid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { auctionId } = req.params;
    const { amount, requestId } = req.body;
    
    if (!req.user || !req.user.id) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }
    const bidderId = req.user.id;

    const bid = await createBidService(
      auctionId as string, 
      bidderId, 
      amount, 
      requestId as string
    );

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    next(error);
  }
};
