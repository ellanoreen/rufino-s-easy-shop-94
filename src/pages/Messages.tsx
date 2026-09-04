import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Send,
  MessageSquare,
  ShoppingBag,
  Check,
  CheckCheck,
  Headphones,
  Sparkles,
  ChevronRight,
  X,
  PackageCheck
} from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { getCustomerMessages, sendMessage, markAsRead } = useChat();
  const { orders } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();

  const [inputContent, setInputContent] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(searchParams.get('orderId'));
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = user?.id || '2';
  const customerMessages = getCustomerMessages(customerId);

  // Sync query param if changed
  useEffect(() => {
    const qOrderId = searchParams.get('orderId');
    if (qOrderId) {
      setSelectedOrderId(qOrderId);
    }
  }, [searchParams]);

  // Mark admin messages as read when viewing
  useEffect(() => {
    if (customerId) {
      markAsRead(customerId);
    }
  }, [customerId, customerMessages.length, markAsRead]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [customerMessages.length]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, orders]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || sending) return;

    setSending(true);
    const content = inputContent;
    setInputContent('');

    await sendMessage({
      content,
      orderId: selectedOrderId || undefined,
      customerId: user?.id,
      customerName: user?.name,
      customerEmail: user?.email,
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today, ${timeStr}`;

      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">Customer Support & Chat</h1>
            <Badge variant="outline" className="gap-1 border-green-500/30 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Admin Online
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Direct communication with Rufino's Furniture customer service and sales team
          </p>
        </div>

        {orders.length > 0 && (
          <Link to="/orders">
            <Button variant="outline" size="sm" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              View My Orders
            </Button>
          </Link>
        )}
      </div>

      {/* Main Chat Container */}
      <div className="bg-card rounded-2xl border shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header Info Bar */}
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-lg border border-primary/20">
              R
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Rufino's Furniture Representative</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Headphones className="h-3 w-3 text-muted-foreground" />
                Store Assistance & Order Inquiries
              </p>
            </div>
          </div>

          {/* Quick Order Selector Pill */}
          {orders.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Discussing Order:</span>
              <select
                value={selectedOrderId || ''}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedOrderId(val || null);
                  if (val) {
                    setSearchParams({ orderId: val });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="">-- General Inquiries --</option>
                {orders.map(ord => (
                  <option key={ord.id} value={ord.id}>
                    Order #{ord.id.slice(0, 8)}... (₱{Number(ord.total).toLocaleString()} - {ord.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Order Context Banner */}
        {selectedOrder && (
          <div className="px-4 py-2.5 bg-accent/5 border-b flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-accent flex items-center gap-1">
                <PackageCheck className="h-3.5 w-3.5" /> Order #{selectedOrder.id}:
              </span>
              <span className="text-muted-foreground font-medium">₱{Number(selectedOrder.total).toLocaleString()}</span>
              <span className="text-muted-foreground">· {selectedOrder.items.length} item(s)</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                {selectedOrder.status}
              </Badge>
            </div>
            <button
              onClick={() => {
                setSelectedOrderId(null);
                setSearchParams({});
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              title="Clear order reference"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-muted/10">
          {customerMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-foreground text-base">No messages yet</h3>
              <p className="text-sm max-w-sm mt-1">
                Send a message below to start chatting with our customer support team about products, customized orders, or delivery updates.
              </p>
            </div>
          ) : (
            customerMessages.map((msg, idx) => {
              const isMe = msg.senderRole === 'customer';
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar for Admin */}
                    {!isMe && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 mb-1 border">
                        R
                      </div>
                    )}

                    <div>
                      {/* Related Order Tag */}
                      {msg.orderId && (
                        <div className={`mb-1 flex items-center gap-1 text-[11px] font-medium ${isMe ? 'justify-end text-primary' : 'justify-start text-muted-foreground'}`}>
                          <ShoppingBag className="h-3 w-3" />
                          <span>Regarding Order #{msg.orderId.slice(0, 8)}...</span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border text-card-foreground rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>

                      {/* Timestamp & Read Receipts */}
                      <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {isMe && (
                          <span className="flex items-center" title={msg.isRead ? 'Read by Admin' : 'Sent'}>
                            {msg.isRead ? (
                              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t bg-card">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedOrderId ? `Ask about Order #${selectedOrderId.slice(0, 8)}...` : "Type a message to Rufino's Furniture team..."}
              className="flex-1 bg-muted/30 focus-visible:ring-primary h-11 text-sm rounded-xl"
            />
            <Button
              type="submit"
              disabled={!inputContent.trim() || sending}
              className="h-11 px-5 rounded-xl gap-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
