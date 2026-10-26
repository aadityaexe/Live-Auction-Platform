import mongoose, { Document, Schema } from "mongoose";

export type WalletTransactionType =
  | "CREDIT"
  | "DEBIT"
  | "HOLD"
  | "RELEASE"
  | "REFUND"
  | "ADJUSTMENT";

export type WalletTransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: WalletTransactionType;
  amount: mongoose.Types.Decimal128;
  balanceBefore?: mongoose.Types.Decimal128;
  balanceAfter?: mongoose.Types.Decimal128;
  status: WalletTransactionStatus;
  referenceId?: string; // auctionId, orderId, paymentId etc.
  referenceType?: string;
  idempotencyKey?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "CREDIT",
        "DEBIT",
        "HOLD",
        "RELEASE",
        "REFUND",
        "ADJUSTMENT",
      ],
      required: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    balanceBefore: {
      type: Schema.Types.Decimal128,
    },
    balanceAfter: {
      type: Schema.Types.Decimal128,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      default: "PENDING",
    },
    referenceId: {
      type: String,
    },
    referenceType: {
      type: String,
    },
    idempotencyKey: {
      type: String,
    },
    description: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  walletTransactionSchema
);
