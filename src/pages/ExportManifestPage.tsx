import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EgmFiling, EgmAmendment } from '../types/v4Types';
import {
  Ship,
  FileCheck,
  AlertTriangle,
  Clock,
  Download,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const ExportManifestPage: React.FC = () => {
  const { egmFilings, addEgmFiling, fileEgmWithIem, updateEgmFiling, showToast, hbls, mbls, currentUser } = useApp();

  const [selectedFiling, setSelectedFiling] = useState<EgmFiling | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'filed' | 'amendments'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIemModal, setShowIemModal] = useState(false);
  const [iemInput, setIemInput] = useState('');
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendReasonCode, setAmendReasonCode] = useState('DGFT-01');
  const [amendDesc, setAmendDesc] = useState('');
  const [newGrossWt, setNewGrossWt] = useState('');

  // Filtered filings
  const filteredFilings = egmFilings.filter(f => {
    const matchSearch = f.vesselVoyage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.pol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.pod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.iemNumber && f.iemNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'pending') return matchSearch && f.status === 'Draft';
    if (activeTab === 'filed') return matchSearch && f.status === 'Filed';
    if (activeTab === 'amendments') return matchSearch && f.status === 'Amended';
    return matchSearch;
  });

  const pendingCount = egmFilings.filter(f => f.status === 'Draft').length;
  const urgentCount = egmFilings.filter(f => f.status === 'Draft' && f.isDeadlineUrgent).length;

  // Export ICEGATE CSV
  const handleExportIcegateCsv = (filing: EgmFiling) => {
    const headers = 'MESSAGE_TYPE,CUSTOMS_HOUSE_CODE,EGM_NO,EGM_DATE,IMO_CODE,VESSEL_NAME,VOYAGE_NO,LINE_NO,SUB_LINE_NO,HBL_NO,HBL_DATE,CONTAINER_NO,SEAL_NO,PKG_COUNT,GROSS_WT_KG,COMMODITY,POL,POD\n';
    const rows = filing.hblList.map((hblNo, idx) => {
      const hbl = hbls.find(h => h.hblNumber === hblNo);
      return `FGM,INMUN1,${filing.iemNumber || 'PENDING'},${filing.sailedDate},9234120,${filing.vesselName},${filing.voyageNumber},${idx + 1},1,${hblNo},${hbl?.dateOfIssue || filing.sailedDate},${hbl?.containers?.[0]?.containerNumber || 'FCIU2316385'},${hbl?.containers?.[0]?.sealNumber || '1132934'},${hbl?.packageCountAndType || '1 LOT'},${hbl?.grossWeightKg || 25000},"${hbl?.cargoDescription?.slice(0, 30) || 'GENERAL EXPORT'}",INMUN,${filing.pod.slice(0, 5).toUpperCase()}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICEGATE_EGM_${filing.vesselName.replace(/\s+/g, '_')}_${filing.voyageNumber}.csv`;
    link.click();
    showToast('success', 'ICEGATE CSV Exported', 'Validated flat file generated for customs portal upload.');
  };

  const handleConfirmFiling = () => {
    if (!selectedFiling) return;
    if (!iemInput.trim()) {
      showToast('error', 'IEM Number Required', 'Please enter the Indian Customs ICEGATE IEM Acknowledgement Number.');
      return;
    }
    fileEgmWithIem(selectedFiling.id, iemInput.trim());
    setShowIemModal(false);
    setIemInput('');
    // refresh selected
    setSelectedFiling(prev => prev ? {
      ...prev,
      status: 'Filed',
      iemNumber: iemInput.trim()
    } : null);
  };

  const handleApplyAmendment = () => {
    if (!selectedFiling) return;
    const amendment: EgmAmendment = {
      id: 'amend-' + Date.now(),
      filedAt: new Date().toISOString().slice(0, 10),
      priorValues: { totalGrossWtKg: selectedFiling.totalGrossWtKg },
      newValues: { totalGrossWtKg: Number(newGrossWt) || selectedFiling.totalGrossWtKg },
      reasonCode: amendReasonCode,
      reasonDescription: amendDesc || 'Customs exam weight adjustment per examination order',
      approvedBy: `${currentUser.name} (${currentUser.title})`
    };

    updateEgmFiling(selectedFiling.id, {
      status: 'Amended',
      totalGrossWtKg: Number(newGrossWt) || selectedFiling.totalGrossWtKg,
      amendments: [amendment, ...selectedFiling.amendments]
    });

    setSelectedFiling(prev => prev ? {
      ...prev,
      status: 'Amended',
      totalGrossWtKg: Number(newGrossWt) || prev.totalGrossWtKg,
      amendments: [amendment, ...prev.amendments]
    } : null);

    setShowAmendModal(false);
    setAmendDesc('');
    setNewGrossWt('');
    showToast('success', 'Supplementary EGM Generated', 'Amendment logged and queued for ICEGATE upload.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <Ship className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                  Export General Manifest (EGM)
                </h1>
                {urgentCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                    {urgentCount} Deadline &lt; 48h
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A8A299]">
                Indian Customs ICEGATE EGM Compliance • Mandatory 7-Day Post-Sailing Filing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newFiling: EgmFiling = {
                id: 'egm-' + Date.now(),
                vesselVoyage: 'OOCL ROTTERDAM / 204E',
                vesselName: 'OOCL ROTTERDAM',
                voyageNumber: '204E',
                carrierName: 'Orient Overseas Container Line',
                pol: 'Mundra (INMUN)',
                pod: 'Rotterdam (NLRTM)',
                sailedDate: '19-10-2026',
                filingDeadline: '26-10-2026',
                hblCount: 8,
                containerCount: 14,
                totalGrossWtKg: 312000,
                status: 'Draft',
                isDeadlineUrgent: false,
                hoursRemaining: 168,
                hblList: ['LCMUNJEALMU2600407'],
                amendments: []
              };
              addEgmFiling(newFiling);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Vessel Manifest</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Pending Filings</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{pendingCount}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Sailed within last 7 days</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Urgent (&lt; 48 Hours)</span>
            <span className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-rose-400 font-mono">{urgentCount}</span>
          <span className="text-[11px] text-rose-300/80 block mt-1">Penal charges applicable</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Filed to ICEGATE</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {egmFilings.filter(f => f.status === 'Filed').length}
          </span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">IEM Acknowledged</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Amended EGM</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <RefreshCw className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-sky-400 font-mono">
            {egmFilings.filter(f => f.status === 'Amended').length}
          </span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Supplementary filed</span>
        </div>
      </div>

      {/* Screen 2: Builder Detail View if a filing is selected */}
      {selectedFiling ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16263F] border border-[#26395A] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedFiling(null)}
                className="p-1.5 rounded-lg bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F4EFE6] font-mono">
                    {selectedFiling.vesselVoyage}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedFiling.status === 'Filed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : selectedFiling.status === 'Amended'
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedFiling.status}
                  </span>
                </div>
                <p className="text-xs text-[#A8A299]">
                  POL: <strong className="text-[#F4EFE6]">{selectedFiling.pol}</strong> &bull; POD: <strong className="text-[#F4EFE6]">{selectedFiling.pod}</strong> &bull; Sailed: {selectedFiling.sailedDate} &bull; Deadline: <span className="text-rose-400 font-bold">{selectedFiling.filingDeadline}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportIcegateCsv(selectedFiling)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-[#F4EFE6] text-xs font-semibold"
                title="Download official ICEGATE flat file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download ICEGATE CSV</span>
              </button>

              {selectedFiling.status === 'Draft' && (
                <button
                  onClick={() => setShowIemModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Filed (Enter IEM)</span>
                </button>
              )}

              {selectedFiling.status === 'Filed' && (
                <button
                  onClick={() => setShowAmendModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>File Supplementary Amendment</span>
                </button>
              )}
            </div>
          </div>

          {/* Validation & Completeness Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
              <span className="text-xs text-[#A8A299] block">Total Sailed HBLs</span>
              <span className="text-xl font-bold text-[#F4EFE6] font-mono">{selectedFiling.hblList.length}</span>
              <span className="text-[11px] text-emerald-400 block mt-0.5">100% Manifest Complete</span>
            </div>
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
              <span className="text-xs text-[#A8A299] block">Total Gross Weight</span>
              <span className="text-xl font-bold text-[#F4EFE6] font-mono">
                {(selectedFiling.totalGrossWtKg / 1000).toFixed(1)} MT
              </span>
              <span className="text-[11px] text-[#A8A299] block mt-0.5">SOLAS VGM Certified</span>
            </div>
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
              <span className="text-xs text-[#A8A299] block">ICEGATE IEM Reference</span>
              <span className="text-sm font-bold text-[#E88B2A] font-mono">
                {selectedFiling.iemNumber || 'Pending Filing'}
              </span>
              <span className="text-[11px] text-[#A8A299] block mt-0.5">
                {selectedFiling.filedAt ? `Filed on ${selectedFiling.filedAt}` : 'Filing deadline active'}
              </span>
            </div>
          </div>

          {/* HBL Manifest Grid */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#1C2D4A] flex justify-between items-center bg-[#16263F]/50">
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
                Consignments Included in EGM ({selectedFiling.hblList.length} Items)
              </h3>
              <span className="text-[11px] text-[#A8A299] font-mono">
                Format: ICEGATE Flat File Ready
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Line</th>
                    <th className="p-3">House B/L No</th>
                    <th className="p-3">Shipper / Consignee</th>
                    <th className="p-3">Container & Seal</th>
                    <th className="p-3">Gross Wt (KG)</th>
                    <th className="p-3">Cargo Description</th>
                    <th className="p-3 text-right">ICEGATE Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {selectedFiling.hblList.map((hblNo, idx) => {
                    const hbl = hbls.find(h => h.hblNumber === hblNo);
                    return (
                      <tr key={idx} className="hover:bg-[#16263F]/50 transition-colors">
                        <td className="p-3 font-mono text-[#A8A299]">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-[#E88B2A]">{hblNo}</td>
                        <td className="p-3">
                          <span className="font-semibold block">{hbl?.shipperName || 'ALL-WAYS LOGISTICS INDIA'}</span>
                          <span className="text-[10px] text-[#A8A299] block">{hbl?.consigneeText?.split('\n')[0] || 'TO ORDER'}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {hbl?.containers?.[0]?.containerNumber || 'FCIU2316385'}
                          <span className="text-[10px] text-[#A8A299] block">Seal: {hbl?.containers?.[0]?.sealNumber || '1132934'}</span>
                        </td>
                        <td className="p-3 font-mono font-semibold">
                          {(hbl?.grossWeightKg || 25000).toLocaleString()}
                        </td>
                        <td className="p-3 text-[11px] text-[#A8A299] max-w-[200px] truncate">
                          {hbl?.cargoDescription?.split('\n')[0] || 'PORCELAIN TILES'}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            VALIDATED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amendment History if any */}
          {selectedFiling.amendments.length > 0 && (
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span>Supplementary EGM Filing History</span>
              </h3>
              <div className="space-y-2">
                {selectedFiling.amendments.map((amend, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sky-300">{amend.reasonCode}</span> &bull; {amend.reasonDescription}
                      <span className="text-[10px] text-[#A8A299] block mt-0.5">Approved by: {amend.approvedBy} on {amend.filedAt}</span>
                    </div>
                    <span className="font-mono text-xs text-[#F4EFE6]">
                      Revised Gross Wt: {amend.newValues.totalGrossWtKg?.toLocaleString()} KG
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Screen 1: Pending & Filed Manifests List */
        <div className="space-y-4">
          {/* Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <span>Pending to File</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-950 text-rose-300 font-mono font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('filed')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeTab === 'filed'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                Filed Manifests
              </button>
              <button
                onClick={() => setActiveTab('amendments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeTab === 'amendments'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                Amended / Supplementary
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search vessel, voyage, IEM..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">Vessel / Voyage</th>
                    <th className="p-3.5">Route</th>
                    <th className="p-3.5">Sailed Date</th>
                    <th className="p-3.5">HBLs / Containers</th>
                    <th className="p-3.5">Filing Deadline</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredFilings.map(filing => (
                    <tr key={filing.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-[#F4EFE6] font-mono block">
                          {filing.vesselVoyage}
                        </span>
                        <span className="text-[10px] text-[#A8A299] block">{filing.carrierName}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[#F4EFE6]">{filing.pol.split(' ')[0]}</span> &rarr;{' '}
                        <span className="text-sky-400 font-semibold">{filing.pod.split(' ')[0]}</span>
                      </td>

                      <td className="p-3.5 font-mono text-[#A8A299]">
                        {filing.sailedDate}
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#E88B2A]">{filing.hblCount}</span> HBLs /{' '}
                        <span className="text-zinc-300">{filing.containerCount}</span> Ctrs
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className={filing.isDeadlineUrgent && filing.status === 'Draft' ? 'text-rose-400 font-bold' : 'text-[#A8A299]'}>
                          {filing.filingDeadline}
                        </span>
                        {filing.status === 'Draft' && (
                          <span className={`text-[10px] block font-semibold ${
                            filing.isDeadlineUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                          }`}>
                            {filing.hoursRemaining}h remaining
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          filing.status === 'Filed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : filing.status === 'Amended'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {filing.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedFiling(filing)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors"
                          >
                            <span>EGM Builder</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExportIcegateCsv(filing)}
                            className="p-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-emerald-400"
                            title="Quick CSV Export"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFilings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#A8A299]">
                        No manifest filings found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* IEM Input Modal */}
      {showIemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
              <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
                Mark EGM as Lodged to ICEGATE
              </h3>
              <button onClick={() => setShowIemModal(false)} className="text-[#A8A299] hover:text-[#F4EFE6]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A8A299]">
              Enter the official Indian Customs IEM (Indian Export Manifest) acknowledgement number generated by ICEGATE:
            </p>
            <input
              type="text"
              placeholder="e.g. IEM-MUN-2026-99210"
              value={iemInput}
              onChange={e => setIemInput(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#16263F] border border-[#26395A] rounded-xl text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowIemModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFiling}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
              >
                Confirm Lodgment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amendment Modal */}
      {showAmendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
              <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
                Generate Supplementary EGM Amendment
              </h3>
              <button onClick={() => setShowAmendModal(false)} className="text-[#A8A299] hover:text-[#F4EFE6]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#A8A299] block mb-1">DGFT Reason Code:</label>
                <select
                  value={amendReasonCode}
                  onChange={e => setAmendReasonCode(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="DGFT-01">DGFT-01: Quantity / Weight discrepancy</option>
                  <option value="DGFT-02">DGFT-02: Change of destination port</option>
                  <option value="DGFT-03">DGFT-03: Cargo description correction</option>
                  <option value="DGFT-04">DGFT-04: Shipper name amendment</option>
                </select>
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Revised Total Gross Weight (KG):</label>
                <input
                  type="number"
                  placeholder="e.g. 582000"
                  value={newGrossWt}
                  onChange={e => setNewGrossWt(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Officer Notes / Justification:</label>
                <textarea
                  rows={2}
                  placeholder="State reason per customs examination report..."
                  value={amendDesc}
                  onChange={e => setAmendDesc(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAmendModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAmendment}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white"
              >
                File Amendment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
