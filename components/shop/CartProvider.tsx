'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductVariation } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('olympicBluffsCart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('olympicBluffsCart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1, variation?: ProductVariation) => {
    setItems((currentItems) => {
      // Find existing item by product ID and variation ID (if applicable)
      const existingItem = currentItems.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariation?.id === variation?.id
      );

      if (existingItem) {
        // Update quantity if exact match exists (same product + same variation)
        return currentItems.map((item) =>
          item.product.id === product.id &&
          item.selectedVariation?.id === variation?.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item with selected variation
        return [...currentItems, { product, quantity, selectedVariation: variation }];
      }
    });
    setIsOpen(true); // Open cart when item is added
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedVariation?.id === variationId
          )
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variationId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId &&
        item.selectedVariation?.id === variationId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setIsOpen(false);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total using variation price if available, otherwise use product price
  const totalAmount = items.reduce(
    (sum, item) => {
      const itemPrice = item.selectedVariation?.price || item.product.price;
      return sum + itemPrice * item.quantity;
    },
    0
  );

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
