'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage, SupportedLanguage } from '@/context/LanguageContext';
import {
  Bot,
  ShoppingCart,
  User,
  LogOut,
  Store,
  Compass,
  Sparkles,
  Globe,
  Package,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'discovery' | 'merchant' | 'orders';
  setActiveTab: (tab: 'discovery' | 'merchant' | 'orders') => void;
  openAuthModal: () => void;
  openChatModal: () => void;
  serverStatus: { status: string; loading: boolean };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openChatModal,
  serverStatus,
}) => {
  const { user, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { language, setLanguage, languageNames } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo & Navigation */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => setActiveTab('discovery')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 text-white group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                SellPilot<span className="text-brand-600">.ai</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                Track 01
              </span>
            </div>
          </div>

          {/* Navigation Mode Tabs (Pill Style) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/70">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'discovery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-brand-600" />
              <span>Buyer Discovery</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setActiveTab('merchant');
                }
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'merchant'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-brand-600" />
              <span>Merchant Hub</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setActiveTab('orders');
                }
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-brand-600" />
              <span>My Orders</span>
            </button>
          </nav>
        </div>

        {/* Right Actions (Language, AI Trigger, Cart, Auth) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Server Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="capitalize text-[11px] font-semibold">
              {serverStatus.loading ? 'Connecting' : serverStatus.status}
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select Language"
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-full pl-8 pr-6 py-1.5 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer transition-colors"
            >
              {Object.entries(languageNames).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* AI Chat Button (Primary Pill CTA) */}
          <button
            onClick={openChatModal}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-300 animate-pulse" />
            <span>Ask SellPilot AI</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 hover:text-slate-900 transition-all"
            title="Open Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {itemCount}
              </span>
            )}
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-full pl-1.5 pr-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user.email[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 capitalize font-medium">{user.role}</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-all"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
