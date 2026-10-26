import mongoose, { Document, Schema } from "mongoose";

export interface IWatchlist extends Document {
  userId: mongoose.Types.ObjectId;
  auctionId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, auctionId: 1 }, { unique: true });

export default mongoose.model<IWatchlist>("Watchlist", watchlistSchema);
