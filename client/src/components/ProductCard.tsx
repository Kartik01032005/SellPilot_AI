'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Sparkles, Check, AlertTriangle } from 'lucide-react';

export interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock: number;
  category: string;
  features?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

interface ProductCardProps {
  product: ProductItem;
  onOpenDetails: (product: ProductItem) => void;
  onAskAI: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onAskAI,
}) => {
  const { addItem, items } = useCart();
  const inCart = items.some((it) => it.productId === product._id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative bg-white hover:bg-white border border-slate-200/90 hover:border-brand-400/60 rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-soft hover:shadow-hover hover:-translate-y-1 font-sans"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
            {product.category}
          </span>
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isOutOfStock
                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
            }`}
          >
            {isOutOfStock ? (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Out of stock
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-600" /> {product.stock} in stock
              </>
            )}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.description || 'Premium quality catalog product certified for authentic performance.'}
        </p>

        {/* Features Tags */}
        {product.features && product.features.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {product.features.slice(0, 2).map((feat, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200/70"
              >
                {feat}
              </span>
            ))}
            {product.features.length > 2 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{product.features.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row (Price & Actions) */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Price</span>
          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAskAI(product);
            }}
            title="Ask AI about this product"
            className="p-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : inCart
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{inCart ? 'Added' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
