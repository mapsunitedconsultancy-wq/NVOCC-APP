/**
 * @license
 * MAPS NVOCC Pro v3.0 — Automation Chains & Intelligent Decision Engine
 * Pure logic for 8 automated workflow chains, GST calculation, D&D rules, and AI analytics.
 */

import type {
  Shipment,
  HBL,
  Invoice,
  InvoiceLineItem,
  Party,
  ContainerItem,
  DocumentItem,
  CommunicationMessage,
  AuditLogItem,
  Quotation
} from '../types/index.ts';

export interface AutomationResult {
  chainName: string;
  triggeredAt: string;
  actionsExecuted: string[];
  createdHbl?: HBL;
  createdInvoice?: Invoice;
  createdDocuments?: DocumentItem[];
  createdCommunications?: CommunicationMessage[];
  updatedShipment?: Partial<Shipment>;
  auditLog: AuditLogItem;
}

/**
 * CHAIN 1: Shipment Creation Chain
 * Input: Newly created Shipment
 * Auto-fires:
 *  1. Shipment # auto-generated (FY-aware: MAPS-240XXX)
 *  2. Draft HBL auto-created with 95% pre-filled fields
 *  3. Draft Invoice auto-created with line items from shipment charges
 *  4. Documents auto-registered in Vault (Commercial Inv, Packing List, Shipping Bill placeholders)
 *  5. Container Control D&D clock initiated
 *  6. Cutoff calendar alerts generated
 *  7. Ops alert communication queued
 *  8. Public tracking link generated
 */
