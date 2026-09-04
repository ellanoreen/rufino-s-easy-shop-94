import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart, getCartItemKey } from '../context/CartContext';
import { Product } from '../types';

const mockProduct1: Product = {
  id: 'prod-1',
  name: 'Window',
  description: 'A wooden window',
  price: 2000,
  image: '/window.jpg',
  images: ['/window.jpg'],
  category: 'Living Room',
  stock: 10,
  sizes: ['3x7'],
  colors: ['brown'],
};

const mockProduct2: Product = {
  id: 'prod-2',
  name: 'Bed',
  description: 'A wooden bed',
  price: 3000,
  image: '/bed.jpg',
  images: ['/bed.jpg'],
  category: 'Bedroom',
  stock: 5,
  sizes: ['3x3'],
  colors: ['grey'],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('Cart Selection & Calculation Flow', () => {
  it('adds items to cart with items selected by default', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.total).toBe(5000);
    expect(result.current.selectedTotal).toBe(5000);
  });

  it('unselecting an item updates selectedTotal and isAllSelected', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    const key2 = getCartItemKey({ product: mockProduct2, selectedSize: '3x3', selectedColor: 'grey' });

    // Unselect product 2
    act(() => {
      result.current.toggleSelectItem(key2);
    });

    expect(result.current.selectedItems).toHaveLength(1);
    expect(result.current.selectedItems[0].product.id).toBe('prod-1');
    expect(result.current.selectedTotal).toBe(2000);
    expect(result.current.total).toBe(5000); // Full cart total remains 5000
    expect(result.current.isAllSelected).toBe(false);
  });

  it('toggleSelectAll selects and deselects all items correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    // When all are selected, toggleSelectAll deselects all
    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.selectedItems).toHaveLength(0);
    expect(result.current.selectedTotal).toBe(0);
    expect(result.current.isAllSelected).toBe(false);

    // When none are selected, toggleSelectAll selects all
    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.selectedTotal).toBe(5000);
    expect(result.current.isAllSelected).toBe(true);
  });

  it('quantity change on selected item recalculates Order Summary dynamically', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    // Increase quantity of prod-1 from 1 to 3
    act(() => {
      result.current.updateQuantity(mockProduct1.id, 3, '3x7', 'brown');
    });

    // Subtotal should be (2000 * 3) + (3000 * 1) = 9000
    expect(result.current.selectedTotal).toBe(9000);
    expect(result.current.total).toBe(9000);
  });

  it('quantity change on unselected item does not affect selectedTotal', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    const key2 = getCartItemKey({ product: mockProduct2, selectedSize: '3x3', selectedColor: 'grey' });

    // Unselect product 2
    act(() => {
      result.current.toggleSelectItem(key2);
    });

    // Increase quantity of unselected product 2
    act(() => {
      result.current.updateQuantity(mockProduct2.id, 4, '3x3', 'grey');
    });

    // selectedTotal should still be only product 1 (2000 * 1) = 2000
    expect(result.current.selectedTotal).toBe(2000);
    // full total is (2000 * 1) + (3000 * 4) = 14000
    expect(result.current.total).toBe(14000);
  });

  it('removeItems only removes checked out items and keeps unselected items in cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct1, '3x7', 'brown');
      result.current.addToCart(mockProduct2, '3x3', 'grey');
    });

    const key2 = getCartItemKey({ product: mockProduct2, selectedSize: '3x3', selectedColor: 'grey' });

    // Customer only checks out product 1 (unselects product 2)
    act(() => {
      result.current.toggleSelectItem(key2);
    });

    const itemsToCheckout = result.current.selectedItems;
    expect(itemsToCheckout).toHaveLength(1);
    expect(itemsToCheckout[0].product.id).toBe('prod-1');

    // Perform checkout removeItems
    act(() => {
      result.current.removeItems(itemsToCheckout);
    });

    // Product 1 is removed from cart, Product 2 remains in cart
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe('prod-2');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.total).toBe(3000);
  });
});
