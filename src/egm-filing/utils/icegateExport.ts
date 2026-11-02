import { EgmFiling, EgmConsignmentDetail } from '../types';
import { MOCK_EGM_CONSIGNMENTS } from '../data/mockEgmData';

/**
 * Standard ICEGATE CSV Header definition for Indian Customs Export General Manifest (EGM)
 */
export const ICEGATE_CSV_HEADERS = [
  'MESSAGE_TYPE',
  'CUSTOMS_HOUSE_CODE',
  'EGM_NO',
  'EGM_DATE',
  'IMO_CODE',
  'VESSEL_NAME',
  'VOYAGE_NO',
  'LINE_NO',
  'SUB_LINE_NO',
  'HBL_NO',
  'HBL_DATE',
  'CONTAINER_NO',
  'SEAL_NO',
  'PKG_COUNT',
  'GROSS_WT_KG',
  'COMMODITY',
  'POL',
  'POD'
].join(',');

/**
 * Generates the official ICEGATE flat file CSV content from an EgmFiling
 */
export function generateIcegateCsvContent(
  filing: EgmFiling,
  customConsignments?: Record<string, EgmConsignmentDetail>
): string {
  const consignmentsDb = customConsignments || MOCK_EGM_CONSIGNMENTS;

  const rows = filing.hblList.map((hblNo, idx) => {
    const consignment = consignmentsDb[hblNo];
    const customsHouseCode = consignment?.customsHouseCode || (filing.pol.includes('Mundra') ? 'INMUN1' : 'INNSA1');
    const imoCode = '9234120'; // Standard IMO reference or dynamic
    const lineNo = idx + 1;
    const subLineNo = 1;
    const hblDate = consignment?.hblDate || filing.sailedDate;
    const containerNo = consignment?.containers?.[0]?.containerNumber || `FCIU${2316380 + idx}`;
    const sealNo = consignment?.containers?.[0]?.sealNumber || `SEAL${1132930 + idx}`;
    const pkgCount = consignment?.packageCountAndType || '1 LOT';
    const grossWt = consignment?.grossWeightKg || Math.round(filing.totalGrossWtKg / Math.max(1, filing.hblList.length));
    const commodity = (consignment?.cargoDescription || 'GENERAL MERCHANDISE EXPORT').replace(/"/g, '""').slice(0, 40);
    const polCode = filing.pol.split('(')[1]?.replace(')', '') || 'INMUN';
    const podCode = filing.pod.split('(')[1]?.replace(')', '') || 'AEJEA';

    return [
      'FGM',
      customsHouseCode,
      filing.iemNumber || 'PENDING',
      filing.sailedDate,
      imoCode,
      `"${filing.vesselName.replace(/"/g, '""')}"`,
      filing.voyageNumber,
      lineNo,
      subLineNo,
      hblNo,
      hblDate,
      containerNo,
      sealNo,
      `"${pkgCount}"`,
      grossWt,
      `"${commodity}"`,
      polCode,
      podCode
    ].join(',');
  });

  return `${ICEGATE_CSV_HEADERS}\n${rows.join('\n')}`;
}

/**
 * Triggers a browser download of the generated ICEGATE CSV flat file
 */
export function downloadIcegateCsv(
  filing: EgmFiling,
  customConsignments?: Record<string, EgmConsignmentDetail>
): string {
  const content = generateIcegateCsvContent(filing, customConsignments);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedVessel = filing.vesselName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ICEGATE_EGM_${sanitizedVessel}_${filing.voyageNumber}.csv`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

/**
 * Calculate 7-day statutory deadline and urgency
 * Indian Customs Act 1962 mandates EGM filing within 7 calendar days of sailing.
 */
export function calculateDeadlineInfo(sailedDateStr: string): {
  deadlineStr: string;
  hoursRemaining: number;
  isUrgent: boolean;
  urgencyLevel: 'ok' | 'warning' | 'critical' | 'overdue';
} {
  // expects DD-MM-YYYY
  const parts = sailedDateStr.split('-');
  let sailedTime = Date.now();
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) {
      sailedTime = dateObj.getTime();
    }
  }

  const deadlineMs = sailedTime + 7 * 24 * 60 * 60 * 1000;
  const deadlineDate = new Date(deadlineMs);
  const deadlineStr = `${String(deadlineDate.getDate()).padStart(2, '0')}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${deadlineDate.getFullYear()}`;

  const diffMs = deadlineMs - Date.now();
  const hoursRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

  let urgencyLevel: 'ok' | 'warning' | 'critical' | 'overdue' = 'ok';
  if (diffMs <= 0) {
    urgencyLevel = 'overdue';
  } else if (hoursRemaining <= 24) {
    urgencyLevel = 'critical';
  } else if (hoursRemaining <= 72) {
    urgencyLevel = 'warning';
  }

  return {
    deadlineStr,
    hoursRemaining,
    isUrgent: hoursRemaining <= 48,
    urgencyLevel
  };
}

/**
 * Validates filing completeness prior to lodgment
 */
export function validateFilingCompleteness(
  filing: EgmFiling,
  consignmentsDb: Record<string, EgmConsignmentDetail> = MOCK_EGM_CONSIGNMENTS
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!filing.vesselName || !filing.voyageNumber) {
    issues.push('Missing vessel or voyage identification');
  }
  if (!filing.hblList || filing.hblList.length === 0) {
    issues.push('No House Bills of Lading attached to manifest');
  }
  if (filing.totalGrossWtKg <= 0) {
    issues.push('Manifest gross cargo weight must be greater than zero');
  }

  for (const hblNo of filing.hblList) {
    const consignment = consignmentsDb[hblNo];
    if (consignment) {
      if (!consignment.containers || consignment.containers.length === 0) {
        issues.push(`HBL ${hblNo}: Missing container assignment`);
      } else {
        consignment.containers.forEach(c => {
          if (!c.containerNumber || c.containerNumber.length < 10) {
            issues.push(`HBL ${hblNo}: Invalid container number ${c.containerNumber || '(blank)'}`);
          }
          if (!c.sealNumber) {
            issues.push(`HBL ${hblNo}: Missing customs seal number for container ${c.containerNumber}`);
          }
        });
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