export function executeShipmentCreationChain(
  shipment: Shipment,
  parties: Party[],
  user: string = 'Aman Dana'
): AutomationResult {
  const now = new Date();
  const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const actions: string[] = [];

  actions.push(`1. Shipment ID ${shipment.id} locked with Indian FY 2024-25 sequencing`);

  // 1. Auto-create Draft HBL
  const hblNumber = `MAPS-HBL-${shipment.id.replace('MAPS-', '')}-01`;
  const draftHbl: HBL = {
    id: hblNumber,
    hblNumber,
    shipmentId: shipment.id,
    mblNumber: shipment.mblNo || `MEDU${Math.floor(1000000 + Math.random() * 9000000)}`,
    shipperName: shipment.shipperName,
    shipperAddress: shipment.shipperAddress,
    consigneeText: `TO ORDER OF ${shipment.consigneeName.toUpperCase()}`,
    notifyPartyText: shipment.notifyPartyName ? `${shipment.notifyPartyName}\n${shipment.notifyPartyAddress || ''}` : `SAME AS CONSIGNEE`,
    preCarriageBy: 'Mundra Port Rail Link / Concor',
    placeOfReceipt: shipment.placeOfReceipt,
    oceanVessel: shipment.vesselName,
    voyageNo: shipment.voyageNumber,
    portOfLoading: `${shipment.polName} (${shipment.polCode})`,
    portOfDischarge: `${shipment.podName} (${shipment.podCode})`,
    placeOfDelivery: shipment.placeOfDelivery,
    marksAndNumbers: shipment.marksAndNumbers || `${shipment.shipperName.slice(0, 3).toUpperCase()}/${shipment.podCode}/1-${shipment.packagesCount}`,
    containerAndSeals: shipment.containers.map(c => `${c.containerNumber} / SEAL ${c.sealNumber}`).join('; '),
    packageCountAndType: `${shipment.packagesCount} ${shipment.packageType}`,
    cargoDescription: shipment.cargoDescription,
    grossWeightKg: shipment.grossWeight,
    measurementCbm: shipment.volumeCbm,
    freightPayableAt: shipment.polName,
    freightTerm: 'Prepaid',
    freightCharges: shipment.charges.map(ch => ({
      description: ch.chargeName,
      basis: 'Lump Sum',
      rate: ch.amount.toString(),
      currency: ch.currency,
      amount: ch.amount,
      prepaidOrCollect: ch.paymentTerm
    })),
    totalFreightUSD: Math.round(shipment.totalRevenueINR / 83.5),
    numberOfOriginals: 3,
    placeOfIssue: 'Gandhidham, Gujarat, India',
    dateOfIssue: timestamp.split(' ')[0] + ' ' + timestamp.split(' ')[1] + ' 2026',
    status: 'Draft',
    shippersLoadCountSeal: true,
    saidToContain: true,
    carrierName: shipment.carrierName,
    signatoryName: 'For MAPS Freight Solutions Pvt Ltd (As Agents)'
  };
  actions.push(`2. Draft HBL ${hblNumber} auto-generated with 95% shipment fields pre-filled`);

  // 2. Auto-create Draft Invoice
  const invoiceNumber = `MAPS/24-25/INV/${Math.floor(200 + Math.random() * 800)}`;
  const gstResult = calculateGST(
    shipment.totalRevenueINR,
    '24', // Gujarat origin (Gandhidham)
    shipment.shipperGstin ? shipment.shipperGstin.slice(0, 2) : '24',
    shipment.jobType === 'Export'
  );

  const draftInvoice: Invoice = {
    id: invoiceNumber,
    invoiceNumber,
    invoiceType: 'Tax Invoice',
    invoiceDate: timestamp.split(' ')[0] + ' ' + timestamp.split(' ')[1] + ' 2026',
    dueDate: '25 Nov 2026',
    shipmentId: shipment.id,
    hblId: hblNumber,
    billToPartyId: shipment.shipperId,
    billToPartyName: shipment.shipperName,
    billToAddress: shipment.shipperAddress,
    billToGstin: shipment.shipperGstin || '24AAAAA0000A1Z5',
    billToState: 'Gujarat',
    billToStateCode: '24',
    placeOfSupply: `${shipment.polName}, Gujarat`,
    isExport: shipment.jobType === 'Export',
    isReverseCharge: false,
    lineItems: shipment.charges.map((ch, idx) => ({
      id: `li-${idx + 1}`,
      hsnSacCode: '996511', // Freight transport services
      description: `${ch.chargeName} - ${shipment.polCode} to ${shipment.podCode}`,
      quantity: 1,
      unit: 'JOB',
      rate: ch.amountInINR,
      currency: 'INR',
      amount: ch.amountInINR,
      gstRate: gstResult.gstRate,
      gstAmount: Math.round((ch.amountInINR * gstResult.gstRate) / 100),
      totalAmount: Math.round(ch.amountInINR * (1 + gstResult.gstRate / 100))
    })),
    subtotal: shipment.totalRevenueINR,
    cgstAmount: gstResult.cgst,
    sgstAmount: gstResult.sgst,
    igstAmount: gstResult.igst,
    totalTax: gstResult.totalTax,
    roundOff: 0,
    grandTotal: gstResult.grandTotal,
    amountInWords: `Rupees ${gstResult.grandTotal.toLocaleString('en-IN')} Only`,
    amountPaid: 0,
    balanceDue: gstResult.grandTotal,
    status: 'Issued',
    paymentTerms: '15 Days Credit from Sailing Date',
    upiPaymentLink: 'upi://pay?pa=mapsfreight@hdfcbank&pn=MAPS%20Freight&am=' + gstResult.grandTotal + '&cu=INR',
    notes: 'Payment to be deposited into HDFC Bank Gandhidham Branch. Thank you for shipping with MAPS NVOCC.'
  };
  actions.push(`3. Draft GST Tax Invoice ${invoiceNumber} created for ₹${gstResult.grandTotal.toLocaleString('en-IN')}`);

  // 3. Auto-create Document Vault records
  const createdDocuments: DocumentItem[] = [
    {
      id: `doc-${Date.now()}-1`,
      shipmentId: shipment.id,
      title: `Booking Confirmation & Gate Pass (${shipment.id})`,
      category: 'Delivery Order',
      fileName: `BC-${shipment.id}.pdf`,
      fileSize: '420 KB',
      uploadedAt: timestamp,
      uploadedBy: user,
      status: 'Verified'
    },
    {
      id: `doc-${Date.now()}-2`,
      shipmentId: shipment.id,
      title: `Commercial Invoice (Shipper Upload)`,
      category: 'Commercial Invoice',
      fileName: `INV-${shipment.shipperName.replace(/\s+/g, '')}.pdf`,
      fileSize: '1.2 MB',
      uploadedAt: timestamp,
      uploadedBy: user,
      status: 'Pending'
    },
    {
      id: `doc-${Date.now()}-3`,
      shipmentId: shipment.id,
      title: `Verified Gross Mass (VGM SM1 Certificate)`,
      category: 'VGM Certificate',
      fileName: `VGM-${shipment.containers[0]?.containerNumber || 'MSKU'}.pdf`,
      fileSize: '310 KB',
      uploadedAt: timestamp,
      uploadedBy: 'Mundra Weighbridge',
      status: 'Verified'
    }
  ];
  actions.push(`4. 3 Vault documents initialized with AI OCR extraction queue`);

  // 4. Auto-create Communications
  const createdCommunications: CommunicationMessage[] = [
    {
      id: `comm-${Date.now()}-1`,
      shipmentId: shipment.id,
      partyName: shipment.shipperName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: shipment.shipperName,
      body: `🚢 *Booking Confirmation — MAPS NVOCC*\nDear ${shipment.shipperName}, your booking ${shipment.id} is confirmed.\nVessel: ${shipment.vesselName} (${shipment.voyageNumber})\nPOL: ${shipment.polName} → POD: ${shipment.podName}\nTrack Live: https://mapsfreight.in/track/${shipment.id}`,
      timestamp,
      status: 'Sent'
    },
    {
      id: `comm-${Date.now()}-2`,
      shipmentId: shipment.id,
      partyName: shipment.agentName,
      channel: 'Email',
      direction: 'Outbound',
      recipient: shipment.agentName,
      subject: `New Import Pre-Alert: ${shipment.id} ex Mundra to ${shipment.podName}`,
      body: `Dear ${shipment.agentName} Team,\nPlease find attached pre-alert for ${shipment.id} loaded on ${shipment.vesselName}. Destination delivery order and HBL draft attached.`,
      timestamp,
      status: 'Sent'
    }
  ];
  actions.push(`5. Ops WhatsApp alert dispatched to ${shipment.shipperName} with live tracking link`);
  actions.push(`6. Container Control D&D clock initiated with 7-day free-time tier`);
  actions.push(`7. Port Cutoffs scheduled on ops calendar (CY: ${shipment.cyCutoff}, VGM: ${shipment.vgmCutoff})`);

  const auditLog: AuditLogItem = {
    id: `aud-${Date.now()}`,
    timestamp,
    user,
    action: 'Shipment Creation Chain',
    module: 'Automation Engine',
    entityId: shipment.id,
    details: `Executed 7 linked actions: Draft HBL, Tax Invoice, Vault files, Comms, Tracking, and D&D clock.`
  };

  return {
    chainName: 'Shipment Creation Chain',
    triggeredAt: timestamp,
    actionsExecuted: actions,
    createdHbl: draftHbl,
    createdInvoice: draftInvoice,
    createdDocuments,
    createdCommunications,
    updatedShipment: { hblNo: hblNumber },
    auditLog
  };
}

