import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
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

const AdminProducts = () => {
  const { products: productsList, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', image: '', category: '', stock: '', sizes: '' as string, colors: '' as string });
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [sizeTags, setSizeTags] = useState<string[]>([]);
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const filtered = productsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

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

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', image: '', category: '', stock: '', sizes: '', colors: '' });
    setSizeTags([]);
    setColorTags([]);
    setSizeInput('');
    setColorInput('');
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price.toString(), image: p.image, category: p.category, stock: p.stock.toString(), sizes: '', colors: '' });
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

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    
    const productData: Omit<Product, 'id'> | Product = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      image: form.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
      category: form.category,
      stock: parseInt(form.stock) || 0,
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
      toast({ 
        title: 'Error Saving Product', 
        description: err.message || 'An unexpected error occurred while saving.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await deleteProduct(p.id);
      toast({ title: 'Product deleted', description: `"${p.name}" has been removed.` });
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({ title: 'Error Deleting Product', description: err.message || 'Failed to delete product.', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="mt-1 text-muted-foreground">{productsList.length} products in catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Walnut Dining Table" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the product..." rows={3} />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
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

              <div>
                <Label>Product Image</Label>
                <div className="mt-1 flex flex-col gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Upload Image</Label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressImage = (file: File): Promise<string> => {
                            return new Promise((resolve) => {
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = (event) => {
                                const img = new Image();
                                img.src = event.target?.result as string;
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 1200;
                                  const MAX_HEIGHT = 1200;
                                  let width = img.width;
                                  let height = img.height;

                                  if (width > height) {
                                    if (width > MAX_WIDTH) {
                                      height *= MAX_WIDTH / width;
                                      width = MAX_WIDTH;
                                    }
                                  } else {
                                    if (height > MAX_HEIGHT) {
                                      width *= MAX_HEIGHT / height;
                                      height = MAX_HEIGHT;
                                    }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  resolve(canvas.toDataURL('image/jpeg', 0.7));
                                };
                              };
                            });
                          };
                          
                          try {
                            const compressed = await compressImage(file);
                            setForm(f => ({ ...f, image: compressed }));
                          } catch (err) {
                            console.error('Compression error:', err);
                            toast({ title: 'Error processing image', variant: 'destructive' });
                          }
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {form.image && (
                    <div className="relative w-fit">
                      <img src={form.image} alt="Preview" className="h-24 w-24 rounded-md object-cover border" />
                      <button 
                        onClick={() => setForm(f => ({ ...f, image: '' }))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={loading}>
                {loading ? 'Processing...' : (editing ? 'Update Product' : 'Add Product')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  <th className="p-4 font-medium text-muted-foreground">Stock</th>
                  <th className="p-4 font-medium text-muted-foreground">Sizes</th>
                  <th className="p-4 font-medium text-muted-foreground">Colors</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="outline">{p.category}</Badge></td>
                    <td className="p-4 font-medium">₱{p.price.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={p.stock === 0 ? 'destructive' : p.stock <= 5 ? 'destructive' : 'secondary'}>
                        {p.stock === 0 ? 'Sold Out' : `${p.stock} in stock`}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {p.sizes.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {p.colors.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                      </div>
                    </td>
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
                              <AlertDialogAction onClick={() => handleDelete(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
