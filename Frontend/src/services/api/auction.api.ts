import api from './client';
import type { Auction, Bid, Pagination } from '../../types';

export interface GetAuctionsParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  sellerId?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

export const auctionApi = {
  getAuctions: (params: GetAuctionsParams = {}) =>
    api.get<{ success: boolean; data: Auction[]; pagination: Pagination }>('/auctions', { params }),

  getAuction: (id: string) =>
    api.get<{ success: boolean; data: Auction }>(`/auctions/${id}`),

  createAuction: (data: Partial<Auction>) =>
    api.post<{ success: boolean; data: Auction }>('/auctions', data),

  updateAuction: (id: string, data: Partial<Auction>) =>
    api.patch<{ success: boolean; data: Auction }>(`/auctions/${id}`, data),

  cancelAuction: (id: string) =>
    api.delete<{ success: boolean }>(`/auctions/${id}`),

  getBidHistory: (id: string, page = 1, limit = 20) =>
    api.get<{ success: boolean; data: Bid[]; pagination: Pagination }>(
      `/auctions/${id}/bids`, { params: { page, limit } }
    ),

  placeBid: (auctionId: string, data: { amount: number; requestId: string }) =>
    api.post<{ success: boolean; data: Bid }>(`/auctions/${auctionId}/bids`, data),

  addWatchlist: (auctionId: string) =>
    api.post(`/auctions/${auctionId}/watchlist`),

  removeWatchlist: (auctionId: string) =>
    api.delete(`/auctions/${auctionId}/watchlist`),

  checkWatchlist: (auctionId: string) =>
    api.get<{ success: boolean; data: { isWatched: boolean } }>(`/auctions/${auctionId}/watchlist`),
};