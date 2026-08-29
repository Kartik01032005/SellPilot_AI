'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Sparkles, Check, AlertTriangle, ArrowUpRight } from 'lucide-react';

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
      className="group relative bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-brand-500/5"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
            {product.category}
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isOutOfStock
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isOutOfStock ? (
              <>
                <AlertTriangle className="w-3 h-3" /> Out of stock
              </>
            ) : (
              <>
                <Check className="w-3 h-3" /> {product.stock} in stock
              </>
            )}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-brand-300 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {product.description || 'Premium quality product certified for authentic performance.'}
        </p>

        {/* Features Tags */}
        {product.features && product.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.features.slice(0, 2).map((feat, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800/80"
              >
                {feat}
              </span>
            ))}
            {product.features.length > 2 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{product.features.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row (Price & Actions) */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Verified Price</span>
          <span className="text-base sm:text-lg font-extrabold text-white">
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
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-brand-400 hover:text-brand-300 border border-slate-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : inCart
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{inCart ? 'Added' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
