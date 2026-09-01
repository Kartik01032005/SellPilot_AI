'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Eye,
  Ban,
  X,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

interface OrderItem {
  productId: string | { _id: string; name: string; category?: string; price?: number };
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  comment?: string;
}

interface OrderRecord {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  subtotal?: number;
  discount?: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'payment_pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'failed';
  shippingAddress?: ShippingAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
}

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState<OrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);
    setCancelError(null);

    try {
      const res = await ApiClient.request<{ success: boolean; order: OrderRecord }>(
        `/api/orders/${cancellingOrder._id}/cancel`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((ord) => (ord._id === cancellingOrder._id ? res.order : ord))
        );
        if (selectedOrder && selectedOrder._id === cancellingOrder._id) {
          setSelectedOrder(res.order);
        }
        setCancellingOrder(null);
      } else {
        setCancelError(res.message || 'Failed to cancel order');
      }
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error cancelling order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid & Verified
          </span>
        );
      case 'processing':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <Ban className="w-3.5 h-3.5 text-rose-600" /> Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Payment Failed
          </span>
        );
      case 'payment_pending':
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Payment Pending
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Created
          </span>
        );
    }
  };

  const isCancellable = (status: string) => {
    return ['pending', 'payment_pending', 'paid', 'processing'].includes(status);
  };

  const filteredOrders = orders.filter((ord) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return ord.status === 'paid' || ord.status === 'processing' || ord.status === 'completed';
    if (filterStatus === 'pending') return ord.status === 'pending' || ord.status === 'payment_pending';
    if (filterStatus === 'cancelled') return ord.status === 'cancelled' || ord.status === 'failed';
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Order History</h2>
          <p className="text-xs text-slate-500 font-medium">Production-grade lifecycle management with verified Razorpay payment receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Filter Chips */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            {['all', 'paid', 'pending', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3.5 py-1 rounded-full capitalize font-bold transition-all ${
                  filterStatus === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Order List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200 shadow-soft">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600" />
          <p className="text-xs font-bold">Loading verified orders...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-xs text-rose-700 font-bold">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-soft">
          <Package className="w-12 h-12 stroke-[1.5] text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No orders matching this filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            Discover verified products through AI discovery or add items to your cart.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord._id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 transition-all space-y-4 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Order Reference
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {ord.orderNumber || ord._id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(ord.status)}
                  <span className="text-base font-black text-slate-900">
                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      <span className="font-bold text-slate-900">
                        {typeof it.productId === 'object' && it.productId ? it.productId.name || it.name : it.name}
                      </span>
                      <span className="text-slate-400 font-mono">x{it.quantity}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {ord.status === 'paid' && (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="px-4 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>

                  {isCancellable(ord.status) && (
                    <button
                      onClick={() => setCancellingOrder(ord)}
                      className="px-4 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order Details</h3>
                  <p className="text-xs font-mono text-slate-500 font-medium">{selectedOrder.orderNumber || selectedOrder._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
              {/* Status Header Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Amount</span>
                  <span className="text-base font-black text-slate-900">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-brand-600" /> Items in Order
                </h4>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-slate-900">
                          {typeof it.productId === 'object' && it.productId ? it.productId.name || it.name : it.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">₹{it.price.toLocaleString('en-IN')} each × {it.quantity}</p>
                      </div>
                      <span className="font-black text-slate-900">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{(selectedOrder.subtotal ?? selectedOrder.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discount && selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Campaign Discount</span>
                    <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Final Total</span>
                  <span className="text-brand-600 font-black text-sm">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Shipping & Payment Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" /> Shipping Destination
                  </h5>
                  <p className="text-slate-500 text-[11px] font-medium">
                    {selectedOrder.shippingAddress?.street || '123 Tech Street'}<br />
                    {selectedOrder.shippingAddress?.city || 'Bengaluru'}, {selectedOrder.shippingAddress?.state || 'Karnataka'} {selectedOrder.shippingAddress?.postalCode || '560001'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <CreditCard className="w-3.5 h-3.5 text-brand-600" /> Payment & Security
                  </h5>
                  <p className="text-slate-500 text-[11px] font-medium">
                    Mode: Razorpay Test Mode<br />
                    {selectedOrder.razorpayPaymentId ? (
                      <span className="font-mono text-[10px] text-emerald-700 font-bold">ID: {selectedOrder.razorpayPaymentId}</span>
                    ) : (
                      <span className="text-slate-400">Signature pending</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Timeline History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-brand-600" /> Lifecycle History
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    {selectedOrder.statusHistory.map((hist, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[11px] pb-1.5 border-b border-slate-200 last:border-0 last:pb-0 font-medium">
                        <div>
                          <span className="capitalize font-bold text-slate-800">{hist.status}</span>
                          {hist.comment && <p className="text-slate-400 text-[10px]">{hist.comment}</p>}
                        </div>
                        <span className="text-slate-400 font-mono">{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              {isCancellable(selectedOrder.status) && (
                <button
                  onClick={() => {
                    setCancellingOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                >
                  Cancel This Order
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="ml-auto px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Order</h3>
                <p className="text-xs font-mono text-slate-500 font-medium">{cancellingOrder.orderNumber || cancellingOrder._id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="text-slate-700 font-medium">
                Are you sure you want to cancel this order?
              </p>
              {(cancellingOrder.status === 'paid' || cancellingOrder.status === 'processing') && (
                <p className="text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  All purchased product stock will be automatically restocked into the store catalog.
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found alternative product">Found alternative product</option>
                <option value="Delivery time too long">Delivery time too long</option>
              </select>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
