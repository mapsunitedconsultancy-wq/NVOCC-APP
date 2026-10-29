export type UserRole = 'super_admin' | 'operations' | 'finance' | 'sales' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  title: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  companySeal?: string;
  onboardingCompleted?: boolean;
}

export type ShipmentStatus = 
  | 'draft'
  | 'booked'
  | 'pickup_scheduled'
  | 'at_cfs'
  | 'customs_cleared'
  | 'at_port'
  | 'loaded'
  | 'on_vessel'
  | 'sailed'
  | 'transhipment'
  | 'discharged'
  | 'destination_cfs'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DDP' | 'DAP' | 'FCA';
export type EquipmentType = 
  | "20'GP" 
  | "40'GP" 
  | "40'HC" 
  | "20'RF" 
  | "40'RF" 
  | "20'OT" 
  | "40'OT" 
  | "20'FR" 
  | "40'FR" 
  | "20'TK" 
  | "40'TK";

export interface ContainerItem {
  id: string;
  containerNumber: string;
  equipmentType: EquipmentType;
  sealNumber: string;
  tareWeight: number; // in KG
  cargoWeight: number; // in KG
  grossWeight: number; // in KG
  vgmWeight: number; // in KG
  vgmMethod: 'SM1' | 'SM2';
  vgmCertifier: string;
  vgmDate: string;
  currentLocation: string;
  status: string;
  freeTimeDays: number;
  freeTimeExpiry: string;
  demurragePerDay: number; // in INR
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  location: string;
  description: string;
  category: 'booking' | 'customs' | 'port' | 'vessel' | 'delivery' | 'alert';
  source: 'MANUAL' | 'ICEGATE' | 'PORT_GATE' | 'CARRIER_EDI' | 'CONTAINER_CONTROL';
  user?: string;
}

export interface ChargeItem {
  id: string;
  chargeCode: string;
  chargeName: string;
  category: 'Ocean Freight' | 'THC' | 'Documentation' | 'VGM' | 'Customs' | 'CFS' | 'Transport' | 'Misc';
  currency: 'INR' | 'USD' | 'EUR' | 'AED';
  amount: number;
  rate: number; // exchange rate to INR
  amountInINR: number;
  billedTo: 'shipper' | 'consignee' | 'agent' | 'carrier';
  paymentTerm: 'Prepaid' | 'Collect';
  status: 'pending' | 'invoiced' | 'paid';
  invoiceId?: string;
  isCost?: boolean; // false = revenue, true = our cost
}

export interface Shipment {
  id: string; // MAPS-240342
  referenceNo: string;
  bookingNo: string;
  mblNo?: string;
  hblNo?: string;
  jobType: 'Export' | 'Import' | 'Cross-trade';
  mode: 'Ocean' | 'Air';
  serviceType: 'FCL' | 'LCL' | 'Breakbulk';
  incoterm: Incoterm;
  status: ShipmentStatus;
  statusLabel: string;
  createdDate: string;
  assignedTo: string; // User ID / Name

  // Parties
  shipperId: string;
  shipperName: string;
  shipperAddress: string;
  shipperGstin: string;

  consigneeId: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCountry: string;

  notifyPartyName?: string;
  notifyPartyAddress?: string;

  agentId: string;
  agentName: string;

  chaName?: string;
  transporterName?: string;

  // Routing
  placeOfReceipt: string;
  polCode: string; // INMUN
  polName: string; // Mundra, India
  viaPort?: string;
  podCode: string; // DEHAM
  podName: string; // Hamburg, Germany
  placeOfDelivery: string;

  // Vessel & Carrier
  carrierId: string;
  carrierName: string;
  carrierScac: string;
  vesselName: string;
  voyageNumber: string;
  etd: string;
  eta: string;
  actualDeparture?: string;
  actualArrival?: string;
  transitDays: number;

  // Cutoffs
  cyCutoff: string;
  siCutoff: string;
  vgmCutoff: string;
  docCutoff: string;

  // Cargo
  cargoDescription: string;
  hsCode: string;
  packagesCount: number;
  packageType: string;
  grossWeight: number; // KG
  netWeight: number; // KG
  volumeCbm: number;
  marksAndNumbers: string;
  isHazardous: boolean;
  unNumber?: string;
  dgClass?: string;
  carrierApprovalRef?: string;
  isTempControlled: boolean;
  targetTemp?: string;

