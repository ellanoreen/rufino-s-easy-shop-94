import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const normalizeNotification = (n: any): Notification => ({
  id: n.id,
  userId: n.user_id,
  orderId: n.order_id,
  message: n.message,
  status: n.status,
  isRead: Boolean(n.is_read),
  createdAt: n.created_at,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user || isAdmin) return;
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.map(normalizeNotification));
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [user?.id, isAdmin]);

  // Initial fetch + poll every 30 s to pick up new status changes
  useEffect(() => {
    if (!user || isAdmin) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user?.id, isAdmin, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        // Revert on failure
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
      }
    } catch {
      // Revert on network error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  }, [user]);

  const markAsUnread = useCallback(async (id: string) => {
    if (!user) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    try {
      const res = await fetch(`/api/notifications/${id}/unread`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        // Revert on failure
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch {
      // Revert on network error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    // Optimistic update
    const snapshot = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        // Revert on failure
        setNotifications(snapshot);
      }
    } catch {
      // Revert on network error
      setNotifications(snapshot);
    }
  }, [user, notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead, refresh: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

const defaultNotificationContext: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAsUnread: async () => {},
  markAllAsRead: async () => {},
  refresh: () => {},
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  return ctx || defaultNotificationContext;
};
