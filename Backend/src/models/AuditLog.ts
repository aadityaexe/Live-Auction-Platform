import mongoose, { Document, Schema } from "mongoose";

export type AuditAction =
  | "USER_REGISTER"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "AUCTION_CREATE"
  | "AUCTION_UPDATE"
  | "AUCTION_CANCEL"
  | "AUCTION_START"
  | "AUCTION_END"
  | "BID_PLACED"
  | "BID_REJECTED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "ORDER_CREATED"
  | "ORDER_UPDATE"
  | "ADMIN_ACTION";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: AuditAction;
  resourceType?: string; // "Auction", "Bid", "User", etc.
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      enum: [
        "USER_REGISTER",
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_UPDATE",
        "USER_DELETE",
        "AUCTION_CREATE",
        "AUCTION_UPDATE",
        "AUCTION_CANCEL",
        "AUCTION_START",
        "AUCTION_END",
        "BID_PLACED",
        "BID_REJECTED",
        "PAYMENT_INITIATED",
        "PAYMENT_COMPLETED",
        "PAYMENT_FAILED",
        "ORDER_CREATED",
        "ORDER_UPDATE",
        "ADMIN_ACTION",
      ],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
    },
    resourceId: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
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

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
