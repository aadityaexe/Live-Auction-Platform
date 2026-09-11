import {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        "Access token is required",
        401,
        "UNAUTHORIZED"
      );
    }

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      throw new AppError(
        "Invalid authorization header",
        401,
        "UNAUTHORIZED"
      );
    }

    const payload =
      verifyAccessToken(token);

    if (payload.type !== "access") {
      throw new AppError(
        "Invalid access token",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    req.user = {
      id: payload.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};