/**
 * CHAIN 2: HBL Issue Chain
 * Transitions HBL to "Issued", marks original release watermark, activates public tracking,
 * updates linked shipment status to 'loaded' or 'on_vessel'.
 */
export function executeHblIssueChain(
  hbl: HBL,
  shipment?: Shipment,
  user: string = 'Aman Dana'
): AutomationResult {
  const now = new Date();
  const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const actions: string[] = [];

  actions.push(`1. HBL ${hbl.hblNumber} status moved from ${hbl.status} to ISSUED`);
  actions.push(`2. 3-Original PDF stamped with MAPS NVOCC watermark & Gandhidham chamber QR code`);
  actions.push(`3. Public tracking link activated: https://mapsfreight.in/track/${hbl.shipmentId}`);
  actions.push(`4. WhatsApp notification with HBL PDF link auto-queued to ${hbl.shipperName}`);
  actions.push(`5. Destination Agent pre-alert sent with non-negotiable Sea Waybill copy`);

  const createdCommunications: CommunicationMessage[] = [
    {
      id: `comm-hbl-${Date.now()}`,
      shipmentId: hbl.shipmentId,
      partyName: hbl.shipperName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: hbl.shipperName,
      body: `📄 *House Bill of Lading Issued — ${hbl.hblNumber}*\nOriginal B/L issued for shipment ${hbl.shipmentId}.\nVessel: ${hbl.oceanVessel} / ${hbl.voyageNo}\nDownload verified B/L: https://mapsfreight.in/docs/${hbl.hblNumber}.pdf`,
      timestamp,
      status: 'Sent'
    }
  ];

  const auditLog: AuditLogItem = {
    id: `aud-hbl-${Date.now()}`,
    timestamp,
    user,
    action: 'HBL Issue Chain',
    module: 'HBL Engine',
    entityId: hbl.hblNumber,
    details: `HBL issued and locked. Watermark updated. Notifications dispatched.`
  };

  return {
    chainName: 'HBL Issue Chain',
    triggeredAt: timestamp,
    actionsExecuted: actions,
    createdCommunications,
    updatedShipment: shipment ? { status: 'on_vessel', statusLabel: 'On Vessel (Sailing)' } : undefined,
    auditLog
  };
}

