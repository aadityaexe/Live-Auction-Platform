import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { logger } from "../logger/logger.js";
import { logAudit } from "../logger/audit.js";

const PAYMENT_DEADLINE_HOURS = 48;

export interface FinalizationResult {
  auctionId: string;
  finalStatus: "PAYMENT_PENDING" | "ENDED";
  finalPrice: number;
  bidCount: number;
  winnerId: string | null;
  orderId: string | null;
}

export const finalizeAuction = async (
  auctionId: string | mongoose.Types.ObjectId
): Promise<FinalizationResult> => {
  const auctionObjectId =
    typeof auctionId === "string"
      ? new mongoose.Types.ObjectId(auctionId)
      : auctionId;

  const auction = await Auction.findOne({
    _id: auctionObjectId,
    status: { $in: ["ENDED", "PAYMENT_PENDING"] },
  });

  if (!auction) {
    throw new Error(
      `Cannot finalize auction ${auctionId}: not found or not in ENDED/PAYMENT_PENDING status`
    );
  }

  const winningBid = await Bid.findOne({
    auctionId: auctionObjectId,
    status: "ACCEPTED",
  })
    .sort({ amount: -1 })
    .select("_id bidderId amount")
    .lean();

  const reserveMet =
    !auction.reservePrice ||
    (winningBid !== null && winningBid.amount >= auction.reservePrice);

  const winnerId =
    winningBid && reserveMet
      ? (winningBid.bidderId as mongoose.Types.ObjectId)
      : null;

  const finalPrice = auction.currentPrice;

  const finalStatus: "PAYMENT_PENDING" | "ENDED" = winnerId
    ? "PAYMENT_PENDING"
    : "ENDED";

  const finalized = await Auction.findOneAndUpdate(
    {
      _id: auctionObjectId,
      status: { $in: ["ENDED", "PAYMENT_PENDING"] },
    },
    {
      $set: {
        status: finalStatus,
        winnerId: winnerId ?? undefined,
        ...(winnerId ? { highestBidderId: winnerId } : {}),
      },
    },
    { new: true }
  );

  const effectiveAuction = finalized ?? auction;

  let orderId: string | null = null;

  if (winnerId && winningBid) {
    orderId = await createOrderIfNotExists({
      auctionId: auctionObjectId,
      buyerId: winnerId,
      sellerId: auction.sellerId,
      winningBidId: winningBid._id as mongoose.Types.ObjectId,
      finalAmount: winningBid.amount,
    });
  }

  await dispatchFinalizationNotifications({
    auctionId: auctionObjectId,
    auctionTitle: auction.title,
    sellerId: auction.sellerId,
    winnerId,
    finalPrice,
    orderId,
    reservePrice: auction.reservePrice,
    winningBidAmount: winningBid?.amount,
  });

  logger.info("Auction finalized", {
    auctionId: auctionObjectId.toString(),
    finalStatus: effectiveAuction.status,
    winnerId: winnerId?.toString() ?? "none",
    orderId: orderId ?? "none",
    finalPrice,
    reserveMet: Boolean(reserveMet),
  });

  logAudit({
    action: "AUCTION_END",
    resourceType: "Auction",
    resourceId: auctionObjectId.toString(),
    metadata: {
      finalStatus: effectiveAuction.status,
      winnerId: winnerId?.toString() ?? "none",
      orderId: orderId ?? "none",
      finalPrice,
      bidCount: effectiveAuction.bidCount,
      reserveMet: Boolean(reserveMet),
    },
  });

  return {
    auctionId: auctionObjectId.toString(),
    finalStatus,
    finalPrice,
    bidCount: effectiveAuction.bidCount,
    winnerId: winnerId?.toString() ?? null,
    orderId,
  };
};


interface CreateOrderParams {
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  winningBidId: mongoose.Types.ObjectId;
  finalAmount: number;
}

