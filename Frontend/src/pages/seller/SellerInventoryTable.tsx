import { Link } from 'react-router-dom';
import type { Auction, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Spinner, EmptyState, StatusBadge, Pagination } from '../../components/common';

interface SellerInventoryTableProps {
  auctions: Auction[];
  loading: boolean;
  status: string;
  onStatusChange: (status: string) => void;
  pagination: PaginationType | null;
  onPageChange: (page: number) => void;
}

export const SellerInventoryTable = ({
  auctions,
  loading,
  status,
  onStatusChange,
  pagination,
  onPageChange,
}: SellerInventoryTableProps) => {
  return (
    <div className="panel overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface">
        <h2 className="text-xl font-serif italic text-text-primary">Your Inventory</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary whitespace-nowrap">
            Filter by Status
          </label>
          <select
            className="form-select min-w-[160px] text-[10px] uppercase tracking-widest font-semibold bg-transparent border-border hover:border-text-primary transition-colors py-2"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="ENDED">Ended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          title="No Listings Found"
          message="You haven't created any auctions matching this criteria."
          action={
            <Link to="/seller/create" className="btn btn-primary mt-4">
              Create Your First Listing
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto bg-surface p-2">
          <table className="w-full text-left border-collapse min-w-[800px] border border-border">
            <thead>
              <tr className="border-b border-border bg-transparent text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                <th className="px-6 py-4 w-full">Item Details</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Current Price</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Bids</th>
                <th className="px-6 py-4 whitespace-nowrap">End Date</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-serif">
              {auctions.map((a) => (
                <tr key={a._id} className="hover:bg-surface-subtle transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-transparent border border-border shrink-0 flex items-center justify-center p-0.5">
                        <div className="w-full h-full border border-border bg-surface-subtle flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-text-primary/5 mix-blend-multiply pointer-events-none z-10"></div>
                          {a.images?.[0] ? (
                            <img src={a.images[0]} alt="" className="w-full h-full object-cover grayscale-[10%]" />
                          ) : (
                            <span className="text-[9px] text-text-muted font-sans font-semibold uppercase tracking-widest">
                              No Img
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/auctions/${a._id}`}
                          className="text-base text-text-primary truncate max-w-[240px] italic hover:text-text-secondary transition-colors block"
                        >
                          {a.title}
                        </Link>
                        <div className="text-[10px] font-sans font-semibold text-text-muted uppercase tracking-widest mt-1">
                          Created {formatDate(a.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-lg tabular-nums whitespace-nowrap text-text-primary">
                    {formatCurrency(a.currentPrice)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-text-secondary whitespace-nowrap">
                    {a.bidCount}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-sans font-semibold uppercase tracking-widest text-text-secondary tabular-nums whitespace-nowrap">
                    {formatDate(a.endTime)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 font-sans">
                      <Link to={`/auctions/${a._id}`} className="btn btn-secondary h-8 px-3 text-[10px]">
                        View
                      </Link>
                      {(a.status === 'DRAFT' || a.status === 'SCHEDULED') && (
                        <Link
                          to={`/seller/auctions/${a._id}/edit`}
                          className="btn btn-ghost h-8 px-3 text-[10px] border border-border"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && !loading && (
        <div className="p-5 border-t border-border bg-surface-subtle/50 flex justify-center">
          <Pagination page={pagination.page} pages={pagination.pages} onPage={onPageChange} />
        </div>
      )}
    </div>
  );
};
