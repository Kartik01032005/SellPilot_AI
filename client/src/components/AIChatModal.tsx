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
  CheckCircle2,
  RefreshCw,
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
  }>;
  upsell?: {
    productId: string;
    name: string;
    price: number;
    priceDiff: number;
    reason: string;
  } | null;
  crossSells?: Array<{
    productId: string;
    name: string;
    price: number;
    reason: string;
  }>;
  requiresConfirmation?: boolean;
  timestamp: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'buyer' | 'merchant';
  onOpenCheckout?: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'buyer',
  onOpenCheckout,
}) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { language, languageNames } = useLanguage();

  const [mode, setMode] = useState<'buyer' | 'merchant'>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial greeting when opened
  useEffect(() => {
    if (isOpen) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome',
        sender: 'agent',
        text:
          mode === 'buyer'
            ? 'Hello! I am SellPilot AI. Tell me what product you are looking for, your budget, or desired features, and I will match verified catalog products with price bounds.'
            : 'Welcome to SellPilot Merchant Hub. Ask me about product performance, promotion opportunities, upsells, or campaign discount ideas.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => (prev.length === 0 ? [initialGreeting] : prev));
    }
  }, [isOpen, mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const buyerPromptChips = [
    'I need running shoes under 3000',
    'nanage running shoes beku under 3000',
    'mujhe running shoes chahiye under 2500',
    'laptop under 50k with 16gb ram',
    'Which is cheapest?',
    'buy this now',
  ];

  const merchantPromptChips = [
    'What should I promote?',
    'Which product has the best opportunity?',
    'What should I cross-sell?',
    'Can I give a 20% discount?',
    'Give everyone an 80% discount on shoes',
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
        requiresConfirmation?: boolean;
        conversationId?: string;
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          mode,
          language,
          conversationId,
        }),
      });

      if (res.success) {
        if (res.conversationId) {
          setConversationId(res.conversationId);
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
                <h3 className="font-bold text-sm sm:text-base text-slate-900">SellPilot AI Assistant</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                  Agentic Commerce
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Language: {languageNames[language]?.label || 'English'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode Switcher */}
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
                <span>Buyer</span>
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
                <span>Merchant</span>
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
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
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Structured Products Output from AI */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended Verified Products
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
                                ₹{p.price.toLocaleString('en-IN')}
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
                          </div>
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
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upsell Card */}
                {msg.upsell && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-xs">
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Value Upsell Suggestion</span>
                    </div>
                    <p className="text-slate-600 text-[11px] font-medium">{msg.upsell.reason}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {msg.upsell.name} (₹{msg.upsell.price.toLocaleString('en-IN')})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          addItem({
                            productId: msg.upsell!.productId,
                            name: msg.upsell!.name,
                            price: msg.upsell!.price,
                          })
                        }
                        className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-2xs transition-colors"
                      >
                        Add Upgrade
                      </button>
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
                      <span>Proceed to Verified Checkout</span>
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
              <span className="font-semibold">Analyzing verified catalog...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

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
                ? `Search or ask in ${languageNames[language]?.label}... (e.g. shoes under 3000)`
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
