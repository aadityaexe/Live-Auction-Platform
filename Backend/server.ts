import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import corsOptions from "./src/config/cors.js";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import auctionRoutes from "./src/routes/auction.routes.js";
import cokkieParser from "cookie-parser";
import { AppError } from "./src/errors/AppError.js";
import { errorHandler } from "./src/errors/errorHandler.js";
import { startScheduledAuctions } from "./src/jobs/auctionJobs.js";
import { Request, Response, NextFunction } from "express";
dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(cokkieParser());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);

// Start background job (every minute)
setInterval(() => {
  startScheduledAuctions();
}, 60 * 1000);


// Handle unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      `Route ${req.originalUrl} not found`,
      404,
      "NOT_FOUND"
    )
  );
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});