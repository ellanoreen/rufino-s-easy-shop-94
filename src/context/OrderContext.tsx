import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Order, CartItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  if ('user_id' in item) {
    item.userId = item.user_id;
    delete item.user_id;
  }
  if ('feedback_date' in item) {
    item.feedbackDate = item.feedback_date || undefined;
    delete item.feedback_date;
  }
  return {
    ...item,
    total: Number(item.total),
    deleted: Boolean(item.deleted),
    deletedAt: item.deleted_at || item.deletedAt,
  } as Order;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [allRawOrders, setAllRawOrders] = useState<Order[]>([]);

  // Fetch customer-scoped orders (when a customer is logged in)
  useEffect(() => {
    if (!user) {
      setRawOrders([]);
      return;
    }
    if (isAdmin) {
      // Admin fetch: no userId filter — gets ALL orders
      fetch('/api/orders')
        .then(res => res.json())
        .then((data: any[]) => {
          const normalized = data.map(normalizeOrder);
          setAllRawOrders(normalized);
          setRawOrders(normalized);
        })
        .catch(err => console.error('Failed to fetch all orders (admin):', err));
    } else {
      // Customer fetch: scoped to their user_id only
      fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
        .then(res => res.json())
        .then((data: any[]) => {
          setRawOrders(data.map(normalizeOrder));
        })
        .catch(err => console.error('Failed to fetch orders:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin]);

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
        userId: user?.id || null,
      };
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });
      const newOrder = await res.json();
      const normalized = normalizeOrder(newOrder);
      setRawOrders(prev => [normalized, ...prev]);
      if (isAdmin) {
        setAllRawOrders(prev => [normalized, ...prev]);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  }, [user, isAdmin]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updatedOrder = await res.json();
      const normalized = normalizeOrder(updatedOrder);
      setRawOrders(prev => prev.map(o => o.id === orderId ? normalized : o));
      setAllRawOrders(prev => prev.map(o => o.id === orderId ? normalized : o));
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
      const softDelete = (o: Order) =>
        o.id === orderId
          ? { ...o, deleted: true, deletedAt: new Date().toISOString().split('T')[0] }
          : o;
      setRawOrders(prev => prev.map(softDelete));
      setAllRawOrders(prev => prev.map(softDelete));
    } catch (err) {
      console.error('Failed to delete order on server:', err);
      // Soft-delete locally in case of offline fallback
      const softDelete = (o: Order) =>
        o.id === orderId
          ? { ...o, deleted: true, deletedAt: new Date().toISOString().split('T')[0] }
          : o;
      setRawOrders(prev => prev.map(softDelete));
      setAllRawOrders(prev => prev.map(softDelete));
    }
  }, []);

  const submitFeedback = useCallback(async (orderId: string, rating: number, feedback: string) => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'You must be logged in to submit feedback.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, userId: user.id }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast({
          title: 'Could not submit feedback',
          description: errData.error || 'Something went wrong.',
          variant: 'destructive',
        });
        return;
      }
      const updatedOrder = await res.json();
      const normalized = normalizeOrder(updatedOrder);
      setRawOrders(prev => prev.map(o => o.id === orderId ? normalized : o));
      setAllRawOrders(prev => prev.map(o => o.id === orderId ? normalized : o));
      toast({ title: 'Feedback submitted!', description: 'Thank you for your review.' });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast({ title: 'Error', description: 'Failed to submit feedback. Please try again.', variant: 'destructive' });
    }
  }, [user]);

  // `orders` — non-deleted orders visible to the current user
  const orders = useMemo(() => rawOrders.filter(o => !o.deleted), [rawOrders]);
  // `allOrders` — ALL orders (including deleted) for admin analytics/reports
  const allOrders = allRawOrders;

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
