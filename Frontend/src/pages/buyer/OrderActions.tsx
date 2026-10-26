import type { Order } from '../../types';
import { formatDate } from '../../utils';
import { Spinner } from '../../components/common';
import { OrderLifecycleTimeline } from './OrderLifecycleTimeline';
import { OrderFulfillmentForm } from './OrderFulfillmentForm';

interface OrderActionsProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  isPaying: boolean;
  isUpdatingStatus: boolean;
  isClaiming?: boolean;
  onPay: () => void;
  onStatusUpdate: (newStatus: 'SHIPPED' | 'DELIVERED') => void;
  onFulfillmentUpdate?: (data: { trackingNumber?: string; trackingCarrier?: string }) => void;
  onClaim?: () => void;
}

export const OrderActions = ({
  order,
  isBuyer,
  isSeller,
  isAdmin,
  isPaying,
  isUpdatingStatus,
  isClaiming = false,
  onPay,
  onStatusUpdate,
  onFulfillmentUpdate,
  onClaim,
}: OrderActionsProps) => {
  const isPending = order.status === 'PAYMENT_PENDING';
  const isCompleted = order.status === 'COMPLETED' || Boolean(order.claimedAt);

  const handleShipSubmit = (data: { trackingCarrier?: string; trackingNumber?: string }) => {
    if (onFulfillmentUpdate && data.trackingNumber) {
      onFulfillmentUpdate(data);
    } else {
      onStatusUpdate('SHIPPED');
    }
  };

  return (
    <div className="space-y-6">
      <OrderLifecycleTimeline
        order={order}
        isPending={isPending}
        isCompleted={isCompleted}
      />

      {isPending && (
        <div className="panel p-6 border-warning/30 bg-warning-subtle">
          <h3 className="text-sm font-semibold text-warning mb-2">Payment Required</h3>
          {isBuyer || isAdmin ? (
            <>
              <p className="text-xs text-text-secondary mb-4">
                Please complete your payment by {formatDate(order.paymentDeadline)} to secure your item.
              </p>
              <button
                onClick={onPay}
                disabled={isPaying}
                className="btn w-full bg-warning hover:bg-warning/90 text-white font-medium justify-center border-none flex items-center gap-2 disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Spinner size={16} />
                    <span>Opening Secure Checkout...</span>
                  </>
                ) : (
                  <span>Pay Now with Razorpay</span>
                )}
              </button>
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              Awaiting buyer payment before deadline ({formatDate(order.paymentDeadline)}). Escrow will activate once paid.
            </p>
          )}
        </div>
      )}

      {order.status === 'PROCESSING' && (
        <div className="panel p-6 border-border bg-surface-subtle">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Order Processing</h3>
          {isSeller || isAdmin ? (
            <OrderFulfillmentForm
              initialCarrier={order.trackingCarrier}
              initialTracking={order.trackingNumber}
              isUpdating={isUpdatingStatus}
              onSubmit={handleShipSubmit}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Payment is secured in escrow. The seller is currently preparing and dispatching your item.
              </p>
              {isBuyer && onClaim && (
                <button
                  onClick={onClaim}
                  disabled={isClaiming}
                  className="btn btn-secondary w-full justify-center flex items-center gap-2 text-xs"
                >
                  {isClaiming ? <Spinner size={14} /> : <span>Confirm Immediate Receipt / Digital Claim</span>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {order.status === 'SHIPPED' && (
        <div className="panel p-6 border-success/30 bg-success/5">
          <h3 className="text-sm font-semibold text-success mb-2">In Transit</h3>
          {order.trackingNumber && (
            <div className="mb-3 p-2.5 rounded bg-surface border border-border text-xs">
              <span className="text-text-muted">Tracking: </span>
              <span className="font-mono text-text-primary">{order.trackingNumber}</span>
              {order.trackingCarrier && <span className="text-text-muted"> via {order.trackingCarrier}</span>}
            </div>
          )}
          {isBuyer || isAdmin ? (
            <>
              <p className="text-xs text-text-secondary mb-4">
                Item has been dispatched. Confirm receipt to claim your item and release escrow funds to the seller.
              </p>
              <button
                onClick={onClaim ? onClaim : () => onStatusUpdate('DELIVERED')}
                disabled={isUpdatingStatus || isClaiming}
                className="btn w-full bg-success hover:bg-success/90 text-white font-medium justify-center border-none flex items-center gap-2"
              >
                {isUpdatingStatus || isClaiming ? (
                  <Spinner size={16} />
                ) : (
                  <span>Claim Item & Confirm Delivery</span>
                )}
              </button>
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              Item is in transit. Escrow funds will be released to your wallet once the buyer confirms delivery.
            </p>
          )}
        </div>
      )}

      {order.status === 'DELIVERED' && !isCompleted && (
        <div className="panel p-6 border-success/30 bg-success/10 text-success text-center space-y-3">
          <h3 className="text-sm font-semibold mb-1">Delivered to Buyer</h3>
          <p className="text-xs opacity-90">Item was marked delivered and escrow funds released to seller.</p>
          {isBuyer && onClaim && (
            <button
              onClick={onClaim}
              disabled={isClaiming}
              className="btn btn-primary w-full justify-center flex items-center gap-2 text-xs"
            >
              {isClaiming ? <Spinner size={14} /> : <span>Claim Item Certificate / Finalize</span>}
            </button>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="panel p-6 border-success/30 bg-success/10 text-success text-center">
          <h3 className="text-sm font-semibold mb-1">Item Claimed & Order Completed</h3>
          <p className="text-xs opacity-90">
            Ownership has been confirmed, item claimed, and funds completely settled.
          </p>
        </div>
      )}
    </div>
  );
};
