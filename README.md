# MAPS NVOCC Pro — Enterprise Logistics & Freight Management

<div align="center">

![Platform Version](https://img.shields.io/badge/version-4.0.0-blue.svg?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.0.1-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase Ready](https://img.shields.io/badge/Database-PostgreSQL_%2F_Supabase-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-orange.svg?style=for-the-badge)

<p align="center">
  <strong>Production-Grade Operating System for Non-Vessel Operating Common Carriers (NVOCC), Freight Forwarders, and Multimodal Logistics Operators.</strong>
</p>

<p align="center">
  Engineered specifically for Indian Ports (Mundra, Nhava Sheva, Kandla, Pipavav, Hazira) and Global Trade Corridors (Jebel Ali, Singapore, Colombo, Bandar Abbas, Rotterdam, Houston).
</p>

</div>

---

## 📑 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [Key Operational Modules](#-key-operational-modules)
  - [1. Freight & Shipments Core](#1-freight--shipments-core)
  - [2. Bill of Lading & Documentation Suite](#2-bill-of-lading--documentation-suite)
  - [3. Container Control & Demurrage Billing](#3-container-control--demurrage-billing)
  - [4. Indian Customs & Regulatory Compliance](#4-indian-customs--regulatory-compliance)
  - [5. Commercial, Rates & Quotations](#5-commercial-rates--quotations)
  - [6. Financials, Invoicing & GST Engine](#6-financials-invoicing--gst-engine)
  - [7. Drayage, Trucking & Intermodal Ops](#7-drayage-trucking--intermodal-ops)
  - [8. Dangerous Goods (IMDG) Management](#8-dangerous-goods-imdg-management)
  - [9. Customer Portal & Public Tracking](#9-customer-portal--public-tracking)
  - [10. Workflow Automation & Gatekeeper Approvals](#10-workflow-automation--gatekeeper-approvals)
- [Technology Stack](#-technology-stack)
- [Directory Architecture](#-directory-architecture)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Run](#installation--local-run)
  - [Production Build](#production-build)
- [Environment Configuration](#-environment-configuration)
- [Seed & Demonstration Data](#-seed--demonstration-data)
- [Keyboard Shortcuts & Power Features](#-keyboard-shortcuts--power-features)
- [License](#-license)

---

## 🌟 Overview & Value Proposition

**MAPS NVOCC Pro** transforms complex ocean freight, multi-modal transport, container leasing, customs brokerage, and freight accounting into a unified, high-speed digital command platform.

### Core Strengths
- **India Trade & Customs Ready**: Native workflows for ICEGATE EDI 1.5, EGM / IGM filings, Shipping Bills, LEO status checks, Form 13 gate-in passes, and e-Way bills.
- **Detention & Demurrage Protection**: Automated tariff calculations with free-day calendars, container aging tiers, and instant WhatsApp alerts to consignees.
- **Dual-Theme High Density UI**: Dark mode (`#0A1628`) and Light mode designed for logistics operators processing high-volume manifests.
- **Enterprise RBAC**: Role-based permissions for Super Admins, Operations Managers, Finance Controllers, Documentation Specialists, and Field Agents.
- **Instant Printable Documents**: High-resolution A4 print & PDF engines for Original Bills of Lading, Invoices, Delivery Orders, and EIR receipts.
- **Local-First with Cloud Agility**: Zero-latency offline mock database with instantaneous Supabase PostgreSQL connection options.

---

## 📦 Key Operational Modules

### 1. Freight & Shipments Core
- **Master Shipment Registry**: End-to-end tracking for FCL, LCL, Breakbulk, and Reefer shipments.
- **Corridor & Port Filtering**: Rapid filters by POL, POD, Shipping Line, Booking Number, or Job Code.
- **Multi-Tab 360° Dossier**: Single view covering cargo specs, container manifests, timeline events, finance ledgers, and document uploads.
- **Vessel Schedule Rolling**: Built-in exception handling to roll cargo across voyages with automated downstream updates.

### 2. Bill of Lading & Documentation Suite
- **House Bill of Lading (HBL)**: Automated HBL number sequencing, multi-modal terms, clause management, and printable original/draft copies.
- **Master Bill of Lading (MBL)**: Reconciliation between carrier MBLs and co-loaded HBLs.
- **Delivery Orders (DO)**: Digital DO generation with bank release checks, security deposit verification, and CFS destuffing permissions.
- **LCL Consolidation Engine**: Interactive volume and weight stuffing calculator for groupage containers (CBM and Gross Weight utilization bars).

### 3. Container Control & Demurrage Billing
- **Fleet Inventory & Status Tracker**: Real-time status tracking (`Available Depot`, `Stuffed CFS`, `On Board`, `Discharged`, `Empty Returned`, `Under Repair`).
- **Detention & Demurrage Calculator**: Dynamic slab tariffs (Days 1–7 Free, Days 8–14 Tier 1, Days 15+ Tier 2) with automated debit generation.
- **WhatsApp Alert Dispatcher**: Trigger customizable WhatsApp alerts to notify consignees of impending demurrage charges with direct download links.
- **Equipment Interchange Receipts (EIR)**: Damage logs, ISO size type classifications (`20GP`, `40HC`, `40OT`, `45HC`), and depot gate passes.

### 4. Indian Customs & Regulatory Compliance
- **Export General Manifest (EGM)**: EGM preparation, container stuffing validation, and ICEGATE export manifest status tracking.
- **Import General Manifest (IGM)**: Sub-line item creation, vessel arrival tracking, and batch arrival notice dispatch to importers.
- **Shipping Instructions (SI)**: Multi-channel SI inbox with auto-extraction into draft HBLs.
- **Customs CHA Tracker**: Tracking of Customs Broker jobs, Shipping Bills, PCVO inspections, and Let Export Orders (LEO).

### 5. Commercial, Rates & Quotations
- **Rate Master Matrix**: Ocean carrier freight rates, bunker adjustment factors (BAF), currency adjustment factors (CAF), and port THC rates.
- **Quote Builder & Pipeline**: Multi-currency quote generator with instant margin calculators, PDF proposal generation, and pipeline Kanban boards.
- **Special Rate Requests (SRR)**: Liner rate negotiation desk for project cargo and high-volume accounts.

### 6. Financials, Invoicing & GST Engine
- **GST Compliance**: Native support for CGST, SGST, IGST, HSN/SAC code mapping (`996511`, `996719`), and SEZ zero-rated invoicing with LUT numbers.
- **Multi-Currency Billing**: Support for transactions in INR, USD, EUR, and AED with exchange rate logging.
- **Overseas Agent Accounting**: Debit notes, credit notes, and profit-sharing reconciliations for international destination partners.

### 7. Drayage, Trucking & Intermodal Ops
- **First-Mile / Last-Mile Dispatch**: Fleet assignment, driver phone logging, and container road haulage management.
- **Lorry Receipt (LR) Generation**: Transporter documentation, weighbridge gross weight validation, and delivery proof capture.

### 8. Dangerous Goods (IMDG) Management
- **Hazmat Declarations**: UN Number registry, IMO hazard classes (Class 1 to 9), Packing Groups (I, II, III), and flashpoint records.
- **Segregation & Compatibility**: Automated compliance checks for maritime hazardous cargo stowage.

### 9. Customer Portal & Public Tracking
- **Public Container & Shipment Tracker**: Standalone tracking page accessible by customers without credentials using container or booking numbers.
- **B2B Self-Service Portal**: Importer and exporter dashboard for downloading invoices, DO releases, and tracking fleet inventory.

### 10. Workflow Automation & Gatekeeper Approvals
- **Unified Approvals Queue**: Governance gateway requiring dual-authorization for credit limit extensions, invoice waivers, and special rate requests.
- **Reactive Automation Chains**: Automated event bus that creates invoices upon HBL issuance, notifies operations on vessel delays, and updates container status on gate-in.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19 (`react`, `react-dom`) |
| **Language** | TypeScript 7 (strict type safety) |
| **Build Tool & Dev Server** | Vite 8 with HMR |
| **Styling & Design System** | Tailwind CSS v4, Custom CSS tokens, Glassmorphism, Micro-animations |
| **Icons & Visuals** | Lucide React (`lucide-react`) |
| **PDF & Canvas Export** | `jspdf`, `html2canvas` |
| **Database & Auth (Optional)** | Supabase JS Client (`@supabase/supabase-js`), PostgreSQL |
| **State Architecture** | React Context API with persistent `localStorage` synchronization |

---

## 📂 Directory Architecture

```text
nvocc-app/
├── index.html                   # HTML5 entry shell & typography
├── package.json                 # Core dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS v4
├── .env.example                 # Environment variables specification
├── .gitignore                   # Git exclusion definitions
│
├── public/                      # Static assets, icons, manifest
│
└── src/
    ├── main.tsx                 # Application entry point
    ├── App.tsx                  # Primary view router, layout wrapper & modal orchestration
    ├── index.css                # Global CSS rules, theme variables, print media rules
    │
    ├── components/
    │   ├── common/              # Shared modals and enterprise widgets
    │   │   ├── AccountSettingsModal.tsx    # User profile & organization credentials
    │   │   ├── ApprovalQueueModal.tsx      # Multi-level approval authorization gate
    │   │   ├── BarcodeScannerModal.tsx     # Equipment barcode / QR scanner
    │   │   ├── GlobalSearchModal.tsx       # Universal Cmd+K fuzzy search
    │   │   ├── KeyboardShortcutsModal.tsx  # Keyboard shortcuts overlay
    │   │   ├── Modal.tsx                   # Accessible modal container
    │   │   ├── NotificationsCenter.tsx     # Live operations alert bell
    │   │   ├── PrintModal.tsx              # Printable A4 Bill of Lading & Invoice document viewer
    │   │   ├── StatusPill.tsx              # Logistics status badges
    │   │   ├── ToastContainer.tsx          # Non-blocking notification toasts
    │   │   └── WhatsAppPreviewModal.tsx    # WhatsApp message dispatch engine
    │   │
    │   ├── container-control/   # Container fleet & detention management
    │   │   ├── AddContainerModal.tsx
    │   │   ├── BulkImportContainersModal.tsx
    │   │   ├── ContainerInvoiceModal.tsx
    │   │   └── PublicContainerTrackingView.tsx
    │   │
    │   └── layout/              # Structural components
    │       ├── Header.tsx                  # Top search bar, quick action triggers, user switch
    │       ├── Sidebar.tsx                 # Primary navigational sidebar with badges
    │       └── MobileBottomNav.tsx         # Mobile-responsive bottom bar
    │
    ├── context/
    │   └── AppContext.tsx       # Master state engine, seed data stores & actions
    │
    ├── data/
    │   ├── mockData.ts          # Core seed data: shipments, HBLs, MBLs, parties, invoices
    │   ├── v4DemoData.ts        # Advanced seed data: EGM, IGM, SI, CHA, Trucking, IMDG
    │   ├── ebmsData.ts          # Delivery orders & specialized tariff tables
    │   └── container-control/   # Fleet containers, detention rules, CFS matrices
    │
    ├── pages/                   # Application operational modules
    │   ├── DashboardPage.tsx               # Analytics, KPIs & urgent task tracker
    │   ├── ShipmentsPage.tsx               # Main shipments list & filters
    │   ├── ShipmentDetailPage.tsx          # Complete shipment 360° dossier
    │   ├── CreateShipmentModal.tsx         # New shipment creation wizard
    │   ├── HblPage.tsx                     # House B/L management
    │   ├── CreateHblModal.tsx              # HBL creation modal
    │   ├── MblPage.tsx                     # Master B/L management
    │   ├── RecordMblModal.tsx              # Carrier MBL binding modal
    │   ├── DeliveryOrderPage.tsx           # Delivery Order management
    │   ├── CreateDeliveryOrderModal.tsx    # DO issuance wizard
    │   ├── ConsolidationPage.tsx           # LCL groupage load optimization
    │   ├── ContainerControlPage.tsx        # Container fleet, aging & detention engine
    │   ├── RateMasterPage.tsx              # Carrier ocean contract rate tariffs
    │   ├── QuoteBuilderPage.tsx            # Multi-currency freight quote builder
    │   ├── QuotationPipelinePage.tsx       # Sales quotation CRM & RFQs
    │   ├── InvoicingPage.tsx               # GST freight invoicing & status tracker
    │   ├── CreateInvoiceModal.tsx          # Multi-line item tax invoice builder
    │   ├── PartyMasterPage.tsx             # CRM for Shippers, Consignees, Liners & CHAs
    │   ├── AgentAccountingPage.tsx         # Overseas agent statements & profit share
    │   ├── DocumentVaultPage.tsx           # Document archive with upload & categorization
    │   ├── CustomerPortalPage.tsx          # Customer self-service view
    │   ├── PublicTrackingPage.tsx          # Public milestone tracking view
    │   ├── CommunicationHubPage.tsx        # Automated SMS, WhatsApp & Email logs
    │   ├── ReportsPage.tsx                 # Operational & financial MIS reports
    │   ├── SettingsPage.tsx                # System, GSTIN & organization configuration
    │   ├── IntelligencePage.tsx            # Corridor volume insights & predictions
    │   ├── LandingPage.tsx                 # Product showcase landing page
    │   ├── ExportManifestPage.tsx          # EGM ICEGATE filing module
    │   ├── ImportManifestPage.tsx          # IGM arrival notice module
    │   ├── ShippingInstructionsPage.tsx    # Shipping Instructions (SI) inbox
    │   ├── ChaTrackerPage.tsx              # Customs CHA & Shipping Bill tracker
    │   ├── TruckingJobsPage.tsx            # Drayage & road transport jobs
    │   └── DangerousGoodsPage.tsx          # IMDG hazardous cargo declarations
    │
    ├── services/
    │   └── supabase.ts          # Supabase client instantiation & connectivity test
    │
    ├── types/
    │   ├── index.ts             # Primary domain TypeScript interfaces
    │   └── v4Types.ts           # Enterprise extensions (EGM, IGM, SI, CHA, Trucking, Approvals)
    │
    └── utils/
        ├── automationChains.ts  # Multi-stage automated event chain runners
        ├── automation.test.ts   # Integration test cases for event automation
        └── formatters.ts        # Currency (INR/USD), dates & GST calculators
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (Node 20+ recommended)
- **Package Manager**: `npm`, `yarn`, `pnpm`, or `bun`

### Installation & Local Run

```bash
# 1. Clone the repository
git clone https://github.com/mapsunitedconsultancy-wq/NVOCC-APP.git
cd NVOCC-APP

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be accessible at:
- **Local**: `http://localhost:3000/`
- **Network**: `http://<your-lan-ip>:3000/`

### Production Build

```bash
# Type check without emitting code
npm run lint

# Compile and produce optimized production bundle in dist/
npm run build

# Preview production build locally
npm run preview
```

---

## ⚙️ Environment Configuration

The application includes full local fallback data, so it works out of the box with zero required environment variables.

To connect real Supabase PostgreSQL persistence or Gemini AI capabilities, create a `.env` file in the root directory:

```env
# Optional: Supabase PostgreSQL Database Integration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# Optional: Google Gemini AI API Key for Intelligent Document Parsing
GEMINI_API_KEY="your-gemini-api-key"
```

A template is provided in [`.env.example`](file:///c:/Users/91886/Downloads/nvocc-app/.env.example).

---

## 🗄️ Seed & Demonstration Data

The platform comes pre-populated with realistic enterprise seed data designed for demonstration and operational testing:

- **Corridors**: Mundra (INMUN1), Nhava Sheva (INNSA1), Kandla (INIXY1), Jebel Ali (AEJEA), Singapore (SGSIN), Colombo (LKCMB).
- **Liners**: Maersk, MSC, CMA CGM, Hapag-Lloyd, ONE, Wan Hai.
- **Master Entities**: Shippers, Consignees, Notify Parties, Customs Brokers, and CFS Depots with valid GSTIN and IEC numbers.
- **Active Records**:
  - 10+ Complete multimodal shipments with milestones and document attachments.
  - Ready-to-print Bills of Lading, Delivery Orders, and GST Tax Invoices.
  - Active container fleet with real-time detention calculation scenarios.
  - Ready EGM/IGM manifests and customs Shipping Bills with LEO verification.

---

## ⌨️ Keyboard Shortcuts & Power Features

Designed for rapid, mouse-free operations in busy logistics offices:

| Shortcut | Action |
|---|---|
| `Cmd + K` or `Ctrl + K` | Open Universal Search Palette |
| `/` | Focus Universal Search (when not in an input) |
| `?` | View Keyboard Shortcuts Legend |
| `Cmd + N` or `Ctrl + N` | Open "+ New Shipment" Creation Wizard |
| `Cmd + H` or `Ctrl + H` | Open "+ New House B/L" Modal |
| `Cmd + I` or `Ctrl + I` | Open "+ New Invoice" Builder |
| `Esc` | Close any active modal or overlay |

---

## 📄 License

This software is distributed under the **Apache License 2.0**. See the `LICENSE` file for details.

---

<div align="center">
  <sub>Developed for next-generation freight forwarders, NVOCCs, and global multimodal supply chain operators.</sub>
</div>