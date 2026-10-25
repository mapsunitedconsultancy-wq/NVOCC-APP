-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 02: Core Master Entities & Shipment Relational Schema
-- Engineered for High Concurrency (100k+ Users, Multi-Tenant Partitioning)
-- ============================================================================

-- 1. Organizations (Multi-Tenancy Master)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,                -- e.g. 'MAPS-GLOBAL'
  name VARCHAR(255) NOT NULL,
  gstin VARCHAR(15) UNIQUE,                        -- Indian 15-digit GSTIN
  pan VARCHAR(10),                                 -- Permanent Account Number
  iec_code VARCHAR(10),                            -- Import Export Code (DGFT)
  state_code VARCHAR(2),                           -- 24 for Gujarat, 27 for Maharashtra
  base_currency currency_code DEFAULT 'INR',
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb,              -- Dynamic branch & port defaults
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 2. Application Users (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,                             -- Directly references auth.users.id
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  role user_role NOT NULL DEFAULT 'operations',
  department VARCHAR(64) DEFAULT 'Operations',
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  metadata JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 3. Ports & Terminals Reference (UN/LOCODE Master)
CREATE TABLE IF NOT EXISTS ports (
  locode VARCHAR(5) PRIMARY KEY,                   -- e.g. 'INMUN', 'INNSA', 'AEJEA'
  port_name VARCHAR(128) NOT NULL,                 -- Mundra, Nhava Sheva, Jebel Ali
  country_code VARCHAR(2) NOT NULL,                -- IN, AE, DE, SG
  country_name VARCHAR(64) NOT NULL,
  state VARCHAR(64),
  subdivision VARCHAR(8),
  coordinates POINT,                               -- (lat, long) for spatial distance queries
  has_cfs BOOLEAN DEFAULT TRUE,
  icegate_port_code VARCHAR(6),                    -- Custom port code for EDI filing (e.g. INMUN1)
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 4. Parties Master (Shippers, Consignees, Carriers, CHAs, CFS, Transporters)
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  party_code VARCHAR(32) NOT NULL,                 -- e.g. 'SHP-MUNDRA-01'
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  party_type VARCHAR(32) NOT NULL,                 -- 'shipper', 'consignee', 'notify_party', 'carrier', 'cha', 'cfs', 'agent', 'transporter'
  gstin VARCHAR(15),                               -- Indian GST Identification Number
  pan VARCHAR(10),
  iec_code VARCHAR(10),
  sez_status BOOLEAN DEFAULT FALSE,                -- Special Economic Zone (Zero-rated supply)
  lut_number VARCHAR(64),                          -- Letter of Undertaking for GST exemption
  credit_limit NUMERIC(15,2) DEFAULT 0.00,
  credit_days INT DEFAULT 30,
  payment_terms VARCHAR(64) DEFAULT '30 Days Net',
  currency currency_code DEFAULT 'INR',
  email VARCHAR(255),
  phone VARCHAR(32),
  address TEXT NOT NULL,
  city VARCHAR(64) NOT NULL,
  state VARCHAR(64) NOT NULL,
  state_code VARCHAR(2),                           -- 2-digit GST state code
  country VARCHAR(64) NOT NULL DEFAULT 'India',
  country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
  pincode VARCHAR(16),
  kyc_verified BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_party_code_per_org UNIQUE (org_id, party_code)
);

-- 5. Vessels & Voyages
CREATE TABLE IF NOT EXISTS vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imo_number VARCHAR(16) UNIQUE,                   -- International Maritime Organization 7-digit ID
  vessel_name VARCHAR(128) NOT NULL,
  carrier_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  carrier_name VARCHAR(128),
  carrier_scac VARCHAR(8),                         -- Standard Carrier Alpha Code (MSCU, MAEU, etc.)
  flag_country VARCHAR(2),
  built_year INT,
  teu_capacity INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE IF NOT EXISTS voyages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE RESTRICT,
  voyage_number VARCHAR(32) NOT NULL,              -- e.g. '014W', '437E'
  direction VARCHAR(16) DEFAULT 'Westbound',
  pol_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  etd TIMESTAMPTZ NOT NULL,
  eta TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  cy_cutoff TIMESTAMPTZ,
  si_cutoff TIMESTAMPTZ,
  vgm_cutoff TIMESTAMPTZ,
  egm_filed_at TIMESTAMPTZ,
  igm_filed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_vessel_voyage UNIQUE (vessel_id, voyage_number, pol_locode, pod_locode)
);

