import React, { createContext, useContext, useState, useCallback } from 'react';
import { Order, CartItem } from '@/types';
import { sampleOrders } from '@/data/products';

interface OrderContextType {
  orders: Order[];
  placeOrder: (items: CartItem[], total: number, customerName: string, address: string, contact: string, paymentMethod: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  deleteOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const getExpectedDeliveryDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  const placeOrder = useCallback((items: CartItem[], total: number, customerName: string, address: string, contact: string, paymentMethod: string) => {
    const newOrder: Order = {
      id: `ORD-${String(Date.now()).slice(-6)}`,
      items,
      total,
      status: 'Pending',
      customerName,
      address,
      contact,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: getExpectedDeliveryDate(),
    };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus, deleteOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};
