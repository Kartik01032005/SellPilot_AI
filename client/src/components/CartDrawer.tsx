'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    preparedCheckout,
    prepareCheckoutLoading,
  } = useCart();
  const { t } = useLanguage();

  if (!isCartOpen) return null;

  const totalAmount = preparedCheckout?.total ?? 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in font-sans">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200/90 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('cart.title')}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {t('cart.itemsCount', { count: items.length })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              aria-label={t('common.close')}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fbfcfe]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">{t('cart.emptyTitle')}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px] font-medium">
                  {t('cart.emptySubtitle')}
                </p>
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.productId}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-brand-700 block mb-0.5">
                      {it.category || 'Product'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{it.name}</h4>
                    <p className="text-xs font-black text-slate-900 mt-1">
                      ₹{it.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-full p-0.5">
                    <button
                      onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                      className="p-1 rounded-full hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 w-5 text-center">
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                      className="p-1 rounded-full hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(it.productId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-full hover:bg-rose-50"
                    title={t('cart.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer (Total & Checkout Action) */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-white space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-semibold text-slate-800">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                {preparedCheckout && preparedCheckout.discount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                    <span>{t('cart.discount')}</span>
                    <span>-₹{preparedCheckout.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>{t('cart.total')}</span>
                  <span className="text-base text-brand-600 font-black">
                    {prepareCheckoutLoading
                      ? t('common.loading')
                      : preparedCheckout
                        ? `₹${totalAmount.toLocaleString('en-IN')}`
                        : 'Unavailable'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                disabled={prepareCheckoutLoading || !preparedCheckout}
                className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <span>{t('cart.checkoutBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('cart.verifiedCheckout')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
