# Export General Manifest (EGM) Filing Module
### Indian Customs ICEGATE (Section 41 Customs Act, 1962) Integration Pack for Antigravity & Web Apps

A self-contained, enterprise-grade React & TypeScript module for managing and lodging **Export General Manifests (EGM)** with the Indian Customs **ICEGATE portal**.

---

## 📌 Regulatory & Operational Background

Under **Section 41 of the Indian Customs Act, 1962**:
1. The Person-In-Charge of a vessel carrying export goods must deliver to the proper customs officer an Export Manifest in the prescribed electronic format before departure or **within 7 calendar days from the date of vessel departure/sailing**.
2. Failure to lodge within 7 days attracts penal proceedings and late filing penalties.
3. Upon electronic transmission, ICEGATE generates an official **IEM (Indian Export Manifest) Acknowledgement Number**.
4. Amendments or weight discrepancies post-customs examination require filing a **Supplementary EGM** referencing standardized **DGFT reason codes** (`DGFT-01` through `DGFT-04`).

---

## 📁 Folder Structure

```
egm-filing/
├── package.json                          # Sub-package descriptor & peer dependencies
├── README.md                             # Integration guide and ICEGATE specifications
├── index.ts                              # Barrel export for components, types, hooks, & utils
├── types.ts                              # TypeScript interfaces (EgmFiling, EgmAmendment, etc.)
├── data/
│   └── mockEgmData.ts                    # Sample vessel voyages, consignments, and DGFT codes
├── utils/
│   └── icegateExport.ts                  # ICEGATE flat file CSV generator, validator, & deadline math
├── hooks/
│   └── useEgmManager.ts                  # State management hook for filings, tabs, & modals
└── components/
    ├── EgmFilingModule.tsx               # Master drop-in container component
    ├── EgmManifestList.tsx               # Tabbed manifest table (Pending, Filed, Amended)
    ├── EgmDetailView.tsx                 # Detailed manifest builder with HBL consignments table
    ├── IemLodgmentModal.tsx              # ICEGATE IEM acknowledgement lodgment dialog
    ├── SupplementaryAmendmentModal.tsx   # DGFT reason-code supplementary filing dialog
    └── NewManifestModal.tsx              # New sailed voyage manifest initiation dialog
```

---

## 🚀 Quick Integration Guide

### 1. Requirements
Ensure your host application has:
- React 18 or 19
- Lucide React (`npm install lucide-react`)
- Tailwind CSS 3 or 4

### 2. Basic Drop-in Usage

```tsx
import React from 'react';
import { EgmFilingModule } from './egm-filing';

export const MyEgmPage: React.FC = () => {
  return (
    <div className="p-6 bg-[#0A1628] min-h-screen text-[#F4EFE6]">
      <EgmFilingModule
        currentUser={{ name: 'Logistics Officer', title: 'Export Lead' }}
        onToast={(type, title, desc) => {
          console.log(`[Toast ${type}] ${title}: ${desc}`);
        }}
      />
    </div>
  );
};
```

### 3. Custom Controlled Hook Usage

If your application already manages shipment state or stores data in Supabase/PostgreSQL/MongoDB:

```tsx
import React from 'react';
import { useEgmManager, EgmManifestList, EgmDetailView } from './egm-filing';

export const CustomEgmPage: React.FC = () => {
  const {
    filteredFilings,
    selectedFiling,
    setSelectedFilingId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    pendingCount,
    urgentCount,
    consignments,
    exportCsv
  } = useEgmManager({
    initialFilings: myBackendFilings,
    currentUser: { name: 'Captain Kumar', title: 'Port Operations Manager' }
  });

  return (
    <div>
      {selectedFiling ? (
        <EgmDetailView
          filing={selectedFiling}
          consignments={consignments}
          onBack={() => setSelectedFilingId(null)}
          onExportCsv={exportCsv}
          onOpenIemModal={() => {}}
          onOpenAmendModal={() => {}}
        />
      ) : (
        <EgmManifestList
          filings={filteredFilings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pendingCount={pendingCount}
          urgentCount={urgentCount}
          onSelectFiling={f => setSelectedFilingId(f.id)}
          onExportCsv={exportCsv}
        />
      )}
    </div>
  );
};
```

---

## 📑 ICEGATE Flat File CSV Specification

The module generates compliant flat files conforming to Indian Customs ICEGATE EDI:

| Field Index | Field Name | Description | Example |
|---|---|---|---|
| 1 | `MESSAGE_TYPE` | Flat file message code | `FGM` |
| 2 | `CUSTOMS_HOUSE_CODE` | Indian Port Customs location code | `INMUN1` (Mundra), `INNSA1` (Nhava Sheva) |
| 3 | `EGM_NO` | IEM Number or `PENDING` | `IEM-MUN-2026-881920` |
| 4 | `EGM_DATE` | Vessel departure date (DD-MM-YYYY) | `16-10-2026` |
| 5 | `IMO_CODE` | Vessel Lloyd's / IMO identification | `9234120` |
| 6 | `VESSEL_NAME` | SName of the carrying vessel | `"DP WORLD CHENNAI"` |
| 7 | `VOYAGE_NO` | Voyage identifier | `014W` |
| 8 | `LINE_NO` | Sequential manifest cargo line | `1` |
| 9 | `SUB_LINE_NO` | Sub-line for consolidated cargo | `1` |
| 10 | `HBL_NO` | House Bill of Lading Number | `LCMUNJEALMU2600407` |
| 11 | `HBL_DATE` | Date of HBL issue | `15-10-2026` |
| 12 | `CONTAINER_NO` | ISO 6346 Container Number | `FCIU2316385` |
| 13 | `SEAL_NO` | Customs bottle/bullet seal number | `1132934` |
| 14 | `PKG_COUNT` | Quantity & package packing code | `"1,420 CARTONS"` |
| 15 | `GROSS_WT_KG` | Certified SOLAS VGM Gross Weight (KG) | `26400` |
| 16 | `COMMODITY` | Cargo commercial description | `"PORCELAIN FLOOR TILES"` |
| 17 | `POL` | Port of Loading Indian UN/LOCODE | `INMUN` |
| 18 | `POD` | Port of Discharge UN/LOCODE | `AEJEA` |

---

## ⚖️ DGFT Supplementary Reason Codes

For post-filing adjustments per Customs Examination or Carrier operational diversion:

- **`DGFT-01`**: Quantity / Weight discrepancy (SOLAS VGM weighbridge variance or container re-stuffing).
- **`DGFT-02`**: Change of destination port (cargo diverted to alternative discharge port).
- **`DGFT-03`**: Cargo description correction (alignment of HS code with ICEGATE Shipping Bill).
- **`DGFT-04`**: Shipper / Consignee name amendment (typographical or endorsement rectification).

---

## 🎨 Design System & Theming

Designed in the **MAPS Deep Port Navy & Maritime Amber** theme:
- Primary Navy: `#0A1628`
- Surface Navy: `#0F1D33`, `#16263F`
- Border: `#26395A`, `#1C2D4A`
- Primary Accent: `#E88B2A` (Amber)
- Success: Emerald (`#10B981`)
- Urgent/Critical Alert: Rose (`#F43F5E`)
- Text: `#F4EFE6` (Off-white), `#A8A299` (Muted)
