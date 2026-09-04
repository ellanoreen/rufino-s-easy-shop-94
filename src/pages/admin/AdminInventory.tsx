import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, X, Save, Package, Warehouse, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

const categories = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'];

interface FormErrors {
  name?: string;
  price?: string;
  category?: string;
  stock?: string;
  description?: string;
}

const AdminInventory = () => {
  const { products: productsList, addProduct, updateProduct, deleteProduct } = useProducts();
  const { allOrders } = useOrders();

  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', price: '', image: '', images: [] as string[], category: '', stock: '', installationFee: '',
    sizes: '' as string, colors: '' as string,
  });
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [sizeTags, setSizeTags] = useState<string[]>([]);
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  // ─── Compute total sold per product from Delivered orders (including historical) ───
  const soldByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    allOrders.forEach(order => {
      if (order.status === 'Delivered' || (order.status as any) === 'Completed') {
        order.items.forEach(item => {
          const pid = item.product.id;
          map[pid] = (map[pid] || 0) + item.quantity;
        });
      }
    });
    return map;
  }, [allOrders]);

  const totalSoldAll = useMemo(() => Object.values(soldByProduct).reduce((s, v) => s + v, 0), [soldByProduct]);

  // ─── Summary stats ───────────────────────────────────────────────────────────
  const totalStock = productsList.reduce((s, p) => s + p.stock, 0);
  const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= 5).length;

  // ─── Filtered list ───────────────────────────────────────────────────────────
  const filtered = productsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.stock || parseInt(form.stock) < 0 || isNaN(parseInt(form.stock))) newErrors.stock = 'Stock must be 0 or more';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Dialog helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', image: '', images: [], category: '', stock: '', installationFee: '0', sizes: '', colors: '' });
    setSizeTags([]);
    setColorTags([]);
    setSizeInput('');
    setColorInput('');
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price.toString(), image: p.image, images: p.images?.length > 0 ? p.images : (p.image ? [p.image] : []), category: p.category, stock: p.stock.toString(), installationFee: (p.installationFee ?? 0).toString(), sizes: '', colors: '' });
    setSizeTags([...p.sizes]);
    setColorTags([...p.colors]);
    setSizeInput('');
    setColorInput('');
    setErrors({});
    setDialogOpen(true);
  };

  const addSizeTag = () => {
    const v = sizeInput.trim();
    if (v && !sizeTags.includes(v)) { setSizeTags(prev => [...prev, v]); setSizeInput(''); }
  };

  const addColorTag = () => {
    const v = colorInput.trim();
    if (v && !colorTags.includes(v)) { setColorTags(prev => [...prev, v]); setColorInput(''); }
  };

  // ─── Save product ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const productData: Omit<Product, 'id'> | Product = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      image: form.images.length > 0 ? form.images[0] : (form.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'),
      images: form.images.length > 0 ? form.images : (form.image ? [form.image] : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600']),
      category: form.category,
      stock: parseInt(form.stock) || 0,
      installationFee: parseFloat(form.installationFee) || 0,
      sizes: sizeTags.length > 0 ? sizeTags : ['Standard'],
      colors: colorTags.length > 0 ? colorTags : ['Default'],
    };
    try {
      if (editing) {
        await updateProduct(productData as Product);
        toast({ title: 'Product updated', description: `"${productData.name}" has been updated successfully.` });
      } else {
        await addProduct(productData);
        toast({ title: 'Product added', description: `"${productData.name}" has been added to the catalog.` });
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Error Saving Product', description: err.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete product ──────────────────────────────────────────────────────────
  const handleDelete = async (p: Product) => {
    try {
      await deleteProduct(p.id);
      toast({ title: 'Product deleted', description: `"${p.name}" has been removed.` });
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to delete product.', variant: 'destructive' });
    }
  };

  // ─── Quick-stock update ──────────────────────────────────────────────────────
  const handleStockChange = (id: string, value: string) => {
    setEditingStock(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveStock = (id: string) => {
    const newStock = parseInt(editingStock[id]);
    if (isNaN(newStock) || newStock < 0) {
      toast({ title: 'Invalid stock', description: 'Stock must be 0 or more.', variant: 'destructive' });
      return;
    }
    const product = productsList.find(p => p.id === id);
    if (product) updateProduct({ ...product, stock: newStock });
    setEditingStock(prev => { const c = { ...prev }; delete c[id]; return c; });
    toast({ title: 'Stock updated', description: 'Inventory has been updated.' });
  };

  // ─── Image compression helper ────────────────────────────────────────────────
  const compressImage = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1200;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
          else { if (h > MAX) { w *= MAX / h; h = MAX; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Inventory</h1>
          <p className="mt-1 text-muted-foreground">
            {productsList.length} products · {totalStock} units in stock
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editing ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Walnut Dining Table" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              {/* Description */}
              <div>
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the product..." rows={3} />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>
              {/* Price + Stock + Installation Fee */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Price (₱) *</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                  {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
                </div>
                <div>
                  <Label>Stock *</Label>
                  <Input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                  {errors.stock && <p className="text-xs text-destructive mt-1">{errors.stock}</p>}
                </div>
                <div>
                  <Label>Installation Fee (₱)</Label>
                  <Input type="number" min="0" step="0.01" value={form.installationFee} onChange={e => setForm(f => ({ ...f, installationFee: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              {/* Category */}
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
              </div>
              {/* Sizes */}
              <div>
                <Label>Sizes</Label>
                <div className="flex gap-2">
                  <Input value={sizeInput} onChange={e => setSizeInput(e.target.value)} placeholder="e.g. Queen, King" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSizeTag())} />
                  <Button type="button" variant="outline" size="sm" onClick={addSizeTag}>Add</Button>
                </div>
                {sizeTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sizeTags.map(s => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s}
                        <button onClick={() => setSizeTags(prev => prev.filter(t => t !== s))}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {/* Colors */}
              <div>
                <Label>Colors</Label>
                <div className="flex gap-2">
                  <Input value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="e.g. Black, White" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColorTag())} />
                  <Button type="button" variant="outline" size="sm" onClick={addColorTag}>Add</Button>
                </div>
                {colorTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {colorTags.map(c => (
                      <Badge key={c} variant="secondary" className="gap-1">
                        {c}
                        <button onClick={() => setColorTags(prev => prev.filter(t => t !== c))}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {/* Images */}
              <div>
                <Label>Product Images (First image will be the main image)</Label>
                <div className="mt-1 flex flex-col gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Upload Images</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer"
                      onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          try {
                            const newImages = await Promise.all(files.map(f => compressImage(f)));
                            setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
                          } catch (err) {
                            console.error('Compression error:', err);
                            toast({ title: 'Error processing images', variant: 'destructive' });
                          }
                        }
                      }}
                    />
                  </div>
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 group">
                          <img src={img} alt={`Preview ${idx}`} className={`h-24 w-24 rounded-md object-cover border ${idx === 0 ? 'ring-2 ring-primary' : ''}`} />
                          {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center rounded-b-md py-0.5">Main</span>}
                          
                          <div className="absolute top-0 right-0 left-0 bottom-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                onClick={() => {
                                  const newImages = [...form.images];
                                  [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]];
                                  setForm(f => ({ ...f, images: newImages }));
                                }}
                                className="bg-white/90 hover:bg-white text-black p-1 rounded-sm cursor-pointer"
                                type="button"
                                title="Move Left"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
                              }}
                              className="bg-destructive hover:bg-destructive/90 text-white p-1 rounded-sm cursor-pointer"
                              type="button"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {idx < form.images.length - 1 && (
                              <button
                                onClick={() => {
                                  const newImages = [...form.images];
                                  [newImages[idx + 1], newImages[idx]] = [newImages[idx], newImages[idx + 1]];
                                  setForm(f => ({ ...f, images: newImages }));
                                }}
                                className="bg-white/90 hover:bg-white text-black p-1 rounded-sm cursor-pointer"
                                type="button"
                                title="Move Right"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={loading}>
                {loading ? 'Processing...' : editing ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{productsList.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sold</p>
              <p className="text-2xl font-bold">{totalSoldAll.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4 font-medium text-muted-foreground">Product</th>
                  <th className="p-4 font-medium text-muted-foreground">Category</th>
                  <th className="p-4 font-medium text-muted-foreground">Price</th>
                  <th className="p-4 font-medium text-muted-foreground">Installation Fee</th>
                  <th className="p-4 font-medium text-muted-foreground">Current Stock</th>
                  <th className="p-4 font-medium text-muted-foreground">Total Sold</th>
                  <th className="p-4 font-medium text-muted-foreground">Update Stock</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sold = soldByProduct[p.id] || 0;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b last:border-0 transition-colors hover:bg-muted/50 ${p.stock === 0 ? 'bg-destructive/5' : p.stock <= 5 ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                    >
                      {/* Product */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                          <div>
                            <span className="font-medium">{p.name}</span>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{p.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.sizes.map(s => <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">{s}</Badge>)}
                              {p.colors.map(c => <Badge key={c} variant="outline" className="text-[9px] px-1 py-0">{c}</Badge>)}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="p-4"><Badge variant="outline">{p.category}</Badge></td>
                      {/* Price */}
                      <td className="p-4 font-medium">₱{p.price.toLocaleString()}</td>
                      {/* Installation Fee */}
                      <td className="p-4 font-medium text-muted-foreground">
                        {p.installationFee && p.installationFee > 0 ? `₱${p.installationFee.toLocaleString()}` : 'Free / ₱0'}
                      </td>
                      {/* Current Stock */}
                      <td className="p-4">
                        <Badge variant={p.stock === 0 ? 'destructive' : p.stock <= 5 ? 'destructive' : p.stock <= 10 ? 'secondary' : 'default'}>
                          {p.stock === 0 ? 'Sold Out' : `${p.stock} in stock`}
                        </Badge>
                      </td>
                      {/* Total Sold */}
                      <td className="p-4">
                        <span className={`font-semibold ${sold > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {sold > 0 ? sold.toLocaleString() : '—'}
                        </span>
                      </td>
                      {/* Update Stock */}
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
                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently remove the product from your catalog.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(p)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
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