  // Indian Customs & Gate Compliance (Testing Pack)
  shippingBillNo?: string;
  shippingBillDate?: string;
  leoDate?: string; // Let Export Order date (mandatory gate for loaded status)
  egmNo?: string;

  // Containers
  containers: ContainerItem[];

  // Charges & Financials
  charges: ChargeItem[];
  totalRevenueINR: number;
  totalCostINR: number;
  marginINR: number;
  marginPercent: number;

  // Timeline
  events: TimelineEvent[];
  rolledCount?: number;

  // Internal Notes & Flags
  isPinned?: boolean;
  notes?: string;
  specialInstructions?: string;
}

export interface HBL {
  id: string; // MAPS-HBL-240342-01
  hblNumber: string;
  shipmentId: string;
  mblNumber: string;
  shipperName: string;
  shipperAddress: string;
  consigneeText: string; // e.g. "TO ORDER OF DEUTSCHE BANK AG" or named
  notifyPartyText: string;
  preCarriageBy: string;
  placeOfReceipt: string;
  oceanVessel: string;
  voyageNo: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  marksAndNumbers: string;
  containerAndSeals: string;
  packageCountAndType: string;
  cargoDescription: string;
  grossWeightKg: number;
  measurementCbm: number;
  freightPayableAt: string;
  freightTerm: 'Prepaid' | 'Collect';
  freightCharges: {
    description: string;
    basis: string;
    rate: string;
    currency: string;
    amount: number;
    prepaidOrCollect: 'Prepaid' | 'Collect';
  }[];
  totalFreightUSD: number;
  numberOfOriginals: number;
  placeOfIssue: string;
  dateOfIssue: string;
  status: 'Draft' | 'Issued' | 'Original Released' | 'Surrendered' | 'Switched' | 'Telex Released' | 'Cancelled';
  shippersLoadCountSeal: boolean;
  saidToContain: boolean;
  carrierName: string;
  signatoryName: string;
  netWeightKg?: number;
  deliveryContact?: string;
  asAgentsCarrier?: string;
  modesMeansOfTransport?: string;
  routePlaceOfTransport?: string;
  containers?: {
    containerNumber: string;
    containerType: string;
    sealNumber: string;
    packageCount?: string | number;
    packageDescription?: string;
    grossWeightKg?: number;
    netWeightKg?: number;
    volumeCbm?: number;
  }[];
}

export interface MBL {
  id: string;
  mblNumber: string;
  carrierName: string;
  carrierScac?: string;
  carrierBookingRef: string;
  vesselVoyage: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  status: 'Carrier Draft' | 'Issued' | 'Originals Received' | 'Surrendered' | 'Telex Released';
  containerNumbers: string[];
  totalContainers: number;
  totalTeu: number;
  totalWeightKg: number;
  linkedHbls: string[]; // HBL numbers
  freightAmountUSD: number;
  paymentStatus: 'Paid' | 'Collect';
  reconciled: boolean;
  shipperName?: string;
  consigneeName?: string;
  notifyParty?: string;
  sealNumbers?: string[];
  dateOfIssue?: string;
  placeOfIssue?: string;
  cargoDescription?: string;
  packageCount?: string;
}

export interface InvoiceLineItem {
  id: string;
  hsnSacCode: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  currency: 'INR' | 'USD';
  amount: number;
  gstRate: number; // 0, 5, 12, 18
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string; // MAPS/24-25/INV/001
  invoiceNumber: string;
  invoiceType: 'Tax Invoice' | 'Freight Invoice' | 'Credit Note' | 'Debit Note' | 'Proforma' | 'Advance' | 'Final' | 'Commission';
  invoiceDate: string;
  dueDate: string;
  shipmentId?: string;
  hblId?: string;
  referenceNo?: string;
  
  // Parties
  billToPartyId: string;
  billToPartyName: string;
  billToAddress: string;
  billToGstin: string;
  billToState: string;
  billToStateCode: string;

  shipToPartyName?: string;
  shipToAddress?: string;
  shipToGstin?: string;

  placeOfSupply: string;
  isExport: boolean;
  isReverseCharge: boolean;

