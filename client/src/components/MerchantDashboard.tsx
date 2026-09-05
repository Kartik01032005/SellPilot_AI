'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  TrendingUp,
  Package,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Layers,
  Percent,
  Play,
  ShieldCheck,
  RefreshCw,
  History,
  X,
  ShieldAlert,
} from 'lucide-react';

const getId = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const candidate = value as { _id?: unknown; $oid?: unknown };
    return getId(candidate._id ?? candidate.$oid);
  }
  return undefined;
};

interface MerchantDashboardProps {
  onBackToDiscovery?: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onBackToDiscovery }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'insights' | 'products' | 'campaigns' | 'audit'>('insights');

  // Insights State
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Shoes');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdFeatures, setNewProdFeatures] = useState('');

  // Campaigns State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campDiscount, setCampDiscount] = useState('');
  const [campProduct, setCampProduct] = useState('');
  const [discountValidationMsg, setDiscountValidationMsg] = useState<{ valid?: boolean; message?: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await ApiClient.request<{ success: boolean; insights: any }>('/api/merchant/insights');
      if (res.success && res.insights) {
        setInsights(res.insights);
      }
    } catch {
      // Ignore
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await ApiClient.request<{ success: boolean; products: any[] }>('/api/merchant/products');
      if (res.success && Array.isArray(res.products)) {
        setProducts(res.products);
      } else {
        const merchantId = getId(user?.merchantId);
        const fallbackRes = await ApiClient.request<{ success: boolean; products: any[] }>(
          merchantId ? `/api/products?merchantId=${merchantId}` : '/api/products'
        );
        if (fallbackRes.success && Array.isArray(fallbackRes.products)) {
          const merchantProducts = merchantId
            ? fallbackRes.products.filter((product) => getId(product.merchantId) === merchantId)
            : fallbackRes.products;
          setProducts(merchantProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await ApiClient.request<{ success: boolean; campaigns: any[] }>('/api/campaigns');
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      }
    } catch {
      // Ignore
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await ApiClient.request<{ success: boolean; logs: any[] }>('/api/audit');
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user?.role === 'customer') return;
    fetchInsights();
    fetchProducts();
    fetchCampaigns();
    fetchAuditLogs();
  }, [user?.id, getId(user?.merchantId), user?.role]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = Boolean(editingProduct?._id);
    try {
      const endpoint = isEditing ? `/api/products/${editingProduct?._id}` : '/api/products';
      const res = await ApiClient.request<{ success: boolean }>(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: newProdName,
          category: newProdCategory,
          price: Number(newProdPrice),
          stock: Number(newProdStock),
          features: newProdFeatures.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (res.success) {
        setIsAddProductOpen(false);
        setEditingProduct(null);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdStock('');
        setNewProdFeatures('');
        fetchProducts();
        fetchInsights();
      } else {
        alert('Failed to save product');
      }
    } catch {
      alert('Error saving product');
    }
  };

  const handleEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setNewProdName(prod.name);
    setNewProdCategory(prod.category);
    setNewProdPrice(prod.price.toString());
    setNewProdStock(prod.stock.toString());
    setNewProdFeatures(prod.features?.join(', ') || '');
    setIsAddProductOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await ApiClient.request<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        fetchProducts();
        fetchInsights();
      }
    } catch {
      alert('Error deleting product');
    }
  };

  const handleValidateDiscount = async (pct: number) => {
    try {
      const res = await ApiClient.request<{ success: boolean; allowed: boolean; message: string; maxAllowed: number }>(
        '/api/merchant/discount/validate',
        {
          method: 'POST',
          body: JSON.stringify({ discountPercentage: pct }),
        }
      );
      setDiscountValidationMsg({
        valid: res.allowed,
        message: res.message || (res.allowed ? 'Discount within allowed limits' : `Exceeds max ${res.maxAllowed}%`),
      });
    } catch {
      setDiscountValidationMsg({ valid: false, message: 'Unable to validate discount with the server' });
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.request<{ success: boolean; message?: string }>('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: campName,
          discountPercentage: Number(campDiscount),
          applicableProducts: campProduct ? [campProduct] : [],
        }),
      });

      if (res.success) {
        setIsCreateCampaignOpen(false);
        setCampName('');
        setCampDiscount('');
        setCampProduct('');
        setDiscountValidationMsg(null);
        fetchCampaigns();
        fetchAuditLogs();
      } else {
        alert(res.message || 'Campaign creation rejected by guardrails');
      }
    } catch {
      alert('Error creating campaign');
    }
  };

  const handleApproveCampaign = async (id: string) => {
    try {
      const res = await ApiClient.request<{ success: boolean }>(`/api/campaigns/${id}/approve`, {
        method: 'POST',
      });
      if (res.success) {
        fetchCampaigns();
        fetchAuditLogs();
      }
    } catch {
      alert('Error approving campaign');
    }
  };

  const handleActivateCampaign = async (id: string) => {
    try {
      const res = await ApiClient.request<{ success: boolean; message?: string }>(
        `/api/campaigns/${id}/activate`,
        { method: 'POST' }
      );
      if (res.success) {
        fetchCampaigns();
        fetchAuditLogs();
      } else {
        alert(res.message || 'Activation failed');
      }
    } catch {
      alert('Error activating campaign');
    }
  };

  if (user?.role === 'customer') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-100 rounded-3xl shadow-card text-center space-y-5 animate-fade-in font-sans">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900">{t('merchant.accessRestrictedTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            {t('merchant.accessRestrictedDesc', { email: user.email })}
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => (onBackToDiscovery ? onBackToDiscovery() : window.location.reload())}
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {t('merchant.returnToDiscoveryBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('merchant.title')}</h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
              {t('merchant.gatedBadge')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t('merchant.subtitle')}
          </p>
        </div>

        {/* Sub Navigation (Pill Style) */}
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'insights'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            <span>{t('merchant.tabInsights')}</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-brand-600" />
            <span>{t('merchant.tabProducts', { count: products.length })}</span>
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'campaigns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-brand-600" />
            <span>{t('merchant.tabCampaigns', { count: campaigns.length })}</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-brand-600" />
            <span>{t('merchant.tabAudit')}</span>
          </button>
        </div>
      </div>

      {/* Tab: Growth Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {insightsLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-soft">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-2" />
              <p className="text-xs font-bold">Computing merchant growth insights from live catalog data...</p>
            </div>
          ) : !insights ? (
            <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 shadow-soft">
              No growth metrics recorded yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Promotion Opportunities */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 transition-all duration-200 space-y-3 shadow-soft">
                  <div className="flex items-center space-x-2 text-brand-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-900">Promotion Opportunities</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    High inventory items with strong sales velocity potential.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.promotionOpportunities?.length > 0 ? (
                      insights.promotionOpportunities.map((op: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 hover:border-brand-200 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-900">{op.name}</span>
                            <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                              {op.suggestedDiscount}% Discount
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug font-medium">{op.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Inventory is balanced.</p>
                    )}
                  </div>
                </div>

                {/* Cross-Sell Recommendations */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 transition-all duration-200 space-y-3 shadow-soft">
                  <div className="flex items-center space-x-2 text-indigo-600 font-bold">
                    <Layers className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-900">Cross-Sell Bundles</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    High affinity complementary product pairings.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.crossSellOpportunities?.length > 0 ? (
                      insights.crossSellOpportunities.map((cs: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-bold text-xs text-slate-900">
                            {cs.primaryName || cs.name} + {cs.relatedName}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug font-medium">
                            {cs.reason || 'Recommended accessory pairing'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No cross-sells configured.</p>
                    )}
                  </div>
                </div>

                {/* Upsell Opportunities */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-amber-300 transition-all duration-200 space-y-3 shadow-soft">
                  <div className="flex items-center space-x-2 text-amber-600 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-900">Value Upsell Paths</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Premium alternatives to increase average order value.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.upsellOpportunities?.length > 0 ? (
                      insights.upsellOpportunities.map((us: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 hover:border-amber-200 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-900">{us.name} → {us.premiumName}</span>
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              +₹{us.priceDiff}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug font-medium">{us.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No upsell paths identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Performers & Guardrails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top Performing Catalog Items */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-soft">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-900">Top Performing Products</h3>
                  </div>
                  <div className="space-y-2">
                    {insights.topProducts?.length > 0 ? (
                      insights.topProducts.map((tp: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{tp.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{tp.category} • {tp.stock} in stock</span>
                          </div>
                          <span className="font-black text-slate-900">₹{tp.price?.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No active products.</p>
                    )}
                  </div>
                </div>

                {/* Guardrails */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-soft">
                  <div className="flex items-center space-x-2 text-brand-600 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-900">Configured Merchant Guardrails</h3>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Max Discount Limit:</span>
                      <strong className="text-slate-900 font-bold">25% (Server Enforced)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Campaign Approval:</span>
                      <strong className="text-emerald-700 font-bold">Mandatory Gate</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Financial Execution:</span>
                      <strong className="text-slate-900 font-bold">HMAC-SHA256 Verified</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Audit Ledger:</span>
                      <strong className="text-brand-600 font-bold">Immutable Logging</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Merchant Products</h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-brand-300" />
              <span>Add Product</span>
            </button>
          </div>

          {productsLoading ? (
            <div className="p-12 text-center text-slate-400">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-hover transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                        {p.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="text-slate-400 hover:text-brand-600 p-1 transition-colors"
                          title="Edit product"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const productId = getId(p._id) || (typeof p.id === 'string' ? p.id : (typeof p._id === 'string' ? p._id : ''));
                            if (productId) handleDeleteProduct(productId);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                      {p.description || 'Verified catalog item.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-black text-slate-900">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-500 font-medium">{p.stock} in stock</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Marketing Campaigns</h3>
              <p className="text-xs text-slate-500 font-medium">All campaigns require explicit approval before activation.</p>
            </div>
            <button
              onClick={() => setIsCreateCampaignOpen(true)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-brand-300" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div
                key={camp._id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{camp.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        camp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : camp.status === 'approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Discount: <strong className="text-slate-900 font-bold">{camp.discountPercentage}%</strong> | 
                    Approval Status: <strong className="text-slate-900 font-bold">{camp.status === 'approved' || camp.status === 'active' ? 'Approved' : 'Pending'}</strong>
                  </p>
                </div>

                {/* Approval & Activation Gates */}
                <div className="flex items-center gap-2">
                  {camp.status === 'pending_approval' && (
                    <button
                      onClick={() => handleApproveCampaign(camp._id)}
                      className="px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Campaign</span>
                    </button>
                  )}

                  {camp.status === 'approved' && (
                    <button
                      onClick={() => handleActivateCampaign(camp._id)}
                      className="px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </button>
                  )}

                  {camp.status === 'active' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Live & Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">AI-Assisted Commerce Audit Ledger</h3>
            <button
              onClick={fetchAuditLogs}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-soft">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Entity Reference</th>
                  <th className="p-3.5">Correlation ID</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{log.action}</td>
                    <td className="p-3.5 text-slate-600">{log.actorType || 'system'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{log.entityId || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-500">{log.correlationId || '-'}</td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button
                onClick={() => {
                  setIsAddProductOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Product Name</label>
                <input
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Ultra Carbon Running Shoes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="Shoes">Shoes</option>
                    <option value="Laptops">Laptops</option>
                    <option value="Phones">Phones</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  placeholder="10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Features (comma separated)</label>
                <input
                  value={newProdFeatures}
                  onChange={(e) => setNewProdFeatures(e.target.value)}
                  placeholder="lightweight, breathable, carbon-plate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm mt-3 active:scale-95 transition-all"
              >
                {editingProduct ? 'Save Changes' : 'Publish Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {isCreateCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">Create Marketing Campaign</h3>
              <button onClick={() => setIsCreateCampaignOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Name</label>
                <input
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Flash Summer Promo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  value={campDiscount}
                  onChange={(e) => {
                    setCampDiscount(e.target.value);
                    if (e.target.value) handleValidateDiscount(Number(e.target.value));
                  }}
                  placeholder="15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                />
                {discountValidationMsg && (
                  <p
                    className={`text-[11px] mt-1 font-bold ${
                      discountValidationMsg.valid ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {discountValidationMsg.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Product (Optional)</label>
                <select
                  value={campProduct}
                  onChange={(e) => setCampProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="">All Products</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm mt-3 active:scale-95 transition-all"
              >
                Submit for Approval
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
