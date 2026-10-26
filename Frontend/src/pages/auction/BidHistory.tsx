import type { Bid, User } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface BidHistoryProps {
  bids: Bid[];
  effectiveBidCount: number;
  user: User | null;
}

export const BidHistory = ({ bids, effectiveBidCount, user }: BidHistoryProps) => {
  return (
    <div>
      <div className="flex justify-between items-end mb-3 border-b border-border pb-2">
        <h3 className="text-sm font-serif uppercase tracking-widest text-text-primary font-bold">Bid History</h3>
        <span className="text-[10px] uppercase tracking-widest text-text-muted tabular-nums font-semibold mb-0.5">
          {effectiveBidCount} bids
        </span>
      </div>

      <div className="max-h-[220px] overflow-y-auto pr-2 pt-1 custom-scrollbar">
        {bids.length === 0 ? (
          <div className="py-6 text-center font-serif italic text-text-muted text-sm">No bids placed yet</div>
        ) : (
          <div className="divide-y divide-border border-b border-border">
            {bids.map((bid) => {
              const bidder = typeof bid.bidderId === 'object' ? (bid.bidderId as { _id?: string; username?: string }) : null;
              const isMe = user && bidder && bidder._id === user.id;

              return (
                <div key={bid._id} className="py-3 flex justify-between items-center text-xs animate-slide-down">
                  <div>
                    <div className="font-serif text-text-primary flex items-center gap-2 text-sm">
                      {bidder?.username ?? `Bidder ${String(bid.bidderId).slice(-4)}`}
                      {isMe && (
                        <span className="text-[9px] bg-transparent border border-text-muted px-1.5 py-0.5 text-text-secondary uppercase tracking-widest font-semibold leading-none">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest font-semibold text-text-muted tabular-nums mt-1">
                      {formatDate(bid.createdAt)}
                    </div>
                  </div>
                  <div className="font-serif text-base tabular-nums text-text-primary font-medium">
                    {formatCurrency(bid.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
