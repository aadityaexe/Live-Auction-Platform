import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api/auth.api';
import { ErrorMessage } from '../../components/common';
import { addToast } from '../../utils';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await authApi.forgotPassword(email.trim());
      addToast('info', res.data.message || 'Verification code sent to your email.');
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[400px]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif italic mb-3">Reset Password</h1>
          <p className="text-sm font-serif text-text-secondary">
            Enter your email to receive a 6-digit recovery code
          </p>
        </div>

        <div className="panel p-8 md:p-10 relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
          <form onSubmit={handleSubmit} className="relative z-10">
            {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

            <div className="form-group mb-8 relative">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">
                Account Email
              </label>
              <input
                type="email"
                className="form-input font-serif text-base"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center h-12 text-sm"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Recovery Code'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm font-serif text-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="text-text-primary italic hover:text-text-secondary transition-colors">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
