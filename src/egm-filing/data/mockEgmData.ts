import { EgmFiling, EgmConsignmentDetail, DgftReasonCode } from '../types';

export const DGFT_REASON_CODES: DgftReasonCode[] = [
  {
    code: 'DGFT-01',
    label: 'DGFT-01: Quantity / Weight discrepancy',
    description: 'Correction in piece count or SOLAS VGM/gross cargo weight based on terminal weighbridge or customs examination order.'
  },
  {
    code: 'DGFT-02',
    label: 'DGFT-02: Change of destination port',
    description: 'Cargo diverted to alternative discharge port or transshipment hub per carrier operational instruction.'
  },
  {
    code: 'DGFT-03',
    label: 'DGFT-03: Cargo description correction',
    description: 'Alignment of commodity nomenclature or HS Code description with validated ICEGATE Shipping Bill.'
  },
  {
    code: 'DGFT-04',
    label: 'DGFT-04: Shipper / Consignee name amendment',
    description: 'Typographical rectification or endorsement update on Bills of Lading parties.'
  }
];

export const MOCK_EGM_CONSIGNMENTS: Record<string, EgmConsignmentDetail> = {
  'LCMUNJEALMU2600407': {
    hblNumber: 'LCMUNJEALMU2600407',
    hblDate: '15-10-2026',
    shipperName: 'ALL-WAYS LOGISTICS INDIA PVT LTD',
    shipperAddress: 'Plot 14, Sector 8, Gandhidham, Gujarat 370201',
    consigneeName: 'AL-FUTTAIM TRADING LLC',
    consigneeAddress: 'Dubai Logistics City, P.O. Box 7880, Dubai UAE',
    containers: [
      { containerNumber: 'FCIU2316385', sealNumber: '1132934', sizeType: '40HC', grossWeightKg: 26400 }
    ],
    packageCountAndType: '1,420 CARTONS',
    grossWeightKg: 26400,
    cargoDescription: 'PORCELAIN FLOOR TILES 600X600MM POLISHED',
    polCode: 'INMUN',
    podCode: 'AEJEA',
    customsHouseCode: 'INMUN1',
    lineNo: 1,
    subLineNo: 1
  },
  'MAPS-HBL-240342-01': {
    hblNumber: 'MAPS-HBL-240342-01',
    hblDate: '14-10-2026',
    shipperName: 'SUN PHARMA LABORATORIES LTD',
    shipperAddress: 'GIDC Estate, Halol, Gujarat',
    consigneeName: 'GULF HEALTHCARE INTERNATIONAL',
    consigneeAddress: 'Deira, Dubai UAE',
    containers: [
      { containerNumber: 'MSKU9012384', sealNumber: 'IN884129', sizeType: '20GP', grossWeightKg: 18200 }
    ],
    packageCountAndType: '640 BOXES',
    grossWeightKg: 18200,
    cargoDescription: 'PHARMACEUTICAL FORMULATIONS IN BULK',
    polCode: 'INMUN',
    podCode: 'AEJEA',
    customsHouseCode: 'INMUN1',
    lineNo: 2,
    subLineNo: 1
  },
  'MAPS-HBL-240342-02': {
    hblNumber: 'MAPS-HBL-240342-02',
    hblDate: '14-10-2026',
    shipperName: 'RELIANCE INDUSTRIES LTD - PETROCHEMICALS',
    shipperAddress: 'Dahej SEZ, Bharuch, Gujarat',
    consigneeName: 'ARABIAN PLASTICS POLYMERS LLC',
    consigneeAddress: 'Jebel Ali Free Zone, Dubai UAE',
    containers: [
      { containerNumber: 'CMAU7718291', sealNumber: '882190', sizeType: '40HC', grossWeightKg: 28100 },
      { containerNumber: 'CMAU7718292', sealNumber: '882191', sizeType: '40HC', grossWeightKg: 27900 }
    ],
    packageCountAndType: '1,800 BAGS',
    grossWeightKg: 56000,
    cargoDescription: 'POLYPROPYLENE GRANULES PRIME GRADE',
    polCode: 'INMUN',
    podCode: 'AEJEA',
    customsHouseCode: 'INMUN1',
    lineNo: 3,
    subLineNo: 1
  },
  'MAPS-HBL-240345-01': {
    hblNumber: 'MAPS-HBL-240345-01',
    hblDate: '15-10-2026',
    shipperName: 'TATA MOTORS COMMERCIAL SPARES',
    shipperAddress: 'Sanand Industrial Area, Ahmedabad, Gujarat',
    consigneeName: 'AL ROSTAMANI VEHICLES & SPARES',
    consigneeAddress: 'Port Rashid Industrial Area, Dubai UAE',
    containers: [
      { containerNumber: 'TGHU1190248', sealNumber: '334910', sizeType: '40HC', grossWeightKg: 22800 }
    ],
    packageCountAndType: '450 WOODEN CRATES',
    grossWeightKg: 22800,
    cargoDescription: 'AUTOMOTIVE TRANSMISSION ASSEMBLIES & SPARES',
    polCode: 'INMUN',
    podCode: 'AEJEA',
    customsHouseCode: 'INMUN1',
    lineNo: 4,
    subLineNo: 1
  },
  'LCMUNHAM2600214': {
    hblNumber: 'LCMUNHAM2600214',
    hblDate: '13-10-2026',
    shipperName: 'BHARAT FORGE LIMITED',
    shipperAddress: 'Mundhwa, Pune, Maharashtra',
    consigneeName: 'DAIMLER TRUCK AG',
    consigneeAddress: 'Stuttgart, Germany',
    containers: [
      { containerNumber: 'MEDU8821904', sealNumber: 'MSC9910', sizeType: '20GP', grossWeightKg: 21500 }
    ],
    packageCountAndType: '32 STEEL STILLAGES',
    grossWeightKg: 21500,
    cargoDescription: 'FORGED CRANKSHAFTS AND ENGINE COMPONENTS',
    polCode: 'INMUN',
    podCode: 'DEHAM',
    customsHouseCode: 'INMUN1',
    lineNo: 1,
    subLineNo: 1
  },
  'MAPS-HBL-240343-01': {
    hblNumber: 'MAPS-HBL-240343-01',
    hblDate: '12-10-2026',
    shipperName: 'WELSPUN LIVING LIMITED',
    shipperAddress: 'Anjar, Kutch, Gujarat',
    consigneeName: 'OTTO GMBH & CO KG',
    consigneeAddress: 'Hamburg, Germany',
    containers: [
      { containerNumber: 'HLXU4491028', sealNumber: '671209', sizeType: '40HC', grossWeightKg: 19800 }
    ],
    packageCountAndType: '880 CARTONS',
    grossWeightKg: 19800,
    cargoDescription: '100% ORGANIC COTTON TERRY TOWELS & BED LINEN',
    polCode: 'INMUN',
    podCode: 'DEHAM',
    customsHouseCode: 'INMUN1',
    lineNo: 2,
    subLineNo: 1
  },
  'MAPS-HBL-240343-02': {
    hblNumber: 'MAPS-HBL-240343-02',
    hblDate: '13-10-2026',
    shipperName: 'JINDAL SAW LIMITED',
    shipperAddress: 'Samaghogha, Mundra, Gujarat',
    consigneeName: 'THYSSENKRUPP INDUSTRIAL SOLUTIONS',
    consigneeAddress: 'Essen, Germany',
    containers: [
      { containerNumber: 'MSCU1198273', sealNumber: 'MSC8819', sizeType: '40GP', grossWeightKg: 25400 }
    ],
    packageCountAndType: '40 BUNDLES',
    grossWeightKg: 25400,
    cargoDescription: 'SEAMLESS CARBON STEEL ALLOY PIPES',
    polCode: 'INMUN',
    podCode: 'DEHAM',
    customsHouseCode: 'INMUN1',
    lineNo: 3,
    subLineNo: 1
  },
  'MSKUMUN2600407': {
    hblNumber: 'MSKUMUN2600407',
    hblDate: '09-10-2026',
    shipperName: 'GUJARAT TEA PROCESSORS & PACKERS (WAGH BAKRI)',
    shipperAddress: 'Dholka, Ahmedabad, Gujarat',
    consigneeName: 'SINGAPORE TEA IMPORTERS PTE LTD',
    consigneeAddress: 'Jurong Port Road, Singapore',
    containers: [
      { containerNumber: 'MSKU2345678', sealNumber: 'MSK44109', sizeType: '40HC', grossWeightKg: 21200 }
    ],
    packageCountAndType: '1,200 CARTONS',
    grossWeightKg: 21200,
    cargoDescription: 'PREMIUM CTC BLACK TEA IN RETAIL PACKS',
    polCode: 'INMUN',
    podCode: 'SGSIN',
    customsHouseCode: 'INMUN1',
    lineNo: 1,
    subLineNo: 1
  },
  'MAPS-HBL-240344-01': {
    hblNumber: 'MAPS-HBL-240344-01',
    hblDate: '08-10-2026',
    shipperName: 'AMUL (GUJARAT CO-OP MILK MARKETING FEDERATION)',
    shipperAddress: 'Anand, Gujarat 388001',
    consigneeName: 'SINGAPORE DAIRY DISTRIBUTORS PTE',
    consigneeAddress: 'Woodlands Terrace, Singapore',
    containers: [
      { containerNumber: 'MSKU3456789', sealNumber: 'MSK99182', sizeType: '40RF', grossWeightKg: 24500 }
    ],
    packageCountAndType: '1,500 TINS',
    grossWeightKg: 24500,
    cargoDescription: 'PURE DAIRY GHEE & BUTTER OIL',
    polCode: 'INMUN',
    podCode: 'SGSIN',
    customsHouseCode: 'INMUN1',
    lineNo: 2,
    subLineNo: 1
  }
};

export const INITIAL_EGM_FILINGS: EgmFiling[] = [
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
    filedAt: '12-10-2026 11:15',
    filedBy: 'Rahul Sharma (Senior Forwarder)',
    isDeadlineUrgent: false,
    hoursRemaining: 0,
    hblList: ['MAPS-HBL-240342-01', 'MAPS-HBL-240345-01'],
    amendments: [
      {
        id: 'amend-001',
        filedAt: '14-10-2026',
        priorValues: { totalGrossWtKg: 642000 },
        newValues: { totalGrossWtKg: 639800 },
        reasonCode: 'DGFT-01',
        reasonDescription: 'SOLAS VGM final certified adjustment post-terminal weighbridge manifest check.',
        approvedBy: 'Customs Appraiser (Group 7)'
      }
    ]
  }
];
