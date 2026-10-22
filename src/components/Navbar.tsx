import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, MessageSquare, Bell, CheckCheck, Package, MailOpen, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusColor = (status: string) => {
  switch (status) {
    case 'Delivered':        return 'bg-green-100 text-green-800';
    case 'Out for Delivery': return 'bg-blue-100 text-blue-800';
    case 'Confirm':          return 'bg-indigo-100 text-indigo-800';
    case 'Pending':          return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':        return 'bg-red-100 text-red-800';
    default:                 return 'bg-secondary text-secondary-foreground';
  }
};

const formatTime = (createdAt: string) => {
  try {
    // Handle format: "YYYY-MM-DD HH:MI:SS"
    const d = new Date(createdAt.replace(' ', 'T'));
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)       return 'just now';
    if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch {
    return createdAt;
  }
};

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount: chatUnreadCount } = useChat();
  const { notifications, unreadCount: notifUnreadCount, markAsRead, markAsUnread, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedDesktop = notifRef.current?.contains(target);
      const clickedMobile = mobileNotifRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navigation links: Home, Shop, Cart, Orders (without text "Messages" label)
  const links = isAdmin
    ? [{ to: '/admin', label: 'Dashboard' }]
    : [
        { to: '/', label: 'Home' },
        { to: '/shop', label: 'Shop' },
        { to: '/cart', label: 'Cart' },
        ...(user
          ? [
              { to: '/orders', label: 'Orders' },
            ]
          : []),
      ];

  const isActive = (path: string) => location.pathname === path;

  const handleNotifClick = async (notifId: string, orderId: string) => {
    await markAsRead(notifId);
    setNotifOpen(false);
    navigate('/orders');
  };

  const handleMarkReadToggle = async (e: React.MouseEvent, notifId: string, currentlyRead: boolean) => {
    e.stopPropagation(); // prevent triggering the row click / navigation
    if (currentlyRead) {
      await markAsUnread(notifId);
    } else {
      await markAsRead(notifId);
    }
  };

  /** Reusable notification list items used in both desktop and mobile dropdowns */
  const NotificationItems = () => (
    <>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">You'll be notified when your order status changes.</p>
        </div>
      ) : (
        notifications.map(notif => (
          <div
            key={notif.id}
            id={`notification-item-${notif.id}`}
            className={`relative group w-full text-left flex gap-2 items-center transition-all border-l-4 ${
              !notif.isRead
                ? 'bg-accent/8 hover:bg-accent/15 border-l-accent'
                : 'bg-card hover:bg-muted/60 border-l-transparent'
            }`}
          >
            {/* Clickable area: navigates to orders and marks as read */}
            <button
              className="flex-1 flex gap-3 items-start px-3 py-3 min-w-0 text-left cursor-pointer"
              onClick={() => handleNotifClick(notif.id, notif.orderId)}
              aria-label={`View order notification: ${notif.message}`}
            >
              {/* Icon */}
              <div
                className={`shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-full ${
                  !notif.isRead ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Package className="h-4 w-4" />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    !notif.isRead ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'
                  }`}
                >
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(
                      notif.status
                    )}`}
                  >
                    {notif.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(notif.createdAt)}
                  </span>
                  {/* Read/Unread pill label indicator */}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      !notif.isRead
                        ? 'bg-accent/20 text-accent font-semibold'
                        : 'bg-muted text-muted-foreground/60'
                    }`}
                  >
                    {notif.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
              {/* Unread indicator dot */}
              {!notif.isRead && (
                <span className="shrink-0 mt-2.5 h-2 w-2 rounded-full bg-accent" />
              )}
            </button>

            {/* Mark read / unread toggle button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    id={`notif-toggle-${notif.id}`}
                    className={`shrink-0 self-center mr-3 p-1.5 rounded-md transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 ${
                      notif.isRead
                        ? 'hover:bg-accent/20 text-muted-foreground hover:text-accent'
                        : 'hover:bg-accent/20 text-accent hover:text-accent-foreground'
                    }`}
                    onClick={(e) => handleMarkReadToggle(e, notif.id, notif.isRead)}
                    aria-label={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                    title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {notif.isRead ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MailOpen className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{notif.isRead ? 'Mark as unread' : 'Mark as read'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))
      )}
    </>
  );

  /** Reusable dropdown header */
  const NotificationHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Notifications</span>
        {notifUnreadCount > 0 && (
          <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full">
            {notifUnreadCount} unread
          </Badge>
        )}
      </div>
      {notifUnreadCount > 0 && (
        <button
          id="mark-all-read-btn"
          onClick={markAllAsRead}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Mark all as read"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      )}
    </div>
  );

  /** Reusable dropdown footer */
  const NotificationFooter = () =>
    notifications.length > 0 ? (
      <div className="border-t px-4 py-2.5 bg-muted/20">
        <Link
          to="/orders"
          onClick={() => setNotifOpen(false)}
          className="block text-center text-xs text-primary hover:underline font-medium"
        >
          View all orders →
        </Link>
      </div>
    ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center">
          <img
            src="/logo.png"
            alt="Rufino's Furniture"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link key={l.to} to={l.to}>
              <Button variant={isActive(l.to) ? 'secondary' : 'ghost'} size="sm" className="relative">
                {l.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop Icons & Profile */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Message/Chat icon with tooltip for customers */}
          {!isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/messages" className="relative" title="Messages" aria-label="Messages">
                    <Button variant="ghost" size="icon" className="relative">
                      <MessageSquare className="h-5 w-5" />
                      {chatUnreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm animate-in zoom-in">
                          {chatUnreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Messages</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Notification Bell — customers only */}
          {!isAdmin && user && (
            <div className="relative" ref={notifRef}>
              <Button
                id="notification-bell-btn"
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => setNotifOpen(prev => !prev)}
              >
                <Bell className="h-5 w-5" />
                {notifUnreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-xs font-bold text-accent-foreground shadow-sm animate-in zoom-in">
                    {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div
                  id="notification-dropdown"
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
                >
                  <NotificationHeader />
                  <div className="max-h-80 overflow-y-auto divide-y">
                    <NotificationItems />
                  </div>
                  <NotificationFooter />
                </div>
              )}
            </div>
          )}

          {/* Cart icon only for customers */}
          {!isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/cart" className="relative" title="Shopping Cart" aria-label="Shopping Cart">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-xs text-accent-foreground">
                          {itemCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shopping Cart</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link to="/login"><Button size="sm">Login</Button></Link>
          )}
        </div>

        {/* Mobile icons & toggle */}
        <div className="flex items-center gap-1 md:hidden">
          {!isAdmin && (
            <>
              <Link to="/messages" className="relative" title="Messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {chatUnreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm">
                      {chatUnreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Mobile notification bell */}
              {user && (
                <div className="relative" ref={undefined}>
                  <Button
                    id="notification-bell-mobile-btn"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                    onClick={() => { setNotifOpen(prev => !prev); setOpen(false); }}
                  >
                    <Bell className="h-5 w-5" />
                    {notifUnreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-xs font-bold text-accent-foreground shadow-sm">
                        {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}

              <Link to="/cart" className="relative" title="Shopping Cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-xs text-accent-foreground">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile notification dropdown (rendered outside nav for full width) */}
      {notifOpen && !isAdmin && user && (
        <div
          ref={mobileNotifRef}
          className="md:hidden absolute left-4 right-4 top-20 z-50 rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150"
        >
          <NotificationHeader />
          <div className="max-h-72 overflow-y-auto divide-y">
            <NotificationItems />
          </div>
          <NotificationFooter />
        </div>
      )}

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card px-4 pb-4 pt-2 md:hidden space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              <Button variant={isActive(l.to) ? 'secondary' : 'ghost'} className="w-full justify-start h-11 text-base relative">
                {l.label}
              </Button>
            </Link>
          ))}
          {!isAdmin && (
            <Link to="/messages" onClick={() => setOpen(false)}>
              <Button variant={isActive('/messages') ? 'secondary' : 'ghost'} className="w-full justify-start h-11 text-base relative">
                Messages
                {chatUnreadCount > 0 && (
                  <Badge className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {chatUnreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          {user ? (
            <div className="pt-2 border-t mt-2">
              <div className="px-3 py-1.5 text-sm font-medium text-muted-foreground">{user.name} ({user.email})</div>
              <Button variant="outline" className="w-full justify-start mt-1 text-destructive hover:text-destructive h-11" onClick={() => { logout(); setOpen(false); }}>Logout</Button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="block pt-2">
              <Button className="w-full h-11 text-base">Login</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