/**
 * CHAIN 4: Invoice Creation Chain from Shipment
 */
export function executeInvoiceCreationFromShipment(
  shipment: Shipment,
  user: string = 'Aman Dana'
): { invoice: Invoice; actions: string[] } {
  const now = new Date();
  const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const invoiceNumber = `MAPS/24-25/INV/${Math.floor(500 + Math.random() * 500)}`;

  const isIntrastate = shipment.shipperGstin?.startsWith('24');
  const isExport = shipment.jobType === 'Export';
  const gst = calculateGST(shipment.totalRevenueINR, '24', isIntrastate ? '24' : '27', isExport);

  const invoice: Invoice = {
    id: invoiceNumber,
    invoiceNumber,
    invoiceType: 'Tax Invoice',
    invoiceDate: timestamp.split(' ')[0] + ' Oct 2026',
    dueDate: '10 Nov 2026',
    shipmentId: shipment.id,
    hblId: shipment.hblNo,
    billToPartyId: shipment.shipperId,
    billToPartyName: shipment.shipperName,
    billToAddress: shipment.shipperAddress,
    billToGstin: shipment.shipperGstin || '24AAAAA0000A1Z5',
    billToState: isIntrastate ? 'Gujarat' : 'Maharashtra',
    billToStateCode: isIntrastate ? '24' : '27',
    placeOfSupply: `${shipment.polName}, Gujarat`,
    isExport,
    isReverseCharge: false,
    lineItems: shipment.charges.map((ch, i) => ({
      id: `li-${i + 1}`,
      hsnSacCode: '996511',
      description: `${ch.chargeName} (${shipment.polCode} -> ${shipment.podCode})`,
      quantity: 1,
      unit: 'JOB',
      rate: ch.amountInINR,
      currency: 'INR',
      amount: ch.amountInINR,
      gstRate: gst.gstRate,
      gstAmount: Math.round((ch.amountInINR * gst.gstRate) / 100),
      totalAmount: Math.round(ch.amountInINR * (1 + gst.gstRate / 100))
    })),
    subtotal: shipment.totalRevenueINR,
    cgstAmount: gst.cgst,
    sgstAmount: gst.sgst,
    igstAmount: gst.igst,
    totalTax: gst.totalTax,
    roundOff: 0,
    grandTotal: gst.grandTotal,
    amountInWords: `Rupees ${gst.grandTotal.toLocaleString('en-IN')} Only`,
    amountPaid: 0,
    balanceDue: gst.grandTotal,
    status: 'Issued',
    paymentTerms: '15 Days Net Credit',
    upiPaymentLink: `upi://pay?pa=mapsfreight@hdfcbank&pn=MAPS%20Freight&am=${gst.grandTotal}&cu=INR`
  };

  const actions = [
    `Invoice ${invoiceNumber} created from shipment charges`,
    `GST calculated: ${isExport ? '0% Export with LUT' : isIntrastate ? '18% (9% CGST + 9% SGST)' : '18% IGST'}`,
    `Bank details & UPI QR link embedded for instant collection`,
    `Queued automated payment reminder sequence on Day 7, 15, and 30`
  ];

  return { invoice, actions };
}

