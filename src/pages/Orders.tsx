import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';

const statusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Delivered': return 'bg-success text-success-foreground';
    case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Processing': return 'bg-accent text-accent-foreground';
    case 'Cancelled': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const Orders = () => {
  const { orders } = useOrders();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold">My Orders</h1>
      <p className="mt-1 text-muted-foreground">Track your order status</p>

      <div className="mt-8 space-y-4">
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No orders yet. Start shopping!</p>
        )}
        {orders.map(order => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm text-muted-foreground">Ordered: {order.date}</p>
              </div>
              <Badge className={statusColor(order.status)}>{order.status}</Badge>
            </div>

            {/* Expected Delivery */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Expected delivery: <span className="font-medium text-foreground">{new Date(order.expectedDeliveryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
            </div>

            <div className="mt-4 space-y-2">
              {order.items.map(({ product, quantity, selectedSize, selectedColor }, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {quantity}
                      {selectedSize && ` · Size: ${selectedSize}`}
                      {selectedColor && ` · Color: ${selectedColor}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium">₱{(product.price * quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Payment: {order.paymentMethod}</span>
              <span className="font-bold">Total: ₱{order.total.toLocaleString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;
