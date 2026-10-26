import { formatCurrency } from "../../utils";
import type { AdminUser } from "./EditUserModal";

interface AdminUsersTableProps {
  users: AdminUser[];
  onOpenEdit: (user: AdminUser) => void;
  onUpdateUserStatus: (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") => void;
  onAdjustWallet: (id: string, amount: number) => void;
}

export const AdminUsersTable = ({
  users,
  onOpenEdit,
  onUpdateUserStatus,
  onAdjustWallet,
}: AdminUsersTableProps) => {
  return (
    <div className="panel overflow-hidden border border-border p-2 bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-border min-w-[1000px]">
          <thead>
            <tr className="border-b border-border bg-transparent text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              <th className="py-4 px-6">Username</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Wallet Balance</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-serif">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-surface-subtle transition-colors group">
                <td className="py-4 px-6 text-text-primary font-medium">{user.username}</td>
                <td className="py-4 px-6 text-text-secondary">{user.email}</td>
                <td className="py-4 px-6 text-[10px] font-sans font-semibold uppercase tracking-widest text-text-secondary">
                  {user.role}
                </td>
                <td className="py-4 px-6 tabular-nums text-text-primary text-lg">
                  {formatCurrency(user.walletBalance ?? 0)}
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => onAdjustWallet(user._id, 1000)}
                      className="text-[10px] font-sans border border-border px-1.5 py-0.5 hover:border-text-primary hover:text-text-primary transition-colors text-text-muted"
                    >
                      +1K
                    </button>
                    <button
                      onClick={() => onAdjustWallet(user._id, 10000)}
                      className="text-[10px] font-sans border border-border px-1.5 py-0.5 hover:border-text-primary hover:text-text-primary transition-colors text-text-muted"
                    >
                      +10K
                    </button>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-widest border ${
                      user.status === "ACTIVE"
                        ? "border-success/30 text-success"
                        : user.status === "SUSPENDED"
                        ? "border-warning/30 text-warning"
                        : "border-danger/30 text-danger"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenEdit(user)}
                      className="text-[10px] uppercase tracking-widest font-sans font-semibold py-1 px-2.5 bg-surface-subtle border border-border hover:border-primary hover:text-primary transition-colors text-text-primary"
                    >
                      Edit Details
                    </button>
                    <select
                      className="form-select text-[10px] uppercase tracking-widest font-sans font-semibold py-1.5 px-2 bg-transparent border-border hover:border-text-primary transition-colors"
                      value={user.status}
                      onChange={(e) =>
                        onUpdateUserStatus(user._id, e.target.value as "ACTIVE" | "SUSPENDED" | "BANNED")
                      }
                      disabled={user.role === "ADMIN"}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspend</option>
                      <option value="BANNED">Ban</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
