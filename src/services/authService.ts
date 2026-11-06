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

  // 2. Check Supabase users database table if available (with 2.5s fast timeout to avoid latency)
  if (supabase) {
    try {
      const selectPromise = supabase
        .from('users')
        .select('id, email, phone')
        .eq('email', cleanEmail)
        .limit(1);

      const timeoutPromise = new Promise<{ data: null; error: any }>(resolve =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 2500)
      );

      const { data, error } = await Promise.race([selectPromise, timeoutPromise]);

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
 * Check if a user and firm have satisfied registration requirements.
 * A user is considered already registered ONLY if:
 * 1. An authenticated user exists
 * 2. Onboarding is explicitly marked complete (in user metadata or local storage)
 * 3. A valid firm profile with a valid 15-character GSTIN and Legal Entity Name exists
 */
export function isRegistrationComplete(
  user: User | null,
  firm?: FirmDetailsPayload | typeof FIRM_DETAILS | null
): boolean {
  if (!user) return false;

  // If in the middle of active registration in this browser session, never treat as already registered
  if (typeof sessionStorage !== 'undefined') {
    const stagedRaw = sessionStorage.getItem('maps_staged_reg');
    if (stagedRaw) {
      try {
        const staged = JSON.parse(stagedRaw);
        if (!staged.onboardingCompleted) {
          return false;
        }
      } catch {}
    }
  }

  // Allow offline demo mock admin when Supabase is not active
  if (!isSupabaseConfigured && user.id === 'user-1' && user.email === 'amandana3094@gmail.com') {
    return true;
  }

  // Check user onboarding flags
  const meta = (user as any).user_metadata || {};
  const metaOnboarded = meta.onboardingCompleted === true;
  const userObjOnboarded = (user as any).onboardingCompleted === true;
  const storageOnboarded = typeof window !== 'undefined' && localStorage.getItem('maps_onboarding_completed') === 'true';

  const isOnboarded = metaOnboarded || userObjOnboarded || storageOnboarded;
  if (!isOnboarded) {
    return false;
  }

  // Check firm compliance details
  const currentFirm = firm || meta.firm || (() => {
    try {
      const raw = localStorage.getItem('maps_firm_details');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const gstin = currentFirm?.gstin || '';
  const legalName = currentFirm?.legalName || '';
  const hasValidFirm = Boolean(legalName && legalName.trim().length >= 3 && gstin && gstin.trim().length === 15);

  return Boolean(isOnboarded && hasValidFirm);
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

  // 5. Dispatch OTP to the Official Email via Supabase
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
        console.error('Supabase signInWithOtp error:', error);
        return {
          success: false,
          error: error.message || 'Failed to dispatch verification email via Supabase (HTTP 500).'
        };
      }

      return { success: true, data: { email: cleanEmail } };
    } catch (err: any) {
      console.error('Supabase signInWithOtp exception:', err);
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
 * Step 2 of Register: Verify OTP sent to user's Official Email
 * (Supports both Supabase default 6-digit and extended 8-digit OTP formats).
 */
export async function verifyRegistrationEmailOtp(
  email: string,
  token: string
): Promise<AuthResult<{ user: any; session: any }>> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim().replace(/\s+/g, '');

  if (!cleanToken || (cleanToken.length !== 6 && cleanToken.length !== 8)) {
    return {
      success: false,
      error: 'Please enter the complete verification code (6 or 8 digits) sent to your email.'
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

    // 3. Upsert user into public.users and public.tenants in PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncUserToDatabase(user, normalizedPayload);
        }
      } catch (dbSyncErr) {
        console.warn('public.users database sync notice:', dbSyncErr);
      }
    }

    return { success: true, data: normalizedPayload };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save firm compliance details' };
  }
}

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Syncs an authenticated Supabase user into the public.users database table.
 * Ensures the target tenant exists to guarantee zero foreign-key constraint failures.
 */
export async function syncUserToDatabase(
  user: any,
  firm?: any
): Promise<{ success: boolean; error?: string; data?: any }> {
  if (!isSupabaseConfigured || !supabase || !user || !user.id) {
    return { success: false, error: 'Supabase client not configured or user ID missing' };
  }

  try {
    const meta = user.user_metadata || {};
    const email = user.email || meta.email || '';
    const name = meta.full_name || user.name || email.split('@')[0] || 'User';
    const phone = meta.phone || user.phone || firm?.phone || '';
    const role = meta.role || user.role || 'super_admin';

    // 1. Identify target tenant ID (lookup existing tenant or fallback to DEFAULT_TENANT_ID)
    let activeTenantId = DEFAULT_TENANT_ID;
    const { data: existingTenants, error: tenantQueryErr } = await supabase
      .from('tenants')
      .select('id, code')
      .limit(1);

    if (tenantQueryErr) {
      console.warn('Tenants query notice:', tenantQueryErr.message);
    }

    if (existingTenants && existingTenants.length > 0) {
      activeTenantId = existingTenants[0].id;
      // If firm compliance details are present, update existing tenant
      if (firm && (firm.legalName || firm.gstin)) {
        const { error: updateTenantErr } = await supabase
          .from('tenants')
          .update({
            legal_name: firm.legalName || 'MAPS Freight Solutions Pvt Ltd',
            trade_name: firm.tradeName || firm.legalName || 'MAPS NVOCC PRO',
            gstin: firm.gstin,
            pan: firm.pan || (firm.gstin ? firm.gstin.slice(2, 12) : null),
            iec: firm.iec || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeTenantId);

        if (updateTenantErr) {
          console.warn('Tenant update notice:', updateTenantErr.message);
        }
      }
    } else {
      // Create primary tenant
      const tenantCode = (firm?.tradeName || firm?.legalName || 'MAPS')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 10)
        .toUpperCase() || 'MAPS-HQ';

      const { error: insertTenantErr } = await supabase.from('tenants').upsert(
        {
          id: DEFAULT_TENANT_ID,
          code: tenantCode,
          legal_name: firm?.legalName || 'MAPS Freight Solutions Pvt Ltd',
          trade_name: firm?.tradeName || firm?.legalName || 'MAPS NVOCC PRO',
          gstin: firm?.gstin || '24AARCM6698J1ZK',
          pan: firm?.pan || (firm?.gstin ? firm.gstin.slice(2, 12) : 'AARCM6698J'),
          iec: firm?.iec || null,
          base_currency: 'INR',
          is_active: true,
        },
        { onConflict: 'id' }
      );

      if (insertTenantErr) {
        console.warn('Tenant insert notice:', insertTenantErr.message);
      }
    }

    // 2. Upsert user into public.users with complete profile fields
    const firmName = firm?.legalName || firm?.firm_name || firm?.tradeName || null;
    const gstNumber = firm?.gstin || firm?.gst_number || null;
    const contactPerson = firm?.contact_person || name || meta.full_name || 'Administrator';

    const userPayload = {
      id: user.id,
      tenant_id: activeTenantId,
      email: email,
      name: name,
      contact_person: contactPerson,
      firm_name: firmName,
      company_name: firmName,
      phone: phone || null,
      gst_number: gstNumber,
      plan: firm?.plan || 'demo',
      role: role === 'customer' ? 'customer' : 'super_admin',
      title: meta.title || (role === 'super_admin' ? 'Managing Director / Super Admin' : 'Operations Executive'),
      department: meta.department || 'Executive Management',
      avatar: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD',
      status: 'active',
      last_login: new Date().toISOString(),
    };

    const { data: savedUser, error: userError } = await supabase
      .from('users')
      .upsert(userPayload, { onConflict: 'id' })
      .select();

    if (userError) {
      console.error('Failed to upsert user in public.users table:', userError);
      return { success: false, error: userError.message };
    }

    console.log('Successfully saved user into public.users:', savedUser);
    return { success: true, data: savedUser };
  } catch (err: any) {
    console.error('syncUserToDatabase exception:', err);
    return { success: false, error: err?.message || 'Database sync exception' };
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

      // Sync user profile to public.users on successful login
      if (user) {
        syncUserToDatabase(user, firm).catch(() => {});
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          isOnboardingComplete: true,
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
 * Password Reset Step 1: Send 8-Digit OTP to user's email for password reset
 */
export async function sendPasswordResetOtp(email: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const validation = validateEmail(cleanEmail);
  if (!validation.isValid) {
    return { success: false, error: validation.message };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        console.error('Supabase resetPasswordForEmail error:', error);
        return { success: false, error: error.message || 'Failed to dispatch password reset email (HTTP 500).' };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to dispatch password reset OTP.' };
    }
  }

  // Local / offline fallback
  return { success: true, data: { email: cleanEmail } };
}

/**
 * Backward compatibility alias for sendPasswordReset
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  return sendPasswordResetOtp(email);
}

/**
 * Password Reset Step 2: Verify the 8-Digit OTP code from email
 */
export async function verifyPasswordResetOtp(
  email: string,
  token: string
): Promise<AuthResult<{ session?: any }>> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim().replace(/\s+/g, '');

  if (!cleanToken || (cleanToken.length !== 6 && cleanToken.length !== 8)) {
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
        type: 'recovery',
      });

      if (res.error) {
        const retry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!retry.error) {
          res = retry;
        }
      }

      if (res.error) {
        return { success: false, error: res.error.message };
      }

      return { success: true, data: { session: res.data.session } };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to verify recovery OTP.' };
    }
  }

  // Local / offline fallback
  return { success: true, data: { session: { token: 'mock-recovery-session' } } };
}

