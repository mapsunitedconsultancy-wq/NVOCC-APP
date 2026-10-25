import { AlertHistoryItem } from './types';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  thresholdHours: number;
  triggerEvent: string;
  templateBody: string;
  variables: string[];
}

export const WHATSAPP_ALERT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-72h-warning',
    name: '72 Hours Before Free Time Expiry',
    thresholdHours: 72,
    triggerEvent: 'Free Time <= 72h',
    variables: ['SHIPPER_NAME', 'CONTAINER#', 'CFS_NAME', 'EXPIRY_DATE', 'CURRENT_CFS_COST', 'DEMURRAGE_RATE', 'TRACKING_LINK'],
    templateBody: `Dear {{SHIPPER_NAME}},

Your container {{CONTAINER#}} at {{CFS_NAME}} has 72 hours of free time remaining.

Please arrange for pickup / delivery by {{EXPIRY_DATE}} to avoid demurrage charges.

Current CFS charges: ₹{{CURRENT_CFS_COST}}
Demurrage if delayed: ₹{{DEMURRAGE_RATE}}/day

Track live: {{TRACKING_LINK}}

MAPS Freight Solutions`
  },
  {
    id: 'tpl-48h-urgent',
    name: '48 Hours Before (Urgent)',
    thresholdHours: 48,
    triggerEvent: 'Free Time <= 48h',
    variables: ['CONTAINER#', 'CFS_NAME', 'EXPIRY_DATE', 'DEMURRAGE_RATE', 'TRACKING_LINK'],
    templateBody: `🟡 URGENT: Container {{CONTAINER#}}

Only 48 hours left before demurrage starts.

Container at: {{CFS_NAME}}
Free time ends: {{EXPIRY_DATE}}
Potential demurrage: ₹{{DEMURRAGE_RATE}} per day

Please take action immediately.

Track: {{TRACKING_LINK}}

MAPS Freight Solutions`
  },
  {
    id: 'tpl-24h-final',
    name: '24 Hours Before (Final Reminder)',
    thresholdHours: 24,
    triggerEvent: 'Free Time <= 24h',
    variables: ['CONTAINER#', 'CFS_NAME', 'DEMURRAGE_RATE', 'CONTACT_PHONE'],
    templateBody: `🔴 FINAL REMINDER: Container {{CONTAINER#}}

24 hours until demurrage starts.

Container at: {{CFS_NAME}}
Daily cost if not cleared: ₹{{DEMURRAGE_RATE}}

Contact us immediately to arrange delivery:
WhatsApp: {{CONTACT_PHONE}}

MAPS Team`
  },
  {
    id: 'tpl-overdue-demurrage',
    name: 'Overdue (Demurrage Active)',
    thresholdHours: 0,
    triggerEvent: 'Demurrage Accruing Daily',
    variables: ['CONTAINER#', 'DAILY_RATE', 'DAYS_OVERDUE', 'TOTAL_ACCRUED', 'CONTACT_PHONE'],
    templateBody: `⚫ DEMURRAGE ACTIVE: Container {{CONTAINER#}}

Free time has expired. Demurrage is accruing.

Daily cost: ₹{{DAILY_RATE}}
Days overdue: {{DAYS_OVERDUE}}
Total accrued: ₹{{TOTAL_ACCRUED}}

Immediate action required.
Call: {{CONTACT_PHONE}}

MAPS Freight Solutions`
  }
];

export function fillWhatsAppTemplate(templateId: string, params: Record<string, string>): string {
  const tpl = WHATSAPP_ALERT_TEMPLATES.find(t => t.id === templateId) || WHATSAPP_ALERT_TEMPLATES[0];
  let text = tpl.templateBody;
  for (const [key, val] of Object.entries(params)) {
    text = text.replace(new RegExp(`{{${key}}}`, 'g'), val);
    text = text.replace(new RegExp(`\\[${key}\\]`, 'g'), val);
  }
  return text;
}

