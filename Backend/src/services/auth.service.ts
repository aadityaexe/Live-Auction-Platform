import { User } from "../models/User.js";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { AppError } from "../errors/AppError.js";


// ==========================================
// REGISTER
// ==========================================

export const register = async (
  username: string,
  email: string,
  password: string
) => {

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email },
      { username },
    ],
  });

  if (existingUser) {
    throw new AppError(
      "User with this email or username already exists",
      409,
      "USER_EXISTS"
    );
  }


  // Hash password
  const hashedPassword = await hashPassword(
    password
  );


  // Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });


  // Generate access token
  const accessToken = generateAccessToken(
    user._id.toString()
  );


  // Generate refresh token
  const refreshToken = generateRefreshToken(
    user._id.toString()
  );


  return {
    user,
    accessToken,
    refreshToken,
  };
};


// ==========================================
// LOGIN
// ==========================================

export const login = async (
  email: string,
  password: string
) => {

  // Find user
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }


  // Compare password
  const isPasswordValid =
    await comparePassword(
      password,
      user.password
    );

  if (!isPasswordValid) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }


  // Check account status
  if (user.isDeleted) {
    throw new AppError(
      "This account has been deleted",
      403,
      "ACCOUNT_DELETED"
    );
  }


  if (!user.isActive) {
    throw new AppError(
      "This account is inactive",
      403,
      "ACCOUNT_INACTIVE"
    );
  }


  // Update last login
  user.lastLogin = new Date();

  await user.save();


  // Generate tokens
  const accessToken = generateAccessToken(
    user._id.toString()
  );

  const refreshToken = generateRefreshToken(
    user._id.toString()
  );


  return {
    user,
    accessToken,
    refreshToken,
  };
};


// ==========================================
// REFRESH ACCESS TOKEN
// ==========================================

export const refreshAccessToken = async (
  refreshToken: string
) => {

  if (!refreshToken) {
    throw new AppError(
      "Refresh token is required",
      401,
      "REFRESH_TOKEN_REQUIRED"
    );
  }


  // Verify refresh token
  const payload =
    verifyRefreshToken(refreshToken);


  // Make sure this is actually
  // a refresh token
  if (payload.type !== "refresh") {
    throw new AppError(
      "Invalid refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }


  // Find user
  const user = await User.findById(
    payload.id
  );

  if (!user) {
    throw new AppError(
      "User not found",
      401,
      "USER_NOT_FOUND"
    );
  }


  // Check account status
  if (user.isDeleted) {
    throw new AppError(
      "This account has been deleted",
      403,
      "ACCOUNT_DELETED"
    );
  }


  if (!user.isActive) {
    throw new AppError(
      "This account is inactive",
      403,
      "ACCOUNT_INACTIVE"
    );
  }


  // Generate new access token
  const accessToken =
    generateAccessToken(
      user._id.toString()
    );


  return accessToken;
};