'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

type ViewMode = 'login' | 'forgot' | 'recovery';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { login } = useAuth();

  const [mode, setMode] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('type') === 'recovery') {
      setMode('recovery');
    }
  }, [searchParams]);

  // Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    if (data.session) {
      login(data.session.access_token);
      router.push('/');
    }
    setLoading(false);
  };

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const checkRes = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const checkData = await checkRes.json();

    if (!checkData.exists) {
      setMessage({ type: 'error', text: 'No account registered with this email address.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login?type=recovery`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset link dispatched. Please check your inbox.' });
    }
    setLoading(false);
  };

  // Set New Password (Recovery)
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' });
      setTimeout(() => setMode('login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-[#F4EFE6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A1628] border border-[#15233C] rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold font-display text-white mb-2">
          {mode === 'login' && 'Sign In to Your Workspace'}
          {mode === 'forgot' && 'Reset Your Password'}
          {mode === 'recovery' && 'Set New Password'}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {mode === 'login' && 'Enter your credentials to access the ERP platform.'}
          {mode === 'forgot' && 'Enter your verified official email to receive a secure recovery link.'}
          {mode === 'recovery' && 'Define a new secure master password for your account.'}
        </p>

        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'}`}>
            {message.text}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-mono">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-mono">Password</label>
                <button type="button" onClick={() => { setMode('forgot'); setMessage(null); }} className="text-xs text-[#E88B2A] hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-slate-400 mt-4">
              Don&apos;t have an account? <Link href="/register" className="text-[#E88B2A] hover:underline">Register firm</Link>
            </p>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-mono">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
                placeholder="name@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Send Recovery Link'}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => { setMode('login'); setMessage(null); }} className="text-sm text-slate-400 hover:text-white">
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'recovery' && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-mono">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-mono">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
                placeholder="Re-enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

