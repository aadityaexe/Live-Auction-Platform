import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUser } from '../../store/authSlice';
import { authApi } from '../../services/api/auth.api';
import { addToast } from '../../utils';
import { AlreadyVerifiedCard, VerificationSuccessCard, VerifyEmailOtpForm } from './VerifyEmailStateCards';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || '';

  const [inputEmail, setInputEmail] = useState(initialEmail);
  const email = user?.email || inputEmail;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await authApi.verifyEmailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });

      setSuccess(true);
      dispatch(updateUser({ isVerified: true }));
      addToast('success', res.data.message || 'Email verified successfully!');

      setTimeout(() => {
        if (user) {
          navigate(user.role === 'SELLER' ? '/seller' : '/buyer');
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    if (!email.trim()) {
      setError('Please provide your email address to receive a code.');
      return;
    }

    try {
      setResending(true);
      setError(null);
      const res = await authApi.sendVerificationOtp(email.trim());
      addToast('info', res.data.message || 'A new verification code has been dispatched.');
      setCooldown(res.data.cooldownSeconds || 60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to resend code. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[440px]">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-border bg-surface-subtle mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h1 className="text-3xl font-serif italic mb-2">Verify Your Email</h1>
          <p className="text-sm font-serif text-text-secondary">
            Enter the 6-digit authorization code sent to your email
          </p>
        </div>

        <div className="panel p-8 md:p-10 relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>

          {user?.isVerified ? (
            <AlreadyVerifiedCard />
          ) : success ? (
            <VerificationSuccessCard />
          ) : (
            <VerifyEmailOtpForm
              email={email}
              isEmailDisabled={Boolean(user?.email)}
              onEmailChange={e => setInputEmail(e.target.value)}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={handleVerify}
              loading={loading}
              error={error}
              cooldown={cooldown}
              resending={resending}
              onResend={handleResend}
            />
          )}
        </div>

        <div className="text-center mt-6 text-sm font-serif text-text-secondary">
          <Link to="/" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back to Auctions
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyEmailPage;
