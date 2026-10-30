-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 03: Indian Statutory Operations, Manifests & Logistics Workflows
-- (ICEGATE EGM/IGM, SI Extractor, DO Destuffing, CHA LEO, Trucking LR, DG IMDG)
-- ============================================================================

-- 1. Export General Manifest (EGM) — ICEGATE 7-day Filing Engine
CREATE TABLE IF NOT EXISTS export_general_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  egm_number VARCHAR(32) NOT NULL,                 -- e.g. 'EGM-MUN-2026-1049'
  vessel_id UUID REFERENCES vessels(id),
  voyage_id UUID REFERENCES voyages(id),
  vessel_name VARCHAR(128) NOT NULL,
  voyage_number VARCHAR(32) NOT NULL,
  port_of_loading VARCHAR(5) NOT NULL REFERENCES ports(locode),
  port_code_icegate VARCHAR(10) NOT NULL DEFAULT 'INMUN1',
  carrier_code VARCHAR(32) NOT NULL,               -- Shipping Line PAN / Carrier Code
  imo_number VARCHAR(16) NOT NULL,
  sailed_date DATE NOT NULL,
  icegate_deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Acknowledged', 'Rejected', 'Amendment_Requested')),
  icegate_submission_id VARCHAR(64),
  acknowledgement_number VARCHAR(64),
  total_containers INT DEFAULT 0,
  total_teu INT DEFAULT 0,
  total_cargo_weight_mt NUMERIC(12,3) DEFAULT 0.000,
  error_logs JSONB DEFAULT '[]'::jsonb,
  filed_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_egm_per_org UNIQUE (org_id, egm_number)
);

CREATE TABLE IF NOT EXISTS egm_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  egm_id UUID NOT NULL REFERENCES export_general_manifests(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  line_number INT NOT NULL,
  shipping_bill_number VARCHAR(32) NOT NULL,
  shipping_bill_date DATE NOT NULL,
  leo_number VARCHAR(32),                          -- Let Export Order number
  leo_date DATE,
  cha_pan VARCHAR(10) NOT NULL,
  shipper_gstin VARCHAR(15) NOT NULL,
  cargo_description TEXT NOT NULL,
  container_number VARCHAR(16) NOT NULL,
  seal_number VARCHAR(32) NOT NULL,
  gross_weight_kg NUMERIC(12,2) NOT NULL,
  volume_cbm NUMERIC(10,3),
  packages_count INT NOT NULL,
  package_code VARCHAR(16) DEFAULT 'PK',
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_egm_line UNIQUE (egm_id, line_number)
);

-- 2. Import General Manifest (IGM) — Vessel Inbound & Sub-Line Filings
CREATE TABLE IF NOT EXISTS import_general_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  igm_number VARCHAR(32) NOT NULL,                 -- e.g. 'IGM-NSA-2026-8842'
  igm_date DATE NOT NULL,
  vessel_name VARCHAR(128) NOT NULL,
  voyage_number VARCHAR(32) NOT NULL,
  entry_inward_date DATE NOT NULL,
  port_of_discharge VARCHAR(5) NOT NULL REFERENCES ports(locode),
  port_code_icegate VARCHAR(10) NOT NULL DEFAULT 'INNSA1',
  shipping_line VARCHAR(128) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Transmitted', 'Approved', 'Arrival Notice Sent')),
  total_bl_count INT DEFAULT 0,
  total_containers INT DEFAULT 0,
  total_weight_mt NUMERIC(12,3) DEFAULT 0.000,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_igm_per_org UNIQUE (org_id, igm_number)
);

-- 3. Shipping Instructions (SI) — Multi-Channel Intake & Processing
CREATE TABLE IF NOT EXISTS shipping_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  si_number VARCHAR(32) NOT NULL,                  -- e.g. 'SI-2026-9021'
  source VARCHAR(32) NOT NULL DEFAULT 'Email' CHECK (source IN ('Email', 'Customer Portal', 'WhatsApp', 'API', 'EDI')),
  shipper_id UUID REFERENCES parties(id),
  shipper_name VARCHAR(255) NOT NULL,
  booking_no VARCHAR(64) NOT NULL,
  vessel_name VARCHAR(128) NOT NULL,
  voyage_number VARCHAR(32) NOT NULL,
  pol_locode VARCHAR(5) NOT NULL,
  pod_locode VARCHAR(5) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Unparsed' CHECK (status IN ('Unparsed', 'Parsed', 'HBL Drafted', 'Carrier Submitted', 'Confirmed')),
  si_cutoff TIMESTAMPTZ NOT NULL,
  raw_payload TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,        -- Structured data extracted from doc/email
  hbl_id UUID REFERENCES house_bills_of_lading(id),
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_si_per_org UNIQUE (org_id, si_number)
);

-- 4. Delivery Orders (DO) — Inbound Cargo CFS Release & Destuffing
CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  do_number VARCHAR(64) NOT NULL,                  -- e.g. 'DO-MUN-2026-0342'
  shipment_id UUID REFERENCES shipments(id) ON DELETE RESTRICT,
  hbl_id UUID REFERENCES house_bills_of_lading(id),
  consignee_id UUID NOT NULL REFERENCES parties(id),
  cha_id UUID REFERENCES parties(id),
  cfs_facility_id UUID REFERENCES parties(id),
  cfs_name VARCHAR(128) NOT NULL,
  issue_date DATE NOT NULL,
  validity_date DATE NOT NULL,
  destuffing_mode VARCHAR(32) DEFAULT 'CFS Destuffing' CHECK (destuffing_mode IN ('CFS Destuffing', 'Factory Destuffing', 'Direct Delivery')),
  empty_return_depot VARCHAR(128) NOT NULL,
  empty_return_valid_days INT NOT NULL DEFAULT 7,
  
  -- Financial & Clearance Preconditions (Gate checks)
  original_bl_surrendered BOOLEAN NOT NULL DEFAULT FALSE,
  freight_invoices_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  security_deposit_inr NUMERIC(12,2) DEFAULT 0.00,
  do_fee_inr NUMERIC(10,2) DEFAULT 3500.00,
  
  status VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Extended', 'Cargo Cleared', 'Empty Returned', 'Closed')),
  qr_verification_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_do_per_org UNIQUE (org_id, do_number)
);

