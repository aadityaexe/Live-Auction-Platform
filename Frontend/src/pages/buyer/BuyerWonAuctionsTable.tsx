import { Link } from 'react-router-dom';
import type { Auction, Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState, StatusBadge } from '../../components/common';

export interface WonAuctionItem {
  auction: Auction;
  order: Order | null;
}

interface BuyerWonAuctionsTableProps {
  wonAuctions: WonAuctionItem[];
  loading: boolean;
}

export const BuyerWonAuctionsTable = ({ wonAuctions, loading }: BuyerWonAuctionsTableProps) => {
  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif italic text-text-primary">Won Auctions</h1>
          <p className="text-xs text-text-secondary mt-1">Auctions where you emerged as the highest winning bidder.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : wonAuctions.length === 0 ? (
        <EmptyState
          title="No won auctions yet"
          message="Keep participating in live bidding to secure items."
          action={
            <Link to="/auctions" className="btn btn-primary mt-4 px-6 h-12 text-[10px]">
              Explore Auctions
            </Link>
          }
        />
      ) : (
        <div className="panel overflow-hidden border border-border p-2 bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px] border border-border">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    Auction Item
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right">
                    Winning Bid
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-serif">
                {wonAuctions.map(({ auction, order }) => {
                  const finalPrice = order?.finalAmount ?? auction.currentPrice;
                  const orderStatus = order?.status ?? 'PAYMENT_PENDING';

                  return (
                    <tr key={auction._id} className="hover:bg-surface-subtle transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded bg-surface-subtle border border-border shrink-0 flex items-center justify-center overflow-hidden">
                            {auction?.images?.[0] ? (
                              <img src={auction.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Item</span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/auctions/${auction._id}`}
                              className="text-base font-serif italic text-text-primary group-hover:text-accent transition-colors block"
                            >
                              {auction?.title}
                            </Link>
                            {order?.createdAt && (
                              <div className="text-[10px] text-text-muted font-sans mt-0.5">
                                Won on {formatDate(order.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-lg font-medium text-text-primary">
                        {formatCurrency(finalPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={orderStatus} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order ? (
                          <Link
                            to={`/orders/${order._id}`}
                            className={`btn btn-sm text-[10px] px-3 py-1.5 ${
                              orderStatus === 'PAYMENT_PENDING'
                                ? 'btn-primary'
                                : 'btn-secondary'
                            }`}
                          >
                            {orderStatus === 'PAYMENT_PENDING'
                              ? 'Pay Now'
                              : orderStatus === 'PROCESSING' || orderStatus === 'SHIPPED'
                              ? 'Track / Claim'
                              : 'View Order'}
                          </Link>
                        ) : (
                          <span className="text-xs text-text-muted">Order processing</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
