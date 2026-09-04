import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LayoutDashboard, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useChat();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Admin should NOT see shopping links; Customer should NOT see admin links
  const links = isAdmin
    ? [{ to: '/admin', label: 'Dashboard' }]
    : [
        { to: '/', label: 'Home' },
        { to: '/shop', label: 'Shop' },
        { to: '/cart', label: 'Cart' },
        ...(user
          ? [
              { to: '/orders', label: 'Orders' },
              { to: '/messages', label: 'Messages', badge: unreadCount },
            ]
          : []),
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center">
          <img
            src="/logo.png"
            alt="Rufino's Furniture"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link key={l.to} to={l.to}>
              <Button variant={isActive(l.to) ? 'secondary' : 'ghost'} size="sm" className="relative">
                {l.label}
                {Boolean(l.badge && l.badge > 0) && (
                  <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {l.badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {/* Message icon for customers */}
          {!isAdmin && (
            <Link to="/messages" className="relative" title="Messages & Customer Support">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm animate-in zoom-in">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* Cart icon only for customers */}
          {!isAdmin && (
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
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
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

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card px-4 pb-4 pt-2 md:hidden">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              <Button variant={isActive(l.to) ? 'secondary' : 'ghost'} className="w-full justify-start relative">
                {l.label}
                {Boolean(l.badge && l.badge > 0) && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {l.badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setOpen(false); }}>Logout</Button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Login</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
