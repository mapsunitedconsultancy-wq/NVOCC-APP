-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 04: Financial Accounting, GST Invoicing & Tariff Rate Engines
-- High Scale Performance Tuning with Precise Decimal Math for Audits
-- ============================================================================

-- 1. Carrier Rate Master (Ocean Freight & Local Surcharges)
CREATE TABLE IF NOT EXISTS carrier_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  carrier_id UUID NOT NULL REFERENCES parties(id),
  carrier_name VARCHAR(128) NOT NULL,
  pol_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  equipment_type equipment_size_type NOT NULL,
  base_ocean_freight_usd NUMERIC(10,2) NOT NULL,
  bunker_surcharge_baf_usd NUMERIC(10,2) DEFAULT 0.00,
  terminal_handling_thc_inr NUMERIC(10,2) NOT NULL,
  documentation_fee_inr NUMERIC(10,2) NOT NULL DEFAULT 4500.00,
  isps_surcharge_usd NUMERIC(8,2) DEFAULT 15.00,
  seal_charge_inr NUMERIC(8,2) DEFAULT 800.00,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  free_days_at_pod INT DEFAULT 14,
  routing_type VARCHAR(16) DEFAULT 'Direct' CHECK (routing_type IN ('Direct', 'Transhipment')),
  transhipment_port VARCHAR(5) REFERENCES ports(locode),
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 2. Sales Quotations & CRM Pipeline
CREATE TABLE IF NOT EXISTS sales_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  quotation_number VARCHAR(32) NOT NULL,            -- e.g. 'QT-2026-8812'
  customer_id UUID NOT NULL REFERENCES parties(id),
  customer_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(128),
  contact_email VARCHAR(255),
  pol_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  pod_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  equipment_type equipment_size_type NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  commodity VARCHAR(255) NOT NULL,
  incoterm incoterm_type NOT NULL DEFAULT 'FOB',
  target_buy_rate_usd NUMERIC(10,2) NOT NULL,
  quoted_sell_rate_usd NUMERIC(10,2) NOT NULL,
  estimated_margin_inr NUMERIC(12,2) NOT NULL,
  pipeline_stage VARCHAR(32) NOT NULL DEFAULT 'Quotation Sent' CHECK (pipeline_stage IN ('Lead', 'RFQ Received', 'Quotation Sent', 'Customer Review', 'Negotiation', 'Won & Booked', 'Lost')),
  win_probability_percent INT DEFAULT 50,
  valid_until DATE NOT NULL,
  assigned_sales_rep_id UUID REFERENCES users(id),
  loss_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_quotation_per_org UNIQUE (org_id, quotation_number)
);

-- 3. Invoices (Indian GST Compliant Tax Invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(64) NOT NULL,             -- e.g. 'INV-2026-00431'
  invoice_type VARCHAR(32) NOT NULL DEFAULT 'Tax Invoice' CHECK (invoice_type IN ('Tax Invoice', 'Bill of Supply', 'Credit Note', 'Debit Note', 'Supplementary Invoice')),
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  hbl_id UUID REFERENCES house_bills_of_lading(id) ON DELETE SET NULL,
  mbl_id UUID REFERENCES master_bills_of_lading(id) ON DELETE SET NULL,
  party_id UUID NOT NULL REFERENCES parties(id),
  party_name VARCHAR(255) NOT NULL,
  party_gstin VARCHAR(15),
  party_state_code VARCHAR(2),
  supply_type VARCHAR(32) DEFAULT 'Intra-State' CHECK (supply_type IN ('Intra-State', 'Inter-State', 'SEZ with Payment', 'SEZ without Payment', 'Export under LUT')),
  
  -- Core Amounts (Decimal with 2 digits precision)
  subtotal_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  cgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  grand_total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  currency currency_code NOT NULL DEFAULT 'INR',
  exchange_rate_to_inr NUMERIC(10,4) DEFAULT 1.0000,
  grand_total_inr NUMERIC(15,2) NOT NULL DEFAULT 0.00,

  -- Indian Statutory E-Invoicing
  irn_hash VARCHAR(128),                           -- 64-character GST Invoice Reference Number
  irn_qr_code TEXT,                                -- Signed e-Invoice QR code payload
  irn_generated_at TIMESTAMPTZ,
  eway_bill_number VARCHAR(32),
  reverse_charge_applicable BOOLEAN DEFAULT FALSE,

  -- Status & Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'posted',
  payment_reference VARCHAR(128),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_invoice_no_per_org UNIQUE (org_id, invoice_number)
);

-- 4. Invoice Line Items (HSN/SAC Breakdown)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_description VARCHAR(255) NOT NULL,          -- e.g. 'Ocean Freight INMUN to AEJEA'
  sac_code VARCHAR(16) NOT NULL DEFAULT '996711',  -- 996711: Freight forwarding, 996719: Cargo handling
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1.000,
  unit_of_measure VARCHAR(16) DEFAULT 'CONTAINER',
  unit_rate NUMERIC(15,2) NOT NULL,
  taxable_amount NUMERIC(15,2) NOT NULL,
  gst_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  cgst_rate_percent NUMERIC(5,2) DEFAULT 9.00,
  cgst_amount NUMERIC(15,2) DEFAULT 0.00,
  sgst_rate_percent NUMERIC(5,2) DEFAULT 9.00,
  sgst_amount NUMERIC(15,2) DEFAULT 0.00,
  igst_rate_percent NUMERIC(5,2) DEFAULT 0.00,
  igst_amount NUMERIC(15,2) DEFAULT 0.00,
  total_item_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 5. CFS Handling & Destuffing Tariffs
CREATE TABLE IF NOT EXISTS cfs_tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  port_locode VARCHAR(5) NOT NULL REFERENCES ports(locode),
  cfs_facility_name VARCHAR(128) NOT NULL,
  equipment_type equipment_size_type NOT NULL,
  grounding_charge_inr NUMERIC(10,2) NOT NULL DEFAULT 2200.00,
  destuffing_labor_inr NUMERIC(10,2) NOT NULL DEFAULT 3500.00,
  survey_fee_inr NUMERIC(8,2) NOT NULL DEFAULT 500.00,
  loaded_storage_free_days INT NOT NULL DEFAULT 3,
  loaded_storage_day_1_to_5_inr NUMERIC(8,2) NOT NULL DEFAULT 650.00,
  loaded_storage_day_6_to_10_inr NUMERIC(8,2) NOT NULL DEFAULT 1200.00,
  loaded_storage_thereafter_inr NUMERIC(8,2) NOT NULL DEFAULT 2500.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 6. Overseas Agent Accounting & Profit Share Ledger
CREATE TABLE IF NOT EXISTS agent_accounting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES parties(id),
  agent_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(16) NOT NULL CHECK (document_type IN ('Debit Note', 'Credit Note', 'Statement')),
  document_number VARCHAR(64) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'USD',
  ocean_freight_split_usd NUMERIC(12,2) DEFAULT 0.00,
  destination_charges_usd NUMERIC(12,2) DEFAULT 0.00,
  profit_share_percent NUMERIC(5,2) DEFAULT 50.00,
  agent_net_due_usd NUMERIC(12,2) NOT NULL,
  exchange_rate_to_inr NUMERIC(10,4) NOT NULL,
  amount_inr NUMERIC(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Unsettled' CHECK (status IN ('Unsettled', 'Approved', 'Settled', 'Disputed')),
  settlement_reference VARCHAR(128),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_agent_doc_per_org UNIQUE (org_id, document_number)
);
