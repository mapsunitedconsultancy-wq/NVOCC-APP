'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { login, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 3 Profile fields
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [gstNumber, setGstNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('step') === '3') {
      setStep(3);
    }
  }, [searchParams]);

  // Phone formatting (+91)
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+91')) {
      clean = '+91 ' + clean.replace(/^\+?91/, '').trim();
    } else {
      const rest = clean.slice(3).replace(/\D/g, '').slice(0, 10);
      clean = '+91 ' + rest;
    }
    setPhone(clean);
  };

  // STEP 1: Verify Email & Send 8-digit OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const checkRes = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const checkData = await checkRes.json();

    if (checkData.exists) {
      setError('An account with this email already exists. Please sign in.');
      setLoading(false);
      return;
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (otpErr) {
      setError(otpErr.message);
    } else {
      setStep(1.5 as any);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: vErr } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    });

    if (vErr || !data.session) {
      setError(vErr?.message || 'Invalid or expired OTP code.');
      setLoading(false);
      return;
    }

    login(data.session.access_token);
    setStep(2);
    setLoading(false);
  };

  // STEP 2: Define Master Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: pErr } = await supabase.auth.updateUser({ password });
    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }

    setStep(3);
    setLoading(false);
  };

  // STEP 3: Setup Firm Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanGst = gstNumber.trim().toUpperCase();
    if (cleanGst.length !== 15) {
      setError('A valid 15-character GSTIN is required (e.g. 24AARCM6698J1ZK).');
      return;
    }

    const rawDigits = phone.replace(/\D/g, '').slice(2);
    if (rawDigits.length !== 10) {
      setError('A valid 10-digit mobile number after +91 is compulsory.');
      return;
    }

    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firm_name: firmName.trim(),
        company_name: firmName.trim(),
        phone: phone.trim(),
        gst_number: cleanGst,
        contact_person: contactPerson.trim(),
        plan: 'demo',
      }),
    });

    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'Failed to save profile');
      setLoading(false);
      return;
    }

    await refreshProfile();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-[#F4EFE6] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0A1628] border border-[#15233C] rounded-2xl p-8 shadow-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 border-b border-[#15233C] pb-4">
          <div className={`text-xs font-mono font-bold ${step >= 1 ? 'text-[#E88B2A]' : 'text-slate-600'}`}>1. Identity & OTP</div>
          <div className="w-6 h-px bg-slate-700" />
          <div className={`text-xs font-mono font-bold ${step >= 2 ? 'text-[#E88B2A]' : 'text-slate-600'}`}>2. Password</div>
          <div className="w-6 h-px bg-slate-700" />
          <div className={`text-xs font-mono font-bold ${step >= 3 ? 'text-[#E88B2A]' : 'text-slate-600'}`}>3. Firm Profile</div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300">
            {error}
          </div>
        )}

        {/* STEP 1: Email Request & OTP Verification */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Create Workspace Account</h2>
            <p className="text-sm text-slate-400">Enter your company email to verify identity via an 8-digit OTP code.</p>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Official Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="director@freight.com"
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Send 8-Digit OTP'}
            </button>
            <p className="text-center text-sm text-slate-400">
              Already registered? <Link href="/login" className="text-[#E88B2A] hover:underline">Sign In</Link>
            </p>
          </form>
        )}

        {(step as any) === 1.5 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Enter Verification Code</h2>
            <p className="text-sm text-slate-400">Enter the OTP delivered to <span className="text-white font-mono">{email}</span></p>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">8-Digit OTP Code</label>
              <input
                type="text"
                required
                maxLength={8}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                className="w-full mt-1 px-4 py-3 bg-[#070E1A] border border-[#15233C] rounded-lg text-white font-mono tracking-widest text-center text-xl focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Confirm OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: Set Master Password */}
        {step === 2 && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Set Master Password</h2>
            <p className="text-sm text-slate-400">Define your password for secure future logins.</p>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full mt-1 px-4 py-2.5 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue to Firm Profile'}
            </button>
          </form>
        )}

        {/* STEP 3: Firm Profile Details */}
        {step === 3 && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Firm Onboarding Details</h2>
            <p className="text-sm text-slate-400">Enter regulatory details to activate your ERP compliance series.</p>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Firm / Company Legal Name</label>
              <input
                type="text"
                required
                value={firmName}
                onChange={e => setFirmName(e.target.value)}
                placeholder="e.g. Apex Marine Logistics Pvt Ltd"
                className="w-full mt-1 px-4 py-2 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Contact Person Name</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full mt-1 px-4 py-2 bg-[#070E1A] border border-[#15233C] rounded-lg text-white focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">Phone (+91)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full mt-1 px-4 py-2 bg-[#070E1A] border border-[#15233C] rounded-lg text-white font-mono focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-mono text-slate-400">GSTIN (15 Digits)</label>
              <input
                type="text"
                required
                maxLength={15}
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                placeholder="24AARCM6698J1ZK"
                className="w-full mt-1 px-4 py-2 bg-[#070E1A] border border-[#15233C] rounded-lg text-white font-mono uppercase focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E88B2A] text-slate-950 font-bold rounded-lg hover:bg-[#FFB356] transition disabled:opacity-50"
            >
              {loading ? 'Finalizing Profile...' : 'Complete Registration & Launch'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

