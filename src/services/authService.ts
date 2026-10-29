import { supabase, isSupabaseConfigured } from './supabase';
import { User, UserRole } from '../types';
import { validateGSTIN, validatePAN, validatePhoneIN, validateEmail, normalizePhoneIN } from '../utils/validators';
import { FIRM_DETAILS, MOCK_USERS } from '../data/mockData';

export interface FirmDetailsPayload {
  legalName: string;
  tradeName: string;
  brandName?: string;
  gstin: string;
  pan: string;
  cin?: string;
  iec: string;
  registeredAddress: string;
  operationalAddress?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  businessType: 'nvocc' | 'freight_forwarder' | 'cha' | 'shipper_exporter' | 'liner_agent' | 'transporter';
  primaryPort?: string;
}

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// In-memory staging for registration session before final firm onboarding
interface StagedRegistration {
  email: string;
  phone: string;
  fullName: string;
  otpVerified: boolean;
  passwordSet: boolean;
}

let stagedReg: StagedRegistration | null = (() => {
  try {
    const raw = sessionStorage.getItem('maps_staged_reg');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

/**
 * Check if an email or phone is already registered to prevent sending OTP again to existing accounts.
 */
export async function checkIfUserAlreadyExists(
  email: string,
  phone?: string
): Promise<{ exists: boolean; reason?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? normalizePhoneIN(phone) : '';

  // 1. Check known active system accounts
  const mockMatch = MOCK_USERS.find(
    u => u.email.toLowerCase() === cleanEmail || (cleanPhone && u.phone.replace(/[\s-]/g, '') === cleanPhone.replace(/[\s-]/g, ''))
  );
  if (mockMatch) {
    return {
      exists: true,
      reason: `An active account is already registered with ${cleanEmail}. Please sign in to your existing workspace.`
    };
  }

  // 2. Check Supabase users database table if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('email', cleanEmail)
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          exists: true,
          reason: `The email ${cleanEmail} is already registered. Please sign in instead of registering again.`
        };
      }
    } catch {}
  }

  // 3. Check locally persisted session user
  try {
    const savedUserRaw = localStorage.getItem('maps_current_user');
    if (savedUserRaw) {
      const savedUser = JSON.parse(savedUserRaw);
      if (savedUser.email?.toLowerCase() === cleanEmail && savedUser.id !== 'usr-super-admin') {
        return {
          exists: true,
          reason: `An account for ${cleanEmail} already exists on this workstation. Please sign in.`
        };
      }
    }
  } catch {}

  return { exists: false };
}

/**
 * Check if a user and firm have satisfied all mandatory registration requirements.
 * (GSTIN, Legal Entity Name, Verified Unique Phone Number, and Completed Onboarding)
 */
export function isRegistrationComplete(
  user: User | null,
  firm: FirmDetailsPayload | typeof FIRM_DETAILS | null
): boolean {
  if (!user) return false;

  // Demo accounts bypass firm check for quick evaluation
  if (user.id === 'usr-super-admin' || user.id === 'demo-user-id') {
    return true;
  }

  // 1. Mandatory Phone Check (stored unique number of the user)
  const rawPhone = (user.phone || '').replace(/[\s-+]/g, '');
  if (!rawPhone || rawPhone.length < 10) {
    return false;
  }

  // 2. Mandatory Firm Legal Name Check
  if (!firm || !firm.legalName || firm.legalName.trim().length < 3) {
    return false;
  }

  // 3. Mandatory GSTIN Check (Must be 15 chars)
  if (!firm.gstin || firm.gstin.trim().length !== 15) {
    return false;
  }

  // 4. Onboarding flag or local completion token
  try {
    const localFlag = localStorage.getItem('maps_onboarding_completed') === 'true';
    if (user.onboardingCompleted || localFlag) {
      return true;
    }
  } catch {}

  return Boolean(user.onboardingCompleted);
}

/**
 * Step 1 of Register: Send 8-digit OTP to the user's Official Email
 * (Mobile Phone Number is compulsory and validated for storing the unique user number,
 * while the OTP is sent ONLY to the email address).
 */
