import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product } from '@/types';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
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

      setProducts(prev => [...prev, data]);
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

      setProducts(prev => prev.map(p => p.id === product.id ? data : p));
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
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      return true;
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      throw err;
    }
  }, []);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be used within ProductProvider');
  return ctx;
};
