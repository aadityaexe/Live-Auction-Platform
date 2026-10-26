import type { Auction, User } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface AuctionLotInfoProps {
  auction: Auction;
  seller: User | null;
}

export const AuctionLotInfo = ({ auction, seller }: AuctionLotInfoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-8">
      <div>
        <h3 className="text-xl font-serif mb-6 italic text-text-primary">Lot Information</h3>
        <div className="space-y-4 text-sm font-serif">
          <div className="flex justify-between border-b border-border border-dashed pb-2">
            <span className="text-text-secondary">Starting Price</span>
            <span className="font-medium tabular-nums text-text-primary">{formatCurrency(auction.startingPrice)}</span>
          </div>
          <div className="flex justify-between border-b border-border border-dashed pb-2">
            <span className="text-text-secondary">Min Increment</span>
            <span className="font-medium tabular-nums text-text-primary">{formatCurrency(auction.minimumIncrement)}</span>
          </div>
          <div className="flex justify-between border-b border-border border-dashed pb-2">
            <span className="text-text-secondary">Start Time</span>
            <span className="font-medium tabular-nums text-right text-text-primary">{formatDate(auction.startTime)}</span>
          </div>
          <div className="flex justify-between border-b border-border border-dashed pb-2">
            <span className="text-text-secondary">End Time</span>
            <span className="font-medium tabular-nums text-right text-text-primary">{formatDate(auction.endTime)}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-serif mb-6 italic text-text-primary">Provenance</h3>
        {seller ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-transparent border border-border flex items-center justify-center font-serif text-lg text-text-secondary">
              {seller.username[0].toUpperCase()}
            </div>
            <div>
              <div className="font-serif text-base flex items-center gap-2 text-text-primary">
                {seller.username}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-semibold">Verified Seller</div>
            </div>
          </div>
        ) : (
          <div className="text-sm font-serif italic text-text-muted">Provenance information unavailable</div>
        )}
      </div>
    </div>
  );
};
