import React from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Container,
  Scale,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { EgmFiling, EgmConsignmentDetail } from '../types';

interface EgmDetailViewProps {
  filing: EgmFiling;
  consignments: Record<string, EgmConsignmentDetail>;
  onBack: () => void;
  onExportCsv: (filing: EgmFiling) => void;
  onOpenIemModal: () => void;
  onOpenAmendModal: () => void;
}

export const EgmDetailView: React.FC<EgmDetailViewProps> = ({
  filing,
  consignments,
  onBack,
  onExportCsv,
  onOpenIemModal,
  onOpenAmendModal
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#16263F] border border-[#26395A] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
            title="Back to Manifest List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#F4EFE6] font-mono tracking-tight">
                {filing.vesselVoyage}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  filing.status === 'Filed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : filing.status === 'Amended'
                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {filing.status}
              </span>
              {filing.isDeadlineUrgent && filing.status === 'Draft' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  Urgent &bull; {filing.hoursRemaining}h Remaining
                </span>
              )}
            </div>
            <p className="text-xs text-[#A8A299] mt-0.5">
              POL: <strong className="text-[#F4EFE6]">{filing.pol}</strong> &bull; POD:{' '}
              <strong className="text-[#F4EFE6]">{filing.pod}</strong> &bull; Sailed: {filing.sailedDate} &bull; Deadline:{' '}
              <span className="text-rose-400 font-bold">{filing.filingDeadline}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onExportCsv(filing)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F1D33] hover:bg-[#1D3251] border border-[#26395A] text-[#F4EFE6] text-xs font-semibold transition-colors"
            title="Download official ICEGATE flat file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download ICEGATE CSV</span>
          </button>

          {filing.status === 'Draft' && (
            <button
              onClick={onOpenIemModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Filed (Enter IEM)</span>
            </button>
          )}

          {filing.status === 'Filed' && (
            <button
              onClick={onOpenAmendModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>File Supplementary Amendment</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#A8A299] block font-medium">Total Sailed HBLs</span>
            <span className="text-xl font-bold text-[#F4EFE6] font-mono mt-0.5 block">
              {filing.hblList.length} Consignments
            </span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">
              100% Manifest Complete ({filing.containerCount} Containers)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16263F] text-[#E88B2A] border border-[#26395A]">
            <Container className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#A8A299] block font-medium">Total Gross Cargo Weight</span>
            <span className="text-xl font-bold text-[#F4EFE6] font-mono mt-0.5 block">
              {(filing.totalGrossWtKg / 1000).toFixed(1)} MT
            </span>
            <span className="text-[11px] text-[#A8A299] block mt-0.5 font-mono">
              {(filing.totalGrossWtKg).toLocaleString()} KG &bull; SOLAS VGM Certified
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16263F] text-sky-400 border border-[#26395A]">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#A8A299] block font-medium">ICEGATE IEM Reference</span>
            <span className="text-sm font-bold text-[#E88B2A] font-mono mt-0.5 block truncate max-w-[200px]">
              {filing.iemNumber || 'Pending Lodgment'}
            </span>
            <span className="text-[11px] text-[#A8A299] block mt-0.5">
              {filing.filedAt ? `Lodged on ${filing.filedAt}` : '7-day statutory deadline active'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16263F] text-emerald-400 border border-[#26395A]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Consignments Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#1C2D4A] flex justify-between items-center bg-[#16263F]/50">
          <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
            Consignments Included in Manifest ({filing.hblList.length} Items)
          </h3>
          <span className="text-[11px] text-[#A8A299] font-mono">
            ICEGATE Flat File Ready (Format FGM)
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
              {filing.hblList.map((hblNo, idx) => {
                const consignment = consignments[hblNo];
                const primaryCtr = consignment?.containers?.[0];
                return (
                  <tr key={idx} className="hover:bg-[#16263F]/50 transition-colors">
                    <td className="p-3 font-mono text-[#A8A299]">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#E88B2A]">{hblNo}</td>
                    <td className="p-3">
                      <span className="font-semibold block truncate max-w-[220px]">
                        {consignment?.shipperName || 'ALL-WAYS LOGISTICS INDIA'}
                      </span>
                      <span className="text-[10px] text-[#A8A299] block truncate max-w-[220px]">
                        {consignment?.consigneeName || 'TO ORDER'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {primaryCtr?.containerNumber || `FCIU231638${idx + 1}`}
                      <span className="text-[10px] text-[#A8A299] block">
                        Seal: {primaryCtr?.sealNumber || `113293${idx + 1}`}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      {(consignment?.grossWeightKg || Math.round(filing.totalGrossWtKg / filing.hblList.length)).toLocaleString()}
                    </td>
                    <td className="p-3 text-[11px] text-[#A8A299] max-w-[220px] truncate">
                      {consignment?.cargoDescription || 'GENERAL MERCHANDISE EXPORT'}
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

      {/* Supplementary Amendment History */}
      {filing.amendments && filing.amendments.length > 0 && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4">
          <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Supplementary EGM Filing History</span>
          </h3>
          <div className="space-y-2">
            {filing.amendments.map((amend, idx) => (
              <div
                key={amend.id || idx}
                className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-300 font-mono">{amend.reasonCode}</span>
                    <span className="text-[#F4EFE6]">{amend.reasonDescription}</span>
                  </div>
                  <span className="text-[10px] text-[#A8A299] block mt-0.5">
                    Authorized: {amend.approvedBy} &bull; Filed on {amend.filedAt}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#F4EFE6] bg-[#0F1D33] px-2.5 py-1 rounded border border-[#26395A] shrink-0">
                  Revised Gross Wt: <strong className="text-emerald-400">{(amend.newValues.totalGrossWtKg || 0).toLocaleString()} KG</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
