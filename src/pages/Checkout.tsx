import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

  // Installation Service state
  const [wantsInstallation, setWantsInstallation] = useState<'yes' | 'no' | ''>('');

  // Calculate total installation fee for products in cart
  const productInstallationFee = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.product.installationFee || 0) * i.quantity, 0);
  }, [items]);

  const effectiveInstallationFee = wantsInstallation === 'yes' ? productInstallationFee : 0;
  const grandTotal = total + effectiveInstallationFee;

  const ALLOWED_AREAS = [
    'Balabawan', 'Balong-balong', 'Colojo', 'Liasan', 'Liguac',
    'Limbayan', 'Lower Paniki-an', 'Matin-ao', 'Panubigan', 'Poblacion',
    'Punta Flecha', 'San Isidro', 'Sugbay Dos', 'Tongao', 'Upper Paniki-an',
  ];

  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 14);

  if (items.length === 0 && !submitted) {
    navigate('/cart');
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.address.trim()) e.address = 'Please select a delivery address.';
    const digitsOnly = form.contact.replace(/\D/g, '');
    if (!form.contact.trim()) {
      e.contact = 'Contact is required';
    } else if (digitsOnly.length !== 11) {
      e.contact = 'Number is invalid. Please enter a complete 11-digit mobile number.';
    }
    if (!form.payment) e.payment = 'Select a payment method';
    if (wantsInstallation === '') e.installation = 'Please specify if you would like installation service';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const paymentLabels: Record<string, string> = { cod: 'Cash on Delivery' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    placeOrder(
      items,
      grandTotal,
      form.name.trim(),
      form.address.trim(),
      form.contact.trim(),
      paymentLabels[form.payment] || form.payment,
      wantsInstallation === 'yes',
      effectiveInstallationFee
    );
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
          {/* Delivery Information */}
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Delivery Information</h2>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="address">Delivery Address</Label>
              <Select value={form.address} onValueChange={v => setForm(f => ({ ...f, address: v }))}>
                <SelectTrigger><SelectValue placeholder="Select delivery address" /></SelectTrigger>
                <SelectContent>
                  {ALLOWED_AREAS.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
            </div>
            <div>
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={form.contact}
                maxLength={11}
                inputMode="numeric"
                placeholder="e.g. 09XXXXXXXXX"
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setForm(f => ({ ...f, contact: digits }));
                }}
              />
              {errors.contact && <p className="mt-1 text-sm text-destructive">{errors.contact}</p>}
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment} onValueChange={v => setForm(f => ({ ...f, payment: v }))}>
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment && <p className="mt-1 text-sm text-destructive">{errors.payment}</p>}
            </div>
          </Card>

          {/* Installation Service Option */}
          <Card className="p-6 space-y-4 border-2 border-accent/20 bg-accent/5">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" />
              <h2 className="font-display text-xl font-semibold">Installation Service</h2>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Would you like us to install your furniture?
            </p>

            {/* Yes / No radio buttons */}
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                <input
                  type="radio"
                  name="wantsInstallation"
                  value="no"
                  checked={wantsInstallation === 'no'}
                  onChange={() => setWantsInstallation('no')}
                  className="accent-accent"
                />
                <span className="font-medium">No</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                <input
                  type="radio"
                  name="wantsInstallation"
                  value="yes"
                  checked={wantsInstallation === 'yes'}
                  onChange={() => setWantsInstallation('yes')}
                  className="accent-accent"
                />
                <span className="font-medium">Yes</span>
              </label>
            </div>
            {errors.installation && <p className="mt-1 text-sm text-destructive">{errors.installation}</p>}

            {/* Display installation fee automatically when "Yes" is selected */}
            {wantsInstallation === 'yes' && (
              <div className="rounded-lg border bg-background p-4 space-y-2 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-accent" />
                    Furniture Installation Fee:
                  </span>
                  <span className="text-base text-accent font-bold">
                    ₱{productInstallationFee.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Our expert team will assemble and set up your items upon delivery.
                </p>
              </div>
            )}
          </Card>



          <Button type="submit" size="lg" className="w-full">Place Order</Button>
        </form>

        {/* Order Summary */}
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
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            {wantsInstallation === 'yes' && (
              <div className="flex justify-between text-accent font-medium">
                <span className="flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  Installation Service
                </span>
                <span>₱{productInstallationFee.toLocaleString()}</span>
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₱{grandTotal.toLocaleString()}</span>
          </div>


        </Card>
      </div>
    </div>
  );
};

export default Checkout;
