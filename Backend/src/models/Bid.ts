import mongoose, { Document, Schema } from "mongoose";

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  bidderId: mongoose.Types.ObjectId;
  amount: number;
  previousAmount: number;
  bidType: "MANUAL" | "AUTO";
  status: "ACCEPTED" | "REJECTED" | "CANCELLED";
  requestId: string;
  sequenceNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },
    bidderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bidType: {
      type: String,
      enum: ["MANUAL", "AUTO"],
      default: "MANUAL",
    },
    status: {
      type: String,
      enum: ["ACCEPTED", "REJECTED", "CANCELLED"],
      default: "ACCEPTED",
    },
    requestId: {
      type: String,
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests
bidSchema.index({ auctionId: 1, bidderId: 1, requestId: 1 }, { unique: true });
// For fetching bid history of an auction ordered by sequence
bidSchema.index({ auctionId: 1, sequenceNumber: -1 });

export default mongoose.model<IBid>("Bid", bidSchema);
