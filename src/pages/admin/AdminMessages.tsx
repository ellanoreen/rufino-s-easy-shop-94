import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useChat } from '@/context/ChatContext';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageSquare,
  Search,
  Send,
  User,
  ShoppingBag,
  Clock,
  Check,
  CheckCheck,
  Filter,
  ArrowRight,
  ExternalLink,
  Package,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function AdminMessages() {
  const { conversations, getCustomerMessages, sendMessage, markAsRead } = useChat();
  const { allOrders } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    return searchParams.get('customerId') || (conversations.length > 0 ? conversations[0].customerId : null);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'orders'>('all');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedCustomerId with URL param if provided
  useEffect(() => {
    const qCustId = searchParams.get('customerId');
    if (qCustId) {
      setSelectedCustomerId(qCustId);
    } else if (!selectedCustomerId && conversations.length > 0) {
      setSelectedCustomerId(conversations[0].customerId);
    }
  }, [searchParams, conversations]);

  // Mark as read when admin opens a conversation
  useEffect(() => {
    if (selectedCustomerId) {
      markAsRead(selectedCustomerId);
    }
  }, [selectedCustomerId, markAsRead]);

  const activeConversation = useMemo(() => {
    if (!selectedCustomerId) return null;
    return conversations.find(c => c.customerId === selectedCustomerId) || null;
  }, [selectedCustomerId, conversations]);

  const conversationMessages = useMemo(() => {
    if (!selectedCustomerId) return [];
    return getCustomerMessages(selectedCustomerId);
  }, [selectedCustomerId, getCustomerMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length, selectedCustomerId]);

  // Find related order if specified
  const relatedOrder = useMemo(() => {
    const orderId = activeConversation?.orderId || conversationMessages.find(m => m.orderId)?.orderId;
    if (!orderId) return null;
    return allOrders.find(o => o.id === orderId);
  }, [activeConversation, conversationMessages, allOrders]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchSearch =
        conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.customerEmail && conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.orderId && conv.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'unread') return conv.unreadCount > 0;
      if (activeFilter === 'orders') return Boolean(conv.orderId);
      return true;
    });
  }, [conversations, searchTerm, activeFilter]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedCustomerId || sending) return;

    setSending(true);
    const content = replyText;
    setReplyText('');

    await sendMessage({
      content,
      customerId: selectedCustomerId,
      customerName: activeConversation?.customerName,
      customerEmail: activeConversation?.customerEmail,
      orderId: activeConversation?.orderId,
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-slate-800 tracking-tight">Customer Messages & Chat</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          Respond to customer questions, customized furniture requests, and order inquiries in real-time
        </p>
      </div>

      {/* Main Dual-Panel Chat Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[750px]">
        {/* Left Sidebar: Conversations List (5 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/30">
          {/* Search and Filters */}
          <div className="p-4 border-b space-y-3 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search customer, email, order..."
                className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unread ({conversations.filter(c => c.unreadCount > 0).length})
              </button>
              <button
                onClick={() => setActiveFilter('orders')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                With Orders
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No conversations found</p>
                <p className="text-xs mt-1">Customer chats will appear here</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.customerId === selectedCustomerId;
                return (
                  <button
                    key={conv.customerId}
                    onClick={() => {
                      setSelectedCustomerId(conv.customerId);
                      setSearchParams({ customerId: conv.customerId });
                    }}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-100/60 bg-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0">
                      {conv.customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {conv.customerName}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>

                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                        {conv.lastMessage.senderRole === 'admin' && <span className="text-slate-400">You: </span>}
                        {conv.lastMessage.content}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        {conv.orderId && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 border border-slate-200">
                            <ShoppingBag className="w-2.5 h-2.5" /> Order #{conv.orderId.slice(0, 8)}...
                          </span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Conversation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white">
          {selectedCustomerId && activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                    {activeConversation.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{activeConversation.customerName}</h2>
                    <p className="text-xs text-slate-500">{activeConversation.customerEmail || 'Registered Customer'}</p>
                  </div>
                </div>

                {relatedOrder && (
                  <Link to="/admin/orders">
                    <Button variant="outline" size="sm" className="gap-2 text-xs border-slate-200">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Order #{relatedOrder.id.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Related Order Quick Card Bar */}
              {relatedOrder && (
                <div className="px-5 py-3 bg-slate-50 border-b flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-blue-600" /> Order Details:
                    </span>
                    <span className="font-bold text-slate-900">₱{Number(relatedOrder.total).toLocaleString()}</span>
                    <span className="text-slate-500">· {relatedOrder.items.length} item(s)</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-semibold">
                      {relatedOrder.status}
                    </Badge>
                  </div>
                  <span className="text-slate-400">Placed on: {relatedOrder.date}</span>
                </div>
              )}

              {/* Messages History Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/40">
                {conversationMessages.map((msg, idx) => {
                  const isAdminMsg = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isAdminMsg && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 mb-1">
                            {msg.senderName?.charAt(0) || 'C'}
                          </div>
                        )}

                        <div>
                          {msg.orderId && (
                            <div className={`mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500 ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                              <ShoppingBag className="w-3 h-3 text-blue-600" />
                              <span>Order #{msg.orderId.slice(0, 8)}...</span>
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isAdminMsg
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>

                          <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isAdminMsg && (
                              <span title={msg.isRead ? 'Read by Customer' : 'Sent'}>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${activeConversation.customerName}... (Press Enter to send)`}
                    className="flex-1 bg-slate-50 border-slate-200 h-11 text-sm rounded-xl focus-visible:ring-slate-900"
                  />
                  <Button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="h-11 px-6 rounded-xl gap-2 font-medium bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <span>Reply</span>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-700">Select a Conversation</h3>
              <p className="text-sm max-w-sm mt-1">
                Choose a customer from the left list to view their message history and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
