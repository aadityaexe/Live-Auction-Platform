import React, { useState } from 'react';
import { walletApi } from '../../services/api/payment.api';
import { loadRazorpayScript } from '../../utils/razorpay';
import { Spinner } from '../../components/common';
import { formatCurrency } from '../../utils';
import type { Wallet } from '../../types';
import { useAppSelector } from '../../store/hooks';

interface WalletModalProps {
  modalType: 'DEPOSIT' | 'WITHDRAW';
  availableBalance: number;
  onClose: () => void;
  onSuccess: (wallet: Wallet, message: string) => void;
  onError: (message: string) => void;
}

export const WalletModal = ({
  modalType,
  availableBalance,
  onClose,
  onSuccess,
  onError,
}: WalletModalProps) => {
  const { user } = useAppSelector(s => s.auth);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      onError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (modalType === 'WITHDRAW' && num > availableBalance) {
      onError(`Withdrawal amount exceeds available balance of ${formatCurrency(availableBalance)}`);
      return;
    }

    try {
      setSubmitting(true);

      if (modalType === 'DEPOSIT') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          onError('Razorpay failed to load. Check your internet connection.');
          return;
        }

        const res = await walletApi.initiateDeposit(num);
        const { providerOrderId, amount: orderAmount, currency, keyId } = res.data.data;

        const rzp = new window.Razorpay({
          key: keyId,
          amount: Math.round(orderAmount * 100),
          currency,
          name: 'Live Auction Platform',
          description: 'Wallet Deposit',
          order_id: providerOrderId,
          prefill: { name: user?.username || '', email: user?.email || '' },
          theme: { color: '#1e293b' },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await walletApi.verifyDeposit({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              onSuccess(verifyRes.data.data.wallet, `Successfully deposited ${formatCurrency(orderAmount)} into your wallet.`);
              onClose();
            } catch (err: unknown) {
              const axiosErr = err as { response?: { data?: { message?: string } } };
              onError(axiosErr.response?.data?.message || 'Deposit verification failed. Contact support if your money was deducted.');
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => setSubmitting(false),
          },
        });

        rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
          onError(resp.error?.description || 'Payment failed.');
          setSubmitting(false);
        });

        rzp.open();
        return;
      }

      const res = await walletApi.withdraw(num, notes || 'Manual withdrawal');
      onSuccess(res.data.data.wallet, `Successfully withdrawn ${formatCurrency(num)} from your wallet.`);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      onError(axiosErr.response?.data?.message || 'Operation failed. Please verify your balance.');
      setSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="panel bg-surface border border-border w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h3 className="text-xl font-serif text-text-primary">
            {modalType === 'DEPOSIT' ? 'Deposit Funds to Wallet' : 'Withdraw Funds from Wallet'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-text-muted hover:text-text-primary text-xl font-bold p-1 leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder={modalType === 'DEPOSIT' ? 'e.g. 5000' : `Max available: ₹${availableBalance}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input w-full pl-8 py-2.5 text-lg font-serif tabular-nums bg-surface-subtle"
              />
            </div>
            {modalType === 'WITHDRAW' && (
              <p className="text-[11px] text-text-muted mt-1">
                Available to withdraw: <span className="font-semibold text-success">{formatCurrency(availableBalance)}</span>
              </p>
            )}
          </div>

          {modalType === 'DEPOSIT' && (
            <p className="text-[11px] text-text-muted mt-1">
              You will be redirected to Razorpay to complete the payment securely.
            </p>
          )}

          {modalType === 'WITHDRAW' && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Notes / Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. withdrawal reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input w-full py-2 bg-surface-subtle text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {submitting && <Spinner size={16} />}
              <span>{modalType === 'DEPOSIT' ? 'Pay with Razorpay' : 'Confirm Withdrawal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
