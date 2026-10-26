import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "BID_PLACED"
  | "OUTBID"
  | "AUCTION_STARTED"
  | "AUCTION_ENDING"
  | "AUCTION_ENDED"
  | "AUCTION_WON"
  | "AUCTION_LOST"
  | "PAYMENT_DUE"
  | "PAYMENT_RECEIVED"
  | "ORDER_UPDATE"
  | "SYSTEM";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>; // Extra context (auctionId, bidId, etc.)
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "BID_PLACED",
        "OUTBID",
        "AUCTION_STARTED",
        "AUCTION_ENDING",
        "AUCTION_ENDED",
        "AUCTION_WON",
        "AUCTION_LOST",
        "PAYMENT_DUE",
        "PAYMENT_RECEIVED",
        "ORDER_UPDATE",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