-- 6. Core Shipments Entity (Partition-Ready Multi-Tenant Backbone)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  reference_no VARCHAR(64) NOT NULL,               -- e.g. 'MAPS-240342'
  booking_no VARCHAR(64) NOT NULL,
  job_type job_type NOT NULL DEFAULT 'Export',
  mode transport_mode NOT NULL DEFAULT 'Ocean',
  service_type service_type NOT NULL DEFAULT 'FCL',
  incoterm incoterm_type NOT NULL DEFAULT 'FOB',
  status shipment_status NOT NULL DEFAULT 'booked',
  
  -- Parties Relational Links
  shipper_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  consignee_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  notify_party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  cha_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  transporter_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Route & Geography
  place_of_receipt VARCHAR(128) NOT NULL,
  pol_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  via_port_locode VARCHAR(5) REFERENCES ports(locode),
  pod_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  place_of_delivery VARCHAR(128) NOT NULL,

  -- Carrier & Voyage Links
  vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  voyage_id UUID REFERENCES voyages(id) ON DELETE SET NULL,
  vessel_name VARCHAR(128) NOT NULL,
  voyage_number VARCHAR(32) NOT NULL,
  carrier_scac VARCHAR(8) NOT NULL,
  etd DATE NOT NULL,
  eta DATE NOT NULL,
  actual_departure DATE,
  actual_arrival DATE,
  transit_days INT DEFAULT 0,

  -- Cutoffs
  cy_cutoff TIMESTAMPTZ,
  si_cutoff TIMESTAMPTZ,
  vgm_cutoff TIMESTAMPTZ,
  doc_cutoff TIMESTAMPTZ,

  -- Cargo & Technical Specifications
  cargo_description TEXT NOT NULL,
  hs_code VARCHAR(16) NOT NULL,
  packages_count INT NOT NULL DEFAULT 1,
  package_type VARCHAR(64) DEFAULT 'PACKAGES',
  gross_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  net_weight_kg NUMERIC(12,2) DEFAULT 0.00,
  volume_cbm NUMERIC(10,3) DEFAULT 0.00,
  is_dangerous_goods BOOLEAN DEFAULT FALSE,
  is_temperature_controlled BOOLEAN DEFAULT FALSE,

  -- Financial Revenue vs Cost Totals (Denormalized for Sub-millisecond Dashboard Analytics)
  revenue_total_inr NUMERIC(15,2) DEFAULT 0.00,
  cost_total_inr NUMERIC(15,2) DEFAULT 0.00,
  net_margin_inr NUMERIC(15,2) DEFAULT 0.00,
  margin_percentage NUMERIC(5,2) DEFAULT 0.00,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_org_reference_no UNIQUE (org_id, reference_no),
  CONSTRAINT uq_org_booking_no UNIQUE (org_id, booking_no)
);

-- 7. Master Bill of Lading (Carrier MBL)
CREATE TABLE IF NOT EXISTS master_bills_of_lading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mbl_number VARCHAR(64) NOT NULL,                 -- e.g. 'MEDUM1948271'
  carrier_id UUID NOT NULL REFERENCES parties(id),
  vessel_id UUID REFERENCES vessels(id),
  voyage_id UUID REFERENCES voyages(id),
  pol_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  bl_issue_date DATE NOT NULL,
  shipped_on_board_date DATE,
  bl_type VARCHAR(32) DEFAULT 'Original Sea Waybill',
  payment_term payment_term DEFAULT 'Prepaid',
  freight_amount NUMERIC(15,2) DEFAULT 0.00,
  freight_currency currency_code DEFAULT 'USD',
  containers_count INT DEFAULT 1,
  packages_count INT DEFAULT 1,
  gross_weight_kg NUMERIC(12,2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Surrendered', 'Accomplished')),
  scanned_copy_url TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_org_mbl_number UNIQUE (org_id, mbl_number)
);

-- 8. House Bill of Lading (NVOCC HBL issued to Shipper)
CREATE TABLE IF NOT EXISTS house_bills_of_lading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  hbl_number VARCHAR(64) NOT NULL,                 -- e.g. 'MAPS-HBL-240342'
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  mbl_id UUID REFERENCES master_bills_of_lading(id) ON DELETE SET NULL,
  shipper_id UUID NOT NULL REFERENCES parties(id),
  consignee_id UUID NOT NULL REFERENCES parties(id),
  notify_party_id UUID REFERENCES parties(id),
  delivery_agent_id UUID REFERENCES parties(id),
  bl_type VARCHAR(32) DEFAULT 'Original negotiable' CHECK (bl_type IN ('Original negotiable', 'Sea Waybill', 'Telex Release', 'Surrendered')),
  number_of_originals INT DEFAULT 3,
  payment_term payment_term DEFAULT 'Prepaid',
  place_of_issue VARCHAR(64) DEFAULT 'Mundra, India',
  issue_date DATE NOT NULL,
  shipped_on_board_date DATE,
  is_surrendered BOOLEAN DEFAULT FALSE,
  surrender_date DATE,
  telex_released BOOLEAN DEFAULT FALSE,
  print_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_org_hbl_number UNIQUE (org_id, hbl_number)
);

-- 9. Containers & VGM Records
CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  hbl_id UUID REFERENCES house_bills_of_lading(id) ON DELETE SET NULL,
  mbl_id UUID REFERENCES master_bills_of_lading(id) ON DELETE SET NULL,
  container_number VARCHAR(16) NOT NULL,           -- ISO 6346 11-char container code: 'MSKU2345678'
  equipment_type equipment_size_type NOT NULL DEFAULT '40HC',
  seal_number VARCHAR(32) NOT NULL,
  customs_seal_number VARCHAR(32),
  
  -- Weights
  tare_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 3800.00,
  cargo_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gross_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  vgm_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  vgm_method VARCHAR(8) DEFAULT 'SM1' CHECK (vgm_method IN ('SM1', 'SM2')),
  vgm_certifier VARCHAR(128),
  vgm_date TIMESTAMPTZ,

  -- Telemetry & D&D Engine
  current_stage container_stage NOT NULL DEFAULT 'Gate In Port',
  current_location VARCHAR(128) NOT NULL DEFAULT 'Mundra Port Gate',
  cfs_name VARCHAR(128),
  free_time_days INT NOT NULL DEFAULT 14,
  free_time_expiry DATE,
  demurrage_per_day_inr NUMERIC(10,2) DEFAULT 3500.00,
  detention_per_day_inr NUMERIC(10,2) DEFAULT 4000.00,
  accrued_demurrage_inr NUMERIC(12,2) DEFAULT 0.00,
  accrued_detention_inr NUMERIC(12,2) DEFAULT 0.00,
  drayage_truck_no VARCHAR(32),
  driver_contact VARCHAR(32),

  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_container_per_shipment UNIQUE (shipment_id, container_number)
);
