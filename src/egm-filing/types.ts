// ══════════════════════════════════════════════════════════════════════════
// EGM (Export General Manifest) Module — TypeScript Definitions
// Compliant with Indian Customs ICEGATE Regulations (Customs Act 1962, Sec 41)
// ══════════════════════════════════════════════════════════════════════════

export interface EgmAmendment {
  id: string;
  filedAt: string;
  priorValues: Record<string, any>;
  newValues: Record<string, any>;
  reasonCode: string; // e.g. 'DGFT-01', 'DGFT-02', 'DGFT-03', 'DGFT-04'
  reasonDescription: string;
  approvedBy: string;
}

export interface EgmContainerItem {
  containerNumber: string;
  sealNumber: string;
  sizeType?: string; // 20GP, 40HC, 40GP
  grossWeightKg?: number;
}

export interface EgmConsignmentDetail {
  hblNumber: string;
  hblDate?: string;
  shipperName: string;
  shipperAddress?: string;
  consigneeName: string;
  consigneeAddress?: string;
  containers: EgmContainerItem[];
  packageCountAndType: string;
  grossWeightKg: number;
  cargoDescription: string;
  polCode: string; // e.g. INMUN
  podCode: string; // e.g. AEJEA, NLRTM
  customsHouseCode?: string; // e.g. INMUN1
  lineNo?: number;
  subLineNo?: number;
}

export interface EgmFiling {
  id: string;
  vesselVoyage: string;
  vesselName: string;
  voyageNumber: string;
  carrierName: string;
  pol: string; // e.g. 'Mundra (INMUN)'
  pod: string; // e.g. 'Jebel Ali (AEJEA)'
  sailedDate: string; // DD-MM-YYYY
  filingDeadline: string; // DD-MM-YYYY (Mandatory within 7 days of sailing)
  hblCount: number;
  containerCount: number;
  totalGrossWtKg: number;
  status: 'Draft' | 'Filed' | 'Amended';
  iemNumber?: string; // ICEGATE Acknowledgement Number e.g. IEM-MUN-2026-881920
  filedAt?: string;
  filedBy?: string;
  amendments: EgmAmendment[];
  hblList: string[]; // List of HBL Numbers included in this manifest
  consignments?: EgmConsignmentDetail[]; // Optional rich consignment details
  isDeadlineUrgent: boolean; // < 48 hours remaining before 7-day penalty threshold
  hoursRemaining: number;
}

export interface IcegateCsvRow {
  messageType: 'FGM';
  customsHouseCode: string;
  egmNo: string;
  egmDate: string;
  imoCode: string;
  vesselName: string;
  voyageNo: string;
  lineNo: number;
  subLineNo: number;
  hblNo: string;
  hblDate: string;
  containerNo: string;
  sealNo: string;
  pkgCount: string;
  grossWtKg: number;
  commodity: string;
  pol: string;
  pod: string;
}

export interface DgftReasonCode {
  code: string;
  label: string;
  description: string;
}

export interface NewManifestPayload {
  vesselName: string;
  voyageNumber: string;
  carrierName: string;
  pol: string;
  pod: string;
  sailedDate: string;
  hblList: string[];
  containerCount: number;
  totalGrossWtKg: number;
}
