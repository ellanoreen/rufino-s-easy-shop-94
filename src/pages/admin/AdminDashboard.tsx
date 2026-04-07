import { Link } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight, Warehouse, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';

const statusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Processing': return 'bg-accent/20 text-accent';
    case 'Cancelled': return 'bg-destructive/20 text-destructive';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const AdminDashboard = () => {
  const { orders } = useOrders();
  const { products } = useProducts();

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-accent/10 text-accent' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { label: 'Revenue', value: `₱${orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length, icon: TrendingUp, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' },
  ];

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
            <Link to="/admin/products" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Package className="h-5 w-5" />Manage Products<ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
