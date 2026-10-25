# MAPS NVOCC Pro — Enterprise Logistics & Freight Management

A complete, production-ready enterprise operating system for Non-Vessel Operating Common Carriers (NVOCC), Freight Forwarders, and multimodal logistics operators handling Indian and international trade lanes (Mundra, Nhava Sheva, Kandla, Jebel Ali, Singapore, Colombo, etc.).

---

## 🚀 Quick Start in Antigravity or Local Environment

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** or **yarn**

### 2. Installation
```bash
# Install all dependencies
npm install
```

### 3. Start Development Server
```bash
# Starts Vite dev server on port 3000
npm run dev
```

### 4. Build for Production
```bash
# Type-check and build optimized static assets in dist/
npm run build
```

---

## 📁 Project Architecture & Folder Structure

```text
codes/
├── index.html                   # HTML entry point with typography & meta headers
├── package.json                 # Dependencies (React 19, Vite, Tailwind CSS, Lucide icons, jsPDF)
├── tsconfig.json                # TypeScript compiler config
├── vite.config.ts               # Vite bundler config with Tailwind & React plugins
├── .env.example                 # Environment configuration template
├── .gitignore                   # Standard Git ignore rules
│
├── public/                      # Static assets & public resources
│
└── src/
    ├── main.tsx                 # React DOM root bootstrapping
    ├── App.tsx                  # Main router, layout orchestration & global modal hosts
    ├── index.css                # Tailwind CSS v4 directives & print styling
    │
    ├── components/
    │   ├── common/              # Universal shared components & modal controllers
    │   │   ├── ApprovalQueueModal.tsx      # Multi-level authorization gatekeeper
    │   │   ├── BarcodeScannerModal.tsx     # Container & barcode scanner interface
    │   │   ├── GlobalSearchModal.tsx       # Universal Cmd+K fuzzy search engine
    │   │   ├── KeyboardShortcutsModal.tsx  # Keyboard shortcuts legend
    │   │   ├── Modal.tsx                   # Accessible backdrop modal shell
    │   │   ├── NotificationsCenter.tsx     # Operations notification dropdown
    │   │   ├── PrintModal.tsx              # High-res A4 printable document engine (BL, DO, Invoices)
    │   │   ├── StatusPill.tsx              # Status badges (LEO, Filed, In Transit, Released)
    │   │   ├── ToastContainer.tsx          # Non-blocking operational toast alerts
    │   │   └── WhatsAppPreviewModal.tsx    # Live WhatsApp template preview & dispatch
    │   │
    │   ├── container-control/   # Container fleet telemetry & demurrage billing
    │   │   ├── AddContainerModal.tsx
    │   │   ├── BulkImportContainersModal.tsx
    │   │   ├── ContainerInvoiceModal.tsx
    │   │   └── PublicContainerTrackingView.tsx
    │   │
    │   └── layout/              # Application chrome & responsive navigation
    │       ├── Header.tsx                  # Top search bar, quick actions, role selector
    │       ├── Sidebar.tsx                 # Collapsible primary operations navigation
    │       └── MobileBottomNav.tsx         # Mobile handheld bottom tab bar
    │
    ├── context/
    │   └── AppContext.tsx       # Centralized state management & reactive operations store
    │
    ├── data/
    │   ├── mockData.ts          # Baseline master shipments, parties, vessels, rates & tariffs
    │   ├── v4DemoData.ts        # Advanced EGM/IGM manifests, SI inbox, CHA Shipping Bills, Trucking
    │   ├── ebmsData.ts          # Enterprise billing & multi-currency ledger data
    │   └── container-control/   # Demurrage/detention tariffs, CFS rules, carrier benchmarks
    │
    ├── pages/                   # Operational modules & interactive views
    │   ├── DashboardPage.tsx               # Command Center with KPI stats, timeline & task manager
    │   ├── ShipmentsPage.tsx               # Primary shipment index with advanced corridor filters
    │   ├── ShipmentDetailPage.tsx          # Single-shipment view with timeline, milestone logs & docs
    │   ├── CreateShipmentModal.tsx         # Full-featured shipment creation wizard
    │   ├── HblPage.tsx                     # House Bill of Lading generator & manager
    │   ├── CreateHblModal.tsx              # HBL creation & BL numbering modal
    │   ├── MblPage.tsx                     # Master Bill of Lading matching & carrier tracking
    │   ├── RecordMblModal.tsx              # Carrier MBL binding modal
    │   ├── DeliveryOrderPage.tsx           # Delivery Order (DO) issuance & destuffing clearances
    │   ├── CreateDeliveryOrderModal.tsx    # DO generator modal
    │   ├── ExportManifestPage.tsx          # Export General Manifest (EGM) ICEGATE filing engine
    │   ├── ImportManifestPage.tsx          # Import General Manifest (IGM) vessel arrival notice engine
    │   ├── ShippingInstructionsPage.tsx    # Multi-channel SI inbox & data extractor
    │   ├── ConsolidationPage.tsx           # LCL groupage consolidation load planner
    │   ├── ContainerControlPage.tsx        # Container inventory, detention & demurrage calculation
    │   ├── RateMasterPage.tsx              # Ocean carrier contract rates & port charges matrix
    │   ├── QuoteBuilderPage.tsx            # Multi-currency freight quote generator
    │   ├── QuotationPipelinePage.tsx       # Sales RFQ funnel & quotation CRM
    │   ├── ChaTrackerPage.tsx              # Customs CHA & ICEGATE Shipping Bill / LEO tracker
    │   ├── TruckingJobsPage.tsx            # Drayage, container haulage & Lorry Receipts (LR)
    │   ├── DangerousGoodsPage.tsx          # IMO Dangerous Goods (IMDG) & DGD declarations
    │   ├── InvoicingPage.tsx               # GST compliant invoicing, IRN & e-Way Bill tracking
    │   ├── CreateInvoiceModal.tsx          # Multi-item freight tax invoice builder
    │   ├── PartyMasterPage.tsx             # Shippers, consignees, shipping lines & CHA master directory
    │   ├── AgentAccountingPage.tsx         # Overseas agent profit share & debit/credit notes
    │   ├── DocumentVaultPage.tsx           # OCR electronic document vault
    │   ├── CustomerPortalPage.tsx          # B2B client self-service tracking & statement portal
    │   ├── PublicTrackingPage.tsx          # Standalone public milestone container tracking page
    │   ├── CommunicationHubPage.tsx        # Automated WhatsApp & email notifications hub
    │   ├── ReportsPage.tsx                 # Management Information System (MIS) analytics & exports
    │   ├── SettingsPage.tsx                # Organization profile, GSTIN, ICEGATE credentials & roles
    │   ├── IntelligencePage.tsx            # Corridor volume analytics & tariff predictions
    │   └── LandingPage.tsx                 # Public product showcase & brochure page
    │
    ├── types/
    │   ├── index.ts             # Domain models (Shipment, HBL, MBL, Invoice, Party, Rate, Container)
    │   └── v4Types.ts           # Enterprise extensions (EGM, IGM, SI, CHA, Trucking, Approval, IMDG)
    │
    └── utils/
        ├── automationChains.ts  # Multi-stage automated trigger actions
        ├── automation.test.ts   # Integration verification tests
        └── formatters.ts        # Currency formatting (INR/USD), dates & GST calculations

---

## 🛠️ Key Modules & Capabilities

1. **Indian Ports & Customs Ready**: Built-in support for Mundra (INMUN1), Nhava Sheva (INNSA1), Kandla (INIXY1), Pipavav, Hazira, and major global hubs (Jebel Ali, Singapore, Bandar Abbas).
2. **Statutory Compliance**: Pre-configured for ICEGATE EGM/IGM EDI formats, GSTIN IRN generation, e-Way bills, and SEZ zero-rated supply workflows.
3. **Multi-Role RBAC**: Pre-configured role-based views for Super Admin, Operations Manager, Finance Controller, and Sales Executive.
4. **Print & PDF Generation**: Integrated high-resolution A4 print templates for original Bills of Lading, Invoices, Delivery Orders, and Shipping Bills.
5. **Universal Search & Shortcuts**: Keyboard-driven workflow with `Cmd+K` / `Ctrl+K` for instant record lookup across shipments, containers, HBLs, and parties.
#   N V O C C - A P P  
 