import { formatCurrency } from '../../utils';

interface WalletBalanceCardsProps {
  balance: number;
  heldBalance: number;
  availableBalance: number;
}

export const WalletBalanceCards = ({
  balance,
  heldBalance,
  availableBalance,
}: WalletBalanceCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="panel p-6 border-l-4 border-l-primary relative overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          Total Ledger Balance
        </div>
        <div className="text-3xl font-serif text-text-primary font-bold tabular-nums">
          {formatCurrency(balance)}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Gross ledger funds linked to this account
        </p>
      </div>

      <div className="panel p-6 border-l-4 border-l-warning relative overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          Held / Escrowed Balance
        </div>
        <div className="text-3xl font-serif text-warning font-bold tabular-nums">
          {formatCurrency(heldBalance)}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Reserved for active bids & pending settlements
        </p>
      </div>

      <div className="panel p-6 border-l-4 border-l-success relative overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          Available for Bidding
        </div>
        <div className="text-3xl font-serif text-success font-bold tabular-nums">
          {formatCurrency(availableBalance)}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Unencumbered balance (Total - Held)
        </p>
      </div>
    </div>
  );
};
