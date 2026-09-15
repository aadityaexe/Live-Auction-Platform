import Auction from "../models/Auction.js";

export const startScheduledAuctions = async () => {
  try {
    const now = new Date();
    
    // Atomically transition auctions from SCHEDULED to LIVE
    // if their startTime has arrived and they haven't ended yet
    const result = await Auction.updateMany(
      {
        status: "SCHEDULED",
        startTime: { $lte: now },
        endTime: { $gt: now },
      },
      {
        $set: { status: "LIVE" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Job] Started ${result.modifiedCount} scheduled auctions.`);
    }
  } catch (error) {
    console.error("[Job] Error starting scheduled auctions:", error);
  }
};
