'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Lock, Mail, Store, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Email is required');
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setError('Password is required');
          setLoading(false);
          return;
        }

        const res = await register(
          name.trim(),
          email.trim(),
          password,
          role,
          role === 'merchant' ? businessName.trim() : undefined
        );

        if (res.success) {
          setName('');
          setEmail('');
          setPassword('');
          setBusinessName('');
          onClose();
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        if (!email.trim() || !password.trim()) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }

        const res = await login(email.trim(), password);
        if (res.success) {
          setEmail('');
          setPassword('');
          onClose();
        } else {
          setError(res.message || 'Login failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoRole: 'customer' | 'merchant') => {
    if (demoRole === 'customer') {
      setName('Demo Buyer');
      setEmail('buyer@example.com');
      setPassword('password123');
      setRole('customer');
    } else {
      setName('Demo Merchant');
      setEmail('merchant@store.com');
      setPassword('password123');
      setRole('merchant');
      setBusinessName('Pro Gear Store');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRegister ? t('auth.createAccount') : t('auth.welcomeBack')}
              </h2>
              <p className="text-xs text-slate-500">
                {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fill Switchers */}
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('auth.demoHeading')}:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('customer')}
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-brand-600" /> {t('auth.demoCustomerBtn')}
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('merchant')}
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-brand-600" /> {t('auth.demoMerchantBtn')}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              {/* Role Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{t('auth.roleLabel')}</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      role === 'customer'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span>{t('auth.customerRole')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      role === 'merchant'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-brand-600" />
                    <span>{t('auth.merchantRole')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">{t('auth.nameLabel')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Mehta"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              {role === 'merchant' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{t('auth.businessNameLabel')}</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. UrbanStyle Footwear"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t('auth.emailLabel')}</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t('auth.passwordLabel')}</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95 mt-2"
          >
            <span>{loading ? t('common.loading') : isRegister ? t('auth.signUpBtn') : t('auth.signInBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center text-xs text-slate-500">
          {isRegister ? (
            <span>
              {t('auth.haveAccountPrompt')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="font-bold text-slate-900 hover:underline"
              >
                {t('auth.signInBtn')}
              </button>
            </span>
          ) : (
            <span>
              {t('auth.noAccountPrompt')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="font-bold text-slate-900 hover:underline"
              >
                {t('auth.signUpBtn')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
