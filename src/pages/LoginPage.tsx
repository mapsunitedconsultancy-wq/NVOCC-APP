import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { loginWithEmailPassword, sendPasswordReset } from '../services/authService';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onNavigateToLanding
}) => {
  const { showToast, setAuthSession, updateCurrentUser, setActiveView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

      // SECURITY GATEKEEPER: If user has not completed firm registration (GSTIN, legal name, phone)
      if (!isOnboardingComplete) {
        showToast(
          'warning',
          'Company Compliance Incomplete',
          'Mandatory company setup (GSTIN, legal name, and phone) is pending. Please complete onboarding.'
        );
        setActiveView('register');
        return;
      }

      showToast('success', 'Authentication Successful', `Welcome back, ${user.user_metadata?.full_name || user.email}!`);
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

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('error', 'Required Field', 'Please enter your registered email address.');
      return;
    }

    setIsSendingReset(true);
    const result = await sendPasswordReset(forgotEmail);
    setIsSendingReset(false);

    if (result.success) {
      setResetSuccess(true);
      showToast('success', 'Reset Link Dispatched', `Password recovery email sent via Resend to ${forgotEmail}`);
    } else {
      showToast('error', 'Reset Failed', result.error || 'Unable to send password reset');
    }
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-[#F4EFE6] flex flex-col justify-between selection:bg-[#E88B2A]/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E88B2A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#16263F]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#15233C]/80 bg-[#0A1628]/80 backdrop-blur-md relative z-10">
        <div
          onClick={onNavigateToLanding}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E88B2A] to-[#FFB356] flex items-center justify-center font-black text-slate-950 shadow-md shadow-[#E88B2A]/20 group-hover:scale-105 transition-transform">
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
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E88B2A] hover:text-[#FFB356] px-3 py-1.5 rounded-lg bg-[#E88B2A]/10 border border-[#E88B2A]/30 hover:bg-[#E88B2A]/20 transition-all"
          >
            <span>Register New Firm</span>
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
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-[#A8A299] mt-1.5">
              Enter your email and password to access shipments, HBLs, manifests & billing
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
                  onClick={() => {
                    setResetSuccess(false);
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-[#E88B2A] hover:underline hover:text-[#FFB356] transition-colors"
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
            <span>Don't have an NVOCC account? </span>
            <button
              onClick={onNavigateToRegister}
              className="font-bold text-[#E88B2A] hover:underline hover:text-[#FFB356] transition-colors"
            >
              Register your Firm & 8-Digit OTP
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0C1729] border border-[#1E3355] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[#F4EFE6] font-display flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-[#E88B2A]" />
              <span>Password Recovery</span>
            </h3>
            <p className="text-xs text-[#A8A299] mb-4">
              Enter your account email. We will send a secure password reset link powered by Supabase and Resend.
            </p>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-medium">
                  Password reset link dispatched to <strong className="text-white">{forgotEmail}</strong>
                </p>
                <p className="text-[11px] text-emerald-300/80">
                  Please check your inbox or spam folder. Click the link to define a new password.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#C5BFA9] mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 rounded-lg text-xs text-[#A8A299] hover:bg-[#16263F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#D47B1C] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending...' : 'Send Recovery Email'}
                  </button>
                </div>
              </form>
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
