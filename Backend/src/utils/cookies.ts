import { Response } from "express";

const isProd = process.env.NODE_ENV === "production";

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
  });
};