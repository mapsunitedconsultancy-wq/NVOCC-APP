export type ImportStage = 
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'DISCHARGED'
  | 'AT CFS'
  | 'DO RECEIVED'
  | 'GATED OUT'
  | 'DELIVERED'
  | 'EMPTY IN TRANSIT'
  | 'EMPTY RETURNED'
  | 'BILLED';

export type ExportStage = 
  | 'BOOKING'
  | 'EMPTY PICKED UP'
  | 'STUFFING'
  | 'IN TRANSIT'
  | 'GATE-IN'
  | 'LEO/LOADED'
  | 'BILLED';

export type LifecycleStage = ImportStage | ExportStage;

export type RiskLevel = 'Safe' | 'Watch' | 'Critical' | 'Overdue';

export type Direction = 'Import' | 'Export';

export interface StageHistoryItem {
  stage: LifecycleStage;
  timestamp: string;
  location: string;
  updatedBy: string;
  notes?: string;
}

export interface CFSChargesBreakdown {
  groundRent: number;
  handling: number;
  documentation: number;
  forklift: number;
  weighment: number;
  specialSurcharges: number;
  subtotal: number;
  gst18: number;
  total: number;
}

export interface AlertHistoryItem {
  id: string;
  type: '72H_ALERT' | '48H_ALERT' | '24H_ALERT' | 'OVERDUE_ALERT' | 'GATE_OUT' | 'STAGE_UPDATE';
  timestamp: string;
  recipient: string;
  recipientRole: 'Shipper' | 'CHA' | 'Consignee' | 'Internal Ops';
  messagePreview: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'action_taken';
}

export interface ManagedContainer {
  id: string;
  containerNumber: string; // ISO 6346 (e.g., MSKU 2345678)
  shipmentId: string;
  shipperName: string;
  consigneeName: string;
  carrierName: string;
  carrierScac: string;
  equipmentType: "20'GP" | "40'GP" | "40'HC" | "20'RF" | "40'RF" | "20'OT" | "40'OT" | "20'FR" | "40'FR" | "20'TK" | "40'TK";
  cargoType: 'General Cargo' | 'Hazardous / DG' | 'Reefer' | 'ODC / OOG';
  unClass?: string;
  temperatureRequired?: string;
  sealNumber: string;
  direction: Direction;
  currentStage: LifecycleStage;
  stageHistory: StageHistoryItem[];
  daysAtStage: number;
  freeTimeDays: number;
  freeTimeStart: string;
  freeTimeEnd: string;
  freeTimeHoursRemaining: number;
  riskLevel: RiskLevel;
  demurragePerDayINR: number;
  detentionPerDayINR: number;
  totalDemurrageAccruedINR: number;
  cfsName: string;
  cfsLocation: string;
  cfsEntryDate: string;
  cfsDays: number;
  cfsChargesAccruedINR: number;
  cfsChargesBreakdown: CFSChargesBreakdown;
  publicTrackingToken: string;
  qrCodeUrl: string;
  alertsSent: AlertHistoryItem[];
  notes?: string;
  isHold?: boolean;
  holdReason?: string;
  grossWeightKg: number;
  vgmWeightKg: number;
}

export interface CFSTariff {
  id: string;
  name: string;
  operator: string;
  location: string;
  zone: string;
  specialty: string;
  typicalCostRange: string;
  groundRentSlabs20: {
    days1to3: number;
    days4to7: number;
    days8to15: number;
    days16to30: number;
    days30plus: number;
  };
  groundRentSlabs40: {
    days1to3: number;
    days4to7: number;
    days8to15: number;
    days16to30: number;
    days30plus: number;
  };
  handlingTHC: {
    teu20: number;
    feu40: number;
  };
  documentation: number;
  forkliftPerMove: number;
  weighment: number;
  fumigationPrep?: number;
  dgMultiplier: number;
  reeferDailyPower: number;
  reeferGroundRentMultiplier: number;
  odcMultiplier: number;
  weekendMultiplier: number;
  premiumSurchargePct?: number;
  rating: number;
  isFavorite?: boolean;
}

export interface CarrierFreeTimeRule {
  carrierName: string;
  scac: string;
  defaultFreeTimeDays: number;
  demurrageTiers20USD: {
    days1to5: number;
    days6to10: number;
    days11to15: number;
    days16plus: number;
  };
  demurrageTiers40USD: {
    days1to5: number;
    days6to10: number;
    days11to15: number;
    days16plus: number;
  };
  detentionTiers20USD: {
    days1to5: number;
    days6to10: number;
    days11plus: number;
  };
  detentionTiers40USD: {
    days1to5: number;
    days6to10: number;
    days11plus: number;
  };
}

export interface ContainerControlInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriod: string;
  placeOfSupply: string;
  billingModel: 'Per Container (₹80)' | 'Monthly Flat (₹8,000)' | 'Combined Enterprise';
  items: Array<{
    sl: number;
    description: string;
    hsnSac: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalINR: number;
  status: 'Paid' | 'Due' | 'Overdue';
  daysOverdue?: number;
  paidDate?: string;
  paymentMethod?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  description: string;
  refNo: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CustomerLedger {
  customerId: string;
  customerName: string;
  gstin: string;
  openingBalance: number;
  closingBalance: number;
  aging: {
    current: number; // 0-15 days
    days16to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number; // Critical
  };
  entries: CustomerLedgerEntry[];
}
