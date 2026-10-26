import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { UserRole } from "../models/User.js";

interface AccessTokenPayload {
  id: string;
  role: UserRole;
  type: "access";
}

export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    {
      id: userId,
      role,
      type: "access",
    } satisfies AccessTokenPayload,
    config.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(
    token,
    config.JWT_ACCESS_TOKEN_SECRET
  ) as AccessTokenPayload;
};