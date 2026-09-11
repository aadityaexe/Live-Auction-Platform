import { Response } from "express";

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",

    maxAge: 7 * 24 * 60 * 60 * 1000,

    path: "/api/auth",
  });
};

export const clearRefreshTokenCookie = (
  res: Response
) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",

    path: "/api/auth",
  });
};