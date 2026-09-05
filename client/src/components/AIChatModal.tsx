'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';
import {
  X,
  Send,
  Bot,
  Compass,
  Store,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  intent?: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    stock: number;
    category: string;
    available: boolean;
    reason?: string;
    upsell?: { productId: string; name: string; price: number; priceDiff: number; reason: string } | null;
    crossSells?: Array<{ productId: string; name: string; price: number; category?: string; reason: string }>;
    currentCartTotal?: number;
    quantityAdded?: number;
    newCartTotal?: number;
    explanation?: string;
  }>;
  upsell?: {
    productId: string;
    name: string;
    price: number;
    priceDiff: number;
    reason: string;
    currentCartTotal?: number;
    quantityAdded?: number;
    newCartTotal?: number;
    explanation?: string;
  } | null;
  crossSells?: Array<{
    productId: string;
    name: string;
    price: number;
    reason: string;
    currentCartTotal?: number;
    quantityAdded?: number;
    newCartTotal?: number;
    explanation?: string;
  }>;
  requiresConfirmation?: boolean;
  timestamp: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'buyer' | 'merchant';
  onOpenCheckout?: () => void;
  onCorrelationId?: (correlationId: string) => void;
}

const formatChatMessage = (text: string, isUser: boolean) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\.\s/.test(trimmed);
        const bulletContent = isBullet ? trimmed.replace(/^([•\-]\s*|\d+\.\s*)/, '') : line;

        // Parse **bold** markers
        const parts = bulletContent.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 py-0.5 pl-1">
              <span className="text-brand-600 font-bold leading-tight select-none mt-0.5">•</span>
              <span className="flex-1 text-slate-700">{parts}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800 font-medium">
            {parts}
          </p>
        );
      })}
    </div>
  );
};

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'buyer',
  onOpenCheckout,
  onCorrelationId,
}) => {
  const { user } = useAuth();
  const { addItem, syncCart, addApprovedRecommendation } = useCart();
  const { language, languageNames, t } = useLanguage();

  const [mode, setMode] = useState<'buyer' | 'merchant'>(
    user?.role === 'customer' ? 'buyer' : initialMode
  );

  useEffect(() => {
    if (user?.role === 'customer' && mode !== 'buyer') {
      setMode('buyer');
    }
  }, [user?.role, mode]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [correlationId, setCorrelationId] = useState<string | undefined>(undefined);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleAddRecommendation = async (params: {
    productId: string;
    name: string;
    price: number;
    category?: string;
    recommendationType?: 'UPSELL' | 'CROSS_SELL';
  }) => {
    setActionNotice(null);
    if (user && addApprovedRecommendation) {
      const res = await addApprovedRecommendation({
        productId: params.productId,
        quantity: 1,
        recommendationType: params.recommendationType,
        sessionId: conversationId || undefined,
      });
      if (!res.success) {
        setActionNotice({
          type: 'error',
          message: res.error || 'Unable to add this recommendation to your cart.',
        });
        setTimeout(() => setActionNotice(null), 5000);
        return;
      }
    } else {
      addItem({
        productId: params.productId,
        name: params.name,
        price: params.price,
        category: params.category,
      });
    }
  };

  // Initialize initial greeting when opened
  useEffect(() => {
    if (isOpen) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome',
        sender: 'agent',
        text:
          mode === 'buyer'
            ? t('chat.initialGreetingBuyer')
            : t('chat.initialGreetingMerchant'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => (prev.length === 0 ? [initialGreeting] : prev));
    }
  }, [isOpen, mode, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const buyerPromptChips = [
    t('chat.chip1Buyer'),
    t('chat.chip2Buyer'),
    t('chat.chip3Buyer'),
    t('chat.chip4Buyer'),
    t('chat.chip5Buyer'),
    t('chat.chip6Buyer'),
  ];

  const merchantPromptChips = [
    t('chat.chip1Merchant'),
    t('chat.chip2Merchant'),
    t('chat.chip3Merchant'),
    t('chat.chip4Merchant'),
    t('chat.chip5Merchant'),
    t('chat.chip6Merchant'),
  ];

  const activeChips = mode === 'buyer' ? buyerPromptChips : merchantPromptChips;

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await ApiClient.request<{
        success: boolean;
        intent: string;
        message: string;
        mode: 'buyer' | 'merchant';
        products?: any[];
        upsell?: any;
        crossSells?: any[];
        cart?: {
          items: Array<{
            productId: string;
            name: string;
            price: number;
            quantity: number;
            category?: string;
          }>;
          totalItems: number;
          subtotal: number;
          currency?: string;
        };
        requiresConfirmation?: boolean;
        conversationId?: string;
        correlationId?: string;
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          mode,
          language,
          conversationId,
          correlationId,
        }),
      });

      if (res.success) {
        if (res.conversationId) {
          setConversationId(res.conversationId);
        }
        if (res.correlationId) {
          setCorrelationId(res.correlationId);
          onCorrelationId?.(res.correlationId);
        }

        if (res.cart?.items && Array.isArray(res.cart.items) && res.cart.items.length > 0) {
          syncCart(res.cart.items);
        }

        const agentMsg: ChatMessage = {
          id: `agt_${Date.now()}`,
          sender: 'agent',
          text: res.message || 'Here are the matching results from the verified catalog.',
          intent: res.intent,
          products: res.products,
          upsell: res.upsell,
          crossSells: res.crossSells,
          requiresConfirmation: res.requiresConfirmation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, agentMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `agt_err_${Date.now()}`,
          sender: 'agent',
          text: res.message || 'I encountered an issue processing your request.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `agt_err_${Date.now()}`,
        sender: 'agent',
        text: 'Network error occurred while contacting AI service. Using verified offline fallback.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[780px]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">{t('chat.assistantTitle')}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                  {t('chat.agenticCommerce')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('chat.languageLabel')}: {languageNames[language]?.label || 'English'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode Switcher - only available to merchants or visitors */}
            {(!user || user.role !== 'customer') && (
              <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setMode('buyer')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all ${
                    mode === 'buyer'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3 h-3 text-brand-600" />
                  <span>{t('chat.buyerTab')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('merchant')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all ${
                    mode === 'merchant'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3 h-3 text-brand-600" />
                  <span>{t('chat.merchantTab')}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#fbfcfe]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-soft'
                }`}
              >
                {formatChatMessage(msg.text, msg.sender === 'user')}

                {/* Structured Products Output from AI */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('catalog.title')}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.products.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-brand-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-bold text-brand-700 uppercase">
                                {p.category}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                ₹{(p.price ?? 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                              {p.name}
                            </h5>
                            {p.reason && (
                              <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                                {p.reason}
                              </p>
                            )}
                            {p.currentCartTotal !== undefined && p.newCartTotal !== undefined && (
                              <div className="mt-2 p-2 rounded-xl bg-slate-100/90 border border-slate-200/80 text-[10px] space-y-0.5">
                                <div className="flex justify-between text-slate-500 font-medium">
                                  <span>Cart Impact ({p.quantityAdded || 1} item)</span>
                                  <span>+₹{(p.price ?? 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                                  <span>₹{(p.currentCartTotal ?? 0).toLocaleString('en-IN')}</span>
                                  <span className="text-slate-400 font-normal">→</span>
                                  <span className="text-brand-600">₹{(p.newCartTotal ?? 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Per-product recommendations */}
                          {p.upsell && (() => {
                            const upsellItem = Array.isArray(p.upsell) ? p.upsell[0] : p.upsell;
                            if (!upsellItem) return null;
                            const upPrice = typeof upsellItem.price === 'number' ? upsellItem.price : (Number(upsellItem.price) || 0);
                            const priceDiff = typeof upsellItem.priceDiff === 'number' ? upsellItem.priceDiff : upPrice;
                            return (
                              <div className="mt-2 p-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-[10px]">
                                <span className="text-indigo-800 font-medium truncate">
                                  Upgrade: {upsellItem.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddRecommendation({
                                      productId: upsellItem.productId || upsellItem.id,
                                      name: upsellItem.name,
                                      price: upPrice,
                                      recommendationType: 'UPSELL',
                                    })
                                  }
                                  className="shrink-0 ml-1.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[9px] hover:bg-indigo-500"
                                >
                                  +₹{priceDiff.toLocaleString('en-IN')}
                                </button>
                              </div>
                            );
                          })()}
                          {p.crossSells && p.crossSells.length > 0 && (
                            <div className="mt-1.5 p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                                Recommended Pairing
                              </span>
                              {(Array.isArray(p.crossSells[0]) ? (p.crossSells as any).flat() : p.crossSells)
                                .slice(0, 1)
                                .map((rawCs: any) => {
                                  const cs = Array.isArray(rawCs) ? rawCs[0] : rawCs;
                                  if (!cs) return null;
                                  const csPrice = typeof cs.price === 'number' ? cs.price : (Number(cs.price) || 0);
                                  return (
                                    <div key={cs.productId || cs.id || cs.name} className="flex items-center justify-between text-[10px]">
                                      <span className="text-slate-700 font-medium truncate">{cs.name}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAddRecommendation({
                                            productId: cs.productId || cs.id,
                                            name: cs.name,
                                            price: csPrice,
                                            category: cs.category,
                                            recommendationType: 'CROSS_SELL',
                                          })
                                        }
                                        className="shrink-0 ml-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[9px] hover:bg-emerald-500"
                                      >
                                        +₹{csPrice.toLocaleString('en-IN')}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              addItem({
                                productId: p.id,
                                name: p.name,
                                price: p.price,
                                category: p.category,
                              })
                            }
                            className="mt-3 w-full py-1.5 rounded-full bg-white hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200 text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all shadow-2xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>{t('catalog.addToCart')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upsell Card */}
                {msg.upsell && (() => {
                  const upsellItem = Array.isArray(msg.upsell) ? msg.upsell[0] : msg.upsell;
                  if (!upsellItem) return null;
                  const upPrice = typeof upsellItem.price === 'number' ? upsellItem.price : (Number(upsellItem.price) || 0);
                  const curCart = typeof upsellItem.currentCartTotal === 'number' ? upsellItem.currentCartTotal : null;
                  const newCart = typeof upsellItem.newCartTotal === 'number' ? upsellItem.newCartTotal : null;
                  return (
                    <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-xs">
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t('recommendations.upsellTitle')}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-medium">{upsellItem.reason}</p>
                      {curCart !== null && newCart !== null && (
                        <div className="mt-2 p-2 rounded-xl bg-white/80 border border-indigo-100 text-[10px] space-y-0.5">
                          <div className="flex justify-between text-indigo-600 font-medium">
                            <span>Cart Transition (+{upsellItem.quantityAdded || 1} item)</span>
                            <span>+₹{upPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>₹{curCart.toLocaleString('en-IN')}</span>
                            <span className="text-slate-400 font-normal">→</span>
                            <span className="text-indigo-600">₹{newCart.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {upsellItem.name} (₹{upPrice.toLocaleString('en-IN')})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRecommendation({
                              productId: upsellItem.productId || upsellItem.id,
                              name: upsellItem.name,
                              price: upPrice,
                              recommendationType: 'UPSELL',
                            })
                          }
                          className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-2xs transition-colors"
                        >
                          {t('recommendations.approveAndAdd')}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Cross-Sell Recommendations Card */}
                {msg.crossSells && msg.crossSells.length > 0 && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('recommendations.crossSellTitle')}</span>
                    </div>
                    <div className="space-y-2">
                      {(Array.isArray(msg.crossSells[0]) ? (msg.crossSells as any).flat() : msg.crossSells).map((rawCs: any) => {
                        const cs = Array.isArray(rawCs) ? rawCs[0] : rawCs;
                        if (!cs) return null;
                        const csPrice = typeof cs.price === 'number' ? cs.price : (Number(cs.price) || 0);
                        return (
                          <div
                            key={cs.productId || cs.id || cs.name}
                            className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 block truncate">{cs.name}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 block">{cs.reason}</span>
                              <span className="text-xs font-black text-emerald-700 block mt-0.5">
                                ₹{csPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddRecommendation({
                                  productId: cs.productId || cs.id,
                                  name: cs.name,
                                  price: csPrice,
                                  category: cs.category,
                                  recommendationType: 'CROSS_SELL',
                                })
                              }
                              className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>{t('catalog.addToCart')}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Checkout Confirmation Trigger */}
                {msg.requiresConfirmation && onOpenCheckout && (
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCheckout();
                      }}
                      className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('chat.proceedCheckoutBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-brand-700 bg-brand-50 border border-brand-200/80 p-3 rounded-2xl max-w-[210px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span className="font-semibold">{t('common.loading')}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Safe Error & Recovery Feedback */}
        {actionNotice && (
          <div
            className={`mx-3 sm:mx-4 mt-2 px-3 py-2 rounded-2xl text-xs flex items-center justify-between animate-fade-in ${
              actionNotice.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                : 'bg-brand-50 text-brand-700 border border-brand-200/80'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-medium">{actionNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Prompt Suggestions */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 rounded-full text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-2xs font-semibold"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              mode === 'buyer'
                ? t('chat.inputPlaceholder')
                : 'Ask for merchant insights, promotions, or campaign advice...'
            }
            className="flex-1 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors font-medium"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white shadow-sm transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
