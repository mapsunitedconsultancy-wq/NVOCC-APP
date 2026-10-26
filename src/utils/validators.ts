/**
 * @license
 * MAPS NVOCC Pro — Industrial Input Format Validators & Checksum Verification
 * Implements exact validation rules, regex patterns, and check digit algorithms
 * according to the Testing Pack specification.
 */

// 1. GSTIN (15 chars: 2 state + 10 PAN + 1 entity + Z + 1 check digit)
// Pattern: \d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]
export function calculateGSTINCheckDigit(first14Chars: string): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const cp = chars.indexOf(first14Chars[i]);
    if (cp === -1) return '';
    const factor = (i % 2 === 0) ? 1 : 2;
    const prod = cp * factor;
    const quotient = Math.floor(prod / 36);
    const remainder = prod % 36;
    sum += quotient + remainder;
  }
  const rem = sum % 36;
  const check = (36 - rem) % 36;
  return chars[check];
}

export function validateGSTIN(gstin: string): {
  isValid: boolean;
  message: string;
  expectedCheckDigit?: string;
  stateCode?: string;
  pan?: string;
} {
  const clean = gstin.trim().toUpperCase();
  if (!clean) {
    return { isValid: false, message: 'GSTIN is required' };
  }
  if (clean.length !== 15) {
    return { isValid: false, message: `GSTIN must be exactly 15 characters (currently ${clean.length})` };
  }

  const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
  if (!regex.test(clean)) {
    return {
      isValid: false,
      message: 'Invalid GSTIN format. Expected: 2 state digits + 10 PAN chars + 1 entity + Z + 1 check digit (e.g. 24AAKCK4521P1Z7)'
    };
  }

  const first14 = clean.substring(0, 14);
  const actualCheck = clean[14];
  const expectedCheck = calculateGSTINCheckDigit(first14);

  if (actualCheck !== expectedCheck) {
    return {
      isValid: false,
      expectedCheckDigit: expectedCheck,
      stateCode: clean.substring(0, 2),
      pan: clean.substring(2, 12),
      message: `Invalid GSTIN checksum! 15th check digit '${actualCheck}' is incorrect (Expected: '${expectedCheck}')`
    };
  }

  return {
    isValid: true,
    message: 'Valid Indian GSTIN with verified checksum',
    stateCode: clean.substring(0, 2),
    pan: clean.substring(2, 12)
  };
}

// 2. PAN (5 letters + 4 digits + 1 letter; 4th char = entity type)
// Pattern: [A-Z]{5}\d{4}[A-Z]
export function validatePAN(pan: string): { isValid: boolean; message: string; entityType?: string } {
  const clean = pan.trim().toUpperCase();
  const regex = /^[A-Z]{5}\d{4}[A-Z]$/;
  if (!clean) return { isValid: false, message: 'PAN is required' };
  if (!regex.test(clean)) {
    return { isValid: false, message: 'PAN must be 5 letters + 4 digits + 1 letter (e.g. AAKCK4521P)' };
  }
  const entityChar = clean[3];
  const entityMap: Record<string, string> = {
    C: 'Company',
    P: 'Individual / Proprietor',
    H: 'HUF',
    F: 'Partnership Firm / LLP',
    A: 'AOP',
    T: 'Trust',
    B: 'BOI',
    L: 'Local Authority',
    J: 'Artificial Juridical Person',
    G: 'Government Agency'
  };
  return {
    isValid: true,
    message: `Valid PAN (${entityMap[entityChar] || 'Entity'})`,
    entityType: entityMap[entityChar]
  };
}

// 3. IEC (Post-2021 = PAN of firm (10 char); legacy = 10 digits)
// Pattern: [A-Z]{5}\d{4}[A-Z]|\d{10}
export function validateIEC(iec: string): { isValid: boolean; message: string } {
  const clean = iec.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
  const legacyRegex = /^\d{10}$/;
  if (!clean) return { isValid: false, message: 'IEC code is required' };
  if (panRegex.test(clean) || legacyRegex.test(clean)) {
    return { isValid: true, message: 'Valid DGFT IEC Code' };
  }
  return { isValid: false, message: 'IEC must be 10 characters (either PAN of the firm or 10-digit legacy code)' };
}

