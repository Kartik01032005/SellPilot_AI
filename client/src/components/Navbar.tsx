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
  CheckCircle2,
  AlertCircle,
  Package,
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
    <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => setActiveTab('discovery')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">SellPilot AI</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Track 01
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI Growth & Agentic Commerce</p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'discovery'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Buyer Discovery</span>
            </button>

            {user?.role === 'merchant' || user?.role === 'admin' ? (
              <button
                onClick={() => setActiveTab('merchant')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'merchant'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Merchant Hub</span>
              </button>
            ) : null}

            {user ? (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'orders'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>My Orders</span>
              </button>
            ) : null}
          </nav>
        </div>

        {/* Right Actions (Language, AI Trigger, Cart, Auth) */}
        <div className="flex items-center space-x-3">
          {/* Server Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="capitalize text-[11px]">
              {serverStatus.loading ? 'Checking' : serverStatus.status}
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select Language"
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl pl-8 pr-2 py-1.5 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
            >
              {Object.entries(languageNames).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Chat Button */}
          <button
            onClick={openChatModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-200 animate-spin-slow" />
            <span>Ask SellPilot AI</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Open Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {itemCount}
              </span>
            )}
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