-- 5. Customs Clearance & Shipping Bill Tracker (CHA ICEGATE LEO)
CREATE TABLE IF NOT EXISTS cha_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  shipping_bill_number VARCHAR(32) NOT NULL,
  shipping_bill_date DATE NOT NULL,
  cha_id UUID REFERENCES parties(id),
  cha_name VARCHAR(255) NOT NULL,
  cha_license_no VARCHAR(64),
  customs_station VARCHAR(16) NOT NULL DEFAULT 'INMUN1',
  query_raised BOOLEAN DEFAULT FALSE,
  query_details TEXT,
  assessment_date DATE,
  duty_amount_inr NUMERIC(12,2) DEFAULT 0.00,
  duty_payment_status VARCHAR(16) DEFAULT 'Exempt' CHECK (duty_payment_status IN ('Exempt', 'Pending', 'Paid')),
  leo_status VARCHAR(24) NOT NULL DEFAULT 'Pending' CHECK (leo_status IN ('Pending', 'LEO Received', 'Customs Examined', 'Hold', 'Carted')),
  leo_number VARCHAR(32),
  leo_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_sb_number_org UNIQUE (org_id, shipping_bill_number, shipping_bill_date)
);

-- 6. Trucking & Drayage Haulage (Lorry Receipts LR)
CREATE TABLE IF NOT EXISTS trucking_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  job_number VARCHAR(32) NOT NULL,                 -- e.g. 'TRK-2026-4401'
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
  transporter_id UUID REFERENCES parties(id),
  transporter_name VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(32) NOT NULL,             -- Indian license plate: 'GJ-12-AZ-4412'
  driver_name VARCHAR(128) NOT NULL,
  driver_phone VARCHAR(32) NOT NULL,
  lorry_receipt_no VARCHAR(64) NOT NULL,           -- Bilty / LR Number
  eway_bill_no VARCHAR(32),                        -- GST e-Way Bill 12-digit number
  eway_bill_valid_upto TIMESTAMPTZ,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  freight_amount_inr NUMERIC(10,2) NOT NULL,
  advance_paid_inr NUMERIC(10,2) DEFAULT 0.00,
  balance_due_inr NUMERIC(10,2) DEFAULT 0.00,
  diesel_cost_inr NUMERIC(10,2) DEFAULT 0.00,
  toll_fastag_inr NUMERIC(10,2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'Dispatched' CHECK (status IN ('Assigned', 'Dispatched', 'At Pickup', 'In Transit', 'Delivered', 'POD Uploaded')),
  pod_document_url TEXT,
  gps_telemetry JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_trucking_job_org UNIQUE (org_id, job_number)
);

-- 7. Dangerous Goods (IMO IMDG Code Declarations)
CREATE TABLE IF NOT EXISTS dangerous_goods_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  declaration_no VARCHAR(32) NOT NULL,             -- e.g. 'DGD-2026-0812'
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  un_number VARCHAR(8) NOT NULL,                   -- e.g. 'UN 1993'
  proper_shipping_name TEXT NOT NULL,
  hazard_class dg_class_type NOT NULL,
  packing_group VARCHAR(8) CHECK (packing_group IN ('I', 'II', 'III', 'None')),
  subsidiary_risks VARCHAR(64),
  flash_point_celsius NUMERIC(5,1),
  marine_pollutant BOOLEAN DEFAULT FALSE,
  emergency_schedule_ems VARCHAR(32),              -- e.g. 'F-E, S-D'
  emergency_contact_name VARCHAR(128) NOT NULL,
  emergency_contact_phone VARCHAR(32) NOT NULL,
  carrier_dg_approval_status VARCHAR(20) DEFAULT 'Approved' CHECK (carrier_dg_approval_status IN ('Pending', 'Approved', 'Rejected')),
  port_fire_noc_obtained BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_dgd_org UNIQUE (org_id, declaration_no)
);

-- 8. Gatekeeper Approval Engine Queue
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  request_type VARCHAR(32) NOT NULL,               -- 'Credit Limit Override', 'High-Discount Quotation', 'BL Release Override', 'Detention Waiver', 'Vendor Payment'
  reference_id VARCHAR(64) NOT NULL,               -- e.g. 'MAPS-240342', 'INV-2026-0129'
  entity_type VARCHAR(32) NOT NULL,                -- 'Shipment', 'Invoice', 'DeliveryOrder', 'Quotation'
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  requested_by_name VARCHAR(128) NOT NULL,
  amount_inr NUMERIC(15,2),
  reason TEXT NOT NULL,
  risk_level VARCHAR(16) DEFAULT 'Medium' CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  status approval_status NOT NULL DEFAULT 'Pending',
  reviewed_by_user_id UUID REFERENCES users(id),
  reviewed_by_name VARCHAR(128),
  decision_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);
