# MAPS NVOCC Pro v4.0 — Industry-Level Enterprise SaaS Upgrade

This plan provides the complete architectural and operational blueprint to elevate MAPS NVOCC Pro into the definitive Indian NVOCC/MTO SaaS ERP for MAPS Freight Solutions Pvt Ltd (Gandhidham / Mundra / Kandla). It delivers all 7 new operational modules simultaneously, enhances all 14 existing modules without breaking existing workflows, establishes unified approval chains, Indian statutory compliance engines, and a persistent context-aware Gemini AI Co-Pilot.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during interactive clarification and form the foundation of this build:
> - **Rollout Scope**: All seven new modules (EGM, IGM, SI Inbox, Quotation Pipeline, CHA Tracker, Trucking Jobs, Dangerous Goods) will be integrated concurrently with full data synchronization.
> - **Demo Dataset**: Seeded with a rich, realistic Mundra, Kandla, and Pipavav maritime dataset, including real Indian customs references, HS codes, container prefixes, and GSTIN party records.
> - **AI Co-pilot Interface**: Global floating action button with a sliding contextual drawer, equipped with shipment context awareness, rate lookup, and automated WhatsApp/email drafting.
> - **Zero-Regression Guarantee**: All existing 18 modules, customer portals, tracking routes, and B/L and DO print formats remain untouched and fully compatible.

---

## 1. Overview & Core Concept

* **What It Delivers**: A comprehensive, enterprise-grade NVOCC ERP replacing legacy desktop tools (eBMS, Logi-Sys, Softlink, Freight Office) with a modern web-native, multi-branch, ICEGATE/GSTIN-compliant operating platform.
* **Target Audience**: NVOCC owners, Operations Executives (Utsav), Finance Managers (Seema), Line Sales Managers (Rahul), Port Documentation Officers, and B2B Shippers (Customer Portal).
* **Core Value**: End-to-end execution from Sales RFQ intake to SI parsing, House B/L and Master B/L issuance, Indian Customs EGM/IGM filing, CHA/Trucking dispatch, Delivery Order release locks, and multi-currency agent settlements.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Inbound Import Flow**: Inward Vessel arrives &rarr; Agent Manifest uploaded & parsed by Gemini &rarr; IGM filed with ICEGATE &rarr; Bulk WhatsApp Arrival Notices sent &rarr; DO requested &rarr; Surrender & Payment checks enforced &rarr; DO issued with Lancer/APSEZ format & empty return instructions.
2. **Outbound Export Flow**: Customer RFQ received in Quotation Funnel &rarr; Rate Master auto-quote &rarr; Booking created &rarr; Customer submits SI (WhatsApp/Portal/Email) &rarr; Gemini SI Parser maps fields to Draft HBL &rarr; CHA files Shipping Bill (LEO tracked) &rarr; Trucking job dispatched &rarr; Vessel sails &rarr; EGM auto-compiled & filed to ICEGATE before 7-day deadline.
3. **Approval Escalation Flow**: User initiates a discount > 10% or DO release with pending invoices &rarr; System blocks execution & creates an Approval Request &rarr; Alert shows on Command Center for Admin/Finance &rarr; Approver reviews context with 1-click decision &rarr; Workflow auto-resumes.
4. **AI Co-Pilot Slide-Out**: User clicks the floating sparkle beacon &rarr; Drawer slides in with instant awareness of the active screen & selected shipment &rarr; User queries lane profitability, blocks, or auto-generates dispatch notifications.

### Visual Identity & Theme
* **Aesthetic**: Utilitarian, authoritative maritime command center aesthetics. Dark Slate (`#0A1628` background, `#0F1D33` cards, `#1C2D4A` borders) with vibrant Safety Amber (`#E88B2A`) and Emerald (`#10B981`) accents.
* **Typography**: Clean display sans typography for UI hierarchy paired with strict monospace tabular numerals (`font-mono tabular-nums`) for B/L numbers, container IDs, currency amounts, and ISO timestamps.
* **Density Posture**: Dual density toggle (Dense / Comfortable) with zero static pill enclosures on metadata, adhering to the anti-slop design constitution.

---

## 3. Key Product Decisions & Trade-Offs

* **Decision 1: Modular Sidebar Architecture with Category Grouping**
  * *Chosen Approach*: Group sidebar into logical maritime operational clusters: "Core Operations" (Shipments, SIs, HBL, MBL, DO, EGM, IGM), "Equipment & Land" (Container Control, Trucking Jobs, Consolidation), "Commercial & Sales" (Quotes Pipeline, Rates Master, CRM), "Finance & Compliance" (Invoicing, Agent Accounting, CHA Tracker, IMDG), and "Intelligence & Admin" (Vault, Comms, Reports, Insights, Settings).
  * *Why*: Accommodates 25+ total modules without cognitive overload while keeping key workflows 1 click away.
* **Decision 2: Centralized Workflow Engine & In-Memory Store with LocalStorage Persistence**
  * *Chosen Approach*: Extend `AppContext` with dedicated reducer slices for new entities (`egmFilings`, `igmRecords`, `shippingInstructions`, `quotations`, `chaJobs`, `truckingTrips`, `dgDeclarations`, `approvalRequests`, `lcRecords`, `insurancePolicies`).
  * *Why*: Near-instant client response time (< 50ms) with zero cloud latency during live operations, backed by real-time cross-tab synchronization.
