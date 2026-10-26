export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
};

export const getTimeLeft = (endTime: string): { text: string; isEnding: boolean; isOver: boolean } => {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { text: 'Ended', isEnding: false, isOver: true };

  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  let text: string;
  if (d > 0)      text = `${d}d ${h % 24}h`;
  else if (h > 0) text = `${h}h ${m % 60}m`;
  else if (m > 0) text = `${m}m ${s % 60}s`;
  else            text = `${s}s`;

  return { text, isEnding: diff < 5 * 60 * 1000, isOver: false };
};

export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const auctionStatusConfig: Record<string, { label: string; className: string }> = {
  SCHEDULED:        { label: 'Scheduled',         className: 'badge-scheduled' },
  LIVE:             { label: 'Live',               className: 'badge-live' },
  ENDING:           { label: 'Ending Soon',        className: 'badge-live' },
  ENDED:            { label: 'Ended',              className: 'badge-ended' },
  CANCELLED:        { label: 'Cancelled',          className: 'badge-cancelled' },
  PAYMENT_PENDING:  { label: 'Payment Pending',    className: 'badge-payment' },
  PAYMENT_COMPLETED:{ label: 'Payment Completed',  className: 'badge-success' },
  FULFILLED:        { label: 'Fulfilled',          className: 'badge-success' },
  DISPUTED:         { label: 'Disputed',           className: 'badge-cancelled' },
  DRAFT:            { label: 'Draft',              className: 'badge-ended' },
};

export * from './toast';