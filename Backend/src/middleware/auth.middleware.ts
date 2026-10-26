import {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";
import { User, UserRole } from "../models/User.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: UserRole;
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
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "Invalid authorization header format. Use: Bearer <token>",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const payload = verifyAccessToken(token);
    if (payload.type !== "access") {
      throw new AppError(
        "Invalid access token",
        401,
        ERROR_CODES.INVALID_ACCESS_TOKEN
      );
    }

    req.user = {
      id: payload.id,
      userId: payload.id,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError("Authentication required", 401, ERROR_CODES.UNAUTHORIZED)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(" or ")}`,
          403,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };

export const authenticateStrict = async (
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
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "Invalid authorization header",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      throw new AppError(
        "Invalid access token",
        401,
        ERROR_CODES.INVALID_ACCESS_TOKEN
      );
    }

    const user = await User.findById(payload.id).select("_id role isActive isDeleted");

    if (!user) {
      throw new AppError("User not found", 401, ERROR_CODES.USER_NOT_FOUND);
    }

    if (user.isDeleted) {
      throw new AppError(
        "This account has been deleted",
        403,
        ERROR_CODES.ACCOUNT_DELETED
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "This account is inactive",
        403,
        ERROR_CODES.ACCOUNT_INACTIVE
      );
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};