export async function sendRegistrationEmailOtp(
  email: string,
  metadata: { fullName: string; phone: string }
): Promise<AuthResult<{ email: string }>> {
  // 1. Validate Compulsory Email
  const cleanEmail = email.trim().toLowerCase();
  const emailValidation = validateEmail(cleanEmail);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.message };
  }

  // 2. Validate Compulsory Mobile Phone Number (stored as unique number of the user)
  const phoneValidation = validatePhoneIN(metadata.phone || '');
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: phoneValidation.message || 'A valid 10-digit mobile phone number is compulsory (e.g. +91 98765 43210).'
    };
  }

  // 3. Validate Compulsory Full Name
  const cleanName = (metadata.fullName || '').trim();
  if (!cleanName) {
    return { success: false, error: 'Please provide your full legal name.' };
  }

  const normalizedPhone = phoneValidation.normalized || normalizePhoneIN(metadata.phone);

  // 4. SECURITY CHECK: Do NOT send OTP again if the email is already registered!
  const duplicateCheck = await checkIfUserAlreadyExists(cleanEmail, normalizedPhone);
  if (duplicateCheck.exists) {
    return {
      success: false,
      error: duplicateCheck.reason || 'This email is already registered. Please sign in instead of registering again.'
    };
  }

  // Store staging details for the registration journey
  stagedReg = {
    email: cleanEmail,
    phone: normalizedPhone,
    fullName: cleanName,
    otpVerified: false,
    passwordSet: false,
  };
  try {
    sessionStorage.setItem('maps_staged_reg', JSON.stringify(stagedReg));
  } catch {}

  // 5. Dispatch 8-Digit OTP to the Official Email via Supabase & Resend
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: cleanName,
            phone: normalizedPhone,
            onboardingCompleted: false, // EXPLICITLY FALSE AT REGISTRATION START
            registered_via: 'maps_nvocc_pro_portal',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { email: cleanEmail } };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to dispatch verification email.' };
    }
  }

  // Offline / local development fallback
  return { success: true, data: { email: cleanEmail } };
}

/**
 * Backward compatibility alias for sendRegistrationEmailOtp
 */
export async function sendRegistrationOtp(
  email: string,
  metadata?: { fullName?: string; phone?: string }
): Promise<AuthResult> {
  return sendRegistrationEmailOtp(email, {
    fullName: metadata?.fullName || '',
    phone: metadata?.phone || '',
  });
}

/**
 * Step 2 of Register: Verify 8-Digit OTP sent to user's Official Email
 * (Verifies email identity and marks staging state without elevating to full ERP access).
 */
export async function verifyRegistrationEmailOtp(
  email: string,
  token: string
): Promise<AuthResult<{ user: any; session: any }>> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim().replace(/\s+/g, '');

  if (!cleanToken || cleanToken.length !== 8) {
    return {
      success: false,
      error: 'Please enter the complete 8-digit verification code from your email.'
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let res = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (res.error) {
        const emailRetry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!emailRetry.error) {
          res = emailRetry;
        }
      }

      if (res.error) {
        return { success: false, error: res.error.message };
      }

      if (!res.data.session || !res.data.user) {
        return { success: false, error: 'OTP verification succeeded but no session was generated.' };
      }

      if (stagedReg) {
        stagedReg.otpVerified = true;
        try { sessionStorage.setItem('maps_staged_reg', JSON.stringify(stagedReg)); } catch {}
      }

      return {
        success: true,
        data: {
          user: {
            ...res.data.user,
            user_metadata: {
              ...res.data.user.user_metadata,
              onboardingCompleted: false, // REMAINS FALSE UNTIL FIRM ONBOARDING STEP 4
            },
          },
          session: res.data.session,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error verifying OTP code.' };
    }
  }

  // Local fallback
  const fallbackUser = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    user_metadata: {
      full_name: stagedReg?.fullName || cleanEmail.split('@')[0],
      phone: stagedReg?.phone || '',
      onboardingCompleted: false,
    },
  };

  return {
    success: true,
    data: {
      user: fallbackUser,
      session: { access_token: `token_${Date.now()}`, user: fallbackUser },
    },
  };
}

