import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAllRead } from '../../store/notificationSlice';
import { formatDate } from '../../utils';
import { Spinner, EmptyState } from '../../components/common';

const NotificationsPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const { notifications, unreadCount, loading } = useAppSelector(s => s.notifications);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  return (
    <div className="min-h-[calc(100vh-56px)] py-12">
      <div className="container-custom max-w-3xl">
        <div className="mb-8 border-b border-border pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-text-primary text-surface text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-text-secondary">Stay updated on your bids and auctions.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => dispatch(markAllRead())}
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={40} /></div>
        ) : notifications.length === 0 ? (
          <EmptyState 
            title="No Notifications" 
            message="You're all caught up! You have no new alerts." 
          />
        ) : (
          <div className="panel divide-y divide-border">
            {notifications.map(n => (
              <div 
                key={n._id} 
                className={`p-5 flex gap-4 transition-colors hover:bg-surface-subtle ${
                  !n.isRead ? 'bg-surface-subtle/50' : 'bg-surface'
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${!n.isRead ? 'bg-live animate-pulse-fast' : 'bg-transparent'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-1">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
