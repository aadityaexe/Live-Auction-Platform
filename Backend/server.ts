import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";

import config from "./src/config/env.js";
import corsOptions from "./src/config/cors.js";
import { connectDB } from "./src/config/db.js";
import { AppError } from "./src/errors/AppError.js";
import { errorHandler } from "./src/errors/errorHandler.js";
import { initializeSocket, getIO } from "./src/sockets/socket.js";
import { logger } from "./src/logger/logger.js";
import { generalLimiter } from "./src/middleware/rateLimit.middleware.js";

import authRoutes from "./src/routes/auth.routes.js";
import auctionRoutes from "./src/routes/auction.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import walletRoutes from "./src/routes/wallet.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import { verifyTransporter } from "./src/services/email.service.js";

import {
  startScheduledAuctions,
  endLiveAuctions,
  recoverMissedTransitions,
} from "./src/jobs/auctionJobs.js";

const app = express();
const httpServer = createServer(app);

initializeSocket(httpServer);

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://plus.unsplash.com"],
      connectSrc: ["'self'", config.CLIENT_URL, "https://*.onrender.com", "wss://*.onrender.com"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({
  limit: "1mb",
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(hpp());
app.use(compression());

// express 5 makes req.query a getter; express-mongo-sanitize crashes without this
app.use((req, _res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true
  });
  next();
});
app.use(mongoSanitize());
app.use(generalLimiter);

if (config.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

app.get("/health/ready", (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1;
  if (!dbStatus) {
    return res.status(503).json({ status: "unavailable", reason: "DB not connected" });
  }
  res.status(200).json({ status: "ready" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new AppError(
      `Route ${req.method} ${req.originalUrl} not found`,
      404,
      "NOT_FOUND"
    )
  );
});

app.use(errorHandler);

let jobIntervals: NodeJS.Timeout[] = [];

const startServer = async () => {
  await connectDB();
  await verifyTransporter();

  httpServer.listen(config.PORT, () => {
    logger.info(`Server running on http://localhost:${config.PORT}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  });

  await recoverMissedTransitions();

  jobIntervals.push(
    setInterval(async () => {
      await startScheduledAuctions();
    }, 30 * 1000)
  );

  jobIntervals.push(
    setInterval(async () => {
      await endLiveAuctions();
    }, 30 * 1000)
  );

  logger.info("Auction lifecycle jobs scheduled (every 30s)");
};

startServer().catch((error) => {
  logger.error("Failed to start server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  jobIntervals.forEach(clearInterval);
  logger.info("Background jobs stopped.");

  httpServer.close(async () => {
    logger.info("HTTP server closed.");
    try {
      const io = getIO();
      io.close();
      logger.info("Socket.io closed.");
    } catch {
    }
    
    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      logger.error("Error closing MongoDB connection", {
        error: err instanceof Error ? err.message : String(err)
      });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: Error) => {
  logger.error("Unhandled Rejection", { error: reason.message, stack: reason.stack });
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  process.exit(1);
});