  lineItems: InvoiceLineItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  amountPaid: number;
  balanceDue: number;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentTerms: string;
  upiPaymentLink?: string;
  notes?: string;
}

export interface Party {
  id: string;
  name: string;
  code: string;
  type: 'Shipper' | 'Consignee' | 'Overseas Agent' | 'Shipping Agent' | 'Carrier' | 'CHA' | 'Transporter' | 'CFS Operator';
  country: string;
  city: string;
  state?: string;
  address: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  iec?: string;
  vatTaxId?: string;
  primaryContactName: string;
  email: string;
  phone: string;
  creditTermsDays: number;
  creditLimitINR: number;
  outstandingBalanceINR: number;
  rating: number; // 1-5
  lastTransactionDate: string;
  shipmentCount: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscSwift: string;
    branch: string;
  };
}

export interface CarrierRate {
  id: string;
  carrierId: string;
  carrierName: string;
  polCode: string;
  polName: string;
  podCode: string;
  podName: string;
  equipmentType: EquipmentType;
  baseFreightUSD: number;
  bafUSD: number;
  cafUSD: number;
  thcOriginINR: number;
  docFeeINR: number;
  validFrom: string;
  validTo: string;
  transitDays: number;
  serviceRoute: string;
  contractNo: string;
  reliabilityScore: number; // 1-100%
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  polName: string;
  podName: string;
  equipmentType: EquipmentType;
  carrierName: string;
  baseFreightUSD: number;
  surchargesUSD: number;
  localChargesINR: number;
  marginINR: number;
  totalPriceINR: number;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Converted';
  paymentTerms: string;
  notes: string;
  createdDate: string;
}

export interface AgentTransaction {
  id: string;
  agentId: string;
  date: string;
  type: 'Debit' | 'Credit';
  description: string;
  shipmentId: string;
  hblNo: string;
  currency: 'EUR' | 'USD' | 'JPY';
  amount: number;
  fxRate: number;
  amountINR: number;
  status: 'Matched' | 'Unmatched' | 'Disputed';
  reconciledDate?: string;
}

export interface DocumentItem {
  id: string;
  shipmentId?: string;
  partyId?: string;
  title: string;
  category: 
    | 'Commercial Invoice'
    | 'Packing List'
    | 'HBL'
    | 'MBL'
    | 'Shipping Bill'
    | 'Bill of Entry'
    | 'VGM Certificate'
    | 'Certificate of Origin'
    | 'Phytosanitary'
    | 'Insurance Certificate'
    | 'Customs LEO'
    | 'Delivery Order'
    | 'Agreement';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  ocrExtracted?: Record<string, string | number>;
  expiryDate?: string;
  status: 'Verified' | 'Pending' | 'Expiring Soon';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  entityId: string;
  details: string;
}

export interface CommunicationMessage {
  id: string;
  shipmentId?: string;
  partyName: string;
  channel: 'WhatsApp' | 'Email' | 'SMS';
  direction: 'Outbound' | 'Inbound';
  recipient: string;
  subject?: string;
  body: string;
  timestamp: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  attachments?: string[];
}

// ═══════════════════════════════════════════════════════════════
// DELIVERY ORDER (Module 8 - Exact Lancer Format)
// ═══════════════════════════════════════════════════════════════
export interface DeliveryOrderItem {
  id: string;
  doNumber: string; // LANDOMUN3632026
  doDate: string; // 15-10-2026
  shipmentId: string;
  mblNumber: string;
  blNumber: string; // LCSOHMUNSOH2600163
  blDate: string;
  vesselVoyage: string; // EUPHORIA / 'E603WMUN
  arrivalDate: string; // 12-10-2026
  loadPort: string; // SOHAR
  dischargePort: string; // MUNDRA
  finalPlaceOfDelivery: string; // MUNDRA
  destuffingType: 'FACTORY DE-STUFF' | 'CFS DE-STUFF' | 'DOCK DE-STUFF';
  cfsName: string; // MUNDHRA CFS, MUNDRA
  cfsAddress: string;
  consigneeName: string; // ANANTA METAL RECYCLING PRIVATE LIMITED
  consigneeAddress: string;
  notifyParty: string; // SAME AS CONSIGNEE
  deliverToParty: string; // UNIQUE SPEDITORER PVT LTD or bearer ANANTA METAL RECYCLING PRIVATE LIMITED
  cargoDescription: string; // ALUMINIUM SCRAP
  hsCode: string; // 76020010
  packageCount: string; // 1 LOT
  totalGrossWt: string; // 25.730 MT
  containers: {
    containerNumber: string;
    sealNumber: string;
    sizeType: string;
    doValidTill: string;
  }[];
  totalContainersSummary: string; // 01X20'
  emptyReturnDepot: string; // KDPP TERMINALS
  emptyReturnAddress: string; // Samagoga Survey no.120/1,- Near Borana yash water plant ,Pragpar-,Vill - Nana Kapaya Kutch - 370421
  emptyReturnContact: string; // 8488006739
  emptyReturnEmail: string; // docs.mundra@kdppcontainer.com
  status: 'Issued' | 'Pending Charges' | 'Expired' | 'Delivered' | 'Cancelled';
  validTillDate: string;
  paymentCleared: boolean;
  securityDepositINR: number;
}

