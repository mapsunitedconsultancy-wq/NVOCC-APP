import { ContainerControlInvoice, CustomerLedger } from './types';

export const CONTAINER_CONTROL_PRICING_PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter (Per Container)',
    priceLabel: '₹80 / container monitored',
    description: 'Pay as you track. Best for CHAs and independent forwarders handling up to 50 boxes monthly.',
    features: [
      'ISO 6346 validation & EIR logging',
      'Automated 72h, 48h, 24h WhatsApp alerts',
      'Basic D&D calculator for 10 carriers',
      'Public tracking links for consignees',
      'Email support'
    ],
    isPopular: false,
    badge: 'PAY AS YOU GO'
  },
  {
    id: 'plan-pro',
    name: 'Pro (Monthly Flat)',
    priceLabel: '₹8,000 / month flat',
    description: 'Unlimited containers. Complete automation for busy Mundra & Kandla freight desks.',
    features: [
      'Unlimited container tracking & lifecycle chain',
      'All 12 CFS tariff database & instant quotes',
      'Bulk Excel container import (50+ boxes)',
      'Multi-party WhatsApp cascade (Shipper + CHA + Consignee)',
      'Client self-service branded tracking portal',
      'GST tax invoice generation with payment QR'
    ],
    isPopular: true,
    badge: 'MOST POPULAR'
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise (NVOCC Pro Growth)',
    priceLabel: 'INCLUDED FREE (with ₹25,000/mo Plan)',
    description: 'Deeply embedded inside MAPS NVOCC Pro. Zero separate charges for NVOCC Pro customers.',
    features: [
      'Full Module 16 natively unlocked in NVOCC Pro',
      'White-label portal with firm custom logo & sub-domain',
      'Automatic sync with HBL, MBL & Consolidation',
      'CFS charges auto-saved to Shipment Profitability',
      'Unified party ledger & combined 90+ day aging',
      'Direct API webhook integration (EDI 315 & ICEGATE)'
    ],
    isPopular: false,
    badge: 'BUNDLED IN NVOCC PRO'
  }
];

