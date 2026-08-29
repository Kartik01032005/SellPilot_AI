'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '@/lib/api';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
}

export interface PreparedCheckout {
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: { productId: string; name: string; price: number; category?: string; image?: string }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  preparedCheckout: PreparedCheckout | null;
  prepareCheckoutLoading: boolean;
  refreshPreparedCheckout: () => Promise<PreparedCheckout | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [preparedCheckout, setPreparedCheckout] = useState<PreparedCheckout | null>(null);
  const [prepareCheckoutLoading, setPrepareCheckoutLoading] = useState<boolean>(false);

  // Load cart from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sellpilot_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  // Save cart to local storage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('sellpilot_cart', JSON.stringify(items));
    } catch {
      // Ignore
    }
    if (items.length > 0) {
      refreshPreparedCheckout();
    } else {
      setPreparedCheckout(null);
    }
  }, [items]);

  const refreshPreparedCheckout = async (): Promise<PreparedCheckout | null> => {
    if (items.length === 0) {
      setPreparedCheckout(null);
      return null;
    }

    setPrepareCheckoutLoading(true);
    try {
      const payload = {
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      };

      const res = await ApiClient.request<{
        success: boolean;
        subtotal: number;
        discount: number;
        total: number;
        currency: string;
        items: Array<{
          productId: string;
          name: string;
          price: number;
          quantity: number;
          lineTotal: number;
        }>;
      }>('/api/checkout/prepare', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        const checkoutData: PreparedCheckout = {
          subtotal: res.subtotal ?? items.reduce((acc, it) => acc + it.price * it.quantity, 0),
          discount: res.discount ?? 0,
          total: res.total ?? items.reduce((acc, it) => acc + it.price * it.quantity, 0),
          currency: res.currency ?? 'INR',
          items: res.items ?? items.map((it) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            lineTotal: it.price * it.quantity,
          })),
        };
        setPreparedCheckout(checkoutData);
        setPrepareCheckoutLoading(false);
        return checkoutData;
      }

      // Fallback calculation for display if server is offline
      const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const fallbackCheckout: PreparedCheckout = {
        subtotal,
        discount: 0,
        total: subtotal,
        currency: 'INR',
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          lineTotal: it.price * it.quantity,
        })),
      };
      setPreparedCheckout(fallbackCheckout);
      setPrepareCheckoutLoading(false);
      return fallbackCheckout;
    } catch {
      const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const fallbackCheckout: PreparedCheckout = {
        subtotal,
        discount: 0,
        total: subtotal,
        currency: 'INR',
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          lineTotal: it.price * it.quantity,
        })),
      };
      setPreparedCheckout(fallbackCheckout);
      setPrepareCheckoutLoading(false);
      return fallbackCheckout;
    }
  };

  const addItem = (
    item: { productId: string; name: string; price: number; category?: string; image?: string },
    quantity: number = 1
  ) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.productId === item.productId);
      if (existing) {
        return prev.map((it) =>
          it.productId === item.productId ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity } : it))
    );
  };

  const clearCart = () => {
    setItems([]);
    setPreparedCheckout(null);
  };

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        preparedCheckout,
        prepareCheckoutLoading,
        refreshPreparedCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
