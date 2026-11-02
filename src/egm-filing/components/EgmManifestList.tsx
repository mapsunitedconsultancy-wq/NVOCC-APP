import React from 'react';
import { Search, ChevronRight, Download, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { EgmFiling } from '../types';

interface EgmManifestListProps {
  filings: EgmFiling[];
  activeTab: 'pending' | 'filed' | 'amendments';
  setActiveTab: (tab: 'pending' | 'filed' | 'amendments') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingCount: number;
  urgentCount: number;
  onSelectFiling: (filing: EgmFiling) => void;
  onExportCsv: (filing: EgmFiling) => void;
}

export const EgmManifestList: React.FC<EgmManifestListProps> = ({
  filings,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  pendingCount,
  urgentCount,
  onSelectFiling,
  onExportCsv
}) => {
  return (
    <div className="space-y-4">
      {/* Tabs & Search Controls */}
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

      {/* Manifests Table */}
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
              {filings.map(filing => (
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
                    <span className={filing.status === 'Draft' ? 'text-amber-300 font-bold' : 'text-[#A8A299]'}>
                      {filing.filingDeadline}
                    </span>
                    {filing.status === 'Draft' && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <span className="text-[10px] text-zinc-400 font-semibold font-mono">
                          ⏱ {filing.hoursRemaining}h remaining
                        </span>
                        {filing.hoursRemaining <= 24 ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-700 animate-pulse w-fit font-sans">
                            1d CRITICAL ALERT: Filing Overdue Soon
                          </span>
                        ) : filing.hoursRemaining <= 72 ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700 w-fit font-sans">
                            3d WARNING: ICEGATE Lodging Due
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-800 w-fit font-sans">
                            5d ALERT: On Track (Day 2 of 7)
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        filing.status === 'Filed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : filing.status === 'Amended'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {filing.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectFiling(filing)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors"
                      >
                        <span>EGM Builder</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onExportCsv(filing)}
                        className="p-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-emerald-400 transition-colors"
                        title="Quick CSV Export"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filings.length === 0 && (
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
  );
};
