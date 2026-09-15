import { Request, Response } from "express";

import * as auctionService from "../services/auction.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { AuthRequest } from "../middleware/auth.middleware.js";

export const createAuction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const auction = await auctionService.createAuction(
      req.body,
      userId as string
    );

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
      data: auction,
    });
  }
);

export const getAuctions = asyncHandler(
  async (_req: Request, res: Response) => {
    const auctions = await auctionService.getAuctions();

    res.status(200).json({
      success: true,
      data: auctions,
    });
  }
);

export const getAuctionById = asyncHandler(
  async (req: Request, res: Response) => {
    const auction =
      await auctionService.getAuctionById(
        req.params.auctionId as string
      );

    res.status(200).json({
      success: true,
      data: auction,
    });
  }
);

export const updateAuction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const auction =
      await auctionService.updateAuction(
        req.params.auctionId as string,
        req.user?.id as string,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Auction updated successfully",
      data: auction,
    });
  }
);

export const deleteAuction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const auction =
      await auctionService.cancelAuction(
        req.params.auctionId as string,
        req.user?.id as string
      );

    res.status(200).json({
      success: true,
      message: "Auction cancelled successfully",
      data: auction,
    });
  }
);