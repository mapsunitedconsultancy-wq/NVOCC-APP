-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 07: Supabase Row Level Security (RLS) & Multi-Tenant Access Control
-- Strict Security Enforcement for 100k+ Users (Tenants, RBAC & Customer Portal)
-- ============================================================================

-- 1. Helper Functions to Extract Auth JWT Context
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
DECLARE
  v_org_id TEXT;
BEGIN
  -- 1. Check custom claim in JWT app_metadata
  v_org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id');
  
  -- 2. Fallback to public.users lookup
  IF v_org_id IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT org_id::TEXT INTO v_org_id FROM users WHERE id = auth.uid();
  END IF;

  RETURN v_org_id::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role');
  
  IF v_role IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT role::TEXT INTO v_role FROM users WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(v_role, 'customer')::user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Enable RLS on All Tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_bills_of_lading ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_bills_of_lading ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_general_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE egm_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_general_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cha_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucking_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dangerous_goods_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfs_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_accounting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Multi-Tenant Organization Isolation Policies
-- Organization Master
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth_org_id() OR auth_user_role() = 'super_admin');

-- Users Directory
CREATE POLICY "Users can view team members in same org"
  ON users FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Super Admins can manage users in org"
  ON users FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() = 'super_admin');

-- Parties (CRM)
CREATE POLICY "Org members can read parties"
  ON parties FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Internal staff can manage parties"
  ON parties FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations', 'sales', 'finance'));

-- Vessels & Ports (Public/Global Reference data)
CREATE POLICY "All authenticated users can read vessels and ports"
  ON vessels FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can read voyages"
  ON voyages FOR SELECT TO authenticated USING (true);

-- Shipments: Internal Staff vs Customer Portal Isolation
CREATE POLICY "Staff can view and manage shipments in org"
  ON shipments FOR ALL
  USING (
    org_id = auth_org_id() 
    AND auth_user_role() IN ('super_admin', 'operations', 'finance', 'sales')
  );

CREATE POLICY "Customers can view only their own consignments"
  ON shipments FOR SELECT
  USING (
    org_id = auth_org_id() 
    AND auth_user_role() = 'customer'
    AND (
      shipper_id IN (SELECT party_id FROM users WHERE id = auth.uid())
      OR consignee_id IN (SELECT party_id FROM users WHERE id = auth.uid())
    )
  );

-- House Bills of Lading
CREATE POLICY "Org staff can manage HBLs"
  ON house_bills_of_lading FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations', 'finance'));

CREATE POLICY "Customers can view their issued HBLs"
  ON house_bills_of_lading FOR SELECT
  USING (
    org_id = auth_org_id() 
    AND auth_user_role() = 'customer'
    AND (
      shipper_id IN (SELECT party_id FROM users WHERE id = auth.uid())
      OR consignee_id IN (SELECT party_id FROM users WHERE id = auth.uid())
    )
  );

-- Containers & Telemetry
CREATE POLICY "Org members can view and track containers"
  ON containers FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Operations staff can manage containers"
  ON containers FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations'));

CREATE POLICY "Org members can view container events"
  ON container_tracking_events FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Operations can insert container tracking telemetry"
  ON container_tracking_events FOR INSERT
  WITH CHECK (org_id = auth_org_id());

-- Invoicing & Financial Accounting
CREATE POLICY "Finance & Admins can manage invoices"
  ON invoices FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'finance'));

CREATE POLICY "Sales & Operations can view invoices"
  ON invoices FOR SELECT
  USING (org_id = auth_org_id() AND auth_user_role() IN ('operations', 'sales'));

CREATE POLICY "Customers can view invoices billed to them"
  ON invoices FOR SELECT
  USING (
    org_id = auth_org_id() 
    AND auth_user_role() = 'customer'
    AND party_id IN (SELECT party_id FROM users WHERE id = auth.uid())
  );

-- Invoices Line Items (Cascaded via Invoice ID)
CREATE POLICY "Invoice line items access follows invoice access"
  ON invoice_items FOR ALL
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE org_id = auth_org_id())
  );

-- Approval Requests (Management Authorization)
CREATE POLICY "Org staff can view approvals"
  ON approval_requests FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Staff can submit approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Super Admins and Managers can review approvals"
  ON approval_requests FOR UPDATE
  USING (
    org_id = auth_org_id() 
    AND auth_user_role() IN ('super_admin', 'finance')
  );

-- Manifests (EGM & IGM)
CREATE POLICY "Operations and Admins can manage manifests"
  ON export_general_manifests FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations'));

CREATE POLICY "Operations and Admins can manage IGM"
  ON import_general_manifests FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations'));

-- Delivery Orders
CREATE POLICY "Staff can manage delivery orders"
  ON delivery_orders FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations', 'finance'));

-- Trucking & Drayage
CREATE POLICY "Staff can manage trucking haulage"
  ON trucking_jobs FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations'));

-- Dangerous Goods Declarations
CREATE POLICY "Staff can manage DG declarations"
  ON dangerous_goods_declarations FOR ALL
  USING (org_id = auth_org_id() AND auth_user_role() IN ('super_admin', 'operations'));

-- Audit Logs (Append-Only Protection)
CREATE POLICY "Users can read audit logs in their org"
  ON audit_logs FOR SELECT
  USING (org_id = auth_org_id() AND auth_user_role() = 'super_admin');

CREATE POLICY "System and staff can record audit events"
  ON audit_logs FOR INSERT
  WITH CHECK (org_id = auth_org_id());
