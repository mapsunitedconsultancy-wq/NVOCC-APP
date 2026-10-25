-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 05: High-Performance Partitioning & Mission-Critical Indexes
-- Tuning for 100,000+ Concurrency, Millions of Milestones & Sub-5ms Query Latency
-- ============================================================================

-- ============================================================================
-- 1. DECLARATIVE TABLE PARTITIONING (Append-Heavy Event Streams)
-- ============================================================================

-- Container Tracking Events (High-velocity telemetry from port gates, GPS, carrier EDI)
CREATE TABLE IF NOT EXISTS container_tracking_events (
  id UUID DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  container_id UUID NOT NULL,
  container_number VARCHAR(16) NOT NULL,
  shipment_id UUID,
  event_time TIMESTAMPTZ NOT NULL,
  stage container_stage NOT NULL,
  location_name VARCHAR(128) NOT NULL,
  event_description TEXT NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',    -- 'PORT_GATE', 'ICEGATE', 'GPS', 'CARRIER_EDI', 'CFS'
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly Partitions (2026-2027)
CREATE TABLE IF NOT EXISTS container_tracking_events_2026_10 
  PARTITION OF container_tracking_events
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS container_tracking_events_2026_11 
  PARTITION OF container_tracking_events
  FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS container_tracking_events_2026_12 
  PARTITION OF container_tracking_events
  FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS container_tracking_events_2027_01 
  PARTITION OF container_tracking_events
  FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-02-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS container_tracking_events_default 
  PARTITION OF container_tracking_events DEFAULT;

-- System Audit Logs (Immutable compliance trail for customs and accounting)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  user_name VARCHAR(128) NOT NULL,
  user_role VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,                     -- e.g. 'HBL_ISSUED', 'DO_RELEASED', 'INVOICE_GENERATED'
  entity_type VARCHAR(64) NOT NULL,                -- 'Shipment', 'Invoice', 'EGM', 'DO'
  entity_id VARCHAR(64) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  old_data JSONB,
  new_data JSONB,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS audit_logs_2026_10 
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS audit_logs_2026_11 
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS audit_logs_2026_12 
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS audit_logs_default 
  PARTITION OF audit_logs DEFAULT;

-- ============================================================================
-- 2. STRATEGIC COMPOSITE & PARTIAL INDEXES (Sub-Millisecond Read Paths)
-- ============================================================================

-- Shipments: Primary operations list, multi-tenant active filtering
CREATE INDEX IF NOT EXISTS idx_shipments_org_status 
  ON shipments (org_id, status);

CREATE INDEX IF NOT EXISTS idx_shipments_org_created_desc 
  ON shipments (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_pol_pod 
  ON shipments (pol_locode, pod_locode);

CREATE INDEX IF NOT EXISTS idx_shipments_vessel_voyage 
  ON shipments (vessel_name, voyage_number);

-- Partial index for active (non-delivered, non-cancelled) shipments (hot dashboard query)
CREATE INDEX IF NOT EXISTS idx_shipments_active_hot 
  ON shipments (org_id, created_at DESC) 
  WHERE status NOT IN ('delivered', 'cancelled');

-- Containers: Live telemetry and D&D risk monitoring
CREATE INDEX IF NOT EXISTS idx_containers_number 
  ON containers (container_number);

CREATE INDEX IF NOT EXISTS idx_containers_shipment_id 
  ON containers (shipment_id);

CREATE INDEX IF NOT EXISTS idx_containers_current_stage 
  ON containers (org_id, current_stage);

-- Partial index for containers with expiring free time or accruing D&D charges
CREATE INDEX IF NOT EXISTS idx_containers_accruing_charges 
  ON containers (org_id, free_time_expiry) 
  WHERE current_stage IN ('Demurrage Accruing', 'Detention Accruing', 'CFS Grounded', 'Factory Gate In');

-- Bills of Lading: Fast lookup by document number and status
CREATE INDEX IF NOT EXISTS idx_hbl_number 
  ON house_bills_of_lading (hbl_number);

CREATE INDEX IF NOT EXISTS idx_hbl_shipment_id 
  ON house_bills_of_lading (shipment_id);

CREATE INDEX IF NOT EXISTS idx_mbl_number 
  ON master_bills_of_lading (mbl_number);

-- Invoicing & Financial Accounts: High-frequency billing queries
CREATE INDEX IF NOT EXISTS idx_invoices_party_id 
  ON invoices (party_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_org_status 
  ON invoices (org_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_shipment_id 
  ON invoices (shipment_id);

-- Partial index for unpaid/overdue invoices (finance follow-up queue)
CREATE INDEX IF NOT EXISTS idx_invoices_overdue_hot 
  ON invoices (org_id, due_date) 
  WHERE status IN ('posted', 'overdue') AND balance_due > 0;

-- Approval Queue: Instant retrieval of pending management decisions
CREATE INDEX IF NOT EXISTS idx_approvals_pending_hot 
  ON approval_requests (org_id, risk_level, created_at) 
  WHERE status = 'Pending';

-- CHA ICEGATE Clearances: Fast lookup for Shipping Bill & LEO
CREATE INDEX IF NOT EXISTS idx_cha_sb_number 
  ON cha_clearances (shipping_bill_number);

CREATE INDEX IF NOT EXISTS idx_cha_leo_status 
  ON cha_clearances (org_id, leo_status);

-- EGM / IGM Manifest Filings: Deadline tracking
CREATE INDEX IF NOT EXISTS idx_egm_deadline 
  ON export_general_manifests (org_id, icegate_deadline) 
  WHERE status = 'Draft';

-- Trucking & Drayage: Vehicle and e-Way Bill tracking
CREATE INDEX IF NOT EXISTS idx_trucking_vehicle 
  ON trucking_jobs (vehicle_number, status);

CREATE INDEX IF NOT EXISTS idx_trucking_lr_no 
  ON trucking_jobs (lorry_receipt_no);

-- Partition Indexes on container events
CREATE INDEX IF NOT EXISTS idx_container_events_lookup 
  ON container_tracking_events (container_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_container_events_number 
  ON container_tracking_events (container_number, event_time DESC);

-- ============================================================================
-- 3. TRIGRAM (GIN) FULL-TEXT & FUZZY SEARCH INDEXES
-- ============================================================================

-- Fast instant search across shipments (Cmd+K global palette)
CREATE INDEX IF NOT EXISTS idx_shipments_ref_trgm 
  ON shipments USING gin (reference_no gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shipments_booking_trgm 
  ON shipments USING gin (booking_no gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shipments_cargo_desc_trgm 
  ON shipments USING gin (cargo_description gin_trgm_ops);

-- Trigram search on party names & GSTIN
CREATE INDEX IF NOT EXISTS idx_parties_name_trgm 
  ON parties USING gin (legal_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_parties_gstin_trgm 
  ON parties USING gin (gstin gin_trgm_ops);

-- Trigram search on container numbers
CREATE INDEX IF NOT EXISTS idx_containers_num_trgm 
  ON containers USING gin (container_number gin_trgm_ops);

-- GIN indexing for dynamic JSONB metadata
CREATE INDEX IF NOT EXISTS idx_shipments_metadata_gin 
  ON shipments USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_si_extracted_data_gin 
  ON shipping_instructions USING gin (extracted_data);
