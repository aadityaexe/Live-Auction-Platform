import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import { getIO } from "../sockets/socket.js";
import { logger } from "../logger/logger.js";
import { finalizeAuction } from "../services/finalization.service.js";

export const startScheduledAuctions = async (): Promise<void> => {
  const now = new Date();

  try {
    const candidates = await Auction.find({
      status: "SCHEDULED",
      startTime: { $lte: now },
      endTime: { $gt: now },
    })
      .select("_id startTime")
      .lean();

    if (candidates.length === 0) return;

    for (const candidate of candidates) {
      const updated = await Auction.findOneAndUpdate(
        {
          _id: candidate._id,
          status: "SCHEDULED",
          startTime: { $lte: now },
          endTime: { $gt: now },
        },
        { $set: { status: "LIVE" } },
        { new: true }
      );

      if (!updated) {
        continue;
      }

      logger.info("Auction started (SCHEDULED → LIVE)", {
        auctionId: updated._id.toString(),
      });

      try {
        const io = getIO();
        io.to(`auction:${updated._id}`).emit("auction:started", {
          auctionId: updated._id,
          status: "LIVE",
          startTime: updated.startTime,
          currentPrice: updated.currentPrice,
        });
      } catch (socketError) {
        logger.error("Failed to emit auction:started", {
          auctionId: updated._id.toString(),
          error:
            socketError instanceof Error
              ? socketError.message
              : String(socketError),
        });
      }
    }
  } catch (error) {
    logger.error("Error in startScheduledAuctions job", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const endLiveAuctions = async (): Promise<void> => {
  const now = new Date();

  try {
    const candidates = await Auction.find({
      status: { $in: ["LIVE", "ENDING"] },
      endTime: { $lte: now },
    })
      .select("_id endTime")
      .lean();

    if (candidates.length === 0) return;

    for (const candidate of candidates) {
      const ended = await Auction.findOneAndUpdate(
        {
          _id: candidate._id,
          status: { $in: ["LIVE", "ENDING"] },
          endTime: { $lte: now },
        },
        { $set: { status: "ENDED" } },
        { new: true }
      );

      if (!ended) {
        continue;
      }

      logger.info("Auction ended (LIVE/ENDING → ENDED)", {
        auctionId: ended._id.toString(),
      });

      let result: Awaited<ReturnType<typeof finalizeAuction>> | null = null;

      try {
        result = await finalizeAuction(ended._id.toString());
      } catch (finalizationError) {
        logger.error("Finalization failed for auction", {
          auctionId: ended._id.toString(),
          error:
            finalizationError instanceof Error
              ? finalizationError.message
              : String(finalizationError),
        });
        result = {
          auctionId: ended._id.toString(),
          finalStatus: "ENDED",
          finalPrice: ended.currentPrice,
          bidCount: ended.bidCount,
          winnerId: null,
          orderId: null,
        };
      }

      try {
        const io = getIO();
        io.to(`auction:${ended._id}`).emit("auction:ended", {
          auctionId: result.auctionId,
          status: result.finalStatus,
          winnerId: result.winnerId,
          finalPrice: result.finalPrice,
          bidCount: result.bidCount,
        });
      } catch (socketError) {
        logger.error("Failed to emit auction:ended", {
          auctionId: ended._id.toString(),
          error:
            socketError instanceof Error
              ? socketError.message
              : String(socketError),
        });
      }
    }
  } catch (error) {
    logger.error("Error in endLiveAuctions job", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const recoverMissedTransitions = async (): Promise<void> => {
  logger.info("Running auction recovery job on startup...");

  await startScheduledAuctions();
  await endLiveAuctions();
  await recoverUnfinalizedAuctions();

  logger.info("Auction recovery complete");
};

const recoverUnfinalizedAuctions = async (): Promise<void> => {
  try {
    const stuckAuctions = await Auction.find({
      status: "ENDED",
    })
      .select("_id currentPrice bidCount")
      .lean();

    if (stuckAuctions.length === 0) return;

    logger.info(`Recovering ${stuckAuctions.length} unfinalized auction(s)...`);

    for (const auction of stuckAuctions) {
      try {
        const result = await finalizeAuction(auction._id.toString());

        try {
          const io = getIO();
          io.to(`auction:${auction._id}`).emit("auction:ended", {
            auctionId: result.auctionId,
            status: result.finalStatus,
            winnerId: result.winnerId,
            finalPrice: result.finalPrice,
            bidCount: result.bidCount,
          });
        } catch {
        }
      } catch (error) {
        logger.error("Failed to recover unfinalized auction", {
          auctionId: auction._id.toString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    logger.error("Error in recoverUnfinalizedAuctions", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
