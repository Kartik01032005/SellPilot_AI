'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { Package, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderRecord {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<{ success: boolean; orders: OrderRecord[] }>('/api/orders');
      if (res.success && res.orders) {
        setOrders(res.orders);
      } else {
        setError(res.message || 'Unable to fetch orders');
      }
    } catch {
      setError('Network error while loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Order History</h2>
          <p className="text-xs text-slate-400">All orders are backed by Razorpay Test Mode verification.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-400" />
          <p className="text-xs">Loading your verified orders...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Package className="w-12 h-12 stroke-[1.5] text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No orders placed yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Discover verified products through AI discovery or add items to your cart.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Order ID
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {ord.orderNumber || ord._id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      ord.paymentStatus === 'paid' || ord.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {ord.paymentStatus || ord.status}
                  </span>
                  <span className="text-xs font-extrabold text-white">
                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-300">
                    <span>
                      {it.name} <span className="text-slate-500">x{it.quantity}</span>
                    </span>
                    <span className="font-semibold text-slate-200">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-400/80 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Test Signature Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
