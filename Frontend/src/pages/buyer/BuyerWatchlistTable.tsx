import { Link } from 'react-router-dom';
import type { Auction } from '../../types';
import { formatCurrency } from '../../utils';
import { Spinner, EmptyState, StatusBadge } from '../../components/common';

export interface WatchlistItem {
  auctionId: Auction;
}

interface BuyerWatchlistTableProps {
  watchlist: WatchlistItem[];
  loading: boolean;
}

export const BuyerWatchlistTable = ({ watchlist, loading }: BuyerWatchlistTableProps) => {
  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-serif italic text-text-primary">Watchlist</h1>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : watchlist.length === 0 ? (
        <EmptyState
          title="Watchlist empty"
          message="Save items to your watchlist to track their progress."
          action={
            <Link to="/auctions" className="btn btn-primary mt-4 px-6 h-12 text-[10px]">
              Explore Auctions
            </Link>
          }
        />
      ) : (
        <div className="panel overflow-hidden border border-border p-2 bg-surface">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="border-b border-border bg-transparent">
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest w-full">
                  Item
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap">
                  Current Bid
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-serif">
              {watchlist.map((item, i) => (
                <tr key={i} className="hover:bg-surface-subtle transition-colors group">
                  <td className="px-6 py-4">
                    <Link
                      to={`/auctions/${item.auctionId?._id}`}
                      className="text-base text-text-primary group-hover:text-text-secondary transition-colors italic block"
                    >
                      {item.auctionId?.title || 'Unknown Item'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 tabular-nums whitespace-nowrap text-lg text-text-primary">
                    {formatCurrency(item.auctionId?.currentPrice ?? 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <StatusBadge status={item.auctionId?.status ?? ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
