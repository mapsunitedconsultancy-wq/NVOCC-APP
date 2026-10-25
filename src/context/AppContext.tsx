import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Shipment,
  HBL,
  MBL,
  Invoice,
  Party,
  CarrierRate,
  Quotation,
  AgentTransaction,
  DocumentItem,
  AuditLogItem,
  CommunicationMessage,
  DeliveryOrderItem,
  SpecialRateRequest,
  ExportManifest,
  TimelineEvent
} from '../types';
import {
  EgmFiling,
  IgmRecord,
  ShippingInstruction,
  SalesQuotation,
  ChaJob,
  TruckingTrip,
  DangerousGoodsItem,
  ApprovalRule,
  ApprovalRequest,
  LetterOfCredit,
  MarineInsurancePolicy,
  AdvanceFiling,
  BlTemplate,
  ContainerRepositioningJob,
  EirRecord
} from '../types/v4Types';
import {
  MOCK_EGM_FILINGS,
  MOCK_IGM_RECORDS,
  MOCK_SHIPPING_INSTRUCTIONS,
  MOCK_SALES_QUOTATIONS,
  MOCK_CHA_JOBS,
  MOCK_TRUCKING_TRIPS,
  MOCK_DG_SHIPMENTS,
  MOCK_APPROVAL_RULES,
  MOCK_APPROVAL_REQUESTS,
  MOCK_LC_RECORDS,
  MOCK_MARINE_POLICIES,
  MOCK_ADVANCE_FILINGS,
  MOCK_BL_TEMPLATES,
  MOCK_REPOSITIONING_JOBS,
  MOCK_EIR_RECORDS
} from '../data/v4DemoData';
import {
  MOCK_DELIVERY_ORDERS,
  MOCK_SRRS,
  MOCK_EXPORT_MANIFESTS
} from '../data/ebmsData';
import {
  ManagedContainer,
  LifecycleStage,
  ContainerControlInvoice,
  CustomerLedger,
  MOCK_MANAGED_CONTAINERS,
  MOCK_CONTAINER_CONTROL_INVOICES,
  MOCK_CUSTOMER_LEDGERS,
  fillWhatsAppTemplate,
  WHATSAPP_ALERT_TEMPLATES
} from '../data/container-control';
import {
  FIRM_DETAILS,
  MOCK_USERS,
  MOCK_PARTIES,
  MOCK_SHIPMENTS,
  MOCK_HBLS,
  MOCK_MBLS,
  MOCK_INVOICES,
  MOCK_CARRIER_RATES,
  MOCK_AGENT_TRANSACTIONS,
  MOCK_DOCUMENTS,
  MOCK_QUOTATIONS,
  MOCK_COMMUNICATIONS,
  MOCK_AUDIT_LOGS
} from '../data/mockData';

