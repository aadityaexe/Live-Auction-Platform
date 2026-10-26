import { Link } from 'react-router-dom';
import type { Auction, Bid, User } from '../../types';
import { formatCurrency } from '../../utils';

interface BiddingPanelProps {
  auction: Auction;
  user: User | null;
  effectiveStatus: string;
  effectivePrice: number;
  isLive: boolean;
  isHighestBidder: boolean | null | undefined;
  countdown: { text: string; isEnding: boolean; isOver: boolean };
  priceFlash: boolean;
  canBid: boolean | null | undefined;
  minBid: number;
  bidAmount: string;
  setBidAmount: (amount: string) => void;
  bidError: string;
  setBidError: (err: string) => void;
  placing: boolean;
  onPlaceBid: () => void;
  isWatched: boolean;
  onWatchlistToggle: () => void;
  bids: Bid[];
}

export const BiddingPanel = ({
  auction,
  user,
  effectiveStatus,
  effectivePrice,
  isLive,
  isHighestBidder,
  countdown,
  priceFlash,
  canBid,
  minBid,
  bidAmount,
  setBidAmount,
  bidError,
  setBidError,
  placing,
  onPlaceBid,
  isWatched,
  onWatchlistToggle,
  bids,
}: BiddingPanelProps) => {
  const getEntityId = (entity: unknown) => {
    if (!entity) return '';
    if (typeof entity === 'object') return (entity as { _id?: string; id?: string })._id || (entity as { _id?: string; id?: string }).id || '';
    return String(entity);
  };

  const winnerId = getEntityId(auction.winnerId || auction.highestBidderId);
  const currentUserId = user?.id || (user as { _id?: string })?._id;
  const isWinner = Boolean(currentUserId && winnerId && winnerId === currentUserId);

  const hasUserBidded = Boolean(
    currentUserId &&
    bids.some((b) => {
      const bId = getEntityId(b.bidderId);
      return bId === currentUserId;
    })
  );

  const isConcluded = !isLive && effectiveStatus !== 'SCHEDULED';

  return (
    <div className="bg-surface border border-border">
      {isLive ? (
        <div
          className={`px-5 py-3 border-b ${
            countdown.isEnding && !countdown.isOver ? 'bg-transparent border-warning/30' : 'bg-transparent border-border'
          } flex justify-between items-center`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-live animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-text-primary">Live</span>
          </div>
          {countdown.isEnding && !countdown.isOver && (
            <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Ending Soon</span>
          )}
        </div>
      ) : effectiveStatus === 'SCHEDULED' ? (
        <div className="px-5 py-3 border-b border-border bg-surface-subtle text-center">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Upcoming</span>
        </div>
      ) : isWinner ? (
        <div className="px-5 py-3 border-b border-success/40 bg-success/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-success">Auction Won</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-success">Victory</span>
        </div>
      ) : hasUserBidded ? (
        <div className="px-5 py-3 border-b border-border bg-surface-subtle flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Auction Concluded</span>
          <span className="text-[10px] uppercase tracking-widest text-warning font-semibold">Outbid</span>
        </div>
      ) : (
        <div className="px-5 py-3 border-b border-border bg-surface-subtle text-center">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Ended</span>
        </div>
      )}

      <div className="p-6 md:p-8 text-center">
        <div className="mb-6">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
            {effectiveStatus === 'SCHEDULED' ? 'Starting Bid' : isConcluded ? 'Final Winning Bid' : 'Current Bid'}
          </div>
          <div
            className={`text-4xl md:text-5xl font-serif tabular-nums tracking-tight transition-colors duration-200 py-1 ${
              priceFlash ? 'price-flash' : 'text-text-primary'
            }`}
          >
            {formatCurrency(effectivePrice)}
          </div>

          {isLive && isHighestBidder && (
            <div className="mt-3 text-[10px] uppercase tracking-widest font-semibold text-success border-t border-b border-success/30 py-1 inline-block">
              You hold the leading bid
            </div>
          )}
          {isLive && user && bids[0] && !isHighestBidder && hasUserBidded && (
            <div className="mt-3 text-[10px] uppercase tracking-widest font-semibold text-warning border-t border-b border-warning/30 py-1 inline-block">
              You have been outbid
            </div>
          )}
        </div>

        {isLive && (
          <div className="flex items-center justify-between py-4 border-t border-border">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Time Left</div>
            <div className={`text-xl font-serif tabular-nums ${countdown.isEnding ? 'text-live' : 'text-text-primary'}`}>
              {countdown.isOver ? '00:00:00' : countdown.text}
            </div>
          </div>
        )}

        {isConcluded && (
          <div className="pt-5 border-t border-border">
            {isWinner ? (
              <div className="p-5 border border-success/30 bg-success/5 rounded-sm mb-4 text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-9.375V4.875A1.875 1.875 0 0012.625 3h-1.25A1.875 1.875 0 009.5 4.875V5.25m6.75 3.75h2.25a2.25 2.25 0 002.25-2.25v-.75a2.25 2.25 0 00-2.25-2.25h-2.25m-6.75 5.25H7.5A2.25 2.25 0 015.25 7V6.25A2.25 2.25 0 017.5 4h2.25m0 5.25a4.5 4.5 0 009 0" />
                  </svg>
                </div>
                <h4 className="text-base font-serif font-bold text-text-primary mb-1">
                  Congratulations!
                </h4>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  You won this auction with a final bid of <strong className="text-text-primary">{formatCurrency(effectivePrice)}</strong>. Complete your payment to claim delivery.
                </p>
                <Link
                  to="/buyer"
                  className="btn btn-primary w-full h-11 text-xs uppercase tracking-wider font-semibold inline-flex items-center justify-center gap-2"
                >
                  Go to Orders & Claim →
                </Link>
              </div>
            ) : hasUserBidded ? (
              <div className="p-5 border border-border bg-surface-subtle rounded-sm mb-4 text-center">
                <div className="w-10 h-10 rounded-full bg-surface border border-border text-text-muted text-xl flex items-center justify-center mx-auto mb-3">
                  ⚖️
                </div>
                <h4 className="text-sm font-serif font-semibold text-text-primary mb-1">
                  Auction Concluded
                </h4>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Thank you for participating! Another bidder secured the winning bid of <span className="font-semibold text-text-primary">{formatCurrency(effectivePrice)}</span>.
                </p>
                <Link
                  to="/auctions"
                  className="btn btn-secondary w-full h-11 text-xs uppercase tracking-wider font-semibold inline-flex items-center justify-center"
                >
                  Browse More Auctions
                </Link>
              </div>
            ) : (
              <div className="p-4 border border-border bg-surface-subtle rounded-sm mb-4 text-center">
                <p className="text-xs text-text-secondary mb-3">
                  This auction has closed.
                </p>
                <Link
                  to="/auctions"
                  className="btn btn-secondary w-full h-11 text-xs uppercase tracking-wider font-semibold inline-flex items-center justify-center"
                >
                  Explore More Lots
                </Link>
              </div>
            )}
          </div>
        )}

        {canBid && !countdown.isOver && (
          <div className="pt-5 border-t border-border">
            <div className="flex justify-between items-end mb-4 text-left">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-primary">Your Bid</label>
              <span className="text-[11px] text-text-muted tabular-nums font-serif italic">
                Min: {formatCurrency(minBid)}
              </span>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-secondary font-serif text-lg pl-4 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                className="w-full bg-transparent border border-border h-12 pl-8 pr-4 font-serif text-xl text-center focus:outline-none focus:border-text-primary transition-colors placeholder:text-text-muted/50"
                placeholder={String(minBid)}
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  setBidError('');
                }}
                min={minBid}
                step={auction.minimumIncrement}
              />
            </div>

            {bidError && <div className="text-xs text-danger font-serif italic mb-4">{bidError}</div>}

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 5].map((mult) => {
                const quickAmt = effectivePrice + auction.minimumIncrement * mult;
                return (
                  <button
                    key={mult}
                    className="bg-transparent border border-border hover:border-text-primary py-2 text-xs font-serif italic text-text-secondary hover:text-text-primary transition-colors tabular-nums"
                    onClick={() => setBidAmount(String(quickAmt))}
                  >
                    +{formatCurrency(auction.minimumIncrement * mult)}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-primary w-full h-12 text-xs"
              onClick={onPlaceBid}
              disabled={placing}
            >
              {placing ? 'Processing...' : 'Place Bid'}
            </button>
          </div>
        )}

        {!user && isLive && (
          <div className="pt-5 border-t border-border text-center">
            <p className="text-sm font-serif text-text-secondary mb-4 italic">Sign in to place a bid on this item.</p>
            <Link to="/login" className="btn btn-primary w-full h-12">
              Sign In to Bid
            </Link>
          </div>
        )}

        {user?.role === 'SELLER' && isLive && (
          <div className="pt-5 border-t border-border">
            <div className="bg-transparent border border-border p-3 text-text-secondary font-serif italic text-sm text-center">
              Sellers cannot bid on items.
            </div>
          </div>
        )}

        {user && (
          <div className="mt-6 pt-5 border-t border-border">
            <button
              className="bg-transparent border border-border hover:border-text-primary w-full flex items-center justify-center h-12 text-[10px] uppercase tracking-widest font-semibold transition-colors text-text-primary"
              onClick={onWatchlistToggle}
            >
              {isWatched ? 'Remove Watchlist' : 'Add Watchlist'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
