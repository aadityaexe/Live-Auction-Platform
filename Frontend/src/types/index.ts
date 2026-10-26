export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  walletBalance?: number;
  lastLogin?: string;
  createdAt?: string;
}

export type AuctionStatus =
  | 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED'
  | 'CANCELLED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'FULFILLED' | 'DISPUTED';

export interface Auction {
  _id: string;
  sellerId: string | User;
  title: string;
  description: string;
  images: string[];
  categoryId?: string | { _id: string; name: string; slug: string };
  startingPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  reservePrice?: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  highestBidderId?: string;
  winnerId?: string;
  bidCount: number;
  viewCount: number;
  watchCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  auctionId: string;
  bidderId: string | { _id: string; username: string };
  amount: number;
  previousAmount: number;
  bidType: 'MANUAL' | 'AUTO';
  status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  requestId: string;
  sequenceNumber: number;
  createdAt: string;
}

export type NotificationType =
  | 'BID_PLACED' | 'OUTBID' | 'AUCTION_STARTED' | 'AUCTION_ENDING'
  | 'AUCTION_ENDED' | 'AUCTION_WON' | 'AUCTION_LOST' | 'PAYMENT_DUE'
  | 'PAYMENT_RECEIVED' | 'ORDER_UPDATE' | 'SYSTEM';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'PROCESSING'
  | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'REFUNDED';

export interface Order {
  _id: string;
  orderNumber?: string;
  auctionId: string | Auction;
  buyerId: string | User;
  sellerId: string | User;
  winningBidId: string | Bid;
  finalAmount: number;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: string;
  claimedAt?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shippingAddress?: {
    line1: string; line2?: string; city: string;
    state: string; pincode: string; country: string;
  };
  paymentDeadline: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface LiveBidEvent {
  auctionId: string;
  bidId: string;
  amount: number;
  previousAmount: number;
  bidderId: string;
  currentPrice: number;
  bidCount: number;
  createdAt: string;
}

export interface AuctionJoinedEvent {
  auctionId: string;
  status: AuctionStatus;
  currentPrice: number;
  bidCount: number;
  startTime: string;
  endTime: string;
}

export interface AuctionEndedEvent {
  auctionId: string;
  status: AuctionStatus;
  winnerId: string | null;
  finalPrice: number;
  bidCount: number;
}

export interface Wallet {
  id: string;
  balance: string;
  heldBalance: string;
  availableBalance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT';
  amount: { $numberDecimal?: string } | string | number;
  balanceBefore?: { $numberDecimal?: string } | string | number;
  balanceAfter?: { $numberDecimal?: string } | string | number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

export interface PaymentOrderResponse {
  paymentId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}