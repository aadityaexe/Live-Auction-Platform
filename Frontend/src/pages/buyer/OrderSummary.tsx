import { Link } from 'react-router-dom';
import type { Auction } from '../../types';
import { formatCurrency } from '../../utils';

interface OrderSummaryProps {
  auction?: Auction;
  finalAmount: number;
  status: string;
}

export const OrderSummary = ({ auction, finalAmount, status }: OrderSummaryProps) => {
  return (
    <div className="md:col-span-2 space-y-8">
      <div className="panel p-6">
        <h3 className="text-base font-semibold mb-4 border-b border-border pb-3">Item Details</h3>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-32 aspect-square bg-surface-subtle border border-border rounded overflow-hidden flex-shrink-0">
            {auction?.images?.[0] ? (
              <img src={auction.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest font-semibold text-text-muted">No Img</div>
            )}
          </div>
          <div className="flex-1">
            <Link to={`/auctions/${auction?._id}`} className="text-lg font-medium text-text-primary hover:underline line-clamp-2 mb-2">
              {auction?.title || 'Unknown Item'}
            </Link>
            <p className="text-sm text-text-secondary line-clamp-3">
              {auction?.description}
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-text-muted">Final Price:</span>
                <span className="ml-2 font-medium tabular-nums">{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <h3 className="text-base font-semibold mb-4 border-b border-border pb-3">Payment & Escrow Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Winning Bid Amount</span>
            <span className="font-medium tabular-nums">{formatCurrency(finalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Escrow Protection</span>
            <span className="font-medium text-xs text-success flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {status === 'DELIVERED' ? 'Released to Seller' : 'Held in Secure Escrow'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Supported Gateway Methods</span>
            <span className="font-medium text-xs text-text-primary">UPI, Cards, NetBanking (INR)</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border mt-3">
            <span className="font-semibold text-text-primary">Total Amount</span>
            <span className="font-semibold text-lg tabular-nums tracking-tight">{formatCurrency(finalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
