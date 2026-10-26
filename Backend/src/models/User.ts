import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "BUYER" | "SELLER" | "ADMIN";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  walletAddress?: string;
  walletBalance: number;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["BUYER", "SELLER", "ADMIN"],
      default: "BUYER",
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
export default User;