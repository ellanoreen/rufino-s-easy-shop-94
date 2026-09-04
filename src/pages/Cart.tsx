import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart, getCartItemKey } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

const Cart = () => {
  const {
    items,
    selectedKeys,
    selectedItems,
    selectedTotal,
    isAllSelected,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    toggleSelectAll,
  } = useCart();
  const { installationFee } = useSettings();

  const effectiveInstallationFee = selectedItems.length > 0 ? installationFee : 0;
  const grandTotal = selectedItems.length > 0 ? selectedTotal + effectiveInstallationFee : 0;

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some beautiful furniture to get started</p>
        <Link to="/shop">
          <Button className="mt-6">Browse Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
      <p className="mt-1 text-muted-foreground">
        {items.length} item{items.length !== 1 && 's'} in your cart
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Select All Bar */}
          <Card className="flex items-center justify-between p-4 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
                className="h-5 w-5"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Select All ({items.length} product{items.length !== 1 && 's'})
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              {selectedItems.length} of {items.length} selected
            </span>
          </Card>

          {/* Cart Item Cards */}
          {items.map(({ product, quantity, selectedSize, selectedColor }) => {
            const key = getCartItemKey({ product, selectedSize, selectedColor });
            const isChecked = selectedKeys.includes(key);

            return (
              <Card
                key={key}
                className={`flex items-center gap-3 sm:gap-4 p-4 transition-all ${
                  isChecked ? 'border-primary/40 bg-card' : 'opacity-80 bg-card/40'
                }`}
              >
                {/* Product Checkbox */}
                <div className="flex items-center justify-center pl-1">
                  <Checkbox
                    id={`select-${key}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleSelectItem(key)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Product Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover flex-shrink-0"
                />

                {/* Product Details & Stepper */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">₱{product.price.toLocaleString()}</p>
                    {(selectedSize || selectedColor) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedSize && `Size: ${selectedSize}`}
                        {selectedSize && selectedColor && ' · '}
                        {selectedColor && `Color: ${selectedColor}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(product.id, quantity - 1, selectedSize, selectedColor)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(product.id, quantity + 1, selectedSize, selectedColor)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(product.id, selectedSize, selectedColor)}
                      title="Remove product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subtotal */}
                <p className="self-center font-bold text-sm sm:text-base text-right min-w-[70px]">
                  ₱{(product.price * quantity).toLocaleString()}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <Card className="h-fit p-6">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({selectedItems.length} item{selectedItems.length !== 1 && 's'})
              </span>
              <span>₱{selectedTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-success">Free</span>
            </div>
            {effectiveInstallationFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installation Fee</span>
                <span>₱{effectiveInstallationFee.toLocaleString()}</span>
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₱{grandTotal.toLocaleString()}</span>
          </div>

          {selectedItems.length === 0 ? (
            <div className="mt-6 space-y-2">
              <Button className="w-full" size="lg" disabled>
                Proceed to Checkout
              </Button>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 justify-center">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Please select at least one item to checkout</span>
              </div>
            </div>
          ) : (
            <Link to="/checkout">
              <Button className="mt-6 w-full" size="lg">
                Proceed to Checkout ({selectedItems.length})
              </Button>
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Cart;

