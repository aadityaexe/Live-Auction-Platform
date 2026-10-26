interface OrderAlertsProps {
  paymentSuccess: boolean;
  paymentError: string;
  statusSuccessMessage: string;
  onDismissError: () => void;
  onDismissStatus: () => void;
}

export const OrderAlerts = ({
  paymentSuccess,
  paymentError,
  statusSuccessMessage,
  onDismissError,
  onDismissStatus,
}: OrderAlertsProps) => {
  return (
    <>
      {paymentSuccess && (
        <div className="panel p-4 mb-6 bg-success/10 border-success/30 text-success flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold">Payment Confirmed & Verified</p>
            <p className="text-xs">Your order has been updated to paid state. Seller has been notified.</p>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="panel p-4 mb-6 bg-danger/10 border-danger/30 text-danger flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm">{paymentError}</p>
          </div>
          <button onClick={onDismissError} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {statusSuccessMessage && (
        <div className="panel p-4 mb-6 bg-success/10 border-success/30 text-success flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm font-semibold">{statusSuccessMessage}</p>
          </div>
          <button onClick={onDismissStatus} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};
