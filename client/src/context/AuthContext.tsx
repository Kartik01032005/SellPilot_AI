'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  role: 'customer' | 'merchant' | 'admin';
  merchantId?: string;
  businessName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password?: string,
    role?: 'customer' | 'merchant',
    businessName?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = ApiClient.getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await ApiClient.request<{ user: UserProfile }>('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        setToken(savedToken);
      } else {
        ApiClient.setToken(null);
        setUser(null);
        setToken(null);
      }
    } catch {
      ApiClient.setToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string = 'password123') => {
    setLoading(true);
    try {
      const res = await ApiClient.request<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.token && res.user) {
        ApiClient.setToken(res.token);
        setUser(res.user);
        setToken(res.token);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err instanceof Error ? err.message : 'Network error' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string = 'password123',
    role: 'customer' | 'merchant' = 'customer',
    businessName?: string
  ) => {
    setLoading(true);
    try {
      const res = await ApiClient.request<{ token: string; user: UserProfile }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, businessName }),
      });

      if (res.success && res.token && res.user) {
        ApiClient.setToken(res.token);
        setUser(res.user);
        setToken(res.token);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err instanceof Error ? err.message : 'Network error' };
    }
  };

  const logout = () => {
    ApiClient.setToken(null);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
