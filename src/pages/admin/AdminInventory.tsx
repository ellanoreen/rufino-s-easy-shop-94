import { useState } from 'react';
import { Search, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

const AdminInventory = () => {
  const { products: productsList, updateProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  const filtered = productsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockChange = (id: string, value: string) => {
    setEditingStock(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveStock = (id: string) => {
    const newStock = parseInt(editingStock[id]);
    if (isNaN(newStock) || newStock < 0) {
      toast({ title: 'Invalid stock', description: 'Stock must be 0 or more.', variant: 'destructive' });
      return;
    }
    const productToUpdate = productsList.find(p => p.id === id);
    if (productToUpdate) {
      updateProduct({ ...productToUpdate, stock: newStock });
    }
    setEditingStock(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    toast({ title: 'Stock updated', description: 'Inventory has been updated.' });
  };

  const totalItems = productsList.reduce((s, p) => s + p.stock, 0);
  const lowStock = productsList.filter(p => p.stock <= 5).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Inventory</h1>
        <p className="mt-1 text-muted-foreground">{totalItems} total items · {lowStock} low stock</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4 font-medium text-muted-foreground">Product</th>
                  <th className="p-4 font-medium text-muted-foreground">Category</th>
                  <th className="p-4 font-medium text-muted-foreground">Price</th>
                  <th className="p-4 font-medium text-muted-foreground">Current Stock</th>
                  <th className="p-4 font-medium text-muted-foreground">Update Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`border-b last:border-0 transition-colors hover:bg-muted/50 ${p.stock <= 5 ? 'bg-destructive/5' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="outline">{p.category}</Badge></td>
                    <td className="p-4 font-medium">₱{p.price.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={p.stock <= 5 ? 'destructive' : p.stock <= 10 ? 'secondary' : 'default'}>
                        {p.stock} in stock
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          className="w-24 h-8"
                          value={editingStock[p.id] ?? ''}
                          onChange={e => handleStockChange(p.id, e.target.value)}
                          placeholder={String(p.stock)}
                        />
                        {editingStock[p.id] !== undefined && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleSaveStock(p.id)}>
                            <Save className="h-3 w-3 mr-1" />Save
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventory;