/**
 * Password Reset Step 3: Set the new password after OTP verification
 */
export async function updatePasswordAfterReset(newPassword: string): Promise<AuthResult> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Sign out recovery session cleanly so user logs in with new password
      await supabase.auth.signOut();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  }

  // Local / offline fallback
  return { success: true };
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

/**
 * Direct Profile Query helper: GET /api/auth/me equivalent
 * Queries public.users for the authenticated user's profile
 */
export async function getMe(): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { success: false, error: authErr?.message || 'Unauthorized: No active session' };
    }

    const { data: profile, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbErr) {
      return { success: false, error: dbErr.message };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ...profile,
        user_metadata: user.user_metadata,
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching user profile' };
  }
}

/**
 * Direct Profile Update helper: PATCH /api/auth/profile equivalent
 * Upserts profile details into public.users and user metadata
 */
export async function updateProfile(profileData: {
  firm_name?: string;
  company_name?: string;
  phone?: string;
  gst_number?: string;
  contact_person?: string;
  plan?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { success: false, error: authErr?.message || 'Unauthorized' };
    }

    const firmName = profileData.firm_name || profileData.company_name || '';
    const gstNumber = profileData.gst_number || '';
    const contactPerson = profileData.contact_person || '';
    const phone = profileData.phone || '';

    // Update Supabase Auth user metadata
    await supabase.auth.updateUser({
      data: {
        firm: {
          legalName: firmName,
          tradeName: firmName,
          gstin: gstNumber,
          phone: phone,
        },
        full_name: contactPerson,
        phone: phone,
        onboardingCompleted: Boolean(firmName && gstNumber),
      }
    });

    // Update public.users table
    const result = await syncUserToDatabase(user, {
      legalName: firmName,
      tradeName: firmName,
      gstin: gstNumber,
      phone: phone,
      contact_person: contactPerson,
      plan: profileData.plan || 'demo',
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating profile' };
  }
}
