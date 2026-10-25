/**
 * MAPS NVOCC Pro — Drizzle ORM TypeScript Schema Mapping
 * Mirrors PostgreSQL / Supabase Tables for Server-side ORM Operations
 * Scaled for 100k+ Concurrency with Strict Foreign Keys and Type-Safety
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'operations',
  'finance',
  'sales',
  'customer'
]);

export const shipmentStatusEnum = pgEnum('shipment_status', [
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
]);

export const jobTypeEnum = pgEnum('job_type', ['Export', 'Import', 'Cross-trade']);
export const transportModeEnum = pgEnum('transport_mode', ['Ocean', 'Air', 'Rail', 'Road']);
export const serviceTypeEnum = pgEnum('service_type', ['FCL', 'LCL', 'Breakbulk']);
export const incotermEnum = pgEnum('incoterm_type', ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'FCA', 'CIP', 'CPT']);
export const equipmentSizeTypeEnum = pgEnum('equipment_size_type', [
  '20GP', '40GP', '40HC', '20RF', '40RF', '20OT', '40OT', '20FR', '40FR', '20TK', '40TK', '45HC'
]);
export const currencyCodeEnum = pgEnum('currency_code', ['INR', 'USD', 'EUR', 'AED', 'GBP', 'SGD']);
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled', 'credit_note_issued'
]);

// 1. Organizations (Multi-Tenancy)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  gstin: varchar('gstin', { length: 15 }).unique(),
  pan: varchar('pan', { length: 10 }),
  iecCode: varchar('iec_code', { length: 10 }),
  stateCode: varchar('state_code', { length: 2 }),
  baseCurrency: currencyCodeEnum('base_currency').default('INR'),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 2. Application Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  role: userRoleEnum('role').default('operations').notNull(),
  department: varchar('department', { length: 64 }).default('Operations'),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 20 }).default('active'),
  metadata: jsonb('metadata').default({}),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 3. Ports Reference
export const ports = pgTable('ports', {
  locode: varchar('locode', { length: 5 }).primaryKey(),
  portName: varchar('port_name', { length: 128 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  countryName: varchar('country_name', { length: 64 }).notNull(),
  state: varchar('state', { length: 64 }),
  hasCfs: boolean('has_cfs').default(true),
  icegatePortCode: varchar('icegate_port_code', { length: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 4. Parties Master (CRM)
export const parties = pgTable('parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  partyCode: varchar('party_code', { length: 32 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  tradeName: varchar('trade_name', { length: 255 }),
  partyType: varchar('party_type', { length: 32 }).notNull(),
  gstin: varchar('gstin', { length: 15 }),
  pan: varchar('pan', { length: 10 }),
  iecCode: varchar('iec_code', { length: 10 }),
  sezStatus: boolean('sez_status').default(false),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0.00'),
  creditDays: integer('credit_days').default(30),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  address: text('address').notNull(),
  city: varchar('city', { length: 64 }).notNull(),
  state: varchar('state', { length: 64 }).notNull(),
  stateCode: varchar('state_code', { length: 2 }),
  country: varchar('country', { length: 64 }).default('India').notNull(),
  countryCode: varchar('country_code', { length: 2 }).default('IN').notNull(),
  pincode: varchar('pincode', { length: 16 }),
  kycVerified: boolean('kyc_verified').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 5. Vessels & Voyages
export const vessels = pgTable('vessels', {
  id: uuid('id').primaryKey().defaultRandom(),
  imoNumber: varchar('imo_number', { length: 16 }).unique(),
  vesselName: varchar('vessel_name', { length: 128 }).notNull(),
  carrierName: varchar('carrier_name', { length: 128 }),
  carrierScac: varchar('carrier_scac', { length: 8 }),
  teuCapacity: integer('teu_capacity'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const voyages = pgTable('voyages', {
  id: uuid('id').primaryKey().defaultRandom(),
  vesselId: uuid('vessel_id').notNull().references(() => vessels.id),
  voyageNumber: varchar('voyage_number', { length: 32 }).notNull(),
  polLocode: varchar('pol_locode', { length: 5 }).notNull().references(() => ports.locode),
  podLocode: varchar('pod_locode', { length: 5 }).notNull().references(() => ports.locode),
  etd: timestamp('etd', { withTimezone: true }).notNull(),
  eta: timestamp('eta', { withTimezone: true }).notNull(),
  cyCutoff: timestamp('cy_cutoff', { withTimezone: true }),
  siCutoff: timestamp('si_cutoff', { withTimezone: true }),
  vgmCutoff: timestamp('vgm_cutoff', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// 6. Shipments
export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  referenceNo: varchar('reference_no', { length: 64 }).notNull(),
  bookingNo: varchar('booking_no', { length: 64 }).notNull(),
  jobType: jobTypeEnum('job_type').default('Export').notNull(),
  mode: transportModeEnum('mode').default('Ocean').notNull(),
  serviceType: serviceTypeEnum('service_type').default('FCL').notNull(),
  incoterm: incotermEnum('incoterm').default('FOB').notNull(),
  status: shipmentStatusEnum('status').default('booked').notNull(),

  shipperId: uuid('shipper_id').notNull().references(() => parties.id),
  consigneeId: uuid('consignee_id').notNull().references(() => parties.id),
  notifyPartyId: uuid('notify_party_id').references(() => parties.id),
  agentId: uuid('agent_id').references(() => parties.id),
  chaId: uuid('cha_id').references(() => parties.id),
  transporterId: uuid('transporter_id').references(() => parties.id),
  assignedUserId: uuid('assigned_user_id').references(() => users.id),

  placeOfReceipt: varchar('place_of_receipt', { length: 128 }).notNull(),
  polLocode: varchar('pol_locode', { length: 5 }).notNull().references(() => ports.locode),
  podLocode: varchar('pod_locode', { length: 5 }).notNull().references(() => ports.locode),
  placeOfDelivery: varchar('place_of_delivery', { length: 128 }).notNull(),

  vesselId: uuid('vessel_id').references(() => vessels.id),
  voyageId: uuid('voyage_id').references(() => voyages.id),
  vesselName: varchar('vessel_name', { length: 128 }).notNull(),
  voyageNumber: varchar('voyage_number', { length: 32 }).notNull(),
  carrierScac: varchar('carrier_scac', { length: 8 }).notNull(),
  etd: date('etd').notNull(),
  eta: date('eta').notNull(),
  transitDays: integer('transit_days').default(0),

  cargoDescription: text('cargo_description').notNull(),
  hsCode: varchar('hs_code', { length: 16 }).notNull(),
  packagesCount: integer('packages_count').default(1).notNull(),
  packageType: varchar('package_type', { length: 64 }).default('PACKAGES'),
  grossWeightKg: numeric('gross_weight_kg', { precision: 12, scale: 2 }).default('0.00').notNull(),
  volumeCbm: numeric('volume_cbm', { precision: 10, scale: 3 }).default('0.000'),

  revenueTotalInr: numeric('revenue_total_inr', { precision: 15, scale: 2 }).default('0.00'),
  costTotalInr: numeric('cost_total_inr', { precision: 15, scale: 2 }).default('0.00'),
  netMarginInr: numeric('net_margin_inr', { precision: 15, scale: 2 }).default('0.00'),
  marginPercentage: numeric('margin_percentage', { precision: 5, scale: 2 }).default('0.00'),

  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 7. Bills of Lading (HBL)
export const houseBillsOfLading = pgTable('house_bills_of_lading', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  hblNumber: varchar('hbl_number', { length: 64 }).notNull(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  shipperId: uuid('shipper_id').notNull().references(() => parties.id),
  consigneeId: uuid('consignee_id').notNull().references(() => parties.id),
  blType: varchar('bl_type', { length: 32 }).default('Original negotiable'),
  issueDate: date('issue_date').notNull(),
  shippedOnBoardDate: date('shipped_on_board_date'),
  isSurrendered: boolean('is_surrendered').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 8. Containers
export const containers = pgTable('containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  shipmentId: uuid('shipment_id').references(() => shipments.id),
  containerNumber: varchar('container_number', { length: 16 }).notNull(),
  equipmentType: equipmentSizeTypeEnum('equipment_type').default('40HC').notNull(),
  sealNumber: varchar('seal_number', { length: 32 }).notNull(),
  tareWeightKg: numeric('tare_weight_kg', { precision: 10, scale: 2 }).default('3800.00').notNull(),
  grossWeightKg: numeric('gross_weight_kg', { precision: 10, scale: 2 }).default('0.00').notNull(),
  vgmWeightKg: numeric('vgm_weight_kg', { precision: 10, scale: 2 }).default('0.00').notNull(),
  currentStage: varchar('current_stage', { length: 64 }).default('Gate In Port').notNull(),
  currentLocation: varchar('current_location', { length: 128 }).notNull(),
  freeTimeDays: integer('free_time_days').default(14).notNull(),
  freeTimeExpiry: date('free_time_expiry'),
  demurragePerDayInr: numeric('demurrage_per_day_inr', { precision: 10, scale: 2 }).default('3500.00'),
  detentionPerDayInr: numeric('detention_per_day_inr', { precision: 10, scale: 2 }).default('4000.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// 9. Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  invoiceNumber: varchar('invoice_number', { length: 64 }).notNull(),
  shipmentId: uuid('shipment_id').references(() => shipments.id),
  partyId: uuid('party_id').notNull().references(() => parties.id),
  partyName: varchar('party_name', { length: 255 }).notNull(),
  subtotalAmount: numeric('subtotal_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
  totalTaxAmount: numeric('total_tax_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
  grandTotalAmount: numeric('grand_total_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
  balanceDue: numeric('balance_due', { precision: 15, scale: 2 }).default('0.00').notNull(),
  currency: currencyCodeEnum('currency').default('INR').notNull(),
  grandTotalInr: numeric('grand_total_inr', { precision: 15, scale: 2 }).default('0.00').notNull(),
  irnHash: varchar('irn_hash', { length: 128 }),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  status: invoiceStatusEnum('status').default('posted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Relationships
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  parties: many(parties),
  shipments: many(shipments),
  invoices: many(invoices)
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  organization: one(organizations, { fields: [shipments.orgId], references: [organizations.id] }),
  shipper: one(parties, { fields: [shipments.shipperId], references: [parties.id] }),
  consignee: one(parties, { fields: [shipments.consigneeId], references: [parties.id] }),
  containers: many(containers),
  invoices: many(invoices),
  hbls: many(houseBillsOfLading)
}));