/**
 * Backward compatibility alias for verifyRegistrationEmailOtp
 */
export async function verifyRegistrationOtp(
  email: string,
  token: string
): Promise<AuthResult<{ user: any; session: any }>> {
  return verifyRegistrationEmailOtp(email, token);
}

/**
 * Step 3 of Register: Set password for the authenticated user
 */
export async function setUserPassword(
  password: string,
  additionalMetadata?: { fullName?: string; phone?: string; email?: string }
): Promise<AuthResult> {
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: { password: string; data?: Record<string, any> } = {
        password,
      };

      if (additionalMetadata) {
        updatePayload.data = {
          full_name: additionalMetadata.fullName || stagedReg?.fullName,
          phone: additionalMetadata.phone || stagedReg?.phone,
          onboardingCompleted: false, // STILL FALSE UNTIL STEP 4 IS COMPLETED
        };
      }

      const { data, error } = await supabase.auth.updateUser(updatePayload);
      if (error) {
        return { success: false, error: error.message };
      }

      if (stagedReg) {
        stagedReg.passwordSet = true;
        try { sessionStorage.setItem('maps_staged_reg', JSON.stringify(stagedReg)); } catch {}
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to set password.' };
    }
  }

  return { success: true };
}

/**
 * Step 4 of Register: Save firm & company onboarding information
 * MANDATORY: Validates GSTIN, PAN, Phone, Legal Name, Address before completing registration.
 * Marks onboardingCompleted: true only when all checks pass.
 */
export async function saveFirmDetails(
  firm: FirmDetailsPayload,
  userMetadata?: { fullName?: string; phone?: string; role?: UserRole }
): Promise<AuthResult> {
  // 1. Strict Firm Name Validation
  if (!firm.legalName || firm.legalName.trim().length < 3) {
    return {
      success: false,
      error: 'Firm legal entity name is compulsory (minimum 3 characters).'
    };
  }

  // 2. Strict GSTIN Validation (Compulsory for Indian Entity Setup)
  if (!firm.gstin || firm.gstin.trim().length !== 15) {
    return {
      success: false,
      error: 'A valid 15-character GSTIN is compulsory for firm onboarding.'
    };
  }

  const gstCheck = validateGSTIN(firm.gstin);
  if (!gstCheck.isValid) {
    return {
      success: false,
      error: gstCheck.message
    };
  }

  // 3. Strict PAN Validation
  const panToCheck = firm.pan || firm.gstin.substring(2, 12);
  const panCheck = validatePAN(panToCheck);
  if (!panCheck.isValid) {
    return {
      success: false,
      error: panCheck.message
    };
  }

  // 4. Strict Phone Validation (compulsory unique phone number)
  const firmPhone = firm.phone || userMetadata?.phone || stagedReg?.phone || '';
  const phoneCheck = validatePhoneIN(firmPhone);
  if (!phoneCheck.isValid) {
    return {
      success: false,
      error: 'A valid mobile phone number is compulsory for firm records.'
    };
  }

  // 5. Strict Address Validation
  if (!firm.registeredAddress || !firm.city || !firm.state || !firm.pincode) {
    return {
      success: false,
      error: 'Registered office address, City, State, and PIN Code are compulsory.'
    };
  }

  const normalizedPayload: FirmDetailsPayload = {
    ...firm,
    pan: panToCheck.toUpperCase(),
    gstin: firm.gstin.trim().toUpperCase(),
    phone: phoneCheck.normalized || firmPhone,
  };

  try {
    // 1. Update user auth metadata with firm details and completed status
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            firm: normalizedPayload,
            onboardingCompleted: true, // EXPLICITLY MARKED COMPLETE ONLY HERE AT STEP 4
            full_name: userMetadata?.fullName || stagedReg?.fullName,
            phone: normalizedPayload.phone,
            role: userMetadata?.role || 'super_admin',
          },
        });
      } catch (sbErr) {
        console.warn('Supabase updateUser warning:', sbErr);
      }
    }

    // 2. Persist locally for verified status
    try {
      localStorage.setItem('maps_firm_details', JSON.stringify(normalizedPayload));
      localStorage.setItem('maps_onboarding_completed', 'true');
      if (normalizedPayload.primaryPort) {
        localStorage.setItem('maps_pref_port', normalizedPayload.primaryPort);
      }
      sessionStorage.removeItem('maps_staged_reg');
    } catch {}

    // 3. Best-effort insert/upsert to PostgreSQL 'organizations' table
    if (isSupabaseConfigured && supabase) {
      try {
        const orgCode = (normalizedPayload.tradeName || normalizedPayload.legalName || 'MAPS')
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 10)
          .toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

        await supabase.from('organizations').upsert(
          {
            code: orgCode,
            name: normalizedPayload.legalName,
            gstin: normalizedPayload.gstin,
            pan: normalizedPayload.pan,
            iec_code: normalizedPayload.iec || null,
            state_code: normalizedPayload.gstin.slice(0, 2),
            settings: {
              tradeName: normalizedPayload.tradeName,
              city: normalizedPayload.city,
              address: normalizedPayload.registeredAddress,
              phone: normalizedPayload.phone,
              email: normalizedPayload.email,
              businessType: normalizedPayload.businessType,
            },
          },
          { onConflict: 'code', ignoreDuplicates: true }
        );
      } catch {}
    }

    return { success: true, data: normalizedPayload };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save firm compliance details' };
  }
}

