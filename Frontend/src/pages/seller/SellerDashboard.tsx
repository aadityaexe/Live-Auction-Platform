import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { auctionApi } from '../../services/api/auction.api';
import { walletApi } from '../../services/api/payment.api';
import type { Auction, Pagination as PaginationType, Wallet } from '../../types';
import { formatCurrency } from '../../utils';
import { SellerInventoryTable } from './SellerInventoryTable';

const SellerDashboard = () => {
  const { user } = useAppSelector(s => s.auth);
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'SELLER') { navigate('/'); return; }
    walletApi.getWallet().then(res => setWallet(res.data.data)).catch(() => {});
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    
    const fetchAuctions = async () => {
      setLoading(true);
      const params: Record<string, string | number> = { sellerId: user.id, page, limit: 10 };
      if (status) params.status = status;
      try {
        const { data } = await auctionApi.getAuctions(params);
        if (isCurrent) {
          setAuctions(data.data);
          setPagination(data.pagination);
        }
      } catch {
        void 0;
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchAuctions();
    return () => { isCurrent = false; };
  }, [user, page, status]);

  if (!user) return null;

  const stats = [
    { 
      label: 'Available Balance', 
      value: formatCurrency(
        wallet 
          ? (typeof wallet.availableBalance === 'number' 
              ? wallet.availableBalance 
              : ((typeof wallet.balance === 'number' ? wallet.balance : parseFloat(wallet.balance) || 0) - 
                 (typeof wallet.heldBalance === 'number' ? wallet.heldBalance : parseFloat(wallet.heldBalance) || 0)))
          : (user.walletBalance || 0)
      ), 
      link: '/wallet' 
    },
    { label: 'Held in Escrow', value: formatCurrency(wallet ? (typeof wallet.heldBalance === 'number' ? wallet.heldBalance : parseFloat(wallet.heldBalance) || 0) : 0), link: '/wallet' },
    { label: 'Total Auctions', value: pagination?.total ?? 0 },
    { label: 'Live Listings', value: auctions.filter(a => a.status === 'LIVE' || a.status === 'ENDING').length },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-base py-12">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-border">
          <div>
            <h1 className="text-4xl font-serif italic mb-2">Seller Dashboard</h1>
            <p className="text-sm font-serif text-text-secondary">Manage your listings, auction revenue, and track performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/wallet" className="btn btn-secondary h-10 flex items-center gap-1.5">
              <span>View Ledger</span>
            </Link>
            <Link to="/wallet" className="btn btn-secondary h-10 border-success/30 hover:border-success text-success">
              + Deposit
            </Link>
            <Link to="/wallet" className="btn btn-secondary h-10 border-warning/30 hover:border-warning text-warning">
              - Withdraw
            </Link>
            <Link to="/seller/create" className="btn btn-primary h-10">
              Create Listing
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map(s => {
            const content = (
              <div className="panel p-6 relative group transition-all">
                <div className="absolute top-1 left-1 right-1 bottom-1 border border-border pointer-events-none group-hover:border-text-primary/40 transition-colors"></div>
                <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3 relative z-10 flex items-center justify-between">
                  <span>{s.label}</span>
                  {s.link && <span className="text-[9px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">LEDGER &rarr;</span>}
                </div>
                <div className="text-4xl font-serif text-text-primary tabular-nums relative z-10">{s.value}</div>
              </div>
            );
            return s.link ? (
              <Link key={s.label} to={s.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={s.label}>{content}</div>
            );
          })}
        </div>

        <SellerInventoryTable
          auctions={auctions}
          loading={loading}
          status={status}
          onStatusChange={(newStatus) => {
            setStatus(newStatus);
            setPage(1);
          }}
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default SellerDashboard;
