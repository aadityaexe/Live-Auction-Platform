interface WalletActionBannerProps {
  onDeposit: () => void;
  onWithdraw: () => void;
}

export const WalletActionBanner = ({ onDeposit, onWithdraw }: WalletActionBannerProps) => {
  return (
    <div className="panel p-6 mb-8 bg-surface-subtle border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded bg-primary/10 text-primary mt-1 border border-primary/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-primary">Instant Wallet Fund Management</h4>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">
            Deposit funds directly into your internal ledger balance for active bids, or withdraw unencumbered available funds at any time.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
        <button 
          onClick={onDeposit} 
          className="btn btn-primary flex-1 md:flex-initial flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Deposit Funds
        </button>
        <button 
          onClick={onWithdraw} 
          className="btn btn-secondary flex-1 md:flex-initial flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Withdraw Funds
        </button>
      </div>
    </div>
  );
};
