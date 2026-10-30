# Supabase Auth & Resend Setup Guide (8-Digit OTP & Firm Onboarding)

This document provides exact, step-by-step instructions to configure your **Supabase Project** and **Resend** email service for **8-Digit OTP Verification** and company onboarding.

---

## 1. Configure 8-Digit OTP in Supabase

By default, Supabase sends 6-digit OTP codes. To enable the required **8-digit OTP**:

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project (`tmglukqjjplkxbosevkl`).
3. In the left navigation, go to **Authentication** -> **Configuration** (or **Email** under Providers).
4. Under **Email Provider Settings**:
   - **OTP Length**: Change from `6` to `8`.
   - **OTP Expiry**: Set to `600` seconds (10 minutes) or your preferred expiry window.
   - Ensure **Confirm email** is enabled (or **Enable Email Signup** is ON).
5. Click **Save Changes**.

> [!NOTE]
> If your Supabase dashboard version uses the Auth Configuration page:
> Navigate to **Project Settings** -> **Authentication** -> Scroll down to **Email Auth** -> Set **OTP code length** = `8`.

---

## 2. Connect Resend SMTP with Supabase

Resend provides enterprise-grade inbox deliverability for your transactional emails.

### A. Obtain Resend Credentials
1. Go to your [Resend Dashboard](https://resend.com/api-keys).
2. Verify your sending domain (e.g., `yourdomain.com` or `mapsai.in`) under **Domains**.
3. Create an API Key with **Full Access** or **Sending Access**. Copy the key (starts with `re_...`).

### B. Configure Custom SMTP in Supabase
1. In the Supabase Dashboard, go to **Project Settings** -> **Authentication** (or **Settings** -> **Auth**).
2. Scroll to the **SMTP Settings** section.
3. Toggle **Enable Custom SMTP** to **ON**.
4. Fill in the following credentials:
   - **Sender email**: `noreply@yourdomain.com` (Must match a verified domain in your Resend account)
   - **Sender name**: `MAPS NVOCC Pro` (or your company brand name)
   - **Host**: `smtp.resend.com`
   - **Port Number**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: `re_your_resend_api_key`
5. Click **Save Changes** and click **Send Test Email** to confirm Resend delivery.

---

## 3. Customize the Email Template with `{{ .Token }}`

To ensure the user receives the 8-digit OTP prominently in the email body:

1. In the Supabase Dashboard, go to **Authentication** -> **Email Templates**.
2. Select the **Magic Link** template (used by `signInWithOtp`):
   - **Subject**: `Your 8-Digit Verification Code — MAPS NVOCC Pro`
   - **Body (HTML)**:
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0A1628; color: #F4EFE6; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #E88B2A; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">MAPS NVOCC PRO</h1>
    <p style="color: #A8A299; font-size: 13px; margin: 4px 0 0 0;">Enterprise Maritime & Container Operating System</p>
  </div>

  <div style="background-color: #0F1D33; border: 1px solid #1C2E4C; border-radius: 12px; padding: 24px; text-align: center;">
    <h2 style="font-size: 18px; margin-top: 0; color: #FFFFFF;">Verify Your Email Address</h2>
    <p style="color: #A8A299; font-size: 13px; line-height: 1.5;">
      Use the following 8-digit verification code to complete your firm's registration:
    </p>

    <!-- 8-DIGIT OTP DISPLAY -->
    <div style="background-color: #070E1A; border: 2px dashed #E88B2A; border-radius: 12px; padding: 16px; margin: 20px 0; display: inline-block;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #E88B2A;">
        {{ .Token }}
      </span>
    </div>

    <p style="color: #6E6A64; font-size: 11px; margin-bottom: 0;">
      This code is valid for 10 minutes. If you did not initiate this request, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; margin-top: 24px; color: #6E6A64; font-size: 11px;">
    © 2026 MAPS Freight Solutions Pvt Ltd • Mundra • Gandhidham • Kandla • Nhava Sheva
  </div>
</div>
```
3. Select the **Confirmation (Signup)** template as well and apply the same `{{ .Token }}` pattern.
4. Click **Save Changes**.

---

## 4. How the 4-Step Registration & Login Works

### Registration Workflow:
1. **Step 1 (Contact)**:
   - User inputs their Full Name, Email, and Phone number.
   - Clicks **"Send 8-Digit Verification Code"**.
   - Front-end executes: `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`.
   - Resend delivers the email with the 8-digit OTP.

2. **Step 2 (8-Digit OTP)**:
   - UI provides 8 auto-advancing, paste-supported digit inputs (`[ ][ ][ ][ ] - [ ][ ][ ][ ]`) with a 60s countdown timer.
   - Front-end executes: `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
   - Supabase verifies the token and establishes an active JWT session.

3. **Step 3 (Password Set)**:
   - User inputs their master account password with real-time strength validation.
   - Front-end executes: `supabase.auth.updateUser({ password })`.

4. **Step 4 (Firm & Company Details)**:
   - User fills in:
     - Firm Legal Entity Name & Brand Name
     - Business Category (NVOCC, Freight Forwarder, CHA, Liner Agent, Shipper)
     - GSTIN (with Indian state code & checksum validation)
     - PAN & IEC Code
     - Registered Address, Port City, State, PIN Code
     - Operating Port Base (e.g., `INMUN1` Mundra, `INNSA` Nhava Sheva)
     - Primary Bank Account (for BL and invoice footers)
   - Front-end calls: `saveFirmDetails(firmPayload)`.
   - Data is stored in Supabase user metadata and synchronized with `organizations` master table.
   - User enters Dashboard immediately with their company profile active!

### Direct Login:
- User enters their Email / Username and Password.
- Front-end executes `supabase.auth.signInWithPassword({ email, password })`.
- Session persists across restarts via localStorage and Supabase client token auto-refresh.
- Quick **"Fast Demo Sign-in"** buttons are available for instant evaluation without typing.
- Forgot Password modal supports sending password recovery links via Resend.
