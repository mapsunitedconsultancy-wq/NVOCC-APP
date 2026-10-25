// ══════════════════════════════════════════════════════════════════════════
// MAPS NVOCC PRO v4.0 — TYPE DEFINITIONS & SCHEMAS
// ══════════════════════════════════════════════════════════════════════════

// A1. Export Manifest (EGM)
export interface EgmAmendment {
  id: string;
  filedAt: string;
  priorValues: Record<string, any>;
  newValues: Record<string, any>;
  reasonCode: string; // e.g., 'DGFT-01: Quantity discrepancy', 'DGFT-04: Shipper amendment'
  reasonDescription: string;
  approvedBy: string;
}

export interface EgmFiling {
  id: string;
  vesselVoyage: string;
  vesselName: string;
  voyageNumber: string;
  carrierName: string;
  pol: string;
  pod: string;
  sailedDate: string;
  filingDeadline: string; // 7 days from sailing
  hblCount: number;
  containerCount: number;
  totalGrossWtKg: number;
  status: 'Draft' | 'Filed' | 'Amended';
  iemNumber?: string;
  filedAt?: string;
  filedBy?: string;
  amendments: EgmAmendment[];
  hblList: string[];
  isDeadlineUrgent: boolean; // < 48 hours left
  hoursRemaining: number;
}

// A2. Import Manifest (IGM)
export interface IgmConsignment {
  id: string;
  hblNumber: string;
  mblNumber: string;
  shipper: string;
  consignee: string;
  consigneeGstin?: string;
  consigneeIec?: string;
  isIecVerified: boolean;
  containerNumber: string;
  sealNumber: string;
  sizeType: string;
  cargoDescription: string;
  grossWeightKg: number;
  packageCount: string;
  lineMatched: boolean;
  arrivalNoticeSent: boolean;
  arrivalNoticeSentAt?: string;
  doStatus: 'Not Requested' | 'Requested' | 'Issued';
  cfsName: string;
  chargesEstimateINR: number;
}

export interface IgmRecord {
  id: string;
  vesselVoyage: string;
  vesselName: string;
  voyageNumber: string;
  agentOrigin: string;
  eta: string;
  hblCount: number;
  lineIgmNumber: string;
  lineIgmDate: string;
  itemNumber: string;
  status: 'Pending' | 'Partial' | 'Full' | 'Reconciled';
  matchPercentage: number;
  consignments: IgmConsignment[];
  discrepanciesCount: number;
}

// A3. Shipping Instructions (SI)
export interface ShippingInstruction {
  id: string;
  siNumber: string;
  channel: 'WhatsApp' | 'Portal' | 'Email';
  senderName: string;
  senderContact: string;
  receivedAt: string;
  matchedShipmentId?: string;
  matchedHblNumber?: string;
  status: 'Unparsed' | 'Parsed' | 'Converted to HBL Draft' | 'Rejected';
  rawContent: string;
  parsedData: {
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    notifyParty?: string;
    pol?: string;
    pod?: string;
    cargoDescription?: string;
    hsCode?: string;
    packageCount?: string;
    grossWeightKg?: number;
    volumeCbm?: number;
    containers?: Array<{
      containerNumber: string;
      sealNumber: string;
      sizeType: string;
    }>;
    specialInstructions?: string;
  };
  parsingConfidence: number;
  attachedDocName?: string;
}

// A4. Quotation Pipeline (Sales CRM)
export interface CarrierOption {
  carrier: string;
  transitDays: number;
  baseFreightUSD: number;
  surchargesUSD: number;
  totalUSD: number;
  validTill: string;
  frequency: string;
}

export interface SalesQuotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  pol: string;
  pod: string;
  containerType: string;
  containerCount: number;
  commodity: string;
  targetRateUSD?: number;
  offeredRateUSD: number;
  marginINR: number;
  validTill: string;
  requiredByDate: string;
  salesPerson: 'Rahul Sharma' | 'Utsav Joshi' | 'Seema Patel' | 'Aman Dana';
  stage: 'RFQ Received' | 'Quote Drafted' | 'Sent to Customer' | 'Negotiating' | 'Won' | 'Lost' | 'Expired';
  lossReason?: 'Rate Too High' | 'Transit Time' | 'No Space / Equipment' | 'Customer Delayed' | 'Competitor Won';
  ageDays: number;
  carrierOptions: CarrierOption[];
  selectedCarrier?: string;
  bookingCreatedId?: string;
  createdAt: string;
  paymentTerms: string;
}

// A5. CHA & Shipping Bill Tracker
export interface ChaJob {
  id: string;
  shipmentId: string;
  hblNumber: string;
  chaId: string;
  chaName: string;
  chaContact: string;
  shippingBillNumber: string;
  shippingBillDate: string;
  leoDate?: string;
  examinationDate?: string;
  dutyStatus: 'Exempted' | 'Paid' | 'Pending Assessment' | 'Under Query';
  dutyPaidAmountINR: number;
  currentStage: 'SB Filed' | 'Examined' | 'LEO' | 'Loaded';
  scheme: 'None' | 'RoDTEP' | 'Duty Drawback (DBK)' | 'Advance Authorization' | 'EPCG' | 'SEZ Zero Rated';
  schemeReference?: string;
  icegateStatus: string;
  lastCheckedIcegateAt?: string;
  documents: Array<{
    name: string;
    type: 'SB' | 'LEO' | 'EP';
    uploadedAt: string;
  }>;
}

