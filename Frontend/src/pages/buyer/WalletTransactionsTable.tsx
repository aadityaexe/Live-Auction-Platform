import type { WalletTransaction, Pagination } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState } from '../../components/common';

interface WalletTransactionsTableProps {
  transactions: WalletTransaction[];
  pagination: Pagination | null;
  loading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
}

const formatAmount = (val: { $numberDecimal?: string } | string | number | undefined): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
  return 0;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-success/10 text-success border border-success/30 rounded">
          Completed
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-warning/10 text-warning border border-warning/30 rounded">
          Pending
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-danger/10 text-danger border border-danger/30 rounded">
          Failed
        </span>
      );
    case 'REVERSED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-text-muted/10 text-text-secondary border border-border rounded">
          Reversed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-surface-subtle text-text-muted border border-border rounded">
          {status}
        </span>
      );
  }
};

const getTypeBadge = (type: string) => {
  const isPositive = ['CREDIT', 'REFUND', 'RELEASE'].includes(type);
  return (
    <span className={`font-mono text-xs font-semibold uppercase tracking-wider ${isPositive ? 'text-success' : 'text-danger'}`}>
      {type}
    </span>
  );
};

export const WalletTransactionsTable = ({
  transactions,
  pagination,
  loading,
  page,
  onPageChange,
}: WalletTransactionsTableProps) => {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h3 className="text-lg font-serif font-semibold text-text-primary">Ledger Transaction History</h3>
          <p className="text-xs text-text-secondary">Immutable audit trail of all financial movements</p>
        </div>
        {loading && <Spinner size={20} />}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No Ledger Transactions"
          message="Your wallet ledger has no recorded movements yet. Transactions appear automatically when bids are locked, released, or paid."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Description / Reference</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const amountVal = formatAmount(tx.amount);
                const isCredit = ['CREDIT', 'REFUND', 'RELEASE'].includes(tx.type);
                return (
                  <tr key={tx._id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-text-secondary whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getTypeBadge(tx.type)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-text-primary line-clamp-1">
                        {tx.description || 'Ledger Entry'}
                      </div>
                      {tx.referenceId && (
                        <div className="text-xs text-text-muted font-mono">
                          Ref: {tx.referenceId}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-medium whitespace-nowrap ${isCredit ? 'text-success' : 'text-danger'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(amountVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-sm text-text-secondary">
              <span>
                Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page <= 1 || loading}
                  className="btn btn-secondary btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page >= pagination.pages || loading}
                  className="btn btn-secondary btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