* **Decision 3: Gemini Grounded Parsing & Co-Pilot Engine**
  * *Chosen Approach*: Use Gemini API structured prompting for SI parsing, document data extraction, and conversational queries with fallback heuristic rules.
  * *Why*: Guarantees continuous uptime and high parsing accuracy even for messy agent Excel manifests or scanned PDFs.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MAPS NVOCC PRO v4.0                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
   ┌───────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────┐
   │ NVOCC Core Operations │   │ Equipment, Road & Comp. │   │ Commercial & Sales    │
   ├───────────────────────┤   ├─────────────────────────┤   ├───────────────────────┤
   │ • Shipments (7 Steps) │   │ • Container Fleet & D&D │   │ • Rates Master (Spot/ │
   │ • Shipping Inst. (SI) │   │ • Trucking Jobs (LRs)   │   │   Contract/Surcharges)│
   │ • House B/L (3 Pages) │   │ • LCL Consolidation     │   │ • Quotation Pipeline  │
   │ • Master B/L (Liner)  │   │ • CHA & Shipping Bills  │   │   (Kanban Funnel)     │
   │ • Delivery Order (DO) │   │ • IMDG Dangerous Goods  │   │ • Party Master CRM    │
   │ • Export Manifest EGM │   │ • Repositioning & EIR   │   │   (Credit Risk Score) │
   │ • Import Manifest IGM │   │ • Marine Insurance & LC │   │ • Agent Accounting    │
   └───────────────────────┘   └─────────────────────────┘   └───────────────────────┘
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            ▼
   ┌─────────────────────────────────────────────────────────────────────────────────────┐
   │                     Central App State & Workflow Event Engine                       │
   │  • Approval Chain Engine (8 Pre-configured rules)                                   │
   │  • Surrender & Invoice Settlement Gatekeepers                                       │
   │  • Audit Trail Logger (Append-only change history)                                  │
   │  • Role-Based Persona Scoping (Super Admin, Operations, Finance, Sales, Shipper)    │
   └─────────────────────────────────────────────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
   ┌───────────────────────┐                                 ┌───────────────────────┐
   │ AI Co-Pilot & Drawer  │                                 │ Statutory & Port Gate │
   ├───────────────────────┤                                 ├───────────────────────┤
   │ • Contextual drawer   │                                 │ • ICEGATE EGM/IGM/SB  │
   │ • SI Parser (Gemini)  │                                 │ • GSTIN e-Invoice IRN │
   │ • WhatsApp AI Bot     │                                 │ • NIC e-Way Bill      │
   │ • Anomaly Detection   │                                 │ • SOLAS VGM & SEZ     │
   └───────────────────────┘                                 └───────────────────────┘
```

### Component Implementation Mapping
* `src/pages/ExportManifestPage.tsx`: EGM pending table, countdown timer (<48h alert), ICEGATE CSV builder, amendment workflow with DGFT reason codes.
* `src/pages/ImportManifestPage.tsx`: Inbound vessel grid (30-day ETA), Gemini agent manifest parser with IEC auto-check, bulk WhatsApp arrival notice generator.
* `src/pages/ShippingInstructionsPage.tsx`: Multi-channel inbox (WhatsApp, Portal, Email), side-by-side Gemini extractor, 1-click HBL draft generator.
* `src/pages/QuotationPipelinePage.tsx`: Kanban sales funnel (RFQ &rarr; Drafted &rarr; Sent &rarr; Negotiating &rarr; Won/Lost), Quote builder, salesperson analytics for Rahul.
* `src/pages/ChaTrackerPage.tsx`: Shipping Bill grid, LEO tracking, DBK/RoDTEP scheme tracker, 1-click ICEGATE status query link.
* `src/pages/TruckingJobsPage.tsx`: Active trucking trips, LR numbers, container seal photos, driver details, transporter rate cards.
* `src/pages/DangerousGoodsPage.tsx`: Searchable UN IMDG database (Class, PG, Marine Pollutant), Shipper's DGD PDF generator, LCL segregation matrix checker.
* `src/components/common/AiCopilotDrawer.tsx`: Persistent sliding assistant, context-aware prompts for active shipment/view, instant calculation and message drafting.
* `src/components/common/ApprovalQueueModal.tsx`: Global approval requests dialog triggered from Command Center or workflow gatekeepers.
* `src/data/v4DemoData.ts`: 100+ production-grade Indian shipping records across all 7 new modules and workflows.

---

## 5. Verification Plan

1. **Compilation & Syntax**: Run `compile_applet` and `lint_applet` to verify zero TypeScript errors.
2. **Sidebar Navigation**: Verify all 7 new modules mount at their exact designated sidebar slots with active badges.
3. **Data Flows**:
   * EGM builder auto-populates all sailed HBLs for Mundra vessels.
   * IGM arrival notice dispatches mock notifications to Communication Hub.
   * SI conversion creates a real draft HBL visible in HblPage.
   * Quotation Kanban supports drag/drop and conversion into confirmed bookings.
   * Approval requests block restricted actions (e.g. issuing DO with unpaid invoice) until approved by authorized persona.
4. **Print & PDF Integrity**: Verify HBL 3-page consolidated PDF and DO print templates remain pixel-perfect.
