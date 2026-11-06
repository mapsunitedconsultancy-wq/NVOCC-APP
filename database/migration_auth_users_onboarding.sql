-- ============================================================================
-- SUPABASE DATABASE MIGRATION: AUTH & USER ONBOARDING SYSTEM
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tmglukqjjplkxbosevkl/sql/new
-- ============================================================================

-- 1. Ensure public.users table exists with all required onboarding columns
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  firm_name TEXT,
  company_name TEXT,
  phone TEXT,
  gst_number TEXT,
  contact_person TEXT,
  plan TEXT DEFAULT 'demo',
  role TEXT DEFAULT 'super_admin',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. If public.users already existed with previous schema, add missing columns safely
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firm_name TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gst_number TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_person TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'demo';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'super_admin';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  
  -- Relax legacy strict constraints so onboarding flow never fails
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN tenant_id DROP NOT NULL;
    ALTER TABLE public.users ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- 3. Ensure default tenant exists so foreign key constraints never break
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  gstin VARCHAR(15),
  pan VARCHAR(10),
  iec VARCHAR(10),
  base_currency CHAR(3) NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

INSERT INTO public.tenants (id, code, legal_name, trade_name, gstin, pan, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MAPS-HQ',
  'MAPS Freight Solutions Pvt Ltd',
  'MAPS NVOCC PRO',
  '24AARCM6698J1ZK',
  'AARCM6698J',
  true
)
ON CONFLICT (id) DO UPDATE SET updated_at = clock_timestamp();

-- 4. Clean up any broken triggers on auth.users that cause "Database error saving new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 5. Row-Level Security (RLS) Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own record or all authenticated users in workspace
DROP POLICY IF EXISTS "users_read_all_authenticated" ON public.users;
CREATE POLICY "users_read_all_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- Allow public / anon to check if email exists for registration & password reset
DROP POLICY IF EXISTS "users_anon_check_email" ON public.users;
CREATE POLICY "users_anon_check_email" ON public.users
  FOR SELECT TO anon
  USING (true);

-- Allow authenticated users to insert their own record
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow full access to tenants
DROP POLICY IF EXISTS "tenants_authenticated_all" ON public.tenants;
CREATE POLICY "tenants_authenticated_all" ON public.tenants
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions to roles
GRANT ALL ON public.users TO authenticated, anon, service_role;
GRANT ALL ON public.tenants TO authenticated, anon, service_role;

