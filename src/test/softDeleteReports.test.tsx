import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ProductProvider, useProducts } from '@/context/ProductContext';
import { OrderProvider, useOrders } from '@/context/OrderContext';
import { Product, Order } from '@/types';

describe('Soft Delete & Historical Reports Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ProductContext separates active products from allProducts archive after deletion', async () => {
    const initialProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Dining Table',
        description: 'Solid wood',
        price: 12000,
        image: '/img1.jpg',
        images: ['/img1.jpg'],
        category: 'Dining',
        stock: 5,
        sizes: ['Standard'],
        colors: ['Walnut'],
        deleted: false,
      },
      {
        id: 'prod-2',
        name: 'Coffee Table',
        description: 'Glass top',
        price: 5000,
        image: '/img2.jpg',
        images: ['/img2.jpg'],
        category: 'Living Room',
        stock: 2,
        sizes: ['Standard'],
        colors: ['Black'],
        deleted: false,
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/products' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(initialProducts),
        });
      }
      if (url === '/api/products/prod-2' && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ message: 'Product archived successfully' }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductProvider>{children}</ProductProvider>
    );

    const { result } = renderHook(() => useProducts(), { wrapper });

    // Wait for initial fetch to populate
    await act(async () => {
      await new Promise(r => setTimeout(r, 20));
    });

    expect(result.current.products.length).toBe(2);
    expect(result.current.allProducts.length).toBe(2);

    // Delete prod-2
    await act(async () => {
      await result.current.deleteProduct('prod-2');
    });

    // Active products should only have 1 item
    expect(result.current.products.length).toBe(1);
    expect(result.current.products[0].id).toBe('prod-1');

    // allProducts historical archive must STILL retain both items
    expect(result.current.allProducts.length).toBe(2);
    const archivedItem = result.current.allProducts.find(p => p.id === 'prod-2');
    expect(archivedItem?.deleted).toBe(true);
  });

  it('OrderContext separates active orders from allOrders archive after deletion', async () => {
    const initialOrders: Order[] = [
      {
        id: 'ord-101',
        customerName: 'Maria Santos',
        address: 'Manila',
        contact: '09123456789',
        date: '2026-09-01',
        expectedDeliveryDate: '2026-09-15',
        paymentMethod: 'Cash on Delivery',
        status: 'Delivered',
        total: 15000,
        items: [
          {
            product: {
              id: 'prod-1',
              name: 'Dining Table',
              description: 'Solid wood',
              price: 15000,
              image: '/img1.jpg',
              images: ['/img1.jpg'],
              category: 'Dining',
              stock: 3,
              sizes: ['Standard'],
              colors: ['Walnut'],
            },
            quantity: 1,
          },
        ],
        deleted: false,
      },
      {
        id: 'ord-102',
        customerName: 'Juan Dela Cruz',
        address: 'Quezon City',
        contact: '09987654321',
        date: '2026-09-02',
        expectedDeliveryDate: '2026-09-16',
        paymentMethod: 'GCash',
        status: 'Delivered',
        total: 8000,
        items: [
          {
            product: {
              id: 'prod-99',
              name: 'Deleted Product',
              description: 'Old item',
              price: 8000,
              image: '/img99.jpg',
              images: ['/img99.jpg'],
              category: 'Office',
              stock: 0,
              sizes: ['Standard'],
              colors: ['Grey'],
            },
            quantity: 1,
          },
        ],
        deleted: false,
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/orders' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(initialOrders),
        });
      }
      if (url === '/api/orders/ord-102' && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Order archived successfully' }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OrderProvider>{children}</OrderProvider>
    );

    const { result } = renderHook(() => useOrders(), { wrapper });

    await act(async () => {
      await new Promise(r => setTimeout(r, 20));
    });

    expect(result.current.orders.length).toBe(2);
    expect(result.current.allOrders.length).toBe(2);

    // Delete ord-102
    await act(async () => {
      await result.current.deleteOrder('ord-102');
    });

    // Active orders has 1 order
    expect(result.current.orders.length).toBe(1);
    expect(result.current.orders[0].id).toBe('ord-101');

    // allOrders historical archive preserves both orders and revenue
    expect(result.current.allOrders.length).toBe(2);
    const totalHistoricalRevenue = result.current.allOrders
      .filter(o => o.status === 'Delivered')
      .reduce((s, o) => s + Number(o.total), 0);
    expect(totalHistoricalRevenue).toBe(23000);
  });
});
