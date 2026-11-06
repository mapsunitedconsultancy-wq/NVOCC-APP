'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  firm_name?: string;
  company_name?: string;
  phone?: string;
  gst_number?: string;
  contact_person?: string;
  plan?: string;
  isProfileComplete?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData?: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
        await fetchProfile(session.access_token);
      } else {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (storedToken) {
          setToken(storedToken);
          await fetchProfile(storedToken);
        }
      }
      setIsLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/login?type=recovery');
        return;
      }

      if (session) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
        await fetchProfile(session.access_token);
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const login = (newToken: string, userData?: Partial<AuthUser>) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    if (userData) {
      setUser(prev => ({ ...(prev || { id: '', email: '' }), ...userData }));
    }
    fetchProfile(newToken);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...data } : null));
  };

  const refreshProfile = async () => {
    if (token) await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

