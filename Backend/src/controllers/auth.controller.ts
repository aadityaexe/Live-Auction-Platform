import { Request, Response } from "express";

import * as authService from "../services/";

import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookies.js";

import { AppError } from "../errors/AppError.js";


// ===============================
// REGISTER
// ===============================
export const registerUser = async (
  req: Request,
  res: Response
) => {
  const {
    username,
    email,
    password,
  } = req.body;

  const result = await authService.register(
    username,
    email,
    password
  );

  // Store refresh token in HttpOnly cookie
  setRefreshTokenCookie(
    res,
    result.refreshToken
  );

  return res.status(201).json({
    message: "User registered successfully",

    user: {
      id: result.user._id,
      username: result.user.username,
      email: result.user.email,
      lastLogin: result.user.lastLogin,
    },

    // Only send access token
    accessToken: result.accessToken,
  });
};


// ===============================
// LOGIN
// ===============================
export const loginUser = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    password,
  } = req.body;

  const result = await authService.login(
    email,
    password
  );

  // Store refresh token in HttpOnly cookie
  setRefreshTokenCookie(
    res,
    result.refreshToken
  );

  return res.status(200).json({
    message: "Login successful",

    user: {
      id: result.user._id,
      username: result.user.username,
      email: result.user.email,
      lastLogin: result.user.lastLogin,
      isVerified: result.user.isVerified,
      isActive: result.user.isActive,
    },

    // Access token goes to frontend
    accessToken: result.accessToken,
  });
};


// ===============================
// REFRESH ACCESS TOKEN
// ===============================
export const refreshToken = async (
  req: Request,
  res: Response
) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError(
      "Refresh token is required",
      401,
      "REFRESH_TOKEN_REQUIRED"
    );
  }

  const accessToken =
    await authService.refreshAccessToken(token);

  return res.status(200).json({
    accessToken,
  });
};


// ===============================
// LOGOUT
// ===============================
export const logoutUser = (
  req: Request,
  res: Response
) => {

  clearRefreshTokenCookie(res);

  return res.status(200).json({
    message: "Logout successful",
  });
};