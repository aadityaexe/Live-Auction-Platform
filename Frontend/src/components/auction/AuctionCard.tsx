import { Link } from 'react-router-dom';
import type { Auction } from '../../types';
import { formatCurrency, getTimeLeft } from '../../utils';

interface AuctionCardProps {
  auction: Auction;
}

export const AuctionCard = ({ auction }: AuctionCardProps) => {
  const timeInfo = getTimeLeft(auction.endTime);
  const isLive = auction.status === 'LIVE' || auction.status === 'ENDING';

  return (
    <Link 
      to={`/auctions/${auction._id}`} 
      className="group block bg-transparent border-b border-border overflow-hidden hover:border-text-primary transition-colors pb-4"
    >
      <div className="relative aspect-[4/3] bg-surface-subtle overflow-hidden border border-border mb-4">
        <div className="absolute inset-0 bg-text-primary/5 mix-blend-multiply pointer-events-none z-10"></div>
        {auction.images?.[0] ? (
          <img 
            src={auction.images[0]} 
            alt={auction.title} 
            className="w-full h-full object-cover transition-transform duration-700 grayscale-[15%] group-hover:scale-105 group-hover:grayscale-0" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-serif italic">
            No Image
          </div>
        )}

        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-transparent border border-live/30 text-[10px] uppercase tracking-widest font-semibold z-20">
            <span className="w-1.5 h-1.5 bg-live animate-pulse-fast"></span>
            <span className="text-live">Live</span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between h-[110px] px-2">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-serif text-lg text-text-primary line-clamp-1 flex-1 font-medium">
              {auction.title}
            </h3>
            {auction.status === 'SCHEDULED' && (
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-medium shrink-0 pt-0.5">Upcoming</span>
            )}
            {auction.status === 'ENDED' && (
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-medium shrink-0 pt-0.5">Ended</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
            <span className="tabular-nums">
              {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}
            </span>
            {isLive && !timeInfo.isOver && (
              <span className={`tabular-nums ${timeInfo.isEnding ? "text-danger font-medium" : ""}`}>
                {timeInfo.text}
              </span>
            )}
            {auction.status === 'SCHEDULED' && (
              <span className="tabular-nums text-text-muted">
                {new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(auction.startTime))}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-border pt-2 flex justify-between items-end">
          <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
            {auction.status === 'SCHEDULED' ? 'Starting Bid' : 'Current Bid'}
          </div>
          <div className="text-xl font-serif text-text-primary tabular-nums tracking-tight">
            {formatCurrency(auction.currentPrice)}
          </div>
        </div>
      </div>
    </Link>
  );
};