/**
 * Direct Login: Email and Password with Mandatory Onboarding Verification
 */
export async function loginWithEmailPassword(
  emailOrUsername: string,
  password: string
): Promise<AuthResult<{ user: any; session: any; isOnboardingComplete: boolean }>> {
  let email = emailOrUsername.trim().toLowerCase();
  if (!email.includes('@')) {
    email = `${email}@mapsfreight.com`;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const user = data.user;
      const meta = user?.user_metadata || {};
      const firm = meta.firm;
      const isOnboardingComplete = Boolean(meta.onboardingCompleted && firm?.legalName && firm?.gstin);

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          isOnboardingComplete,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  }

  // Local/Offline Mode Fallback:
  const savedFirm = (() => {
    try {
      const raw = localStorage.getItem('maps_firm_details');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const isOnboardingComplete = localStorage.getItem('maps_onboarding_completed') === 'true' && Boolean(savedFirm?.gstin);

  const fallbackUser = {
    id: 'usr-local-session',
    email,
    user_metadata: {
      full_name: email.split('@')[0],
      role: 'super_admin',
      onboardingCompleted: isOnboardingComplete,
      firm: savedFirm,
    },
  };

  return {
    success: true,
    data: {
      user: fallbackUser,
      session: { access_token: 'local-session-token', user: fallbackUser },
      isOnboardingComplete,
    },
  };
}

/**
 * Password Reset: Send reset instructions to user's email
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send password reset' };
  }
}

/**
 * Sign out user and clear session completely
 */
export async function signOutUser(): Promise<AuthResult> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  }

  try {
    localStorage.removeItem('maps_supabase_session');
    localStorage.removeItem('maps_current_user');
    localStorage.removeItem('maps_onboarding_completed');
    sessionStorage.removeItem('maps_staged_reg');
  } catch {}

  return { success: true };
}

/**
 * Helper to convert Supabase auth user object to App User interface
 */
export function formatSupabaseUser(authUser: any): User {
  const meta = authUser?.user_metadata || {};
  const email = authUser?.email || 'user@mapsfreight.com';
  const name = meta.full_name || email.split('@')[0];
  const role: UserRole = meta.role || 'super_admin';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: authUser.id,
    name,
    email,
    phone: meta.phone || '',
    role,
    avatar: initials || 'AD',
    title: meta.title || (role === 'super_admin' ? 'Managing Director / Super Admin' : 'Operations Lead'),
    department: meta.department || 'Commercial & Operations',
    status: 'active',
    lastLogin: new Date().toISOString(),
    onboardingCompleted: Boolean(meta.onboardingCompleted),
  };
}