const createOrderIfNotExists = async (
  params: CreateOrderParams
): Promise<string> => {
  const { auctionId, buyerId, sellerId, winningBidId, finalAmount } = params;

  try {
    const paymentDeadline = new Date();
    paymentDeadline.setHours(
      paymentDeadline.getHours() + PAYMENT_DEADLINE_HOURS
    );

    const order = await Order.create({
      auctionId,
      buyerId,
      sellerId,
      winningBidId,
      finalAmount,
      status: "PAYMENT_PENDING",
      paymentDeadline,
    });

    logger.info("Order created", {
      orderId: order._id.toString(),
      auctionId: auctionId.toString(),
      buyerId: buyerId.toString(),
      finalAmount,
    });

    return order._id.toString();
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      const existing = await Order.findOne({ auctionId }).select("_id").lean();
      if (existing) {
        logger.info("Order already exists for auction (idempotent skip)", {
          auctionId: auctionId.toString(),
          orderId: existing._id.toString(),
        });
        return existing._id.toString();
      }
    }
    throw error;
  }
};

interface NotificationParams {
  auctionId: mongoose.Types.ObjectId;
  auctionTitle: string;
  sellerId: mongoose.Types.ObjectId;
  winnerId: mongoose.Types.ObjectId | null;
  finalPrice: number;
  orderId: string | null;
  reservePrice?: number;
  winningBidAmount?: number;
}

const dispatchFinalizationNotifications = async (
  params: NotificationParams
): Promise<void> => {
  const {
    auctionId,
    auctionTitle,
    sellerId,
    winnerId,
    finalPrice,
    orderId,
    reservePrice,
    winningBidAmount,
  } = params;

  const notificationsToCreate: Array<{
    userId: mongoose.Types.ObjectId;
    type: "AUCTION_WON" | "AUCTION_ENDED" | "AUCTION_LOST";
    title: string;
    message: string;
    data: Record<string, unknown>;
  }> = [];

  if (winnerId) {
    notificationsToCreate.push({
      userId: winnerId,
      type: "AUCTION_WON",
      title: "You won the auction!",
      message: `Congratulations! You won "${auctionTitle}" with a bid of ₹${finalPrice.toLocaleString("en-IN")}. Please complete your payment within 48 hours.`,
      data: {
        auctionId: auctionId.toString(),
        orderId,
        finalPrice,
      },
    });

    notificationsToCreate.push({
      userId: sellerId,
      type: "AUCTION_ENDED",
      title: "Auction sold!",
      message: `Your auction "${auctionTitle}" ended with a winning bid of ₹${finalPrice.toLocaleString("en-IN")}. Awaiting buyer payment.`,
      data: {
        auctionId: auctionId.toString(),
        orderId,
        finalPrice,
        winnerId: winnerId.toString(),
      },
    });
  } else {
    const reserveNotMet =
      reservePrice !== undefined &&
      winningBidAmount !== undefined &&
      winningBidAmount < reservePrice;

    const sellerMessage = reserveNotMet
      ? `Your auction "${auctionTitle}" ended but the reserve price of ₹${reservePrice?.toLocaleString("en-IN")} was not met. The highest bid was ₹${winningBidAmount?.toLocaleString("en-IN")}.`
      : `Your auction "${auctionTitle}" ended without receiving any bids.`;

    notificationsToCreate.push({
      userId: sellerId,
      type: "AUCTION_ENDED",
      title: reserveNotMet ? "Reserve price not met" : "Auction ended with no bids",
      message: sellerMessage,
      data: {
        auctionId: auctionId.toString(),
        finalPrice,
        reserveNotMet,
      },
    });
  }

  try {
    const losingBidders = await Bid.distinct("bidderId", {
      auctionId,
      status: "ACCEPTED",
      ...(winnerId ? { bidderId: { $ne: winnerId } } : {}),
    });

    for (const loserId of losingBidders) {
      notificationsToCreate.push({
        userId: loserId as mongoose.Types.ObjectId,
        type: "AUCTION_LOST",
        title: "Auction ended",
        message: `The auction "${auctionTitle}" has ended. The final price was ₹${finalPrice.toLocaleString("en-IN")}.`,
        data: {
          auctionId: auctionId.toString(),
          finalPrice,
        },
      });
    }
  } catch (err) {
    logger.error("Failed to fetch losing bidders for notifications", {
      auctionId: auctionId.toString(),
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await Notification.insertMany(notificationsToCreate, { ordered: false });
    logger.info("Finalization notifications sent", {
      auctionId: auctionId.toString(),
      count: notificationsToCreate.length,
    });
  } catch (error) {
    logger.error("Failed to send finalization notifications", {
      auctionId: auctionId.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
