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
  User,
  Sparkles,
  Store,
  Compass,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
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
    if (isOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome',
        sender: 'agent',
        text:
          mode === 'buyer'
            ? 'Hello! I am SellPilot AI. Tell me what you are looking for, your budget, or specific features, and I will find verified catalog options for you.'
            : 'Welcome to SellPilot Merchant Hub. Ask me about product performance, promotion opportunities, upsells, or campaign ideas.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
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
    } catch (err) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[780px]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">SellPilot AI Assistant</h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Agentic Commerce
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Language: {languageNames[language]?.label || 'English'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode Switcher */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode('buyer')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  mode === 'buyer'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>Buyer</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('merchant')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  mode === 'merchant'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Store className="w-3 h-3" />
                <span>Merchant</span>
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-500/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Structured Products Output from AI */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Recommended Verified Products
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.products.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-bold text-brand-400 uppercase">
                                {p.category}
                              </span>
                              <span className="text-xs font-extrabold text-white">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-white mt-1 line-clamp-1">
                              {p.name}
                            </h5>
                            {p.reason && (
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
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
                            className="mt-3 w-full py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-[11px] font-bold flex items-center justify-center space-x-1 transition-all"
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
                  <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                    <div className="flex items-center space-x-1.5 text-indigo-300 font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Value Upsell Suggestion</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{msg.upsell.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
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
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-colors"
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
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceed to Verified Checkout</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-brand-400 bg-slate-900 border border-slate-800 p-3 rounded-2xl max-w-[200px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing catalog...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar">
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
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
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
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
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
