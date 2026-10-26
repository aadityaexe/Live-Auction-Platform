import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { walletApi } from '../../services/api/payment.api';
import type { Wallet, WalletTransaction, Pagination } from '../../types';
import { Spinner, ErrorMessage } from '../../components/common';
import { WalletModal } from './WalletModal';
import { WalletTransactionsTable } from './WalletTransactionsTable';
import { WalletBalanceCards } from './WalletBalanceCards';
import { WalletActionBanner } from './WalletActionBanner';

const WalletPage = () => {
  const { user, initialized } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [modalType, setModalType] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      navigate('/login');
      return;
    }
    let ignore = false;
    walletApi.getWallet()
      .then(res => {
        if (!ignore) {
          setWallet(res.data.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
          if (axiosErr.response?.status !== 401) {
            setError(axiosErr.response?.data?.message || 'Failed to fetch wallet details');
          }
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [initialized, user, navigate]);

  useEffect(() => {
    if (!initialized || !user) return;
    let ignore = false;
    walletApi.getTransactions({ page, limit: 10 })
      .then(res => {
        if (!ignore) {
          setTransactions(res.data.data.transactions);
          setPagination(res.data.data.pagination);
          setTxLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTxLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [page, initialized, user]);

  const refreshTransactions = (pageNum: number) => {
    setTxLoading(true);
    walletApi.getTransactions({ page: pageNum, limit: 10 })
      .then(res => {
        setTransactions(res.data.data.transactions);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  };



  const reloadWallet = () => {
    setLoading(true);
    setError('');
    walletApi.getWallet()
      .then(res => {
        setWallet(res.data.data);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status !== 401) {
          setError(axiosErr.response?.data?.message || 'Failed to fetch wallet details');
        }
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <Spinner size={36} />
        <span className="font-serif italic text-text-muted text-sm mt-3">Loading wallet ledger...</span>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="container-custom py-12">
        <ErrorMessage message={error} />
        <div className="text-center mt-6">
          <button onClick={reloadWallet} className="btn btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rawBalance = wallet ? parseFloat(wallet.balance) : 0;
  const rawHeld = wallet ? parseFloat(wallet.heldBalance) : 0;
  const rawAvailable = wallet ? wallet.availableBalance : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] py-10 bg-base">
      <div className="container-custom max-w-5xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted font-medium">
          <Link to="/" className="hover:text-text-primary">Home</Link>
          <span>/</span>
          <span className="text-text-primary">Wallet & Ledger</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-serif text-text-primary mb-1">Internal Ledger & Wallet</h1>
            <p className="text-sm text-text-secondary">
              Secure ledger balances for auction security deposits, holding pools, and order payments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest font-semibold text-text-secondary">
              Currency: {wallet?.currency || 'INR'} (₹)
            </span>
          </div>
        </div>

        <WalletBalanceCards
          balance={rawBalance}
          heldBalance={rawHeld}
          availableBalance={rawAvailable}
        />

        <WalletActionBanner
          onDeposit={() => { setModalType('DEPOSIT'); setActionMessage(null); }}
          onWithdraw={() => { setModalType('WITHDRAW'); setActionMessage(null); }}
        />

        {actionMessage && (
          <div className={`panel p-4 mb-8 flex items-center justify-between gap-3 ${
            actionMessage.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{actionMessage.type === 'success' ? 'Success:' : 'Error:'}</span>
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {modalType && (
          <WalletModal
            modalType={modalType}
            availableBalance={rawAvailable}
            onClose={() => setModalType(null)}
            onSuccess={(updatedWallet, msg) => {
              setWallet(updatedWallet);
              setActionMessage({ type: 'success', text: msg });
              refreshTransactions(1);
              setPage(1);
            }}
            onError={(msg) => setActionMessage({ type: 'error', text: msg })}
          />
        )}

        <WalletTransactionsTable
          transactions={transactions}
          pagination={pagination}
          loading={txLoading}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default WalletPage;
