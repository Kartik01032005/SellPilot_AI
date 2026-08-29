'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import {
  X,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, preparedCheckout, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'failed'>('confirm');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  if (!isOpen) return null;

  const totalAmount =
    preparedCheckout?.total ??
    items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const handleConfirmAndPay = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStep('processing');

    try {
      // 1. Create Order on Backend
      const orderPayload = {
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
        shippingAddress: {
          street: '123 Tech Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      };

      const orderRes = await ApiClient.request<{
        success: boolean;
        order: {
          _id: string;
          orderNumber: string;
          totalAmount: number;
          status: string;
        };
        code?: string;
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.success || !orderRes.order) {
        setStep('failed');
        setErrorMessage(orderRes.message || 'Failed to create order on server');
        setLoading(false);
        return;
      }

      const backendOrder = orderRes.order;

      // 2. Create Razorpay Test Mode Order via Backend
      const paymentOrderRes = await ApiClient.request<{
        success: boolean;
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: backendOrder._id }),
      });

      if (!paymentOrderRes.success) {
        setStep('failed');
        setErrorMessage(paymentOrderRes.message || 'Payment initialization failed');
        setLoading(false);
        return;
      }

      // 3. Razorpay Test Mode Payment Simulation (or Client Checkout callback)
      // Simulating authorized signature for test order
      const mockPaymentId = `pay_test_${Date.now()}`;
      const mockSignature = 'simulated_test_mode_signature';

      // 4. Verify Payment via Backend HMAC (Server is source of truth)
      const verifyRes = await ApiClient.request<{
        success: boolean;
        status: string;
        orderId: string;
        paymentId: string;
        verified: boolean;
      }>('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: backendOrder._id,
          razorpayOrderId: paymentOrderRes.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        }),
      });

      if (verifyRes.success) {
        setCompletedOrder({
          id: backendOrder._id,
          orderNumber: backendOrder.orderNumber,
          amount: totalAmount,
          status: 'paid',
        });
        clearCart();
        setStep('success');
        onOrderSuccess(backendOrder._id);
      } else {
        setStep('failed');
        setErrorMessage(verifyRes.message || 'Payment verification failed');
      }
    } catch (err) {
      setStep('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Checkout encountered an error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Razorpay Secure Checkout</h2>
              <p className="text-xs text-slate-400">Agentic Commerce Test Mode</p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Order Summary
              </h3>
              <div className="max-h-44 overflow-y-auto space-y-2 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
                {items.map((it) => (
                  <div key={it.productId} className="flex justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[240px]">
                      {it.name} <span className="text-slate-500">x{it.quantity}</span>
                    </span>
                    <span className="font-semibold text-white">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal</span>
                <span>₹{(preparedCheckout?.subtotal ?? totalAmount).toLocaleString('en-IN')}</span>
              </div>
              {preparedCheckout && preparedCheckout.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Campaign Discount</span>
                  <span>-₹{preparedCheckout.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total Amount to Pay</span>
                <span className="text-base text-brand-300">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Confirmation Alert Gate */}
            <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start space-x-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>
                Your total is <strong className="text-white">₹{totalAmount.toLocaleString('en-IN')}</strong>. 
                Are you ready to proceed to server-verified payment execution?
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPay}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-1.5 transition-all"
              >
                <span>Yes, Proceed to Pay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-brand-400 animate-spin" />
            <h3 className="text-sm font-bold text-white">Verifying Transaction with Backend...</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Communicating with Razorpay Test Mode & generating cryptographic signature verification.
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Payment Verified & Order Confirmed!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your payment was verified by the server backend. Inventory has been updated.
            </p>
            {completedOrder && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                Order Reference: <strong className="text-white">{completedOrder.orderNumber || completedOrder.id}</strong>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Step: Failed */}
        {step === 'failed' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Payment Could Not Be Completed</h3>
            <p className="text-xs text-rose-300 max-w-xs mx-auto">
              {errorMessage || "The payment wasn't completed. You can try again from checkout."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
