import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const isSoldOut = product.stock === 0;

  const handleSoldOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({ title: 'Sold Out!', description: 'Out of stock! Please choose another!', variant: 'destructive' });
  };

  const handleAdd = (e: React.MouseEvent) => {
    if (isSoldOut) {
      handleSoldOutClick(e);
      return;
    }
    addToCart(product, product.sizes[0], product.colors[0]);
  };

  return (
    <Card className={`group overflow-hidden border-0 shadow-sm transition-all hover:shadow-md ${isSoldOut ? 'opacity-50 grayscale-[50%]' : ''}`}>
      <Link to={`/product/${product.id}`} onClick={isSoldOut ? handleSoldOutClick : undefined}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Badge variant="destructive" className="text-sm px-3 py-1">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />Sold Out
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <Link to={`/product/${product.id}`} onClick={isSoldOut ? handleSoldOutClick : undefined}>
          <h3 className={`mt-1 font-display text-lg font-semibold transition-colors ${isSoldOut ? 'text-muted-foreground' : 'text-foreground hover:text-accent'}`}>{product.name}</h3>
        </Link>
        {product.colors.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">{product.colors.length} colors · {product.sizes.length} sizes</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-lg font-bold ${isSoldOut ? 'text-muted-foreground' : 'text-foreground'}`}>₱{product.price.toLocaleString()}</span>
          <Button size="sm" onClick={handleAdd} disabled={isSoldOut} variant={isSoldOut ? 'secondary' : 'default'} className={isSoldOut ? 'cursor-not-allowed' : ''}>
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            {isSoldOut ? 'Sold Out' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
