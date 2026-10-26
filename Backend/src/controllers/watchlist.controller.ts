import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import * as watchlistService from "../services/watchlist.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addToWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auctionId = String(req.params.auctionId);
  const item = await watchlistService.addToWatchlist(req.user!.id, auctionId);
  res.status(201).json({ success: true, message: "Added to watchlist", data: item });
});

export const removeFromWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auctionId = String(req.params.auctionId);
  await watchlistService.removeFromWatchlist(req.user!.id, auctionId);
  res.status(200).json({ success: true, message: "Removed from watchlist" });
});

export const getWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await watchlistService.getUserWatchlist(req.user!.id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  res.status(200).json({ success: true, ...result });
});

export const checkWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auctionId = String(req.params.auctionId);
  const isWatched = await watchlistService.isWatchlisted(req.user!.id, auctionId);
  res.status(200).json({ success: true, data: { isWatched } });
});