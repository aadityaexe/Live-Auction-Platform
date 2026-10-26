import mongoose from "mongoose";
import Category from "../models/Category.js";
import { AuctionStatus } from "../models/Auction.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export interface GetAuctionsQuery {
  page?: number;
  limit?: number;
  status?: AuctionStatus | AuctionStatus[];
  categoryId?: string;
  sellerId?: string;
  sortBy?: "createdAt" | "startTime" | "endTime" | "currentPrice" | "bidCount" | string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export const validateObjectId = (id: string, fieldName: string = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(
      `Invalid ${fieldName} format`,
      400,
      ERROR_CODES.INVALID_OBJECT_ID
    );
  }
};

export const buildAuctionQuery = async (query: GetAuctionsQuery = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    categoryId,
    sellerId,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = query;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  } else {
    filter.status = { $in: ["SCHEDULED", "LIVE", "ENDING"] };
  }

  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    } else {
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: categoryId.toLowerCase() },
          { name: new RegExp(`^${categoryId}$`, "i") },
        ],
      }).select("_id");

      if (!categoryDoc) {
        return {
          filter: null,
          sort: { createdAt: -1 as const },
          safePage,
          safeLimit,
          skip: 0,
        };
      }
      filter.categoryId = categoryDoc._id;
    }
  }

  if (sellerId) {
    validateObjectId(sellerId, "seller ID");
    filter.sellerId = new mongoose.Types.ObjectId(sellerId);
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  let effectiveSortBy: string = sortBy;
  let effectiveSortOrder = sortOrder;

  if (effectiveSortBy.startsWith("-")) {
    effectiveSortBy = effectiveSortBy.substring(1);
    effectiveSortOrder = "desc";
  }

  const allowedSortKeys = ["createdAt", "startTime", "endTime", "currentPrice", "bidCount"];
  const sortKey = allowedSortKeys.includes(effectiveSortBy as string) ? (effectiveSortBy as string) : "createdAt";
  const sortDirection = effectiveSortOrder === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortKey]: sortDirection };

  return { filter, sort, safePage, safeLimit, skip };
};
