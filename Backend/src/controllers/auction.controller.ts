import { Request, Response } from "express";

import * as auctionService from "../services/auction.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { AuctionStatus } from "../models/Auction.js";

export const createAuction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const auction = await auctionService.createAuction(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
      data: auction,
    });
  }
);

export const getAuctions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page,
      limit,
      status,
      categoryId,
      sellerId,
      sortBy,
      sortOrder,
      search,
    } = req.query;

    const result = await auctionService.getAuctions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as AuctionStatus | undefined,
      categoryId: categoryId as string | undefined,
      sellerId: sellerId as string | undefined,
      sortBy: sortBy as auctionService.GetAuctionsQuery["sortBy"],
      sortOrder: sortOrder as auctionService.GetAuctionsQuery["sortOrder"],
      search: search as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: result.auctions,
      pagination: result.pagination,
    });
  }
);

export const getAuctionById = asyncHandler(
  async (req: Request, res: Response) => {
    const auction = await auctionService.getAuctionById(
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
    const auction = await auctionService.updateAuction(
      req.params.auctionId as string,
      req.user!.id,
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
    const auction = await auctionService.cancelAuction(
      req.params.auctionId as string,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: "Auction cancelled successfully",
      data: auction,
    });
  }
);