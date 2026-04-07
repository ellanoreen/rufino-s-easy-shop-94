import { useState } from 'react';
import { FileText, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { Order } from '@/types';

const AdminReports = () => {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedInventoryFilter, setSelectedInventoryFilter] = useState<'Total Products' | 'Total Stock' | 'Low Stock' | null>(null);
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<'Total Revenue' | 'Completed Orders' | 'Avg Order Value' | null>(null);

  const totalRevenue = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  const CustomerOrdersTable = ({ displayOrders, title }: { displayOrders: Order[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-4 font-medium text-muted-foreground">Order ID</th>
                <th className="p-4 font-medium text-muted-foreground">Customer Name</th>
                <th className="p-4 font-medium text-muted-foreground">Address</th>
                <th className="p-4 font-medium text-muted-foreground">Contact</th>
                <th className="p-4 font-medium text-muted-foreground">Date</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Items</th>
                <th className="p-4 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-medium">{o.id}</td>
                  <td className="p-4 font-medium">{o.customerName}</td>
                  <td className="p-4 text-muted-foreground max-w-[200px] truncate">{o.address}</td>
                  <td className="p-4">{o.contact}</td>
                  <td className="p-4 text-muted-foreground">{o.date}</td>
                  <td className="p-4"><Badge variant="outline" className={o.status === "Pending" ? "bg-orange-100 text-orange-800" : o.status === "Cancelled" ? "bg-red-100 text-red-800" : o.status === "Delivered" ? "bg-green-100 text-green-800" : ""}>{o.status}</Badge></td>
                  <td className="p-4">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="p-4 font-semibold">₱{o.total.toLocaleString()}</td>
                </tr>
              ))}
              {displayOrders.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders found for this status.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const InventoryTable = ({ displayProducts, title }: { displayProducts: typeof products, title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-4 font-medium text-muted-foreground">Product ID</th>
                <th className="p-4 font-medium text-muted-foreground">Name</th>
                <th className="p-4 font-medium text-muted-foreground">Category</th>
                <th className="p-4 font-medium text-muted-foreground">Price</th>
                <th className="p-4 font-medium text-muted-foreground">Stock</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-medium">{p.id}</td>
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="h-8 w-8 rounded object-cover" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4"><Badge variant="outline">{p.category}</Badge></td>
                  <td className="p-4 font-semibold">₱{p.price.toLocaleString()}</td>
                  <td className="p-4">
                    <Badge variant={p.stock <= 0 ? "destructive" : p.stock <= 5 ? "destructive" : "secondary"}>
                      {p.stock <= 0 ? "Out of Stock" : p.stock}
                    </Badge>
                  </td>
                </tr>
              ))}
              {displayProducts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found for this status.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reports</h1>
        <p className="mt-1 text-muted-foreground">Sales, orders, and inventory reports</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales"><DollarSign className="h-4 w-4 mr-1" />Sales</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="h-4 w-4 mr-1" />Orders</TabsTrigger>
          <TabsTrigger value="inventory"><Package className="h-4 w-4 mr-1" />Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card onClick={() => setSelectedSalesFilter('Total Revenue')} className={`cursor-pointer transition-colors border-2 hover:border-primary/50 ${selectedSalesFilter === 'Total Revenue' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}>
              <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">₱{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
              </CardContent>
            </Card>
            <Card onClick={() => setSelectedSalesFilter('Completed Orders')} className={`cursor-pointer transition-colors border-2 hover:border-accent/50 ${selectedSalesFilter === 'Completed Orders' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent'}`}>
              <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-3xl font-bold mt-1">{completedOrders}</p>
              </CardContent>
            </Card>
            <Card onClick={() => setSelectedSalesFilter('Avg Order Value')} className={`cursor-pointer transition-colors border-2 hover:border-green-600/50 ${selectedSalesFilter === 'Avg Order Value' ? 'border-green-600 ring-2 ring-green-600/20' : 'border-transparent'}`}>
              <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-3xl font-bold mt-1">₱{completedOrders > 0 ? Math.round(totalRevenue / completedOrders).toLocaleString() : '0'}</p>
              </CardContent>
            </Card>
          </div>

          {selectedSalesFilter && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CustomerOrdersTable 
                displayOrders={orders.filter(o => o.status === 'Completed')} 
                title={`${selectedSalesFilter} (Completed Orders)`}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card onClick={() => setSelectedStatus('Total')} className={`cursor-pointer transition-colors border-2 hover:border-primary/50 ${selectedStatus === 'Total' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Total</p><p className="text-3xl font-bold mt-1">{totalOrders}</p></CardContent></Card>
            <Card onClick={() => setSelectedStatus('Pending')} className={`cursor-pointer transition-colors border-2 hover:border-orange-600/50 ${selectedStatus === 'Pending' ? 'border-orange-600 ring-2 ring-orange-600/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Pending</p><p className="text-3xl font-bold mt-1 text-orange-600">{pendingOrders}</p></CardContent></Card>
            <Card onClick={() => setSelectedStatus('Processing')} className={`cursor-pointer transition-colors border-2 hover:border-accent/50 ${selectedStatus === 'Processing' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Processing</p><p className="text-3xl font-bold mt-1 text-accent">{processingOrders}</p></CardContent></Card>
            <Card onClick={() => setSelectedStatus('Shipped')} className={`cursor-pointer transition-colors border-2 hover:border-blue-600/50 ${selectedStatus === 'Shipped' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Shipped</p><p className="text-3xl font-bold mt-1 text-blue-600">{shippedOrders}</p></CardContent></Card>
            <Card onClick={() => setSelectedStatus('Delivered')} className={`cursor-pointer transition-colors border-2 hover:border-green-600/50 ${selectedStatus === 'Delivered' ? 'border-green-600 ring-2 ring-green-600/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Delivered</p><p className="text-3xl font-bold mt-1 text-green-600">{deliveredOrders}</p></CardContent></Card>
            <Card onClick={() => setSelectedStatus('Cancelled')} className={`cursor-pointer transition-colors border-2 hover:border-destructive/50 ${selectedStatus === 'Cancelled' ? 'border-destructive ring-2 ring-destructive/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Cancelled</p><p className="text-3xl font-bold mt-1 text-destructive">{cancelledOrders}</p></CardContent></Card>
          </div>

          {selectedStatus && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CustomerOrdersTable 
                displayOrders={selectedStatus === 'Total' ? orders : orders.filter(o => o.status === selectedStatus)} 
                title={`${selectedStatus} Orders`}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card onClick={() => setSelectedInventoryFilter('Total Products')} className={`cursor-pointer transition-colors border-2 hover:border-primary/50 ${selectedInventoryFilter === 'Total Products' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Total Products</p><p className="text-3xl font-bold mt-1">{products.length}</p></CardContent></Card>
            <Card onClick={() => setSelectedInventoryFilter('Total Stock')} className={`cursor-pointer transition-colors border-2 hover:border-accent/50 ${selectedInventoryFilter === 'Total Stock' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Total Stock</p><p className="text-3xl font-bold mt-1">{products.reduce((s, p) => s + p.stock, 0)}</p></CardContent></Card>
            <Card onClick={() => setSelectedInventoryFilter('Low Stock')} className={`cursor-pointer transition-colors border-2 hover:border-destructive/50 ${selectedInventoryFilter === 'Low Stock' ? 'border-destructive ring-2 ring-destructive/20' : 'border-transparent'}`}><CardContent className="p-6 text-center flex flex-col items-center justify-center"><p className="text-sm text-muted-foreground">Low Stock (≤5)</p><p className="text-3xl font-bold mt-1 text-destructive">{products.filter(p => p.stock <= 5).length}</p></CardContent></Card>
          </div>

          {selectedInventoryFilter && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InventoryTable 
                displayProducts={selectedInventoryFilter === 'Low Stock' ? products.filter(p => p.stock <= 5) : products} 
                title={selectedInventoryFilter === 'Low Stock' ? 'Low Stock Inventory List' : 'Full Inventory List'}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