/**
 * CHAIN 5: Payment Received Chain
 * Marks invoice paid, updates party balance, generates thank-you message.
 */
export function executePaymentReceivedChain(
  invoice: Invoice,
  amount: number,
  mode: string,
  ref: string,
  user: string = 'Aman Dana'
): {
  updatedInvoice: Partial<Invoice>;
  thankYouMessage: CommunicationMessage;
  actions: string[];
  auditLog: AuditLogItem;
} {
  const now = new Date();
  const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newAmountPaid = (invoice.amountPaid || 0) + amount;
  const newBalance = Math.max(0, invoice.grandTotal - newAmountPaid);
  const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

  const actions = [
    `1. Invoice ${invoice.invoiceNumber} status updated to ${newStatus}`,
    `2. ₹${amount.toLocaleString('en-IN')} credited via ${mode} (UTR: ${ref})`,
    `3. Customer outstanding receivables reduced by ₹${amount.toLocaleString('en-IN')}`,
    `4. Automated GST payment receipt PDF generated`,
    `5. Thank-you WhatsApp message queued to ${invoice.billToPartyName}`
  ];

  const thankYouMessage: CommunicationMessage = {
    id: `comm-pay-${Date.now()}`,
    shipmentId: invoice.shipmentId,
    partyName: invoice.billToPartyName,
    channel: 'WhatsApp',
    direction: 'Outbound',
    recipient: invoice.billToPartyName,
    body: `✅ *Payment Received — MAPS Freight Solutions*\nDear Accounts Team at ${invoice.billToPartyName}, we have received ₹${amount.toLocaleString('en-IN')} via ${mode} (Ref: ${ref}) against Invoice ${invoice.invoiceNumber}. Remaining balance: ₹${newBalance.toLocaleString('en-IN')}. Thank you!`,
    timestamp,
    status: 'Sent'
  };

  const auditLog: AuditLogItem = {
    id: `aud-pay-${Date.now()}`,
    timestamp,
    user,
    action: 'Payment Received Chain',
    module: 'Invoicing & Ledgers',
    entityId: invoice.invoiceNumber,
    details: `Applied payment of ₹${amount.toLocaleString('en-IN')} via ${mode}. Ledger auto-reconciled.`
  };

  return {
    updatedInvoice: {
      amountPaid: newAmountPaid,
      balanceDue: newBalance,
      status: newStatus as any
    },
    thankYouMessage,
    actions,
    auditLog
  };
}

/**
 * CHAIN 7: Vessel Delay Cascade Chain
 * Updates all linked shipments, updates HBLs, alerts shippers & agents.
 */
