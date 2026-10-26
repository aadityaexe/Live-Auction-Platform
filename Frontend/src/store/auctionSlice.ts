import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Auction, Bid, Pagination, LiveBidEvent, AuctionEndedEvent } from '../types';
import { auctionApi, type GetAuctionsParams } from '../services/api/auction.api';

interface AuctionState {
  auctions: Auction[];
  pagination: Pagination | null;
  currentAuction: Auction | null;
  bids: Bid[];
  bidPagination: Pagination | null;
  loading: boolean;
  currentLoading: boolean;
  error: string | null;
  isWatched: boolean;
  livePrice: number | null;
  liveBidCount: number | null;
  lastBid: LiveBidEvent | null;
  liveStatus: string | null;
}

const initialState: AuctionState = {
  auctions: [], pagination: null, currentAuction: null,
  bids: [], bidPagination: null,
  loading: false, currentLoading: false, error: null,
  isWatched: false, livePrice: null, liveBidCount: null, lastBid: null, liveStatus: null,
};

export const fetchAuctions = createAsyncThunk('auctions/fetchAll', async (params: GetAuctionsParams, { rejectWithValue }) => {
  try {
    const { data } = await auctionApi.getAuctions(params);
    return data;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load auctions';
    return rejectWithValue(msg);
  }
});

export const fetchAuction = createAsyncThunk('auctions/fetchOne', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await auctionApi.getAuction(id);
    return data.data;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Auction not found';
    return rejectWithValue(msg);
  }
});

export const fetchBidHistory = createAsyncThunk('auctions/fetchBids', async ({ id, page }: { id: string; page?: number }, { rejectWithValue }) => {
  try {
    const { data } = await auctionApi.getBidHistory(id, page);
    return data;
  } catch {
    return rejectWithValue('Failed to load bids');
  }
});

export const placeBid = createAsyncThunk('auctions/placeBid', async (
  { auctionId, amount, requestId }: { auctionId: string; amount: number; requestId: string },
  { rejectWithValue }
) => {
  try {
    const { data } = await auctionApi.placeBid(auctionId, { amount, requestId });
    return data.data;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string } } };
    return rejectWithValue(e?.response?.data?.message || 'Failed to place bid');
  }
});

export const checkWatchlist = createAsyncThunk('auctions/checkWatchlist', async (auctionId: string) => {
  const { data } = await auctionApi.checkWatchlist(auctionId);
  return data.data.isWatched;
});

export const toggleWatchlist = createAsyncThunk('auctions/toggleWatchlist', async (
  { auctionId, isWatched }: { auctionId: string; isWatched: boolean }
) => {
  if (isWatched) await auctionApi.removeWatchlist(auctionId);
  else await auctionApi.addWatchlist(auctionId);
  return !isWatched;
});

const auctionSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    clearCurrent: (state) => {
      state.currentAuction = null; state.bids = [];
      state.livePrice = null; state.liveBidCount = null;
      state.lastBid = null; state.liveStatus = null;
    },
    clearError: (state) => { state.error = null; },
    applyLiveBid: (state, action: PayloadAction<LiveBidEvent>) => {
      const bid = action.payload;
      state.livePrice = bid.currentPrice;
      state.liveBidCount = bid.bidCount;
      state.lastBid = bid;
      const newBid: Bid = {
        _id: bid.bidId, auctionId: bid.auctionId, bidderId: bid.bidderId,
        amount: bid.amount, previousAmount: bid.previousAmount,
        bidType: 'MANUAL', status: 'ACCEPTED', requestId: '',
        sequenceNumber: bid.bidCount, createdAt: bid.createdAt,
      };
      state.bids = [newBid, ...state.bids.slice(0, 49)];
      if (state.currentAuction) {
        state.currentAuction.currentPrice = bid.currentPrice;
        state.currentAuction.bidCount = bid.bidCount;
      }
    },
    applyAuctionEnded: (state, action: PayloadAction<AuctionEndedEvent>) => {
      state.liveStatus = action.payload.status;
      if (state.currentAuction) {
        state.currentAuction.status = action.payload.status as Auction['status'];
        if (action.payload.winnerId) state.currentAuction.winnerId = action.payload.winnerId;
      }
    },
    setLiveStatus: (state, action: PayloadAction<string>) => {
      state.liveStatus = action.payload;
      if (state.currentAuction) state.currentAuction.status = action.payload as Auction['status'];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuctions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAuctions.fulfilled, (state, action) => {
        state.loading = false;
        state.auctions = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAuctions.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      .addCase(fetchAuction.pending, (state) => { state.currentLoading = true; state.error = null; })
      .addCase(fetchAuction.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentAuction = action.payload;
        state.livePrice = action.payload?.currentPrice ?? null;
        state.liveBidCount = action.payload?.bidCount ?? null;
        state.liveStatus = action.payload?.status ?? null;
      })
      .addCase(fetchAuction.rejected, (state, action) => {
        state.currentLoading = false; state.error = action.payload as string;
      })
      .addCase(fetchBidHistory.fulfilled, (state, action) => {
        state.bids = action.payload.data; state.bidPagination = action.payload.pagination;
      })
      .addCase(checkWatchlist.fulfilled, (state, action) => { state.isWatched = action.payload; })
      .addCase(toggleWatchlist.fulfilled, (state, action) => { state.isWatched = action.payload; });
  },
});

export const { clearCurrent, clearError, applyLiveBid, applyAuctionEnded, setLiveStatus } = auctionSlice.actions;
export default auctionSlice.reducer;