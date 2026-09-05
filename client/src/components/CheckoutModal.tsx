'use client';

import React, { useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';
import {
  X,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: { ondismiss?: () => void };
    }) => {
      open: () => void;
      on?: (event: 'payment.failed', handler: (response: {
        error?: { description?: string; reason?: string };
      }) => void) => void;
    };
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
  correlationId?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  correlationId,
}) => {
  const { items, preparedCheckout, clearCart } = useCart();
  const { t } = useLanguage();

  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'failed'>('confirm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const idempotencyFingerprintRef = useRef<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = preparedCheckout?.total ?? 0;

  const handleConfirmAndPay = async () => {
    setErrorMessage(null);
    setStep('processing');

    try {
      if (!preparedCheckout) {
        throw new Error('Unable to confirm the server-authoritative total. Refresh the cart and try again.');
      }

      const idempotencyFingerprint = JSON.stringify(items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })));

      if (!idempotencyKeyRef.current || idempotencyFingerprintRef.current !== idempotencyFingerprint) {
        idempotencyKeyRef.current = globalThis.crypto?.randomUUID?.() || `checkout_${Date.now()}_${Math.random()}`;
        idempotencyFingerprintRef.current = idempotencyFingerprint;
      }

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
        idempotencyKey: idempotencyKeyRef.current,
        correlationId,
        idempotencyFingerprint,
      };

      const orderRes = await ApiClient.request<{
        success: boolean;
        order: {
          _id: string;
          orderNumber: string;
          totalAmount: number;
          status: string;
          correlationId?: string;
        };
        code?: string;
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.success || !orderRes.order) {
        setStep('failed');
        setErrorMessage(orderRes.message || 'Failed to create order on server');
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
        testMode: boolean;
      }>('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: backendOrder._id }),
      });

      if (!paymentOrderRes.success) {
        setStep('failed');
        setErrorMessage(paymentOrderRes.message || 'Payment initialization failed');
        return;
      }

      if (!paymentOrderRes.testMode || !paymentOrderRes.keyId.startsWith('rzp_test_') || !window.Razorpay) {
        throw new Error('Razorpay Test Mode checkout is unavailable. Configure a server-side test key.');
      }

      const verifyPayment = async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await ApiClient.request<{
          success: boolean;
          status: string;
          orderId: string;
          verified: boolean;
        }>('/api/payment/verify', {
          method: 'POST',
          body: JSON.stringify({
            orderId: backendOrder._id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            correlationId,
          }),
        });

        if (verifyRes.success && verifyRes.verified) {
          setCompletedOrder({ ...backendOrder, status: 'paid' });
          clearCart();
          setStep('success');
          onOrderSuccess(backendOrder._id);
        } else {
          setStep('failed');
          setErrorMessage(verifyRes.message || 'Payment verification failed');
        }
      };

      const cancelPayment = () => {
        void ApiClient.request('/api/payment/cancel', {
          method: 'POST',
          body: JSON.stringify({
            orderId: backendOrder._id,
            reason: 'Checkout modal dismissed before payment completion',
            correlationId,
          }),
        });
      };

      const recordPaymentFailure = (reason?: string) => {
        void ApiClient.request('/api/payment/failure', {
          method: 'POST',
          body: JSON.stringify({
            orderId: backendOrder._id,
            reason: reason || 'Payment failed during checkout',
            correlationId,
          }),
        });
      };

      let paymentFailureReported = false;
      let paymentCallbackReceived = false;

      const razorpay = new window.Razorpay({
        key: paymentOrderRes.keyId,
        amount: Math.round(paymentOrderRes.amount * 100),
        currency: paymentOrderRes.currency,
        name: 'SellPilot AI',
        description: 'Demo Payment - Razorpay Test Mode',
        order_id: paymentOrderRes.razorpayOrderId,
        handler: (response) => {
          paymentCallbackReceived = true;
          void verifyPayment(response).catch((err) => {
            setStep('failed');
            setErrorMessage(err instanceof Error ? err.message : 'Payment verification failed');
          });
        },
        modal: {
          ondismiss: () => {
            if (paymentCallbackReceived) return;
            if (!paymentFailureReported) cancelPayment();
            setStep('failed');
            setErrorMessage(paymentFailureReported
              ? 'Payment failed. No order was marked as paid.'
              : 'Payment cancelled. No order was marked as paid.');
          },
        },
      });
      razorpay.on?.('payment.failed', (response) => {
        paymentFailureReported = true;
        recordPaymentFailure(response.error?.description || response.error?.reason);
        setStep('failed');
        setErrorMessage(response.error?.description || 'Payment failed. No order was marked as paid.');
      });
      razorpay.open();
    } catch (err) {
      setStep('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Checkout encountered an error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('checkout.title')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t('checkout.razorpayDesc')}</p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('checkout.orderSummary')}
              </h3>
              <div className="max-h-44 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                {items.map((it) => (
                  <div key={it.productId} className="flex justify-between text-xs text-slate-700 font-medium">
                    <span className="truncate max-w-[240px]">
                      {it.name} <span className="text-slate-400 font-normal">x{it.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-slate-800">₹{(preparedCheckout?.subtotal ?? totalAmount).toLocaleString('en-IN')}</span>
              </div>
              {preparedCheckout && preparedCheckout.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>{t('cart.discount')}</span>
                  <span>-₹{preparedCheckout.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>{t('cart.total')}</span>
                <span className="text-base text-brand-600 font-black">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Confirmation Alert Gate */}
            <div className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-200/60 flex items-start space-x-2.5 text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>
                {t('cart.total')}: <strong className="text-slate-900 font-bold">₹{totalAmount.toLocaleString('en-IN')}</strong>. 
                {t('checkout.razorpayOption')}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPay}
                className="flex-1 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow-md flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              >
                <span>{t('checkout.payBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-brand-600 animate-spin" />
            <h3 className="text-base font-bold text-slate-900">{t('checkout.processing')}</h3>
            <p className="text-xs text-slate-500 max-w-xs font-medium">
              {t('checkout.razorpayDesc')}
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('checkout.successTitle')}</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              {t('checkout.successDesc')}
            </p>
            {completedOrder && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                {t('orders.orderNumber')}: <strong className="text-slate-900 font-mono">{completedOrder.orderNumber || completedOrder.id}</strong>
                {completedOrder.correlationId && (
                  <span className="block mt-1 text-slate-500">Trace ID: <strong className="font-mono text-slate-700">{completedOrder.correlationId}</strong></span>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              {t('checkout.viewOrdersBtn')}
            </button>
          </div>
        )}

        {/* Step: Failed */}
        {step === 'failed' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t('checkout.failureTitle')}</h3>
            <p className="text-xs text-rose-600 max-w-xs mx-auto font-medium">
              {errorMessage || t('checkout.failureDesc')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                {t('checkout.closeBtn')}
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                {t('checkout.tryAgainBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
