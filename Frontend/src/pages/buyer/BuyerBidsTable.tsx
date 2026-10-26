import { Link } from 'react-router-dom';
import type { Auction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState, StatusBadge } from '../../components/common';

export interface ActiveBidItem {
  auction: Auction;
  myBid: number;
}

interface BuyerBidsTableProps {
  activeBids: ActiveBidItem[];
  loading: boolean;
}

export const BuyerBidsTable = ({ activeBids, loading }: BuyerBidsTableProps) => {
  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-serif italic text-text-primary">Active Bids</h1>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : activeBids.length === 0 ? (
        <EmptyState
          title="No active bids"
          message="You haven't placed any bids recently. Discover live auctions to participate."
          action={
            <Link to="/auctions?status=LIVE" className="btn btn-primary mt-4 px-6 h-12 text-[10px]">
              Browse Live Auctions
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
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap text-right">
                  My Highest Bid
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap text-right">
                  Current Price
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-serif">
              {activeBids.map((bidObj, i) => (
                <tr key={i} className="hover:bg-surface-subtle transition-colors group">
                  <td className="px-6 py-4">
                    <Link
                      to={`/auctions/${bidObj.auction._id}`}
                      className="text-base text-text-primary group-hover:text-text-secondary transition-colors italic block"
                    >
                      {bidObj.auction.title || 'Unknown Item'}
                    </Link>
                    <div className="text-[10px] font-sans font-semibold text-text-muted uppercase tracking-widest mt-1">
                      Ends {formatDate(bidObj.auction.endTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 tabular-nums whitespace-nowrap text-lg text-text-primary text-right">
                    {formatCurrency(bidObj.myBid)}
                  </td>
                  <td className="px-6 py-4 tabular-nums whitespace-nowrap text-lg text-text-secondary text-right">
                    {formatCurrency(bidObj.auction.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <StatusBadge status={bidObj.auction.status} />
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
