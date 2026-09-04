import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Message, ConversationSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface SendMessageParams {
  content: string;
  orderId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

interface ChatContextType {
  messages: Message[];
  conversations: ConversationSummary[];
  unreadCount: number;
  sendMessage: (params: SendMessageParams) => Promise<Message | null>;
  markAsRead: (customerId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  getCustomerMessages: (customerId: string) => Message[];
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'rufinos_messages_v1';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-seed-1',
    senderId: '1',
    senderName: 'Rufino Admin',
    senderRole: 'admin',
    customerId: '2',
    customerName: 'Test Customer',
    customerEmail: 'customer@test.com',
    content: 'Hello! Welcome to Rufino\'s Furniture. How can we help you today with your order or inquiries?',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: true,
  },
  {
    id: 'msg-seed-2',
    senderId: '2',
    senderName: 'Test Customer',
    senderRole: 'customer',
    customerId: '2',
    customerName: 'Test Customer',
    customerEmail: 'customer@test.com',
    orderId: 'ord-101',
    content: 'Hi! I would like to ask about the delivery schedule for my dining table order.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: true,
  },
  {
    id: 'msg-seed-3',
    senderId: '1',
    senderName: 'Rufino Admin',
    senderRole: 'admin',
    customerId: '2',
    customerName: 'Test Customer',
    customerEmail: 'customer@test.com',
    orderId: 'ord-101',
    content: 'Hello! Your dining table is scheduled for delivery on September 15. Our delivery team will contact you prior to arrival.',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    isRead: false,
  }
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved messages from localStorage', e);
      }
    }
    return INITIAL_MESSAGES;
  });
  const [loading, setLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      const endpoint = '/api/messages';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Merge with initial messages if server is brand new/empty
          if (data.length === 0 && messages.length > 0) {
            // keep local seed if server empty
          } else {
            setMessages(data);
          }
        }
      }
    } catch (error) {
      // Offline / fallback to local state
    }
  }, [messages.length]);

  // Initial fetch and polling every 3 seconds for active synchronization
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = useCallback(async ({
    content,
    orderId,
    customerId,
    customerName,
    customerEmail,
  }: SendMessageParams): Promise<Message | null> => {
    if (!content.trim()) return null;

    const senderRole = isAdmin ? 'admin' : 'customer';
    const currentUserId = user ? user.id : (customerId || '2');
    const currentUserName = user ? user.name : (customerName || 'Test Customer');
    const currentUserEmail = user ? user.email : (customerEmail || 'customer@test.com');

    const targetCustomerId = isAdmin ? (customerId || '2') : currentUserId;
    const targetCustomerName = isAdmin ? (customerName || 'Customer') : currentUserName;
    const targetCustomerEmail = isAdmin ? (customerEmail || '') : currentUserEmail;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole,
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      customerEmail: targetCustomerEmail,
      orderId: orderId || undefined,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });

      if (response.ok) {
        const savedMsg = await response.json();
        if (savedMsg && savedMsg.id) {
          setMessages(prev => prev.map(m => (m.id === newMsg.id ? savedMsg : m)));
          return savedMsg;
        }
      }
    } catch (error) {
      console.warn('API send message failed, stored locally in offline mode:', error);
    }

    return newMsg;
  }, [user, isAdmin]);

  const markAsRead = useCallback(async (targetCustomerId: string) => {
    if (!user) return;
    const readerRole = isAdmin ? 'admin' : 'customer';
    const senderRoleToMark = isAdmin ? 'customer' : 'admin';

    setMessages(prev =>
      prev.map(m => {
        if (m.customerId === targetCustomerId && m.senderRole === senderRoleToMark && !m.isRead) {
          return { ...m, isRead: true };
        }
        return m;
      })
    );

    try {
      await fetch('/api/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: targetCustomerId, readerRole }),
      });
    } catch (error) {
      // Fallback
    }
  }, [user, isAdmin]);

  const getCustomerMessages = useCallback((customerId: string) => {
    return messages
      .filter(m => m.customerId === customerId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // Group messages into conversation summaries for the Admin
  const conversations: ConversationSummary[] = useMemo(() => {
    const map = new Map<string, ConversationSummary>();

    messages.forEach(msg => {
      const cId = msg.customerId;
      const existing = map.get(cId);

      const isUnreadForAdmin = msg.senderRole === 'customer' && !msg.isRead;

      if (!existing) {
        map.set(cId, {
          customerId: cId,
          customerName: msg.customerName || 'Customer',
          customerEmail: msg.customerEmail,
          lastMessage: msg,
          unreadCount: isUnreadForAdmin ? 1 : 0,
          orderId: msg.orderId,
        });
      } else {
        if (new Date(msg.timestamp).getTime() > new Date(existing.lastMessage.timestamp).getTime()) {
          existing.lastMessage = msg;
          if (msg.orderId) existing.orderId = msg.orderId;
        }
        if (msg.customerName) existing.customerName = msg.customerName;
        if (msg.customerEmail) existing.customerEmail = msg.customerEmail;
        if (isUnreadForAdmin) existing.unreadCount += 1;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }, [messages]);

  // Calculate total unread count for current user
  const unreadCount = useMemo(() => {
    if (!user) return 0;
    if (isAdmin) {
      // Total unread messages from all customers
      return messages.filter(m => m.senderRole === 'customer' && !m.isRead).length;
    } else {
      // Unread messages from admin to this customer
      return messages.filter(m => m.customerId === user.id && m.senderRole === 'admin' && !m.isRead).length;
    }
  }, [messages, user, isAdmin]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversations,
        unreadCount,
        sendMessage,
        markAsRead,
        refreshMessages: fetchMessages,
        getCustomerMessages,
        loading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
