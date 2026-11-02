import { useState, useMemo, useEffect } from 'react';
import { EgmFiling, EgmAmendment, EgmConsignmentDetail, NewManifestPayload } from '../types';
import { INITIAL_EGM_FILINGS, MOCK_EGM_CONSIGNMENTS } from '../data/mockEgmData';
import { downloadIcegateCsv, calculateDeadlineInfo } from '../utils/icegateExport';

export interface UseEgmManagerOptions {
  initialFilings?: EgmFiling[];
  initialConsignments?: Record<string, EgmConsignmentDetail>;
  currentUser?: { name: string; title: string };
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onFilingsChange?: (filings: EgmFiling[]) => void;
}

export function useEgmManager(options: UseEgmManagerOptions = {}) {
  const {
    initialFilings = INITIAL_EGM_FILINGS,
    initialConsignments = MOCK_EGM_CONSIGNMENTS,
    currentUser = { name: 'Operations Officer', title: 'Senior Manifest Specialist' },
    onToast,
    onFilingsChange
  } = options;

  const [filings, setFilings] = useState<EgmFiling[]>(initialFilings);

  useEffect(() => {
    if (options.initialFilings) {
      setFilings(options.initialFilings);
    }
  }, [options.initialFilings]);
  const [consignments, setConsignments] = useState<Record<string, EgmConsignmentDetail>>(initialConsignments);
  const [selectedFilingId, setSelectedFilingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'filed' | 'amendments'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showIemModal, setShowIemModal] = useState(false);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [showNewManifestModal, setShowNewManifestModal] = useState(false);

  // Selected Filing
  const selectedFiling = useMemo(() => {
    return filings.find(f => f.id === selectedFilingId) || null;
  }, [filings, selectedFilingId]);

  // KPIs
  const pendingCount = useMemo(() => filings.filter(f => f.status === 'Draft').length, [filings]);
  const urgentCount = useMemo(() => filings.filter(f => f.status === 'Draft' && f.isDeadlineUrgent).length, [filings]);
  const filedCount = useMemo(() => filings.filter(f => f.status === 'Filed').length, [filings]);
  const amendedCount = useMemo(() => filings.filter(f => f.status === 'Amended').length, [filings]);

  // Filtered List
  const filteredFilings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return filings.filter(f => {
      const matchSearch =
        f.vesselVoyage.toLowerCase().includes(q) ||
        f.pol.toLowerCase().includes(q) ||
        f.pod.toLowerCase().includes(q) ||
        f.carrierName.toLowerCase().includes(q) ||
        (f.iemNumber && f.iemNumber.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (activeTab === 'pending') return f.status === 'Draft';
      if (activeTab === 'filed') return f.status === 'Filed';
      if (activeTab === 'amendments') return f.status === 'Amended';
      return true;
    });
  }, [filings, activeTab, searchQuery]);

  // Action: Add new manifest
  const addNewManifest = (payload: NewManifestPayload) => {
    const deadline = calculateDeadlineInfo(payload.sailedDate);
    const newFiling: EgmFiling = {
      id: `egm-${Date.now()}`,
      vesselVoyage: `${payload.vesselName.toUpperCase()} / ${payload.voyageNumber.toUpperCase()}`,
      vesselName: payload.vesselName.toUpperCase(),
      voyageNumber: payload.voyageNumber.toUpperCase(),
      carrierName: payload.carrierName,
      pol: payload.pol,
      pod: payload.pod,
      sailedDate: payload.sailedDate,
      filingDeadline: deadline.deadlineStr,
      hblCount: payload.hblList.length,
      containerCount: payload.containerCount,
      totalGrossWtKg: payload.totalGrossWtKg,
      status: 'Draft',
      isDeadlineUrgent: deadline.isUrgent,
      hoursRemaining: deadline.hoursRemaining,
      hblList: payload.hblList,
      amendments: []
    };

    setFilings(prev => {
      const updated = [newFiling, ...prev];
      onFilingsChange?.(updated);
      return updated;
    });
    onToast?.('success', 'New Vessel Manifest Created', `Manifest for ${newFiling.vesselVoyage} queued for ICEGATE filing.`);
    return newFiling;
  };

  // Action: File EGM with ICEGATE IEM acknowledgment number
  const fileWithIem = (filingId: string, iemNumber: string) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setFilings(prev => {
      const updated = prev.map(f => {
        if (f.id === filingId) {
          return {
            ...f,
            status: 'Filed' as const,
            iemNumber,
            filedAt: formattedDate,
            filedBy: `${currentUser.name} (${currentUser.title})`,
            isDeadlineUrgent: false,
            hoursRemaining: 0
          };
        }
        return f;
      });
      onFilingsChange?.(updated);
      return updated;
    });

    onToast?.('success', 'EGM Lodged to ICEGATE', `IEM Acknowledgement ${iemNumber} successfully recorded.`);
  };

  // Action: File Supplementary Amendment
  const fileSupplementaryAmendment = (
    filingId: string,
    params: {
      reasonCode: string;
      reasonDescription: string;
      newTotalGrossWtKg?: number;
    }
  ) => {
    const now = new Date();
    const filedAt = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    setFilings(prev => {
      const updated = prev.map(f => {
        if (f.id === filingId) {
          const priorWt = f.totalGrossWtKg;
          const newWt = params.newTotalGrossWtKg ?? priorWt;

          const amendment: EgmAmendment = {
            id: `amend-${Date.now()}`,
            filedAt,
            priorValues: { totalGrossWtKg: priorWt },
            newValues: { totalGrossWtKg: newWt },
            reasonCode: params.reasonCode,
            reasonDescription: params.reasonDescription,
            approvedBy: `${currentUser.name} (${currentUser.title})`
          };

          return {
            ...f,
            status: 'Amended' as const,
            totalGrossWtKg: newWt,
            amendments: [amendment, ...f.amendments]
          };
        }
        return f;
      });
      onFilingsChange?.(updated);
      return updated;
    });

    onToast?.('success', 'Supplementary EGM Generated', `Amendment under code ${params.reasonCode} queued for customs review.`);
  };

  // Action: Quick Export CSV
  const exportCsv = (filing: EgmFiling) => {
    try {
      const filename = downloadIcegateCsv(filing, consignments);
      onToast?.('success', 'ICEGATE CSV Exported', `Generated compliant flat file: ${filename}`);
    } catch (err: any) {
      onToast?.('error', 'Export Failed', err?.message || 'Could not generate CSV flat file');
    }
  };

  return {
    filings,
    consignments,
    selectedFiling,
    selectedFilingId,
    setSelectedFilingId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredFilings,
    pendingCount,
    urgentCount,
    filedCount,
    amendedCount,
    // Modals
    showIemModal,
    setShowIemModal,
    showAmendModal,
    setShowAmendModal,
    showNewManifestModal,
    setShowNewManifestModal,
    // Operations
    addNewManifest,
    fileWithIem,
    fileSupplementaryAmendment,
    exportCsv
  };
}
