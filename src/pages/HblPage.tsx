import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HBL } from '../types';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Eye,
  Send,
  CheckCircle2,
  Search,
  Filter,
  ShieldCheck,
  MessageSquare,
  Ship,
  DollarSign,
  Boxes,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { formatUSD } from '../utils/formatters';
import { WhatsAppPreviewModal } from '../components/common/WhatsAppPreviewModal';

interface HblPageProps {
  onOpenNewHbl: () => void;
}

export const HblPage: React.FC<HblPageProps> = ({ onOpenNewHbl }) => {
  const { hbls, updateHBL, setActivePrintDoc, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHblForWa, setSelectedHblForWa] = useState<HBL | null>(null);
  const [viewParticularsHbl, setViewParticularsHbl] = useState<HBL | null>(null);

  const rawFilteredHbls = hbls.filter(h => {
    const matchSearch =
      h.hblNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.oceanVessel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.portOfDischarge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.mblNumber && h.mblNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || h.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const filteredHbls = rawFilteredHbls.filter((h, idx, self) =>
    idx === self.findIndex(t => (t.id && t.id === h.id) || (t.hblNumber && t.hblNumber === h.hblNumber))
  );

  // KPI Calculations
  const totalHblsCount = hbls.length;
  const originalsReleasedCount = hbls.filter(h => h.status === 'Original Released' || h.status === 'Telex Released').length;
  const totalFreightUSD = hbls.reduce((sum, h) => sum + (h.totalFreightUSD || 0), 0);
  const surrenderedCount = hbls.filter(h => h.status === 'Surrendered' || h.status === 'Telex Released').length;

  const handleStatusChange = (hblId: string, newStatus: HBL['status']) => {
    updateHBL(hblId, { status: newStatus });
    showToast('success', 'HBL Status Updated', `Bill of Lading status changed to ${newStatus}.`);
  };

  const exportHblManifestCsv = () => {
    const headers = 'HBL Number,Parent MBL,Status,Shipper,Consignee,Vessel,Voyage,POL,POD,Place Of Delivery,Containers & Seals,Packages,Gross Weight (KG),Volume (CBM),Freight Term,Total Freight (USD)\n';
    const rows = filteredHbls.map(h => 
      `"${h.hblNumber}","${h.mblNumber || ''}","${h.status}","${h.shipperName.replace(/"/g, '""')}","${(h.consigneeText || '').replace(/"/g, '""').replace(/\n/g, ' ')}","${h.oceanVessel}","${h.voyageNo}","${h.portOfLoading}","${h.portOfDischarge}","${h.placeOfDelivery}","${h.containerAndSeals.replace(/\n/g, ' ')}","${h.packageCountAndType}","${h.grossWeightKg}","${h.measurementCbm}","${h.freightTerm}","${h.totalFreightUSD}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HBL_Manifest_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('success', 'Manifest Exported', 'HBL Cargo Manifest CSV saved to your computer.');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#E88B2A]" />
              House Bill of Lading (HBL) Register
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800 hidden sm:inline-block">
              MTO DG SHIPPING CERTIFIED
            </span>
          </div>
          <p className="text-xs text-[#A8A299] mt-0.5">
            {filteredHbls.length} Active Bills of Lading • Carrier: MAPS Freight Solutions Pvt Ltd (Gandhidham / Mundra)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportHblManifestCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            title="Export full HBL manifest data to CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#E88B2A]" />
            Export Manifest (CSV)
          </button>

          <button
            onClick={onOpenNewHbl}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + Issue New HBL
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Total Bills Issued</span>
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">{totalHblsCount} Documents</span>
          </div>
          <FileText className="w-5 h-5 text-[#E88B2A]" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">3-Originals Released</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{originalsReleasedCount} Dispatched</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Ocean Freight Handled</span>
            <span className="text-xl font-bold font-mono text-sky-400">{formatUSD(totalFreightUSD)}</span>
          </div>
          <DollarSign className="w-5 h-5 text-sky-400" />
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">Surrendered / Telex</span>
            <span className="text-xl font-bold font-mono text-purple-400">{surrenderedCount} Released</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search B/L Number, shipper, consignee, vessel, destination, MBL..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6] font-semibold"
          >
            <option value="all">All HBL Statuses</option>
            <option value="issued">Issued</option>
            <option value="original released">Original Released</option>
            <option value="draft">Draft</option>
            <option value="surrendered">Surrendered</option>
            <option value="telex released">Telex Released</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">HBL Number</th>
                <th className="p-3">Status</th>
                <th className="p-3">Shipper / Exporter</th>
                <th className="p-3">Vessel & Voyage</th>
                <th className="p-3">Routing (POL &rarr; POD)</th>
                <th className="p-3">Freight Term</th>
                <th className="p-3 text-right">Freight (USD)</th>
                <th className="p-3">Originals</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] font-mono">
              {filteredHbls.map((hbl, idx) => (
                <tr key={`${hbl.id || hbl.hblNumber}-${idx}`} className="hover:bg-[#16263F]/50 transition-colors">
                  <td className="p-3 font-bold text-[#E88B2A]">
                    <div className="flex items-center gap-1.5">
                      <span>{hbl.hblNumber}</span>
                    </div>
                    <span className="block text-[10px] font-sans text-[#A8A299]">
                      Parent MBL: {hbl.mblNumber || 'MEDUMUN782910'}
                    </span>
                  </td>

                  <td className="p-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        hbl.status === 'Issued'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : hbl.status === 'Original Released'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : hbl.status === 'Surrendered' || hbl.status === 'Telex Released'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {hbl.status}
                    </span>
                  </td>

                  <td className="p-3 font-sans font-medium text-[#F4EFE6] max-w-[170px] truncate">
                    {hbl.shipperName}
                    <span className="text-[10px] text-[#A8A299] block font-normal truncate">
                      {hbl.placeOfReceipt}
                    </span>
                  </td>

                  <td className="p-3 font-sans text-slate-300">
                    <span className="font-semibold text-[#F4EFE6]">{hbl.oceanVessel}</span>
                    <span className="text-[10px] text-[#A8A299] block">Voy: {hbl.voyageNo}</span>
                  </td>

                  <td className="p-3 font-sans">
                    <span className="text-[#F4EFE6]">{hbl.portOfLoading.split(',')[0]}</span> &rarr;{' '}
                    <span className="text-sky-400 font-bold">{hbl.portOfDischarge.split(',')[0]}</span>
                    <span className="text-[10px] text-[#A8A299] block">{hbl.placeOfDelivery.split(',')[0]}</span>
                  </td>

                  <td className="p-3 font-sans text-zinc-300">
                    <span className="px-1.5 py-0.2 rounded bg-[#16263F] border border-[#26395A] text-[10px] font-semibold">
                      {hbl.freightTerm}
                    </span>
                  </td>

                  <td className="p-3 text-right font-bold text-emerald-400">
                    {formatUSD(hbl.totalFreightUSD)}
                  </td>

                  <td className="p-3 font-sans text-zinc-400 text-center">
                    <span className="font-mono text-[#F4EFE6] font-bold">3 Orig</span> / 3 Copy
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      {/* View & Download DO-style button for HBL */}
                      <button
                        onClick={() => setActivePrintDoc({ type: 'HBL', data: hbl })}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-colors shadow-sm"
                        title="View and Download official House Bill of Lading PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>View & Download HBL</span>
                      </button>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => setSelectedHblForWa(hbl)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors"
                        title="Preview & Send WhatsApp notification with HBL PDF"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Particulars Quick View */}
                      <button
                        onClick={() => setViewParticularsHbl(hbl)}
                        className="p-1 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
                        title="View Full B/L Particulars"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Status Transition Button */}
                      {hbl.status === 'Issued' && (
                        <button
                          onClick={() => handleStatusChange(hbl.id, 'Original Released')}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-[#16263F] hover:bg-[#1D3251] text-emerald-400 border border-[#26395A]"
                        >
                          Release
                        </button>
                      )}

                      {hbl.status === 'Original Released' && (
                        <button
                          onClick={() => handleStatusChange(hbl.id, 'Telex Released')}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-[#16263F] hover:bg-[#1D3251] text-purple-400 border border-[#26395A]"
                        >
                          Telex
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B/L Particulars Drawer Modal */}
      {viewParticularsHbl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E88B2A]" />
                <h3 className="text-base font-bold text-[#F4EFE6]">
                  House B/L Particulars & Carrier Manifest
                </h3>
              </div>
              <button
                onClick={() => setViewParticularsHbl(null)}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] font-bold uppercase block">HBL Number</span>
                <span className="font-mono text-base font-bold text-[#E88B2A]">{viewParticularsHbl.hblNumber}</span>
              </div>
              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] font-bold uppercase block">Parent MBL</span>
                <span className="font-mono text-base font-bold text-[#F4EFE6]">{viewParticularsHbl.mblNumber || 'MEDUMUN782910'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-1">
                <span className="text-[10px] text-[#A8A299] font-bold uppercase block">Shipper Details</span>
                <p className="font-bold text-[#F4EFE6]">{viewParticularsHbl.shipperName}</p>
                <p className="text-[#A8A299] whitespace-pre-line">{viewParticularsHbl.shipperAddress}</p>
              </div>

              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-1">
                <span className="text-[10px] text-[#A8A299] font-bold uppercase block">Consignee</span>
                <p className="font-bold text-[#F4EFE6]">{viewParticularsHbl.consigneeText}</p>
              </div>

              <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-1">
                <span className="text-[10px] text-[#A8A299] font-bold uppercase block">Container & Seal Particulars</span>
                <p className="font-mono text-[#E88B2A] font-bold">{viewParticularsHbl.containerAndSeals}</p>
                <p className="text-[#F4EFE6]">{viewParticularsHbl.packageCountAndType} • {viewParticularsHbl.cargoDescription}</p>
                <p className="font-mono text-[#A8A299]">Gross Weight: {viewParticularsHbl.grossWeightKg.toLocaleString()} KG • Volume: {viewParticularsHbl.measurementCbm} CBM</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = viewParticularsHbl;
                  setViewParticularsHbl(null);
                  setActivePrintDoc({ type: 'HBL', data: target });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                <Download className="w-4 h-4" />
                View & Download HBL PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal for HBL */}
      {selectedHblForWa && (
        <WhatsAppPreviewModal
          isOpen={!!selectedHblForWa}
          onClose={() => setSelectedHblForWa(null)}
          recipientName={selectedHblForWa.shipperName}
          shipmentId={selectedHblForWa.shipmentId}
          docTitle={`House B/L ${selectedHblForWa.hblNumber}`}
          defaultMessage={`Dear ${selectedHblForWa.shipperName},\n\nYour House Bill of Lading *${selectedHblForWa.hblNumber}* has been issued by MAPS Freight Solutions.\n\n🚢 *Vessel:* ${selectedHblForWa.oceanVessel} (${selectedHblForWa.voyageNo})\n📍 *Route:* ${selectedHblForWa.portOfLoading} ➔ ${selectedHblForWa.portOfDischarge}\n📦 *Containers & Seals:* ${selectedHblForWa.containerAndSeals}\n📄 *Status:* ${selectedHblForWa.status}\n\nYou can track and download your verified HBL document here:\nhttps://mapsnvocc.in/tracking/${selectedHblForWa.shipmentId}\n\nWarm regards,\n*MAPS Freight Solutions Pvt Ltd, Gandhidham*`}
        />
      )}
    </div>
  );
};
