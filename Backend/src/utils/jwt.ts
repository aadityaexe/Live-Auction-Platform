import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    {
      id: userId,
      type: "access",
    },
    config.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn:
        config.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    {
      id: userId,
      type: "refresh",
    },
    config.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn:
        config.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(
    token,
    config.JWT_ACCESS_TOKEN_SECRET
  ) as {
    id: string;
    type: "access";
  };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(
    token,
    config.JWT_REFRESH_TOKEN_SECRET
  ) as {
    id: string;
    type: "refresh";
  };
};