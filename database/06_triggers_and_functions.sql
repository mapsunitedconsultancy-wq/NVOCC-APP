-- ============================================================================
-- MAPS NVOCC Pro — PostgreSQL / Supabase Enterprise Database Architecture
-- Script 06: Database Triggers, High-Throughput Functions & KPI Analytics
-- ============================================================================

-- 1. Universal Timestamp Auto-Update Trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to all mutable master & transactional tables
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_timestamp ON %I;
      CREATE TRIGGER trg_set_timestamp
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();', t, t);
  END LOOP;
END $$;

-- 2. Automated Demurrage & Detention Calculation Engine
-- Calculates active days beyond free time and accrued INR liability
CREATE OR REPLACE FUNCTION calculate_container_charges(p_container_id UUID)
RETURNS TABLE (
  overdue_days INT,
  accrued_demurrage NUMERIC(12,2),
  accrued_detention NUMERIC(12,2),
  total_liability NUMERIC(12,2)
) AS $$
DECLARE
  v_container RECORD;
  v_days INT := 0;
  v_demurrage NUMERIC(12,2) := 0.00;
  v_detention NUMERIC(12,2) := 0.00;
BEGIN
  SELECT * INTO v_container FROM containers WHERE id = p_container_id;
  
  IF NOT FOUND OR v_container.free_time_expiry IS NULL THEN
    RETURN QUERY SELECT 0, 0.00::NUMERIC(12,2), 0.00::NUMERIC(12,2), 0.00::NUMERIC(12,2);
    RETURN;
  END IF;

  IF CURRENT_DATE > v_container.free_time_expiry THEN
    v_days := (CURRENT_DATE - v_container.free_time_expiry);
    
    -- Demurrage applies while container is at port/CFS
    IF v_container.current_stage IN ('CFS Grounded', 'Demurrage Accruing', 'Gate In Port') THEN
      v_demurrage := v_days * v_container.demurrage_per_day_inr;
    END IF;

    -- Detention applies while container is at factory or with transporter
    IF v_container.current_stage IN ('Factory In Transit', 'Factory Gate In', 'Factory Destuffing', 'Detention Accruing') THEN
      v_detention := v_days * v_container.detention_per_day_inr;
    END IF;
  END IF;

  RETURN QUERY SELECT 
    v_days, 
    v_demurrage, 
    v_detention, 
    (v_demurrage + v_detention)::NUMERIC(12,2);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Automatic Shipment Financial Totals Recalculator Trigger
CREATE OR REPLACE FUNCTION trigger_recalculate_shipment_finance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_margin_inr := COALESCE(NEW.revenue_total_inr, 0.00) - COALESCE(NEW.cost_total_inr, 0.00);
  
  IF COALESCE(NEW.revenue_total_inr, 0.00) > 0 THEN
    NEW.margin_percentage := ROUND(((NEW.net_margin_inr / NEW.revenue_total_inr) * 100)::numeric, 2);
  ELSE
    NEW.margin_percentage := 0.00;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_shipment_finance ON shipments;
CREATE TRIGGER trg_recalc_shipment_finance
BEFORE INSERT OR UPDATE OF revenue_total_inr, cost_total_inr ON shipments
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_shipment_finance();

-- 4. High-Performance Dashboard Analytics KPI RPC Function
-- Returns pre-aggregated operational statistics in a single round-trip (< 5ms)
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_active_shipments', (
      SELECT COUNT(*) FROM shipments 
      WHERE org_id = p_org_id AND status NOT IN ('delivered', 'cancelled')
    ),
    'at_port_cfs', (
      SELECT COUNT(*) FROM shipments 
      WHERE org_id = p_org_id AND status IN ('at_cfs', 'at_port')
    ),
    'on_vessel_sailed', (
      SELECT COUNT(*) FROM shipments 
      WHERE org_id = p_org_id AND status IN ('loaded', 'on_vessel', 'sailed')
    ),
    'customs_cleared', (
      SELECT COUNT(*) FROM shipments 
      WHERE org_id = p_org_id AND status = 'customs_cleared'
    ),
    'pending_approvals_count', (
      SELECT COUNT(*) FROM approval_requests 
      WHERE org_id = p_org_id AND status = 'Pending'
    ),
    'pending_icegate_egm', (
      SELECT COUNT(*) FROM export_general_manifests 
      WHERE org_id = p_org_id AND status = 'Draft'
    ),
    'unparsed_si_inbox', (
      SELECT COUNT(*) FROM shipping_instructions 
      WHERE org_id = p_org_id AND status = 'Unparsed'
    ),
    'containers_at_risk_dd', (
      SELECT COUNT(*) FROM containers 
      WHERE org_id = p_org_id 
        AND free_time_expiry IS NOT NULL 
        AND free_time_expiry <= (CURRENT_DATE + INTERVAL '2 days')
        AND current_stage NOT IN ('Destuffing Done', 'Empty Yard In')
    ),
    'total_unpaid_invoices_inr', (
      SELECT COALESCE(SUM(balance_due), 0.00) FROM invoices 
      WHERE org_id = p_org_id AND status IN ('posted', 'overdue')
    ),
    'monthly_revenue_inr', (
      SELECT COALESCE(SUM(grand_total_inr), 0.00) FROM invoices 
      WHERE org_id = p_org_id 
        AND issue_date >= date_trunc('month', CURRENT_DATE)
        AND status NOT IN ('draft', 'cancelled')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Safe Sequence Generators for Indian NVOCC Documents
CREATE SEQUENCE IF NOT EXISTS seq_shipment_ref START 240400;
CREATE SEQUENCE IF NOT EXISTS seq_hbl_no START 240400;
CREATE SEQUENCE IF NOT EXISTS seq_invoice_no START 450;
CREATE SEQUENCE IF NOT EXISTS seq_do_no START 350;

CREATE OR REPLACE FUNCTION generate_next_shipment_ref()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'MAPS-' || nextval('seq_shipment_ref')::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_next_hbl_no()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'MAPS-HBL-' || nextval('seq_hbl_no')::TEXT;
END;
$$ LANGUAGE plpgsql;
