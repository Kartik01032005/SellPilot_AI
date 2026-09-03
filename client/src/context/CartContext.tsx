'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  syncCart: (serverItems: Array<{ productId: string; name: string; price: number; quantity?: number; category?: string; image?: string }>) => void;
  preparedCheckout: PreparedCheckout | null;
  prepareCheckoutLoading: boolean;
  refreshPreparedCheckout: () => Promise<PreparedCheckout | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always initialize as empty array to match server-side render during hydration
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [preparedCheckout, setPreparedCheckout] = useState<PreparedCheckout | null>(null);
  const [prepareCheckoutLoading, setPrepareCheckoutLoading] = useState<boolean>(false);
  const isMountedRef = useRef(false);

  const refreshPreparedCheckout = useCallback(async (): Promise<PreparedCheckout | null> => {
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
        const prep: PreparedCheckout = {
          subtotal: res.subtotal ?? items.reduce((acc, it) => acc + it.price * it.quantity, 0),
          discount: res.discount ?? 0,
          total: res.total ?? items.reduce((acc, it) => acc + it.price * it.quantity, 0),
          currency: res.currency || 'INR',
          items: res.items || [],
        };
        setPreparedCheckout(prep);
        setPrepareCheckoutLoading(false);
        return prep;
      }

      setPreparedCheckout(null);
      setPrepareCheckoutLoading(false);
      return null;
    } catch {
      setPreparedCheckout(null);
      setPrepareCheckoutLoading(false);
      return null;
    }
  }, [items]);

  // Synchronize with localStorage after mount
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      try {
        const saved = localStorage.getItem('sellpilot_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        }
      } catch {
        // Ignore
      }
      return;
    }

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
  }, [items, refreshPreparedCheckout]);

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
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sellpilot_cart');
      } catch {
        // Ignore
      }
    }
  };

  const syncCart = useCallback(
    (
      serverItems: Array<{
        productId: string;
        name: string;
        price: number;
        quantity?: number;
        category?: string;
        image?: string;
      }>
    ) => {
      if (!Array.isArray(serverItems) || serverItems.length === 0) return;
      setItems((prev) => {
        const next = [...prev];
        for (const sItem of serverItems) {
          const qty = sItem.quantity && sItem.quantity > 0 ? sItem.quantity : 1;
          const existingIdx = next.findIndex((it) => it.productId === sItem.productId);
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              name: sItem.name || next[existingIdx].name,
              price: sItem.price ?? next[existingIdx].price,
              quantity: qty,
              category: sItem.category || next[existingIdx].category,
            };
          } else {
            next.push({
              productId: sItem.productId,
              name: sItem.name,
              price: sItem.price,
              quantity: qty,
              category: sItem.category,
              image: sItem.image,
            });
          }
        }
        return next;
      });
    },
    []
  );

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
        syncCart,
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
