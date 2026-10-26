import mongoose, { Document, Schema } from "mongoose";

export type PaymentProvider = "RAZORPAY" | "STRIPE" | "WALLET";

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  auctionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerOrderId?: string;
  providerPaymentId?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
  status: PaymentStatus;
  failureReason?: string;
  webhookEventReferences?: string[];
  verifiedAt?: Date;
  refundAmount?: number;
  refundedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },
    userId: {
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
    currency: {
      type: String,
      default: "INR",
    },
    provider: {
      type: String,
      enum: ["RAZORPAY", "STRIPE", "WALLET"],
      required: true,
    },
    providerOrderId: {
      type: String,
      sparse: true,
    },
    providerPaymentId: {
      type: String,
      sparse: true,
    },
    paymentMethod: {
      type: String,
    },
    idempotencyKey: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "PENDING",
        "AUTHORIZED",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      default: "CREATED",
      index: true,
    },
    failureReason: {
      type: String,
    },
    webhookEventReferences: {
      type: [String],
      default: [],
    },
    verifiedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model<IPayment>("Payment", paymentSchema);
