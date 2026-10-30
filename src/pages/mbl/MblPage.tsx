import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MBL } from '../../types';
import {
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Printer,
  Download,
  Search,
  Filter,
  Ship,
  Boxes,
  DollarSign,
  Clock,
  Radio,
  Check,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { formatUSD } from '../../utils/formatters';
import { RecordMblModal } from './RecordMblModal';
import { WhatsAppPreviewModal } from '../../components/common/WhatsAppPreviewModal';

export const MblPage: React.FC = () => {
  const { mbls, updateMBL, setActivePrintDoc, showToast, hbls } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [reconcileMbl, setReconcileMbl] = useState<MBL | null>(null);
  const [ediMbl, setEdiMbl] = useState<MBL | null>(null);
  const [selectedMblForWa, setSelectedMblForWa] = useState<MBL | null>(null);

  // Filtered MBL list
  const filteredMbls = mbls.filter(m => {
    const matchesSearch =
      m.mblNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.carrierBookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.vesselVoyage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.pod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.containerNumbers.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.linkedHbls.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCarrier =
      carrierFilter === 'ALL' ||
      m.carrierName.toLowerCase().includes(carrierFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      m.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCarrier && matchesStatus;
  });

  // KPI Metrics
  const totalTeuCount = mbls.reduce((sum, m) => sum + (m.totalTeu || 0), 0);
  const totalFreightCommitted = mbls.reduce((sum, m) => sum + (m.freightAmountUSD || 0), 0);
  const originalsReceivedCount = mbls.filter(m => m.status === 'Originals Received' || m.status === 'Telex Released').length;

  const getCarrierBadge = (carrierName: string) => {
    const c = carrierName.toLowerCase();
    if (c.includes('msc')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> MSC
        </span>
      );
    }
    if (c.includes('maersk')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 text-[10px] font-bold">
          <span className="text-sky-400">★</span> MAERSK
        </span>
      );
    }
    if (c.includes('cma')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-bold">
          <span className="text-rose-400 font-bold">⚓</span> CMA CGM
        </span>
      );
    }
    if (c.includes('hapag')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700 text-[10px] font-bold">
          <span className="text-orange-400">◆</span> HAPAG
        </span>
      );
    }
    if (c.includes('one')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700 text-[10px] font-bold">
          <span className="text-pink-400">●</span> ONE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#16263F] text-[#A8A299] border border-[#26395A] text-[10px] font-bold">
        {carrierName.split(' ')[0]}
      </span>
    );
  };

  const getStatusBadge = (status: MBL['status']) => {
    switch (status) {
      case 'Originals Received':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Telex Released':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Issued':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Surrendered':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Carrier Draft':
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const exportMblManifestCsv = () => {
    const headers = 'MBL Number,Carrier,SCAC,Booking Ref,Vessel & Voyage,POL,POD,ETD,ETA,Total TEU,Gross Wt (KG),Freight (USD),Payment Status,Status,Containers,Linked HBLs\n';
    const rows = filteredMbls.map(m => 
      `"${m.mblNumber}","${m.carrierName}","${m.carrierScac || ''}","${m.carrierBookingRef}","${m.vesselVoyage}","${m.pol}","${m.pod}","${m.etd}","${m.eta}","${m.totalTeu}","${m.totalWeightKg}","${m.freightAmountUSD}","${m.paymentStatus}","${m.status}","${m.containerNumbers.join('; ')}","${m.linkedHbls.join('; ')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carrier_MBL_Manifest_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('success', 'Carrier Manifest Exported', 'Downloaded full MBL ocean manifest in CSV format.');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#E88B2A]" />
              Master Bill of Lading (MBL) Carrier Operations
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800 hidden sm:inline-block">
              100% RECONCILED
            </span>
          </div>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Liner booking contracts, ocean carrier B/L issuance, container manifest reconciliation, and telex release endorsements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportMblManifestCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            title="Export carrier MBL list and manifest to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#E88B2A]" />
            Export Manifest (CSV)
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + Record Carrier MBL
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Carrier MBLs</span>
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">{mbls.length} Contracts</span>
          </div>
          <Ship className="w-5 h-5 text-[#E88B2A]" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Total Slot Capacity</span>
            <span className="text-xl font-bold font-mono text-sky-400">{totalTeuCount} TEUs</span>
          </div>
          <Boxes className="w-5 h-5 text-sky-400" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Freight Committed</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{formatUSD(totalFreightCommitted)}</span>
          </div>
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Originals / Telex</span>
            <span className="text-xl font-bold font-mono text-purple-400">{originalsReceivedCount} Cleared</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search MBL number, carrier, booking ref, vessel, container, or linked HBL..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Carrier Filter */}
          <select
            value={carrierFilter}
            onChange={e => setCarrierFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6] font-semibold"
          >
            <option value="ALL">All Shipping Lines</option>
            <option value="MSC">MSC (Mediterranean Shipping)</option>
            <option value="Maersk">Maersk Line</option>
            <option value="CMA">CMA CGM</option>
            <option value="Hapag">Hapag-Lloyd</option>
            <option value="ONE">ONE (Ocean Network)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6] font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Carrier Draft">Carrier Draft</option>
            <option value="Issued">Issued</option>
            <option value="Originals Received">Originals Received</option>
            <option value="Surrendered">Surrendered</option>
            <option value="Telex Released">Telex Released</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-[#16263F] border border-[#26395A] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#0F1D33] text-[#E88B2A]' : 'text-[#A8A299] hover:text-[#F4EFE6]'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-[#0F1D33] text-[#E88B2A]' : 'text-[#A8A299] hover:text-[#F4EFE6]'}`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
         GRID CARDS VIEW
         ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMbls.map(mbl => (
            <div
              key={mbl.id}
              className="bg-[#0F1D33] border border-[#26395A] hover:border-[#E88B2A]/50 transition-all rounded-xl p-4 space-y-3.5 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#1C2D4A]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#E88B2A]">
                      {mbl.mblNumber}
                    </span>
                    {getCarrierBadge(mbl.carrierName)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(mbl.status)}`}>
                    {mbl.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-2.5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#A8A299]">Vessel & Voyage:</span>
                    <span className="font-bold text-[#F4EFE6] font-mono text-right">{mbl.vesselVoyage}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[#A8A299]">Ocean Route:</span>
                    <span className="font-semibold text-sky-400 text-right">
                      {mbl.pol.split(' ')[0]} &rarr; {mbl.pod.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-[#A8A299] font-sans">Booking Ref:</span>
                    <span className="text-[#F4EFE6]">{mbl.carrierBookingRef}</span>
                  </div>

                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-[#A8A299] font-sans">Ocean Freight:</span>
                    <span className="font-bold text-emerald-400">
                      {formatUSD(mbl.freightAmountUSD)} ({mbl.paymentStatus})
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-[#A8A299] font-sans">Slot / Weight:</span>
                    <span className="text-[#F4EFE6]">
                      {mbl.totalTeu} TEU ({mbl.totalWeightKg?.toLocaleString()} KG)
                    </span>
                  </div>
                </div>

                {/* Container Tags */}
                <div className="mt-3 pt-2 border-t border-[#1C2D4A] space-y-1">
                  <span className="font-bold text-[#A8A299] uppercase text-[9.5px] block">
                    Containers ({mbl.containerNumbers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mbl.containerNumbers.map(c => (
                      <span
                        key={c}
                        className="px-1.5 py-0.5 rounded bg-[#16263F] border border-[#26395A] text-[#F4EFE6] font-mono text-[10px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Linked HBLs */}
                <div className="mt-2 pt-2 border-t border-[#1C2D4A] space-y-1">
                  <span className="font-bold text-[#A8A299] uppercase text-[9.5px] block">
                    Linked House Bills of Lading:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mbl.linkedHbls.map((h, hIdx) => (
                      <span
                        key={`${h}-${hIdx}`}
                        className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800 text-[#E88B2A] font-mono font-semibold text-[10px]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1C2D4A] space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setActivePrintDoc({ type: 'MBL', data: mbl })}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
                    title="View, Print and Download official carrier Master Bill of Lading"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Print MBL</span>
                  </button>

                  <button
                    onClick={() => setReconcileMbl(mbl)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold text-xs transition-colors flex items-center gap-1"
                    title="Audit HBL weights vs Carrier MBL"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audit</span>
                  </button>

                  <button
                    onClick={() => setEdiMbl(mbl)}
                    className="p-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-sky-400 border border-[#26395A] transition-colors"
                    title="Track Liner EDI 315 Telemetry"
                  >
                    <Radio className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedMblForWa(mbl)}
                    className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors"
                    title="Share MBL particulars with Overseas Agent via WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status progression quick switch */}
                <div className="flex items-center justify-between text-[10px] text-[#A8A299] pt-1 border-t border-[#1C2D4A]/60">
                  <span>Change Status:</span>
                  <div className="flex items-center gap-1">
                    {mbl.status !== 'Originals Received' && (
                      <button
                        onClick={() => updateMBL(mbl.id, { status: 'Originals Received' })}
                        className="text-emerald-400 hover:underline font-semibold"
                      >
                        Originals Received
                      </button>
                    )}
                    {mbl.status === 'Originals Received' && (
                      <button
                        onClick={() => updateMBL(mbl.id, { status: 'Telex Released' })}
                        className="text-purple-400 hover:underline font-semibold"
                      >
                        Telex Release
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         OPERATIONS TABLE VIEW
         ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">MBL Number</th>
                  <th className="p-3">Carrier Line</th>
                  <th className="p-3">Vessel & Voyage</th>
                  <th className="p-3">Route (POL &rarr; POD)</th>
                  <th className="p-3">TEU / Wt</th>
                  <th className="p-3">Freight (USD)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] font-mono">
                {filteredMbls.map(mbl => (
                  <tr key={mbl.id} className="hover:bg-[#16263F]/50 transition-colors">
                    <td className="p-3 font-bold text-[#E88B2A]">
                      {mbl.mblNumber}
                      <span className="text-[10px] text-[#A8A299] font-normal block font-sans">
                        BKG: {mbl.carrierBookingRef}
                      </span>
                    </td>

                    <td className="p-3 font-sans">
                      {getCarrierBadge(mbl.carrierName)}
                    </td>

                    <td className="p-3 font-sans text-slate-300">
                      {mbl.vesselVoyage}
                    </td>

                    <td className="p-3 font-sans">
                      <span className="text-[#F4EFE6]">{mbl.pol.split(' ')[0]}</span> &rarr;{' '}
                      <span className="text-sky-400 font-bold">{mbl.pod.split(' ')[0]}</span>
                    </td>

                    <td className="p-3">
                      {mbl.totalTeu} TEU
                      <span className="text-[10px] text-[#A8A299] block font-sans">
                        {mbl.totalWeightKg?.toLocaleString()} KG
                      </span>
                    </td>

                    <td className="p-3 font-bold text-emerald-400">
                      {formatUSD(mbl.freightAmountUSD)}
                      <span className="text-[10px] text-[#A8A299] block font-sans font-normal">
                        {mbl.paymentStatus}
                      </span>
                    </td>

                    <td className="p-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(mbl.status)}`}>
                        {mbl.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setActivePrintDoc({ type: 'MBL', data: mbl })}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#E88B2A]/20 hover:bg-[#E88B2A] text-[#E88B2A] hover:text-[#0A1628] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View
                        </button>

                        <button
                          onClick={() => setReconcileMbl(mbl)}
                          className="px-2 py-1 text-xs font-medium rounded bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A]"
                        >
                          Reconcile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         RECONCILIATION AUDIT MODAL
         ══════════════════════════════════════════════════════════════════════════ */}
      {reconcileMbl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-[#F4EFE6]">
                  MBL Manifest Reconciliation & Weight Audit
                </h3>
              </div>
              <button
                onClick={() => setReconcileMbl(null)}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#16263F] p-3.5 rounded-xl border border-[#26395A] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A8A299]">Master B/L:</span>
                <span className="font-mono font-bold text-[#E88B2A]">{reconcileMbl.mblNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A8A299]">Shipping Line:</span>
                <span className="font-bold text-[#F4EFE6]">{reconcileMbl.carrierName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A8A299]">Carrier VGM Weight:</span>
                <span className="font-mono font-bold text-[#F4EFE6]">{reconcileMbl.totalWeightKg.toLocaleString()} KG</span>
              </div>
            </div>

            {/* Reconciliation Comparison Table */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#A8A299] uppercase tracking-wider block">
                Audited Linked House Bills of Lading:
              </span>
              <div className="border border-[#26395A] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A]">
                    <tr>
                      <th className="p-2.5">HBL Number</th>
                      <th className="p-2.5">Shipper</th>
                      <th className="p-2.5 text-right">Declared Wt</th>
                      <th className="p-2.5 text-center">Variance</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2D4A] font-mono">
                    {reconcileMbl.linkedHbls.map((hblNo, rIdx) => (
                      <tr key={`${hblNo}-${rIdx}`} className="hover:bg-[#16263F]/50">
                        <td className="p-2.5 text-[#E88B2A] font-bold">{hblNo}</td>
                        <td className="p-2.5 font-sans">Krishna Ceramics</td>
                        <td className="p-2.5 text-right font-bold text-[#F4EFE6]">{reconcileMbl.totalWeightKg.toLocaleString()} KG</td>
                        <td className="p-2.5 text-center text-emerald-400 font-bold">0 KG (0.0%)</td>
                        <td className="p-2.5 text-center font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                            Reconciled ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                onClick={() => setReconcileMbl(null)}
                className="px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         CARRIER EDI TELEMETRY MODAL
         ══════════════════════════════════════════════════════════════════════════ */}
      {ediMbl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
                <h3 className="text-base font-bold text-[#F4EFE6]">
                  Liner EDI 315 / 304 Telemetry Sync
                </h3>
              </div>
              <button
                onClick={() => setEdiMbl(null)}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-1">
                <span className="text-[10px] text-[#A8A299] uppercase font-bold block">Live Carrier Handshake:</span>
                <p className="font-mono text-[#F4EFE6]">Carrier API: <strong>{ediMbl.carrierName}</strong></p>
                <p className="font-mono text-[#E88B2A]">MBL: {ediMbl.mblNumber} • Booking: {ediMbl.carrierBookingRef}</p>
                <p className="text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Direct APSEZ Mundra Port Terminal Link Verified
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-sky-500 pl-3">
                <div>
                  <span className="text-sky-400 font-bold block">EDI 304 — Shipping Instruction Acknowledged</span>
                  <span className="text-[10px] text-[#A8A299]">Timestamp: 14 Oct 2026 18:22 IST</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">EDI 315 — Container Gate-In Confirmed at APSEZ CT-2</span>
                  <span className="text-[10px] text-[#A8A299]">EIR #EIR-MUN-99214 • Seal Verified</span>
                </div>
                <div>
                  <span className="text-[#F4EFE6] font-bold block">EDI 310 — Ocean Manifest Draft Uploaded</span>
                  <span className="text-[10px] text-[#A8A299]">Customs LEO Matched with ICEGATE</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end">
              <button
                onClick={() => setEdiMbl(null)}
                className="px-4 py-2 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] font-semibold text-xs border border-[#26395A]"
              >
                Close EDI Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record MBL Modal */}
      <RecordMblModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      {/* WhatsApp Preview Modal for MBL */}
      {selectedMblForWa && (
        <WhatsAppPreviewModal
          isOpen={!!selectedMblForWa}
          onClose={() => setSelectedMblForWa(null)}
          recipientName={`Destination Agent (${selectedMblForWa.pod.split(' ')[0]})`}
          phoneNumber="+49 40 3344 550"
          docTitle={`Master B/L ${selectedMblForWa.mblNumber}`}
          defaultMessage={`Dear Overseas Agency Desk,\n\nPlease find Master Bill of Lading particulars for upcoming vessel arrival:\n\n🚢 *Carrier & Vessel:* ${selectedMblForWa.carrierName} - ${selectedMblForWa.vesselVoyage}\n📄 *Master B/L:* ${selectedMblForWa.mblNumber} (Booking: ${selectedMblForWa.carrierBookingRef})\n📍 *Route:* ${selectedMblForWa.pol} ➔ ${selectedMblForWa.pod}\n📦 *Containers:* ${selectedMblForWa.containerNumbers.join(', ')}\n📑 *Linked House Bs/L:* ${selectedMblForWa.linkedHbls.join(', ')}\n💰 *Ocean Freight:* ${formatUSD(selectedMblForWa.freightAmountUSD)} (${selectedMblForWa.paymentStatus})\n✅ *Status:* ${selectedMblForWa.status}\n\nYou can access the verified Master Carrier manifest here:\nhttps://mapsnvocc.in/tracking/${selectedMblForWa.mblNumber}\n\nWarm regards,\n*MAPS Freight Operations Desk, Gandhidham*`}
        />
      )}
    </div>
  );
};
