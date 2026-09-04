import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdminReports from '@/pages/admin/AdminReports';
import { OrderProvider } from '@/context/OrderContext';
import { ProductProvider } from '@/context/ProductContext';
import { Order, Product } from '@/types';

describe('AdminReports Timeframe & Month Display', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockOrders: Order[] = [
    {
      id: 'ord-current',
      customerName: 'Juan Dela Cruz',
      address: 'Manila',
      contact: '09123456789',
      date: '2026-09-02',
      expectedDeliveryDate: '2026-09-10',
      paymentMethod: 'Cash on Delivery',
      status: 'Delivered',
      total: 5000,
      items: [
        {
          product: {
            id: 'prod-1',
            name: 'Chair',
            description: 'Wooden chair',
            price: 5000,
            image: '/chair.jpg',
            images: ['/chair.jpg'],
            category: 'Living Room',
            stock: 10,
            sizes: ['Standard'],
            colors: ['Brown'],
          },
          quantity: 1,
        },
      ],
      deleted: false,
    },
    {
      id: 'ord-last-month',
      customerName: 'Maria Santos',
      address: 'Cebu',
      contact: '09987654321',
      date: '2026-08-15',
      expectedDeliveryDate: '2026-08-20',
      paymentMethod: 'GCash',
      status: 'Delivered',
      total: 8000,
      items: [
        {
          product: {
            id: 'prod-2',
            name: 'Table',
            description: 'Dining table',
            price: 8000,
            image: '/table.jpg',
            images: ['/table.jpg'],
            category: 'Dining',
            stock: 5,
            sizes: ['Standard'],
            colors: ['Walnut'],
          },
          quantity: 1,
        },
      ],
      deleted: false,
    },
    {
      id: 'ord-july',
      customerName: 'Pedro Penduko',
      address: 'Davao',
      contact: '09112223333',
      date: '2026-07-20',
      expectedDeliveryDate: '2026-07-25',
      paymentMethod: 'GCash',
      status: 'Delivered',
      total: 12000,
      items: [
        {
          product: {
            id: 'prod-3',
            name: 'Bed Frame',
            description: 'Queen bed',
            price: 12000,
            image: '/bed.jpg',
            images: ['/bed.jpg'],
            category: 'Bedroom',
            stock: 3,
            sizes: ['Queen'],
            colors: ['Oak'],
          },
          quantity: 1,
        },
      ],
      deleted: false,
    },
  ];

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Chair',
      description: 'Wooden chair',
      price: 5000,
      image: '/chair.jpg',
      images: ['/chair.jpg'],
      category: 'Living Room',
      stock: 10,
      sizes: ['Standard'],
      colors: ['Brown'],
      date: '2026-09-01',
      deleted: false,
    },
    {
      id: 'prod-2',
      name: 'Table',
      description: 'Dining table',
      price: 8000,
      image: '/table.jpg',
      images: ['/table.jpg'],
      category: 'Dining',
      stock: 5,
      sizes: ['Standard'],
      colors: ['Walnut'],
      date: '2026-08-10',
      deleted: false,
    },
  ];

  const renderComponent = () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrders),
        });
      }
      if (url === '/api/products') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    return render(
      <ProductProvider>
        <OrderProvider>
          <AdminReports />
        </OrderProvider>
      </ProductProvider>
    );
  };

  it('renders "All Time" by default', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
      expect(screen.getAllByText('All Time').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays specific month and year when "monthly" (This Month) is selected', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'monthly' } });

    const expectedMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();
  });

  it('displays specific previous month and year when "last_month" is selected', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'last_month' } });

    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const expectedLastMonthYear = lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(expectedLastMonthYear)).toBeInTheDocument();
  });

  it('displays specific selected month and year when "specific_month" is chosen', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'specific_month' } });

    const monthInput = screen.getByDisplayValue(/2026-/);
    fireEvent.change(monthInput, { target: { value: '2026-07' } });

    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  it('displays full month name when custom range covers an exact whole month', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);

    fireEvent.change(dateInputs[0], { target: { value: '2026-07-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-07-31' } });

    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  it('updates period across all tabs (Sales, Orders, Inventory)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Period:/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'monthly' } });

    const expectedMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();

    // Switch to Orders tab
    const ordersTab = screen.getByRole('button', { name: /Orders/i });
    fireEvent.click(ordersTab);
    expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();

    // Switch to Inventory tab
    const inventoryTab = screen.getByRole('button', { name: /Inventory/i });
    fireEvent.click(inventoryTab);
    expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();
  });
});
