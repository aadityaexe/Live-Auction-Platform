import React, { useState, useEffect } from 'react';
import { registerToastListener, ToastInfo } from '../../utils/toast';
export { ErrorBoundary } from './ErrorBoundary';

export interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size = 24, className = '' }: SpinnerProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`animate-spin text-text-muted ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const LoadingPage = () => (
  <div className="min-h-[60vh] flex flex-col gap-4 items-center justify-center">
    <Spinner size={32} />
    <span className="font-serif italic text-text-muted text-sm">Loading...</span>
  </div>
);

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="p-4 bg-transparent border-t border-b border-danger/30 text-danger text-sm font-serif italic text-center">
    {message}
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toUpperCase();
  if (normalized === 'LIVE' || normalized === 'ENDING') {
    return (
      <span className="badge badge-live">
        <span className="w-1.5 h-1.5 bg-live animate-pulse-fast"></span>
        Live
      </span>
    );
  }
  if (normalized === 'SCHEDULED') {
    return <span className="badge badge-neutral">Scheduled</span>;
  }
  if (normalized === 'PAYMENT_PENDING') {
    return <span className="badge badge-warning">Payment Pending</span>;
  }
  if (normalized === 'PROCESSING') {
    return <span className="badge badge-neutral">Processing</span>;
  }
  if (normalized === 'SHIPPED') {
    return <span className="badge badge-neutral text-accent border-accent/30">Shipped</span>;
  }
  if (normalized === 'DELIVERED') {
    return <span className="badge badge-success">Delivered</span>;
  }
  if (normalized === 'COMPLETED' || normalized === 'FULFILLED') {
    return <span className="badge badge-success">Completed</span>;
  }
  if (normalized === 'CANCELLED' || normalized === 'DISPUTED') {
    return <span className="badge badge-danger">Cancelled</span>;
  }
  if (normalized === 'REFUNDED') {
    return <span className="badge badge-warning">Refunded</span>;
  }
  return <span className="badge badge-neutral">{status}</span>;
};

export const EmptyState = ({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) => (
  <div className="panel p-16 flex flex-col items-center justify-center text-center relative">
    <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
    <div className="w-8 h-px bg-border mb-6"></div>
    <h3 className="text-xl font-serif text-text-primary mb-2 italic">{title}</h3>
    <p className="text-sm text-text-secondary mb-8 max-w-sm font-serif">{message}</p>
    {action}
  </div>
);

export interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  as?: 'textarea';
  min?: string;
  step?: string;
  prefix?: string;
}

export const FormField = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required,
  hint,
  as,
  min,
  step,
  prefix,
}: FormFieldProps) => (
  <div className="form-group mb-0 relative">
    <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">{label}{required && <span className="text-danger ml-1">*</span>}</label>
    <div className="relative">
      {prefix && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-serif italic">{prefix}</span>}
      {as === 'textarea' ? (
        <textarea
          name={name}
          className="form-input min-h-[120px] resize-y"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      ) : (
        <input
          name={name}
          type={type}
          className={`form-input ${prefix ? 'pl-8' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
        />
      )}
    </div>
    {hint && <div className="text-xs text-text-muted mt-2 font-serif italic">{hint}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>
);

export const Pagination = ({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button 
        className="btn btn-secondary btn-sm"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold tabular-nums">
        Page {page} of {pages}
      </span>
      <button 
        className="btn btn-secondary btn-sm"
        disabled={page === pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  useEffect(() => {
    registerToastListener((t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== t.id));
      }, 4000);
    });
    return () => { registerToastListener(null); };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className="animate-slide-up bg-surface border border-border px-4 py-3 flex items-start gap-3 w-[320px] relative">
          <div className="absolute top-1 left-1 right-1 bottom-1 border border-border pointer-events-none"></div>
          {t.type === 'success' && <div className="text-success text-xs mt-0.5 shrink-0">◆</div>}
          {t.type === 'error' && <div className="text-danger text-xs mt-0.5 shrink-0">◆</div>}
          {t.type === 'info' && <div className="text-text-muted text-xs mt-0.5 shrink-0">◆</div>}
          <p className="text-sm font-serif italic text-text-primary leading-tight z-10">{t.message}</p>
        </div>
      ))}
    </div>
  );
};
