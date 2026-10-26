import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: mongoose.Types.Decimal128;
  heldBalance: mongoose.Types.Decimal128;
  availableBalance: mongoose.Types.Decimal128; // Virtual or calculated
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    heldBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "CLOSED"],
      default: "ACTIVE",
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

walletSchema.virtual("availableBalance").get(function () {
  return parseFloat(this.balance.toString()) - parseFloat(this.heldBalance.toString());
});

export default mongoose.model<IWallet>("Wallet", walletSchema);
