import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some beautiful furniture to get started</p>
        <Link to="/shop"><Button className="mt-6">Browse Shop</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
      <p className="mt-1 text-muted-foreground">{items.length} item{items.length !== 1 && 's'}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map(({ product, quantity, selectedSize, selectedColor }) => (
            <Card key={`${product.id}-${selectedSize}-${selectedColor}`} className="flex gap-4 p-4">
              <img src={product.image} alt={product.name} className="h-24 w-24 rounded-md object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">₱{product.price.toLocaleString()}</p>
                  {(selectedSize || selectedColor) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSize && `Size: ${selectedSize}`}{selectedSize && selectedColor && ' · '}{selectedColor && `Color: ${selectedColor}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-destructive" onClick={() => removeFromCart(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="self-center font-bold">₱{(product.price * quantity).toLocaleString()}</p>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-success">Free</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
          <Link to="/checkout">
            <Button className="mt-6 w-full" size="lg">Proceed to Checkout</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Cart;
