'use client';

import React, { useState, useEffect } from 'react';
import { ProductItem } from './ProductCard';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';
import { X, ShoppingCart, Sparkles, CheckCircle2, ShieldCheck, Tag, TrendingUp, Plus } from 'lucide-react';

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
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<{
    upsell: { productId: string; name: string; price: number; priceDiff: number; reason: string } | null;
    crossSells: Array<{ productId: string; name: string; price: number; category?: string; reason: string }>;
  }>({ upsell: null, crossSells: [] });
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (!product?._id) return;
    let isMounted = true;
    setLoadingRecs(true);

    ApiClient.request<{
      success: boolean;
      upsell: any | null;
      crossSells: any[];
    }>(`/api/recommendations/product/${product._id}`)
      .then((res) => {
        if (isMounted && res && res.success) {
          setRecommendations({
            upsell: res.upsell || null,
            crossSells: Array.isArray(res.crossSells) ? res.crossSells : [],
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecommendations({ upsell: null, crossSells: [] });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingRecs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id]);

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

  const handleAddRecommendedItem = (item: { productId: string; name: string; price: number; category?: string }) => {
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      category: item.category || 'Accessories',
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
                {isOutOfStock ? t('catalog.outOfStock') : t('catalog.unitsStock', { count: product.stock })}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
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
              {t('productModal.guaranteedAuthentic')}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {product.description || t('productModal.guaranteedDesc')}
            </p>
          </div>

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600" /> {t('productModal.keyFeatures')}
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

          {/* AI Recommendations: Upsell & Cross-sell */}
          {(recommendations.upsell || recommendations.crossSells.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>AI Recommendations for this Product</span>
                </h4>
              </div>

              {/* Premium Upgrade (Upsell) */}
              {recommendations.upsell && (() => {
                const upsellItem = Array.isArray(recommendations.upsell) ? recommendations.upsell[0] : recommendations.upsell;
                if (!upsellItem) return null;
                const upPrice = typeof upsellItem.price === 'number' ? upsellItem.price : (Number(upsellItem.price) || 0);
                const priceDiff = typeof upsellItem.priceDiff === 'number' ? upsellItem.priceDiff : 0;
                return (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t('recommendations.upsellTitle')}</span>
                      </div>
                      {priceDiff > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          +₹{(priceDiff ?? 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">{upsellItem.reason}</p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-indigo-100">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{upsellItem.name}</span>
                        <span className="text-xs font-black text-indigo-700">₹{(upPrice ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddRecommendedItem(upsellItem)}
                        className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('recommendations.approveAndAdd')}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Frequently Paired Together (Cross-Sells) */}
              {recommendations.crossSells.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('recommendations.crossSellTitle')}</span>
                  </div>
                  <div className="space-y-2">
                    {(Array.isArray(recommendations.crossSells[0]) ? (recommendations.crossSells as any).flat() : recommendations.crossSells).map((rawCs: any) => {
                      const cs = Array.isArray(rawCs) ? rawCs[0] : rawCs;
                      if (!cs) return null;
                      const csPrice = typeof cs.price === 'number' ? cs.price : (Number(cs.price) || 0);
                      return (
                        <div
                          key={cs.productId || cs.name}
                          className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900 truncate block">{cs.name}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 block">{cs.reason}</span>
                            <span className="text-xs font-black text-emerald-700 block mt-0.5">
                              ₹{(csPrice ?? 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddRecommendedItem(cs)}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{t('catalog.addToCart')}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price & Safety Assurance */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/60 via-slate-50 to-indigo-50/60 border border-brand-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">₹ {t('catalog.price')}</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{(product?.price ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('productModal.razorpayTestReady')}</span>
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
            <span>{t('productModal.askAboutProduct')}</span>
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
            <span>{inCart ? t('catalog.inCart') : t('catalog.addToCart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
