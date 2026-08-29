'use client';

import React from 'react';
import { ProductItem } from './ProductCard';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, Sparkles, CheckCircle2, ShieldCheck, Tag, Layers } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {product.category}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock} units available`}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Product Overview
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description ||
                'High performance product rigorously tested for quality, durability, and commercial compliance.'}
            </p>
          </div>

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-400" /> Key Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Safety Assurance */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Server-Verified Price</span>
              <span className="text-2xl font-extrabold text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Razorpay Verified</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onAskAI(product);
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-brand-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Ask SellPilot AI</span>
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : inCart
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{inCart ? 'In Cart' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
