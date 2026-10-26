import mongoose, { Document, Schema } from "mongoose";

export type AuctionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "LIVE"
  | "ENDING"
  | "ENDED"
  | "CANCELLED"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "FULFILLED"
  | "DISPUTED";

export interface IAuction extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  categoryId?: mongoose.Types.ObjectId;

  startingPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  reservePrice?: number;

  startTime: Date;
  endTime: Date;

  status: AuctionStatus;

  highestBidderId?: mongoose.Types.ObjectId;
  winnerId?: mongoose.Types.ObjectId;

  bidCount: number;
  viewCount: number;
  watchCount: number;

  version: number;
  extensionCount: number;
  maxExtensionSeconds: number;

  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },

    startingPrice: {
      type: Number,
      required: true,
      min: 1,
    },

    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    minimumIncrement: {
      type: Number,
      required: true,
      min: 1,
    },

    reservePrice: {
      type: Number,
      min: 0,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SCHEDULED",
        "LIVE",
        "ENDING",
        "ENDED",
        "CANCELLED",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "FULFILLED",
        "DISPUTED",
      ],
      default: "SCHEDULED",
      index: true,
    },

    highestBidderId: { type: Schema.Types.ObjectId, ref: "User" },
    winnerId: { type: Schema.Types.ObjectId, ref: "User" },
    bidCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    watchCount: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 1, min: 1 },
    extensionCount: { type: Number, default: 0, min: 0 },
    maxExtensionSeconds: { type: Number, default: 300, min: 0 },
  },
  {
    timestamps: true,
  }
);

auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ status: 1, startTime: 1 });
auctionSchema.index({ sellerId: 1, createdAt: -1 });
auctionSchema.index({ status: 1, categoryId: 1, createdAt: -1 });

export default mongoose.model<IAuction>("Auction", auctionSchema);