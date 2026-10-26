import apiClient from "./client";

export const getPlatformStats = async () => {
  const { data } = await apiClient.get("/admin/stats");
  return data.data;
};

export const getUsers = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/admin/users?page=${page}&limit=${limit}`);
  return data.data;
};

export const updateUserStatus = async (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") => {
  const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return data.data;
};

export const updateUserDetails = async (id: string, updates: {
  username?: string;
  email?: string;
  role?: "BUYER" | "SELLER" | "ADMIN";
  bio?: string;
  walletBalance?: number;
  isActive?: boolean;
  isVerified?: boolean;
}) => {
  const { data } = await apiClient.patch(`/admin/users/${id}`, updates);
  return data.data;
};

export const getAuctions = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/admin/auctions?page=${page}&limit=${limit}`);
  return data.data;
};

export const deleteAuction = async (id: string) => {
  const { data } = await apiClient.delete(`/admin/auctions/${id}`);
  return data;
};

export const adjustWallet = async (id: string, amount: number) => {
  const { data } = await apiClient.patch(`/admin/users/${id}/wallet`, { amount });
  return data.data;
};

export const updateAuctionStatus = async (id: string, status: string) => {
  const { data } = await apiClient.patch(`/admin/auctions/${id}/status`, { status });
  return data.data;
};

export const getOrders = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/admin/orders?page=${page}&limit=${limit}`);
  return data.data;
};
