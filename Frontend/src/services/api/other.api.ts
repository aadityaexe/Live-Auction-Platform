import api from './client';
import type { Notification, Order, Category, Pagination, Auction } from '../../types';

export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    api.get<{ success: boolean; notifications: Notification[]; unreadCount: number; pagination: Pagination }>(
      '/notifications', { params }
    ),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const orderApi = {
  getOrders: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; orders: Order[]; pagination: Pagination }>('/orders', { params }),
  getOrder: (id: string) =>
    api.get<{ success: boolean; data: Order }>(`/orders/${id}`),
  updateStatus: (id: string, status: 'SHIPPED' | 'DELIVERED') =>
    api.patch<{ success: boolean; data: Order }>(`/orders/${id}/status`, { status }),
  claimOrder: (id: string) =>
    api.post<{ success: boolean; data: Order }>(`/orders/${id}/claim`),
  updateFulfillment: (id: string, data: { trackingNumber?: string; trackingCarrier?: string; status?: 'SHIPPED' }) =>
    api.patch<{ success: boolean; data: Order }>(`/orders/${id}/fulfillment`, data),
};

export const userApi = {
  getWonAuctions: (params?: { page?: number; limit?: number }) =>
    api.get<{
      success: boolean;
      wonAuctions: Array<{ auction: Auction; order: Order | null }>;
      pagination: Pagination;
    }>('/users/me/won-auctions', { params }),
  getActiveBids: (params?: { page?: number; limit?: number }) =>
    api.get('/users/me/active-bids', { params }),
};

export const categoryApi = {
  getCategories: () =>
    api.get<{ success: boolean; data: Category[] }>('/categories'),
};

export const watchlistApi = {
  getWatchlist: (params?: { page?: number; limit?: number }) =>
    api.get('/users/me/watchlist', { params }),
};