import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAllRead } from '../../store/notificationSlice';
import { orderApi } from '../../services/api/other.api';
import { walletApi } from '../../services/api/payment.api';
import type { Order, Auction, Wallet } from '../../types';
import { formatDate } from '../../utils';
import { Spinner, EmptyState } from '../../components/common';
import { BuyerBidsTable, ActiveBidItem } from './BuyerBidsTable';
import { BuyerWatchlistTable } from './BuyerWatchlistTable';
import { BuyerOrdersTable } from './BuyerOrdersTable';
import { BuyerWonAuctionsTable, WonAuctionItem } from './BuyerWonAuctionsTable';
import { BuyerDashboardSidebar, BuyerTab as Tab } from './BuyerDashboardSidebar';

const BuyerDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const { notifications, unreadCount, loading: nLoading } = useAppSelector(s => s.notifications);
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = (location.hash.replace('#', '') || 'bids') as Tab;
  
  const [watchlist, setWatchlist] = useState<{ auctionId: Auction }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wonAuctions, setWonAuctions] = useState<WonAuctionItem[]>([]);
  const [activeBids, setActiveBids] = useState<ActiveBidItem[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'BUYER') { navigate('/'); return; }
    dispatch(fetchNotifications());
    walletApi.getWallet().then(res => setWallet(res.data.data)).catch(() => {});
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;

    const loadData = async () => {
      setLoading(true);
      if (currentTab === 'bids') setBidsLoading(true);
      try {
        if (currentTab === 'watchlist') {
          const { api } = await import('../../services/api/client');
          const { data } = await api.get('/users/me/watchlist');
          if (isCurrent) setWatchlist(data.watchlist || []);
        } else if (currentTab === 'orders') {
          const { data } = await orderApi.getOrders();
          if (isCurrent) setOrders(data.orders);
        } else if (currentTab === 'bids') {
          const { api } = await import('../../services/api/client');
          const { data } = await api.get('/users/me/bids');
          if (isCurrent) setActiveBids(data.activeBids || []);
        } else if (currentTab === 'won') {
          const { userApi } = await import('../../services/api/other.api');
          const { data } = await userApi.getWonAuctions();
          if (isCurrent) setWonAuctions(data.wonAuctions || []);
        }
      } catch {
        void 0;
      } finally {
        if (isCurrent) {
          setLoading(false);
          setBidsLoading(false);
        }
      }
    };

    loadData();
    return () => { isCurrent = false; };
  }, [currentTab, user]);

  if (!user) return null;

  const sidebarLinks: { id: Tab; label: string; count?: number }[] = [
    { id: 'bids', label: 'Active Bids' },
    { id: 'won', label: 'Won Auctions' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'orders', label: 'Orders', count: orders.filter(o => o.status === 'PAYMENT_PENDING').length || undefined },
    { id: 'notifications', label: 'Notifications', count: unreadCount || undefined },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-base flex flex-col md:flex-row">
      
      <BuyerDashboardSidebar
        user={user}
        wallet={wallet}
        currentTab={currentTab}
        sidebarLinks={sidebarLinks}
      />

      <main className="flex-1 min-w-0 p-6 md:p-10">
        {currentTab === 'bids' && (
          <BuyerBidsTable activeBids={activeBids} loading={bidsLoading} />
        )}

        {currentTab === 'won' && (
          <BuyerWonAuctionsTable wonAuctions={wonAuctions} loading={loading} />
        )}

        {currentTab === 'watchlist' && (
          <BuyerWatchlistTable watchlist={watchlist} loading={loading} />
        )}

        {currentTab === 'orders' && (
          <BuyerOrdersTable orders={orders} loading={loading} />
        )}

        {currentTab === 'notifications' && (
          <div className="animate-fade-in max-w-5xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
              <h1 className="text-3xl md:text-4xl font-serif italic text-text-primary flex items-center gap-3">
                Notifications
                {unreadCount > 0 && <span className="bg-transparent border border-text-muted text-text-secondary text-[10px] uppercase tracking-widest px-2 py-0.5 font-sans font-semibold">{unreadCount}</span>}
              </h1>
              {unreadCount > 0 && (
                <button className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary hover:text-text-primary transition-colors border border-transparent hover:border-border px-3 py-1.5" onClick={() => dispatch(markAllRead())}>
                  Mark all as read
                </button>
              )}
            </div>

            {nLoading ? (
              <div className="py-20 flex justify-center"><Spinner /></div>
            ) : notifications.length === 0 ? (
              <EmptyState title="No notifications" message="You have no alerts at this time." />
            ) : (
              <div className="panel p-2 border border-border bg-surface">
                <div className="divide-y divide-border border border-border">
                  {notifications.map(n => (
                    <div key={n._id} className={`p-6 flex gap-4 transition-colors hover:bg-surface-subtle ${!n.isRead ? 'bg-surface-subtle/30' : 'bg-transparent'}`}>
                      <div className="mt-1 flex-shrink-0">
                        <div className={`w-1.5 h-1.5 ${!n.isRead ? 'bg-live animate-pulse' : 'bg-transparent border border-border'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <p className={`text-base font-serif italic ${!n.isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest tabular-nums whitespace-nowrap">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-serif text-text-secondary">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default BuyerDashboard;
