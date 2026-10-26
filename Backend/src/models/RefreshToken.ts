import mongoose, { Document, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdByIp: string;
  revokedAt?: Date;
  replacedByToken?: string;
  isExpired: boolean;
  isActive: boolean;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: {
      type: String,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    replacedByToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expiresAt.getTime();
});

refreshTokenSchema.virtual("isActive").get(function () {
  return !this.revokedAt && !this.isExpired;
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const RefreshToken = mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
