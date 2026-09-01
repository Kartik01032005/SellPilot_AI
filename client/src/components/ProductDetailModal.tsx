'use client';

import React from 'react';
import { ProductItem } from './ProductCard';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, Sparkles, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAskAI: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAskAI,
}) => {
  const { addItem, items } = useCart();

  if (!product) return null;

  const inCart = items.some((it) => it.productId === product._id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                {product.category}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-600 text-xs">
          {/* Description */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Product Overview
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {product.description ||
                'High performance catalog product certified for authentic quality and verified commerce.'}
            </p>
          </div>

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600" /> Key Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center space-x-2 text-xs text-slate-700 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Safety Assurance */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/60 via-slate-50 to-indigo-50/60 border border-brand-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Verified Price</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Verified</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onAskAI(product);
              onClose();
            }}
            className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-brand-700 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Ask SellPilot AI</span>
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center space-x-2 transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : inCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{inCart ? 'Added to Cart' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
