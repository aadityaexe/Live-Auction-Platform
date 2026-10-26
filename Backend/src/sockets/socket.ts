import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import { logger } from "../logger/logger.js";
import config from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";

import { isOriginAllowed } from "../config/cors.js";

let io: Server;

const rateLimits = new Map<string, number>();
const RATE_LIMIT_MS = 100;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e4, // 10 KB limit for payload size
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!authHeader) {
        return next(new Error("Authentication error: Token required"));
      }

      const token = authHeader.replace("Bearer ", "");
      const payload = verifyAccessToken(token);

      if (payload.type !== "access") {
        return next(new Error("Authentication error: Invalid token type"));
      }

      socket.data.user = { id: payload.id, role: payload.role };
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.use((socket, next) => {
    socket.use(([event, ...args], nextEvent) => {
      const now = Date.now();
      const lastRequest = rateLimits.get(socket.id) || 0;
      
      if (now - lastRequest < RATE_LIMIT_MS) {
        return nextEvent(new Error("Rate limit exceeded"));
      }
      
      rateLimits.set(socket.id, now);
      nextEvent();
    });
    next();
  });

  io.on("connection", (socket: Socket) => {
    logger.info("Socket client connected", { socketId: socket.id, userId: socket.data.user.id });

    socket.on("auction:join", async (auctionId: unknown) => {
      try {
        if (typeof auctionId !== "string" || !auctionId.trim()) {
          socket.emit("auction:error", { message: "Invalid auction ID", code: "INVALID_AUCTION_ID" });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(auctionId)) {
          socket.emit("auction:error", { message: "Invalid auction ID format", code: "INVALID_AUCTION_ID" });
          return;
        }

        const auction = await Auction.findById(auctionId)
          .select("_id status title startTime endTime currentPrice bidCount")
          .lean();

        if (!auction) {
          socket.emit("auction:error", { message: "Auction not found", code: "AUCTION_NOT_FOUND", auctionId });
          return;
        }

        const room = `auction:${auctionId}`;
        await socket.join(room);

        logger.info("Socket joined auction room", { socketId: socket.id, auctionId, room });

        socket.emit("auction:joined", {
          auctionId,
          status: auction.status,
          currentPrice: auction.currentPrice,
          bidCount: auction.bidCount,
          startTime: auction.startTime,
          endTime: auction.endTime,
        });
      } catch (error) {
        logger.error("Error in auction:join handler", {
          socketId: socket.id,
          auctionId,
          error: error instanceof Error ? error.message : String(error),
        });
        socket.emit("auction:error", { message: "Failed to join auction room", code: "JOIN_FAILED" });
      }
    });

    socket.on("auction:leave", async (auctionId: unknown) => {
      try {
        if (typeof auctionId !== "string" || !auctionId.trim()) return;

        const room = `auction:${auctionId}`;
        await socket.leave(room);

        logger.info("Socket left auction room", { socketId: socket.id, auctionId });
        socket.emit("auction:left", { auctionId });
      } catch (error) {
        logger.error("Error in auction:leave handler", {
          socketId: socket.id,
          auctionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    socket.on("user:join", async (userId: unknown) => {
      try {
        if (typeof userId !== "string" || !userId.trim()) return;
        
        if (socket.data.user.id !== userId && socket.data.user.role !== "ADMIN") {
          logger.warn("Unauthorized attempt to join user room", { socketId: socket.id, userId, authenticatedUser: socket.data.user.id });
          return;
        }

        const room = `user:${userId}`;
        await socket.join(room);
        logger.info("Socket joined user room", { socketId: socket.id, userId });
        socket.emit("user:joined", { userId });
      } catch (error) {
        logger.error("Error in user:join handler", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    socket.on("disconnect", (reason: string) => {
      rateLimits.delete(socket.id);
      logger.info("Socket client disconnected", { socketId: socket.id, reason });
    });

    socket.on("error", (error: Error) => {
      logger.error("Socket error", { socketId: socket.id, error: error.message });
    });
  });

  logger.info("Socket.IO initialized");

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initializeSocket() first.");
  }
  return io;
};
