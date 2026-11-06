'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    // Require firm_name and phone to enter internal dashboard views
    if (!user.firm_name || !user.phone) {
      router.replace('/register?step=3');
    }
  }, [user, token, isLoading, router]);

  if (isLoading || !token || !user || !user.firm_name || !user.phone) {
    return (
      <div className="min-h-screen bg-[#070E1A] flex items-center justify-center text-[#F4EFE6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#E88B2A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Verifying Access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

