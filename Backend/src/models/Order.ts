import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED";

export interface IOrder extends Document {
  orderNumber: string;
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  winningBidId: mongoose.Types.ObjectId;
  finalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  status: OrderStatus; // maps to orderStatus in requirements or keep it status
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentDeadline: Date;
  paidAt?: Date;
  trackingNumber?: string;
  trackingCarrier?: string;
  claimedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
      unique: true, // One order per auction
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    winningBidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
        "REFUNDED",
      ],
      default: "PAYMENT_PENDING",
      index: true,
    },
    shippingAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "IN" },
    },
    paymentDeadline: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    trackingCarrier: {
      type: String,
      trim: true,
    },
    claimedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model<IOrder>("Order", orderSchema);