// 4. ISO 6346 Container Number Validation
// 4 letters (first 3 owner, 4th equipment category 'U', 'J', 'Z') + 6 digits serial + 1 check digit
export function validateISO6346(containerNo: string): {
  isValid: boolean;
  expectedCheckDigit?: number;
  message: string;
  ownerCode?: string;
  equipmentCategory?: string;
  serialNumber?: string;
  checkDigit?: number;
} {
  const clean = containerNo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 11) {
    return { isValid: false, message: `Container No. must be exactly 11 characters (e.g. MSKU2345619, currently ${clean.length})` };
  }

  const ownerCode = clean.slice(0, 3);
  const equipmentCategory = clean[3];
  const serialNumber = clean.slice(4, 10);
  const actualCheck = parseInt(clean[10], 10);

  if (!['U', 'J', 'Z', 'R'].includes(equipmentCategory)) {
    return {
      isValid: false,
      message: `Invalid ISO 6346 category code '${equipmentCategory}'. 4th character must be 'U' (freight container), 'J' (detachable equipment), or 'Z' (trailer/chassis).`,
      ownerCode,
      equipmentCategory,
      serialNumber,
      checkDigit: actualCheck
    };
  }

  const charValues: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
    K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
    U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
  };

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = clean[i];
    let val = 0;
    if (char >= '0' && char <= '9') {
      val = parseInt(char, 10);
    } else if (charValues[char]) {
      val = charValues[char];
    } else {
      return {
        isValid: false,
        message: 'Invalid characters in container number',
        ownerCode,
        equipmentCategory,
        serialNumber,
        checkDigit: actualCheck
      };
    }
    sum += val * Math.pow(2, i);
  }

  let calculatedCheck = sum % 11;
  if (calculatedCheck === 10) calculatedCheck = 0;

  if (calculatedCheck === actualCheck) {
    return {
      isValid: true,
      message: 'Valid ISO 6346 Container Number',
      ownerCode,
      equipmentCategory,
      serialNumber,
      checkDigit: actualCheck
    };
  } else {
    return {
      isValid: false,
      expectedCheckDigit: calculatedCheck,
      message: `Check digit mismatch! Expected '${calculatedCheck}', found '${actualCheck}'. (e.g. valid: ${clean.slice(0, 10)}${calculatedCheck})`,
      ownerCode,
      equipmentCategory,
      serialNumber,
      checkDigit: actualCheck
    };
  }
}

// 5. Seal No. (Alphanumeric, 6–15 chars)
// Pattern: [A-Z0-9]{6,15}
export function validateSealNo(sealNo: string): { isValid: boolean; message: string } {
  const clean = sealNo.trim().toUpperCase();
  const regex = /^[A-Z0-9]{6,15}$/;
  if (!clean) return { isValid: false, message: 'Seal number is required' };
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Seal number must be 6 to 15 alphanumeric characters (e.g. KL789412)' };
  }
  return { isValid: true, message: 'Valid container seal number' };
}

// 6. HS Code (ITC-HS: exactly 8 digits)
// Pattern: \d{8}
export function validateHSCode(hsCode: string): { isValid: boolean; message: string } {
  const clean = hsCode.trim().replace(/\D/g, '');
  if (clean.length !== 8) {
    return { isValid: false, message: `HS Code must be exactly 8 digits (ITC-HS format, e.g. 69089090, currently ${clean.length})` };
  }
  return { isValid: true, message: 'Valid 8-digit ITC-HS Code' };
}

// 7. SAC Code (6 digits)
// Pattern: \d{6}
export function validateSACCode(sac: string): { isValid: boolean; message: string } {
  const clean = sac.trim().replace(/\D/g, '');
  if (clean.length !== 6) {
    return { isValid: false, message: 'SAC Code must be exactly 6 digits (e.g. 996521)' };
  }
  return { isValid: true, message: 'Valid 6-digit SAC Code' };
}

// 8. Port (UN/LOCODE: 2 country + 3 location)
// Pattern: [A-Z]{2}[A-Z0-9]{3}
export function validateUNLOCODE(code: string): { isValid: boolean; message: string } {
  const clean = code.trim().toUpperCase();
  const regex = /^[A-Z]{2}[A-Z0-9]{3}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Port must be a 5-character UN/LOCODE (e.g. INMUN, DEHAM)' };
  }
  return { isValid: true, message: 'Valid UN/LOCODE' };
}

// 9. IFSC (4 bank + 0 + 6 branch)
// Pattern: [A-Z]{4}0[A-Z0-9]{6}
export function validateIFSC(ifsc: string): { isValid: boolean; message: string } {
  const clean = ifsc.trim().toUpperCase();
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'IFSC must be 4 bank letters + 0 + 6 branch alphanumeric (e.g. HDFC0001234)' };
  }
  return { isValid: true, message: 'Valid Bank IFSC Code' };
}

// 10. Phone (IN: +91 then 10 digits starting 6–9)
// Pattern: \+91[6-9]\d{9}
export function validatePhoneIN(phone: string): { isValid: boolean; message: string } {
  const clean = phone.trim().replace(/[\s-]/g, '');
  const regex = /^\+91[6-9]\d{9}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Indian phone number must be in format +91XXXXXXXXXX starting with 6-9 (e.g. +919825012345)' };
  }
  return { isValid: true, message: 'Valid Indian phone number' };
}

// 11. Email (RFC 5322 basic)
// Pattern: [^@\s]+@[^@\s]+\.[^@\s]+
export function validateEmail(email: string): { isValid: boolean; message: string } {
  const clean = email.trim();
  const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Invalid email address format (e.g. export@krishnaceramics.in)' };
  }
  return { isValid: true, message: 'Valid email address' };
}

