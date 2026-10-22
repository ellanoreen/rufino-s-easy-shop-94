import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ChatProvider } from '@/context/ChatContext';
import Navbar from '@/components/Navbar';

// Helper component for testing NotificationContext hooks directly
const TestNotificationConsumer = () => {
  const { notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead } = useNotifications();
  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="total-count">{notifications.length}</div>
      <ul>
        {notifications.map(n => (
          <li key={n.id} data-testid={`notif-${n.id}`}>
            <span>{n.message}</span>
            <span data-testid={`status-${n.id}`}>{n.isRead ? 'read' : 'unread'}</span>
            <button data-testid={`btn-read-${n.id}`} onClick={() => markAsRead(n.id)}>
              Read
            </button>
            <button data-testid={`btn-unread-${n.id}`} onClick={() => markAsUnread(n.id)}>
              Unread
            </button>
          </li>
        ))}
      </ul>
      <button data-testid="btn-mark-all" onClick={markAllAsRead}>
        Mark All Read
      </button>
    </div>
  );
};

// Customer wrapper that sets up a logged-in customer session
const CustomerWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login } = useAuth();
  React.useEffect(() => {
    login('customer@test.com', 'customer123');
  }, [login]);
  return <>{children}</>;
};

describe('Customer Notifications System', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      user_id: 'cust-123',
      order_id: 'ord-1',
      message: 'Your order has been confirmed by the store.',
      status: 'Confirm',
      is_read: false,
      created_at: '2026-10-19 10:00:00',
    },
    {
      id: 'notif-2',
      user_id: 'cust-123',
      order_id: 'ord-2',
      message: 'Great news! Your order is now out for delivery.',
      status: 'Out for Delivery',
      is_read: false,
      created_at: '2026-10-19 09:30:00',
    },
    {
      id: 'notif-3',
      user_id: 'cust-123',
      order_id: 'ord-3',
      message: 'Your order has been delivered. Enjoy your furniture!',
      status: 'Delivered',
      is_read: true,
      created_at: '2026-10-18 14:00:00',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Default fetch mock returning logged-in customer for /api/auth/login
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { id: 'cust-123', name: 'Test Customer', email: 'customer@test.com', role: 'customer' },
          }),
        });
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      }
      if (url.includes('/api/messages')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('loads notifications and accurately calculates unread count', async () => {
    render(
      <AuthProvider>
        <CustomerWrapper>
          <NotificationProvider>
            <TestNotificationConsumer />
          </NotificationProvider>
        </CustomerWrapper>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-count').textContent).toBe('3');
      expect(screen.getByTestId('unread-count').textContent).toBe('2');
      expect(screen.getByTestId('status-notif-1').textContent).toBe('unread');
      expect(screen.getByTestId('status-notif-2').textContent).toBe('unread');
      expect(screen.getByTestId('status-notif-3').textContent).toBe('read');
    });
  });

  it('marks an individual notification as read and sends userId to persist', async () => {
    let patchCalled = false;
    let patchBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { id: 'cust-123', name: 'Test Customer', email: 'customer@test.com', role: 'customer' },
          }),
        });
      }
      if (url.includes('/api/notifications/notif-1/read') && options?.method === 'PATCH') {
        patchCalled = true;
        patchBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockNotifications[0], is_read: true }),
        });
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <AuthProvider>
        <CustomerWrapper>
          <NotificationProvider>
            <TestNotificationConsumer />
          </NotificationProvider>
        </CustomerWrapper>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('2');
    });

    // Click Mark as Read on notif-1
    fireEvent.click(screen.getByTestId('btn-read-notif-1'));

    // Should update immediately (optimistic UI)
    await waitFor(() => {
      expect(screen.getByTestId('status-notif-1').textContent).toBe('read');
      expect(screen.getByTestId('unread-count').textContent).toBe('1');
    });

    expect(patchCalled).toBe(true);
    expect(patchBody).toHaveProperty('userId', 'cust-123');
  });

  it('marks an individual notification as unread and sends userId to persist', async () => {
    let unreadPatchCalled = false;
    let unreadPatchBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { id: 'cust-123', name: 'Test Customer', email: 'customer@test.com', role: 'customer' },
          }),
        });
      }
      if (url.includes('/api/notifications/notif-3/unread') && options?.method === 'PATCH') {
        unreadPatchCalled = true;
        unreadPatchBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockNotifications[2], is_read: false }),
        });
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <AuthProvider>
        <CustomerWrapper>
          <NotificationProvider>
            <TestNotificationConsumer />
          </NotificationProvider>
        </CustomerWrapper>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-notif-3').textContent).toBe('read');
      expect(screen.getByTestId('unread-count').textContent).toBe('2');
    });

    // Mark notif-3 as unread
    fireEvent.click(screen.getByTestId('btn-unread-notif-3'));

    // Unread count should increment immediately
    await waitFor(() => {
      expect(screen.getByTestId('status-notif-3').textContent).toBe('unread');
      expect(screen.getByTestId('unread-count').textContent).toBe('3');
    });

    expect(unreadPatchCalled).toBe(true);
    expect(unreadPatchBody).toHaveProperty('userId', 'cust-123');
  });

  it('marks all notifications as read and resets unread count to 0', async () => {
    let markAllCalled = false;
    let markAllBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { id: 'cust-123', name: 'Test Customer', email: 'customer@test.com', role: 'customer' },
          }),
        });
      }
      if (url.includes('/api/notifications/read-all') && options?.method === 'PATCH') {
        markAllCalled = true;
        markAllBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <AuthProvider>
        <CustomerWrapper>
          <NotificationProvider>
            <TestNotificationConsumer />
          </NotificationProvider>
        </CustomerWrapper>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('2');
    });

    // Click Mark All Read
    fireEvent.click(screen.getByTestId('btn-mark-all'));

    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('0');
      expect(screen.getByTestId('status-notif-1').textContent).toBe('read');
      expect(screen.getByTestId('status-notif-2').textContent).toBe('read');
      expect(screen.getByTestId('status-notif-3').textContent).toBe('read');
    });

    expect(markAllCalled).toBe(true);
    expect(markAllBody).toHaveProperty('userId', 'cust-123');
  });

  it('Navbar displays notification bell badge, dropdown with visual indicators, and working actions', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerWrapper>
            <CartProvider>
              <ChatProvider>
                <NotificationProvider>
                  <Navbar />
                </NotificationProvider>
              </ChatProvider>
            </CartProvider>
          </CustomerWrapper>
        </AuthProvider>
      </BrowserRouter>
    );

    // Notification bell button should show badge with '2'
    await waitFor(() => {
      const bellBtn = document.getElementById('notification-bell-btn');
      expect(bellBtn).toBeInTheDocument();
      expect(bellBtn).toHaveTextContent('2');
    });

    const bellBtn = document.getElementById('notification-bell-btn')!;
    // Click to open notification dropdown
    fireEvent.click(bellBtn);

    // Dropdown should be open
    await waitFor(() => {
      const dropdown = document.getElementById('notification-dropdown');
      expect(dropdown).toBeInTheDocument();
      expect(within(dropdown!).getByText('Notifications')).toBeInTheDocument();
      expect(within(dropdown!).getByText('2 unread')).toBeInTheDocument();
      expect(within(dropdown!).getByText('Mark all read')).toBeInTheDocument();
    });

    const dropdown = document.getElementById('notification-dropdown')!;

    // Notification items should be rendered
    expect(within(dropdown).getByText('Your order has been confirmed by the store.')).toBeInTheDocument();
    expect(within(dropdown).getByText('Great news! Your order is now out for delivery.')).toBeInTheDocument();
    expect(within(dropdown).getByText('Your order has been delivered. Enjoy your furniture!')).toBeInTheDocument();

    // Visual indicators: Unread badges and Read badges inside dropdown
    const unreadPills = within(dropdown).getAllByText('Unread');
    const readPills = within(dropdown).getAllByText('Read');
    expect(unreadPills.length).toBe(2);
    expect(readPills.length).toBe(1);

    // Toggle button exists for notifications
    const toggle1 = dropdown.querySelector<HTMLButtonElement>('#notif-toggle-notif-1')!;
    expect(toggle1).toBeInTheDocument();
    expect(toggle1.getAttribute('title')).toBe('Mark as read');

    // Click toggle to mark notif-1 as read
    fireEvent.click(toggle1);

    // Immediately updates unread count in header and bell
    await waitFor(() => {
      expect(within(dropdown).getByText('1 unread')).toBeInTheDocument();
      expect(bellBtn).toHaveTextContent('1');
    });
  });
});
