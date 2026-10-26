import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAllRead, markRead } from '../../store/notificationSlice';
import { formatDate } from '../../utils';
import type { Notification } from '../../types';

export const NotificationDropdown = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useAppSelector(s => s.notifications);
  const { user } = useAppSelector(s => s.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-live animate-pulse-fast border border-surface"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 panel z-50 animate-slide-down overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-subtle">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="text-xs font-medium text-text-secondary hover:text-text-primary"
                onClick={() => dispatch(markAllRead())}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-muted">
                No new notifications
              </div>
            ) : (
              recentNotifications.map((n: Notification) => (
                <div 
                  key={n._id} 
                  className={`p-3 text-sm flex gap-3 hover:bg-surface-subtle transition-colors cursor-pointer ${!n.isRead ? 'bg-surface-subtle/30' : ''}`}
                  onClick={() => {
                    if (!n.isRead) dispatch(markRead(n._id));
                    setIsOpen(false);
                    if (n.data?.auctionId) {
                      navigate(`/auctions/${n.data.auctionId}`);
                    } else if (n.data?.orderId) {
                      navigate(`/orders/${n.data.orderId}`);
                    }
                  }}
                >
                  <div className="mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${!n.isRead ? 'bg-live' : 'bg-transparent'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${!n.isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {n.title}
                    </div>
                    <div className="text-text-secondary text-xs mt-0.5 line-clamp-2">
                      {n.message}
                    </div>
                    <div className="text-text-muted text-[10px] mt-1 uppercase tracking-widest font-medium">
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border bg-surface-subtle text-center">
            <Link 
              to="/notifications" 
              className="text-xs font-medium text-text-secondary hover:text-text-primary block w-full py-1"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
