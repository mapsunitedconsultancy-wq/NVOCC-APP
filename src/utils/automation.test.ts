import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGST,
  calculateDemurrageDetention,
  executeShipmentCreationChain,
  executePaymentReceivedChain,
  processAIQuery
} from './automationChains.ts';
import type { Shipment, Party, Invoice } from '../types/index.ts';

test('GST Calculation: Export with LUT returns 0% tax', () => {
  const result = calculateGST(100000, '24', '24', true);
  assert.equal(result.gstRate, 0);
  assert.equal(result.totalTax, 0);
  assert.equal(result.grandTotal, 100000);
  assert.equal(result.taxType, 'LUT_0');
});

test('GST Calculation: Intrastate (Gujarat to Gujarat) splits CGST and SGST', () => {
  const result = calculateGST(100000, '24', '24', false);
  assert.equal(result.gstRate, 18);
  assert.equal(result.totalTax, 18000);
  assert.equal(result.cgst, 9000);
  assert.equal(result.sgst, 9000);
  assert.equal(result.igst, 0);
  assert.equal(result.grandTotal, 118000);
  assert.equal(result.taxType, 'CGST_SGST_18');
});

test('GST Calculation: Interstate (Gujarat to Maharashtra) applies full IGST', () => {
  const result = calculateGST(50000, '24', '27', false);
  assert.equal(result.gstRate, 18);
  assert.equal(result.totalTax, 9000);
  assert.equal(result.cgst, 0);
  assert.equal(result.sgst, 0);
  assert.equal(result.igst, 9000);
  assert.equal(result.grandTotal, 59000);
  assert.equal(result.taxType, 'IGST_18');
});

test('Demurrage & Detention: <= 7 free days charges zero', () => {
  const result = calculateDemurrageDetention(4, 7);
  assert.equal(result.freeDaysRemaining, 3);
  assert.equal(result.overdueDays, 0);
  assert.equal(result.totalChargesINR, 0);
  assert.equal(result.riskStatus, 'Safe');
});

test('Demurrage & Detention: Day 10 (3 days overdue in Tier 1) calculates correctly', () => {
  const result = calculateDemurrageDetention(10, 7, 3500, 7000);
  assert.equal(result.freeDaysRemaining, 0);
  assert.equal(result.overdueDays, 3);
  assert.equal(result.tier1Charges, 10500);
  assert.equal(result.tier2Charges, 0);
  assert.equal(result.totalChargesINR, 10500);
  assert.equal(result.riskStatus, 'Critical');
});

test('Demurrage & Detention: Day 16 (Tier 1 + Tier 2) calculates tiered penalties', () => {
  // 16 days - 7 free = 9 overdue days (7 in Tier 1 + 2 in Tier 2)
  // 7 * 3500 = 24500, 2 * 7000 = 14000 => total = 38500
  const result = calculateDemurrageDetention(16, 7, 3500, 7000);
  assert.equal(result.overdueDays, 9);
  assert.equal(result.tier1Charges, 24500);
  assert.equal(result.tier2Charges, 14000);
  assert.equal(result.totalChargesINR, 38500);
});