export const MOCK_CONTAINER_CONTROL_INVOICES: ContainerControlInvoice[] = [
  {
    id: 'cc-inv-001',
    invoiceNumber: 'MAPS/CC/24-25/0012',
    customerName: 'Krishna Ceramics Pvt Ltd',
    customerGstin: '24AABCK1234D1Z5',
    customerAddress: 'Plot 45, Ceramic Zone, Lalpar, Morbi, Gujarat 363642',
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-15',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Per Container (₹80)',
    items: [
      { sl: 1, description: 'Container Control Monitoring (12 Containers)', hsnSac: '996611', qty: 12, rate: 80, amount: 960 },
      { sl: 2, description: 'Allcargo CFS Charges (Pass-through reimbursement)', hsnSac: '996611', qty: 1, rate: 8400, amount: 8400 },
      { sl: 3, description: 'D&D Alert Engine & Live Countdown Service', hsnSac: '996611', qty: 1, rate: 1500, amount: 1500 },
      { sl: 4, description: 'Automated WhatsApp Milestone Notifications (45 alerts)', hsnSac: '996611', qty: 45, rate: 2, amount: 90 }
    ],
    subtotal: 10950,
    cgst: 985.5,
    sgst: 985.5,
    totalINR: 12921,
    status: 'Paid',
    paidDate: '2026-10-08',
    paymentMethod: 'HDFC Net Banking / IMPS'
  },
  {
    id: 'cc-inv-002',
    invoiceNumber: 'MAPS/CC/24-25/0013',
    customerName: 'Balaji Exim Solutions',
    customerGstin: '24AACFB4481K1Z2',
    customerAddress: 'GIDC Phase II, Plot 18, Gandhidham, Kutch 370201',
    invoiceDate: '2026-10-05',
    dueDate: '2026-10-20',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Monthly Flat (₹8,000)',
    items: [
      { sl: 1, description: 'Monthly Pro Container Control Subscription — October', hsnSac: '996611', qty: 1, rate: 8000, amount: 8000 },
      { sl: 2, description: 'Transworld CFS Terminal Drayage & Weighment pass-through', hsnSac: '996611', qty: 2, rate: 3750, amount: 7500 }
    ],
    subtotal: 15500,
    cgst: 1395,
    sgst: 1395,
    totalINR: 18290,
    status: 'Paid',
    paidDate: '2026-10-12',
    paymentMethod: 'UPI AutoPay (HDFC)'
  },
  {
    id: 'cc-inv-003',
    invoiceNumber: 'MAPS/CC/24-25/0014',
    customerName: 'Apex Polyplast Ltd',
    customerGstin: '24AAPCA5512B1Z8',
    customerAddress: 'Survey 221, Shapar-Veraval, Rajkot, Gujarat 360024',
    invoiceDate: '2026-10-08',
    dueDate: '2026-10-23',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Per Container (₹80)',
    items: [
      { sl: 1, description: 'Container Control Monitoring (8 Containers)', hsnSac: '996611', qty: 8, rate: 80, amount: 640 },
      { sl: 2, description: 'PSA Ameya CFS Ground Rent & Handling charges', hsnSac: '996611', qty: 1, rate: 14200, amount: 14200 }
    ],
    subtotal: 14840,
    cgst: 1335.6,
    sgst: 1335.6,
    totalINR: 17511.2,
    status: 'Paid',
    paidDate: '2026-10-14',
    paymentMethod: 'NEFT Transfer'
  },
  {
    id: 'cc-inv-004',
    invoiceNumber: 'MAPS/CC/24-25/0015',
    customerName: 'Maruti Minerals & Chemicals',
    customerGstin: '24AAECM3312C1Z1',
    customerAddress: 'Mandvi Road, Bhuj, Kutch, Gujarat 370001',
    invoiceDate: '2026-10-12',
    dueDate: '2026-10-27',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Per Container (₹80)',
    items: [
      { sl: 1, description: 'Container Control Tracking (16 Containers)', hsnSac: '996611', qty: 16, rate: 80, amount: 1280 },
      { sl: 2, description: 'Hind Terminals 1 Container Staging & Rail Siding Fee', hsnSac: '996611', qty: 2, rate: 4500, amount: 9000 }
    ],
    subtotal: 10280,
    cgst: 925.2,
    sgst: 925.2,
    totalINR: 12130.4,
    status: 'Due'
  },
  {
    id: 'cc-inv-005',
    invoiceNumber: 'MAPS/CC/24-25/0016',
    customerName: 'Sun Agro Exports',
    customerGstin: '24AAGCS9912A1Z9',
    customerAddress: 'APMC Yard, Unjha, Mehsana, Gujarat 384170',
    invoiceDate: '2026-10-14',
    dueDate: '2026-10-29',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Monthly Flat (₹8,000)',
    items: [
      { sl: 1, description: 'Monthly Pro Container Control Subscription', hsnSac: '996611', qty: 1, rate: 8000, amount: 8000 },
      { sl: 2, description: 'Mundhra CFS Fumigation Bay and Agri-clearance pass-through', hsnSac: '996611', qty: 1, rate: 3800, amount: 3800 }
    ],
    subtotal: 11800,
    cgst: 1062,
    sgst: 1062,
    totalINR: 13924,
    status: 'Due'
  },
  {
    id: 'cc-inv-006',
    invoiceNumber: 'MAPS/CC/24-25/0017',
    customerName: 'Dev Salt & Marine Chemicals',
    customerGstin: '24AADCS8812D1Z4',
    customerAddress: 'Salt Works Road, Kandla Port, Gandhidham 370205',
    invoiceDate: '2026-10-15',
    dueDate: '2026-10-30',
    billingPeriod: 'October 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Per Container (₹80)',
    items: [
      { sl: 1, description: 'Container Tracking & Free-time Monitoring (10 Boxes)', hsnSac: '996611', qty: 10, rate: 80, amount: 800 },
      { sl: 2, description: 'Fairdeal Supply Chain CFS handling & weighbridge', hsnSac: '996611', qty: 1, rate: 4200, amount: 4200 }
    ],
    subtotal: 5000,
    cgst: 450,
    sgst: 450,
    totalINR: 5900,
    status: 'Due'
  },
  {
    id: 'cc-inv-007',
    invoiceNumber: 'MAPS/CC/24-25/0009',
    customerName: 'Royal Pipes & Fittings',
    customerGstin: '24AABCR7712M1Z3',
    customerAddress: 'Makarpura GIDC, Vadodara, Gujarat 390010',
    invoiceDate: '2026-09-10',
    dueDate: '2026-09-25',
    billingPeriod: 'September 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Per Container (₹80)',
    items: [
      { sl: 1, description: 'Container Control Tracking (15 Containers)', hsnSac: '996611', qty: 15, rate: 80, amount: 1200 },
      { sl: 2, description: 'Saurashtra Freight CFS Ground Rent & Handling', hsnSac: '996611', qty: 1, rate: 16500, amount: 16500 },
      { sl: 3, description: 'D&D Overdue Demurrage Alert Service', hsnSac: '996611', qty: 1, rate: 2500, amount: 2500 }
    ],
    subtotal: 20200,
    cgst: 1818,
    sgst: 1818,
    totalINR: 23836,
    status: 'Overdue',
    daysOverdue: 22
  },
  {
    id: 'cc-inv-008',
    invoiceNumber: 'MAPS/CC/24-25/0004',
    customerName: 'Kutch Timber Traders',
    customerGstin: '24AAACK4412P1Z6',
    customerAddress: 'Timber Market, National Highway 8A, Gandhidham 370201',
    invoiceDate: '2026-08-15',
    dueDate: '2026-08-30',
    billingPeriod: 'August 2026',
    placeOfSupply: 'Gujarat (State Code 24)',
    billingModel: 'Monthly Flat (₹8,000)',
    items: [
      { sl: 1, description: 'Monthly Pro Container Control Subscription — August', hsnSac: '996611', qty: 1, rate: 8000, amount: 8000 },
      { sl: 2, description: 'Hind Terminals 2 Kandla Port Equipment Demurrage', hsnSac: '996611', qty: 1, rate: 12500, amount: 12500 }
    ],
    subtotal: 20500,
    cgst: 1845,
    sgst: 1845,
    totalINR: 24190,
    status: 'Overdue',
    daysOverdue: 48
  }
];

