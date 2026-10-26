import { formatCurrency } from "../../utils";

export interface AdminOrder {
  _id: string;
  status: string;
  finalAmount: number;
  auctionId?: { title?: string };
  buyerId?: { username?: string };
  sellerId?: { username?: string };
  createdAt?: string;
}

interface AdminOrdersTableProps {
  orders: AdminOrder[];
}

export const AdminOrdersTable = ({ orders }: AdminOrdersTableProps) => {
  return (
    <div className="panel overflow-hidden border border-border p-2 bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-border min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-transparent text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              <th className="py-4 px-6">Item</th>
              <th className="py-4 px-6">Buyer</th>
              <th className="py-4 px-6">Seller</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-serif">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-surface-subtle transition-colors group">
                <td className="py-4 px-6 text-text-primary italic max-w-[200px] truncate" title={order.auctionId?.title}>
                  {order.auctionId?.title || "Unknown"}
                </td>
                <td className="py-4 px-6 text-text-secondary">{order.buyerId?.username || "Unknown"}</td>
                <td className="py-4 px-6 text-text-secondary">{order.sellerId?.username || "Unknown"}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-widest border border-border text-text-secondary">
                    {order.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-text-primary text-right tabular-nums text-lg">
                  {formatCurrency(order.finalAmount)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted italic">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