test('Shipment Creation Chain auto-generates linked HBL and Invoice', () => {
  const sampleShipment: Shipment = {
    id: 'MAPS-240399',
    referenceNo: 'REF-99',
    bookingNo: 'BKG-99',
    jobType: 'Export',
    mode: 'Ocean',
    serviceType: 'FCL',
    incoterm: 'FOB',
    status: 'booked',
    statusLabel: 'Booked',
    createdDate: '16 Oct 2026',
    assignedTo: 'Utsav Panchal',
    shipperId: 'p-1',
    shipperName: 'Krishna Ceramics Ltd',
    shipperAddress: 'Morbi Industrial Zone, Gujarat',
    shipperGstin: '24AAACK1234F1Z9',
    consigneeId: 'p-2',
    consigneeName: 'Mueller GmbH',
    consigneeAddress: 'Hamburg, Germany',
    consigneeCountry: 'Germany',
    agentId: 'ag-1',
    agentName: 'EuroAsia Shipping',
    placeOfReceipt: 'Morbi ICD',
    polCode: 'INMUN',
    polName: 'Mundra',
    podCode: 'DEHAM',
    podName: 'Hamburg',
    placeOfDelivery: 'Hamburg Port',
    carrierId: 'c-1',
    carrierName: 'MSC Mediterranean',
    carrierScac: 'MSCU',
    vesselName: 'MSC JADE',
    voyageNumber: '437W',
    etd: '20 Oct 2026',
    eta: '15 Nov 2026',
    transitDays: 26,
    cyCutoff: '18 Oct 14:00',
    siCutoff: '18 Oct 18:00',
    vgmCutoff: '19 Oct 10:00',
    docCutoff: '19 Oct 16:00',
    cargoDescription: 'Glazed Ceramic Tiles',
    hsCode: '6907.21',
    packagesCount: 1200,
    packageType: 'Boxes on Pallets',
    grossWeight: 26500,
    netWeight: 25800,
    volumeCbm: 38.5,
    marksAndNumbers: 'KC/HAM/1-1200',
    isHazardous: false,
    isTempControlled: false,
    containers: [
      {
        id: 'c-1',
        containerNumber: 'MSKU2345678',
        equipmentType: "40'HC",
        sealNumber: 'KL8899',
        tareWeight: 3850,
        cargoWeight: 26500,
        grossWeight: 30350,
        vgmWeight: 30350,
        vgmMethod: 'SM1',
        vgmCertifier: 'APSEZ Mundra',
        vgmDate: '15 Oct 2026',
        currentLocation: 'Mundra CFS',
        status: 'At CFS',
        freeTimeDays: 7,
        freeTimeExpiry: '25 Oct 2026',
        demurragePerDay: 4500
      }
    ],
    charges: [
      {
        id: 'ch-1',
        chargeCode: 'OFR',
        chargeName: 'Ocean Freight',
        category: 'Ocean Freight',
        currency: 'USD',
        amount: 2100,
        rate: 83.5,
        amountInINR: 175350,
        billedTo: 'shipper',
        paymentTerm: 'Prepaid',
        status: 'pending'
      }
    ],
    totalRevenueINR: 175350,
    totalCostINR: 142000,
    marginINR: 33350,
    marginPercent: 19.0,
    events: []
  };

  const chainResult = executeShipmentCreationChain(sampleShipment, []);
  assert.ok(chainResult.createdHbl);
  assert.equal(chainResult.createdHbl.shipmentId, 'MAPS-240399');
  assert.equal(chainResult.createdHbl.shipperName, 'Krishna Ceramics Ltd');

  assert.ok(chainResult.createdInvoice);
  assert.equal(chainResult.createdInvoice.shipmentId, 'MAPS-240399');
  assert.equal(chainResult.createdInvoice.subtotal, 175350);

  assert.equal(chainResult.createdDocuments?.length, 3);
  assert.equal(chainResult.createdCommunications?.length, 2);
});

test('Payment Received Chain marks invoice as Paid when full amount received', () => {
  const sampleInvoice: Invoice = {
    id: 'INV-100',
    invoiceNumber: 'MAPS/24-25/INV/100',
    invoiceType: 'Tax Invoice',
    invoiceDate: '10 Oct 2026',
    dueDate: '25 Oct 2026',
    billToPartyId: 'p-1',
    billToPartyName: 'Krishna Ceramics',
    billToAddress: 'Morbi',
    billToGstin: '24AAACK1234F1Z9',
    billToState: 'Gujarat',
    billToStateCode: '24',
    placeOfSupply: 'Mundra',
    isExport: false,
    isReverseCharge: false,
    lineItems: [],
    subtotal: 100000,
    cgstAmount: 9000,
    sgstAmount: 9000,
    igstAmount: 0,
    totalTax: 18000,
    roundOff: 0,
    grandTotal: 118000,
    amountInWords: '',
    amountPaid: 0,
    balanceDue: 118000,
    status: 'Issued',
    paymentTerms: '15 Days'
  };

  const result = executePaymentReceivedChain(sampleInvoice, 118000, 'HDFC RTGS', 'UTR887123');
  assert.equal(result.updatedInvoice.status, 'Paid');
  assert.equal(result.updatedInvoice.balanceDue, 0);
  assert.equal(result.updatedInvoice.amountPaid, 118000);
  assert.ok(result.thankYouMessage.body.includes('Payment Received'));
});

test('AI Query Engine correctly answers queries on overdue invoices', () => {
  const invoices: Invoice[] = [
    {
      id: 'INV-1',
      invoiceNumber: 'INV/001',
      invoiceType: 'Tax Invoice',
      invoiceDate: '1 Oct',
      dueDate: '15 Oct',
      billToPartyId: 'p1',
      billToPartyName: 'Saurashtra Minerals',
      billToAddress: '',
      billToGstin: '',
      billToState: '',
      billToStateCode: '',
      placeOfSupply: '',
      isExport: false,
      isReverseCharge: false,
      lineItems: [],
      subtotal: 100000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      roundOff: 0,
      grandTotal: 100000,
      amountInWords: '',
      amountPaid: 0,
      balanceDue: 100000,
      status: 'Overdue',
      paymentTerms: ''
    }
  ];

  const aiResult = processAIQuery('Show me all overdue invoices', {
    shipments: [],
    invoices,
    parties: [],
    quotations: []
  });

  assert.ok(aiResult.answer.includes('1 overdue'));
  assert.equal(aiResult.actionType, 'navigate');
  assert.equal(aiResult.actionTarget?.view, 'invoicing');
});
