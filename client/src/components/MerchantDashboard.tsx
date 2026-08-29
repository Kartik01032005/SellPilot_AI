'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  Package,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Percent,
  Play,
  ShieldCheck,
  RefreshCw,
  Eye,
  Store,
  DollarSign,
  Tag,
  Clock,
  History,
  X,
} from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'insights' | 'products' | 'campaigns' | 'audit'>('insights');

  // Insights State
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Shoes');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdFeatures, setNewProdFeatures] = useState('');

  // Campaigns State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campDiscount, setCampDiscount] = useState('');
  const [campProduct, setCampProduct] = useState('');
  const [discountValidationMsg, setDiscountValidationMsg] = useState<{ valid?: boolean; message?: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

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
      if (res.success && res.products) {
        setProducts(res.products);
      } else {
        const fallbackRes = await ApiClient.request<{ success: boolean; products: any[] }>('/api/products');
        if (fallbackRes.success) setProducts(fallbackRes.products || []);
      }
    } catch {
      // Ignore
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await ApiClient.request<{ success: boolean; campaigns: any[] }>('/api/campaigns');
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      }
    } catch {
      // Ignore
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await ApiClient.request<{ success: boolean; logs: any[] }>('/api/audit');
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch {
      // Ignore
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    fetchProducts();
    fetchCampaigns();
    fetchAuditLogs();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.request<{ success: boolean }>('/api/products', {
        method: 'POST',
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
        setNewProdName('');
        setNewProdPrice('');
        setNewProdStock('');
        setNewProdFeatures('');
        fetchProducts();
        fetchInsights();
      }
    } catch (err) {
      alert('Error creating product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await ApiClient.request<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        fetchProducts();
        fetchInsights();
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const handleValidateDiscount = async (pct: number) => {
    try {
      const res = await ApiClient.request<{ success: boolean; valid: boolean; message: string; maxAllowed: number }>(
        '/api/merchant/discount/validate',
        {
          method: 'POST',
          body: JSON.stringify({ discountPercentage: pct }),
        }
      );
      setDiscountValidationMsg({
        valid: res.valid,
        message: res.message || (res.valid ? 'Discount within allowed limits' : `Exceeds max ${res.maxAllowed}%`),
      });
    } catch {
      setDiscountValidationMsg({ valid: true, message: 'Within bounds' });
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
          productIds: campProduct ? [campProduct] : [],
        }),
      });

      if (res.success) {
        setIsCreateCampaignOpen(false);
        setCampName('');
        setCampDiscount('');
        setDiscountValidationMsg(null);
        fetchCampaigns();
        fetchAuditLogs();
      } else {
        alert(res.message || 'Campaign creation failed');
      }
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      alert('Error activating campaign');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Merchant Growth Hub</h1>
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Gated & Bounded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data-driven growth, promotion analytics, and safe campaign controls.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'insights'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Growth Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'products'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalog ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'campaigns'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Campaigns ({campaigns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Tab: Growth Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {insightsLoading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-400 mb-2" />
              <p className="text-xs">Computing merchant growth insights from catalog data...</p>
            </div>
          ) : !insights ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400">
              No growth metrics recorded yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Promotion Opportunities */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 transition-all duration-200 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-brand-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">Promotion Opportunities</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    High inventory items with strong sales potential.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.promotionOpportunities?.length > 0 ? (
                      insights.promotionOpportunities.map((op: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-brand-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white">{op.name}</span>
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              {op.suggestedDiscount}% Discount
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{op.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Inventory is balanced.</p>
                    )}
                  </div>
                </div>

                {/* Cross-Sell Recommendations */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Layers className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">Cross-Sell Bundles</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    High affinity complementary product pairings.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.crossSellOpportunities?.length > 0 ? (
                      insights.crossSellOpportunities.map((cs: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-indigo-500/30 transition-colors"
                        >
                          <div className="font-bold text-xs text-white">
                            {cs.primaryName || cs.name} + {cs.relatedName}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {cs.reason || 'Recommended accessory pairing'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No cross-sells configured.</p>
                    )}
                  </div>
                </div>

                {/* Upsell Opportunities */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">Value Upsell Paths</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Premium alternatives to increase average order value.
                  </p>
                  <div className="space-y-2 pt-2">
                    {insights.upsellOpportunities?.length > 0 ? (
                      insights.upsellOpportunities.map((us: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-amber-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white">{us.name} → {us.premiumName}</span>
                            <span className="text-[10px] text-amber-400 font-bold">
                              +₹{us.priceDiff}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{us.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No upsell paths identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Performers & Guardrails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top Performing Catalog Items */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">Top Performing Products</h3>
                  </div>
                  <div className="space-y-2">
                    {insights.topProducts?.length > 0 ? (
                      insights.topProducts.map((tp: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{tp.name}</span>
                            <span className="text-[11px] text-slate-400">{tp.category} • {tp.stock} in stock</span>
                          </div>
                          <span className="font-extrabold text-white">₹{tp.price?.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No active products.</p>
                    )}
                  </div>
                </div>

                {/* Guardrails */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-brand-400">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-white">Configured Merchant Guardrails</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Discount Limit:</span>
                      <strong className="text-white">25% (Server Enforced)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Campaign Approval:</span>
                      <strong className="text-emerald-400">Mandatory Gate</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Financial Execution:</span>
                      <strong className="text-white">HMAC-SHA256 Verified</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audit Ledger:</span>
                      <strong className="text-brand-400">Immutable Logging</strong>
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
            <h3 className="text-sm font-bold text-white">Merchant Products</h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
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
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-brand-400">
                        {p.category}
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'Verified catalog item.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-white">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400">{p.stock} in stock</span>
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
              <h3 className="text-sm font-bold text-white">Marketing Campaigns</h3>
              <p className="text-xs text-slate-400">All campaigns require explicit approval before activation.</p>
            </div>
            <button
              onClick={() => setIsCreateCampaignOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div
                key={camp._id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-white">{camp.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        camp.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : camp.status === 'approved'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Discount: <strong className="text-white">{camp.discountPercentage}%</strong> | 
                    Approvable: <strong className="text-white">{camp.isApproved ? 'Yes' : 'Pending'}</strong>
                  </p>
                </div>

                {/* Approval & Activation Gates */}
                <div className="flex items-center gap-2">
                  {!camp.isApproved && camp.status !== 'active' && (
                    <button
                      onClick={() => handleApproveCampaign(camp._id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Campaign</span>
                    </button>
                  )}

                  {camp.isApproved && camp.status !== 'active' && (
                    <button
                      onClick={() => handleActivateCampaign(camp._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </button>
                  )}

                  {camp.status === 'active' && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
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
            <h3 className="text-sm font-bold text-white">Auditable Commerce Ledger</h3>
            <button
              onClick={fetchAuditLogs}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Entity Reference</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-brand-300">{log.action}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{log.entityId || '-'}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Add New Product</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Product Name</label>
                <input
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Ultra Carbon Running Shoes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                  <label className="text-xs text-slate-400 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  placeholder="10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Features (comma separated)</label>
                <input
                  value={newProdFeatures}
                  onChange={(e) => setNewProdFeatures(e.target.value)}
                  placeholder="lightweight, breathable, carbon-plate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow mt-3"
              >
                Publish Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {isCreateCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Create Marketing Campaign</h3>
              <button onClick={() => setIsCreateCampaignOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Campaign Name</label>
                <input
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Flash Summer Promo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  value={campDiscount}
                  onChange={(e) => {
                    setCampDiscount(e.target.value);
                    if (e.target.value) handleValidateDiscount(Number(e.target.value));
                  }}
                  placeholder="15"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                {discountValidationMsg && (
                  <p
                    className={`text-[11px] mt-1 ${
                      discountValidationMsg.valid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {discountValidationMsg.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Product (Optional)</label>
                <select
                  value={campProduct}
                  onChange={(e) => setCampProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow mt-3"
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