// ═══════════════════════════════════════════════════════════════
// SPECIAL RATE REQUEST (Module 3 - eBMS Pricing Workflow)
// ═══════════════════════════════════════════════════════════════
export interface SRRLineItem {
  id: string;
  poo: string; // Place of Origin
  pol: string; // Port of Loading
  pod: string; // Port of Discharge
  fpod: string; // Final POD
  containerType: EquipmentType;
  serviceMode: 'CY/CY' | 'CY/CFS' | 'CFS/CY' | 'CFS/CFS';
  slotOperator: string; // Maersk, MSC, CMA CGM, COSCO, ONE, Hapag
  polFreeDays: number;
  fpodFreeDays: number;
  volumeExpected: number;
  weightPerContainer: number;
  totalWeight: number;
  weightUnit: 'KGS' | 'MT';
  switchBlRequired: boolean;
  destinationAgent: string;
  commodity: string;
  imcoClass?: string;
  unNumber?: string;
  hazRefNumber?: string;
  chargeCode: string;
  accountCode: string;
  currency: 'USD' | 'AED' | 'INR' | 'EUR';
  rateRequested: number;
  approvedRate?: number;
  counterRate?: number;
  collectPort: string;
}

export interface SpecialRateRequest {
  id: string; // SRR-2026-0891
  srrNumber: string;
  principal: string;
  salesPerson: string;
  bookingParty: string;
  shipper: string;
  forwarder?: string;
  rebateParty?: string;
  noOfBlsAgreed: number;
  effectFrom: string;
  effectTo: string;
  rateType: 'Contract Rate' | 'Voyage Specific' | 'Service Specific' | 'Single Lot Rate';
  vessel?: string;
  voyage?: string;
  dpdFlag: boolean;
  nomination?: string;
  fpodRemarks?: string;
  remarks?: string;
  status: 'Open' | 'Submitted' | 'Approved' | 'Rejected' | 'Countered' | 'Line Counter';
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  approvalRemarks?: string;
  items: SRRLineItem[];
  convertedBookingId?: string;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT MANIFEST (Module 7)
// ═══════════════════════════════════════════════════════════════
export interface ManifestItem {
  hblNumber: string;
  mblNumber: string;
  shipperName: string;
  consigneeName: string;
  notifyParty?: string;
  containerNumber: string;
  sealNumber: string;
  sizeType: string;
  packageCount: string;
  cargoDescription: string;
  grossWeightKg: number;
  netWeightKg: number;
  volumeCbm: number;
  isHazardous: boolean;
  imdgClass?: string;
  unNumber?: string;
  flashPoint?: string;
  freightTerm: 'Prepaid' | 'Collect';
}

export interface ExportManifest {
  id: string;
  manifestNumber: string;
  vesselName: string;
  voyageNumber: string;
  carrierName: string;
  pol: string;
  pod: string;
  sailDate: string;
  terminal: string; // MICT, APSEZ CT-2, Kandla DPT
  totalContainers: number;
  totalTeu: number;
  totalGrossWtKg: number;
  totalCbm: number;
  status: 'Draft' | 'Finalized' | 'Customs Lodged';
  isDgManifest?: boolean;
  consignments: ManifestItem[];
}

export * from './v4Types';
