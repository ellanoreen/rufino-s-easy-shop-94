import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CartItem, Product } from '@/types';
import { toast } from '@/hooks/use-toast';

export const getCartItemKey = (item: { product: { id: string }; selectedSize?: string; selectedColor?: string }) => {
  return `${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`;
};

interface CartContextType {
  items: CartItem[];
  selectedKeys: string[];
  selectedItems: CartItem[];
  selectedTotal: number;
  selectedItemCount: number;
  isAllSelected: boolean;
  addToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  toggleSelectItem: (key: string) => void;
  toggleSelectAll: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearCart: () => void;
  removeItems: (itemsToRemove: CartItem[]) => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const addToCart = useCallback((product: Product, selectedSize?: string, selectedColor?: string) => {
    if (product.stock === 0) {
      toast({ title: 'Sold Out', description: 'This product is already Sold Out.', variant: 'destructive' });
      return;
    }
    const key = `${product.id}-${selectedSize || ''}-${selectedColor || ''}`;
    setItems(prev => {
      const existing = prev.find(i => getCartItemKey(i) === key);
      if (existing) {
        return prev.map(i => getCartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, selectedSize, selectedColor }];
    });
    setSelectedKeys(prev => (prev.includes(key) ? prev : [...prev, key]));
    toast({ title: 'Added to cart', description: `${product.name} has been added.` });
  }, []);

  const removeFromCart = useCallback((productId: string, selectedSize?: string, selectedColor?: string) => {
    setItems(prev => {
      return prev.filter(i => {
        if (selectedSize !== undefined || selectedColor !== undefined) {
          return !(
            i.product.id === productId &&
            (selectedSize === undefined || i.selectedSize === selectedSize) &&
            (selectedColor === undefined || i.selectedColor === selectedColor)
          );
        }
        return i.product.id !== productId;
      });
    });
    setSelectedKeys(prev => {
      if (selectedSize !== undefined || selectedColor !== undefined) {
        const targetKey = `${productId}-${selectedSize || ''}-${selectedColor || ''}`;
        return prev.filter(k => k !== targetKey);
      }
      return prev.filter(k => !k.startsWith(`${productId}-`));
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i => {
        const isMatch =
          selectedSize !== undefined || selectedColor !== undefined
            ? i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
            : i.product.id === productId;
        return isMatch ? { ...i, quantity } : i;
      })
    );
  }, []);

  const toggleSelectItem = useCallback((key: string) => {
    setSelectedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  }, []);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every(i => selectedKeys.includes(getCartItemKey(i)));
  }, [items, selectedKeys]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map(getCartItemKey));
    }
  }, [isAllSelected, items]);

  const selectAll = useCallback(() => {
    setSelectedKeys(items.map(getCartItemKey));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedKeys([]);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectedKeys([]);
  }, []);

  const removeItems = useCallback((itemsToRemove: CartItem[]) => {
    const keysToRemove = new Set(itemsToRemove.map(getCartItemKey));
    setItems(prev => prev.filter(i => !keysToRemove.has(getCartItemKey(i))));
    setSelectedKeys(prev => prev.filter(k => !keysToRemove.has(k)));
  }, []);

  const selectedItems = useMemo(() => {
    return items.filter(i => selectedKeys.includes(getCartItemKey(i)));
  }, [items, selectedKeys]);

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [selectedItems]);

  const selectedItemCount = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  }, [selectedItems]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        selectedKeys,
        selectedItems,
        selectedTotal,
        selectedItemCount,
        isAllSelected,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelectItem,
        toggleSelectAll,
        selectAll,
        deselectAll,
        clearCart,
        removeItems,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
