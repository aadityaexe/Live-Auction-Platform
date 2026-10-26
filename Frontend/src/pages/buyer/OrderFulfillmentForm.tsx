import { useState } from 'react';
import { Spinner } from '../../components/common';

interface OrderFulfillmentFormProps {
  initialCarrier?: string;
  initialTracking?: string;
  isUpdating: boolean;
  onSubmit: (data: { trackingCarrier?: string; trackingNumber?: string }) => void;
}

export const OrderFulfillmentForm = ({
  initialCarrier = 'BlueDart / FedEx',
  initialTracking = '',
  isUpdating,
  onSubmit,
}: OrderFulfillmentFormProps) => {
  const [carrier, setCarrier] = useState(initialCarrier);
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      trackingCarrier: carrier.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-text-secondary">
        Payment is safely held in escrow. Enter tracking details and dispatch the item.
      </p>
      <div>
        <label className="text-[11px] text-text-muted block mb-1">Carrier</label>
        <input
          type="text"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="input text-xs w-full py-1.5 px-3 bg-surface border-border rounded"
          placeholder="e.g. BlueDart, FedEx, DHL"
        />
      </div>
      <div>
        <label className="text-[11px] text-text-muted block mb-1">Tracking Number</label>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          className="input text-xs w-full py-1.5 px-3 bg-surface border-border rounded"
          placeholder="e.g. TRK-9876543210"
        />
      </div>
      <button
        type="submit"
        disabled={isUpdating}
        className="btn-primary w-full justify-center flex items-center gap-2 mt-2"
      >
        {isUpdating ? <Spinner size={16} /> : <span>Dispatch & Mark as Shipped</span>}
      </button>
    </form>
  );
};
