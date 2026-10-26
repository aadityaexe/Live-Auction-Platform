import mongoose, { Document, Schema } from "mongoose";

export type OtpPurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically removed by MongoDB after expiration
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
