'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Globe2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Star,
  Check,
} from 'lucide-react';

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
  {
    _id: 'prod_demo_7',
    name: 'Pro Gaming Smartphone 5G',
    description: 'Flagship mobile gaming phone with 120Hz AMOLED display and liquid cooling.',
    price: 32999,
    currency: 'INR',
    stock: 10,
    category: 'Phones',
    features: ['120Hz AMOLED', 'Snapdragon 8 Gen', '5000mAh Battery'],
    isActive: true,
  },
  {
    _id: 'prod_demo_8',
    name: '4K Cinema Mirrorless Camera',
    description: 'Professional 4K vlogging and cinema camera with fast phase autofocus.',
    price: 64999,
    currency: 'INR',
    stock: 4,
    category: 'Cameras',
    features: ['4K 60FPS', 'Optical Stabilization', 'Flip Touchscreen'],
    isActive: true,
  },
  {
    _id: 'prod_demo_9',
    name: 'Breathable Dri-FIT Athletic Jersey',
    description: 'Moisture-wicking athletic training shirt engineered for performance and comfort.',
    price: 899,
    currency: 'INR',
    stock: 25,
    category: 'Clothing',
    features: ['Dri-FIT Fabric', 'Ergonomic Fit', 'Anti-Odor'],
    isActive: true,
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { language, languageNames, t } = useLanguage();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'discovery' | 'merchant' | 'orders'>('discovery');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMode, setChatInitialMode] = useState<'buyer' | 'merchant'>('buyer');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [commerceCorrelationId, setCommerceCorrelationId] = useState<string | undefined>();
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

  // Product Discovery State - Initialized immediately with sample products so inventory is never empty
  const [products, setProducts] = useState<ProductItem[]>(defaultSampleProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100000);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (maxPriceFilter < 100000) queryParams.append('maxPrice', maxPriceFilter.toString());

      const res = await ApiClient.request<{ success: boolean; products: ProductItem[] }>(
        `/api/products?${queryParams.toString()}`,
        { cache: 'no-store' }
      );

      if (res.success && res.products && res.products.length >= 6) {
        setProducts(res.products);
      } else if (res.success && res.products && res.products.length > 0 && selectedCategory !== 'All') {
        setProducts(res.products);
      } else {
        // Use full default sample products
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
  }, [selectedCategory, searchQuery, maxPriceFilter]);

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
  }, [fetchProducts]);

  // Route Guard: Ensure customer accounts cannot remain in merchant tab
  useEffect(() => {
    if (user?.role === 'customer' && activeTab === 'merchant') {
      setActiveTab('discovery');
    }
  }, [user?.role, activeTab]);

  const categories = ['All', 'Shoes', 'Laptops', 'Phones', 'Cameras', 'Accessories', 'Electronics', 'Clothing'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'All': return t('catalog.categoryAll');
      case 'Shoes': return t('catalog.categories.shoes');
      case 'Laptops': return t('catalog.categories.laptops');
      case 'Phones': return t('catalog.categories.phones');
      case 'Cameras': return t('catalog.categories.cameras');
      case 'Accessories': return t('catalog.categories.accessories');
      case 'Electronics': return t('catalog.categories.electronics');
      case 'Clothing': return t('catalog.categories.clothing');
      default: return cat;
    }
  };

  const handleAskAIWithProduct = (prod: ProductItem) => {
    setChatInitialMode('buyer');
    setIsChatOpen(true);
  };

  const faqs = [
    {
      q: t('faqs.q1'),
      a: t('faqs.a1'),
    },
    {
      q: t('faqs.q2'),
      a: t('faqs.a2'),
    },
    {
      q: t('faqs.q3'),
      a: t('faqs.a3'),
    },
    {
      q: t('faqs.q4'),
      a: t('faqs.a4'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-slate-900 font-sans flex flex-col justify-between selection:bg-brand-500 selection:text-white">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* VIEW: Buyer Discovery & SaaS Landing Page */}
        {activeTab === 'discovery' && (
          <div className="space-y-20">
            {/* HERO SECTION */}
            <section className="relative pt-6 sm:pt-12 pb-10 text-center space-y-8">
              {/* Announcement Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-brand-200/80 bg-brand-50/80 text-brand-700 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>{t('hero.badge')}</span>
              </div>

              {/* Bold SaaS Headline with Manrope Typography */}
              <div className="max-w-4xl mx-auto space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
                  {t('hero.titleLine1')} <br />
                  <span className="bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('hero.titleLine2')}
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                  {t('hero.subtitle')}
                </p>
              </div>

              {/* Dual CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setChatInitialMode('buyer');
                    setIsChatOpen(true);
                  }}
                  className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-card hover:shadow-hover flex items-center space-x-2 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-brand-300" />
                  <span>{t('hero.launchAssistant')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const catalogEl = document.getElementById('catalog-section');
                    catalogEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-2xs hover:shadow-soft active:scale-95 transition-all"
                >
                  {t('hero.exploreCatalog')}
                </button>
              </div>

              {/* Natural Language Prompt Search Box */}
              <div className="max-w-2xl mx-auto pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setIsChatOpen(true);
                    }
                  }}
                  className="p-2 rounded-full bg-white border border-slate-200/90 shadow-card flex items-center gap-2 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all"
                >
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hero.searchPlaceholder', { sample: languageNames[language]?.sample || 'running shoes under 3000' })}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1.5 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                    <span>{t('hero.askAIBtn')}</span>
                  </button>
                </form>

                {/* Quick Romanized Suggestions */}
                <div className="mt-3 flex flex-wrap justify-center items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="font-semibold text-slate-400">{t('hero.tryRomanized')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('nanage running shoes beku under 3000');
                      setIsChatOpen(true);
                    }}
                    className="hover:text-brand-600 hover:border-brand-300 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition-colors font-semibold"
                  >
                    nanage running shoes beku under 3000 (KN)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('mujhe lightweight laptop chahiye under 50000');
                      setIsChatOpen(true);
                    }}
                    className="hover:text-brand-600 hover:border-brand-300 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition-colors font-semibold"
                  >
                    mujhe lightweight laptop chahiye under 50000 (HI)
                  </button>
                </div>
              </div>

              {/* Product / Dashboard Visual Showcase Card */}
              <div className="pt-8 max-w-5xl mx-auto">
                <div className="p-3 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-card overflow-hidden">
                  <div className="rounded-2xl bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80 border border-slate-200/70 p-6 sm:p-8 space-y-6 text-left">
                    {/* Simulated App Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-400" />
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500">{t('hero.gatewayTitle')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t('hero.testModeBadge')}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                          {t('hero.hmacBadge')}
                        </span>
                      </div>
                    </div>

                    {/* Simulated Agent + Commerce Preview Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Live Conversation Stream */}
                      <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> {t('hero.multilingualStream')}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{t('hero.responseSpeed')}</span>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t('hero.buyerSampleBadge')}</span>
                            &ldquo;{t('hero.buyerSampleText')}&rdquo;
                          </div>
                          <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/70 text-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold text-brand-700 block">{t('hero.copilotBadge')}</span>
                            <p className="font-medium">
                              {t('hero.copilotSampleText')}
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              <span className="font-bold text-slate-900">₹2,999 • {t('hero.verifiedStock')}</span>
                              <span className="text-slate-500 font-medium">{t('hero.stockCount', { count: 12 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deterministic Guardrail Card */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> {t('hero.guardrailPipeline')}
                          </span>
                          <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500">{t('hero.maxDiscountLabel')}</span>
                              <strong className="text-slate-900 font-mono">{t('hero.maxDiscountValue')}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500">{t('hero.stockDecrementLabel')}</span>
                              <strong className="text-emerald-700 font-mono">{t('hero.stockDecrementValue')}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500">{t('hero.auditTrailLabel')}</span>
                              <strong className="text-brand-600 font-mono">{t('hero.auditTrailValue')}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              if (!user) {
                                setIsAuthOpen(true);
                              } else if (user.role === 'customer') {
                                alert('Merchant Hub is restricted to merchant accounts. You are currently logged in as a customer.');
                              } else {
                                setActiveTab('merchant');
                              }
                            }}
                            className="w-full py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                          >
                            {user?.role === 'customer' ? t('hero.merchantOnlyHub') : t('hero.openMerchantHub')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRUST & METRICS STRIP */}
            <section className="py-6 border-y border-slate-200/80 bg-white/70 backdrop-blur-xs rounded-3xl px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('trust.metric1Value')}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{t('trust.metric1Label')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-tight">{t('trust.metric2Value')}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{t('trust.metric2Label')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight">{t('trust.metric3Value')}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{t('trust.metric3Label')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('trust.metric4Value')}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{t('trust.metric4Label')}</div>
                </div>
              </div>
            </section>

            {/* FEATURES SECTION (GRID) */}
            <section className="space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{t('trust.whyTitle')}</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {t('trust.whySubtitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {t('hero.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{t('trust.card1Title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t('trust.card1Desc')}
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shadow-2xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{t('trust.card2Title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t('trust.card2Desc')}
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{t('trust.card3Title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t('trust.card3Desc')}
                  </p>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS (4-STEP FLOW) */}
            <section className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">SellPilot Flow</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  The Complete Verified Transaction Flow
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Natural Inquiry</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Buyer requests recommendations in any Indian language with budget limits.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Server Verification</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Backend validates active inventory, applies approved campaign discounts, and calculates totals.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Razorpay Signature</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Payment is completed via Razorpay test mode and verified with server-side HMAC-SHA256.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Atomic Stock Sync</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Inventory is atomically decremented upon payment confirmation and restocked on cancellation.
                  </p>
                </div>
              </div>
            </section>

            {/* COMMERCE CATALOG SECTION */}
            <section id="catalog-section" className="space-y-8 pt-4">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{t('catalog.title')}</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t('catalog.subtitle')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {t('trust.card4Desc')}
                  </p>
                </div>

                {/* Price Range Slider */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-xs text-slate-600 font-bold whitespace-nowrap">
                    {t('catalog.maxPriceLabel')}: <strong className="text-slate-900 font-black">₹{maxPriceFilter.toLocaleString('en-IN')}</strong>
                  </span>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    className="w-28 sm:w-36 accent-brand-600 cursor-pointer"
                  />
                  <button
                    onClick={fetchProducts}
                    className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-2xs"
                    title="Refresh Catalog"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-12">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-80 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 shadow-soft">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">{t('catalog.noProducts')}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                    {t('catalog.resetFilters')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            </section>

            {/* PRICING TIERS SECTION */}
            <section className="space-y-10 py-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Transparent Tiers</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Scale Your E-Commerce Store with AI
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Choose the plan designed for your transaction volume and store size.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Starter */}
                <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
                    <div className="text-3xl font-black text-slate-900">₹0 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                    <p className="text-xs text-slate-500 font-medium">Perfect for small stores starting out with conversational AI.</p>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Up to 100 AI Inquiries / mo</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 4 Indian Languages</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Razorpay Test Checkout</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Basic Guardrails (25% max)</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                  >
                    Get Started Free
                  </button>
                </div>

                {/* Growth Plan (Highlighted) */}
                <div className="p-8 rounded-3xl bg-white border-2 border-brand-500 shadow-card flex flex-col justify-between space-y-6 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] uppercase font-extrabold px-3.5 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </span>
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Growth Merchant</span>
                    <div className="text-3xl font-black text-slate-900">₹1,999 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                    <p className="text-xs text-slate-500 font-medium">For scaling e-commerce brands needing automated promotions.</p>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Unlimited Multilingual AI</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Autonomous Cross-Sell & Upsell</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Campaign Approval Workflows</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Zero Double-Deduction Engine</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Full Immutable Audit Logs</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    Start 14-Day Free Trial
                  </button>
                </div>

                {/* Enterprise */}
                <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</span>
                    <div className="text-3xl font-black text-slate-900">Custom</div>
                    <p className="text-xs text-slate-500 font-medium">Custom multi-tenant infrastructure with dedicated compliance SLA.</p>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Dedicated Vector Search Index</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Custom Guardrail Rules</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> ERP & Warehouse Sync</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 24/7 Dedicated Support</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setChatInitialMode('merchant');
                      setIsChatOpen(true);
                    }}
                    className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                  >
                    Talk to Sales
                  </button>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS / SOCIAL PROOF */}
            <section className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{t('testimonials.tag')}</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t('testimonials.title')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic font-medium">
                    &ldquo;{t('testimonials.quote1')}&rdquo;
                  </p>
                  <div>
                    <strong className="text-xs text-slate-900 block font-bold">{t('testimonials.author1Name')}</strong>
                    <span className="text-[10px] text-slate-500 font-medium">{t('testimonials.author1Role')}</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic font-medium">
                    &ldquo;{t('testimonials.quote2')}&rdquo;
                  </p>
                  <div>
                    <strong className="text-xs text-slate-900 block font-bold">{t('testimonials.author2Name')}</strong>
                    <span className="text-[10px] text-slate-500 font-medium">{t('testimonials.author2Role')}</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic font-medium">
                    &ldquo;{t('testimonials.quote3')}&rdquo;
                  </p>
                  <div>
                    <strong className="text-xs text-slate-900 block font-bold">{t('testimonials.author3Name')}</strong>
                    <span className="text-[10px] text-slate-500 font-medium">{t('testimonials.author3Role')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ ACCORDION SECTION */}
            <section className="space-y-8 max-w-3xl mx-auto">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{t('faqs.tag')}</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t('faqs.title')}
                </h2>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-5 text-left flex justify-between items-center text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: Merchant Hub */}
        {activeTab === 'merchant' && (
          <MerchantDashboard onBackToDiscovery={() => setActiveTab('discovery')} />
        )}

        {/* VIEW: Customer Orders */}
        {activeTab === 'orders' && <CustomerOrders />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-8 mt-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <span className="font-bold text-slate-900">SellPilot AI</span>
              <span>—</span>
              <span>{t('footer.track')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t('footer.bounded')}
              </span>
              <span className="text-slate-400 font-mono">{t('footer.testMode')}</span>
            </div>
          </div>
          <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100 font-medium">
            © {new Date().getFullYear()} SellPilot AI. Built with Manrope typography & bounded agentic commerce.
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
        correlationId={commerceCorrelationId}
      />
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMode={chatInitialMode}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onCorrelationId={setCommerceCorrelationId}
      />
    </div>
  );
}
