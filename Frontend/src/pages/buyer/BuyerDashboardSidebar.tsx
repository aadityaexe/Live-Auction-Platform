import { Link } from 'react-router-dom';
import type { User, Wallet } from '../../types';
import { formatCurrency } from '../../utils';

export type BuyerTab = 'bids' | 'won' | 'watchlist' | 'orders' | 'notifications';

interface SidebarLink {
  id: BuyerTab;
  label: string;
  count?: number;
}

interface BuyerDashboardSidebarProps {
  user: User;
  wallet: Wallet | null;
  currentTab: BuyerTab;
  sidebarLinks: SidebarLink[];
}

export const BuyerDashboardSidebar = ({
  user,
  wallet,
  currentTab,
  sidebarLinks,
}: BuyerDashboardSidebarProps) => {
  return (
    <aside className="w-full md:w-64 shrink-0 bg-transparent border-r border-border md:min-h-[calc(100vh-56px)]">
      <div className="p-6">
        <div className="w-12 h-12 bg-transparent border border-border flex items-center justify-center text-xl font-serif text-text-secondary mb-6">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-serif italic text-text-primary">{user.username}</h2>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mt-1">
          {user.email}
        </p>
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
              Available Funds
            </p>
            <Link to="/wallet" className="text-[10px] text-accent hover:underline">
              View Ledger
            </Link>
          </div>
          <p className="text-2xl font-serif text-text-primary tabular-nums">
            {wallet ? formatCurrency(wallet.availableBalance) : '₹0'}
          </p>
          {wallet && parseFloat(wallet.heldBalance) > 0 && (
            <p className="text-[11px] text-text-muted mt-1">
              Held in Escrow: {formatCurrency(parseFloat(wallet.heldBalance))}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Link
              to="/wallet"
              className="btn btn-primary btn-sm flex-1 text-center justify-center text-[11px] py-1"
            >
              Deposit
            </Link>
            <Link
              to="/wallet"
              className="btn btn-secondary btn-sm flex-1 text-center justify-center text-[11px] py-1"
            >
              Withdraw
            </Link>
          </div>
        </div>
      </div>

      <nav className="px-3 pb-6 space-y-1">
        <div className="px-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-4 mt-6">
          Dashboard
        </div>
        {sidebarLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <Link
              key={link.id}
              to={`#${link.id}`}
              className={`flex items-center justify-between px-3 py-2 text-sm font-serif italic transition-colors border border-transparent ${
                isActive
                  ? 'border-border bg-surface-subtle text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:border-border'
              }`}
            >
              {link.label}
              {link.count ? (
                <span className="bg-transparent border border-text-muted text-text-secondary text-[10px] font-sans font-semibold uppercase tracking-widest px-1.5 py-0.5 tabular-nums min-w-[20px] text-center">
                  {link.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
