import type { Order } from '../../types';
import { formatDate } from '../../utils';

interface OrderLifecycleTimelineProps {
  order: Order;
  isPending: boolean;
  isCompleted: boolean;
}

export const OrderLifecycleTimeline = ({
  order,
  isPending,
  isCompleted,
}: OrderLifecycleTimelineProps) => {
  return (
    <div className="panel p-6 bg-surface-subtle border-border">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-widest">Order Lifecycle</h3>

      <ul className="space-y-4 text-sm relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border z-0"></div>

        <li className="flex gap-4 relative z-10">
          <div className="w-4 h-4 rounded-full bg-success flex-shrink-0 mt-0.5 border-2 border-surface"></div>
          <div>
            <div className="font-medium text-text-primary">Auction Won</div>
            <div className="text-xs text-text-muted">{formatDate(order.createdAt)}</div>
          </div>
        </li>

        <li className="flex gap-4 relative z-10">
          <div
            className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-surface ${
              !isPending ? 'bg-success' : 'bg-surface border-text-muted'
            }`}
          ></div>
          <div>
            <div className={`font-medium ${!isPending ? 'text-text-primary' : 'text-text-secondary'}`}>
              Payment Verified (Escrow)
            </div>
            {!isPending && <div className="text-xs text-text-muted">{formatDate(order.updatedAt)}</div>}
          </div>
        </li>

        <li className="flex gap-4 relative z-10">
          <div
            className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-surface ${
              order.status === 'SHIPPED' || order.status === 'DELIVERED' || isCompleted
                ? 'bg-success'
                : 'bg-surface border-text-muted'
            }`}
          ></div>
          <div>
            <div
              className={`font-medium ${
                order.status === 'SHIPPED' || order.status === 'DELIVERED' || isCompleted
                  ? 'text-text-primary'
                  : 'text-text-secondary'
              }`}
            >
              Shipped {order.trackingNumber && (
                <span className="text-xs text-text-muted">
                  ({order.trackingCarrier || 'Tracking'}: {order.trackingNumber})
                </span>
              )}
            </div>
          </div>
        </li>

        <li className="flex gap-4 relative z-10">
          <div
            className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-surface ${
              isCompleted || order.status === 'DELIVERED' ? 'bg-success' : 'bg-surface border-text-muted'
            }`}
          ></div>
          <div>
            <div className={`font-medium ${isCompleted || order.status === 'DELIVERED' ? 'text-text-primary' : 'text-text-secondary'}`}>
              {isCompleted ? 'Item Claimed & Completed' : 'Delivered & Escrow Settled'}
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
};
