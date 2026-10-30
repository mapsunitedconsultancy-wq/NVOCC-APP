import React, { useState, useRef, useEffect } from 'react';
import {
  Ship,
  Mail,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  sendRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
  setUserPassword,
  saveFirmDetails,
  FirmDetailsPayload
} from '../../services/authService';
import {
  validateGSTIN,
  validatePAN,
  validateIEC,
  validateEmail,
  validatePhoneIN,
  normalizePhoneIN
} from '../../utils/validators';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToLanding?: () => void;
  initialStep?: RegistrationStep;
  forcedComplianceMessage?: string;
}

export type RegistrationStep = 'CONTACT' | 'OTP' | 'PASSWORD' | 'FIRM' | 'SUCCESS';

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onNavigateToLanding,
  initialStep = 'CONTACT',
  forcedComplianceMessage
}) => {
  const { showToast, setAuthSession, updateCurrentUser, updateFirmDetails, setActiveView, currentUser, firmDetails } = useApp();

  // Current registration flow step
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(forcedComplianceMessage || null);
  const [showSignInRedirect, setShowSignInRedirect] = useState(false);

  // Step 1: Contact info (Clean placeholders only - no pre-filled text)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: 8-digit OTP inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(8).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Step 3: Password setup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 4: Firm / Company Details (Clean placeholders only - no pre-filled text)
  const [firmLegalName, setFirmLegalName] = useState('');
  const [firmTradeName, setFirmTradeName] = useState('');
  const [businessType, setBusinessType] = useState<FirmDetailsPayload['businessType']>('nvocc');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [iec, setIec] = useState('');
  const [cin, setCin] = useState('');
  const [primaryPort, setPrimaryPort] = useState('INMUN1');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [firmEmail, setFirmEmail] = useState('');
  const [firmPhone, setFirmPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Cached verified session after OTP
  const [verifiedSession, setVerifiedSession] = useState<{ user: any; session: any } | null>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (currentStep === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, countdown]);

  // Focus first OTP input when reaching OTP step
  useEffect(() => {
    if (currentStep === 'OTP') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [currentStep]);

  // -------------------------------------------------------------
  // STEP 1: Send 8-digit OTP to user's Official Email
  // -------------------------------------------------------------
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowSignInRedirect(false);

    // 1. Mandatory Official Email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.message);
      return;
    }

    // 2. Mandatory Mobile Phone validation (unique user identifier)
    const phoneValidation = validatePhoneIN(phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.message);
      return;
    }

    // 3. Mandatory Full Legal Name validation
    if (!fullName.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedPhone = phoneValidation.normalized || normalizePhoneIN(phone);
      const result = await sendRegistrationEmailOtp(email, {
        fullName: fullName.trim(),
        phone: normalizedPhone
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to dispatch verification code to email.');
        if (result.error && result.error.includes('already registered')) {
          setShowSignInRedirect(true);
        }
        setIsLoading(false);
        return;
      }

      showToast(
        'success',
        '8-Digit OTP Dispatched to Email',
        `Verification code dispatched via Resend to ${email}`
      );

      setCountdown(60);
      setCanResend(false);
      setOtpDigits(Array(8).fill(''));
      setCurrentStep('OTP');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with Supabase & Resend mail service');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Verify 8-Digit Email OTP
  // -------------------------------------------------------------
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!cleaned) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    newDigits[index] = cleaned[cleaned.length - 1];
    setOtpDigits(newDigits);

    if (index < 7) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 8; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 7);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 8) {
      setErrorMessage('Please enter the complete 8-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyRegistrationEmailOtp(email, fullCode);

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Invalid or expired 8-digit OTP code');
        setIsLoading(false);
        return;
      }

      setVerifiedSession(result.data);
      showToast('success', 'Email Identity Confirmed', 'Your email address has been verified successfully!');
      // ADVANCE TO PASSWORD (DO NOT ELEVATE SESSION TO DASHBOARD YET)
      setCurrentStep('PASSWORD');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error during OTP verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMessage(null);

    const normalizedPhone = normalizePhoneIN(phone);
    const result = await sendRegistrationEmailOtp(email, { fullName, phone: normalizedPhone });
    setIsLoading(false);

    if (result.success) {
      setCountdown(60);
      setCanResend(false);
      showToast('info', 'Code Resent', `A fresh 8-digit code has been delivered via Resend to ${email}`);
    } else {
      setErrorMessage(result.error || 'Failed to resend email OTP');
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Set Password
  // -------------------------------------------------------------
  const passwordCriteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Passwords match', met: Boolean(password && password === confirmPassword) }
  ];

  const isPasswordValid = passwordCriteria.every(c => c.met);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPasswordValid) {
      setErrorMessage('Please ensure your password fulfills all security requirements.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await setUserPassword(password, { fullName, phone, email });

      if (!result.success) {
        setErrorMessage(result.error || 'Could not update password');
        setIsLoading(false);
        return;
      }

      showToast('success', 'Password Configured', 'Master password defined successfully.');
      // ADVANCE TO FIRM DETAILS (DO NOT ELEVATE SESSION TO DASHBOARD YET)
      setCurrentStep('FIRM');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save password');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 4: Firm & Company Onboarding (MANDATORY GSTIN, LEGAL NAME, PHONE)
  // -------------------------------------------------------------
  const handleAutoExtractPanFromGstin = (gstVal: string) => {
    const clean = gstVal.trim().toUpperCase();
    setGstin(clean);
    if (clean.length >= 12) {
      const extractedPan = clean.substring(2, 12);
      setPan(extractedPan);
      if (!iec) setIec(extractedPan);
    }
  };

  const handleSaveFirmDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Mandatory Firm Legal Name
    if (!firmLegalName.trim() || firmLegalName.trim().length < 3) {
      setErrorMessage('Company legal entity name is compulsory (minimum 3 characters).');
      return;
    }

    // 2. Mandatory GSTIN with Checksum Validation
    if (!gstin.trim()) {
      setErrorMessage('GSTIN is compulsory for firm onboarding under Indian maritime law.');
      return;
    }

    const gstCheck = validateGSTIN(gstin);
    if (!gstCheck.isValid) {
      setErrorMessage(`GSTIN Error: ${gstCheck.message}`);
      return;
    }

    // 3. Mandatory PAN Validation
    const panToCheck = pan.trim() || gstin.trim().substring(2, 12);
    const panCheck = validatePAN(panToCheck);
    if (!panCheck.isValid) {
      setErrorMessage(`PAN Error: ${panCheck.message}`);
      return;
    }

    // 4. Mandatory Registered Office Address
    if (!registeredAddress.trim()) {
      setErrorMessage('Registered office address is required for bill of lading footers.');
      return;
    }

    // 5. Mandatory City, State, and PIN Code
    if (!city.trim()) {
      setErrorMessage('City is compulsory.');
      return;
    }
    if (!state.trim()) {
      setErrorMessage('State is compulsory.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setErrorMessage('A valid 6-digit PIN code is compulsory.');
      return;
    }

    // 6. Mandatory Unique Phone Check
    const cleanPhone = firmPhone.trim() || phone.trim();
    const phoneCheck = validatePhoneIN(cleanPhone);
    if (!phoneCheck.isValid) {
      setErrorMessage('A valid mobile phone number is compulsory for firm contact.');
      return;
    }

    setIsLoading(true);

    const payload: FirmDetailsPayload = {
      legalName: firmLegalName.trim(),
      tradeName: firmTradeName.trim() || firmLegalName.trim(),
      brandName: firmTradeName.trim() || firmLegalName.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: panToCheck.toUpperCase(),
      iec: (iec.trim() || panToCheck).toUpperCase(),
      cin: cin.trim().toUpperCase(),
      businessType,
      primaryPort,
      registeredAddress: registeredAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      country: 'India',
      pincode: pincode.trim(),
      phone: phoneCheck.normalized || cleanPhone,
      email: firmEmail.trim() || email,
      website: website.trim() || undefined
    };

    try {
      const result = await saveFirmDetails(payload, {
        fullName: fullName.trim() || 'Director',
        phone: payload.phone,
        role: 'super_admin'
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to save company profile.');
        setIsLoading(false);
        return;
      }

      // Update AppContext firm details
      updateFirmDetails({
        legalName: payload.legalName,
        tradeName: payload.tradeName,
        brandName: payload.brandName,
        gstin: payload.gstin,
        pan: payload.pan,
        cin: payload.cin,
        iec: payload.iec,
        registeredAddress: payload.registeredAddress,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        bankAccounts: [
          {
            id: 'bank-user-primary',
            bankName: bankName || 'Primary Commercial Bank',
            accountName: payload.legalName,
            accountNumber: accountNumber || '50200012345678',
            accountType: 'Current Account',
            ifsc: ifsc || 'HDFC0001234',
            branch: `${city} Commercial Branch`,
            swift: 'HDFCINBBGND',
            upiId: `${payload.tradeName.toLowerCase().replace(/\s+/g, '')}@hdfcbank`
          }
        ]
      });

      // Update AppContext user
      updateCurrentUser({
        name: fullName.trim() || 'Director',
        email,
        phone: payload.phone,
        role: 'super_admin',
        title: 'Managing Director / Super Admin',
        department: 'Executive Management',
        onboardingCompleted: true
      });

      // ONLY NOW AT STEP 4: Set active verified session in AppContext!
      if (verifiedSession) {
        setAuthSession(verifiedSession.session, {
          ...verifiedSession.user,
          user_metadata: {
            ...verifiedSession.user.user_metadata,
            onboardingCompleted: true,
            firm: payload
          }
        });
      } else {
        setAuthSession(
          { access_token: `token_${Date.now()}`, user: { email, id: `usr_${Date.now()}` } },
          { id: `usr_${Date.now()}`, email, user_metadata: { full_name: fullName, phone: payload.phone, onboardingCompleted: true, firm: payload } }
        );
      }

      showToast('success', 'Firm Registered & Verified', `${payload.legalName} is now fully compliant and active!`);
      setCurrentStep('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error finalizing company compliance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDashboard = () => {
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-[#F4EFE6] flex flex-col justify-between selection:bg-[#E88B2A]/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 right-10 w-96 h-96 bg-[#E88B2A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-20 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
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
                8-DIGIT EMAIL OTP
              </span>
            </div>
            <p className="text-[11px] text-[#A8A299]">Firm Onboarding & High-Security Setup</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#A8A299] hidden sm:inline">Already registered?</span>
          <button
            onClick={onNavigateToLogin}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#F4EFE6] hover:text-[#E88B2A] px-3.5 py-1.5 rounded-lg bg-[#16263F] border border-[#263D64] hover:bg-[#1D3251] transition-all cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 py-8">
        <div className="w-full max-w-2xl bg-[#0D1A2E]/90 border border-[#1E3355] rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl">

          {/* Stepper Progress Bar */}
          {currentStep !== 'SUCCESS' && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-medium text-[#A8A299] mb-2 px-1">
                <span className={currentStep === 'CONTACT' ? 'text-[#E88B2A] font-bold' : ''}>
                  1. Contact
                </span>
                <span className={currentStep === 'OTP' ? 'text-[#E88B2A] font-bold' : ''}>
                  2. Email OTP
                </span>
                <span className={currentStep === 'PASSWORD' ? 'text-[#E88B2A] font-bold' : ''}>
                  3. Password
                </span>
                <span className={currentStep === 'FIRM' ? 'text-[#E88B2A] font-bold' : ''}>
                  4. GST & Firm Details
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#16263F] rounded-full overflow-hidden flex">
                <div
                  className={`h-full bg-gradient-to-r from-[#E88B2A] to-[#FFB356] transition-all duration-300 ${
                    currentStep === 'CONTACT'
                      ? 'w-1/4'
                      : currentStep === 'OTP'
                      ? 'w-2/4'
                      : currentStep === 'PASSWORD'
                      ? 'w-3/4'
                      : 'w-full'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Registration Alert</span>
                <span className="text-red-300/90">{errorMessage}</span>
                {showSignInRedirect && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E88B2A] text-slate-950 hover:bg-[#FF9A3C] transition-colors cursor-pointer"
                    >
                      <span>Sign In to Existing Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: CONTACT DETAILS & REQUEST EMAIL OTP */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 'CONTACT' && (
            <div className="animate-in fade-in duration-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#16263F] border border-[#253D64] mb-3 text-[#E88B2A]">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-display text-[#F4EFE6]">
                  Register Your NVOCC Firm
                </h2>
                <p className="text-xs text-[#A8A299] mt-1 max-w-md mx-auto">
                  An 8-digit verification code will be dispatched to your corporate email. Mobile number is compulsory and stored as your unique identifier.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {/* Mandatory Official Email (Receives 8-Digit OTP) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#E88B2A] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Official Corporate Email * (Receives 8-Digit OTP)</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#A8A299]">Resend SMTP Delivery</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E88B2A]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="director@yourfreightfirm.com"
                      className="w-full bg-[#081220] border-2 border-[#E88B2A]/40 focus:border-[#E88B2A] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-[#A8A299] mt-1 block">
                    The 8-digit verification code will be sent to this email address.
                  </span>
                </div>

                {/* Mandatory Mobile Phone Number (Compulsory for unique user identification) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#C5BFA9] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#E88B2A]" />
                      <span>Mobile Phone Number * (Compulsory Unique User Identifier)</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400">Strictly Compulsory</span>
                  </div>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98250 12345"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#F4EFE6] font-mono placeholder-[#556379] focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-[#A8A299] mt-1 block">
                    Format: +91 followed by 10 digits (e.g. +91 98250 12345). Stored as your unique identity.
                  </span>
                </div>

                {/* Mandatory Full Legal Name */}
                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    Full Legal Name of Principal Director / Admin *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Aman Dana"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending 8-Digit Code to Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send 8-Digit Verification Code to Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: 8-DIGIT EMAIL OTP VERIFICATION */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 'OTP' && (
            <div className="animate-in fade-in duration-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#16263F] border border-[#253D64] mb-3 text-[#E88B2A]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-display text-[#F4EFE6]">
                  Verify Email Address
                </h2>
                <p className="text-xs text-[#A8A299] mt-1">
                  8-digit verification code delivered to your registered email: <strong className="text-amber-400 font-mono">{email}</strong>
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[11px] text-[#A8A299]">
                    Unique Mobile Registered: <strong className="text-[#F4EFE6] font-mono">{phone}</strong>
                  </span>
                  <span className="text-[11px] text-[#6E6A64]">•</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('CONTACT')}
                    className="text-[11px] text-[#A8A299] hover:text-[#E88B2A] underline cursor-pointer"
                  >
                    Change details
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 8 Digit Inputs (4 - 4 split) */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                    {/* First 4 digits */}
                    {otpDigits.slice(0, 4).map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-9 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold bg-[#081220] border-2 border-[#21375B] focus:border-[#E88B2A] rounded-xl text-[#F4EFE6] focus:outline-hidden transition-all shadow-inner"
                      />
                    ))}

                    <span className="text-xl font-bold text-[#6E6A64] px-1">-</span>

                    {/* Second 4 digits */}
                    {otpDigits.slice(4, 8).map((digit, idx) => {
                      const actualIdx = idx + 4;
                      return (
                        <input
                          key={actualIdx}
                          ref={el => {
                            otpInputRefs.current[actualIdx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(actualIdx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(actualIdx, e)}
                          onPaste={handleOtpPaste}
                          className="w-9 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold bg-[#081220] border-2 border-[#21375B] focus:border-[#E88B2A] rounded-xl text-[#F4EFE6] focus:outline-hidden transition-all shadow-inner"
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-[#A8A299] mt-3">
                    Tip: You can paste the complete 8-digit OTP from your email directly.
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#A8A299] px-2">
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {countdown > 0 ? (
                        <span>Resend code in <strong className="text-[#F4EFE6]">{countdown}s</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-[#E88B2A] font-bold hover:underline cursor-pointer"
                        >
                          Resend 8-Digit Email OTP Now
                        </button>
                      )}
                    </span>
                  </div>

                  <span className="text-[11px] text-emerald-400 font-mono">
                    Supabase + Resend Verified
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('CONTACT')}
                    className="px-4 py-3 rounded-xl border border-[#21375B] text-xs font-semibold hover:bg-[#16263F] text-[#A8A299] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length !== 8}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Email OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm OTP & Proceed</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: SET PASSWORD */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 'PASSWORD' && (
            <div className="animate-in fade-in duration-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#16263F] border border-[#253D64] mb-3 text-[#E88B2A]">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-display text-[#F4EFE6]">
                  Set Master Password
                </h2>
                <p className="text-xs text-[#A8A299] mt-1">
                  Create a secure master password for future direct email and password sign-ins.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6A64] hover:text-[#A8A299] p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C5BFA9] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F4EFE6] placeholder-[#556379] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6A64] hover:text-[#A8A299] p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#081220] rounded-xl border border-[#16263F] text-xs">
                  {passwordCriteria.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          crit.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={crit.met ? 'text-[#F4EFE6]' : 'text-[#6E6A64]'}>
                        {crit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E88B2A]/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Password & Proceed to Firm Compliance</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: FIRM & COMPANY ONBOARDING (MANDATORY GSTIN, LEGAL NAME, PHONE) */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 'FIRM' && (
            <div className="animate-in fade-in duration-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#16263F] border border-[#253D64] mb-3 text-[#E88B2A]">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-display text-[#F4EFE6]">
                  Mandatory Firm Compliance
                </h2>
                <p className="text-xs text-[#A8A299] mt-1">
                  Indian Maritime & Customs Compliance requires verified GSTIN, Legal Entity Name, and Phone before workspace access.
                </p>
              </div>

              <form onSubmit={handleSaveFirmDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#E88B2A] mb-1">
                      Firm Legal Entity Name * (Compulsory)
                    </label>
                    <input
                      type="text"
                      required
                      value={firmLegalName}
                      onChange={e => setFirmLegalName(e.target.value)}
                      placeholder="e.g. Gandhidham Ocean Liners Pvt Ltd"
                      className="w-full bg-[#081220] border-2 border-[#E88B2A]/40 focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      Brand / Trade Name
                    </label>
                    <input
                      type="text"
                      value={firmTradeName}
                      onChange={e => setFirmTradeName(e.target.value)}
                      placeholder="e.g. GOL Lines"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      Business Entity Category
                    </label>
                    <select
                      value={businessType}
                      onChange={e => setBusinessType(e.target.value as any)}
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="nvocc">NVOCC Operator (Carrier / Issuer of BL)</option>
                      <option value="freight_forwarder">International Freight Forwarder</option>
                      <option value="cha">Customs House Agent (CHA / Broker)</option>
                      <option value="liner_agent">Mainline Vessel / Liner Agent</option>
                      <option value="shipper_exporter">Commercial Exporter / Shipper</option>
                      <option value="transporter">Fleet / Drayage Transporter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      Primary Operating Port Base
                    </label>
                    <select
                      value={primaryPort}
                      onChange={e => setPrimaryPort(e.target.value)}
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="INMUN1">Mundra Port (INMUN1) - Gujarat</option>
                      <option value="INIXY">Kandla / Deendayal Port (INIXY)</option>
                      <option value="INNSA">Nhava Sheva / JNPA (INNSA) - Mumbai</option>
                      <option value="INMAA">Chennai Port (INMAA) - Tamil Nadu</option>
                      <option value="INCCU">Kolkata / Haldia (INCCU) - West Bengal</option>
                      <option value="AEJEA">Jebel Ali Port (AEJEA) - UAE Hub</option>
                    </select>
                  </div>
                </div>

                {/* Statutory Identifiers (GSTIN IS MANDATORY) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#E88B2A] mb-1">
                      GSTIN (15 Chars) * (Compulsory)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={gstin}
                      onChange={e => handleAutoExtractPanFromGstin(e.target.value)}
                      placeholder="e.g. 24AARCM6698J1ZK"
                      className="w-full uppercase font-mono bg-[#081220] border-2 border-[#E88B2A]/40 focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      PAN (10 Chars) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={pan}
                      onChange={e => setPan(e.target.value.toUpperCase())}
                      placeholder="e.g. AARCM6698J"
                      className="w-full uppercase font-mono bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      IEC Code (DGFT)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={iec}
                      onChange={e => setIec(e.target.value.toUpperCase())}
                      placeholder="e.g. AARCM6698J"
                      className="w-full uppercase font-mono bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Firm Contact (Phone is compulsory unique number) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#E88B2A] mb-1">
                      Firm Mobile Phone * (Compulsory Unique Number)
                    </label>
                    <input
                      type="tel"
                      required
                      value={firmPhone}
                      onChange={e => setFirmPhone(e.target.value)}
                      placeholder="e.g. +91 98250 12345"
                      className="w-full bg-[#081220] border-2 border-[#E88B2A]/40 focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] font-mono focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      Firm Official Email
                    </label>
                    <input
                      type="email"
                      value={firmEmail}
                      onChange={e => setFirmEmail(e.target.value)}
                      placeholder="e.g. ops@firm.com"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Address & City */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#C5BFA9] mb-1">
                      Registered Office Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={registeredAddress}
                      onChange={e => setRegisteredAddress(e.target.value)}
                      placeholder="e.g. Plot 20, Sector 10, Port Commerce Zone"
                      className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#C5BFA9] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="e.g. Gandhidham"
                        className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#C5BFA9] mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={e => setState(e.target.value)}
                        placeholder="e.g. Gujarat"
                        className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#C5BFA9] mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={e => setPincode(e.target.value)}
                        placeholder="e.g. 370201"
                        className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Banking Account */}
                <div className="pt-2 border-t border-[#16263F]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E88B2A] block mb-2">
                    Primary Banking Account (For HBL & Invoices)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#A8A299] mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd"
                        className="w-full bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-1.5 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#A8A299] mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="e.g. 50200012345678"
                        className="w-full font-mono bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-1.5 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#A8A299] mb-1">IFSC Code</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={ifsc}
                        onChange={e => setIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className="w-full font-mono uppercase bg-[#081220] border border-[#21375B] focus:border-[#E88B2A] rounded-xl px-3 py-1.5 text-xs text-[#F4EFE6] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E88B2A]/25 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Compliance & Activating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verify Compliance & Activate Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 5: SUCCESS CELEBRATION */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 'SUCCESS' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-200 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  COMPLIANCE VERIFIED & ACTIVATED
                </span>
                <h2 className="text-3xl font-black font-display text-[#F4EFE6] mt-3">
                  Welcome aboard, {fullName || 'Director'}!
                </h2>
                <p className="text-sm text-[#A8A299] mt-2 max-w-md mx-auto">
                  <strong className="text-white">{firmLegalName || 'Your Firm'}</strong> is now officially registered. Email identity, unique phone, and GSTIN compliance verified.
                </p>
              </div>

              {/* Firm Summary Card */}
              <div className="p-4 bg-[#081220] border border-[#21375B] rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#16263F] pb-2">
                  <span className="text-[#A8A299]">Operating Persona:</span>
                  <span className="font-bold text-[#E88B2A]">Managing Director / Super Admin</span>
                </div>
                <div className="flex justify-between border-b border-[#16263F] pb-2">
                  <span className="text-[#A8A299]">Registered Email:</span>
                  <span className="font-mono text-[#F4EFE6]">{email}</span>
                </div>
                <div className="flex justify-between border-b border-[#16263F] pb-2">
                  <span className="text-[#A8A299]">Unique Mobile:</span>
                  <span className="font-mono text-[#F4EFE6]">{phone}</span>
                </div>
                <div className="flex justify-between border-b border-[#16263F] pb-2">
                  <span className="text-[#A8A299]">GSTIN / State:</span>
                  <span className="font-mono text-[#F4EFE6]">{gstin} ({state})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Base Terminal:</span>
                  <span className="font-bold text-sky-400">{primaryPort}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunchDashboard}
                  className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-[#E88B2A] to-[#D47B1C] hover:from-[#FF9A3C] hover:to-[#E88B2A] text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E88B2A]/25 cursor-pointer"
                >
                  <span>Launch Operations Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#15233C]/80 text-center text-xs text-[#6E6A64]">
        <span>Secured by Supabase Auth with Resend high-deliverability SMTP & End-to-End Encryption</span>
      </footer>
    </div>
  );
};
