import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Product } from '@/types';

interface ProductContextType {
  products: Product[];
  allProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const normalizeProduct = (p: any): Product => {
  const images = p.images?.length > 0 ? p.images : (p.image ? [p.image] : []);
  return {
    ...p,
    image: p.image || images[0] || '',
    images,
    price: Number(p.price),
    stock: Number(p.stock),
    installationFee: Number(p.installation_fee ?? p.installationFee ?? 0),
    deleted: Boolean(p.deleted),
    deletedAt: p.deleted_at || p.deletedAt,
  };
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then((data: any[]) => setRawProducts(data.map(normalizeProduct)))
      .catch(err => console.error('Failed to fetch products:', err));
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}): ${res.statusText}`);
      }

      if (!data) {
        throw new Error('Server returned an invalid or empty response.');
      }

      setRawProducts(prev => [normalizeProduct(data), ...prev]);
      return true;
    } catch (err: any) {
      console.error('Failed to add product:', err);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}): ${res.statusText}`);
      }

      if (!data) {
        throw new Error('Server returned an invalid or empty response.');
      }

      setRawProducts(prev => prev.map(p => (p.id === product.id ? normalizeProduct(data) : p)));
      return true;
    } catch (err: any) {
      console.error('Failed to update product:', err);
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Failed to delete product (${res.status})`);
      }

      // Mark as soft-deleted locally so active lists filter it out while reports preserve it
      setRawProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, deleted: true, deletedAt: new Date().toISOString().split('T')[0] }
            : p
        )
      );
      return true;
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      throw err;
    }
  }, []);

  const products = useMemo(() => rawProducts.filter(p => !p.deleted), [rawProducts]);
  const allProducts = rawProducts;

  return (
    <ProductContext.Provider value={{ products, allProducts, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be used within ProductProvider');
  return ctx;
};