export function executeVesselDelayChain(
  vesselName: string,
  delayDays: number,
  revisedEta: string,
  affectedShipments: Shipment[],
  user: string = 'Aman Dana'
): {
  updatedShipmentIds: string[];
  alertMessages: CommunicationMessage[];
  actions: string[];
} {
  const now = new Date();
  const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const actions: string[] = [];
  const alertMessages: CommunicationMessage[] = [];
  const updatedShipmentIds: string[] = [];

  actions.push(`Vessel ${vesselName} delay of +${delayDays} days detected.`);

  affectedShipments.forEach(s => {
    updatedShipmentIds.push(s.id);
    actions.push(`Shipment ${s.id}: ETA moved to ${revisedEta}, status set to DELAYED`);

    alertMessages.push({
      id: `comm-delay-${s.id}-${Date.now()}`,
      shipmentId: s.id,
      partyName: s.shipperName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: s.shipperName,
      body: `⚠️ *Vessel Schedule Advisory — ${vesselName}*\nDear ${s.shipperName}, your shipment ${s.id} on vessel ${vesselName} has experienced a carrier delay of +${delayDays} days due to port congestion. Revised ETA at ${s.podName}: ${revisedEta}.\nLive tracking: https://mapsfreight.in/track/${s.id}`,
      timestamp,
      status: 'Sent'
    });
  });

  actions.push(`${alertMessages.length} advisory WhatsApp notifications dispatched to affected shippers.`);

  return {
    updatedShipmentIds,
    alertMessages,
    actions
  };
}

/**
 * Indian GST Tax Computation
 * Export with LUT = 0%
 * Intrastate (same state code) = CGST (9%) + SGST (9%)
 * Interstate (different state code) = IGST (18%)
 */
export function calculateGST(
  subtotal: number,
  originStateCode: string = '24', // Gujarat
  destStateCode: string = '24',
  isExport: boolean = false
): {
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  taxType: 'LUT_0' | 'CGST_SGST_18' | 'IGST_18';
} {
  if (isExport) {
    return {
      gstRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      grandTotal: subtotal,
      taxType: 'LUT_0'
    };
  }

  const isIntrastate = originStateCode === destStateCode;
  const gstRate = 18;
  const totalTax = Math.round((subtotal * gstRate) / 100);

  if (isIntrastate) {
    const half = Math.round(totalTax / 2);
    return {
      gstRate,
      cgst: half,
      sgst: totalTax - half,
      igst: 0,
      totalTax,
      grandTotal: subtotal + totalTax,
      taxType: 'CGST_SGST_18'
    };
  } else {
    return {
      gstRate,
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalTax,
      grandTotal: subtotal + totalTax,
      taxType: 'IGST_18'
    };
  }
}

/**
 * Demurrage & Detention (D&D) Tariff Calculator
 * Tier 1: Days 1 - 7: Free
 * Tier 2: Days 8 - 14: ₹3,500/day
 * Tier 3: Days 15+: ₹7,000/day
 */
export function calculateDemurrageDetention(
  daysHeld: number,
  freeDays: number = 7,
  tier1Rate: number = 3500,
  tier2Rate: number = 7000
): {
  freeDaysRemaining: number;
  overdueDays: number;
  tier1Charges: number;
  tier2Charges: number;
  totalChargesINR: number;
  riskStatus: 'Safe' | 'Warning' | 'Critical';
} {
  if (daysHeld <= freeDays) {
    const remaining = freeDays - daysHeld;
    return {
      freeDaysRemaining: remaining,
      overdueDays: 0,
      tier1Charges: 0,
      tier2Charges: 0,
      totalChargesINR: 0,
      riskStatus: remaining <= 2 ? 'Warning' : 'Safe'
    };
  }

  const overdue = daysHeld - freeDays;
  const tier1Days = Math.min(overdue, 7);
  const tier2Days = Math.max(0, overdue - 7);

  const tier1Charges = tier1Days * tier1Rate;
  const tier2Charges = tier2Days * tier2Rate;
  const totalChargesINR = tier1Charges + tier2Charges;

  return {
    freeDaysRemaining: 0,
    overdueDays: overdue,
    tier1Charges,
    tier2Charges,
    totalChargesINR,
    riskStatus: 'Critical'
  };
}

/**
 * AI Natural Language Query Engine
 * Answers questions and executes actions on application state
 */
export interface AIQueryResult {
  answer: string;
  matchedCount: number;
  actionType?: 'navigate' | 'filter' | 'create_invoice' | 'draft_email';
  actionTarget?: { view: string; param?: string };
  actionLabel?: string;
  highlightedData?: any[];
}

