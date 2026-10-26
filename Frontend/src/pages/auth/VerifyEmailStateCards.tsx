import { Link } from 'react-router-dom';
import { Spinner } from '../../components/common';

interface AlreadyVerifiedCardProps {
  onReturnUrl?: string;
}

export const AlreadyVerifiedCard = ({ onReturnUrl = '/' }: AlreadyVerifiedCardProps) => (
  <div className="text-center py-4 relative z-10">
    <div className="text-emerald-500 mb-2 font-medium">Your email is verified</div>
    <p className="text-sm text-text-secondary mb-6">
      You have full access to bidding and auctions.
    </p>
    <Link to={onReturnUrl} className="btn btn-primary w-full justify-center">
      Return to Auctions
    </Link>
  </div>
);

export const VerificationSuccessCard = () => (
  <div className="text-center py-6 relative z-10 animate-fade-in">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 text-xl">
      &#10003;
    </div>
    <h2 className="text-xl font-semibold mb-2">Verification Successful</h2>
    <p className="text-sm text-text-secondary mb-6">
      Your email has been authenticated. Redirecting you shortly...
    </p>
    <div className="flex justify-center">
      <Spinner size={28} />
    </div>
  </div>
);

interface VerifyEmailOtpFormProps {
  email: string;
  isEmailDisabled: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  otp: string;
  onOtpChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  cooldown: number;
  resending: boolean;
  onResend: () => void;
}

export const VerifyEmailOtpForm = ({
  email,
  isEmailDisabled,
  onEmailChange,
  otp,
  onOtpChange,
  onSubmit,
  loading,
  error,
  cooldown,
  resending,
  onResend,
}: VerifyEmailOtpFormProps) => {
  return (
    <form onSubmit={onSubmit} className="relative z-10">
      {error && <div className="mb-6 p-3 bg-danger/10 border border-danger/30 text-danger text-xs text-center">{error}</div>}

      <div className="form-group mb-6">
        <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">
          Email Address
        </label>
        <input
          type="email"
          className="form-input font-serif text-sm"
          placeholder="name@example.com"
          value={email}
          onChange={onEmailChange}
          disabled={isEmailDisabled}
          required
        />
      </div>

      <div className="form-group mb-6">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
            6-Digit Verification Code
          </label>
          <span className="text-[11px] text-text-muted">Expires in 10m</span>
        </div>
        <input
          type="text"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
          className="form-input font-mono text-center text-2xl tracking-[0.35em] py-3 font-semibold uppercase"
          placeholder="······"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
          autoFocus
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full justify-center h-12 text-sm mb-4"
        disabled={loading || otp.length !== 6}
      >
        {loading ? 'Verifying Code...' : 'Verify Email'}
      </button>

      <div className="text-center pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || resending}
          className="text-xs uppercase tracking-widest font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:hover:text-text-secondary"
        >
          {resending
            ? 'Sending Code...'
            : cooldown > 0
            ? `Resend Code in ${cooldown}s`
            : 'Did not receive code? Resend'}
        </button>
      </div>
    </form>
  );
};

