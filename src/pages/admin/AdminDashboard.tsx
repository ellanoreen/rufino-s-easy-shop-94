import { Link } from 'react-router-dom';
import { Package, ShoppingCart, PhilippinePeso, TrendingUp, ArrowRight, Warehouse, FileText, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const statusColor = (status: string) => {
  switch (status) {
    case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Out for Delivery': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Confirmed': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const STATUS_COLORS: Record<string, string> = {
  Delivered: '#10b981',
  'Out for Delivery': '#3b82f6',
  Confirmed: '#6366f1',
  Pending: '#f59e0b',
  Cancelled: '#ef4444',
};

const AdminDashboard = () => {
  const { orders, allOrders } = useOrders();
  const { products } = useProducts();
  const { installationFee, updateInstallationFee } = useSettings();
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState('');

  const stats = [
    { label: 'Total Inventory', value: products.reduce((s, p) => s + p.stock, 0).toLocaleString(), icon: Package, color: 'bg-accent/10 text-accent' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { label: 'Revenue', value: `₱${allOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + Number(o.total), 0).toLocaleString()}`, icon: PhilippinePeso, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length, icon: TrendingUp, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' },
  ];

  const revenueData = useMemo(() => {
    const data: Record<string, { dateObj: Date; revenue: number }> = {};
    allOrders.forEach(o => {
      if (o.status === 'Delivered') {
        const dateObj = new Date(o.date);
        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (!data[dateStr]) {
          data[dateStr] = { dateObj, revenue: 0 };
        }
        data[dateStr].revenue += Number(o.total);
      }
    });

    const sortedData = Object.values(data)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(item => ({ date: item.dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }), revenue: item.revenue }))
      .slice(-7);
      
    // If empty, supply mock dummy data for aesthetics
    return sortedData.length > 0 ? sortedData : [
      { date: 'Mon', revenue: 0 },
      { date: 'Tue', revenue: 0 },
      { date: 'Wed', revenue: 0 },
    ];
  }, [allOrders]);

  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    const pieData = Object.keys(counts).map(status => ({ name: status, value: counts[status] }));
    return pieData.length > 0 ? pieData : [{ name: 'No Orders', value: 1 }];
  }, [orders]);

  const productsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.keys(counts).map(c => ({ name: c, value: counts[c] }));
  }, [products]);

  const inventoryStatus = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let inStock = 0;
    products.forEach(p => {
      if (p.stock === 0) outOfStock++;
      else if (p.stock <= 5) lowStock++;
      else inStock++;
    });
    return [
      { name: 'Healthy', value: inStock },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock },
    ];
  }, [products]);

  const INVENTORY_COLORS: Record<string, string> = {
    'Healthy': '#10b981',
    'Low Stock': '#f59e0b',
    'Out of Stock': '#ef4444',
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back! Here's your store overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Revenue Growth (Reports)</CardTitle>
            <CardDescription>Sales from completed and delivered orders over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Order Status (Orders)</CardTitle>
            <CardDescription>Distribution of all historical orders by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Orders']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Products by Category</CardTitle>
            <CardDescription>Breakdown of products across different categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[`#3b82f6`, `#8b5cf6`, `#ec4899`, `#06b6d4`, `#14b8a6`][index % 5] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Products']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Inventory Status</CardTitle>
            <CardDescription>Current stock levels across your entire catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {inventoryStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INVENTORY_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Items']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-xl">Recent Orders</CardTitle>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {o.status === 'Pending' && (
                      <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5">New</Badge>
                    )}
                    <div>
                      <p className="font-medium text-sm">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.id} · {o.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₱{o.total.toLocaleString()}</p>
                    <Badge variant="outline" className={statusColor(o.status)}>{o.status}</Badge>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-muted-foreground py-4">No orders yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/inventory" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Warehouse className="h-5 w-5" />Manage Inventory<ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/orders" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <ShoppingCart className="h-5 w-5" />Manage Orders<ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/reports" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <FileText className="h-5 w-5" />View Reports<ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>

            {/* Installation Fee Editor */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Installation Fee</span>
                </div>
                <span className="text-sm font-bold">₱{installationFee.toLocaleString()}</span>
              </div>
              {editingFee ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={feeInput}
                    onChange={e => setFeeInput(e.target.value)}
                    placeholder="Enter amount"
                    className="h-9"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const val = Number(feeInput);
                      if (!isNaN(val) && val >= 0) {
                        await updateInstallationFee(val);
                      }
                      setEditingFee(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingFee(false)}>Cancel</Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={() => { setFeeInput(String(installationFee)); setEditingFee(true); }}
                >
                  Edit Installation Fee
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
