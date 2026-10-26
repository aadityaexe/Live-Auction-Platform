import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { orderApi } from '../../services/api/other.api';
import { paymentApi } from '../../services/api/payment.api';
import { loadRazorpayScript } from '../../utils/razorpay';
import { useAppSelector } from '../../store/hooks';
import type { Order, Auction } from '../../types';
import { Spinner, ErrorMessage } from '../../components/common';
import { OrderSummary } from './OrderSummary';
import { OrderActions } from './OrderActions';
import { OrderAlerts } from './OrderAlerts';
import { OrderHeader } from './OrderHeader';

declare global {
  interface Window {
    Razorpay: new (options: unknown) => {
      open: () => void;
      on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void;
    };
  }
}

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector(s => s.auth);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  const reloadOrder = async () => {
    if (!id) return;
    try {
      const { data } = await orderApi.getOrder(id);
      setOrder(data.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to load order');
    }
  };

  useEffect(() => {
    if (!id) return;
    let isCurrent = true;
    orderApi.getOrder(id)
      .then(({ data }) => {
        if (isCurrent) setOrder(data.data);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (isCurrent) setError(axiosErr.response?.data?.message || 'Failed to load order');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'SHIPPED' | 'DELIVERED') => {
    if (!order || isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      setPaymentError('');
      await orderApi.updateStatus(order._id, newStatus);
      setStatusSuccessMessage(
        newStatus === 'DELIVERED'
          ? 'Order marked as delivered! Funds have been released from escrow.'
          : 'Order updated to shipped.'
      );
      await reloadOrder();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPaymentError(axiosErr.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!order || isClaiming) return;
    try {
      setIsClaiming(true);
      setPaymentError('');
      await orderApi.claimOrder(order._id);
      setStatusSuccessMessage('Item claimed successfully! Receipt confirmed and order completed.');
      await reloadOrder();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPaymentError(axiosErr.response?.data?.message || 'Failed to claim item');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleFulfillment = async (data: { trackingNumber?: string; trackingCarrier?: string }) => {
    if (!order || isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      setPaymentError('');
      await orderApi.updateFulfillment(order._id, { ...data, status: 'SHIPPED' });
      setStatusSuccessMessage('Fulfillment details updated and order marked as shipped.');
      await reloadOrder();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPaymentError(axiosErr.response?.data?.message || 'Failed to update fulfillment');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePayment = async () => {
    if (!order || isPaying) return;
    setPaymentError('');

    try {
      setIsPaying(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const res = await paymentApi.createOrder(order._id);
      const { providerOrderId, amount, currency, keyId } = res.data.data;

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'Live Auction Platform',
        description: `Settlement for Order #${order._id.slice(-8).toUpperCase()}`,
        order_id: providerOrderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.data.success) {
              setPaymentSuccess(true);
              await reloadOrder();
            } else {
              setPaymentError('Verification failed. Please contact support.');
            }
          } catch (verifyErr: unknown) {
            const axiosErr = verifyErr as { response?: { data?: { message?: string } } };
            setPaymentError(
              axiosErr.response?.data?.message || 'Payment verification failed on server.'
            );
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
        },
        theme: {
          color: '#1e293b',
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp: { error?: { description?: string } }) {
        setPaymentError(resp.error?.description || 'Payment was declined or failed.');
        setIsPaying(false);
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setPaymentError(axiosErr.response?.data?.message || axiosErr.message || 'Payment initiation failed.');
      setIsPaying(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex justify-center py-20"><Spinner size={40} /></div>;
  if (error || !order) return <div className="container-custom py-12"><ErrorMessage message={error || 'Order not found'} /></div>;

  const auction = order.auctionId as Auction;

  const getEntityId = (entity: string | { _id?: string; id?: string } | undefined) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return entity._id || entity.id || '';
  };

  const isBuyer = Boolean(user && getEntityId(order.buyerId) === user.id);
  const isSeller = Boolean(user && getEntityId(order.sellerId) === user.id);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-[calc(100vh-56px)] py-12 bg-base">
      <div className="container-custom max-w-4xl">
        <OrderHeader
          orderId={order._id}
          createdAt={order.createdAt}
          status={order.status}
        />

        <OrderAlerts
          paymentSuccess={paymentSuccess}
          paymentError={paymentError}
          statusSuccessMessage={statusSuccessMessage}
          onDismissError={() => setPaymentError('')}
          onDismissStatus={() => setStatusSuccessMessage('')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <OrderSummary
            auction={auction}
            finalAmount={order.finalAmount}
            status={order.status}
          />

          <OrderActions
            order={order}
            isBuyer={isBuyer}
            isSeller={isSeller}
            isAdmin={isAdmin}
            isPaying={isPaying}
            isUpdatingStatus={isUpdatingStatus}
            isClaiming={isClaiming}
            onPay={handlePayment}
            onStatusUpdate={handleStatusUpdate}
            onFulfillmentUpdate={handleFulfillment}
            onClaim={handleClaim}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

