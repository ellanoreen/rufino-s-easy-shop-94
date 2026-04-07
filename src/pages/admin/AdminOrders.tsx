import { useState } from 'react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOrders } from '@/context/OrderContext';
import { Order } from '@/types';
import { toast } from '@/hooks/use-toast';

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

const AdminOrders = () => {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  const handleDeleteOrder = (orderId: string) => {
    deleteOrder(orderId);
    toast({ title: 'Order deleted', description: `Order ${orderId} has been successfully removed.` });
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusUpdate = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status);
    toast({ title: 'Order updated', description: `Order ${orderId} status changed to ${status}.` });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          {orders.length} orders total · {orders.filter(o => o.status === 'Pending').length} pending · {orders.filter(o => o.status === 'Cancelled').length} cancelled
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by customer or order ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4 font-medium text-muted-foreground">Order</th>
                  <th className="p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="p-4 font-medium text-muted-foreground">Items</th>
                  <th className="p-4 font-medium text-muted-foreground">Total</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground">Order Date</th>
                  <th className="p-4 font-medium text-muted-foreground">Est. Delivery</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className={`border-b last:border-0 transition-colors hover:bg-muted/50 ${o.status === 'Pending' ? 'bg-accent/5' : ''} ${o.status === 'Cancelled' ? 'bg-destructive/5' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.id}</span>
                        {o.status === 'Pending' && (
                          <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5">New</Badge>
                        )}
                        {o.status === 'Cancelled' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">Cancelled</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.contact}</p>
                      </div>
                    </td>
                    <td className="p-4">{o.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                    <td className="p-4 font-semibold">₱{o.total.toLocaleString()}</td>
                    <td className="p-4">
                      <Select value={o.status} onValueChange={v => handleStatusUpdate(o.id, v as Order['status'])}>
                        <SelectTrigger className="w-[140px] h-8">
                          <Badge className={statusColor(o.status)}>{o.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-muted-foreground">{o.date}</td>
                    <td className="p-4 text-muted-foreground">{o.expectedDeliveryDate}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingOrder(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order {o.id}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the order from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewingOrder} onOpenChange={open => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-lg">
          {viewingOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Order {viewingOrder.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{viewingOrder.customerName}</p></div>
                  <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{viewingOrder.contact}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium">{viewingOrder.address}</p></div>
                  <div><p className="text-muted-foreground">Payment</p><p className="font-medium">{viewingOrder.paymentMethod}</p></div>
                  <div><p className="text-muted-foreground">Order Date</p><p className="font-medium">{viewingOrder.date}</p></div>
                  <div><p className="text-muted-foreground">Expected Delivery</p><p className="font-medium">{viewingOrder.expectedDeliveryDate}</p></div>
                  <div><p className="text-muted-foreground">Status</p><Badge className={statusColor(viewingOrder.status)}>{viewingOrder.status}</Badge></div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ordered Items</p>
                  <div className="space-y-2">
                    {viewingOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <img src={item.product.image} alt={item.product.name} className="h-10 w-10 rounded object-cover" />
                          <div>
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                              {item.selectedSize && ` · Size: ${item.selectedSize}`}
                              {item.selectedColor && ` · Color: ${item.selectedColor}`}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm">₱{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">₱{viewingOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
