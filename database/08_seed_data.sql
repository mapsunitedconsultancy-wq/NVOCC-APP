-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 08: Production-Grade Indian Logistics Seed Data
-- Corridors: Mundra (INMUN1), Nhava Sheva (INNSA1), Kandla (INIXY1) to Jebel Ali & Europe
-- ============================================================================

-- 1. Default Organization (Testing Pack Point 04)
INSERT INTO organizations (id, code, name, gstin, pan, iec_code, state_code, base_currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MAPS-MUNDRA',
  'MAPS Freight Solutions',
  '24AARCM6698J1ZK',
  'AARCM6698J',
  'AARCM6698J',
  '24',
  'INR'
) ON CONFLICT (code) DO NOTHING;

-- 2. Major Ports Reference
INSERT INTO ports (locode, port_name, country_code, country_name, state, has_cfs, icegate_port_code)
VALUES
  ('INMUN', 'Mundra Port', 'IN', 'India', 'Gujarat', TRUE, 'INMUN1'),
  ('INNSA', 'Nhava Sheva (JNPT)', 'IN', 'India', 'Maharashtra', TRUE, 'INNSA1'),
  ('INIXY', 'Deendayal Port (Kandla)', 'IN', 'India', 'Gujarat', TRUE, 'INIXY1'),
  ('INPAV', 'Pipavav Port', 'IN', 'India', 'Gujarat', TRUE, 'INPAV1'),
  ('AEJEA', 'Jebel Ali Port', 'AE', 'United Arab Emirates', 'Dubai', TRUE, NULL),
  ('DEHAM', 'Port of Hamburg', 'DE', 'Germany', 'Hamburg', TRUE, NULL),
  ('SGSIN', 'Port of Singapore', 'SG', 'Singapore', 'Singapore', TRUE, NULL),
  ('IRBND', 'Bandar Abbas', 'IR', 'Iran', 'Hormozgan', TRUE, NULL)
ON CONFLICT (locode) DO NOTHING;

-- 3. Core Parties Master (Testing Pack Point 04 Verified Checksum GSTINs)
INSERT INTO parties (id, org_id, party_code, legal_name, party_type, gstin, pan, iec_code, sez_status, address, city, state, state_code, country, pincode)
VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    '00000000-0000-0000-0000-000000000001',
    'SHP-KRI-01',
    'Krishna Ceramics',
    'shipper',
    '24AAKCK4521P1Z7',
    'AAKCK4521P',
    'AAKCK4521P',
    FALSE,
    'Plot 45, Ceramic Zone, Lalpar',
    'Morbi',
    'Gujarat',
    '24',
    'India',
    '363642'
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    '00000000-0000-0000-0000-000000000001',
    'SHP-SAU-02',
    'Saurashtra Minerals Pvt Ltd',
    'shipper',
    '24AAJCS8812R1ZM',
    'AAJCS8812R',
    'AAJCS8812R',
    FALSE,
    'Industrial Area, GIDC',
    'Bhuj',
    'Gujarat',
    '24',
    'India',
    '370001'
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    '00000000-0000-0000-0000-000000000001',
    'SHP-KUT-03',
    'Kutch Chemicals Industries',
    'shipper',
    '24AAMCK3390L1Z4',
    'AAMCK3390L',
    'AAMCK3390L',
    FALSE,
    'Plot 120, Chemical Zone',
    'Gandhidham',
    'Gujarat',
    '24',
    'India',
    '370201'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    '00000000-0000-0000-0000-000000000001',
    'CNE-MUE-01',
    'Mueller GmbH',
    'consignee',
    NULL,
    NULL,
    NULL,
    FALSE,
    'Hamburger Strasse 45',
    'Hamburg',
    'Hamburg',
    '99',
    'Germany',
    '20099'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    '00000000-0000-0000-0000-000000000001',
    'CAR-MSC-01',
    'Mediterranean Shipping Company (MSC)',
    'carrier',
    '27AAACM9988P1Z5',
    'AAACM9988P',
    NULL,
    FALSE,
    'MSC House, Andheri Kurla Road',
    'Mumbai',
    'Maharashtra',
    '27',
    'India',
    '400059'
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    '00000000-0000-0000-0000-000000000001',
    'CHA-KUTCH-01',
    'Kutch Customs Clearance Agency',
    'cha',
    '24AAACK3344M1Z9',
    'AAACK3344M',
    NULL,
    FALSE,
    'Adani Port Road, Near CFS Gate 2',
    'Mundra',
    'Gujarat',
    '24',
    'India',
    '370421'
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    '00000000-0000-0000-0000-000000000001',
    'CFS-SEABIRD-01',
    'Seabird Marine CFS Services',
    'cfs',
    '24AAACS7788L1Z3',
    'AAACS7788L',
    NULL,
    FALSE,
    'Plot 42, Port Logistics Park',
    'Mundra',
    'Gujarat',
    '24',
    'India',
    '370421'
  )
ON CONFLICT DO NOTHING;

