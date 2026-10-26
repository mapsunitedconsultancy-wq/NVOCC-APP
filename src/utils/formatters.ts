import { ShipmentStatus } from '../types';

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
}

export function formatUSD(amount: number): string {
  if (isNaN(amount)) return '$0';
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatEUR(amount: number): string {
  if (isNaN(amount)) return '€0';
  return '€' + amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatWeight(kg: number): string {
  if (!kg) return '0 KGS';
  const lbs = Math.round(kg * 2.20462);
  return `${kg.toLocaleString('en-IN')} KGS (${lbs.toLocaleString('en-US')} LBS)`;
}

export function formatCBM(cbm: number): string {
  if (!cbm) return '0 CBM';
  const cft = (cbm * 35.3147).toFixed(1);
  return `${cbm.toFixed(2)} CBM (${cft} CFT)`;
}

export function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).substr(-9);
  const crore = parseInt(n.substr(0, 2), 10);
  const lakh = parseInt(n.substr(2, 2), 10);
  const thousand = parseInt(n.substr(4, 2), 10);
  const hundred = parseInt(n.substr(6, 1), 10);
  const doubleDigit = parseInt(n.substr(7, 2), 10);

  let str = '';

  const getSub = (val: number) => {
    if (val === 0) return '';
    if (val < 20) return a[val];
    return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
  };

  if (crore > 0) str += getSub(crore) + 'Crore ';
  if (lakh > 0) str += getSub(lakh) + 'Lakh ';
  if (thousand > 0) str += getSub(thousand) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (doubleDigit > 0) {
    if (str !== '') str += 'and ';
    str += getSub(doubleDigit);
  }

  return str.trim() + ' Rupees Only';
}

export {
  calculateGSTINCheckDigit,
  validateGSTIN,
  validatePAN,
  validateIEC,
  validateISO6346,
  validateSealNo,
  validateHSCode,
  validateSACCode,
  validateUNLOCODE,
  validateIFSC,
  validatePhoneIN,
  validateEmail,
  validateVesselIMO,
  validateVoyageNo,
  validateUNNumber,
  validateIMDGClass,
  validateContainerType,
  validateVGM,
  validateCBM,
  validateCurrency,
  formatDateToDisplay,
  formatDateToISO
} from './validators';


export function getShipmentStatusBadge(status: ShipmentStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'draft':
      return { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-700', label: 'Draft' };
    case 'booked':
      return { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-800/60', label: 'Booked' };
    case 'at_cfs':
      return { bg: 'bg-amber-950/50', text: 'text-amber-300', border: 'border-amber-700/60', label: 'At CFS' };
    case 'customs_cleared':
      return { bg: 'bg-emerald-950/50', text: 'text-emerald-300', border: 'border-emerald-700/60', label: 'Customs LEO' };
    case 'at_port':
      return { bg: 'bg-cyan-950/50', text: 'text-cyan-300', border: 'border-cyan-700/60', label: 'At Port' };
    case 'loaded':
      return { bg: 'bg-indigo-950/50', text: 'text-indigo-300', border: 'border-indigo-700/60', label: 'Loaded' };
    case 'on_vessel':
      return { bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-600/70', label: 'On Vessel' };
    case 'sailed':
      return { bg: 'bg-teal-950/60', text: 'text-teal-300', border: 'border-teal-600/70', label: 'Sailed' };
    case 'transhipment':
      return { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-600/70', label: 'Transhipment' };
    case 'discharged':
      return { bg: 'bg-amber-900/40', text: 'text-amber-200', border: 'border-amber-600/60', label: 'Discharged' };
    case 'delivered':
      return { bg: 'bg-emerald-900/40', text: 'text-emerald-200', border: 'border-emerald-600/60', label: 'Delivered' };
    case 'delayed':
      return { bg: 'bg-red-950/60', text: 'text-red-300', border: 'border-red-700/70', label: 'Delayed' };
    case 'cancelled':
      return { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-800', label: 'Cancelled' };
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: status };
  }
}
