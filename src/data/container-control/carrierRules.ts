import { CarrierFreeTimeRule } from './types';

export const USD_TO_INR_RATE = 83.5;

export const CARRIER_FREE_TIME_RULES: CarrierFreeTimeRule[] = [
  {
    carrierName: 'Maersk Line',
    scac: 'MSKU',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'MSC (Mediterranean Shipping Company)',
    scac: 'MEDU',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'CMA CGM',
    scac: 'CMAU',
    defaultFreeTimeDays: 10,
    demurrageTiers20USD: { days1to5: 50, days6to10: 95, days11to15: 155, days16plus: 210 },
    demurrageTiers40USD: { days1to5: 95, days6to10: 190, days11to15: 310, days16plus: 420 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 80 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 160 }
  },
  {
    carrierName: 'Hapag-Lloyd',
    scac: 'HLCU',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'COSCO Shipping Lines',
    scac: 'COSU',
    defaultFreeTimeDays: 14,
    demurrageTiers20USD: { days1to5: 40, days6to10: 80, days11to15: 140, days16plus: 190 },
    demurrageTiers40USD: { days1to5: 80, days6to10: 160, days11to15: 280, days16plus: 380 },
    detentionTiers20USD: { days1to5: 20, days6to10: 45, days11plus: 70 },
    detentionTiers40USD: { days1to5: 40, days6to10: 90, days11plus: 140 }
  },
  {
    carrierName: 'ONE (Ocean Network Express)',
    scac: 'ONEY',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'Evergreen Line',
    scac: 'EGLV',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'ZIM Integrated Shipping',
    scac: 'ZIMU',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'HMM (Hyundai Merchant Marine)',
    scac: 'HMMU',
    defaultFreeTimeDays: 10,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 145, days16plus: 195 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 290, days16plus: 390 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  },
  {
    carrierName: 'Yang Ming Marine Transport',
    scac: 'YMLU',
    defaultFreeTimeDays: 7,
    demurrageTiers20USD: { days1to5: 45, days6to10: 90, days11to15: 150, days16plus: 200 },
    demurrageTiers40USD: { days1to5: 90, days6to10: 180, days11to15: 300, days16plus: 400 },
    detentionTiers20USD: { days1to5: 25, days6to10: 50, days11plus: 75 },
    detentionTiers40USD: { days1to5: 50, days6to10: 100, days11plus: 150 }
  }
];

export function calculateDemurrageAndDetention(params: {
  carrierName: string;
  equipmentType: string;
  totalDays: number;
  freeTimeDays?: number;
  isGatedOut?: boolean;
}): {
  freeTimeDays: number;
  daysExceeded: number;
  demurrageUSD: number;
  demurrageINR: number;
  dailyRateUSD: number;
  dailyRateINR: number;
  detentionUSD: number;
  detentionINR: number;
  totalExposureINR: number;
} {
  const carrier = CARRIER_FREE_TIME_RULES.find(c => 
    c.carrierName.toLowerCase().includes(params.carrierName.toLowerCase())
  ) || CARRIER_FREE_TIME_RULES[0];

  const freeTimeDays = params.freeTimeDays !== undefined ? params.freeTimeDays : carrier.defaultFreeTimeDays;
  const is40 = params.equipmentType.includes('40');
  const daysExceeded = Math.max(0, params.totalDays - freeTimeDays);

  if (daysExceeded === 0) {
    const rateUSD = is40 ? carrier.demurrageTiers40USD.days1to5 : carrier.demurrageTiers20USD.days1to5;
    return {
      freeTimeDays,
      daysExceeded: 0,
      demurrageUSD: 0,
      demurrageINR: 0,
      dailyRateUSD: rateUSD,
      dailyRateINR: Math.round(rateUSD * USD_TO_INR_RATE),
      detentionUSD: 0,
      detentionINR: 0,
      totalExposureINR: 0
    };
  }

  const dDem = is40 ? carrier.demurrageTiers40USD : carrier.demurrageTiers20USD;
  const dDet = is40 ? carrier.detentionTiers40USD : carrier.detentionTiers20USD;

  let demUSD = 0;
  let currentDailyRateUSD = dDem.days1to5;

  // Demurrage calculation
  const d1to5 = Math.min(daysExceeded, 5);
  demUSD += d1to5 * dDem.days1to5;
  currentDailyRateUSD = dDem.days1to5;

  if (daysExceeded > 5) {
    const d6to10 = Math.min(daysExceeded - 5, 5);
    demUSD += d6to10 * dDem.days6to10;
    currentDailyRateUSD = dDem.days6to10;
  }

  if (daysExceeded > 10) {
    const d11to15 = Math.min(daysExceeded - 10, 5);
    demUSD += d11to15 * dDem.days11to15;
    currentDailyRateUSD = dDem.days11to15;
  }

  if (daysExceeded > 15) {
    const d16plus = daysExceeded - 15;
    demUSD += d16plus * dDem.days16plus;
    currentDailyRateUSD = dDem.days16plus;
  }

  // Detention if gated out
  let detUSD = 0;
  if (params.isGatedOut) {
    const d1to5Det = Math.min(daysExceeded, 5);
    detUSD += d1to5Det * dDet.days1to5;
    if (daysExceeded > 5) {
      const d6to10Det = Math.min(daysExceeded - 5, 5);
      detUSD += d6to10Det * dDet.days6to10;
    }
    if (daysExceeded > 10) {
      const d11plusDet = daysExceeded - 10;
      detUSD += d11plusDet * dDet.days11plus;
    }
  }

  const demurrageINR = Math.round(demUSD * USD_TO_INR_RATE);
  const detentionINR = Math.round(detUSD * USD_TO_INR_RATE);
  const totalExposureINR = demurrageINR + detentionINR;

  return {
    freeTimeDays,
    daysExceeded,
    demurrageUSD: demUSD,
    demurrageINR,
    dailyRateUSD: currentDailyRateUSD,
    dailyRateINR: Math.round(currentDailyRateUSD * USD_TO_INR_RATE),
    detentionUSD: detUSD,
    detentionINR,
    totalExposureINR
  };
}
