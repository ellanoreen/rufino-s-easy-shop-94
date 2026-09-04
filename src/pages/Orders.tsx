import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Star, Wrench, MessageSquare } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Order } from '@/types';

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

const OrderFeedbackForm = ({ order, submitFeedback }: { order: Order; submitFeedback: (id: string, rating: number, feedback: string) => Promise<void> }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (order.rating) {
    return (
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-medium mb-2 text-foreground">Your Feedback</p>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} className={`h-4 w-4 ${star <= order.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
          ))}
        </div>
        {order.feedback && <p className="text-sm text-muted-foreground italic">"{order.feedback}"</p>}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    await submitFeedback(order.id, rating, feedback);
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm font-medium mb-3">Rate your order</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-colors"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star className={`h-6 w-6 ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400 hover:text-yellow-400 transition-colors' : 'text-slate-200'}`} />
          </button>
        ))}
      </div>
      <Textarea 
        placeholder="Tell us what you think..." 
        value={feedback} 
        onChange={e => setFeedback(e.target.value)}
        className="mb-3 resize-none h-20"
      />
      <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting} size="sm">
        Submit Feedback
      </Button>
    </div>
  );
};

const Orders = () => {
  const { orders, submitFeedback } = useOrders();

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
            <div className="mt-4 flex flex-wrap items-center justify-between border-t pt-3 gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Payment: {order.paymentMethod}</span>

                {order.installationSelected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent border border-accent/20">
                    <Wrench className="h-3 w-3" />
                    Installation: Yes (₱{(order.installationFee || 0).toLocaleString()})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                    Installation: No
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/messages?orderId=${order.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Chat about Order
                  </Button>
                </Link>
                <span className="font-bold">Total: ₱{order.total.toLocaleString()}</span>
              </div>
            </div>

            {order.status === 'Delivered' && (
              <OrderFeedbackForm order={order} submitFeedback={submitFeedback} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;
