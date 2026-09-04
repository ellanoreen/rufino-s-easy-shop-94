import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Order, CartItem } from '@/types';

interface OrderContextType {
  orders: Order[];
  allOrders: Order[];
  placeOrder: (
    items: CartItem[],
    total: number,
    customerName: string,
    address: string,
    contact: string,
    paymentMethod: string,
    installationSelected?: boolean,
    installationFee?: number
  ) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  submitFeedback: (orderId: string, rating: number, feedback: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const getExpectedDeliveryDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

const normalizeOrder = (o: any): Order => {
  const item = { ...o };
  if ('installation_selected' in item) {
    item.installationSelected = item.installation_selected;
    delete item.installation_selected;
  }
  if ('installation_fee' in item) {
    item.installationFee = Number(item.installation_fee);
    delete item.installation_fee;
  }
  return {
    ...item,
    total: Number(item.total),
    deleted: Boolean(item.deleted),
    deletedAt: item.deleted_at || item.deletedAt,
  } as Order;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawOrders, setRawOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then((data: any[]) => {
        setRawOrders(data.map(normalizeOrder));
      })
      .catch(err => console.error('Failed to fetch orders:', err));
  }, []);

  const placeOrder = useCallback(async (
    items: CartItem[],
    total: number,
    customerName: string,
    address: string,
    contact: string,
    paymentMethod: string,
    installationSelected?: boolean,
    installationFee?: number
  ) => {
    try {
      const newOrderData = {
        items,
        total,
        status: 'Pending',
        customerName,
        address,
        contact,
        paymentMethod,
        installationSelected: installationSelected ?? false,
        installationFee: installationFee ?? 0,
        date: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: getExpectedDeliveryDate(),
      };
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });
      const newOrder = await res.json();
      setRawOrders(prev => [normalizeOrder(newOrder), ...prev]);
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updatedOrder = await res.json();
      setRawOrders(prev => prev.map(o => o.id === orderId ? normalizeOrder(updatedOrder) : o));
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Failed to delete order (${res.status})`);
      }
      setRawOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, deleted: true, deletedAt: new Date().toISOString().split('T')[0] }
            : o
        )
      );
    } catch (err) {
      console.error('Failed to delete order on server:', err);
      // Soft-delete locally in case of offline fallback
      setRawOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, deleted: true, deletedAt: new Date().toISOString().split('T')[0] }
            : o
        )
      );
    }
  }, []);

  const submitFeedback = useCallback(async (orderId: string, rating: number, feedback: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const updatedOrder = await res.json();
      setRawOrders(prev => prev.map(o => o.id === orderId ? normalizeOrder(updatedOrder) : o));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, []);

  const orders = useMemo(() => rawOrders.filter(o => !o.deleted), [rawOrders]);
  const allOrders = rawOrders;

  return (
    <OrderContext.Provider value={{ orders, allOrders, placeOrder, updateOrderStatus, deleteOrder, submitFeedback }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};
