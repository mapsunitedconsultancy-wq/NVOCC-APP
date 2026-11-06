-- ============================================================================
-- MAPS NVOCC Pro — Ensure public.users and public.tenants are writable by registered users
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tmglukqjjplkxbosevkl/sql/new
-- ============================================================================

-- 1. Ensure primary default tenant exists so foreign key references never fail
INSERT INTO public.tenants (id, code, legal_name, trade_name, gstin, pan, iec, base_currency, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MAPS-HQ',
  'MAPS Freight Solutions Pvt Ltd',
  'MAPS NVOCC PRO',
  '24AARCM6698J1ZK',
  'AARCM6698J',
  'AARCM6698J',
  'INR',
  true
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = clock_timestamp();

-- 2. Configure Row Level Security (RLS) on public.tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_read_authenticated" ON public.tenants;
CREATE POLICY "tenants_read_authenticated" ON public.tenants
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "tenants_manage_authenticated" ON public.tenants;
CREATE POLICY "tenants_manage_authenticated" ON public.tenants
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Configure Row Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_all_authenticated" ON public.users;
CREATE POLICY "users_read_all_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own" ON public.users;
CREATE POLICY "users_manage_own" ON public.users
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Grant table privileges to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.tenants TO service_role;

