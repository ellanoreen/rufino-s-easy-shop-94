import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/context/ProductContext';
import { Category } from '@/types';

const categories: Category[] = ['All', 'Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'];

const Shop = () => {
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Shop All Furniture</h1>
      <p className="mt-1 text-muted-foreground">Discover pieces for every room</p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search furniture..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 text-base sm:text-sm" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 max-w-full scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {categories.map(c => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)} className="shrink-0 h-9 px-3.5 text-xs sm:text-sm font-medium">
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">No products found. Try a different search or category.</p>
      )}
    </div>
  );
};

export default Shop;
