import {
  EgmFiling,
  IgmRecord,
  ShippingInstruction,
  SalesQuotation,
  ChaJob,
  TruckingTrip,
  TransporterRateMatrix,
  DangerousGoodsItem,
  UnReferenceItem,
  ApprovalRule,
  ApprovalRequest,
  LetterOfCredit,
  MarineInsurancePolicy,
  AdvanceFiling,
  BlTemplate,
  ContainerRepositioningJob,
  EirRecord
} from '../types/v4Types';

// ══════════════════════════════════════════════════════════════════════════
// A1. SAMPLE EGM FILINGS (Export General Manifest)
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_EGM_FILINGS: EgmFiling[] = [
  {
    id: 'egm-001',
    vesselVoyage: 'DP WORLD CHENNAI / 014W',
    vesselName: 'DP WORLD CHENNAI',
    voyageNumber: '014W',
    carrierName: 'Unifeeder / DP World',
    pol: 'Mundra (INMUN)',
    pod: 'Jebel Ali (AEJEA)',
    sailedDate: '16-10-2026',
    filingDeadline: '23-10-2026',
    hblCount: 14,
    containerCount: 22,
    totalGrossWtKg: 462500,
    status: 'Draft',
    isDeadlineUrgent: true,
    hoursRemaining: 34,
    hblList: ['LCMUNJEALMU2600407', 'MAPS-HBL-240342-01', 'MAPS-HBL-240342-02', 'MAPS-HBL-240345-01'],
    amendments: []
  },
  {
    id: 'egm-002',
    vesselVoyage: 'MSC JADE / 437W',
    vesselName: 'MSC JADE',
    voyageNumber: '437W',
    carrierName: 'Mediterranean Shipping Company (MSC)',
    pol: 'Mundra (INMUN)',
    pod: 'Hamburg (DEHAM)',
    sailedDate: '14-10-2026',
    filingDeadline: '21-10-2026',
    hblCount: 18,
    containerCount: 28,
    totalGrossWtKg: 580000,
    status: 'Draft',
    isDeadlineUrgent: true,
    hoursRemaining: 18,
    hblList: ['LCMUNHAM2600214', 'MAPS-HBL-240343-01', 'MAPS-HBL-240343-02'],
    amendments: []
  },
  {
    id: 'egm-003',
    vesselVoyage: 'MAERSK KALAMATA / 248E',
    vesselName: 'MAERSK KALAMATA',
    voyageNumber: '248E',
    carrierName: 'A.P. Moller - Maersk',
    pol: 'Mundra (INMUN)',
    pod: 'Singapore (SGSIN)',
    sailedDate: '10-10-2026',
    filingDeadline: '17-10-2026',
    hblCount: 26,
    containerCount: 42,
    totalGrossWtKg: 890400,
    status: 'Filed',
    iemNumber: 'IEM-MUN-2026-881920',
    filedAt: '15-10-2026 14:32',
    filedBy: 'Utsav Joshi (Operations)',
    isDeadlineUrgent: false,
    hoursRemaining: 0,
    hblList: ['MSKUMUN2600407', 'MAPS-HBL-240344-01'],
    amendments: []
  },
  {
    id: 'egm-004',
    vesselVoyage: 'CMA CGM TITAN / 0FF9E',
    vesselName: 'CMA CGM TITAN',
    voyageNumber: '0FF9E',
    carrierName: 'CMA CGM Line',
    pol: 'Pipavav (INPAV)',
    pod: 'Rotterdam (NLRTM)',
    sailedDate: '08-10-2026',
    filingDeadline: '15-10-2026',
    hblCount: 20,
    containerCount: 31,
    totalGrossWtKg: 642000,
    status: 'Amended',
    iemNumber: 'IEM-PAV-2026-440192',
    filedAt: '12-10-2026 11:20',
    filedBy: 'Utsav Joshi (Operations)',
    isDeadlineUrgent: false,
    hoursRemaining: 0,
    hblList: ['CMA-PAVRTM-26019'],
    amendments: [
      {
        id: 'amend-01',
        filedAt: '14-10-2026 16:45',
        priorValues: { grossWeightKg: 24500, packageCount: '900 BAGS' },
        newValues: { grossWeightKg: 25200, packageCount: '930 BAGS' },
        reasonCode: 'DGFT-01',
        reasonDescription: 'Weight & packaging adjustment per final customs examination voucher',
        approvedBy: 'Aman Dana (Admin)'
      }
    ]
  },
  {
    id: 'egm-005',
    vesselVoyage: 'COSCO SHIPPING PLANET / 028W',
    vesselName: 'COSCO SHIPPING PLANET',
    voyageNumber: '028W',
    carrierName: 'COSCO Shipping Lines',
    pol: 'Kandla DPT (INIXY)',
    pod: 'Dammam (SADMM)',
    sailedDate: '12-10-2026',
    filingDeadline: '19-10-2026',
    hblCount: 15,
    containerCount: 20,
    totalGrossWtKg: 420000,
    status: 'Filed',
    iemNumber: 'IEM-IXY-2026-119402',
    filedAt: '16-10-2026 09:15',
    filedBy: 'Utsav Joshi (Operations)',
    isDeadlineUrgent: false,
    hoursRemaining: 0,
    hblList: ['COS-IXYDMM-26002'],
    amendments: []
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A2. SAMPLE IGM RECORDS (Import General Manifest)
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_IGM_RECORDS: IgmRecord[] = [
  {
    id: 'igm-001',
    vesselVoyage: "EUPHORIA / 'E603WMUN",
    vesselName: 'EUPHORIA',
    voyageNumber: 'E603WMUN',
    agentOrigin: 'MAPS Logistics LLC (Dubai/Sohar)',
    eta: '22-10-2026',
    hblCount: 12,
    lineIgmNumber: '248912',
    lineIgmDate: '18-10-2026',
    itemNumber: '001',
    status: 'Reconciled',
    matchPercentage: 100,
    discrepanciesCount: 0,
    consignments: [
      {
        id: 'c-01',
        hblNumber: 'LCSOHMUNSOH2600163',
        mblNumber: 'MSKUSOH2600891',
        shipper: 'SOHAR RECYCLING METALS FZC',
        consignee: 'ANANTA METAL RECYCLING PRIVATE LIMITED',
        consigneeGstin: '24AABCA8891D1Z2',
        consigneeIec: '0314059918',
        isIecVerified: true,
        containerNumber: 'FCIU2316385',
        sealNumber: '1132934',
        sizeType: '20GP',
        cargoDescription: 'ALUMINIUM SCRAP TENSE / TAINT TONGUE',
        grossWeightKg: 25730,
        packageCount: '1 LOT',
        lineMatched: true,
        arrivalNoticeSent: true,
        arrivalNoticeSentAt: '18-10-2026 15:40',
        doStatus: 'Issued',
        cfsName: 'MUNDHRA CFS, MUNDRA',
        chargesEstimateINR: 32500
      },
      {
        id: 'c-02',
        hblNumber: 'LCSOHMUNSOH2600164',
        mblNumber: 'MSKUSOH2600891',
        shipper: 'GULF PIPES & METALS LLC',
        consignee: 'KUTCH ALLOY CASTINGS PVT LTD',
        consigneeGstin: '24AABCK4490A1Z5',
        consigneeIec: '0311029411',
        isIecVerified: true,
        containerNumber: 'TGHU1149204',
        sealNumber: '882941',
        sizeType: '20GP',
        cargoDescription: 'BRASS INGOTS & DROSS',
        grossWeightKg: 26100,
        packageCount: '48 PALLETS',
        lineMatched: true,
        arrivalNoticeSent: true,
        arrivalNoticeSentAt: '18-10-2026 15:40',
        doStatus: 'Requested',
        cfsName: 'SEABIRD CFS, MUNDRA',
        chargesEstimateINR: 34000
      }
    ]
  },
  {
    id: 'igm-002',
    vesselVoyage: 'MSC JADE / 438E',
    vesselName: 'MSC JADE',
    voyageNumber: '438E',
    agentOrigin: 'Trans-Oceanic Freight GmbH (Hamburg)',
    eta: '25-10-2026',
    hblCount: 8,
    lineIgmNumber: '249015',
    lineIgmDate: '19-10-2026',
    itemNumber: '014',
    status: 'Full',
    matchPercentage: 92,
    discrepanciesCount: 1,
    consignments: [
      {
        id: 'c-03',
        hblNumber: 'LCMUNHAM2600214',
        mblNumber: 'MEDUMUN991024',
        shipper: 'BASF SE CHEMICALS EUROPE',
        consignee: 'KUTCH CHEMICAL INDUSTRIES LTD',
        consigneeGstin: '24AAACK1122C1Z4',
        consigneeIec: '0308001294',
        isIecVerified: true,
        containerNumber: 'MSCU8942110',
        sealNumber: 'MSC99102',
        sizeType: '40HC',
        cargoDescription: 'POLYMERIC RAW MATERIALS',
        grossWeightKg: 24800,
        packageCount: '88 DRUMS',
        lineMatched: true,
        arrivalNoticeSent: true,
        arrivalNoticeSentAt: '19-10-2026 10:20',
        doStatus: 'Not Requested',
        cfsName: 'APSEZ CT-2 CFS, MUNDRA',
        chargesEstimateINR: 48000
      },
      {
        id: 'c-04',
        hblNumber: 'LCMUNHAM2600215',
        mblNumber: 'MEDUMUN991024',
        shipper: 'NORDIC WOOD SUPPLIES AB',
        consignee: 'WESTERN GUJARAT TIMBER MART',
        consigneeGstin: '24ABCPW9912E1Z8',
        consigneeIec: '',
        isIecVerified: false,
        containerNumber: 'MEDU7729104',
        sealNumber: 'MSC99103',
        sizeType: '40HC',
        cargoDescription: 'KILN DRIED PINE TIMBER LUMBER',
        grossWeightKg: 27900,
        packageCount: '24 BUNDLES',
        lineMatched: false,
        arrivalNoticeSent: false,
        doStatus: 'Not Requested',
        cfsName: 'MICT CONTAINER YARD',
        chargesEstimateINR: 52000
      }
    ]
  },
  {
    id: 'igm-003',
    vesselVoyage: 'WAN HAI 515 / W082',
    vesselName: 'WAN HAI 515',
    voyageNumber: 'W082',
    agentOrigin: 'Eastern Glory Shipping (Kaohsiung)',
    eta: '28-10-2026',
    hblCount: 15,
    lineIgmNumber: 'Pending',
    lineIgmDate: '-',
    itemNumber: 'Pending',
    status: 'Pending',
    matchPercentage: 65,
    discrepanciesCount: 2,
    consignments: []
  },
  {
    id: 'igm-004',
    vesselVoyage: 'OOCL KOREA / 112W',
    vesselName: 'OOCL KOREA',
    voyageNumber: '112W',
    agentOrigin: 'Pacific Logistics Ltd (Shanghai)',
    eta: '02-11-2026',
    hblCount: 20,
    lineIgmNumber: 'Pending',
    lineIgmDate: '-',
    itemNumber: 'Pending',
    status: 'Partial',
    matchPercentage: 78,
    discrepanciesCount: 1,
    consignments: []
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A3. SAMPLE SHIPPING INSTRUCTIONS (SI Inbox)
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_SHIPPING_INSTRUCTIONS: ShippingInstruction[] = [
  {
    id: 'si-001',
    siNumber: 'SI-WA-2026-081',
    channel: 'WhatsApp',
    senderName: 'Pravin Patel (Krishna Ceramics)',
    senderContact: '+91 98250 12345',
    receivedAt: '19-10-2026 10:14',
    matchedShipmentId: 'MAPS-240342',
    matchedHblNumber: 'MAPS-HBL-240342-01',
    status: 'Parsed',
    rawContent: `Dear MAPS Team, Please issue HBL for our export shipment of Porcelain Tiles to Jebel Ali.
Shipper: KRISHNA CERAMICS, Morbi Gujarat
Consignee: TO ORDER OF EMIRATES NBD BANK, DUBAI
Notify: AL FAHIDI TRADING LLC, P.O. Box 49102 Dubai UAE
Cargo: Vitrified Floor Tiles 600x600mm, 2x20GP containers FCIU4419201 & FCIU4419202
Gross Wt: 54,200 Kgs, 1800 Boxes
Freight: Prepaid at Gandhidham
Vessel: DP WORLD CHENNAI Voy 014`,
    parsedData: {
      shipperName: 'KRISHNA CERAMICS',
      shipperAddress: 'Plot No. 45, Ceramic Zone, Lalpar, Morbi 363642, Gujarat, India',
      consigneeName: 'TO ORDER OF EMIRATES NBD BANK, DUBAI',
      notifyParty: 'AL FAHIDI TRADING LLC, P.O. BOX 49102 DUBAI UAE',
      pol: 'Mundra',
      pod: 'Jebel Ali',
      cargoDescription: 'VITRIFIED FLOOR TILES 600X600MM',
      hsCode: '69072100',
      packageCount: '1800 BOXES',
      grossWeightKg: 54200,
      containers: [
        { containerNumber: 'FCIU4419201', sealNumber: 'KC-2601', sizeType: '20GP' },
        { containerNumber: 'FCIU4419202', sealNumber: 'KC-2602', sizeType: '20GP' }
      ],
      specialInstructions: '14 Days Free Time at Destination requested by buyer'
    },
    parsingConfidence: 96,
    attachedDocName: 'Krishna_Ceramics_SI_EXT60.pdf'
  },
  {
    id: 'si-002',
    siNumber: 'SI-PORTAL-2026-042',
    channel: 'Portal',
    senderName: 'Saurashtra Minerals (Shipper Portal)',
    senderContact: 'exports@saurashtramineral.com',
    receivedAt: '18-10-2026 17:30',
    status: 'Unparsed',
    rawContent: `Booking Ref: MAPS-EXP-BKG-992
Commodity: Bauxite Lump in Bulk Bag
Port of Loading: Kandla (INIXY)
Discharge: Qingdao, China
Quantity: 10 x 20' Dry Containers
Weight: 275,000 Kgs total`,
    parsedData: {
      shipperName: 'SAURASHTRA MINERALS & EXPORTS PVT LTD',
      pol: 'Kandla',
      pod: 'Qingdao',
      cargoDescription: 'BAUXITE LUMP IN JUMBO BAGS',
      hsCode: '26060010',
      packageCount: '250 JUMBO BAGS',
      grossWeightKg: 275000
    },
    parsingConfidence: 89,
    attachedDocName: 'Saurashtra_SI_Portal_992.xlsx'
  },
  {
    id: 'si-003',
    siNumber: 'SI-EML-2026-119',
    channel: 'Email',
    senderName: 'Umar Saif (All-Ways Logistics)',
    senderContact: 'umarsaif@intleventfreight.com',
    receivedAt: '17-10-2026 11:22',
    matchedHblNumber: 'LCMUNJEALMU2600407',
    status: 'Converted to HBL Draft',
    rawContent: `Please find attached final shipping instructions for tile consignment. 10x20GP containers as per packing list attached.`,
    parsedData: {
      shipperName: 'ALL-WAYS LOGISTICS INDIA PVT LTD',
      consigneeName: 'INTERNATIONAL EVENTFREIGHT LLC',
      pol: 'Mundra',
      pod: 'Jebel Ali',
      cargoDescription: 'PORCELAIN GLAZED VITRIFIED TILES',
      hsCode: '69072100',
      packageCount: '9363 BOXES',
      grossWeightKg: 278000
    },
    parsingConfidence: 98,
    attachedDocName: 'Final_SI_AllWays_10Containers.pdf'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A4. SAMPLE QUOTATION PIPELINE (Sales CRM)
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_SALES_QUOTATIONS: SalesQuotation[] = [
  {
    id: 'quote-pipe-01',
    quoteNumber: 'Q-2026-1041',
    customerId: 'p-001',
    customerName: 'Krishna Ceramics',
    pol: 'Mundra (INMUN)',
    pod: 'Jebel Ali (AEJEA)',
    containerType: '20GP',
    containerCount: 10,
    commodity: 'Vitrified Porcelain Tiles',
    targetRateUSD: 780,
    offeredRateUSD: 820,
    marginINR: 42000,
    validTill: '31-10-2026',
    requiredByDate: '24-10-2026',
    salesPerson: 'Rahul Sharma',
    stage: 'Negotiating',
    ageDays: 3,
    paymentTerms: 'Credit 30 Days',
    createdAt: '16-10-2026',
    carrierOptions: [
      { carrier: 'Unifeeder', transitDays: 4, baseFreightUSD: 740, surchargesUSD: 40, totalUSD: 780, validTill: '31-10-2026', frequency: '2 sailings/week' },
      { carrier: 'DP World', transitDays: 5, baseFreightUSD: 760, surchargesUSD: 30, totalUSD: 790, validTill: '31-10-2026', frequency: 'Weekly' }
    ],
    selectedCarrier: 'Unifeeder'
  },
  {
    id: 'quote-pipe-02',
    quoteNumber: 'Q-2026-1042',
    customerId: 'p-002',
    customerName: 'Saurashtra Minerals',
    pol: 'Kandla (INIXY)',
    pod: 'Qingdao (CNTAO)',
    containerType: '20GP',
    containerCount: 25,
    commodity: 'Bauxite Lumps in Bags',
    targetRateUSD: 650,
    offeredRateUSD: 690,
    marginINR: 88000,
    validTill: '05-11-2026',
    requiredByDate: '26-10-2026',
    salesPerson: 'Rahul Sharma',
    stage: 'Sent to Customer',
    ageDays: 2,
    paymentTerms: 'CAD / Sight LC',
    createdAt: '17-10-2026',
    carrierOptions: [
      { carrier: 'COSCO', transitDays: 18, baseFreightUSD: 620, surchargesUSD: 35, totalUSD: 655, validTill: '05-11-2026', frequency: 'Weekly' }
    ]
  },
  {
    id: 'quote-pipe-03',
    quoteNumber: 'Q-2026-1038',
    customerId: 'p-003',
    customerName: 'Kutch Chemical Industries',
    pol: 'Mundra (INMUN)',
    pod: 'Rotterdam (NLRTM)',
    containerType: '40HC',
    containerCount: 4,
    commodity: 'Industrial Resins (Non-DG)',
    offeredRateUSD: 2450,
    marginINR: 35000,
    validTill: '28-10-2026',
    requiredByDate: '20-10-2026',
    salesPerson: 'Rahul Sharma',
    stage: 'Won',
    bookingCreatedId: 'MAPS-EXP-240391',
    ageDays: 6,
    paymentTerms: 'Credit 15 Days',
    createdAt: '13-10-2026',
    carrierOptions: [
      { carrier: 'MSC', transitDays: 24, baseFreightUSD: 2200, surchargesUSD: 150, totalUSD: 2350, validTill: '31-10-2026', frequency: 'Weekly' }
    ]
  },
  {
    id: 'quote-pipe-04',
    quoteNumber: 'Q-2026-1035',
    customerId: 'p-004',
    customerName: 'Ananta Metal Recycling',
    pol: 'Sohar (OMSOH)',
    pod: 'Mundra (INMUN)',
    containerType: '20GP',
    containerCount: 6,
    commodity: 'Aluminium Scrap',
    targetRateUSD: 400,
    offeredRateUSD: 460,
    marginINR: 22000,
    validTill: '20-10-2026',
    requiredByDate: '15-10-2026',
    salesPerson: 'Rahul Sharma',
    stage: 'Lost',
    lossReason: 'Rate Too High',
    ageDays: 10,
    paymentTerms: 'Advance Payment',
    createdAt: '09-10-2026',
    carrierOptions: []
  },
  {
    id: 'quote-pipe-05',
    quoteNumber: 'Q-2026-1045',
    customerId: 'p-005',
    customerName: 'Euro Asian Tiles FZE',
    pol: 'Mundra (INMUN)',
    pod: 'Fos Sur Mer (FRFOS)',
    containerType: '20GP',
    containerCount: 8,
    commodity: 'Glazed Tiles',
    targetRateUSD: 1400,
    offeredRateUSD: 1480,
    marginINR: 52000,
    validTill: '10-11-2026',
    requiredByDate: '28-10-2026',
    salesPerson: 'Rahul Sharma',
    stage: 'RFQ Received',
    ageDays: 1,
    paymentTerms: 'Credit 30 Days',
    createdAt: '18-10-2026',
    carrierOptions: []
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A5. SAMPLE CHA & SHIPPING BILL TRACKER JOBS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_CHA_JOBS: ChaJob[] = [
  {
    id: 'chajob-001',
    shipmentId: 'MAPS-240342',
    hblNumber: 'MAPS-HBL-240342-01',
    chaId: 'cha-01',
    chaName: 'Om Shanti Logistics CHA',
    chaContact: 'Ramesh Dave (+91 94262 99120)',
    shippingBillNumber: '7557678',
    shippingBillDate: '08-10-2026',
    leoDate: '11-10-2026',
    examinationDate: '10-10-2026',
    dutyStatus: 'Exempted',
    dutyPaidAmountINR: 0,
    currentStage: 'Loaded',
    scheme: 'RoDTEP',
    schemeReference: 'RODTEP-MORBI-8812',
    icegateStatus: 'LEO Granted / Shipped Out',
    lastCheckedIcegateAt: '18-10-2026 14:10',
    documents: [
      { name: 'SB_7557678_Copy.pdf', type: 'SB', uploadedAt: '08-10-2026' },
      { name: 'LEO_Voucher_7557678.pdf', type: 'LEO', uploadedAt: '11-10-2026' }
    ]
  },
  {
    id: 'chajob-002',
    shipmentId: 'MAPS-240343',
    hblNumber: 'MAPS-HBL-240343-01',
    chaId: 'cha-02',
    chaName: 'Kutch Clearance Agency',
    chaContact: 'Deepak Joshi (+91 98240 88219)',
    shippingBillNumber: '7583063',
    shippingBillDate: '12-10-2026',
    leoDate: '15-10-2026',
    examinationDate: '14-10-2026',
    dutyStatus: 'Paid',
    dutyPaidAmountINR: 18400,
    currentStage: 'LEO',
    scheme: 'Duty Drawback (DBK)',
    schemeReference: 'DBK-MUN-2026-44',
    icegateStatus: 'LEO Generated / Gate In Port',
    lastCheckedIcegateAt: '19-10-2026 09:30',
    documents: [
      { name: 'SB_7583063_Copy.pdf', type: 'SB', uploadedAt: '12-10-2026' }
    ]
  },
  {
    id: 'chajob-003',
    shipmentId: 'MAPS-240344',
    hblNumber: 'MAPS-HBL-240344-01',
    chaId: 'cha-01',
    chaName: 'Om Shanti Logistics CHA',
    chaContact: 'Ramesh Dave (+91 94262 99120)',
    shippingBillNumber: '7601928',
    shippingBillDate: '16-10-2026',
    dutyStatus: 'Pending Assessment',
    dutyPaidAmountINR: 0,
    currentStage: 'Examined',
    scheme: 'RoDTEP',
    icegateStatus: 'Under Document Inspection at CFS',
    lastCheckedIcegateAt: '19-10-2026 11:45',
    documents: []
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A6. SAMPLE TRUCKING / TRANSPORTER JOBS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_TRUCKING_TRIPS: TruckingTrip[] = [
  {
    id: 'trip-001',
    tripNumber: 'TRIP-2026-0921',
    shipmentId: 'MAPS-240342',
    containerNumber: 'FCIU4419201',
    tripType: 'Factory to CFS',
    origin: 'Krishna Ceramics, Morbi Zone 2',
    destination: 'Mundhra CFS, Mundra Port',
    transporterId: 'tr-01',
    transporterName: 'Shree Kutch Roadways',
    lrNumber: 'LR-SKR-88192',
    truckNumber: 'GJ-12-BV-4412',
    driverName: 'Sanjay Ahir',
    driverPhone: '+91 94288 33190',
    scheduledPickup: '18-10-2026 08:00',
    actualPickup: '18-10-2026 08:45',
    deliveredTime: '18-10-2026 16:30',
    status: 'Completed',
    agreedRateINR: 18500,
    fuelSurchargeINR: 1200,
    detentionChargeINR: 0,
    notes: 'Gate-in receipt verified at CFS weighbridge'
  },
  {
    id: 'trip-002',
    tripNumber: 'TRIP-2026-0922',
    shipmentId: 'MAPS-240342',
    containerNumber: 'FCIU4419202',
    tripType: 'Factory to CFS',
    origin: 'Krishna Ceramics, Morbi Zone 2',
    destination: 'Mundhra CFS, Mundra Port',
    transporterId: 'tr-01',
    transporterName: 'Shree Kutch Roadways',
    lrNumber: 'LR-SKR-88193',
    truckNumber: 'GJ-12-BV-4419',
    driverName: 'Mohan Rabari',
    driverPhone: '+91 94288 33195',
    scheduledPickup: '18-10-2026 09:00',
    actualPickup: '18-10-2026 09:30',
    status: 'En Route',
    agreedRateINR: 18500,
    fuelSurchargeINR: 1200,
    detentionChargeINR: 0,
    notes: 'Passing Gandhidham bypass toll plaza'
  },
  {
    id: 'trip-003',
    tripNumber: 'TRIP-2026-0923',
    containerNumber: 'CBHU5692536',
    tripType: 'Empty Return',
    origin: 'Ananta Metal Yard, Mundra',
    destination: 'KDPP Terminals, Nana Kapaya',
    transporterId: 'tr-02',
    transporterName: 'Mundra Port Logistics Fleet',
    lrNumber: 'LR-MPL-4401',
    truckNumber: 'GJ-12-AY-9901',
    driverName: 'Kishore Jadeja',
    driverPhone: '+91 98255 11920',
    scheduledPickup: '19-10-2026 11:00',
    actualPickup: '19-10-2026 11:20',
    deliveredTime: '19-10-2026 13:40',
    status: 'Completed',
    agreedRateINR: 4500,
    fuelSurchargeINR: 0,
    detentionChargeINR: 0,
    notes: 'Container returned clean & sound. EIR signed off.'
  }
];

export const MOCK_TRANSPORTER_RATES: TransporterRateMatrix[] = [
  {
    id: 't-rate-01',
    transporterName: 'Shree Kutch Roadways',
    origin: 'Morbi Ceramic Cluster',
    destination: 'Mundra Port / CFS',
    containerType: '20GP',
    baseRateINR: 18500,
    fuelSurchargePercent: 5.5,
    freeWaitingHours: 6,
    waitingPerHourINR: 400
  },
  {
    id: 't-rate-02',
    transporterName: 'Shree Kutch Roadways',
    origin: 'Morbi Ceramic Cluster',
    destination: 'Mundra Port / CFS',
    containerType: '40HC',
    baseRateINR: 26000,
    fuelSurchargePercent: 5.5,
    freeWaitingHours: 6,
    waitingPerHourINR: 550
  },
  {
    id: 't-rate-03',
    transporterName: 'Mundra Port Logistics Fleet',
    origin: 'Mundra CFS',
    destination: 'Gandhidham Empty Yard',
    containerType: '20GP / 40HC',
    baseRateINR: 4500,
    fuelSurchargePercent: 0,
    freeWaitingHours: 4,
    waitingPerHourINR: 300
  }
];

// ══════════════════════════════════════════════════════════════════════════
// A7. DANGEROUS GOODS (IMDG) DATABASE & SHIPMENTS
// ══════════════════════════════════════════════════════════════════════════
export const UN_DATABASE_LOOKUP: UnReferenceItem[] = [
  {
    unNumber: 'UN1230',
    properShippingName: 'METHANOL',
    imdgClass: '3',
    subsidiaryRisk: '6.1 Toxic',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: 'None',
    ems: 'F-E, S-D'
  },
  {
    unNumber: 'UN1263',
    properShippingName: 'PAINT or PAINT RELATED MATERIAL',
    imdgClass: '3',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: 'None',
    ems: 'F-E, S-E'
  },
  {
    unNumber: 'UN1950',
    properShippingName: 'AEROSOLS, flammable',
    imdgClass: '2.1',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: 'None',
    ems: 'F-D, S-U'
  },
  {
    unNumber: 'UN1789',
    properShippingName: 'HYDROCHLORIC ACID',
    imdgClass: '8',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: '1 - Acids',
    ems: 'F-A, S-B'
  },
  {
    unNumber: 'UN1824',
    properShippingName: 'SODIUM HYDROXIDE SOLUTION',
    imdgClass: '8',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: '2 - Alkalis (Incompatible with Acids)',
    ems: 'F-A, S-B'
  },
  {
    unNumber: 'UN1830',
    properShippingName: 'SULPHURIC ACID with more than 51% acid',
    imdgClass: '8',
    packingGroup: 'II',
    marinePollutant: false,
    segregationGroup: '1 - Strong Acids',
    ems: 'F-A, S-B'
  },
  {
    unNumber: 'UN3077',
    properShippingName: 'ENVIRONMENTALLY HAZARDOUS SUBSTANCE, SOLID, N.O.S.',
    imdgClass: '9',
    packingGroup: 'III',
    marinePollutant: true,
    segregationGroup: 'None',
    ems: 'F-A, S-F'
  }
];

export const MOCK_DG_SHIPMENTS: DangerousGoodsItem[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // GOLDEN DG SHIPMENT: Kutch Chemicals (Testing Pack Point 08)
  // Container: TGHU4512070 | UN1263 PAINT Class 3 PG III Flashpoint 23°C
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'dg-gold-1',
    shipmentId: 'MAPS-EXP-240398',
    hblNumber: 'MAPS-HBL-240398-01',
    unNumber: 'UN1263',
    properShippingName: 'PAINT (flammable liquid)',
    imdgClass: '3',
    packingGroup: 'III',
    flashPoint: '23°C c.c.',
    marinePollutant: false,
    segregationGroup: 'None',
    emsNumber: 'F-E, S-E',
    status: 'DGD Submitted',
    carrierApprovalRef: '', // Pending carrier approval gate test
    netQuantityKg: 18000,
    grossWeightKg: 19800,
    packageType: '80 STEEL DRUMS 220L',
    emergencyContact: 'Chemtrec / Dr. K. Mehta (+91 98250 99911)',
    consigneeNotice: 'Flammable liquid class 3 PG III. Carrier approval required before loading.'
  },
  {
    id: 'dg-001',
    shipmentId: 'MAPS-EXP-240391',
    hblNumber: 'MAPS-HBL-240391-01',
    unNumber: 'UN1230',
    properShippingName: 'METHANOL',
    imdgClass: '3 (6.1)',
    packingGroup: 'II',
    flashPoint: '11°C c.c.',
    marinePollutant: false,
    segregationGroup: 'None',
    emsNumber: 'F-E, S-D',
    status: 'Carrier Approved',
    carrierApprovalRef: 'MAEU-DG-MUN-2026-99124',
    netQuantityKg: 18000,
    grossWeightKg: 19500,
    packageType: '80 STEEL DRUMS 220L',
    emergencyContact: 'Chemtrec / Dr. K. Mehta (+91 98250 99911)',
    consigneeNotice: 'Highly flammable and toxic liquid. Keep cool and away from living quarters.'
  },
  {
    id: 'dg-002',
    shipmentId: 'MAPS-EXP-240395',
    hblNumber: 'MAPS-HBL-240395-01',
    unNumber: 'UN3077',
    properShippingName: 'ENVIRONMENTALLY HAZARDOUS SUBSTANCE, SOLID, N.O.S. (Zinc Oxide Residues)',
    imdgClass: '9',
    packingGroup: 'III',
    marinePollutant: true,
    segregationGroup: 'None',
    emsNumber: 'F-A, S-F',
    status: 'DGD Submitted',
    netQuantityKg: 24000,
    grossWeightKg: 24800,
    packageType: '24 JUMBO BAGS (1000KG)',
    emergencyContact: 'Emergency Response (+91 2836 230911)',
    consigneeNotice: 'Marine pollutant - segregate from food items.'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// C1. APPROVAL RULES & ACTIVE REQUESTS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: 'rule-01',
    title: 'Quote Discount > 10%',
    conditionDescription: 'Requires Finance approval if rate discount exceeds 10% of base tariff',
    thresholdType: 'PERCENT',
    thresholdValue: 10,
    requiredRole: 'finance',
    isActive: true
  },
  {
    id: 'rule-02',
    title: 'Quote Discount > 25%',
    conditionDescription: 'Requires Super Admin approval for deep discounts over 25%',
    thresholdType: 'PERCENT',
    thresholdValue: 25,
    requiredRole: 'super_admin',
    isActive: true
  },
  {
    id: 'rule-03',
    title: 'DO Release with Unpaid Invoice',
    conditionDescription: 'Blocked from DO release if freight/terminal invoices remain unpaid without credit terms',
    thresholdType: 'FLAG',
    thresholdValue: 1,
    requiredRole: 'finance',
    isActive: true
  },
  {
    id: 'rule-04',
    title: 'Credit Limit Increase',
    conditionDescription: 'Credit line extension beyond sanctioned ₹10,00,000 limit requires Super Admin sign-off',
    thresholdType: 'AMOUNT',
    thresholdValue: 1000000,
    requiredRole: 'super_admin',
    isActive: true
  },
  {
    id: 'rule-05',
    title: 'Invoice Write-Off > ₹25,000',
    conditionDescription: 'Requires Finance approval to forgive demurrage or documentation discrepancy fees',
    thresholdType: 'AMOUNT',
    thresholdValue: 25000,
    requiredRole: 'finance',
    isActive: true
  },
  {
    id: 'rule-06',
    title: 'Agent SWIFT Payment > ₹5,00,000',
    conditionDescription: 'Overseas agent remittance above threshold requires Super Admin validation',
    thresholdType: 'AMOUNT',
    thresholdValue: 500000,
    requiredRole: 'super_admin',
    isActive: true
  }
];

export const MOCK_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'appr-001',
    ruleId: 'rule-01',
    ruleTitle: 'Quote Discount > 10%',
    entityType: 'QUOTE_DISCOUNT',
    entityId: 'Q-2026-1041',
    entityReference: 'Quote Q-2026-1041 (Krishna Ceramics)',
    requestedBy: 'Rahul Sharma (Sales)',
    requestedAt: '18-10-2026 16:30',
    requiredRole: 'finance',
    status: 'Pending',
    amountOrPercent: 12.5,
    reason: 'Client will commit 20 FEU per month if special introductory rate is granted.'
  },
  {
    id: 'appr-002',
    ruleId: 'rule-03',
    ruleTitle: 'DO Release with Unpaid Invoice',
    entityType: 'DO_RELEASE_UNPAID',
    entityId: 'LANDOMUN3632027',
    entityReference: 'DO LANDOMUN3632027 (Kutch Chemical)',
    requestedBy: 'Utsav Joshi (Operations)',
    requestedAt: '19-10-2026 09:15',
    requiredRole: 'finance',
    status: 'Pending',
    amountOrPercent: 48000,
    reason: 'Consignee promises RTGS payment by 4 PM. Plant shutdown risk if container is delayed at CFS.'
  },
  {
    id: 'appr-003',
    ruleId: 'rule-05',
    ruleTitle: 'Invoice Write-Off > ₹25,000',
    entityType: 'INVOICE_WRITEOFF',
    entityId: 'INV-2026-081',
    entityReference: 'Invoice INV-2026-081 (Western Timber)',
    requestedBy: 'Seema Patel (Finance)',
    requestedAt: '17-10-2026 14:00',
    requiredRole: 'super_admin',
    status: 'Approved',
    amountOrPercent: 32000,
    reason: 'Port congestion waiver granted by Adani Ports CT-2 passed on to customer.',
    decisionNotes: 'Approved per APSEZ circular CT2/2026/09.',
    decidedBy: 'Aman Dana (Super Admin)',
    decidedAt: '17-10-2026 15:30'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// C3. LETTER OF CREDIT (LC) SAMPLE RECORDS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_LC_RECORDS: LetterOfCredit[] = [
  {
    id: 'lc-001',
    shipmentId: 'MAPS-240342',
    lcNumber: 'LC/ENBD/2026/99410',
    issuingBank: 'Emirates NBD Bank PJSC, Dubai',
    advisingBank: 'State Bank of India, Gandhidham Branch',
    beneficiaryBank: 'HDFC Bank, Morbi Branch',
    amountUSD: 48500,
    latestShipmentDate: '25-10-2026',
    expiryDate: '10-11-2026',
    status: 'Active',
    requiredDocuments: [
      'Full set (3/3) Clean on Board Multimodal Transport Bills of Lading',
      'Signed Commercial Invoice in 4 originals',
      'Detailed Packing List showing container breakdown',
      'Certificate of Origin issued by Indian Chamber of Commerce',
      'Insurance Certificate covering 110% of CIF value (ICC A)'
    ],
    discrepancies: []
  }
];

// ══════════════════════════════════════════════════════════════════════════
// C4. MARINE INSURANCE POLICIES
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_MARINE_POLICIES: MarineInsurancePolicy[] = [
  {
    id: 'ins-001',
    shipmentId: 'MAPS-240342',
    policyType: 'Open Policy',
    policyNumber: 'NEW-IND-MAR-2026-0914',
    certificateNumber: 'CERT-MUN-88219',
    insurer: 'The New India Assurance Co. Ltd, Gandhidham Branch',
    insuredValueINR: 4250000,
    premiumINR: 5950,
    coverType: 'ICC (A) All Risks',
    issueDate: '10-10-2026',
    status: 'Active'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// C5. ADVANCE FILINGS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_ADVANCE_FILINGS: AdvanceFiling[] = [
  {
    id: 'adv-001',
    shipmentId: 'MAPS-240343',
    country: 'EU (ENS)',
    filingType: 'Entry Summary Declaration (ICS2 Release 3)',
    deadline: '24-10-2026 18:00',
    status: 'Accepted',
    referenceNumber: 'ENS-EU-2026-881920',
    submittedAt: '19-10-2026 08:30'
  },
  {
    id: 'adv-002',
    shipmentId: 'MAPS-EXP-US-01',
    country: 'USA (ISF 10+2)',
    filingType: 'Importer Security Filing (CBP)',
    deadline: '22-10-2026 12:00',
    status: 'Pending',
    referenceNumber: ''
  }
];

// ══════════════════════════════════════════════════════════════════════════
// B3. BL TEMPLATES
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_BL_TEMPLATES: BlTemplate[] = [
  {
    id: 'tpl-01',
    name: 'Standard Indian MTO Combined Transport B/L',
    isDefault: true,
    prefix: 'MAPS/HBL/2026/',
    tradeLane: 'Global / Multi-trade',
    tcClauses: [
      'Issued subject to Indian Multimodal Transportation of Goods Act 1993',
      'Limitation of liability 2 SDR per KG or 666.67 SDR per package',
      'Jurisdiction Gandhidham / Kutch Courts, Gujarat'
    ],
    showMarks: true,
    showFreightCharges: true
  },
  {
    id: 'tpl-02',
    name: 'Negotiable Letter of Credit B/L (Strict Bank Format)',
    isDefault: false,
    prefix: 'MAPS/LC/2026/',
    tradeLane: 'Middle East & Europe',
    tcClauses: [
      'Full set 3 originals issued',
      'Clean on board endorsement',
      'Carrier certified ISO 9001:2015 NVOCC'
    ],
    showMarks: true,
    showFreightCharges: false
  }
];

// ══════════════════════════════════════════════════════════════════════════
// B5. REPOSITIONING & EIR RECORDS
// ══════════════════════════════════════════════════════════════════════════
export const MOCK_REPOSITIONING_JOBS: ContainerRepositioningJob[] = [
  {
    id: 'repo-001',
    fromDepot: 'Mundra Port Surplus Yard',
    toDepot: 'Morbi Ceramic Cluster ICD',
    containerCount: 15,
    containerType: "20' GP Heavy Duty",
    costEstimateINR: 112500,
    projectedRoiPercent: 28.5,
    status: 'In Transit',
    vesselVoyageOrTruck: 'Train Rake #CONCOR-771',
    startDate: '18-10-2026',
    arrivalDate: '20-10-2026'
  }
];

export const MOCK_EIR_RECORDS: EirRecord[] = [
  {
    id: 'eir-001',
    containerNumber: 'FCIU2316385',
    eirType: 'Pickup EIR',
    location: 'KDPP Terminals, Nana Kapaya',
    inspectedAt: '15-10-2026 10:15',
    inspectorName: 'Bhavin Vaghela',
    condition: 'Clean & Sound',
    repairEstimateINR: 0,
    signedOff: true,
    photos: []
  },
  {
    id: 'eir-002',
    containerNumber: 'CBHU5692536',
    eirType: 'Return EIR',
    location: 'KDPP Terminals, Nana Kapaya',
    inspectedAt: '19-10-2026 13:40',
    inspectorName: 'Bhavin Vaghela',
    condition: 'Clean & Sound',
    repairEstimateINR: 0,
    signedOff: true,
    photos: []
  }
];
