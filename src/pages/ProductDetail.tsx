import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, AlertTriangle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import { toast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { products } = useProducts();
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link to="/shop"><Button className="mt-4">Back to Shop</Button></Link>
      </div>
    );
  }

  const isSoldOut = product.stock === 0;

  const handleAddToCart = () => {
    if (isSoldOut) {
      toast({ title: 'Sold Out!', description: 'Out of stock! Please choose another!', variant: 'destructive' });
      return;
    }
    const size = selectedSize || product.sizes[0];
    const color = selectedColor || product.colors[0];
    addToCart(product, size, color);
  };

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/shop">
        <Button variant="ghost" size="sm" className="mb-6"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Shop</Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className={`relative aspect-square overflow-hidden rounded-lg ${isSoldOut ? 'opacity-50 grayscale-[50%]' : ''}`}>
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-2 text-destructive">
                <AlertTriangle className="h-12 w-12" />
                <span className="text-xl font-bold">SOLD OUT</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <Badge variant="secondary" className="w-fit">{product.category}</Badge>
          <h1 className={`mt-3 font-display text-3xl font-bold lg:text-4xl ${isSoldOut ? 'text-muted-foreground' : ''}`}>{product.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.description}</p>
          <p className={`mt-6 font-display text-3xl font-bold ${isSoldOut ? 'text-muted-foreground' : 'text-accent'}`}>₱{product.price.toLocaleString()}</p>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {isSoldOut ? (
              <span className="font-semibold text-destructive">This product is already Sold Out.</span>
            ) : (
              `${product.stock} in stock`
            )}
          </div>

          {/* Size Selection */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <Button
                    key={size}
                    variant={(selectedSize || product.sizes[0]) === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    disabled={isSoldOut}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Available Colors</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <Button
                    key={color}
                    variant={(selectedColor || product.colors[0]) === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                    disabled={isSoldOut}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={handleAddToCart} disabled={isSoldOut}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isSoldOut ? 'Sold Out' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">You May Also Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
