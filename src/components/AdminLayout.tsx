import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, LogOut, Menu, X, Warehouse, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useChat } from '@/context/ChatContext';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { orders } = useOrders();
  const { unreadCount } = useChat();

  const pendingCount = orders.filter(o => o.status === 'Pending').length;

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/admin" className="flex items-center">
            <img
              src="/logo.png"
              alt="Rufino's Furniture"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(item => (
            <Link key={item.to} to={item.to}>
              <Button
                variant={isActive(item.to) ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === 'Orders' && pendingCount > 0 && (
                  <Badge className="ml-auto bg-accent text-accent-foreground text-xs">{pendingCount}</Badge>
                )}
                {item.label === 'Messages' && unreadCount > 0 && (
                  <Badge className="ml-auto bg-blue-600 text-white text-xs">{unreadCount}</Badge>
                )}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />Logout
          </Button>
          <div className="mt-2 px-3 text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b bg-card px-8">
          <div className="text-sm font-medium text-muted-foreground">
            Rufino's Furniture <span className="text-foreground font-semibold">Admin Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/admin/messages" className="relative" title="Messages" aria-label="Messages">
                    <Button variant="ghost" size="icon" className="relative">
                      <MessageSquare className="h-5 w-5 text-slate-700" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm animate-in zoom-in">
                          {unreadCount}
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
            <div className="h-4 w-px bg-border"></div>
            <div className="text-xs text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Link to="/admin" className="flex items-center">
            <img
              src="/logo.png"
              alt="Rufino's Furniture"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/admin/messages" className="relative" title="Messages" aria-label="Messages">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white p-0 text-xs font-bold shadow-sm">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b bg-card p-4 lg:hidden space-y-1">
            {navItems.map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}>
                <Button variant={isActive(item.to) ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                  <item.icon className="h-4 w-4" />{item.label}
                  {item.label === 'Orders' && pendingCount > 0 && (
                    <Badge className="ml-auto bg-accent text-accent-foreground text-xs">{pendingCount}</Badge>
                  )}
                  {item.label === 'Messages' && unreadCount > 0 && (
                    <Badge className="ml-auto bg-red-600 text-white text-xs">{unreadCount}</Badge>
                  )}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />Logout
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
