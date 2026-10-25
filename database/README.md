# MAPS NVOCC Pro — PostgreSQL & Supabase Database Architecture

Enterprise-grade relational database design for Non-Vessel Operating Common Carriers (NVOCC) and Freight Forwarders operating Indian port corridors (Mundra, Nhava Sheva, Kandla, Pipavav) and international trade lanes (Jebel Ali, Singapore, Hamburg).

Engineered specifically to **cater 100,000+ active users** with high concurrency, sub-5ms query response times, multi-tenant organization isolation, and full Indian statutory compliance (ICEGATE EGM/IGM EDI, GSTIN IRN e-invoicing, e-Way Bills).

---

## 📁 Database Files & Execution Sequence

Execute the SQL scripts in this exact sequential order when provisioning your database in Supabase:

| Step | File | Purpose |
|------|------|---------|
| **01** | `01_extensions_and_enums.sql` | Enables `uuid-ossp`, `pgcrypto`, `pg_trgm`, `btree_gist`, `btree_gin` and establishes custom ENUM types. |
| **02** | `02_core_schema.sql` | Master tables: `organizations` (tenants), `users`, `ports` (UN/LOCODE), `parties` (CRM), `vessels`, `voyages`, `shipments`, `hbl`, `mbl`, `containers`. |
| **03** | `03_operations_and_manifests.sql` | Workflows: ICEGATE EGM, IGM, SI Inbox, Delivery Orders (DO), CHA Shipping Bills & LEO, Trucking Jobs (LR), IMDG Dangerous Goods, and Gatekeeper Approvals. |
| **04** | `04_finance_and_billing.sql` | Financials: Carrier rate master, sales quotations, GST tax invoices, invoice items (HSN/SAC), CFS tariffs, and overseas agent profit-share ledgers. |
| **05** | `05_partitioning_and_indexes.sql` | High-scale tuning: Declarative monthly table partitioning (`container_tracking_events`, `audit_logs`), composite indexes, partial indexes, and Trigram GIN search. |
| **06** | `06_triggers_and_functions.sql` | Automated calculators: Automatic `updated_at`, container demurrage & detention liability engine, shipment margin recalculators, and sub-5ms KPI aggregate RPCs. |
| **07** | `07_rls_security_policies.sql` | Supabase Row Level Security (RLS): Multi-tenant organization isolation, RBAC role gating (`super_admin`, `operations`, `finance`, `sales`), and Customer Portal view scoping. |
| **08** | `08_seed_data.sql` | Ready-to-use Indian logistics seed dataset for Mundra port (Reliance Industries, Tata Chemicals, MSC, DP World, live shipments, and containers). |

---

## ⚡ 100k+ Concurrency & Performance Architecture

### 1. Connection Pooling via Supavisor (Port 6543)
To handle 100,000+ concurrent users without exhausting PostgreSQL server connection limits:
- **Transaction Mode Pooler (`port 6543`)**: Use for all application API queries. Connections are held only for the duration of a transaction rather than an entire client session.
- **Session Mode (`port 5432`)**: Reserved strictly for migrations, schema changes (`drizzle-kit push`), and long-lived listening connections.

```env
# Supabase Transaction Pooling URL (supports 100k+ clients)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 2. Declarative Range Partitioning
High-velocity event streams (`container_tracking_events` and `audit_logs`) are partitioned monthly by `created_at`.
- Query planner eliminates non-matching partitions automatically (**Partition Pruning**).
- Old historical data can be detached or archived via zero-downtime partition drops (`ALTER TABLE ... DETACH PARTITION`).

### 3. Partial & Covering Indexes
Instead of indexing entire multi-million row tables, indexes target hot working subsets:
```sql
-- Hot query for Command Center active shipments (< 1ms execution)
CREATE INDEX idx_shipments_active_hot 
  ON shipments (org_id, created_at DESC) 
  WHERE status NOT IN ('delivered', 'cancelled');

-- Unpaid invoices follow-up queue
CREATE INDEX idx_invoices_overdue_hot 
  ON invoices (org_id, due_date) 
  WHERE status IN ('posted', 'overdue') AND balance_due > 0;

-- Pending authorization gatekeeper queue
CREATE INDEX idx_approvals_pending_hot 
  ON approval_requests (org_id, risk_level, created_at) 
  WHERE status = 'Pending';
```

### 4. Trigram Fuzzy Search (GIN)
Users typing partial container numbers, HBL numbers, or shipper names into the search palette benefit from `pg_trgm` GIN indexes:
```sql
CREATE INDEX idx_containers_num_trgm ON containers USING gin (container_number gin_trgm_ops);
CREATE INDEX idx_shipments_ref_trgm ON shipments USING gin (reference_no gin_trgm_ops);
```

---

## 🚀 Deployment Instructions for Supabase

### Option A: Using the Supabase Web Dashboard
1. Go to [database.new](https://database.new) and create or open your Supabase project.
2. Open the **SQL Editor** in the left sidebar.
3. Run the files sequentially from `01_extensions_and_enums.sql` through `08_seed_data.sql`.
4. Open the **Table Editor** to inspect the generated schema and seed data.

### Option B: Using the Supabase CLI
```bash
# Initialize and login
npx supabase login
npx supabase link --project-ref [YOUR_PROJECT_REF]

# Push all migrations in database/
cat database/01_extensions_and_enums.sql \
    database/02_core_schema.sql \
    database/03_operations_and_manifests.sql \
    database/04_finance_and_billing.sql \
    database/05_partitioning_and_indexes.sql \
    database/06_triggers_and_functions.sql \
    database/07_rls_security_policies.sql \
    database/08_seed_data.sql | npx supabase db execute
```

---

## 🔒 Security & Supabase Row Level Security (RLS)

All 26 tables have RLS enabled by default. User isolation is enforced via JWT claims:
- **`app_metadata.org_id`**: Restricts access so users never see records belonging to another logistics company.
- **`app_metadata.role`**: Enforces RBAC permissions (`super_admin`, `operations`, `finance`, `sales`, `customer`).
- **Customer Portal**: External shippers/consignees can only view consignments, BLs, and invoices explicitly tagged with their `party_id`.