export const MOCK_CUSTOMER_LEDGERS: CustomerLedger[] = [
  {
    customerId: 'cust-krishna',
    customerName: 'Krishna Ceramics Pvt Ltd',
    gstin: '24AABCK1234D1Z5',
    openingBalance: 8200,
    closingBalance: 8600,
    aging: {
      current: 8600,
      days16to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0
    },
    entries: [
      { id: 'le-101', date: '2026-10-01', description: 'Opening Balance (Forwarded)', refNo: 'OB-OCT-26', debit: 8200, credit: 0, runningBalance: 8200 },
      { id: 'le-102', date: '2026-10-05', description: 'Payment received via HDFC IMPS', refNo: 'UTR-991204', debit: 0, credit: 8200, runningBalance: 0 },
      { id: 'le-103', date: '2026-10-08', description: 'Container Control Invoice #CC/0012', refNo: 'MAPS/CC/24-25/0012', debit: 12921, credit: 0, runningBalance: 12921 },
      { id: 'le-104', date: '2026-10-10', description: 'Payment received for Inv #0012', refNo: 'UTR-992451', debit: 0, credit: 12921, runningBalance: 0 },
      { id: 'le-105', date: '2026-10-15', description: 'CFS Terminal Drayage Debit Note', refNo: 'DN-2401', debit: 8600, credit: 0, runningBalance: 8600 }
    ]
  },
  {
    customerId: 'cust-balaji',
    customerName: 'Balaji Exim Solutions',
    gstin: '24AACFB4481K1Z2',
    openingBalance: 14500,
    closingBalance: 0,
    aging: {
      current: 0,
      days16to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0
    },
    entries: [
      { id: 'le-201', date: '2026-10-01', description: 'Opening Balance', refNo: 'OB-OCT-26', debit: 14500, credit: 0, runningBalance: 14500 },
      { id: 'le-202', date: '2026-10-04', description: 'Bank RTGS Receipt', refNo: 'UTR-881239', debit: 0, credit: 14500, runningBalance: 0 },
      { id: 'le-203', date: '2026-10-05', description: 'Invoice #CC/0013 Pro Monthly', refNo: 'MAPS/CC/24-25/0013', debit: 18290, credit: 0, runningBalance: 18290 },
      { id: 'le-204', date: '2026-10-12', description: 'AutoPay Settlement HDFC', refNo: 'AP-55120', debit: 0, credit: 18290, runningBalance: 0 }
    ]
  },
  {
    customerId: 'cust-royal-pipes',
    customerName: 'Royal Pipes & Fittings',
    gstin: '24AABCR7712M1Z3',
    openingBalance: 0,
    closingBalance: 23836,
    aging: {
      current: 0,
      days16to30: 23836,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0
    },
    entries: [
      { id: 'le-301', date: '2026-09-10', description: 'Invoice #CC/0009 Overdue', refNo: 'MAPS/CC/24-25/0009', debit: 23836, credit: 0, runningBalance: 23836 }
    ]
  },
  {
    customerId: 'cust-kutch-timber',
    customerName: 'Kutch Timber Traders',
    gstin: '24AAACK4412P1Z6',
    openingBalance: 18000,
    closingBalance: 42190,
    aging: {
      current: 0,
      days16to30: 0,
      days31to60: 24190,
      days61to90: 18000,
      days90plus: 0
    },
    entries: [
      { id: 'le-401', date: '2026-07-20', description: 'Invoice #CC/0002 July', refNo: 'MAPS/CC/24-25/0002', debit: 18000, credit: 0, runningBalance: 18000 },
      { id: 'le-402', date: '2026-08-15', description: 'Invoice #CC/0004 August', refNo: 'MAPS/CC/24-25/0004', debit: 24190, credit: 0, runningBalance: 42190 }
    ]
  }
];
