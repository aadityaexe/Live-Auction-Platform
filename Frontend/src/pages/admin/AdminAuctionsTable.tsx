import { formatCurrency } from "../../utils";

export interface AdminAuction {
  _id: string;
  title: string;
  currentPrice: number;
  status: string;
  seller?: { username?: string; email?: string };
  sellerId?: { username?: string; email?: string } | string;
  endTime?: string;
  createdAt?: string;
}

interface AdminAuctionsTableProps {
  auctions: AdminAuction[];
  onUpdateAuctionStatus: (id: string, status: string) => void;
  onDeleteAuction: (id: string) => void;
}

export const AdminAuctionsTable = ({
  auctions,
  onUpdateAuctionStatus,
  onDeleteAuction,
}: AdminAuctionsTableProps) => {
  return (
    <div className="panel overflow-hidden border border-border p-2 bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-border min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-transparent text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              <th className="py-4 px-6">Title</th>
              <th className="py-4 px-6">Seller</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Current Price</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-serif">
            {auctions.map((auction) => (
              <tr key={auction._id} className="hover:bg-surface-subtle transition-colors group">
                <td className="py-4 px-6 text-text-primary italic max-w-[200px] truncate" title={auction.title}>
                  {auction.title}
                </td>
                <td className="py-4 px-6 text-text-secondary">
                  {(typeof auction.sellerId === "object" && auction.sellerId?.username) ||
                    auction.seller?.username ||
                    "Unknown"}
                </td>
                <td className="py-4 px-6">
                  <select
                    className={`form-select text-[10px] uppercase tracking-widest font-sans font-semibold py-1.5 px-2 bg-transparent border-border hover:border-text-primary transition-colors ${
                      auction.status === "LIVE" ? "text-live" : "text-text-secondary"
                    }`}
                    value={auction.status}
                    onChange={(e) => onUpdateAuctionStatus(auction._id, e.target.value)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="LIVE">Live</option>
                    <option value="ENDING">Ending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
                <td className="py-4 px-6 text-text-primary text-right tabular-nums text-lg">
                  {formatCurrency(auction.currentPrice)}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onDeleteAuction(auction._id)}
                    className="text-[10px] font-sans font-semibold uppercase tracking-widest text-danger hover:text-danger-hover transition-colors border border-danger/20 hover:border-danger/50 px-3 py-1.5 bg-transparent"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {auctions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted italic">
                  No auctions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
