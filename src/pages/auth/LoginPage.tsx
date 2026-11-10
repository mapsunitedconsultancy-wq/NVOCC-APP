import React, { useState, useRef, useEffect } from 'react';
import {
  Ship,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Anchor,
  HelpCircle,
  RotateCcw,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  loginWithEmailPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  updatePasswordAfterReset,
  sendPasswordResetConfirmationEmail,
  formatSupabaseUser
} from '../../services/authService';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
}) => {
  const {
    showToast,
    setAuthSession,
    updateCurrentUser,
    setActiveView,
    isPasswordRecovery,
    setIsPasswordRecovery,
    currentUser
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Reset with 8-Digit Email OTP
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(Array(8).fill(''));
  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resetCountdown, setResetCountdown] = useState<number>(60);
  const [canResendReset, setCanResendReset] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (showForgotModal && resetStep === 'OTP' && resetCountdown > 0) {
      timer = setInterval(() => {
        setResetCountdown(prev => {
          if (prev <= 1) {
            setCanResendReset(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showForgotModal, resetStep, resetCountdown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (showForgotModal && resetStep === 'OTP') {
      setTimeout(() => {
        resetOtpRefs.current[0]?.focus();
      }, 150);
    }
  }, [showForgotModal, resetStep]);

  // Automatically handle recovery mode (e.g. from password reset link or verified OTP)
  useEffect(() => {
    if (isPasswordRecovery) {
      setShowForgotModal(true);
      setResetStep('PASSWORD');
      setResetError(null);
      if (currentUser?.email && !forgotEmail) {
        setForgotEmail(currentUser.email);
      }
    }
  }, [isPasswordRecovery, currentUser?.email]);

  const openResetModal = () => {
    setShowForgotModal(true);
    setResetStep('EMAIL');
    setResetError(null);
    setForgotEmail(email || '');
    setResetOtpDigits(Array(8).fill(''));
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setIsPasswordRecovery(false);
    setResetStep('EMAIL');
    setResetError(null);
    setResetOtpDigits(Array(8).fill(''));
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!forgotEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    setResetLoading(true);
    const result = await sendPasswordResetOtp(forgotEmail);
    setResetLoading(false);

    if (result.success) {
      setResetStep('OTP');
      setResetCountdown(60);
      setCanResendReset(false);
      setResetOtpDigits(Array(8).fill(''));
      showToast('success', 'Reset Code Sent', `Verification code sent to ${forgotEmail}`);
    } else {
      setResetError(result.error || 'Failed to dispatch password recovery OTP');
    }
  };

  const handleResetOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newDigits = [...resetOtpDigits];

    if (!cleaned) {
      newDigits[index] = '';
      setResetOtpDigits(newDigits);
      return;
    }

    newDigits[index] = cleaned[cleaned.length - 1];
    setResetOtpDigits(newDigits);

    if (index < 7) {
      resetOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !resetOtpDigits[index] && index > 0) {
      resetOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (!pasted) return;

    const newDigits = Array(8).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setResetOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 7);
    resetOtpRefs.current[nextIndex]?.focus();
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const raw = resetOtpDigits.join('');
    const code = (raw.length === 6 || raw.length === 8)
      ? raw
      : (resetOtpDigits.slice(0, 6).join('').length === 6 ? resetOtpDigits.slice(0, 6).join('') : raw);

    if (code.length !== 6 && code.length !== 8) {
      setResetError('Please enter the verification code sent to your email.');
      return;
    }

    setResetLoading(true);
    // Lock into password recovery mode so AppContext Route Guard does NOT move to Dashboard prematurely
    setIsPasswordRecovery(true);

    const result = await verifyPasswordResetOtp(forgotEmail, code);
    setResetLoading(false);

    if (result.success) {
      setResetStep('PASSWORD');
      showToast('success', 'OTP Verified', 'Please define your new password and retype it to confirm.');
    } else {
      setIsPasswordRecovery(false);
      setResetError(result.error || 'Invalid or expired OTP code');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match. Please retype the new password to confirm.');
      return;
    }

    setResetLoading(true);
    const result = await updatePasswordAfterReset(newPassword);

    if (!result.success) {
      setResetLoading(false);
      setResetError(result.error || 'Failed to update password');
      return;
    }

    // 1. Dispatch confirmation email stating password was reset
    const targetEmail = forgotEmail || currentUser?.email || email;
    try {
      await sendPasswordResetConfirmationEmail({
        to: targetEmail,
        userName: currentUser?.name || targetEmail.split('@')[0],
      });
    } catch (mailErr) {
      console.warn('Confirmation email dispatch notice:', mailErr);
    }

    setResetLoading(false);

    // 2. Notify user with confirmation
    showToast(
      'success',
      'Password Reset Complete',
      `Confirmation email dispatched to ${targetEmail}. Redirecting to Dashboard...`
    );

    // 3. Clear recovery state & close modal
    setIsPasswordRecovery(false);
    setShowForgotModal(false);

    // 4. Synchronize user and session, then open the Dashboard
    if (result.data?.session) {
      setAuthSession(result.data.session, result.data.user);
    } else if (result.data?.user) {
      updateCurrentUser(formatSupabaseUser(result.data.user));
    }
    setActiveView('dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your registered email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmailPassword(email, password);

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      const { user, session, isOnboardingComplete } = result.data;
      setAuthSession(session, user);

      if (!isOnboardingComplete) {
        showToast(
          'info',
          'Welcome to MAPS NVOCC PRO',
          'Sign in successful. You can complete your company GSTIN compliance in Settings at any time.'
        );
      } else {
        showToast('success', 'Authentication Successful', `Welcome back, ${user.user_metadata?.full_name || user.email}!`);
      }

      setActiveView('dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected network error during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'super_admin' | 'operations') => {
    setIsLoading(true);
    setErrorMessage(null);

    // Fast-path evaluation credentials
    const demoEmail = role === 'super_admin' ? 'ops@mapsfreight.com' : 'rahul.verma@mapsfreight.com';
    const demoName = role === 'super_admin' ? 'Aman Dana' : 'Rahul Verma';

    setTimeout(() => {
      updateCurrentUser({
        name: demoName,
        email: demoEmail,
        role: role,
        title: role === 'super_admin' ? 'Super Admin / Managing Director' : 'Senior Operations Executive'
      });
      setAuthSession(
        { access_token: 'demo-session-token', user: { email: demoEmail, id: 'demo-user-id' } } as any,
        { id: 'demo-user-id', email: demoEmail, user_metadata: { full_name: demoName, role } } as any
      );
      showToast('info', 'Demo Session Active', `Logged in as ${demoName} (${role.toUpperCase()})`);
      setActiveView('dashboard');
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-[#F4EFE6] flex flex-col justify-between selection:bg-[#E88B2A]/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E88B2A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#16263F]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#15233C]/80 bg-[#0A1628]/80 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E88B2A] to-[#FFB356] flex items-center justify-center font-black text-slate-950 shadow-md shadow-[#E88B2A]/20">
            <Ship className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base tracking-tight text-[#F4EFE6]">
                MAPS NVOCC PRO
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30">
                SUPABASE AUTH
              </span>
            </div>
            <p className="text-[11px] text-[#A8A299]">Enterprise Maritime ERP & Container OS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('public_tracking')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#A8A299] hover:text-[#F4EFE6] px-3 py-1.5 rounded-lg border border-[#1C2E4C] hover:bg-[#12223A] transition-colors"
          >
            <Anchor className="w-3.5 h-3.5 text-[#E88B2A]" />
            <span>Public Container Tracking</span>
          </button>

          <button
            onClick={onNavigateToRegister}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E88B2A] hover:text-[#FFB356] px-3.5 py-1.5 rounded-lg bg-[#E88B2A]/10 border border-[#E88B2A]/30 hover:bg-[#E88B2A]/20 transition-all cursor-pointer"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Login Form Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md bg-[#0D1A2E]/90 border border-[#1E3355] rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#16263F] border border-[#253D64] mb-3 text-[#E88B2A] shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[#F4EFE6]">
              Sign In
            </h1>
            <p className="text-xs text-[#A8A299] mt-1.5">
              Enter your credentials to access your workspace
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Error</span>
                <span className="text-red-300/90">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ops@mapsfreight.com"
                  autoComplete="email"
                  className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#C5BFA9]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-[11px] text-[#E88B2A] hover:underline hover:text-[#FFB356] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6A64] hover:text-[#A8A299] p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#A8A299] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#081220] border-[#263D64] text-[#E88B2A] focus:ring-0"
                />
                <span>Remember this workstation</span>
              </label>

              <span className="text-[11px] text-[#6E6A64] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>SSL Encrypted</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fast Demo Access (No SMTP Delay) */}
          <div className="mt-6 pt-5 border-t border-[#1C2F4D]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6A64]">
                Instant Dev & Evaluation Access
              </span>
              <span className="text-[10px] text-amber-400 font-medium">Bypass</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('super_admin')}
                className="px-3 py-2 rounded-lg bg-[#12223A] hover:bg-[#182C4A] border border-[#21375B] text-left transition-colors text-xs group"
              >
                <div className="font-semibold text-[#F4EFE6] group-hover:text-[#E88B2A]">
                  Aman Dana
                </div>
                <div className="text-[10px] text-[#A8A299]">Super Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('operations')}
                className="px-3 py-2 rounded-lg bg-[#12223A] hover:bg-[#182C4A] border border-[#21375B] text-left transition-colors text-xs group"
              >
                <div className="font-semibold text-[#F4EFE6] group-hover:text-[#E88B2A]">
                  Rahul Verma
                </div>
                <div className="text-[10px] text-[#A8A299]">Operations Lead</div>
              </button>
            </div>
          </div>

          {/* Switch to Registration */}
          <div className="mt-6 text-center text-xs text-[#A8A299]">
            <span>Don't have an account? </span>
            <button
              onClick={onNavigateToRegister}
              className="font-bold text-[#E88B2A] hover:underline hover:text-[#FFB356] transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </main>

      {/* Password Reset via 8-Digit OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0C1729] border border-[#1E3355] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E3355]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E88B2A]/15 border border-[#E88B2A]/30 flex items-center justify-center text-[#E88B2A]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4EFE6] font-display">
                    {resetStep === 'EMAIL' && 'Reset Account Password'}
                    {resetStep === 'OTP' && 'Enter Verification Code'}
                    {resetStep === 'PASSWORD' && 'Create New Password'}
                    {resetStep === 'SUCCESS' && 'Password Updated!'}
                  </h3>
                  <p className="text-[11px] text-[#A8A299]">
                    {resetStep === 'EMAIL' && 'Step 1 of 3: Identity verification'}
                    {resetStep === 'OTP' && 'Step 2 of 3: Enter code'}
                    {resetStep === 'PASSWORD' && 'Step 3 of 3: Define new credentials'}
                    {resetStep === 'SUCCESS' && 'Credentials updated successfully'}
                  </p>
                </div>
              </div>

              {resetStep !== 'SUCCESS' && (
                <button
                  type="button"
                  onClick={handleCloseForgotModal}
                  className="w-7 h-7 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#A8A299] hover:text-[#F4EFE6] flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Stepper Dots */}
            {resetStep !== 'SUCCESS' && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`h-1.5 rounded-full transition-all ${resetStep === 'EMAIL' ? 'w-8 bg-[#E88B2A]' : 'w-4 bg-emerald-500'}`} />
                <span className={`h-1.5 rounded-full transition-all ${resetStep === 'OTP' ? 'w-8 bg-[#E88B2A]' : resetStep === 'PASSWORD' ? 'w-4 bg-emerald-500' : 'w-4 bg-[#1E3355]'}`} />
                <span className={`h-1.5 rounded-full transition-all ${resetStep === 'PASSWORD' ? 'w-8 bg-[#E88B2A]' : 'w-4 bg-[#1E3355]'}`} />
              </div>
            )}

            {/* Error Notification */}
            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 1: Enter Email & Request Verification Code */}
            {/* ───────────────────────────────────────────────────────────── */}
            {resetStep === 'EMAIL' && (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <p className="text-xs text-[#A8A299]">
                  Enter your email address to receive a verification code to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="ops@mapsfreight.com"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs text-[#A8A299] hover:bg-[#16263F] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 2: Enter & Verify 8-Digit OTP */}
            {/* ───────────────────────────────────────────────────────────── */}
            {resetStep === 'OTP' && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-5">
                <div className="text-center">
                  <p className="text-xs text-[#A8A299]">
                    A verification code has been sent to:
                  </p>
                  <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {forgotEmail}
                  </p>
                </div>

                {/* 8-Digit Code Split Input (4 - 4) */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {resetOtpDigits.slice(0, 4).map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { resetOtpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleResetOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleResetOtpKeyDown(idx, e)}
                      onPaste={handleResetOtpPaste}
                      className="w-9 h-12 text-center text-lg font-mono font-bold bg-[#081220] border-2 border-[#21375B] focus:border-[#E88B2A] rounded-xl text-[#F4EFE6] focus:outline-hidden transition-all shadow-inner"
                    />
                  ))}

                  <span className="text-lg font-bold text-[#6E6A64] px-0.5">-</span>

                  {resetOtpDigits.slice(4, 8).map((digit, idx) => {
                    const actualIdx = idx + 4;
                    return (
                      <input
                        key={actualIdx}
                        ref={el => { resetOtpRefs.current[actualIdx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleResetOtpChange(actualIdx, e.target.value)}
                        onKeyDown={e => handleResetOtpKeyDown(actualIdx, e)}
                        onPaste={handleResetOtpPaste}
                        className="w-9 h-12 text-center text-lg font-mono font-bold bg-[#081220] border-2 border-[#21375B] focus:border-[#E88B2A] rounded-xl text-[#F4EFE6] focus:outline-hidden transition-all shadow-inner"
                      />
                    );
                  })}
                </div>

                {/* Timer & Resend */}
                <div className="flex items-center justify-between text-xs px-2 pt-1 text-[#A8A299]">
                  <button
                    type="button"
                    onClick={() => setResetStep('EMAIL')}
                    className="text-[11px] text-[#A8A299] hover:text-[#E88B2A] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change email</span>
                  </button>

                  <div>
                    {resetCountdown > 0 ? (
                      <span className="text-[11px] font-mono text-[#A8A299]">
                        Resend in <strong className="text-[#E88B2A]">{resetCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendResetOtp}
                        disabled={resetLoading}
                        className="text-[11px] font-bold text-[#E88B2A] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs text-[#A8A299] hover:bg-[#16263F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || (resetOtpDigits.join('').length !== 6 && resetOtpDigits.join('').length !== 8)}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 3: Define New Password */}
            {/* ───────────────────────────────────────────────────────────── */}
            {resetStep === 'PASSWORD' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-xs text-[#A8A299]">
                  OTP successfully verified! Define your new master password for future direct sign-ins.
                </p>

                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    New Master Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6A64] hover:text-[#A8A299] p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    Retype New Password to Confirm
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Retype your new password to confirm"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6A64] hover:text-[#A8A299] p-1"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="text-[11px] text-red-400 font-medium">
                    Passwords do not match. Please retype to confirm.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="px-4 py-2.5 rounded-xl text-xs text-[#A8A299] hover:bg-[#16263F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || newPassword.length < 8 || newPassword !== confirmNewPassword}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Password & Open Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 4: Success Confirmation */}
            {/* ───────────────────────────────────────────────────────────── */}
            {resetStep === 'SUCCESS' && (
              <div className="text-center py-4 space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#F4EFE6]">
                    Password Changed Successfully!
                  </h4>
                  <p className="text-xs text-[#A8A299] mt-1 max-w-sm mx-auto">
                    Your master account password has been updated. You can now use your new credentials to sign in directly.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#E88B2A]/20 cursor-pointer"
                  >
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#15233C]/80 text-center text-xs text-[#6E6A64]">
        <span>© 2026 MAPS Freight Solutions Pvt Ltd • Mundra • Gandhidham • Kandla • Nhava Sheva</span>
      </footer>
    </div>
  );
};