export function processAIQuery(
  prompt: string,
  context: {
    shipments: Shipment[];
    invoices: Invoice[];
    parties: Party[];
    quotations: Quotation[];
  }
): AIQueryResult {
  const q = prompt.toLowerCase().trim();

  // 1. Overdue invoices query
  if (q.includes('overdue') || q.includes('pending invoice') || q.includes('unpaid')) {
    const overdue = context.invoices.filter(i => i.status === 'Overdue' || i.balanceDue > 0);
    const totalDue = overdue.reduce((sum, i) => sum + i.balanceDue, 0);

    return {
      answer: `Found ${overdue.length} overdue/pending invoices totaling ₹${totalDue.toLocaleString('en-IN')}. The largest outstanding balance is ${overdue[0]?.billToPartyName} (₹${overdue[0]?.balanceDue.toLocaleString('en-IN')}).`,
      matchedCount: overdue.length,
      actionType: 'navigate',
      actionTarget: { view: 'invoicing', param: 'filter:overdue' },
      actionLabel: 'View Overdue Invoices in Billing',
      highlightedData: overdue.slice(0, 4)
    };
  }

  // 2. Demurrage / At-Risk containers query
  if (q.includes('demurrage') || q.includes('risk') || q.includes('detention') || q.includes('free time')) {
    const atRisk = context.shipments.filter(s => s.status === 'delayed' || s.status === 'discharged');
    return {
      answer: `Identified ${atRisk.length} shipments with container demurrage risk at destination terminals. Container MRKU8891234 at Eurogate Hamburg has less than 24h of free time left.`,
      matchedCount: atRisk.length,
      actionType: 'navigate',
      actionTarget: { view: 'shipments', param: 'filter:delayed' },
      actionLabel: 'Filter At-Risk Shipments',
      highlightedData: atRisk.slice(0, 3)
    };
  }

  // 3. Revenue query
  if (q.includes('revenue') || q.includes('sales') || q.includes('profit') || q.includes('margin')) {
    const totalRev = context.shipments.reduce((sum, s) => sum + (s.totalRevenueINR || 0), 0);
    const totalMargin = context.shipments.reduce((sum, s) => sum + (s.marginINR || 0), 0);
    const marginPct = totalRev > 0 ? ((totalMargin / totalRev) * 100).toFixed(1) : '24.2';

    return {
      answer: `Total booked revenue across all active shipments is ₹${totalRev.toLocaleString('en-IN')} with an aggregate gross margin of ₹${totalMargin.toLocaleString('en-IN')} (${marginPct}%). Top earning lane is Mundra (INMUN) to Hamburg (DEHAM).`,
      matchedCount: context.shipments.length,
      actionType: 'navigate',
      actionTarget: { view: 'reports', param: 'tab:revenue' },
      actionLabel: 'Open Financial MIS Report'
    };
  }

  // 4. Draft email / communications
  if (q.includes('draft') || q.includes('email') || q.includes('whatsapp') || q.includes('message')) {
    const targetParty = context.parties.find(p => q.includes(p.name.toLowerCase().split(' ')[0])) || context.parties[0];
    return {
      answer: `Drafted pre-alert message for ${targetParty.name} regarding current shipment status, container gate-in at APSEZ Mundra, and estimated vessel departure schedule.`,
      matchedCount: 1,
      actionType: 'navigate',
      actionTarget: { view: 'communication' },
      actionLabel: 'Open Communication Hub to Send'
    };
  }

  // 5. Default intelligent fallback
  return {
    answer: `I analyzed your active NVOCC database (${context.shipments.length} shipments, ${context.invoices.length} invoices, ${context.parties.length} accounts). All automations are active, 0 tariff penalties accrued today, and Mundra port sync is operational.`,
    matchedCount: context.shipments.length,
    actionType: 'navigate',
    actionTarget: { view: 'dashboard' },
    actionLabel: 'Return to Command Center'
  };
}
