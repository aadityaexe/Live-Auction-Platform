import { Link } from 'react-router-dom';
import type { Order, Auction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState, StatusBadge } from '../../components/common';

interface BuyerOrdersTableProps {
  orders: Order[];
  loading: boolean;
}

export const BuyerOrdersTable = ({ orders, loading }: BuyerOrdersTableProps) => {
  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-serif italic text-text-primary">Your Orders</h1>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          message="You haven't won any auctions yet."
          action={
            <Link to="/auctions" className="btn btn-primary mt-4 px-6 h-12 text-[10px]">
              Browse Auctions
            </Link>
          }
        />
      ) : (
        <div className="panel overflow-hidden border border-border p-2 bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] border border-border">
              <thead>
                <tr className="border-b border-border bg-transparent">
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest w-full">
                    Item
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-serif">
                {orders.map((o) => {
                  const auction = o.auctionId as Auction;
                  return (
                    <tr key={o._id} className="hover:bg-surface-subtle transition-colors group">
                      <td className="px-6 py-4 font-mono text-[10px] font-sans text-text-muted">
                        {o._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-base text-text-primary">
                        <Link
                          to={`/orders/${o._id}`}
                          className="group-hover:text-text-secondary transition-colors italic block"
                        >
                          {auction?.title ?? 'Auction'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-sans font-semibold uppercase tracking-widest text-text-secondary tabular-nums whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-lg text-text-primary text-right">
                        {formatCurrency(o.finalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={o.status} />
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
