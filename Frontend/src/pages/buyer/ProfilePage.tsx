import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateUser } from '../../store/authSlice';
import { authApi } from '../../services/api/auth.api';
import { addToast } from '../../utils';
import { Spinner } from '../../components/common';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      addToast('error', 'Username cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await authApi.updateMe({ username: username.trim(), bio: bio.trim() });
      dispatch(updateUser({ username: username.trim(), bio: bio.trim() }));
      addToast('success', 'Profile updated successfully');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast('error', axiosErr.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] py-12">
      <div className="container-custom max-w-2xl">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl mb-2">Profile Details</h1>
          <p className="text-sm text-text-secondary">View and manage your account information.</p>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
            <div className="w-20 h-20 rounded bg-surface-subtle border border-border flex items-center justify-center text-3xl font-medium text-text-primary">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">{user.username}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
                <span>{user.email}</span>
                {user.isVerified ? (
                  <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                    ✓ Verified
                  </span>
                ) : (
                  <Link
                    to="/verify-email"
                    className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium transition-colors"
                  >
                    ⚠ Unverified · Verify now
                  </Link>
                )}
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-widest bg-surface-subtle border border-border text-text-secondary">
                {user.role} Account
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="profile-username" className="block text-sm font-semibold text-text-primary mb-2">Username</label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-semibold text-text-primary mb-2">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className="form-input w-full opacity-60 cursor-not-allowed bg-surface-subtle"
              />
              <p className="text-xs text-text-muted mt-1.5">Email cannot be changed directly.</p>
            </div>

            <div>
              <label htmlFor="profile-bio" className="block text-sm font-semibold text-text-primary mb-2">Bio</label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other buyers and sellers a bit about yourself..."
                rows={3}
                className="form-input w-full resize-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Account ID: <span className="font-mono">{user.id}</span></div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span className="text-xs text-text-secondary">Account Status: Active</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Spinner size={16} /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