import {
  executeShipmentCreationChain,
  executeHblIssueChain,
  executeInvoiceCreationFromShipment,
  executePaymentReceivedChain,
  executeVesselDelayChain,
  AutomationResult
} from '../utils/automationChains';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface AppContextType {
  firmDetails: typeof FIRM_DETAILS;
  currentUser: User;
  updateCurrentUser: (updates: Partial<User>) => void;
  switchUserRole: (role: UserRole) => void;
  users: User[];

  // Automation & Interconnection Chains
  createInvoiceFromShipment: (shipmentId: string) => Invoice | null;
  issueHbl: (hblId: string) => void;
  reportVesselDelay: (vesselName: string, delayDays: number, revisedEta: string) => void;
  automationHistory: AutomationResult[];

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Global Universal Search
  universalSearch: string;
  setUniversalSearch: (query: string) => void;

  // Active View / Route
  activeView: string;
  setActiveView: (view: string) => void;
  viewParam?: string;
  setViewParam: (param?: string) => void;

  // Data & Mutators
  shipments: Shipment[];
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  deleteShipment: (id: string) => void;
  togglePinShipment: (id: string) => void;

  hbls: HBL[];
  addHBL: (hbl: HBL) => void;
  updateHBL: (id: string, updates: Partial<HBL>) => void;

  mbls: MBL[];
  addMBL: (mbl: MBL) => void;
  updateMBL: (id: string, updates: Partial<MBL>) => void;
  deleteMBL: (id: string) => void;

  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  recordPayment: (invoiceId: string, amount: number, mode: string, ref: string) => void;

  parties: Party[];
  addParty: (party: Party) => void;
  updateParty: (id: string, updates: Partial<Party>) => void;

  carrierRates: CarrierRate[];
  addCarrierRate: (rate: CarrierRate) => void;

  quotations: Quotation[];
  addQuotation: (quote: Quotation) => void;
  updateQuoteStatus: (id: string, status: Quotation['status']) => void;

  agentTransactions: AgentTransaction[];
  addAgentTransaction: (tx: AgentTransaction) => void;
  reconcileTransaction: (txId: string) => void;

  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;

  communications: CommunicationMessage[];
  sendMessage: (msg: Omit<CommunicationMessage, 'id' | 'timestamp'>) => void;

  auditLogs: AuditLogItem[];
  addAuditLog: (action: string, module: string, entityId: string, details: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  removeToast: (id: string) => void;
  // Print & Modal state
  activePrintDoc: { type: 'HBL' | 'MBL' | 'DO' | 'INVOICE' | 'QUOTE' | 'MANIFEST' | 'STATEMENT' | 'DGD' | 'ARRIVAL_NOTICE' | 'VGM' | 'COVER_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'; data: any } | null;
  setActivePrintDoc: (doc: { type: 'HBL' | 'MBL' | 'DO' | 'INVOICE' | 'QUOTE' | 'MANIFEST' | 'STATEMENT' | 'DGD' | 'ARRIVAL_NOTICE' | 'VGM' | 'COVER_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'; data: any } | null) => void;

  // Delivery Orders, SRRs, Manifests
  deliveryOrders: DeliveryOrderItem[];
  addDeliveryOrder: (doItem: DeliveryOrderItem) => void;
  updateDeliveryOrder: (id: string, updates: Partial<DeliveryOrderItem>) => void;
  srrs: SpecialRateRequest[];
  addSrr: (srr: SpecialRateRequest) => void;
  updateSrr: (id: string, updates: Partial<SpecialRateRequest>) => void;
  exportManifests: ExportManifest[];
  addExportManifest: (manifest: ExportManifest) => void;

  // Container Control & D&D Engine (Module 16)
  managedContainers: ManagedContainer[];
  updateContainerStage: (containerId: string, newStage: LifecycleStage, notes?: string) => void;
  addContainer: (container: Partial<ManagedContainer>) => void;
  sendContainerWhatsAppAlert: (containerId: string, templateId: string, recipientOverride?: string) => void;
  saveCfsChargeToShipment: (shipmentId: string, chargeData: any) => void;
  containerControlInvoices: ContainerControlInvoice[];
  markContainerInvoicePaid: (invoiceId: string) => void;
  customerLedgers: CustomerLedger[];

  // V4 Modules & Engines
  egmFilings: EgmFiling[];
  addEgmFiling: (filing: EgmFiling) => void;
  updateEgmFiling: (id: string, updates: Partial<EgmFiling>) => void;
  fileEgmWithIem: (id: string, iemNumber: string) => void;

  igmRecords: IgmRecord[];
  addIgmRecord: (record: IgmRecord) => void;
  sendIgmArrivalNotices: (igmId: string) => void;

  shippingInstructions: ShippingInstruction[];
  addShippingInstruction: (si: ShippingInstruction) => void;
  convertSiToHblDraft: (siId: string) => string | null;

  salesQuotations: SalesQuotation[];
  addSalesQuotation: (q: SalesQuotation) => void;
  updateSalesQuotation: (id: string, updates: Partial<SalesQuotation>) => void;

  chaJobs: ChaJob[];
  addChaJob: (job: ChaJob) => void;
  updateChaJob: (id: string, updates: Partial<ChaJob>) => void;

  truckingTrips: TruckingTrip[];
  addTruckingTrip: (trip: TruckingTrip) => void;
  updateTruckingTrip: (id: string, updates: Partial<TruckingTrip>) => void;

  dgShipments: DangerousGoodsItem[];
  addDgShipment: (item: DangerousGoodsItem) => void;
  updateDgShipment: (id: string, updates: Partial<DangerousGoodsItem>) => void;

  approvalRequests: ApprovalRequest[];
  createApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  decideApprovalRequest: (id: string, status: 'Approved' | 'Rejected', decisionNotes: string) => void;
  approvalRules: ApprovalRule[];

  lcRecords: LetterOfCredit[];
  addLcRecord: (lc: LetterOfCredit) => void;

  marinePolicies: MarineInsurancePolicy[];
  addMarinePolicy: (p: MarineInsurancePolicy) => void;

  advanceFilings: AdvanceFiling[];
  addAdvanceFiling: (f: AdvanceFiling) => void;

  blTemplates: BlTemplate[];
  addBlTemplate: (t: BlTemplate) => void;

  repositioningJobs: ContainerRepositioningJob[];
  addRepositioningJob: (j: ContainerRepositioningJob) => void;

  eirRecords: EirRecord[];
  addEirRecord: (e: EirRecord) => void;

  density: 'dense' | 'comfortable';
  toggleDensity: () => void;

  rollShipment: (shipmentId: string, reason: string, newVessel: string, newEtd: string, newEta: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('maps_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('maps_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User & RBAC
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('maps_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // fallback
      }
    }
    const savedRole = localStorage.getItem('maps_user_role') as UserRole;
    if (savedRole) {
      const found = MOCK_USERS.find(u => u.role === savedRole);
      if (found) return found;
    }
    return MOCK_USERS[0]; // Aman Dana (Super Admin)
  });

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('maps_current_user', JSON.stringify(updated));
      return updated;
    });
    showToast('success', 'Profile Updated', 'Account settings and preferences saved successfully.');
  };

  const switchUserRole = (role: UserRole) => {
    const match = users.find(u => u.role === role) || users[0];
    setCurrentUser(match);
    localStorage.setItem('maps_user_role', role);
    localStorage.setItem('maps_current_user', JSON.stringify(match));
    showToast('info', `Switched Role to ${match.title}`, `Now logged in as ${match.name} (${role.toUpperCase()})`);
  };

  // Routing State (URL-like inside SPA)
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [universalSearch, setUniversalSearch] = useState<string>('');

  // Domain Datasets with local storage persistence fallback
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const local = localStorage.getItem('maps_shipments');
    return local ? JSON.parse(local) : MOCK_SHIPMENTS;
  });

  const [hbls, setHbls] = useState<HBL[]>(() => {
    const raw = (() => {
      const local = localStorage.getItem('maps_hbls');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          return MOCK_HBLS;
        }
      }
      return MOCK_HBLS;
    })();
    const seen = new Set<string>();
    return (raw || []).filter((item: HBL) => {
      const key = item.id || item.hblNumber;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  const [mbls, setMbls] = useState<MBL[]>(() => {
    const local = localStorage.getItem('maps_mbls');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const seen = new Set<string>();
        return parsed.filter((item: MBL) => {
          const key = item.id || item.mblNumber;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } catch {
        return MOCK_MBLS;
      }
    }
    return MOCK_MBLS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const local = localStorage.getItem('maps_invoices_v3');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const seen = new Set<string>();
        return parsed.filter((item: Invoice) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      } catch {
        return MOCK_INVOICES;
      }
    }
    return MOCK_INVOICES;
  });

  const [parties, setParties] = useState<Party[]>(() => {
    const local = localStorage.getItem('maps_parties');
    return local ? JSON.parse(local) : MOCK_PARTIES;
  });

  const [carrierRates, setCarrierRates] = useState<CarrierRate[]>(() => {
    const local = localStorage.getItem('maps_rates');
    return local ? JSON.parse(local) : MOCK_CARRIER_RATES;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const local = localStorage.getItem('maps_quotes');
    return local ? JSON.parse(local) : MOCK_QUOTATIONS;
  });

  const [agentTransactions, setAgentTransactions] = useState<AgentTransaction[]>(() => {
    const local = localStorage.getItem('maps_agent_tx');
    return local ? JSON.parse(local) : MOCK_AGENT_TRANSACTIONS;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const local = localStorage.getItem('maps_docs');
    return local ? JSON.parse(local) : MOCK_DOCUMENTS;
  });

  const [communications, setCommunications] = useState<CommunicationMessage[]>(() => {
    const local = localStorage.getItem('maps_comms');
    return local ? JSON.parse(local) : MOCK_COMMUNICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const local = localStorage.getItem('maps_audit');
    return local ? JSON.parse(local) : MOCK_AUDIT_LOGS;
  });

  // Container Control State (Module 16)
  const [managedContainers, setManagedContainers] = useState<ManagedContainer[]>(() => {
    const local = localStorage.getItem('maps_managed_containers_v2');
    return local ? JSON.parse(local) : MOCK_MANAGED_CONTAINERS;
  });

  const [containerControlInvoices, setContainerControlInvoices] = useState<ContainerControlInvoice[]>(() => {
    const local = localStorage.getItem('maps_cc_invoices');
    return local ? JSON.parse(local) : MOCK_CONTAINER_CONTROL_INVOICES;
  });

  const [customerLedgers, setCustomerLedgers] = useState<CustomerLedger[]>(MOCK_CUSTOMER_LEDGERS);

  useEffect(() => {
    localStorage.setItem('maps_managed_containers_v2', JSON.stringify(managedContainers));
  }, [managedContainers]);

  useEffect(() => {
    localStorage.setItem('maps_cc_invoices', JSON.stringify(containerControlInvoices));
  }, [containerControlInvoices]);

  // Delivery Orders, SRRs, Export Manifests State
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderItem[]>(() => {
    const local = localStorage.getItem('maps_delivery_orders');
    return local ? JSON.parse(local) : MOCK_DELIVERY_ORDERS;
  });

  const [srrs, setSrrs] = useState<SpecialRateRequest[]>(() => {
    const local = localStorage.getItem('maps_srrs');
    return local ? JSON.parse(local) : MOCK_SRRS;
  });

  const [exportManifests, setExportManifests] = useState<ExportManifest[]>(() => {
    const local = localStorage.getItem('maps_manifests');
    return local ? JSON.parse(local) : MOCK_EXPORT_MANIFESTS;
  });

  useEffect(() => {
    localStorage.setItem('maps_delivery_orders', JSON.stringify(deliveryOrders));
  }, [deliveryOrders]);

  useEffect(() => {
    localStorage.setItem('maps_srrs', JSON.stringify(srrs));
  }, [srrs]);

  useEffect(() => {
    localStorage.setItem('maps_manifests', JSON.stringify(exportManifests));
  }, [exportManifests]);

  const addDeliveryOrder = (doItem: DeliveryOrderItem) => {
    setDeliveryOrders(prev => [doItem, ...prev]);
    addAuditLog('Created DO', 'Delivery Order', doItem.doNumber, `Issued Delivery Order for ${doItem.consigneeName}`);
    showToast('success', `DO ${doItem.doNumber} Issued`, 'Delivery Order ready for CFS release.');
  };

  const updateDeliveryOrder = (id: string, updates: Partial<DeliveryOrderItem>) => {
    setDeliveryOrders(prev => prev.map(d => d.id === id || d.doNumber === id ? { ...d, ...updates } : d));
    showToast('info', `DO Updated`, 'Delivery Order updated.');
  };

  const addSrr = (srr: SpecialRateRequest) => {
    setSrrs(prev => [srr, ...prev]);
    addAuditLog('Created SRR', 'SRR', srr.srrNumber, `Special Rate Request raised by ${srr.requestedBy}`);
    showToast('success', `SRR ${srr.srrNumber} Submitted`, 'Pending Commercial / Admin Approval.');
  };

  const updateSrr = (id: string, updates: Partial<SpecialRateRequest>) => {
    setSrrs(prev => prev.map(s => s.id === id || s.srrNumber === id ? { ...s, ...updates } : s));
    showToast('info', `SRR Updated`, 'Rate request status updated.');
  };

  const addExportManifest = (manifest: ExportManifest) => {
    setExportManifests(prev => [manifest, ...prev]);
    addAuditLog('Created Manifest', 'Export Manifest', manifest.manifestNumber, `Vessel manifest generated for ${manifest.vesselName}`);
    showToast('success', `Manifest ${manifest.manifestNumber} Generated`, 'Ready for APSEZ/Customs lodging.');
  };

  const updateContainerStage = (containerId: string, newStage: LifecycleStage, notes?: string) => {
    setManagedContainers(prev =>
      prev.map(c => {
        if (c.id === containerId || c.containerNumber === containerId) {
          const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
          const updatedHistory = [
            ...c.stageHistory,
            {
              stage: newStage,
              timestamp: nowStr,
              location: c.cfsName,
              updatedBy: currentUser.name,
              notes
            }
          ];

          const isFinished = newStage === 'DELIVERED' || newStage === 'EMPTY RETURNED' || newStage === 'BILLED';
          const newRisk = isFinished ? 'Safe' : c.riskLevel;

          return {
            ...c,
            currentStage: newStage,
            stageHistory: updatedHistory,
            daysAtStage: 0,
            riskLevel: newRisk,
            notes: notes || c.notes
          };
        }
        return c;
      })
    );

    addAuditLog('UPDATE_STAGE', 'Container Control', containerId, `Stage updated to ${newStage} by ${currentUser.name}`);
    showToast('success', 'Stage Updated', `Container status progressed to ${newStage}.`);
  };

  const addContainer = (containerData: Partial<ManagedContainer>) => {
    const newId = `cntr-manual-${Date.now()}`;
    const newCntr: ManagedContainer = {
      id: newId,
      containerNumber: containerData.containerNumber || 'MSKU9999999',
      shipmentId: containerData.shipmentId || 'MAPS-MANUAL',
      shipperName: containerData.shipperName || 'Direct Shipper',
      consigneeName: containerData.consigneeName || 'Direct Consignee',
      carrierName: containerData.carrierName || 'Maersk Line',
      carrierScac: containerData.carrierScac || 'MSKU',
      equipmentType: containerData.equipmentType || "40'HC",
      cargoType: containerData.cargoType || 'General Cargo',
      sealNumber: containerData.sealNumber || `SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
      direction: containerData.direction || 'Import',
      currentStage: containerData.currentStage || 'AT CFS',
      stageHistory: [
        {
          stage: containerData.currentStage || 'AT CFS',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          location: containerData.cfsName || 'Allcargo Logistics CFS, Mundra',
          updatedBy: currentUser.name
        }
      ],
      daysAtStage: 1,
      freeTimeDays: containerData.freeTimeDays || 7,
      freeTimeStart: new Date().toISOString().slice(0, 16).replace('T', ' '),
      freeTimeEnd: new Date(Date.now() + (containerData.freeTimeDays || 7) * 86400000).toISOString().slice(0, 16).replace('T', ' '),
      freeTimeHoursRemaining: (containerData.freeTimeDays || 7) * 24,
      riskLevel: 'Safe',
      demurragePerDayINR: 7515,
      detentionPerDayINR: 4175,
      totalDemurrageAccruedINR: 0,
      cfsName: containerData.cfsName || 'Allcargo Logistics CFS, Mundra',
      cfsLocation: containerData.cfsLocation || 'Mundra Port, SEZ Zone',
      cfsEntryDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      cfsDays: 1,
      cfsChargesAccruedINR: 11200,
      cfsChargesBreakdown: { groundRent: 300, handling: 5500, documentation: 850, forklift: 2400, weighment: 550, specialSurcharges: 0, subtotal: 9600, gst18: 1728, total: 11328 },
      publicTrackingToken: `cct-${containerData.containerNumber}-${Date.now()}`,
      qrCodeUrl: `https://mapsnvocc.in/ccontrol/${containerData.containerNumber}`,
      alertsSent: [],
      grossWeightKg: containerData.grossWeightKg || 25000,
      vgmWeightKg: containerData.vgmWeightKg || 25000,
      ...containerData
    };

    setManagedContainers(prev => [newCntr, ...prev]);
    addAuditLog('REGISTER_CONTAINER', 'Container Control', newCntr.containerNumber, `Registered container ${newCntr.containerNumber}`);
    showToast('success', 'Container Registered', `${newCntr.containerNumber} is now tracked in Container Control.`);
  };

  const sendContainerWhatsAppAlert = (containerId: string, templateId: string, recipientOverride?: string) => {
    const c = managedContainers.find(item => item.id === containerId || item.containerNumber === containerId);
    if (!c) return;

    const recipient = recipientOverride || '+91 98250 11492';
    const messagePreview = fillWhatsAppTemplate(templateId, {
      SHIPPER_NAME: c.shipperName,
      'CONTAINER#': c.containerNumber,
      CFS_NAME: c.cfsName,
      EXPIRY_DATE: c.freeTimeEnd,
      CURRENT_CFS_COST: c.cfsChargesAccruedINR.toLocaleString('en-IN'),
      DEMURRAGE_RATE: c.demurragePerDayINR.toLocaleString('en-IN'),
      DAILY_RATE: c.demurragePerDayINR.toLocaleString('en-IN'),
      DAYS_OVERDUE: '3',
      TOTAL_ACCRUED: c.totalDemurrageAccruedINR.toLocaleString('en-IN'),
      TRACKING_LINK: `https://mapsnvocc.in/ccontrol/${c.containerNumber}`,
      CONTACT_PHONE: '+91 98250 11492'
    });

    const newAlert: any = {
      id: `alt-${Date.now()}`,
      type: templateId.includes('72') ? '72H_ALERT' : templateId.includes('48') ? '48H_ALERT' : templateId.includes('24') ? '24H_ALERT' : 'OVERDUE_ALERT',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      recipient: `${recipient} (${c.shipperName})`,
      recipientRole: 'Shipper',
      messagePreview,
      status: 'delivered'
    };

    setManagedContainers(prev =>
      prev.map(item => item.id === c.id ? { ...item, alertsSent: [newAlert, ...item.alertsSent] } : item)
    );

    addAuditLog('WHATSAPP_ALERT', 'Container Control', c.containerNumber, `Alert sent to ${recipient}`);
    showToast('success', 'WhatsApp Alert Sent', `Sent alert to ${recipient}`);
  };

  const saveCfsChargeToShipment = (shipmentId: string, chargeData: any) => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id === shipmentId) {
          const newChargeItem: any = {
            id: `chg-cfs-${Date.now()}`,
            chargeCode: 'CFS-01',
            chargeName: `CFS Handling & Ground Rent (${chargeData.cfsName || 'Mundra'})`,
            category: 'CFS',
            currency: 'INR',
            amount: chargeData.total || chargeData.subtotal || 14396,
            rate: 1,
            amountInINR: chargeData.total || chargeData.subtotal || 14396,
            billedTo: 'shipper',
            paymentTerm: 'Collect',
            status: 'pending',
            isCost: true
          };
          return {
            ...s,
            charges: [...(s.charges || []), newChargeItem]
          };
        }
        return s;
      })
    );
    showToast('success', 'Charge Saved', `CFS charges synced to shipment ${shipmentId} profitability ledger.`);
  };

  const markContainerInvoicePaid = (invoiceId: string) => {
    setContainerControlInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, status: 'Paid', paidDate: new Date().toISOString().slice(0, 10), paymentMethod: 'RTGS / Bank Transfer' }
          : inv
      )
    );
    showToast('success', 'Invoice Marked Paid', `Container Control Invoice ${invoiceId} marked as settled.`);
  };

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('maps_shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem('maps_hbls', JSON.stringify(hbls));
  }, [hbls]);

  useEffect(() => {
    localStorage.setItem('maps_invoices_v3', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('maps_mbls', JSON.stringify(mbls));
  }, [mbls]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Print Document Modal
  const [activePrintDoc, setActivePrintDoc] = useState<{ type: 'HBL' | 'MBL' | 'DO' | 'INVOICE' | 'QUOTE' | 'MANIFEST' | 'STATEMENT' | 'DGD' | 'ARRIVAL_NOTICE' | 'VGM' | 'COVER_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'; data: any } | null>(null);

  // Audit logging helper
  const addAuditLog = (action: string, module: string, entityId: string, details: string) => {
    const now = new Date();
    const formatted = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const item: AuditLogItem = {
      id: 'aud-' + Date.now(),
      timestamp: formatted,
      user: currentUser.name,
      action,
      module,
      entityId,
      details
    };
    setAuditLogs(prev => [item, ...prev]);
  };

  const [automationHistory, setAutomationHistory] = useState<AutomationResult[]>([]);

  // Actions
  const addShipment = (shipment: Shipment) => {
    // Execute Chain 1: Shipment Creation Chain
    const chainResult = executeShipmentCreationChain(shipment, parties, currentUser.name);
    const enrichedShipment: Shipment = {
      ...shipment,
      ...(chainResult.updatedShipment || {})
    };

    setShipments(prev => [enrichedShipment, ...prev]);

    if (chainResult.createdHbl) {
      setHbls(prev => [chainResult.createdHbl!, ...prev]);
    }
    if (chainResult.createdInvoice) {
      setInvoices(prev => [chainResult.createdInvoice!, ...prev]);
    }
    if (chainResult.createdDocuments) {
      setDocuments(prev => [...chainResult.createdDocuments!, ...prev]);
    }
    if (chainResult.createdCommunications) {
      setCommunications(prev => [...chainResult.createdCommunications!, ...prev]);
    }
    setAuditLogs(prev => [chainResult.auditLog, ...prev]);
    setAutomationHistory(prev => [chainResult, ...prev]);

    showToast(
      'success',
      `Shipment ${shipment.id} Created`,
      `Auto-Chained: Draft HBL, Tax Invoice, Vault Docs, and Port Tracking active.`
    );
  };

  const updateShipment = (id: string, updates: Partial<Shipment>) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addAuditLog('Updated Shipment', 'Shipments', id, `Updated fields: ${Object.keys(updates).join(', ')}`);
    showToast('info', `Shipment ${id} Updated`, 'Changes saved successfully.');
  };

  const deleteShipment = (id: string) => {
    setShipments(prev => prev.filter(s => s.id !== id));
    addAuditLog('Deleted Shipment', 'Shipments', id, `Removed shipment from active registry`);
    showToast('warning', `Shipment ${id} Deleted`, 'Shipment record deleted.');
  };

  const togglePinShipment = (id: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    const s = shipments.find(s => s.id === id);
    showToast('info', s?.isPinned ? `Unpinned ${id}` : `Pinned ${id}`, 'Dashboard priority view updated.');
  };

  const addHBL = (hbl: HBL) => {
    setHbls(prev => {
      const exists = prev.some(h => h.id === hbl.id || h.hblNumber === hbl.hblNumber);
      if (exists) {
        return prev.map(h => (h.id === hbl.id || h.hblNumber === hbl.hblNumber) ? { ...h, ...hbl } : h);
      }
      return [hbl, ...prev];
    });
    // update linked shipment's hblNo if not set
    if (hbl.shipmentId) {
      updateShipment(hbl.shipmentId, { hblNo: hbl.hblNumber });
    }
    addAuditLog('Created HBL', 'HBL', hbl.hblNumber, `Generated House B/L for ${hbl.shipperName}`);
    showToast('success', `HBL ${hbl.hblNumber} Created`, '3 Originals ready for issuance and print.');
  };

  const updateHBL = (id: string, updates: Partial<HBL>) => {
    setHbls(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    addAuditLog('Updated HBL', 'HBL', id, `Updated HBL status/fields: ${Object.keys(updates).join(', ')}`);
    showToast('info', `HBL ${id} Updated`, 'Status updated.');
  };

  const addMBL = (mbl: MBL) => {
    setMbls(prev => {
      const exists = prev.some(m => m.id === mbl.id || m.mblNumber === mbl.mblNumber);
      if (exists) {
        return prev.map(m => (m.id === mbl.id || m.mblNumber === mbl.mblNumber) ? { ...m, ...mbl } : m);
      }
      return [mbl, ...prev];
    });
    addAuditLog('Logged MBL', 'MBL', mbl.mblNumber, `Carrier MBL recorded for ${mbl.carrierName}`);
    showToast('success', `MBL ${mbl.mblNumber} Saved`, 'Reconciliation and container linked.');
  };

  const updateMBL = (id: string, updates: Partial<MBL>) => {
    setMbls(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    addAuditLog('Updated MBL', 'MBL', id, `Updated MBL status/fields: ${Object.keys(updates).join(', ')}`);
    showToast('info', `MBL ${id} Updated`, 'Status updated.');
  };

  const deleteMBL = (id: string) => {
    setMbls(prev => prev.filter(m => m.id !== id));
    addAuditLog('Deleted MBL', 'MBL', id, 'Deleted carrier MBL record');
    showToast('warning', `MBL ${id} Removed`, 'Record deleted from carrier ledger.');
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    addAuditLog('Generated Invoice', 'Invoicing', invoice.invoiceNumber, `Billed to ${invoice.billToPartyName} for ₹${invoice.grandTotal.toLocaleString('en-IN')}`);
    showToast('success', `Invoice ${invoice.invoiceNumber} Generated`, `GST Tax invoice created for ₹${invoice.grandTotal.toLocaleString('en-IN')}`);
  };

  const recordPayment = (invoiceId: string, amount: number, mode: string, ref: string) => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (targetInvoice) {
      const result = executePaymentReceivedChain(targetInvoice, amount, mode, ref, currentUser.name);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, ...result.updatedInvoice } : inv));
      setCommunications(prev => [result.thankYouMessage, ...prev]);
      setAuditLogs(prev => [result.auditLog, ...prev]);
      setAutomationHistory(prev => [{
        chainName: 'Payment Received Chain',
        triggeredAt: result.auditLog.timestamp,
        actionsExecuted: result.actions,
        auditLog: result.auditLog
      }, ...prev]);
      showToast('success', `Payment Recorded`, `₹${amount.toLocaleString('en-IN')} applied against ${invoiceId}. Auto-receipt & WhatsApp dispatched.`);
    } else {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          const newPaid = (inv.amountPaid || 0) + amount;
          const newBal = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newBal === 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            amountPaid: newPaid,
            balanceDue: newBal,
            status: newStatus
          };
        }
        return inv;
      }));
      addAuditLog('Payment Recorded', 'Invoicing', invoiceId, `Payment of ₹${amount.toLocaleString('en-IN')} received via ${mode} (Ref: ${ref})`);
      showToast('success', `Payment Recorded`, `₹${amount.toLocaleString('en-IN')} applied against ${invoiceId}`);
    }
  };

  const createInvoiceFromShipment = (shipmentId: string): Invoice | null => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) {
      showToast('error', 'Shipment Not Found', `Cannot create invoice for ${shipmentId}`);
      return null;
    }
    const { invoice, actions } = executeInvoiceCreationFromShipment(shipment, currentUser.name);
    setInvoices(prev => [invoice, ...prev]);
    const now = new Date();
    const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const audit: AuditLogItem = {
      id: 'aud-inv-' + Date.now(),
      timestamp,
      user: currentUser.name,
      action: 'Invoice Created from Shipment',
      module: 'Invoicing',
      entityId: invoice.invoiceNumber,
      details: actions.join(' | ')
    };
    setAuditLogs(prev => [audit, ...prev]);
    const autoResult: AutomationResult = {
      chainName: 'Invoice Creation Chain',
      triggeredAt: timestamp,
      actionsExecuted: actions,
      createdInvoice: invoice,
      auditLog: audit
    };
    setAutomationHistory(prev => [autoResult, ...prev]);
    showToast('success', `Invoice Auto-Generated (${invoice.invoiceNumber})`, `Chain completed: GST computed, UPI QR inserted, 4 linked actions.`);
    return invoice;
  };

  const issueHbl = (hblId: string) => {
    const hbl = hbls.find(h => h.id === hblId || h.hblNumber === hblId);
    if (!hbl) {
      showToast('error', 'HBL Not Found', `Cannot issue HBL ${hblId}`);
      return;
    }
    const shipment = shipments.find(s => s.id === hbl.shipmentId);
    const result = executeHblIssueChain(hbl, shipment, currentUser.name);

    // Update HBL status
    setHbls(prev => prev.map(h => (h.id === hbl.id ? { ...h, status: 'Issued' } : h)));

    // Update linked shipment status
    if (shipment && result.updatedShipment) {
      setShipments(prev => prev.map(s => (s.id === shipment.id ? { ...s, ...result.updatedShipment } : s)));
    }

    if (result.createdCommunications) {
      setCommunications(prev => [...result.createdCommunications!, ...prev]);
    }
    setAuditLogs(prev => [result.auditLog, ...prev]);
    setAutomationHistory(prev => [result, ...prev]);
    showToast('success', `HBL ${hbl.hblNumber} Issued!`, 'Original watermark applied, WhatsApp dispatch queued, tracking link live.');
  };

  const reportVesselDelay = (vesselName: string, delayDays: number, revisedEta: string) => {
    const affected = shipments.filter(
      s => s.vesselName.toLowerCase() === vesselName.toLowerCase() && s.status !== 'delivered' && s.status !== 'cancelled'
    );
    const result = executeVesselDelayChain(vesselName, delayDays, revisedEta, affected, currentUser.name);

    // Update affected shipments
    setShipments(prev =>
      prev.map(s => {
        if (s.vesselName.toLowerCase() === vesselName.toLowerCase() && s.status !== 'delivered' && s.status !== 'cancelled') {
          return {
            ...s,
            eta: revisedEta,
            status: 'delayed',
            events: [
              {
                id: 'tl-' + Date.now() + Math.random().toString().slice(2, 6),
                timestamp: `${new Date().getDate()} Oct 2026`,
                title: `Carrier Vessel Delay (+${delayDays}d)`,
                location: s.polName,
                description: `Carrier schedule update. Vessel ${vesselName} delayed by ${delayDays} days. Revised ETA ${revisedEta}.`,
                category: 'alert',
                source: 'CARRIER_EDI',
                user: currentUser.name
              },
              ...(s.events || [])
            ]
          };
        }
        return s;
      })
    );

    if (result.alertMessages) {
      setCommunications(prev => [...result.alertMessages, ...prev]);
    }
    const now = new Date();
    const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const audit: AuditLogItem = {
      id: 'aud-delay-' + Date.now(),
      timestamp,
      user: currentUser.name,
      action: 'Vessel Delay Cascade',
      module: 'Shipments',
      entityId: vesselName,
      details: result.actions.join(' | ')
    };
    setAuditLogs(prev => [audit, ...prev]);
    setAutomationHistory(prev => [
      {
        chainName: 'Vessel Delay Cascade Chain',
        triggeredAt: timestamp,
        actionsExecuted: result.actions,
        auditLog: audit
      },
      ...prev
    ]);
    showToast('warning', `Vessel Delay Applied: ${vesselName}`, `${affected.length} shipments updated to ETA ${revisedEta}. Shippers auto-notified.`);
  };

  const addParty = (party: Party) => {
    setParties(prev => [party, ...prev]);
    addAuditLog('Created Party', 'CRM', party.code, `Added ${party.name} (${party.type})`);
    showToast('success', `Party Added`, `${party.name} saved to directory.`);
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast('info', `Party Updated`, 'Record updated successfully.');
  };

  const addCarrierRate = (rate: CarrierRate) => {
    setCarrierRates(prev => [rate, ...prev]);
    addAuditLog('Added Carrier Rate', 'Rate Master', rate.contractNo, `${rate.carrierName} ${rate.polName}->${rate.podName} $${rate.baseFreightUSD}`);
    showToast('success', `Rate Added to Master`, `${rate.carrierName} ${rate.polName} to ${rate.podName}`);
  };

  const addQuotation = (quote: Quotation) => {
    setQuotations(prev => [quote, ...prev]);
    addAuditLog('Generated Quote', 'Quotes', quote.quoteNumber, `Quoted to ${quote.customerName} for ${quote.podName}`);
    showToast('success', `Quote ${quote.quoteNumber} Created`, 'Ready to email or send on WhatsApp.');
  };

  const updateQuoteStatus = (id: string, status: Quotation['status']) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    showToast('info', `Quote Status Changed`, `Status set to ${status.toUpperCase()}`);
  };

  const addAgentTransaction = (tx: AgentTransaction) => {
    setAgentTransactions(prev => [tx, ...prev]);
    showToast('success', `Transaction Logged`, `${tx.currency} ${tx.amount} recorded for agent.`);
  };

  const reconcileTransaction = (txId: string) => {
    setAgentTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'Matched', reconciledDate: 'Today' } : t));
    showToast('success', `Transaction Reconciled`, 'Matched against agent monthly statement.');
  };

  const addDocument = (doc: DocumentItem) => {
    setDocuments(prev => [doc, ...prev]);
    addAuditLog('Uploaded Document', 'Vault', doc.title, `Uploaded ${doc.fileName} (${doc.category})`);
    showToast('success', `Document Uploaded & Verified`, `${doc.title} scanned by OCR.`);
  };

  const sendMessage = (msg: Omit<CommunicationMessage, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg: CommunicationMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp
    };
    setCommunications(prev => [newMsg, ...prev]);
    showToast('success', `${msg.channel} Message Sent`, `Dispatched to ${msg.recipient}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // V4 MODULES & ENGINE STATES
  // ══════════════════════════════════════════════════════════════════════════
  const [density, setDensity] = useState<'dense' | 'comfortable'>(() => {
    return (localStorage.getItem('maps_density') as 'dense' | 'comfortable') || 'dense';
  });

  const toggleDensity = () => {
    setDensity(prev => {
      const next = prev === 'dense' ? 'comfortable' : 'dense';
      localStorage.setItem('maps_density', next);
      return next;
    });
  };

  const [egmFilings, setEgmFilings] = useState<EgmFiling[]>(() => {
    const local = localStorage.getItem('maps_egm_filings');
    return local ? JSON.parse(local) : MOCK_EGM_FILINGS;
  });

  const addEgmFiling = (filing: EgmFiling) => {
    setEgmFilings(prev => [filing, ...prev]);
    addAuditLog('Created EGM Filing', 'EGM', filing.vesselVoyage, `EGM draft initiated for ${filing.vesselVoyage}`);
    showToast('success', 'EGM Draft Created', `Vessel ${filing.vesselVoyage} queued for ICEGATE filing.`);
  };

  const updateEgmFiling = (id: string, updates: Partial<EgmFiling>) => {
    setEgmFilings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const fileEgmWithIem = (id: string, iemNumber: string) => {
    const now = new Date();
    const filedAt = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setEgmFilings(prev => prev.map(f => f.id === id ? {
      ...f,
      status: 'Filed',
      iemNumber,
      filedAt,
      filedBy: `${currentUser.name} (${currentUser.title})`,
      isDeadlineUrgent: false,
      hoursRemaining: 0
    } : f));
    addAuditLog('Filed EGM to ICEGATE', 'EGM', id, `IEM Number: ${iemNumber} successfully acknowledged`);
    showToast('success', 'EGM Lodged with ICEGATE', `IEM ${iemNumber} registered. Compliant with Indian Customs.`);
  };

  const [igmRecords, setIgmRecords] = useState<IgmRecord[]>(() => {
    const local = localStorage.getItem('maps_igm_records');
    return local ? JSON.parse(local) : MOCK_IGM_RECORDS;
  });

  const addIgmRecord = (record: IgmRecord) => {
    setIgmRecords(prev => [record, ...prev]);
    showToast('success', 'Inward Manifest Added', `${record.vesselVoyage} added with ${record.hblCount} HBLs.`);
  };

  const sendIgmArrivalNotices = (igmId: string) => {
    const target = igmRecords.find(r => r.id === igmId);
    if (!target) return;
    const now = new Date();
    const timeStr = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setIgmRecords(prev => prev.map(r => r.id === igmId ? {
      ...r,
      consignments: r.consignments.map(c => ({
        ...c,
        arrivalNoticeSent: true,
        arrivalNoticeSentAt: timeStr
      }))
    } : r));

    target.consignments.forEach(c => {
      sendMessage({
        shipmentId: c.hblNumber,
        partyName: c.consignee,
        recipient: c.consignee,
        channel: 'WhatsApp',
        direction: 'Outbound',
        status: 'Sent',
        subject: `Arrival Notice - ${target.vesselVoyage}`,
        body: `Mundra Port Arrival Notice: Vessel ${target.vesselVoyage} ETA ${target.eta}. Container ${c.containerNumber} (${c.sizeType}). DO charges estimate: ₹${c.chargesEstimateINR}. Please surrender Original BL for delivery order release.`
      });
    });

    showToast('success', 'Arrival Notices Dispatched', `WhatsApp & Email arrival notices sent to ${target.consignments.length} consignees.`);
  };

  const [shippingInstructions, setShippingInstructions] = useState<ShippingInstruction[]>(() => {
    const local = localStorage.getItem('maps_shipping_instructions');
    return local ? JSON.parse(local) : MOCK_SHIPPING_INSTRUCTIONS;
  });

  const addShippingInstruction = (si: ShippingInstruction) => {
    setShippingInstructions(prev => [si, ...prev]);
    showToast('success', 'Shipping Instruction Received', `Logged via ${si.channel} from ${si.senderName}`);
  };

  const convertSiToHblDraft = (siId: string): string | null => {
    const si = shippingInstructions.find(s => s.id === siId);
    if (!si) return null;
    const hblNo = `LCMUN${(si.parsedData.pod || 'JEA').slice(0, 3).toUpperCase()}2600${Math.floor(100 + Math.random() * 900)}`;

    const newHbl: HBL = {
      id: hblNo,
      hblNumber: hblNo,
      shipmentId: si.matchedShipmentId || 'MAPS-EXP-' + Math.floor(1000 + Math.random() * 9000),
      mblNumber: 'MSKUMUN2600' + Math.floor(100 + Math.random() * 900),
      shipperName: si.parsedData.shipperName || si.senderName,
      shipperAddress: si.parsedData.shipperAddress || 'Gujarat, India',
      consigneeText: si.parsedData.consigneeName || 'TO ORDER',
      notifyPartyText: si.parsedData.notifyParty || 'SAME AS CONSIGNEE',
      deliveryContact: 'MAPS FREIGHT DESTINATION AGENT',
      preCarriageBy: 'Road Logistics',
      placeOfReceipt: 'Mundra',
      oceanVessel: 'DP WORLD CHENNAI',
      voyageNo: '014',
      portOfLoading: si.parsedData.pol || 'Mundra, India',
      portOfDischarge: si.parsedData.pod || 'Jebel Ali, UAE',
      placeOfDelivery: si.parsedData.pod || 'Jebel Ali, UAE',
      marksAndNumbers: 'MAPS / 2026\nMUNDRA-EXP',
      containerAndSeals: si.parsedData.containers?.map(c => `${c.containerNumber} / Seal: ${c.sealNumber}`).join('\n') || 'FCIU4419201 / Seal: KC-2601',
      packageCountAndType: si.parsedData.packageCount || '1 LOT',
      cargoDescription: si.parsedData.cargoDescription || 'SAID TO CONTAIN EXPORT MERCHANDISE',
      grossWeightKg: si.parsedData.grossWeightKg || 25000,
      measurementCbm: si.parsedData.volumeCbm || 35.0,
      freightPayableAt: 'Mundra, India',
      freightTerm: 'Prepaid',
      freightCharges: [
        { description: 'Ocean Freight', basis: 'Per Container', rate: '850.00', currency: 'USD', amount: 850, prepaidOrCollect: 'Prepaid' }
      ],
      totalFreightUSD: 850,
      numberOfOriginals: 3,
      placeOfIssue: 'Gandhidham, Gujarat',
      dateOfIssue: '19-OCT-2026',
      status: 'Draft',
      shippersLoadCountSeal: true,
      saidToContain: true,
      carrierName: 'MAPS FREIGHT SOLUTIONS PVT LTD',
      asAgentsCarrier: 'MAPS FREIGHT SOLUTIONS',
      signatoryName: 'Aman Dana',
      containers: si.parsedData.containers?.map(c => ({
        containerNumber: c.containerNumber,
        containerType: c.sizeType || '20GP',
        sealNumber: c.sealNumber,
        packageCount: '900',
        packageDescription: 'BOXES',
        grossWeightKg: 25000,
        netWeightKg: 24000,
        volumeCbm: 30
      })) || []
    };

    setHbls(prev => [newHbl, ...prev]);
    setShippingInstructions(prev => prev.map(s => s.id === siId ? {
      ...s,
      status: 'Converted to HBL Draft',
      matchedHblNumber: hblNo
    } : s));

    addAuditLog('Created HBL Draft from SI', 'House B/L', hblNo, `Auto-parsed and generated draft from ${si.siNumber}`);
    showToast('success', 'HBL Draft Generated', `Converted ${si.siNumber} into ${hblNo}.`);
    return hblNo;
  };

  const [salesQuotations, setSalesQuotations] = useState<SalesQuotation[]>(() => {
    const local = localStorage.getItem('maps_sales_quotations');
    return local ? JSON.parse(local) : MOCK_SALES_QUOTATIONS;
  });

  const addSalesQuotation = (q: SalesQuotation) => {
    setSalesQuotations(prev => [q, ...prev]);
    showToast('success', 'Quote Added to Pipeline', `${q.quoteNumber} created for ${q.customerName}`);
  };

  const updateSalesQuotation = (id: string, updates: Partial<SalesQuotation>) => {
    setSalesQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const [chaJobs, setChaJobs] = useState<ChaJob[]>(() => {
    const local = localStorage.getItem('maps_cha_jobs');
    return local ? JSON.parse(local) : MOCK_CHA_JOBS;
  });

  const addChaJob = (job: ChaJob) => {
    setChaJobs(prev => [job, ...prev]);
    showToast('success', 'CHA Job Initiated', `SB ${job.shippingBillNumber} assigned to ${job.chaName}`);
  };

  const updateChaJob = (id: string, updates: Partial<ChaJob>) => {
    setChaJobs(prev => prev.map(j => {
      if (j.id === id) {
        const updated = { ...j, ...updates };
        // Integration Path 11: CHA LEO -> Shipment timeline & status
        if ((updates.currentStage === 'Loaded' || updates.currentStage === 'LEO') && j.shipmentId) {
          const nowStr = '15 Oct 2026 13:45';
          setShipments(sPrev => sPrev.map(shipment => {
            if (shipment.id === j.shipmentId) {
              const leoEvent: TimelineEvent = {
                id: 'ev-leo-' + Date.now(),
                timestamp: nowStr,
                title: 'Customs Let Export Order (LEO) Granted',
                location: 'APSEZ Mundra Customs Station',
                description: `Shipping Bill ${j.shippingBillNumber} cleared by Customs Officer. Goods cleared for vessel loading.`,
                category: 'customs',
                source: 'ICEGATE',
                user: 'ICEGATE EDI Automated Sync'
              };
              return {
                ...shipment,
                status: 'customs_cleared',
                statusLabel: 'LEO Granted - Cleared for Loading',
                events: [leoEvent, ...shipment.events]
              };
            }
            return shipment;
          }));
        }
        return updated;
      }
      return j;
    }));
  };

  const [truckingTrips, setTruckingTrips] = useState<TruckingTrip[]>(() => {
    const local = localStorage.getItem('maps_trucking_trips');
    return local ? JSON.parse(local) : MOCK_TRUCKING_TRIPS;
  });

  const addTruckingTrip = (trip: TruckingTrip) => {
    setTruckingTrips(prev => [trip, ...prev]);
    showToast('success', 'Trucking Trip Assigned', `Trip ${trip.tripNumber} to ${trip.transporterName}`);
  };

  const updateTruckingTrip = (id: string, updates: Partial<TruckingTrip>) => {
    setTruckingTrips(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        // Integration Path 12: Trucking trip complete -> Shipment timeline & delivery advance
        if (updates.status === 'Completed' && t.shipmentId) {
          const nowStr = '15 Oct 2026 16:30';
          setShipments(sPrev => sPrev.map(shipment => {
            if (shipment.id === t.shipmentId) {
              const podEvent: TimelineEvent = {
                id: 'ev-truck-' + Date.now(),
                timestamp: nowStr,
                title: 'Drayage Transport Delivered (POD Received)',
                location: t.destination,
                description: `Container ${t.containerNumber} safely delivered by ${t.transporterName} (LR #${t.lrNumber}). Receiver signed proof of delivery.`,
                category: 'delivery',
                source: 'MANUAL',
                user: t.driverName || 'Truck Driver'
              };
              return {
                ...shipment,
                status: shipment.jobType === 'Import' ? 'delivered' : 'at_port',
                statusLabel: shipment.jobType === 'Import' ? 'Delivered to Consignee' : 'Arrived at Port Terminal',
                events: [podEvent, ...shipment.events]
              };
            }
            return shipment;
          }));
        }
        return updated;
      }
      return t;
    }));
  };

  const [dgShipments, setDgShipments] = useState<DangerousGoodsItem[]>(() => {
    const local = localStorage.getItem('maps_dg_shipments');
    return local ? JSON.parse(local) : MOCK_DG_SHIPMENTS;
  });

  const addDgShipment = (item: DangerousGoodsItem) => {
    setDgShipments(prev => [item, ...prev]);
    showToast('warning', 'Dangerous Goods Manifested', `UN${item.unNumber} (${item.properShippingName}) recorded.`);
  };

  const updateDgShipment = (id: string, updates: Partial<DangerousGoodsItem>) => {
    setDgShipments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => {
    const local = localStorage.getItem('maps_approval_requests');
    return local ? JSON.parse(local) : MOCK_APPROVAL_REQUESTS;
  });

  const [approvalRules] = useState<ApprovalRule[]>(MOCK_APPROVAL_RULES);

  const createApprovalRequest = (req: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => {
    const now = new Date();
    const timeStr = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newReq: ApprovalRequest = {
      ...req,
      id: 'appr-' + Date.now(),
      requestedAt: timeStr,
      status: 'Pending'
    };
    setApprovalRequests(prev => [newReq, ...prev]);
    addAuditLog('Created Approval Request', 'Approvals', newReq.entityReference, `Rule triggered: ${newReq.ruleTitle}`);
    showToast('warning', 'Approval Request Escalated', `Routed to ${newReq.requiredRole.toUpperCase()} for authorization.`);
  };

  const decideApprovalRequest = (id: string, status: 'Approved' | 'Rejected', decisionNotes: string) => {
    const now = new Date();
    const timeStr = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setApprovalRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status,
      decisionNotes,
      decidedBy: `${currentUser.name} (${currentUser.title})`,
      decidedAt: timeStr
    } : r));

    const req = approvalRequests.find(r => r.id === id);
    if (req) {
      addAuditLog(`Approval ${status}`, 'Approvals', req.entityReference, `${status} by ${currentUser.name}: ${decisionNotes}`);
      showToast(status === 'Approved' ? 'success' : 'error', `Request ${status}`, `${req.entityReference} was ${status.toLowerCase()}.`);
    }
  };

  const [lcRecords, setLcRecords] = useState<LetterOfCredit[]>(MOCK_LC_RECORDS);
  const addLcRecord = (lc: LetterOfCredit) => {
    setLcRecords(prev => [lc, ...prev]);
    showToast('success', 'Letter of Credit Registered', `LC ${lc.lcNumber} recorded.`);
  };

  const [marinePolicies, setMarinePolicies] = useState<MarineInsurancePolicy[]>(MOCK_MARINE_POLICIES);
  const addMarinePolicy = (p: MarineInsurancePolicy) => {
    setMarinePolicies(prev => [p, ...prev]);
    showToast('success', 'Marine Insurance Bound', `Policy ${p.policyNumber} created.`);
  };

  const [advanceFilings, setAdvanceFilings] = useState<AdvanceFiling[]>(MOCK_ADVANCE_FILINGS);
  const addAdvanceFiling = (f: AdvanceFiling) => {
    setAdvanceFilings(prev => [f, ...prev]);
    showToast('success', 'Advance Filing Lodged', `${f.country} filing submitted.`);
  };

  const [blTemplates, setBlTemplates] = useState<BlTemplate[]>(MOCK_BL_TEMPLATES);
  const addBlTemplate = (t: BlTemplate) => {
    setBlTemplates(prev => [t, ...prev]);
    showToast('success', 'BL Template Saved', `${t.name} created.`);
  };

  const [repositioningJobs, setRepositioningJobs] = useState<ContainerRepositioningJob[]>(MOCK_REPOSITIONING_JOBS);
  const addRepositioningJob = (j: ContainerRepositioningJob) => {
    setRepositioningJobs(prev => [j, ...prev]);
    showToast('success', 'Repositioning Job Scheduled', `${j.containerCount} containers from ${j.fromDepot}`);
  };

  const [eirRecords, setEirRecords] = useState<EirRecord[]>(MOCK_EIR_RECORDS);
  const addEirRecord = (e: EirRecord) => {
    setEirRecords(prev => [e, ...prev]);
    showToast('success', 'EIR Created & Signed', `${e.eirType} for ${e.containerNumber}`);
  };

  const rollShipment = (shipmentId: string, reason: string, newVessel: string, newEtd: string, newEta: string) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      const count = (s.rolledCount || 0) + 1;
      const newHistory = [
        ...(s.events || []),
        {
          id: 'roll-' + Date.now(),
          title: `Cargo Rolled (Attempt #${count})`,
          description: `Reason: ${reason}. Rolled from ${s.vesselName} to ${newVessel}. New ETD: ${newEtd}`,
          timestamp: new Date().toISOString().slice(0, 10),
          location: s.polName,
          category: 'vessel' as const,
          source: 'MANUAL' as const,
          user: currentUser.name
        }
      ];
      return {
        ...s,
        vesselName: newVessel,
        etd: newEtd,
        eta: newEta,
        rolledCount: count,
        events: newHistory
      };
    }));

    const shp = shipments.find(s => s.id === shipmentId);
    if (shp) {
      sendMessage({
        shipmentId,
        partyName: shp.shipperName,
        recipient: shp.shipperName,
        channel: 'WhatsApp',
        direction: 'Outbound',
        status: 'Sent',
        subject: `Cargo Rolled Notification - ${shipmentId}`,
        body: `Booking Update: Your cargo under shipment ${shipmentId} has been rolled to ${newVessel} (ETD: ${newEtd}, ETA: ${newEta}) due to: ${reason}. Revised tracking is active on MAPS portal.`
      });
    }

    addAuditLog('Cargo Rolled', 'Shipments', shipmentId, `Rolled to ${newVessel}. Reason: ${reason}`);
    showToast('warning', 'Cargo Rolled & Rebooked', `Shipment ${shipmentId} transferred to ${newVessel}. Customer notified.`);
  };

  return (
    <AppContext.Provider
      value={{
        firmDetails: FIRM_DETAILS,
        currentUser,
        updateCurrentUser,
        switchUserRole,
        users,
        theme,
        toggleTheme,
        universalSearch,
        setUniversalSearch,
        activeView,
        setActiveView,
        viewParam,
        setViewParam,
        shipments,
        addShipment,
        updateShipment,
        deleteShipment,
        togglePinShipment,
        hbls,
        addHBL,
        updateHBL,
        mbls,
        addMBL,
        updateMBL,
        deleteMBL,
        invoices,
        addInvoice,
        recordPayment,
        parties,
        addParty,
        updateParty,
        carrierRates,
        addCarrierRate,
        quotations,
        addQuotation,
        updateQuoteStatus,
        agentTransactions,
        addAgentTransaction,
        reconcileTransaction,
        documents,
        addDocument,
        communications,
        sendMessage,
        auditLogs,
        addAuditLog,
        toasts,
        showToast,
        removeToast,
        activePrintDoc,
        setActivePrintDoc,
        createInvoiceFromShipment,
        issueHbl,
        reportVesselDelay,
        automationHistory,
        managedContainers,
        updateContainerStage,
        addContainer,
        sendContainerWhatsAppAlert,
        saveCfsChargeToShipment,
        containerControlInvoices,
        markContainerInvoicePaid,
        customerLedgers,
        deliveryOrders,
        addDeliveryOrder,
        updateDeliveryOrder,
        srrs,
        addSrr,
        updateSrr,
        exportManifests,
        addExportManifest,
        density,
        toggleDensity,
        egmFilings,
        addEgmFiling,
        updateEgmFiling,
        fileEgmWithIem,
        igmRecords,
        addIgmRecord,
        sendIgmArrivalNotices,
        shippingInstructions,
        addShippingInstruction,
        convertSiToHblDraft,
        salesQuotations,
        addSalesQuotation,
        updateSalesQuotation,
        chaJobs,
        addChaJob,
        updateChaJob,
        truckingTrips,
        addTruckingTrip,
        updateTruckingTrip,
        dgShipments,
        addDgShipment,
        updateDgShipment,
        approvalRequests,
        createApprovalRequest,
        decideApprovalRequest,
        approvalRules,
        lcRecords,
        addLcRecord,
        marinePolicies,
        addMarinePolicy,
        advanceFilings,
        addAdvanceFiling,
        blTemplates,
        addBlTemplate,
        repositioningJobs,
        addRepositioningJob,
        eirRecords,
        addEirRecord,
        rollShipment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
