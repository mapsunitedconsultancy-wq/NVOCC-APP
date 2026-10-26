-- ============================================================================
-- MAPS NVOCC PRO — SUPABASE BACKEND MASTER ARCHITECTURE BIBLE
-- Production-Ready PostgreSQL DDL, Multi-Tenancy, RLS, Functions & Seed Data
-- Designed for High-Throughput (100,000+ Concurrent Operations)
-- Target: Supabase SQL Editor
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: EXTENSIONS & DOMAIN ENUMS
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- User Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'operations',
    'finance',
    'sales',
    'documentation',
    'customer',
    'agent'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shipment Statuses
DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM (
    'quoted',
    'booked',
    'si_received',
    'stuffed',
    'gated_in',
    'on_vessel',
    'in_transit',
    'arrived',
    'do_issued',
    'delivered',
    'closed',
    'rolled',
    'short_shipped',
    'on_hold',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Logistics Enums
DO $$ BEGIN CREATE TYPE job_type AS ENUM ('export', 'import', 'cross_trade'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transport_mode AS ENUM ('ocean_fcl', 'ocean_lcl', 'air', 'multimodal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE service_type AS ENUM ('fcl', 'lcl', 'breakbulk'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE incoterm_type AS ENUM ('EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE container_lifecycle_stage AS ENUM (
  'empty_picked_up', 'stuffing', 'gated_in', 'loaded', 'on_vessel', 'discharged', 'at_cfs', 'delivered', 'empty_returned'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bills of Lading Enums
DO $$ BEGIN CREATE TYPE mbl_status AS ENUM ('draft', 'issued', 'originals_received', 'telex_released'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE hbl_status AS ENUM ('draft', 'confirmed', 'printed', 'released', 'surrendered', 'telex'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE bl_type AS ENUM ('original', 'seaway', 'surrendered', 'telex'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE freight_term AS ENUM ('prepaid', 'collect'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Financial & Customs Enums
DO $$ BEGIN CREATE TYPE invoice_type AS ENUM ('tax', 'proforma', 'debit_note', 'credit_note'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE export_tax_type AS ENUM ('lut_without_igst', 'with_igst', 'sez', 'domestic'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE do_status AS ENUM ('draft', 'issued', 'presented', 'released', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE quote_stage AS ENUM ('rfq_received', 'drafted', 'sent', 'negotiating', 'won', 'lost', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE si_channel AS ENUM ('whatsapp', 'portal', 'email', 'manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE si_status AS ENUM ('unparsed', 'parsed', 'matched', 'converted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE egm_status AS ENUM ('draft', 'filed', 'amended', 'acknowledged', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE igm_status AS ENUM ('draft', 'agent_manifest_uploaded', 'reconciled', 'filed', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: TENANCY, USERS, NUMBERING & AUDIT
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Tenants (Multi-Tenancy Root)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  gstin VARCHAR(15),
  pan VARCHAR(10),
  iec VARCHAR(10),
  mto_reg_no VARCHAR(64),
  logo_url TEXT,
  letterhead_url TEXT,
  subscription_plan VARCHAR(32) NOT NULL DEFAULT 'growth',
  base_currency CHAR(3) NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(128) NOT NULL,
  city VARCHAR(64) NOT NULL,
  state VARCHAR(64) NOT NULL,
  state_code VARCHAR(2) NOT NULL,
  gstin VARCHAR(15) NOT NULL,
  is_head_office BOOLEAN NOT NULL DEFAULT FALSE,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_branch UNIQUE (tenant_id, code)
);

-- 3. Users (Integrates with Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- References auth.users(id)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  role user_role NOT NULL DEFAULT 'operations',
  title VARCHAR(128) DEFAULT 'Operations Executive',
  department VARCHAR(64) DEFAULT 'Operations',
  avatar VARCHAR(8) DEFAULT 'AD',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  preferences JSONB NOT NULL DEFAULT '{"default_port": "INMUN1", "currency": "INR"}'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

-- 4. Gapless Document Numbering Series
CREATE TABLE IF NOT EXISTS number_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  doc_type VARCHAR(32) NOT NULL, -- 'shipment', 'hbl', 'mbl', 'do', 'invoice', 'quotation', 'egm', 'credit_note'
  financial_year VARCHAR(8) NOT NULL, -- e.g. '2425', '2526'
  prefix VARCHAR(32) NOT NULL,
  current_seq BIGINT NOT NULL DEFAULT 0,
  format VARCHAR(64) NOT NULL, -- e.g. 'MAPS/HBL/{FY}/{SEQ:05}'
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_series_alloc UNIQUE (tenant_id, branch_id, doc_type, financial_year)
);

-- 5. System-Wide Audit Log (Append-Only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_table VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(16) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  before_snapshot JSONB,
  after_snapshot JSONB,
  actor_id UUID,
  actor_role VARCHAR(32),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. Transactional Outbox (Domain Events)
CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL, -- 'shipment.created', 'hbl.issued', 'invoice.paid'
  entity_id VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  processed_at TIMESTAMPTZ
);

-- 7. Webhook Subscriptions
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(128) NOT NULL,
  event_filters TEXT[] NOT NULL DEFAULT '{"*"}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 8. Integration Audit & Logs
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service VARCHAR(32) NOT NULL, -- 'GSTN', 'ICEGATE', 'NIC_EWB', 'AISENSY', 'RAZORPAY', 'GEMINI'
  endpoint TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status_code INT,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: MASTER & REFERENCE DATA REGISTRIES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ports (
  locode CHAR(5) PRIMARY KEY, -- e.g. 'INMUN', 'INNSA', 'DEHAM'
  name VARCHAR(128) NOT NULL,
  country_code CHAR(2) NOT NULL,
  port_type VARCHAR(16) NOT NULL DEFAULT 'seaport', -- seaport, icd, cfs, airport
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  icegate_port_code VARCHAR(10), -- e.g. 'INMUN1'
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS hs_codes (
  hs_code VARCHAR(10) PRIMARY KEY, -- 8-digit ITC-HS e.g. 69089090
  description TEXT NOT NULL,
  rodtep_rate NUMERIC(5,2) DEFAULT 0.00,
  drawback_rate NUMERIC(5,2) DEFAULT 0.00,
  default_gst_rate NUMERIC(5,2) DEFAULT 18.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS sac_codes (
  sac_code VARCHAR(8) PRIMARY KEY, -- e.g. '996521', '996611'
  description TEXT NOT NULL,
  default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS container_types (
  iso_code VARCHAR(4) PRIMARY KEY, -- '20GP', '40HC', '20RF', '40OT'
  name VARCHAR(64) NOT NULL,
  nominal_size_ft INT NOT NULL,
  max_cbm NUMERIC(6,2) NOT NULL,
  max_payload_kg NUMERIC(8,2) NOT NULL,
  tare_weight_kg NUMERIC(8,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS un_dangerous_goods (
  un_number CHAR(4) NOT NULL, -- e.g. '1993'
  psn TEXT NOT NULL, -- Proper Shipping Name
  imdg_class VARCHAR(8) NOT NULL, -- '3', '5.1', '8'
  packing_group VARCHAR(4), -- 'I', 'II', 'III'
  marine_pollutant BOOLEAN NOT NULL DEFAULT FALSE,
  segregation_group VARCHAR(32),
  ems_number VARCHAR(16),
  PRIMARY KEY (un_number, imdg_class)
);

CREATE TABLE IF NOT EXISTS shipping_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  scac_code VARCHAR(8) NOT NULL UNIQUE,
  free_days_default INT NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  imo_number VARCHAR(16) NOT NULL UNIQUE,
  line_id UUID REFERENCES shipping_lines(id) ON DELETE SET NULL,
  call_sign VARCHAR(16),
  flag_country CHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS cfs_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  code VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  address TEXT NOT NULL,
  contact_details JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS currencies (
  code CHAR(3) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  symbol VARCHAR(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code CHAR(3) NOT NULL REFERENCES currencies(code),
  rate_to_inr NUMERIC(12,4) NOT NULL,
  as_of_date DATE NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'ICEGATE/RBI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_daily_fx UNIQUE (currency_code, as_of_date)
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: CRM PARTIES & CREDIT PROFILES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  party_code VARCHAR(32) NOT NULL,
  party_types TEXT[] NOT NULL DEFAULT '{"shipper"}', -- 'shipper', 'consignee', 'notify', 'carrier', 'cha', 'agent', 'cfs', 'transporter'
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  gstin VARCHAR(15),
  pan VARCHAR(10),
  iec VARCHAR(10),
  cin VARCHAR(21),
  country CHAR(2) NOT NULL DEFAULT 'IN',
  state VARCHAR(64) NOT NULL DEFAULT 'Gujarat',
  state_code VARCHAR(2) NOT NULL DEFAULT '24',
  is_sez BOOLEAN NOT NULL DEFAULT FALSE,
  credit_limit NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  credit_days INT NOT NULL DEFAULT 30,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_party_code UNIQUE (tenant_id, party_code)
);

CREATE TABLE IF NOT EXISTS party_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  role_designation VARCHAR(64),
  email VARCHAR(255),
  phone VARCHAR(32),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS party_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  bank_name VARCHAR(128) NOT NULL,
  account_number VARCHAR(64) NOT NULL,
  ifsc_code VARCHAR(16),
  swift_code VARCHAR(16),
  branch_name VARCHAR(128),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS credit_profiles (
  party_id UUID PRIMARY KEY REFERENCES parties(id) ON DELETE CASCADE,
  credit_score INT NOT NULL DEFAULT 85 CHECK (credit_score BETWEEN 0 AND 100),
  avg_days_to_pay NUMERIC(6,2) DEFAULT 28.0,
  bounce_count INT NOT NULL DEFAULT 0,
  dispute_count INT NOT NULL DEFAULT 0,
  watchlist BOOLEAN NOT NULL DEFAULT FALSE,
  last_review_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 5: SHIPMENTS, CONTAINERS & D&D TELEMETRY
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS master_bls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mbl_no VARCHAR(64) NOT NULL,
  shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE RESTRICT,
  vessel_id UUID REFERENCES vessels(id) ON DELETE RESTRICT,
  voyage VARCHAR(32) NOT NULL,
  booking_ref VARCHAR(64),
  pol_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  ocean_freight NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  slot_teu INT NOT NULL DEFAULT 1,
  total_weight_mt NUMERIC(10,3) NOT NULL DEFAULT 0.000,
  status mbl_status NOT NULL DEFAULT 'draft',
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_mbl UNIQUE (tenant_id, mbl_no)
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
  shipment_no VARCHAR(32) NOT NULL,
  job_type job_type NOT NULL DEFAULT 'export',
  mode transport_mode NOT NULL DEFAULT 'ocean_fcl',
  service_type service_type NOT NULL DEFAULT 'fcl',
  incoterm incoterm_type NOT NULL DEFAULT 'FOB',
  status shipment_status NOT NULL DEFAULT 'booked',
  customer_ref VARCHAR(128),
  shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE SET NULL,
  vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  voyage VARCHAR(32),
  por_locode CHAR(5) REFERENCES ports(locode),
  pol_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  place_of_delivery_locode CHAR(5) REFERENCES ports(locode),
  etd TIMESTAMPTZ,
  eta TIMESTAMPTZ,
  atd TIMESTAMPTZ,
  ata TIMESTAMPTZ,
  mbl_id UUID REFERENCES master_bls(id) ON DELETE SET NULL,
  quotation_id UUID,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  is_dg BOOLEAN NOT NULL DEFAULT FALSE,
  total_revenue_inr NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  total_cost_inr NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  gross_margin_inr NUMERIC(18,2) GENERATED ALWAYS AS (total_revenue_inr - total_cost_inr) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_shipment_no UNIQUE (tenant_id, shipment_no)
);

CREATE TABLE IF NOT EXISTS shipment_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  role VARCHAR(32) NOT NULL, -- 'shipper', 'consignee', 'notify', 'cha', 'cfs', 'agent', 'transporter'
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_shipment_party_role UNIQUE (shipment_id, party_id, role)
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  location VARCHAR(128) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  source VARCHAR(32) NOT NULL DEFAULT 'PORT_GATE', -- 'PORT_GATE', 'ICEGATE', 'MANUAL', 'CARRIER_EDI'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS shipment_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  charge_code VARCHAR(32) NOT NULL,
  description VARCHAR(128) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  fx_rate NUMERIC(12,4) NOT NULL DEFAULT 1.0000,
  amount_inr NUMERIC(18,2) GENERATED ALWAYS AS (amount * fx_rate) STORED,
  sac_code VARCHAR(8) REFERENCES sac_codes(sac_code),
  billed_to_party_id UUID REFERENCES parties(id),
  is_invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  container_no VARCHAR(11) NOT NULL,
  seal_no VARCHAR(32),
  container_type_id VARCHAR(4) NOT NULL REFERENCES container_types(iso_code),
  tare_kg NUMERIC(8,2) NOT NULL DEFAULT 3800.00,
  gross_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  vgm_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  direction VARCHAR(6) NOT NULL DEFAULT 'export' CHECK (direction IN ('export', 'import')),
  lifecycle_stage container_lifecycle_stage NOT NULL DEFAULT 'empty_picked_up',
  shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE RESTRICT,
  free_days INT NOT NULL DEFAULT 14,
  gate_out_at TIMESTAMPTZ,
  return_due_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  cfs_id UUID REFERENCES cfs_facilities(id) ON DELETE SET NULL,
  is_reefer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS container_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  stage container_lifecycle_stage NOT NULL,
  location VARCHAR(128) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS dd_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
  container_type_id VARCHAR(4) NOT NULL REFERENCES container_types(iso_code),
  from_day INT NOT NULL,
  to_day INT, -- NULL means infinity
  rate_per_day NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS dd_tracking (
  container_id UUID PRIMARY KEY REFERENCES containers(id) ON DELETE CASCADE,
  free_days INT NOT NULL,
  days_used INT NOT NULL DEFAULT 0,
  detention_accrued_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  demurrage_accrued_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_liability_inr NUMERIC(12,2) GENERATED ALWAYS AS (detention_accrued_inr + demurrage_accrued_inr) STORED,
  at_risk BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS cfs_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  cfs_id UUID NOT NULL REFERENCES cfs_facilities(id) ON DELETE RESTRICT,
  charge_type VARCHAR(64) NOT NULL, -- 'Ground Rent', 'Handling', 'Forklift'
  amount NUMERIC(12,2) NOT NULL,
  accrued_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS eir_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  eir_type VARCHAR(16) NOT NULL CHECK (eir_type IN ('pickup', 'gate_in', 'gate_out', 'return')),
  condition_photos TEXT[] DEFAULT '{}',
  inspector_name VARCHAR(128) NOT NULL,
  damage_notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS reefer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  temperature_celsius NUMERIC(5,2) NOT NULL,
  humidity_pct NUMERIC(5,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 6: HOUSE B/L, CONSOLIDATION & DELIVERY ORDERS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bl_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms_conditions_html TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS house_bls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hbl_no VARCHAR(64) NOT NULL,
  mbl_id UUID NOT NULL REFERENCES master_bls(id) ON DELETE RESTRICT,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  shipper_id UUID NOT NULL REFERENCES parties(id),
  consignee_id UUID NOT NULL REFERENCES parties(id),
  notify1_id UUID REFERENCES parties(id),
  notify2_id UUID REFERENCES parties(id),
  por VARCHAR(128),
  pol VARCHAR(128) NOT NULL,
  pod VARCHAR(128) NOT NULL,
  place_of_delivery VARCHAR(128),
  cargo_description TEXT NOT NULL,
  marks_numbers TEXT,
  packages INT NOT NULL,
  package_type VARCHAR(32) NOT NULL DEFAULT 'Packages',
  gross_kg NUMERIC(10,2) NOT NULL,
  measurement_cbm NUMERIC(8,3) NOT NULL,
  hs_code VARCHAR(10) REFERENCES hs_codes(hs_code),
  freight_term freight_term NOT NULL DEFAULT 'prepaid',
  freight_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  bl_type bl_type NOT NULL DEFAULT 'original',
  no_of_originals INT NOT NULL DEFAULT 3,
  shipped_on_board_at DATE,
  template_id UUID REFERENCES bl_templates(id),
  status hbl_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_hbl UNIQUE (tenant_id, hbl_no)
);

CREATE TABLE IF NOT EXISTS bl_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hbl_id UUID NOT NULL REFERENCES house_bls(id) ON DELETE CASCADE,
  version INT NOT NULL,
  reason TEXT NOT NULL,
  changed_fields JSONB NOT NULL,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  consol_no VARCHAR(32) NOT NULL,
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
  pod_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  allocation_method VARCHAR(20) NOT NULL DEFAULT 'by_cbm' CHECK (allocation_method IN ('by_cbm', 'by_weight', 'by_revenue_ton')),
  total_cbm NUMERIC(8,3) NOT NULL DEFAULT 65.000,
  used_cbm NUMERIC(8,3) NOT NULL DEFAULT 0.000,
  total_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 28000.00,
  used_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  mbl_id UUID REFERENCES master_bls(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'planning', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_tenant_consol UNIQUE (tenant_id, consol_no)
);

CREATE TABLE IF NOT EXISTS consolidation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consolidation_id UUID NOT NULL REFERENCES consolidations(id) ON DELETE CASCADE,
  hbl_id UUID NOT NULL REFERENCES house_bls(id) ON DELETE RESTRICT,
  cbm NUMERIC(8,3) NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  allocated_freight NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  do_no VARCHAR(64) NOT NULL,
  hbl_id UUID NOT NULL REFERENCES house_bls(id) ON DELETE RESTRICT,
  mbl_id UUID NOT NULL REFERENCES master_bls(id) ON DELETE RESTRICT,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  igm_no VARCHAR(32),
  igm_item VARCHAR(16),
  consignee_id UUID NOT NULL REFERENCES parties(id),
  deliver_to_party_id UUID REFERENCES parties(id),
  cfs_id UUID NOT NULL REFERENCES cfs_facilities(id),
  destuff_mode VARCHAR(16) NOT NULL DEFAULT 'cfs' CHECK (destuff_mode IN ('factory', 'cfs')),
  do_valid_till DATE NOT NULL,
  empty_return_depot_id UUID REFERENCES cfs_facilities(id),
  security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  charges_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  status do_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_do UNIQUE (tenant_id, do_no)
);

CREATE TABLE IF NOT EXISTS do_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  do_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_do_container UNIQUE (do_id, container_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 7: COMMERCIAL, INVOICING, GST & AGENT LEDGERS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE RESTRICT,
  pol_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  container_type_id VARCHAR(4) NOT NULL REFERENCES container_types(iso_code),
  base_ocean NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  rate_type VARCHAR(16) NOT NULL DEFAULT 'spot' CHECK (rate_type IN ('spot', 'contract', 'nac')),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  transit_days INT NOT NULL DEFAULT 28,
  reliability_pct NUMERIC(5,2) DEFAULT 88.0,
  contract_ref VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS rate_surcharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_card_id UUID NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
  surcharge_type VARCHAR(32) NOT NULL, -- 'BAF', 'CAF', 'THC', 'DOC', 'ISPS', 'WAR_RISK'
  amount NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_no VARCHAR(32) NOT NULL,
  customer_id UUID NOT NULL REFERENCES parties(id),
  pol_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  total_quoted_inr NUMERIC(18,2) NOT NULL,
  estimated_cost_inr NUMERIC(18,2) NOT NULL,
  margin_inr NUMERIC(18,2) GENERATED ALWAYS AS (total_quoted_inr - estimated_cost_inr) STORED,
  stage quote_stage NOT NULL DEFAULT 'rfq_received',
  win_probability_pct INT DEFAULT 50,
  valid_until DATE NOT NULL,
  loss_reason TEXT,
  assigned_sales_rep UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_tenant_quote UNIQUE (tenant_id, quote_no)
);

CREATE TABLE IF NOT EXISTS quotation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  container_type_id VARCHAR(4) NOT NULL REFERENCES container_types(iso_code),
  quantity INT NOT NULL DEFAULT 1,
  buy_rate NUMERIC(12,2) NOT NULL,
  sell_rate NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_no VARCHAR(64) NOT NULL,
  invoice_type invoice_type NOT NULL DEFAULT 'tax',
  bill_to_party_id UUID NOT NULL REFERENCES parties(id),
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  place_of_supply VARCHAR(2) NOT NULL, -- State code e.g. '24'
  taxable_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  cgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  irn VARCHAR(64),
  ack_no VARCHAR(64),
  ack_date TIMESTAMPTZ,
  signed_qr_code TEXT,
  export_tax_type export_tax_type NOT NULL DEFAULT 'lut_without_igst',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_invoice UNIQUE (tenant_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sac_code VARCHAR(8) NOT NULL REFERENCES sac_codes(sac_code),
  description VARCHAR(255) NOT NULL,
  taxable NUMERIC(18,2) NOT NULL,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  cgst NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  sgst NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  igst NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(18,2) NOT NULL,
  mode VARCHAR(32) NOT NULL, -- 'NEFT', 'RTGS', 'UPI', 'RAZORPAY', 'CHEQUE'
  payment_ref VARCHAR(128) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  bank_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS agent_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES parties(id),
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  hbl_id UUID REFERENCES house_bls(id) ON DELETE SET NULL,
  direction VARCHAR(6) NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  fx_rate NUMERIC(12,4) NOT NULL DEFAULT 83.5000,
  amount_inr NUMERIC(18,2) GENERATED ALWAYS AS (amount * fx_rate) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'disputed', 'settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS agent_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES parties(id),
  settlement_ref VARCHAR(64) NOT NULL,
  wire_date DATE NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  bank_charges NUMERIC(12,2) DEFAULT 0.00,
  fx_gain_loss_inr NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES parties(id),
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('flat_per_box', 'percentage_margin', 'revenue_share')),
  rate NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 8: CUSTOMS, SIs, CHA, TRUCKING, DG & MANIFESTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipping_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_channel si_channel NOT NULL DEFAULT 'portal',
  raw_payload JSONB NOT NULL,
  parsed_fields JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(5,2) DEFAULT 95.0,
  matched_booking_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  status si_status NOT NULL DEFAULT 'unparsed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS cha_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  cha_party_id UUID NOT NULL REFERENCES parties(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS shipping_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cha_job_id UUID NOT NULL REFERENCES cha_jobs(id) ON DELETE CASCADE,
  sb_no VARCHAR(32) NOT NULL,
  sb_date DATE NOT NULL,
  leo_date DATE,
  duty_paid NUMERIC(12,2) DEFAULT 0.00,
  scheme VARCHAR(32) NOT NULL DEFAULT 'RoDTEP', -- 'RoDTEP', 'Drawback', 'Advance Auth', 'EPCG'
  stage VARCHAR(32) NOT NULL DEFAULT 'sb_filed' CHECK (stage IN ('sb_filed', 'examined', 'leo', 'loaded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS transporter_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transporter_id UUID NOT NULL REFERENCES parties(id),
  origin_city VARCHAR(64) NOT NULL,
  destination_port VARCHAR(64) NOT NULL,
  container_size INT NOT NULL, -- 20 or 40
  base_rate NUMERIC(12,2) NOT NULL,
  fuel_surcharge_pct NUMERIC(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS trucking_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
  transporter_id UUID NOT NULL REFERENCES parties(id),
  trip_type VARCHAR(32) NOT NULL CHECK (trip_type IN ('empty_pickup', 'factory_to_cfs', 'cfs_to_port', 'port_to_factory', 'empty_return')),
  lr_no VARCHAR(32) NOT NULL,
  truck_no VARCHAR(20) NOT NULL,
  driver_name VARCHAR(128) NOT NULL,
  driver_phone VARCHAR(32) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  picked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rate NUMERIC(12,2) NOT NULL,
  pod_photo_url TEXT,
  seal_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS dg_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  hbl_id UUID REFERENCES house_bls(id) ON DELETE SET NULL,
  un_number CHAR(4) NOT NULL,
  imdg_class VARCHAR(8) NOT NULL,
  psn TEXT NOT NULL,
  packing_group VARCHAR(4),
  flashpoint_celsius NUMERIC(5,2),
  marine_pollutant BOOLEAN NOT NULL DEFAULT FALSE,
  net_qty_kg NUMERIC(10,2) NOT NULL,
  msds_url TEXT,
  dgd_pdf_url TEXT,
  carrier_approval_ref VARCHAR(64),
  status VARCHAR(20) NOT NULL DEFAULT 'declared' CHECK (status IN ('declared', 'carrier_approved', 'loaded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS egm_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE RESTRICT,
  voyage VARCHAR(32) NOT NULL,
  pol_locode CHAR(5) NOT NULL REFERENCES ports(locode),
  sailed_at TIMESTAMPTZ NOT NULL,
  filing_deadline TIMESTAMPTZ NOT NULL, -- sailed_at + 7 days
  iem_no VARCHAR(32),
  status egm_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS egm_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  egm_filing_id UUID NOT NULL REFERENCES egm_filings(id) ON DELETE CASCADE,
  hbl_id UUID NOT NULL REFERENCES house_bls(id) ON DELETE RESTRICT,
  shipping_bill_no VARCHAR(32) NOT NULL,
  container_no VARCHAR(11) NOT NULL,
  seal_no VARCHAR(32) NOT NULL,
  packages INT NOT NULL,
  gross_weight_kg NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS igm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE RESTRICT,
  voyage VARCHAR(32) NOT NULL,
  inward_date DATE NOT NULL,
  igm_no VARCHAR(32) NOT NULL,
  status igm_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS igm_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igm_record_id UUID NOT NULL REFERENCES igm_records(id) ON DELETE CASCADE,
  line_no INT NOT NULL,
  sub_line_no INT NOT NULL DEFAULT 1,
  hbl_no VARCHAR(64) NOT NULL,
  mbl_no VARCHAR(64) NOT NULL,
  consignee_name TEXT NOT NULL,
  consignee_gstin VARCHAR(15),
  packages INT NOT NULL,
  gross_weight_kg NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 9: TRADE FINANCE, VAULT, COMMS, APPROVALS & INSIGHTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  lc_no VARCHAR(64) NOT NULL,
  issuing_bank VARCHAR(128) NOT NULL,
  advising_bank VARCHAR(128),
  latest_shipment_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_compliant BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  policy_no VARCHAR(64) NOT NULL,
  policy_type VARCHAR(16) NOT NULL DEFAULT 'specific' CHECK (policy_type IN ('open', 'specific')),
  insured_value NUMERIC(18,2) NOT NULL,
  premium_inr NUMERIC(12,2) NOT NULL,
  coverage_clauses VARCHAR(32) NOT NULL DEFAULT 'ICC_A', -- 'ICC_A', 'ICC_B', 'ICC_C'
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS advance_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  filing_type VARCHAR(16) NOT NULL CHECK (filing_type IN ('ISF', 'ENS', 'AFR', 'CSD')),
  destination_country CHAR(2) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  filing_ref VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type VARCHAR(64) NOT NULL, -- 'Commercial Invoice', 'Packing List', 'HBL', 'MBL', 'DO', 'Shipping Bill', 'EGM', 'MSDS'
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  hbl_id UUID REFERENCES house_bls(id) ON DELETE SET NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  ocr_status VARCHAR(20) NOT NULL DEFAULT 'not_processed' CHECK (ocr_status IN ('not_processed', 'processing', 'completed', 'failed')),
  ocr_result JSONB,
  validity_date DATE,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel VARCHAR(16) NOT NULL DEFAULT 'whatsapp',
  title VARCHAR(128) NOT NULL,
  body_text TEXT NOT NULL,
  category VARCHAR(32) NOT NULL, -- 'Booking', 'Status', 'Risk', 'Billing', 'DO'
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  channel VARCHAR(16) NOT NULL, -- 'WhatsApp', 'Email', 'SMS'
  direction VARCHAR(8) NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  recipient VARCHAR(128) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name VARCHAR(128) NOT NULL,
  trigger_action VARCHAR(64) NOT NULL,
  threshold_value NUMERIC(18,2),
  required_role user_role NOT NULL DEFAULT 'super_admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(64) NOT NULL, -- 'DeliveryOrder', 'Quotation', 'InvoiceWaiver'
  entity_id VARCHAR(64) NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  approver_role user_role NOT NULL DEFAULT 'super_admin',
  status approval_status NOT NULL DEFAULT 'pending',
  reason TEXT NOT NULL,
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  insight_type VARCHAR(32) NOT NULL, -- 'Risk Alert', 'Margin Optimization', 'Compliance Risk'
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('critical', 'warning', 'success', 'info')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_view VARCHAR(64),
  target_param VARCHAR(64),
  action_label VARCHAR(128),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 10: FUNCTIONS, TRIGGERS & BUSINESS LOGIC ENGINES
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Automatic Timestamp Function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Audit Trail Trigger Function
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_table VARCHAR(64) := TG_TABLE_NAME;
  v_id VARCHAR(64);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD.tenant_id;
    v_id := OLD.id::TEXT;
    INSERT INTO audit_log (tenant_id, entity_table, entity_id, action, before_snapshot, after_snapshot)
    VALUES (v_tenant_id, v_table, v_id, 'DELETE', to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_tenant_id := NEW.tenant_id;
    v_id := NEW.id::TEXT;
    INSERT INTO audit_log (tenant_id, entity_table, entity_id, action, before_snapshot, after_snapshot)
    VALUES (v_tenant_id, v_table, v_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := NEW.tenant_id;
    v_id := NEW.id::TEXT;
    INSERT INTO audit_log (tenant_id, entity_table, entity_id, action, before_snapshot, after_snapshot)
    VALUES (v_tenant_id, v_table, v_id, 'INSERT', NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Trigger to core tables
DROP TRIGGER IF EXISTS trg_audit_shipments ON shipments;
CREATE TRIGGER trg_audit_shipments AFTER INSERT OR UPDATE OR DELETE ON shipments FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS trg_audit_hbls ON house_bls;
CREATE TRIGGER trg_audit_hbls AFTER INSERT OR UPDATE OR DELETE ON house_bls FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS trg_audit_invoices ON invoices;
CREATE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- 3. Numbering Series Allocator (Gapless with Row Locking)
CREATE OR REPLACE FUNCTION allocate_number_series(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_doc_type VARCHAR,
  p_fy VARCHAR
) RETURNS TEXT AS $$
DECLARE
  v_rec RECORD;
  v_next_seq BIGINT;
  v_result TEXT;
BEGIN
  SELECT * INTO v_rec
  FROM number_series
  WHERE tenant_id = p_tenant_id
    AND (branch_id = p_branch_id OR branch_id IS NULL)
    AND doc_type = p_doc_type
    AND financial_year = p_fy
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Fallback default prefix
    INSERT INTO number_series (tenant_id, branch_id, doc_type, financial_year, prefix, current_seq, format)
    VALUES (p_tenant_id, p_branch_id, p_doc_type, p_fy, UPPER(p_doc_type), 1, p_doc_type || '-{FY}-{SEQ:05}')
    RETURNING 1 INTO v_next_seq;
  ELSE
    v_next_seq := v_rec.current_seq + 1;
    UPDATE number_series
    SET current_seq = v_next_seq, updated_at = clock_timestamp()
    WHERE id = v_rec.id;
  END IF;

  v_result := REPLACE(REPLACE(COALESCE(v_rec.format, p_doc_type || '-{FY}-{SEQ:05}'), '{FY}', p_fy), '{SEQ:05}', LPAD(v_next_seq::TEXT, 5, '0'));
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. High-Performance Demurrage & Detention Calculator
CREATE OR REPLACE FUNCTION recalculate_container_dd(p_container_id UUID)
RETURNS VOID AS $$
DECLARE
  v_c RECORD;
  v_days_over INT := 0;
  v_total_demurrage NUMERIC(12,2) := 0.00;
  v_total_detention NUMERIC(12,2) := 0.00;
  v_slab RECORD;
BEGIN
  SELECT * INTO v_c FROM containers WHERE id = p_container_id;
  IF NOT FOUND OR v_c.gate_out_at IS NULL THEN RETURN; END IF;

  v_days_over := GREATEST(0, (CURRENT_DATE - (v_c.gate_out_at::DATE + v_c.free_days)));

  IF v_days_over > 0 THEN
    -- Tiered slab loop
    FOR v_slab IN
      SELECT * FROM dd_slabs
      WHERE tenant_id = v_c.tenant_id
        AND shipping_line_id = v_c.shipping_line_id
        AND container_type_id = v_c.container_type_id
      ORDER BY from_day ASC
    LOOP
      IF v_days_over >= v_slab.from_day THEN
        DECLARE
          v_chargeable_in_slab INT;
        BEGIN
          IF v_slab.to_day IS NOT NULL THEN
            v_chargeable_in_slab := LEAST(v_days_over, v_slab.to_day) - v_slab.from_day + 1;
          ELSE
            v_chargeable_in_slab := v_days_over - v_slab.from_day + 1;
          END IF;
          IF v_chargeable_in_slab > 0 THEN
            v_total_detention := v_total_detention + (v_chargeable_in_slab * v_slab.rate_per_day);
          END IF;
        END;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO dd_tracking (container_id, free_days, days_used, detention_accrued_inr, demurrage_accrued_inr, at_risk, updated_at)
  VALUES (p_container_id, v_c.free_days, v_days_over, v_total_detention, v_total_demurrage, (v_days_over > 0), clock_timestamp())
  ON CONFLICT (container_id) DO UPDATE SET
    days_used = EXCLUDED.days_used,
    detention_accrued_inr = EXCLUDED.detention_accrued_inr,
    at_risk = EXCLUDED.at_risk,
    updated_at = clock_timestamp();
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════════
-- PART 11: ROW LEVEL SECURITY (RLS) POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Auth Helper functions
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::UUID,
    (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_party_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'party_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_bls ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_bls ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Reference Tables: Allow read access to all authenticated and anonymous clients
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_ports ON ports;
CREATE POLICY public_read_ports ON ports FOR SELECT USING (true);

ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_container_types ON container_types;
CREATE POLICY public_read_container_types ON container_types FOR SELECT USING (true);

ALTER TABLE shipping_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_shipping_lines ON shipping_lines;
CREATE POLICY public_read_shipping_lines ON shipping_lines FOR SELECT USING (true);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_currencies ON currencies;
CREATE POLICY public_read_currencies ON currencies FOR SELECT USING (true);

ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_fx_rates ON fx_rates;
CREATE POLICY public_read_fx_rates ON fx_rates FOR SELECT USING (true);

ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_hs_codes ON hs_codes;
CREATE POLICY public_read_hs_codes ON hs_codes FOR SELECT USING (true);

ALTER TABLE sac_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_sac_codes ON sac_codes;
CREATE POLICY public_read_sac_codes ON sac_codes FOR SELECT USING (true);

ALTER TABLE un_dangerous_goods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_un_dangerous_goods ON un_dangerous_goods;
CREATE POLICY public_read_un_dangerous_goods ON un_dangerous_goods FOR SELECT USING (true);


-- Tenants Policy
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL USING (id = auth_tenant_id());

-- Shipments Policy (Tenants can manage all jobs, customers can only view their own)
DROP POLICY IF EXISTS tenant_isolation_shipments ON shipments;
CREATE POLICY tenant_isolation_shipments ON shipments
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND (
      auth_party_id() IS NULL 
      OR id IN (SELECT shipment_id FROM shipment_parties WHERE party_id = auth_party_id())
    )
  );

-- House BL Policy
DROP POLICY IF EXISTS tenant_isolation_house_bls ON house_bls;
CREATE POLICY tenant_isolation_house_bls ON house_bls
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND (
      auth_party_id() IS NULL
      OR shipper_id = auth_party_id()
      OR consignee_id = auth_party_id()
    )
  );

-- Invoices Policy
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
CREATE POLICY tenant_isolation_invoices ON invoices
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND (
      auth_party_id() IS NULL
      OR bill_to_party_id = auth_party_id()
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- PART 12: REALISTIC SEED DATA (Mundra, Kandla, Nhava Sheva)
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Default NVOCC Tenant (Testing Pack Point 04)
INSERT INTO tenants (id, code, legal_name, trade_name, gstin, pan, iec, mto_reg_no, base_currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MAPS-GLOBAL',
  'MAPS Freight Solutions Pvt Ltd',
  'MAPS NVOCC Pro',
  '24AARCM6698J1ZK',
  'AARCM6698J',
  'AARCM6698J',
  'MTO/DGS/2024/0981',
  'INR'
) ON CONFLICT (code) DO NOTHING;

-- 2. Headquarters Branch
INSERT INTO branches (id, tenant_id, code, name, city, state, state_code, gstin, is_head_office)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'GIM-HQ',
  'Gandhidham Port Office',
  'Gandhidham',
  'Gujarat',
  '24',
  '24AARCM6698J1ZK',
  TRUE
) ON CONFLICT (tenant_id, code) DO NOTHING;

-- 3. Ports Master
INSERT INTO ports (locode, name, country_code, port_type, icegate_port_code)
VALUES
  ('INMUN', 'Mundra Port', 'IN', 'seaport', 'INMUN1'),
  ('INNSA', 'Nhava Sheva (JNPA)', 'IN', 'seaport', 'INNSA1'),
  ('INIXY', 'Kandla (Deendayal Port)', 'IN', 'seaport', 'INIXY1'),
  ('INPAV', 'Pipavav Port', 'IN', 'seaport', 'INPAV1'),
  ('AEJEA', 'Jebel Ali Port', 'AE', 'seaport', NULL),
  ('DEHAM', 'Hamburg Port', 'DE', 'seaport', NULL),
  ('SGSIN', 'Singapore Port', 'SG', 'seaport', NULL)
ON CONFLICT (locode) DO NOTHING;

-- 4. Container Types Reference
INSERT INTO container_types (iso_code, name, nominal_size_ft, max_cbm, max_payload_kg, tare_weight_kg)
VALUES
  ('20GP', '20ft General Purpose', 20, 33.20, 28200.00, 2200.00),
  ('40GP', '40ft General Purpose', 40, 67.70, 28750.00, 3750.00),
  ('40HC', '40ft High Cube', 40, 76.40, 28600.00, 3900.00),
  ('20RF', '20ft Reefer', 20, 28.30, 27400.00, 3050.00),
  ('40RF', '40ft Reefer High Cube', 40, 67.00, 29400.00, 4600.00)
ON CONFLICT (iso_code) DO NOTHING;

-- 5. Currencies & FX
INSERT INTO currencies (code, name, symbol)
VALUES
  ('INR', 'Indian Rupee', '₹'),
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('AED', 'UAE Dirham', 'د.إ')
ON CONFLICT (code) DO NOTHING;

INSERT INTO fx_rates (currency_code, rate_to_inr, as_of_date, source)
VALUES
  ('USD', 83.9200, CURRENT_DATE, 'ICEGATE Live'),
  ('EUR', 91.4500, CURRENT_DATE, 'ICEGATE Live'),
  ('AED', 22.8500, CURRENT_DATE, 'RBI Reference')
ON CONFLICT (currency_code, as_of_date) DO NOTHING;

-- 6. Major Shipping Lines
INSERT INTO shipping_lines (name, scac_code, free_days_default)
VALUES
  ('Mediterranean Shipping Company', 'MSCU', 14),
  ('Maersk Line', 'MAEU', 14),
  ('CMA CGM', 'CMDU', 14),
  ('Hapag-Lloyd', 'HLCU', 14)
ON CONFLICT (scac_code) DO NOTHING;

-- 7. Document Numbering Configuration
INSERT INTO number_series (tenant_id, branch_id, doc_type, financial_year, prefix, current_seq, format)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'shipment', '2425', 'MAPS', 342, 'MAPS-24{SEQ:04}'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'hbl', '2425', 'MAPS-HBL', 42, 'MAPS-HBL-240{SEQ:03}-01'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'do', '2425', 'DO', 12, 'LANDOMUN{SEQ:04}2026'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'invoice', '2425', 'INV', 88, 'MAPS/24-25/INV/{SEQ:03}')
ON CONFLICT (tenant_id, branch_id, doc_type, financial_year) DO NOTHING;
