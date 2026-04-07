import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { toast } from '@/hooks/use-toast';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', contact: '', payment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 14);

  if (items.length === 0 && !submitted) {
    navigate('/cart');
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.contact.trim()) e.contact = 'Contact is required';
    if (!form.payment) e.payment = 'Select a payment method';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const paymentLabels: Record<string, string> = {
    cod: 'Cash on Delivery',
    gcash: 'GCash',
    bank: 'Bank Transfer',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    placeOrder(items, total, form.name.trim(), form.address.trim(), form.contact.trim(), paymentLabels[form.payment] || form.payment);
    clearCart();
    setSubmitted(true);
    toast({ title: 'Order placed!', description: 'Thank you for your purchase.' });
  };

  if (submitted) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <CheckCircle className="h-20 w-20 text-success" />
        <h1 className="mt-6 font-display text-3xl font-bold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Your order has been placed successfully.</p>
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <Truck className="h-5 w-5" />
          <span>Expected delivery by <span className="font-medium text-foreground">{expectedDelivery.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
        </div>
        <Button className="mt-6" onClick={() => navigate('/orders')}>View Orders</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Delivery Information</h2>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="address">Delivery Address</Label>
              <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
            </div>
            <div>
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              {errors.contact && <p className="mt-1 text-sm text-destructive">{errors.contact}</p>}
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment} onValueChange={v => setForm(f => ({ ...f, payment: v }))}>
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment && <p className="mt-1 text-sm text-destructive">{errors.payment}</p>}
            </div>
          </Card>
          <Button type="submit" size="lg" className="w-full">Place Order</Button>
        </form>

        <Card className="h-fit p-6">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <Separator className="my-4" />
          <div className="space-y-3">
            {items.map(({ product, quantity, selectedSize, selectedColor }) => (
              <div key={`${product.id}-${selectedSize}-${selectedColor}`} className="text-sm">
                <div className="flex justify-between">
                  <span>{product.name} × {quantity}</span>
                  <span>₱{(product.price * quantity).toLocaleString()}</span>
                </div>
                {(selectedSize || selectedColor) && (
                  <p className="text-xs text-muted-foreground">
                    {selectedSize && `Size: ${selectedSize}`}{selectedSize && selectedColor && ' · '}{selectedColor && `Color: ${selectedColor}`}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