-- 4. Vessels & Voyages
INSERT INTO vessels (id, imo_number, vessel_name, carrier_name, carrier_scac, teu_capacity)
VALUES
  ('22222222-2222-2222-2222-222222222201', '9845722', 'DP WORLD CHENNAI', 'Unifeeder / DP World', 'DPWL', 3200),
  ('22222222-2222-2222-2222-222222222202', '9708681', 'MSC JADE', 'MSC Mediterranean Shipping', 'MSCU', 9400),
  ('22222222-2222-2222-2222-222222222203', '9632064', 'MAERSK MC-KINNEY MOLLER', 'Maersk Line', 'MAEU', 18270)
ON CONFLICT (imo_number) DO NOTHING;

INSERT INTO voyages (id, vessel_id, voyage_number, pol_locode, pod_locode, etd, eta, cy_cutoff, si_cutoff, vgm_cutoff)
VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222201',
    '014W',
    'INMUN',
    'AEJEA',
    '2026-10-24 18:00:00+00',
    '2026-10-28 06:00:00+00',
    '2026-10-23 20:00:00+00',
    '2026-10-23 14:00:00+00',
    '2026-10-23 18:00:00+00'
  )
ON CONFLICT DO NOTHING;

-- 5. Seed Shipment (MAPS-240342)
INSERT INTO shipments (
  id,
  org_id,
  reference_no,
  booking_no,
  job_type,
  mode,
  service_type,
  incoterm,
  status,
  shipper_id,
  consignee_id,
  place_of_receipt,
  pol_locode,
  pod_locode,
  place_of_delivery,
  vessel_id,
  voyage_id,
  vessel_name,
  voyage_number,
  carrier_scac,
  etd,
  eta,
  cargo_description,
  hs_code,
  packages_count,
  gross_weight_kg,
  revenue_total_inr,
  cost_total_inr
) VALUES (
  '44444444-4444-4444-4444-444444444401',
  '00000000-0000-0000-0000-000000000001',
  'MAPS-240342',
  'BK-MUN-2026-0914',
  'Export',
  'Ocean',
  'FCL',
  'CIF',
  'sailed',
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111103',
  'Jamnagar Factory Gate',
  'INMUN',
  'AEJEA',
  'Jebel Ali Freezone, Dubai',
  '22222222-2222-2222-2222-222222222201',
  '33333333-3333-3333-3333-333333333301',
  'DP WORLD CHENNAI',
  '014W',
  'DPWL',
  '2026-10-24',
  '2026-10-28',
  'HIGH DENSITY POLYETHYLENE RESIN (GRADE HDPE-5502) IN 25KG BAGS',
  '39012000',
  880,
  22350.00,
  145000.00,
  105000.00
) ON CONFLICT DO NOTHING;

-- 6. Container Record
INSERT INTO containers (
  id,
  org_id,
  shipment_id,
  container_number,
  equipment_type,
  seal_number,
  customs_seal_number,
  tare_weight_kg,
  cargo_weight_kg,
  gross_weight_kg,
  vgm_weight_kg,
  current_stage,
  current_location,
  free_time_days,
  free_time_expiry
) VALUES (
  '55555555-5555-5555-5555-555555555501',
  '00000000-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444401',
  'MSKU2345678',
  '40HC',
  'SL-INMUN-98124',
  'CUS-GJ-22910',
  3920.00,
  22000.00,
  25920.00,
  25920.00,
  'Onboard Vessel',
  'Vessel DP WORLD CHENNAI En Route to Jebel Ali',
  14,
  CURRENT_DATE + INTERVAL '12 days'
) ON CONFLICT DO NOTHING;

-- 7. House Bill of Lading (HBL)
INSERT INTO house_bills_of_lading (
  id,
  org_id,
  hbl_number,
  shipment_id,
  shipper_id,
  consignee_id,
  bl_type,
  issue_date,
  shipped_on_board_date,
  place_of_issue
) VALUES (
  '66666666-6666-6666-6666-666666666601',
  '00000000-0000-0000-0000-000000000001',
  'MAPS-HBL-240342',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111103',
  'Original negotiable',
  '2026-10-24',
  '2026-10-24',
  'Mundra Port Office'
) ON CONFLICT DO NOTHING;

-- 8. GST Tax Invoice
INSERT INTO invoices (
  id,
  org_id,
  invoice_number,
  invoice_type,
  shipment_id,
  hbl_id,
  party_id,
  party_name,
  party_gstin,
  party_state_code,
  subtotal_amount,
  cgst_amount,
  sgst_amount,
  igst_amount,
  total_tax_amount,
  grand_total_amount,
  balance_due,
  currency,
  grand_total_inr,
  issue_date,
  due_date,
  status
) VALUES (
  '77777777-7777-7777-7777-777777777701',
  '00000000-0000-0000-0000-000000000001',
  'INV-2026-00431',
  'Tax Invoice',
  '44444444-4444-4444-4444-444444444401',
  '66666666-6666-6666-6666-666666666601',
  '11111111-1111-1111-1111-111111111101',
  'Reliance Polymers & Petrochemicals Ltd',
  '24AAACR1234Q1Z2',
  '24',
  122881.36,
  11059.32,
  11059.32,
  0.00,
  22118.64,
  145000.00,
  145000.00,
  'INR',
  145000.00,
  '2026-10-24',
  '2026-11-23',
  'posted'
) ON CONFLICT DO NOTHING;
