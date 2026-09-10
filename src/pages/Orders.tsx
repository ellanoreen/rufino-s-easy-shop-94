import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Star, Wrench, MessageSquare, CheckCircle2, ThumbsUp, CalendarCheck } from 'lucide-react';
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

const ratingLabel = (r: number) => ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r] ?? '';

const OrderFeedbackForm = ({ order, submitFeedback }: { order: Order; submitFeedback: (id: string, rating: number, feedback: string) => Promise<void> }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_CHARS = 500;

  // ── Already submitted: display the stored review ──────────────────────────
  if (order.rating) {
    return (
      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
        <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">Your Feedback</p>
            </div>
            {order.feedbackDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Submitted {new Date(order.feedbackDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-5 w-5 transition-colors ${
                  star <= order.rating!
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
                }`}
              />
            ))}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              {ratingLabel(order.rating)} ({order.rating}/5)
            </span>
          </div>
          {order.feedback && (
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              &ldquo;{order.feedback}&rdquo;
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    await submitFeedback(order.id, rating, feedback);
    setIsSubmitting(false);
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Rate Your Order</p>
        </div>

        {/* Star picker */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-7 w-7 transition-all duration-100 ${
                    activeRating >= star
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                      : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
            {activeRating > 0 && (
              <span className="ml-2 text-xs font-medium text-muted-foreground animate-in fade-in duration-150">
                {ratingLabel(activeRating)}
              </span>
            )}
          </div>
          {rating === 0 && (
            <p className="text-xs text-muted-foreground">Click a star to rate your experience</p>
          )}
        </div>

        {/* Feedback textarea */}
        <div className="space-y-1">
          <Textarea
            id={`feedback-${order.id}`}
            placeholder="Share details about your experience (optional)..."
            value={feedback}
            onChange={e => {
              if (e.target.value.length <= MAX_CHARS) setFeedback(e.target.value);
            }}
            className="resize-none h-24 text-sm"
          />
          <p className="text-xs text-muted-foreground text-right">
            {feedback.length}/{MAX_CHARS}
          </p>
        </div>

        {/* Submit button */}
        <Button
          id={`submit-feedback-${order.id}`}
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          size="sm"
          className="gap-1.5"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
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
          <Card
            key={order.id}
            className={`p-6 transition-shadow ${
              order.status !== 'Cancelled' && !order.rating
                ? 'ring-2 ring-primary/20 shadow-sm'
                : ''
            }`}
          >
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

            {/* Feedback section — available immediately after checkout for all non-Cancelled orders */}
            {order.status !== 'Cancelled' && (
              <OrderFeedbackForm order={order} submitFeedback={submitFeedback} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;
