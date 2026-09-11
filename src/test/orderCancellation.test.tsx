import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Orders from '@/pages/Orders';
import { OrderProvider } from '@/context/OrderContext';
import { AuthProvider } from '@/context/AuthContext';

// Mock useAuth for customer user
vi.mock('@/context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'cust-1', name: 'Test Customer', email: 'customer@test.com', role: 'customer' as const },
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

describe('Customer Order Cancellation Feature', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Cancel Order button for Pending order and opens confirmation dialog', async () => {
    const mockOrder = {
      id: 'ORD-1001',
      userId: 'cust-1',
      customerName: 'Test Customer',
      address: '123 Test St',
      contact: '09123456789',
      date: '2026-09-11',
      expectedDeliveryDate: '2026-09-25',
      paymentMethod: 'Cash on Delivery',
      status: 'Pending',
      total: 3500,
      items: [
        {
          product: {
            id: 'p1',
            name: 'Wooden Chair',
            description: 'Sturdy chair',
            price: 3500,
            image: '/chair.jpg',
            images: ['/chair.jpg'],
            category: 'Chairs',
            stock: 10,
          },
          quantity: 1,
        },
      ],
      deleted: false,
    };

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/orders?userId=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockOrder]),
        });
      }
      if (url === '/api/orders/ORD-1001/status' && options?.method === 'PUT') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockOrder, status: body.status }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <OrderProvider>
            <Orders />
          </OrderProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('ORD-1001')).toBeInTheDocument();
    });

    // Check Cancel Order button is rendered for Pending order
    const cancelButton = screen.getByRole('button', { name: /Cancel Order/i });
    expect(cancelButton).toBeInTheDocument();

    // Click Cancel Order button
    fireEvent.click(cancelButton);

    // Verify confirmation dialog title & description
    expect(screen.getByText('Are you sure you want to cancel this order?')).toBeInTheDocument();

    // Confirm cancellation
    const confirmAction = screen.getByRole('button', { name: /Yes, cancel order/i });
    fireEvent.click(confirmAction);

    // Verify API called with status 'Cancelled'
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/ORD-1001/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'Cancelled', userId: 'cust-1' }),
        })
      );
    });

    // Verify status updated to Cancelled
    await waitFor(() => {
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  it('does NOT render Cancel Order button for non-Pending orders (e.g. Delivered or Cancelled)', async () => {
    const mockDeliveredOrder = {
      id: 'ORD-1002',
      userId: 'cust-1',
      customerName: 'Test Customer',
      address: '123 Test St',
      contact: '09123456789',
      date: '2026-09-10',
      expectedDeliveryDate: '2026-09-24',
      paymentMethod: 'GCash',
      status: 'Delivered',
      total: 5000,
      items: [],
      deleted: false,
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/orders?userId=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockDeliveredOrder]),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <OrderProvider>
            <Orders />
          </OrderProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-1002')).toBeInTheDocument();
    });

    // Cancel Order button must not exist
    expect(screen.queryByRole('button', { name: /Cancel Order/i })).not.toBeInTheDocument();
  });
});
