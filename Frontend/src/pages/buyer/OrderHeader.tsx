import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common';
import { formatDate } from '../../utils';

interface OrderHeaderProps {
  orderId: string;
  createdAt: string;
  status: string;
}

export const OrderHeader = ({ orderId, createdAt, status }: OrderHeaderProps) => {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-sm text-text-muted font-medium">
        <Link to="/buyer" className="hover:text-text-primary">Dashboard</Link>
        <span>/</span>
        <Link to="/orders" className="hover:text-text-primary">Orders</Link>
        <span>/</span>
        <span className="text-text-primary font-mono">{orderId.slice(-8).toUpperCase()}</span>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl mb-2 font-mono">Order {orderId.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-text-secondary">Placed on {formatDate(createdAt)}</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </>
  );
};