// 12. Vessel IMO (IMO + 7 digits)
// Pattern: IMO\d{7}
export function validateVesselIMO(imo: string): { isValid: boolean; message: string } {
  const clean = imo.trim().toUpperCase();
  const regex = /^IMO\d{7}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Vessel IMO must be in format IMO followed by 7 digits (e.g. IMO9632179)' };
  }
  return { isValid: true, message: 'Valid Vessel IMO Number' };
}

// 13. Voyage No. (Alphanumeric 2–8 chars)
// Pattern: [A-Z0-9]{2,8}
export function validateVoyageNo(voy: string): { isValid: boolean; message: string } {
  const clean = voy.trim().toUpperCase();
  const regex = /^[A-Z0-9]{2,8}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Voyage number must be 2 to 8 alphanumeric characters (e.g. 437W)' };
  }
  return { isValid: true, message: 'Valid Voyage Number' };
}

// 14. UN Number (DG: UN + 4 digits)
// Pattern: UN\d{4}
export function validateUNNumber(un: string): { isValid: boolean; message: string } {
  const clean = un.trim().toUpperCase();
  const regex = /^UN\d{4}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'UN number must be in format UN followed by 4 digits (e.g. UN1263, UN1230, UN1830)' };
  }
  return { isValid: true, message: 'Valid UN Dangerous Goods Number' };
}

// 15. IMDG Class (1–9 with optional sub-division)
// Pattern: [1-9](\.\d)?
export function validateIMDGClass(cls: string): { isValid: boolean; message: string } {
  const clean = cls.trim();
  const regex = /^[1-9](\.\d)?(\s*\([0-9.]+\))?$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'IMDG Class must be between 1 and 9 (e.g. 3, 6.1, 8)' };
  }
  return { isValid: true, message: 'Valid IMDG Hazard Class' };
}

// 16. Container Type
export const VALID_CONTAINER_TYPES = ['20GP', '40GP', '40HC', '45HC', '20RF', '40RF', '20OT', '40FR'] as const;
export function validateContainerType(type: string): { isValid: boolean; message: string } {
  const clean = type.trim().toUpperCase().replace(/['\s]/g, '');
  if (!VALID_CONTAINER_TYPES.includes(clean as any)) {
    return { isValid: false, message: `Container type must be one of: ${VALID_CONTAINER_TYPES.join(', ')} (e.g. 40HC)` };
  }
  return { isValid: true, message: 'Valid ISO Container Type' };
}

// 17. Weight / VGM (Numeric, > tare weight in kg)
export function validateVGM(
  grossOrVgmKg: number,
  tareKg: number = 3880
): { isValid: boolean; message: string } {
  if (isNaN(grossOrVgmKg) || grossOrVgmKg <= 0) {
    return { isValid: false, message: 'VGM weight must be a positive numeric value in kg' };
  }
  if (grossOrVgmKg <= tareKg) {
    return {
      isValid: false,
      message: `VGM weight (${grossOrVgmKg.toLocaleString()} kg) must be strictly greater than container tare weight (${tareKg.toLocaleString()} kg)!`
    };
  }
  return { isValid: true, message: 'Verified Gross Mass (VGM) exceeds tare weight' };
}

// 18. Volume (CBM)
export function validateCBM(cbm: number, maxCbm: number = 76.4): { isValid: boolean; message: string } {
  if (isNaN(cbm) || cbm <= 0) {
    return { isValid: false, message: 'Volume must be a positive number in cubic meters (m³)' };
  }
  if (cbm > maxCbm * 1.05) {
    return { isValid: false, message: `Volume (${cbm.toFixed(2)} CBM) exceeds maximum container cube capacity (${maxCbm} CBM)!` };
  }
  return { isValid: true, message: 'Valid cargo volume' };
}

// 19. Currency (ISO 4217 3-letter)
export function validateCurrency(curr: string): { isValid: boolean; message: string } {
  const clean = curr.trim().toUpperCase();
  const regex = /^[A-Z]{3}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Currency must be a 3-letter ISO 4217 code (e.g. USD, INR, EUR, AED)' };
  }
  return { isValid: true, message: 'Valid Currency Code' };
}

// 20. Date format (Store ISO 8601 YYYY-MM-DD; display DD-MM-YYYY)
export function formatDateToDisplay(isoDateString: string): string {
  if (!isoDateString) return '';
  const clean = isoDateString.trim();
  // If already DD-MM-YYYY or DD MMM YYYY, return or normalize
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }
  return clean;
}

export function formatDateToISO(displayDate: string): string {
  if (!displayDate) return '';
  const clean = displayDate.trim();
  const dmyMatch = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  return clean;
}

// Aliases and numeric helpers
export const validatePortCode = validateUNLOCODE;
export const validateCurrencyCode = validateCurrency;
export function validateAmount(val: number | string): { isValid: boolean; message: string } {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) {
    return { isValid: false, message: 'Amount must be a positive number' };
  }
  return { isValid: true, message: 'Valid positive amount' };
}

