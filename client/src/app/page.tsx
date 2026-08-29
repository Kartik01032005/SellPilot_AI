'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { AIChatModal } from '@/components/AIChatModal';
import { ProductCard, ProductItem } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { CustomerOrders } from '@/components/CustomerOrders';
import { MerchantDashboard } from '@/components/MerchantDashboard';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Compass,
  Store,
  ShieldCheck,
  CreditCard,
  Database,
  Server,
  CheckCircle2,
  RefreshCw,
  Tag,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { language, languageNames } = useLanguage();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'discovery' | 'merchant' | 'orders'>('discovery');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMode, setChatInitialMode] = useState<'buyer' | 'merchant'>('buyer');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Server Health
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    loading: boolean;
    error?: string;
  }>({
    status: 'checking...',
    loading: true,
  });

  // Product Discovery State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100000);

  // Fallback initial products if server has no seed products yet
  const defaultSampleProducts: ProductItem[] = [
    {
      _id: 'prod_demo_1',
      name: 'Pro Carbon Running Shoes',
      description: 'Ultra-lightweight marathon running shoes with responsive carbon-plate energy return.',
      price: 2999,
      currency: 'INR',
      stock: 12,
      category: 'Shoes',
      features: ['Carbon-plate', 'Breathable Mesh', 'High Rebound Cushioning'],
      isActive: true,
    },
    {
      _id: 'prod_demo_2',
      name: 'Ultra Grip Road Running Shoes',
      description: 'Durable all-weather road running shoes engineered with maximum impact protection.',
      price: 2499,
      currency: 'INR',
      stock: 8,
      category: 'Shoes',
      features: ['All-Weather Grip', 'Dual-Density Foam', 'Reflective Strips'],
      isActive: true,
    },
    {
      _id: 'prod_demo_3',
      name: 'Performance Compression Sports Socks (3-Pack)',
      description: 'Moisture-wicking anti-blister athletic socks designed to accompany running shoes.',
      price: 499,
      currency: 'INR',
      stock: 35,
      category: 'Accessories',
      features: ['Anti-Blister', 'Arch Support', 'Moisture-Wicking'],
      isActive: true,
    },
    {
      _id: 'prod_demo_4',
      name: 'Pro Slim Ultrabook 14"',
      description: 'Thin and lightweight laptop powered by 16GB RAM and fast SSD storage.',
      price: 48999,
      currency: 'INR',
      stock: 5,
      category: 'Laptops',
      features: ['16GB RAM', '512GB SSD', '14" FHD Display', 'Backlit Keyboard'],
      isActive: true,
    },
    {
      _id: 'prod_demo_5',
      name: 'Executive Waterproof Laptop Bag',
      description: 'Padded shockproof laptop briefcase with organizer compartments.',
      price: 1899,
      currency: 'INR',
      stock: 18,
      category: 'Accessories',
      features: ['Waterproof Fabric', 'Shock-Resistant Padding', 'Luggage Strap'],
      isActive: true,
    },
    {
      _id: 'prod_demo_6',
      name: 'Active Noise Cancelling Wireless Headphones',
      description: 'Premium over-ear Bluetooth headphones with 40-hour battery life.',
      price: 3499,
      currency: 'INR',
      stock: 14,
      category: 'Electronics',
      features: ['Active Noise Cancelling', '40h Battery', 'Bluetooth 5.3'],
      isActive: true,
    },
  ];

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (maxPriceFilter < 100000) queryParams.append('maxPrice', maxPriceFilter.toString());

      const res = await ApiClient.request<{ success: boolean; products: ProductItem[] }>(
        `/api/products?${queryParams.toString()}`
      );

      if (res.success && res.products && res.products.length > 0) {
        setProducts(res.products);
      } else {
        // Use filtered sample products if server returned empty
        let filtered = defaultSampleProducts;
        if (selectedCategory !== 'All') {
          filtered = filtered.filter((p) => p.category === selectedCategory);
        }
        if (searchQuery) {
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (maxPriceFilter < 100000) {
          filtered = filtered.filter((p) => p.price <= maxPriceFilter);
        }
        setProducts(filtered);
      }
    } catch {
      setProducts(defaultSampleProducts);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await ApiClient.checkHealth();
        if (res.success && res.status === 'healthy') {
          setServerHealth({ status: 'healthy', loading: false });
        } else {
          setServerHealth({
            status: 'offline',
            loading: false,
            error: res.message || 'Unable to connect to backend',
          });
        }
      } catch {
        setServerHealth({ status: 'offline', loading: false, error: 'Backend offline' });
      }
    }
    checkStatus();
    fetchProducts();
  }, [selectedCategory, maxPriceFilter]);

  const categories = ['All', 'Shoes', 'Laptops', 'Phones', 'Cameras', 'Accessories', 'Electronics', 'Clothing'];

  const handleAskAIWithProduct = (prod: ProductItem) => {
    setChatInitialMode('buyer');
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={() => setIsAuthOpen(true)}
        openChatModal={() => {
          setChatInitialMode('buyer');
          setIsChatOpen(true);
        }}
        serverStatus={serverHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW: Buyer Discovery */}
        {activeTab === 'discovery' && (
          <div className="space-y-10">
            {/* Hero & AI Search Banner */}
            <section className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 shadow-2xl overflow-hidden text-center">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold mb-4 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Razorpay Track 01 — AI Growth & Agentic Commerce</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                Discover Verified Products with <br />
                <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  Conversational AI Intelligence
                </span>
              </h1>

              <p className="mt-4 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Search in English or Romanized Indian languages (Kannada, Hindi, Tamil, Telugu) with
                budget constraints and verified inventory.
              </p>

              {/* Natural Language Prompt Box */}
              <div className="mt-8 max-w-2xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setIsChatOpen(true);
                    }
                  }}
                  className="p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex items-center gap-2 focus-within:border-brand-500/80 transition-colors"
                >
                  <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`e.g. ${languageNames[language]?.sample || 'running shoes under 3000'}`}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none py-2"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                </form>

                {/* Quick Romanized Chips */}
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px] text-slate-400">
                  <span className="text-slate-500">Try Romanized:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('nanage running shoes beku under 3000');
                      setIsChatOpen(true);
                    }}
                    className="hover:text-brand-300 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/80 transition-colors"
                  >
                    nanage running shoes beku under 3000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('mujhe running shoes chahiye under 2500');
                      setIsChatOpen(true);
                    }}
                    className="hover:text-brand-300 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/80 transition-colors"
                  >
                    mujhe running shoes chahiye under 2500
                  </button>
                </div>
              </div>
            </section>

            {/* Catalog Filter Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Price Filter Slider / Reset */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  Max: <strong className="text-white">₹{maxPriceFilter.toLocaleString('en-IN')}</strong>
                </span>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-28 sm:w-36 accent-brand-500 cursor-pointer"
                />
                <button
                  onClick={fetchProducts}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Refresh Catalog"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 py-12">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No products match your criteria</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting your price filter or search query, or ask SellPilot AI for recommendations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <ProductCard
                    key={prod._id}
                    product={prod}
                    onOpenDetails={(p) => setSelectedProduct(p)}
                    onAskAI={(p) => handleAskAIWithProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Merchant Hub */}
        {activeTab === 'merchant' && <MerchantDashboard />}

        {/* VIEW: Customer Orders */}
        {activeTab === 'orders' && <CustomerOrders />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/30 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">SellPilot AI</span>
            <span>—</span>
            <span>Razorpay Track 01 (AI Growth & Agentic Commerce)</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Gated & Verified
            </span>
            <span>Razorpay Test Mode</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskAI={(p) => handleAskAIWithProduct(p)}
      />
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(orderId) => {
          setActiveTab('orders');
        }}
      />
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMode={chatInitialMode}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />
    </div>
  );
}
