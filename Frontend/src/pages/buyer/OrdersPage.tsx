import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { orderApi } from '../../services/api/other.api';
import type { Order, Auction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState, StatusBadge } from '../../components/common';

const OrdersPage = () => {
  const { user } = useAppSelector(s => s.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    orderApi.getOrders().then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-[calc(100vh-56px)] py-12">
      <div className="container-custom max-w-5xl">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl mb-2">My Orders</h1>
          <p className="text-sm text-text-secondary">Track your auction wins, payments, and fulfillments.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={40} /></div>
        ) : orders.length === 0 ? (
          <EmptyState 
            title="No Orders Yet" 
            message="Win an auction to create your first order."
            action={<Link to="/auctions" className="btn btn-primary mt-4">Browse Auctions</Link>} 
          />
        ) : (
          <div className="panel overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle">
                    <th className="px-5 py-4 text-xs font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap">Order ID</th>
                    <th className="px-5 py-4 text-xs font-semibold text-text-muted uppercase tracking-widest w-full">Item Details</th>
                    <th className="px-5 py-4 text-xs font-semibold text-text-muted uppercase tracking-widest text-right whitespace-nowrap">Date</th>
                    <th className="px-5 py-4 text-xs font-semibold text-text-muted uppercase tracking-widest text-right whitespace-nowrap">Amount</th>
                    <th className="px-5 py-4 text-xs font-semibold text-text-muted uppercase tracking-widest text-right whitespace-nowrap">Status</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {orders.map(o => {
                    const auction = o.auctionId as Auction;
                    return (
                      <tr key={o._id} className="hover:bg-surface-subtle transition-colors group">
                        <td className="px-5 py-4 font-mono text-text-muted whitespace-nowrap text-xs">
                          {o._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-surface-subtle border border-border shrink-0 flex items-center justify-center overflow-hidden">
                              {auction?.images?.[0] ? (
                                <img src={auction.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Img</span>
                              )}
                            </div>
                            <div className="font-medium text-text-primary line-clamp-1">{auction?.title || 'Unknown Item'}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-text-secondary tabular-nums whitespace-nowrap">
                          {formatDate(o.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right font-medium tabular-nums whitespace-nowrap">
                          {formatCurrency(o.finalAmount)}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <StatusBadge status={o.status} />
                          {o.status === 'PAYMENT_PENDING' && (
                            <div className="text-[10px] text-danger mt-1.5 uppercase tracking-widest font-medium">
                              Pay by {formatDate(o.paymentDeadline)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                           <Link to={`/orders/${o._id}`} className="btn btn-secondary btn-sm opacity-0 group-hover:opacity-100 transition-opacity">View</Link>
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
    </div>
  );
};

export default OrdersPage;