// A6. Transporter / Trucking Jobs
export interface TruckingTrip {
  id: string;
  tripNumber: string;
  shipmentId?: string;
  containerNumber: string;
  tripType: 'Empty Pickup' | 'Factory to CFS' | 'CFS to Port' | 'Port to Factory' | 'Empty Return';
  origin: string;
  destination: string;
  transporterId: string;
  transporterName: string;
  lrNumber: string;
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  scheduledPickup: string;
  actualPickup?: string;
  deliveredTime?: string;
  status: 'Assigned' | 'En Route' | 'At Terminal/CFS' | 'Completed' | 'Delayed';
  agreedRateINR: number;
  fuelSurchargeINR: number;
  detentionChargeINR: number;
  sealPhotoUrl?: string;
  podPhotoUrl?: string;
  lrCopyUrl?: string;
  notes?: string;
}

export interface TransporterRateMatrix {
  id: string;
  transporterName: string;
  origin: string;
  destination: string;
  containerType: string;
  baseRateINR: number;
  fuelSurchargePercent: number;
  freeWaitingHours: number;
  waitingPerHourINR: number;
}

// A7. Dangerous Goods (IMDG) Module
export interface DangerousGoodsItem {
  id: string;
  shipmentId: string;
  hblNumber: string;
  unNumber: string;
  properShippingName: string;
  imdgClass: string;
  packingGroup: 'I' | 'II' | 'III';
  flashPoint?: string;
  marinePollutant: boolean;
  segregationGroup: string;
  emsNumber: string;
  status: 'DGD Drafted' | 'DGD Submitted' | 'Carrier Approved' | 'Loaded' | 'Rejected';
  carrierApprovalRef?: string;
  netQuantityKg: number;
  grossWeightKg: number;
  packageType: string;
  emergencyContact: string;
  consigneeNotice: string;
}

export interface UnReferenceItem {
  unNumber: string;
  properShippingName: string;
  imdgClass: string;
  subsidiaryRisk?: string;
  packingGroup: 'I' | 'II' | 'III';
  marinePollutant: boolean;
  segregationGroup: string;
  ems: string;
}

// C1. Approval Chain Engine
export interface ApprovalRule {
  id: string;
  title: string;
  conditionDescription: string;
  thresholdType: 'PERCENT' | 'AMOUNT' | 'FLAG';
  thresholdValue: number;
  requiredRole: 'operations' | 'finance' | 'super_admin';
  isActive: boolean;
}

export interface ApprovalRequest {
  id: string;
  ruleId: string;
  ruleTitle: string;
  entityType: 'QUOTE_DISCOUNT' | 'DO_RELEASE_UNPAID' | 'CREDIT_LIMIT_INCREASE' | 'INVOICE_WRITEOFF' | 'AGENT_PAYMENT' | 'RATE_BELOW_COST' | 'SURRENDER_OVERRIDE';
  entityId: string;
  entityReference: string;
  requestedBy: string;
  requestedAt: string;
  requiredRole: 'operations' | 'finance' | 'super_admin';
  status: 'Pending' | 'Approved' | 'Rejected';
  amountOrPercent?: number;
  reason: string;
  decisionNotes?: string;
  decidedBy?: string;
  decidedAt?: string;
}

// C3. Letter of Credit (LC)
export interface LetterOfCredit {
  id: string;
  shipmentId: string;
  lcNumber: string;
  issuingBank: string;
  advisingBank: string;
  beneficiaryBank: string;
  amountUSD: number;
  latestShipmentDate: string;
  expiryDate: string;
  status: 'Active' | 'Discrepant' | 'Bank Set Dispatched' | 'Realized';
  requiredDocuments: string[];
  discrepancies: string[];
  courierAwb?: string;
  bankAckDate?: string;
}

// C4. Marine Insurance
export interface MarineInsurancePolicy {
  id: string;
  shipmentId: string;
  policyType: 'Open Policy' | 'Specific' | 'Declared Value';
  policyNumber: string;
  certificateNumber: string;
  insurer: string;
  insuredValueINR: number;
  premiumINR: number;
  coverType: 'ICC (A) All Risks' | 'ICC (B) Specified Perils' | 'ICC (C) Basic Perils';
  issueDate: string;
  status: 'Active' | 'Claim Lodged' | 'Settled';
  surveyorAssigned?: string;
}

// C5. Advance Filings (Pre-arrival)
export interface AdvanceFiling {
  id: string;
  shipmentId: string;
  country: 'USA (ISF 10+2)' | 'EU (ENS)' | 'Japan (AFR)' | 'China (CSD-ADV)';
  filingType: string;
  deadline: string;
  status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
  referenceNumber?: string;
  submittedAt?: string;
}

// B3. BL Template
export interface BlTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  prefix: string;
  tradeLane: string;
  headerLogoUrl?: string;
  tcClauses: string[];
  showMarks: boolean;
  showFreightCharges: boolean;
}

// B5. Container Repositioning & EIR
export interface ContainerRepositioningJob {
  id: string;
  fromDepot: string;
  toDepot: string;
  containerCount: number;
  containerType: string;
  costEstimateINR: number;
  projectedRoiPercent: number;
  status: 'Planned' | 'In Transit' | 'Completed';
  vesselVoyageOrTruck: string;
  startDate: string;
  arrivalDate: string;
}

export interface EirRecord {
  id: string;
  containerNumber: string;
  eirType: 'Pickup EIR' | 'In-Gate Port' | 'Out-Gate Dest' | 'Return EIR';
  location: string;
  inspectedAt: string;
  inspectorName: string;
  condition: 'Clean & Sound' | 'Floor Damage' | 'Wall Dent' | 'Door Gasket Defect';
  repairEstimateINR: number;
  signedOff: boolean;
  photos: string[];
}
