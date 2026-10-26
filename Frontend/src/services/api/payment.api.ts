import api from './client';
import type { Wallet, WalletTransaction, PaymentOrderResponse, Pagination } from '../../types';

export const walletApi = {
  getWallet: () =>
    api.get<{ status: string; data: Wallet }>('/wallets'),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get<{
      status: string;
      data: {
        transactions: WalletTransaction[];
        pagination: Pagination;
      };
    }>('/wallets/transactions', { params }),
  initiateDeposit: (amount: number) =>
    api.post<{ status: string; data: { providerOrderId: string; amount: number; currency: string; keyId: string } }>('/wallets/deposit/initiate', { amount }),
  verifyDeposit: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ status: string; message: string; data: { wallet: Wallet; transaction: WalletTransaction } }>('/wallets/deposit/verify', data),
  deposit: (amount: number, notes?: string) =>
    api.post<{ status: string; message: string; data: { wallet: Wallet; transaction: WalletTransaction } }>('/wallets/deposit', { amount, notes }),
  withdraw: (amount: number, notes?: string) =>
    api.post<{ status: string; message: string; data: { wallet: Wallet; transaction: WalletTransaction } }>('/wallets/withdraw', { amount, notes }),
};


export const paymentApi = {
  createOrder: (orderId: string) =>
    api.post<{ status: string; data: PaymentOrderResponse }>('/payments/orders', { orderId }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    api.post<{ status: string; data: { success: boolean; alreadyPaid?: boolean } }>('/payments/verify', data),
};