// Generate 50+ realistic alerts across the past 7 days
export const MOCK_ALERT_HISTORY: AlertHistoryItem[] = [
  {
    id: 'alt-001',
    type: 'OVERDUE_ALERT',
    timestamp: '2026-10-17 09:15',
    recipient: '+91 98250 11492 (Krishna Ceramics)',
    recipientRole: 'Shipper',
    messagePreview: 'DEMURRAGE ACTIVE: Container MSKU9921045 — 3 days overdue, ₹22,500 accrued',
    status: 'replied'
  },
  {
    id: 'alt-002',
    type: '24H_ALERT',
    timestamp: '2026-10-17 08:30',
    recipient: '+91 94262 88120 (Balaji Exim)',
    recipientRole: 'Shipper',
    messagePreview: 'FINAL REMINDER: Container CSNU8812095 — 12 hours left before demurrage starts',
    status: 'action_taken'
  },
  {
    id: 'alt-003',
    type: '48H_ALERT',
    timestamp: '2026-10-16 16:40',
    recipient: '+91 98791 23450 (Apex Polyplast)',
    recipientRole: 'Shipper',
    messagePreview: 'URGENT: Container HLXU4409123 — 36 hours left at Transworld Terminals',
    status: 'read'
  },
  {
    id: 'alt-004',
    type: '72H_ALERT',
    timestamp: '2026-10-16 11:20',
    recipient: '+91 98251 90812 (Maruti Minerals)',
    recipientRole: 'Shipper',
    messagePreview: 'Container CMAU5521904 at PSA Ameya has 72 hours of free time remaining',
    status: 'read'
  },
  {
    id: 'alt-005',
    type: 'STAGE_UPDATE',
    timestamp: '2026-10-16 10:05',
    recipient: '+91 98250 11492 (Krishna Ceramics)',
    recipientRole: 'Shipper',
    messagePreview: 'Container MSKU2345678 arrived at Mundra Port and discharged to Allcargo CFS',
    status: 'delivered'
  },
  {
    id: 'alt-006',
    type: 'GATE_OUT',
    timestamp: '2026-10-15 17:15',
    recipient: '+91 94262 88120 (Balaji Exim)',
    recipientRole: 'CHA',
    messagePreview: 'Gate Out completed: Container MEDU6612093 dispatched on Trailer GJ-12-AZ-4412',
    status: 'action_taken'
  },
  {
    id: 'alt-007',
    type: '72H_ALERT',
    timestamp: '2026-10-15 14:10',
    recipient: '+91 98980 54120 (Sun Agro Corp)',
    recipientRole: 'Shipper',
    messagePreview: 'Container MRKU3198021 at Saurashtra Freight — 72 hours free time reminder',
    status: 'delivered'
  },
  {
    id: 'alt-008',
    type: '24H_ALERT',
    timestamp: '2026-10-15 09:30',
    recipient: '+91 98250 77124 (Dev Salt Industries)',
    recipientRole: 'Shipper',
    messagePreview: 'FINAL REMINDER: Container ONEU6712349 at Fairdeal CFS Kandla — 24 hours remaining',
    status: 'replied'
  },
  {
    id: 'alt-009',
    type: 'OVERDUE_ALERT',
    timestamp: '2026-10-14 18:00',
    recipient: '+91 98250 11492 (Krishna Ceramics)',
    recipientRole: 'Shipper',
    messagePreview: 'DEMURRAGE ACTIVE: Container MSKU9921045 — Day 2 overdue notification',
    status: 'read'
  },
  {
    id: 'alt-010',
    type: '48H_ALERT',
    timestamp: '2026-10-14 11:45',
    recipient: '+91 94262 88120 (Balaji Exim)',
    recipientRole: 'Shipper',
    messagePreview: 'URGENT: Container CSNU8812095 at Hind Terminals 1 — 48 hours remaining',
    status: 'read'
  },
  // Additional batch representing realistic distribution:
  ...Array.from({ length: 42 }).map((_, i) => {
    const types: AlertHistoryItem['type'][] = ['72H_ALERT', '48H_ALERT', '24H_ALERT', 'OVERDUE_ALERT', 'STAGE_UPDATE', 'GATE_OUT'];
    const chosenType = types[i % types.length];
    const statuses: AlertHistoryItem['status'][] = ['action_taken', 'replied', 'read', 'delivered', 'sent'];
    const chosenStatus = statuses[i % statuses.length];
    const day = 10 + Math.floor(i / 7);
    const hour = 9 + (i % 9);
    const minute = (i * 13) % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      id: `alt-${(i + 11).toString().padStart(3, '0')}`,
      type: chosenType,
      timestamp: `2026-10-${pad(day)} ${pad(hour)}:${pad(minute)}`,
      recipient: `+91 9825${i % 10} ${(20000 + i * 143).toString().slice(0, 5)} (Customer Account #${(i % 8) + 1})`,
      recipientRole: (i % 3 === 0 ? 'Shipper' : i % 3 === 1 ? 'CHA' : 'Consignee') as any,
      messagePreview: chosenType === '72H_ALERT'
        ? `Container MSKU${2340000 + i} at Allcargo CFS: 72 hours free time remaining`
        : chosenType === '48H_ALERT'
        ? `URGENT: Container MEDU${5000000 + i} has 48 hours left before demurrage starts`
        : chosenType === '24H_ALERT'
        ? `FINAL REMINDER: Container CMAU${3000000 + i} expires in 24 hours`
        : chosenType === 'OVERDUE_ALERT'
        ? `DEMURRAGE ACTIVE: Box HLXU${4000000 + i} accrual alert sent to operations`
        : `Lifecycle milestone reached: Stage update recorded for container`,
      status: chosenStatus
    };
  })
];
