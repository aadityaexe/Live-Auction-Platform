import { useEffect, useState } from "react";
import { getPlatformStats, getUsers, updateUserStatus, getAuctions, deleteAuction, getOrders, adjustWallet, updateAuctionStatus } from "../../services/api/admin.api";
import { Spinner } from "../../components/common";
import { addToast } from "../../utils/toast";
import { formatCurrency } from "../../utils";
import { EditUserModal, AdminUser } from "./EditUserModal";
import { AdminUsersTable } from "./AdminUsersTable";
import { AdminAuctionsTable, AdminAuction } from "./AdminAuctionsTable";
import { AdminOrdersTable, AdminOrder } from "./AdminOrdersTable";
import { AdminStatsCards, PlatformStats } from "./AdminStatsCards";

type AdminTab = "STATS" | "USERS" | "AUCTIONS" | "ORDERS";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("STATS");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (activeTab === "STATS") {
          const data = await getPlatformStats();
          if (!ignore) setStats(data);
        } else if (activeTab === "USERS") {
          const data = await getUsers();
          if (!ignore) setUsers(data.users);
        } else if (activeTab === "AUCTIONS") {
          const data = await getAuctions();
          if (!ignore) setAuctions(data.auctions);
        } else if (activeTab === "ORDERS") {
          const data = await getOrders();
          if (!ignore) setOrders(data.orders);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          addToast('error', axiosErr.response?.data?.message || "Failed to fetch data");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [activeTab]);

  const handleUpdateUserStatus = async (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") => {
    try {
      await updateUserStatus(id, status);
      setUsers(users.map(u => u._id === id ? { ...u, status } : u));
      addToast('success', "User status updated");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteAuction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this auction?")) return;
    try {
      await deleteAuction(id);
      setAuctions(auctions.filter(a => a._id !== id));
      addToast('success', "Auction deleted");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || "Failed to delete auction");
    }
  };

  const handleAdjustWallet = async (id: string, amount: number) => {
    try {
      const res = await adjustWallet(id, amount);
      setUsers(users.map(u => u._id === id ? { ...u, walletBalance: res.user.walletBalance } : u));
      addToast('success', `Wallet adjusted by ${formatCurrency(amount)}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || "Failed to adjust wallet");
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
  };

  const handleUpdateAuctionStatus = async (id: string, status: string) => {
    try {
      await updateAuctionStatus(id, status);
      setAuctions(auctions.map(a => a._id === id ? { ...a, status } : a));
      addToast('success', "Auction status updated");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || "Failed to update auction");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-base py-12">
      <div className="container-custom animate-fade-in">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-border">
          <div>
            <h1 className="text-4xl font-serif italic text-text-primary mb-2">Admin Dashboard</h1>
            <p className="text-sm font-serif text-text-secondary">Platform overview and management.</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {(["STATS", "USERS", "AUCTIONS", "ORDERS"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setLoading(true);
                setActiveTab(tab);
              }}
              className={`px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors border ${
                activeTab === tab 
                  ? "border-text-primary bg-surface-subtle text-text-primary" 
                  : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-subtle hover:border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : (
          <div>
            {activeTab === "STATS" && stats && (
              <AdminStatsCards stats={stats} />
            )}

            {activeTab === "USERS" && (
              <AdminUsersTable
                users={users}
                onOpenEdit={handleOpenEdit}
                onUpdateUserStatus={handleUpdateUserStatus}
                onAdjustWallet={handleAdjustWallet}
              />
            )}

            {activeTab === "AUCTIONS" && (
              <AdminAuctionsTable
                auctions={auctions}
                onUpdateAuctionStatus={handleUpdateAuctionStatus}
                onDeleteAuction={handleDeleteAuction}
              />
            )}

            {activeTab === "ORDERS" && (
              <AdminOrdersTable orders={orders} />
            )}
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updatedUser) => {
            setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
          }}
        />
      )}
    </div>
  );
}
