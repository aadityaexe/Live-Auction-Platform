import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api/auth.api';
import { ErrorMessage } from '../../components/common';
import { addToast } from '../../utils';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    if (!email.trim()) {
      setError('Please provide an email address first.');
      return;
    }

    try {
      setResending(true);
      setError(null);
      const res = await authApi.forgotPassword(email.trim());
      addToast('info', res.data.message || 'New recovery code dispatched.');
      setCooldown(res.data.cooldownSeconds || 60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Please provide a valid 6-digit recovery code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      addToast('success', res.data.message || 'Password successfully reset! Please sign in.');
      navigate('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[420px]">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif italic mb-3">Set New Password</h1>
          <p className="text-sm font-serif text-text-secondary">
            Enter the code sent to your email and choose your new password
          </p>
        </div>

        <div className="panel p-8 md:p-10 relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
          <form onSubmit={handleSubmit} className="relative z-10">
            {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

            <div className="form-group mb-5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                className="form-input font-serif text-base"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-5">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
                  6-Digit Recovery Code
                </label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-[11px] text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input font-mono text-center text-xl tracking-[0.3em] py-2.5 font-semibold"
                placeholder="······"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="form-group mb-5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">
                New Password
              </label>
              <input
                type="password"
                className="form-input font-serif text-base"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="form-group mb-8">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-input font-serif text-base"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center h-12 text-sm"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm font-serif text-text-secondary">
          Remembered your password?{' '}
          <Link to="/login" className="text-text-primary italic hover:text-text-secondary transition-colors">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
