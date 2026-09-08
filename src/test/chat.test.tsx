import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import { ProductProvider } from '@/context/ProductContext';
import { CartProvider } from '@/context/CartContext';
import { ChatProvider, useChat } from '@/context/ChatContext';
import Navbar from '@/components/Navbar';
import AdminLayout from '@/components/AdminLayout';
import Messages from '@/pages/Messages';
import AdminMessages from '@/pages/admin/AdminMessages';

// Helper component to test ChatContext hook directly
const TestChatConsumer = () => {
  const { messages, conversations, unreadCount, sendMessage, markAsRead, markAsUnread, deleteConversation } = useChat();
  return (
    <div>
      <div data-testid="msg-count">{messages.length}</div>
      <div data-testid="conv-count">{conversations.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button
        data-testid="send-btn"
        onClick={() => sendMessage({ content: 'Hello from customer test', orderId: 'ord-101' })}
      >
        Send
      </button>
      <button data-testid="read-btn" onClick={() => markAsRead('2')}>
        Mark Read
      </button>
      <button data-testid="unread-btn" onClick={() => markAsUnread('2')}>
        Mark Unread
      </button>
      <button data-testid="delete-btn" onClick={() => deleteConversation('2')}>
        Delete
      </button>
    </div>
  );
};

// Helper component to log in as admin for AdminLayout test
const AdminLoginWrapper = ({ children }: { children: React.ReactNode }) => {
  const { login } = useAuth();
  React.useEffect(() => {
    login('admin@rufinos.com', 'admin123');
  }, [login]);
  return <>{children}</>;
};

describe('Chat & Messages System Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('provides chat state and calculates unread counts accurately', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <AuthProvider>
        <OrderProvider>
          <ChatProvider>
            <TestChatConsumer />
          </ChatProvider>
        </OrderProvider>
      </AuthProvider>
    );

    // Initial seed messages should be present
    expect(Number(screen.getByTestId('msg-count').textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId('conv-count').textContent)).toBeGreaterThan(0);
  });

  it('supports marking conversations as unread, read, and deleting (soft delete)', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <AuthProvider>
        <OrderProvider>
          <ChatProvider>
            <AdminLoginWrapper>
              <TestChatConsumer />
            </AdminLoginWrapper>
          </ChatProvider>
        </OrderProvider>
      </AuthProvider>
    );

    // Initial state: 1 conversation
    await waitFor(() => {
      expect(Number(screen.getByTestId('conv-count').textContent)).toBe(1);
    });

    // Mark as Read
    fireEvent.click(screen.getByTestId('read-btn'));
    await waitFor(() => {
      expect(Number(screen.getByTestId('unread-count').textContent)).toBe(0);
    });

    // Mark as Unread
    fireEvent.click(screen.getByTestId('unread-btn'));
    await waitFor(() => {
      expect(Number(screen.getByTestId('unread-count').textContent)).toBeGreaterThan(0);
    });

    // Soft delete conversation
    fireEvent.click(screen.getByTestId('delete-btn'));
    await waitFor(() => {
      expect(Number(screen.getByTestId('conv-count').textContent)).toBe(0);
    });
  });

  it('renders dropdown options with Mark as Unread/Read and Delete in AdminMessages', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <OrderProvider>
            <ChatProvider>
              <AdminLoginWrapper>
                <AdminMessages />
              </AdminLoginWrapper>
            </ChatProvider>
          </OrderProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Customer Messages & Chat/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Test Customer/i).length).toBeGreaterThanOrEqual(1);
    });

    // Check that option button exists for the conversation
    const optionBtns = screen.getAllByLabelText(/Options for Test Customer/i);
    expect(optionBtns.length).toBeGreaterThanOrEqual(1);

    // Open dropdown via keyboard navigation supported by Radix UI in jsdom
    fireEvent.keyDown(optionBtns[0], { key: 'ArrowDown', code: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByText(/Mark as Unread|Mark as Read/i)).toBeInTheDocument();
      expect(screen.getByText(/Delete/i)).toBeInTheDocument();
    });

    // Click Delete to open confirmation dialog
    const deleteItem = screen.getByText(/Delete/i);
    fireEvent.click(deleteItem);

    await waitFor(() => {
      expect(screen.getByText(/Delete Conversation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('renders Customer Messages page and allows sending messages with order link', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <OrderProvider>
            <ChatProvider>
              <Messages />
            </ChatProvider>
          </OrderProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Customer Support & Chat/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Online/i)).toBeInTheDocument();
    expect(screen.queryByText(/View My Orders/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/General Inquiries/i)).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Type a message/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Inquiring about wood quality' } });
    const sendButton = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Inquiring about wood quality')).toBeInTheDocument();
    });
  });

  it('renders Admin Messages page with search and customer conversation list', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <OrderProvider>
            <ChatProvider>
              <AdminMessages />
            </ChatProvider>
          </OrderProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Customer Messages & Chat/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search customer, email, order/i)).toBeInTheDocument();

    // Verify filter buttons
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unread/i })).toBeInTheDocument();
  });

  it('renders visible Message icons with unread badge in customer Navbar and Messages in AdminLayout sidebar', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    const { unmount } = render(
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <OrderProvider>
              <CartProvider>
                <ChatProvider>
                  <Navbar />
                </ChatProvider>
              </CartProvider>
            </OrderProvider>
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Standard nav items should exist
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cart' })).toBeInTheDocument();

    // The text label "Messages" should NOT be rendered as a navigation button link
    const textNavButtons = screen.queryAllByRole('button', { name: /^Messages$/i });
    expect(textNavButtons.length).toBe(0);

    // Message icons in customer navbar with title "Messages" and href "/messages"
    const messageLinks = screen.getAllByTitle(/^Messages/i);
    expect(messageLinks.length).toBeGreaterThanOrEqual(1);
    expect(messageLinks[0]).toHaveAttribute('href', '/messages');

    unmount();

    // Test Admin Layout with logged in Admin
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <OrderProvider>
              <CartProvider>
                <ChatProvider>
                  <AdminLoginWrapper>
                    <AdminLayout>
                      <div>Admin Content</div>
                    </AdminLayout>
                  </AdminLoginWrapper>
                </ChatProvider>
              </CartProvider>
            </OrderProvider>
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Admin sidebar navigation labels
      expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Inventory/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Orders/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Messages/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reports/i })).toBeInTheDocument();

      // Ensure sidebar (aside) contains messages link pointing to /admin/messages
      const aside = document.querySelector('aside');
      expect(aside).toBeInTheDocument();
      const asideMessageLink = aside?.querySelector('a[href="/admin/messages"]');
      expect(asideMessageLink).not.toBeNull();
      expect(asideMessageLink?.textContent).toContain('Messages');

      // Top headers (both desktop and mobile) should NOT contain a link to /admin/messages
      const headers = document.querySelectorAll('header');
      expect(headers.length).toBeGreaterThanOrEqual(1);
      headers.forEach(header => {
        expect(header.querySelector('a[href="/admin/messages"]')).toBeNull();
      });
    });
  });
});
