import React, { useState } from 'react';
import { updateUserDetails } from '../../services/api/admin.api';
import { Spinner } from '../../components/common';
import { addToast } from '../../utils/toast';

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  status?: string;
  bio?: string;
  walletBalance?: number;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

interface EditUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (updatedUser: AdminUser) => void;
}

export const EditUserModal = ({ user, onClose, onSave }: EditUserModalProps) => {
  const [form, setForm] = useState({
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'BUYER',
    walletBalance: typeof user.walletBalance === 'number' ? user.walletBalance : 0,
    bio: user.bio || '',
    isActive: user.isActive !== false,
    isVerified: !!user.isVerified,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateUserDetails(user._id, form);
      addToast('success', `User ${res.user.username} updated successfully`);
      onSave({ ...user, ...res.user });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || 'Failed to update user details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="panel bg-surface border border-border w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h3 className="text-xl font-serif text-text-primary">Edit User Details</h3>
            <p className="text-xs text-text-secondary mt-0.5">Admin-side profile and balance management</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-muted hover:text-text-primary text-xl font-bold p-1 leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="form-input w-full py-2 bg-surface-subtle text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="form-input w-full py-2 bg-surface-subtle text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                User Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'BUYER' | 'SELLER' | 'ADMIN' })}
                className="form-select w-full py-2 bg-surface-subtle text-sm"
              >
                <option value="BUYER">BUYER</option>
                <option value="SELLER">SELLER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Wallet Balance (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.walletBalance}
                onChange={(e) => setForm({ ...form, walletBalance: parseFloat(e.target.value) || 0 })}
                className="form-input w-full py-2 bg-surface-subtle text-sm font-serif tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Bio / Notes
            </label>
            <textarea
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="User biographical details or administrative notes..."
              className="form-input w-full py-2 bg-surface-subtle text-sm"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="form-checkbox"
              />
              <span>Active Account</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                className="form-checkbox"
              />
              <span>Verified Identity</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {saving && <Spinner size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
