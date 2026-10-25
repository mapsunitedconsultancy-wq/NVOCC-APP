-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 01: Extensions and Domain ENUM Types
-- Optimizations for 100,000+ Concurrency, Multi-Tenant Logistics ERP
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- Fast UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Cryptographic hashes and UUIDv4
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram indexing for ultra-fast fuzzy search (B/L, container, party)
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- Composite GiST indexing for overlap prevention
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- Multi-column GIN indexing

-- 2. User & RBAC Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'operations',
    'finance',
    'sales',
    'customer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Shipment Lifecycle & Workflow Statuses
DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM (
    'draft',
    'booked',
    'pickup_scheduled',
    'at_cfs',
    'customs_cleared',
    'at_port',
    'loaded',
    'on_vessel',
    'sailed',
    'transhipment',
    'discharged',
    'destination_cfs',
    'delivered',
    'delayed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_type AS ENUM (
    'Export',
    'Import',
    'Cross-trade'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transport_mode AS ENUM (
    'Ocean',
    'Air',
    'Rail',
    'Road'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'FCL',
    'LCL',
    'Breakbulk'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incoterm_type AS ENUM (
    'FOB',
    'CIF',
    'CFR',
    'EXW',
    'DDP',
    'DAP',
    'FCA',
    'CIP',
    'CPT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. ISO Equipment & Container Types
DO $$ BEGIN
  CREATE TYPE equipment_size_type AS ENUM (
    '20GP',
    '40GP',
    '40HC',
    '20RF',
    '40RF',
    '20OT',
    '40OT',
    '20FR',
    '40FR',
    '20TK',
    '40TK',
    '45HC'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE container_stage AS ENUM (
    'Gate In Port',
    'Onboard Vessel',
    'Discharged',
    'Movement to CFS',
    'CFS Grounded',
    'Destuffing Done',
    'Loaded on Trailer',
    'Factory In Transit',
    'Factory Gate In',
    'Factory Destuffing',
    'Empty Return Journey',
    'Empty Yard In',
    'Demurrage Accruing',
    'Detention Accruing'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Financial & Invoicing ENUMs
DO $$ BEGIN
  CREATE TYPE currency_code AS ENUM (
    'INR',
    'USD',
    'EUR',
    'AED',
    'GBP',
    'SGD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft',
    'posted',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled',
    'credit_note_issued'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_term AS ENUM (
    'Prepaid',
    'Collect',
    'Third-Party'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'Pending',
    'Approved',
    'Rejected',
    'Escalated',
    'Auto-Approved'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dg_class_type AS ENUM (
    'Class 1: Explosives',
    'Class 2.1: Flammable Gas',
    'Class 2.2: Non-Flammable Gas',
    'Class 2.3: Toxic Gas',
    'Class 3: Flammable Liquids',
    'Class 4.1: Flammable Solids',
    'Class 4.2: Spontaneously Combustible',
    'Class 4.3: Dangerous When Wet',
    'Class 5.1: Oxidizers',
    'Class 5.2: Organic Peroxides',
    'Class 6.1: Toxic Substances',
    'Class 6.2: Infectious Substances',
    'Class 7: Radioactive',
    'Class 8: Corrosives',
    'Class 9: Misc Dangerous'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
