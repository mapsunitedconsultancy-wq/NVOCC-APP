import React from 'react';
import {
  Ship,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Package,
  Download
} from 'lucide-react';
import { EgmFiling, EgmConsignmentDetail, NewManifestPayload } from '../types';
import { useEgmManager } from '../hooks/useEgmManager';
import { EgmManifestList } from './EgmManifestList';
import { EgmDetailView } from './EgmDetailView';
import { IemLodgmentModal } from './IemLodgmentModal';
import { SupplementaryAmendmentModal } from './SupplementaryAmendmentModal';
import { NewManifestModal } from './NewManifestModal';

export interface EgmFilingModuleProps {
  initialFilings?: EgmFiling[];
  initialConsignments?: Record<string, EgmConsignmentDetail>;
  currentUser?: { name: string; title: string };
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onDownloadPackage?: () => void;
  onFilingsChange?: (filings: EgmFiling[]) => void;
  className?: string;
}

export const EgmFilingModule: React.FC<EgmFilingModuleProps> = ({
  initialFilings,
  initialConsignments,
  currentUser,
  onToast,
  onDownloadPackage,
  onFilingsChange,
  className = ''
}) => {
  const {
    selectedFiling,
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
    consignments,
    // Modals
    showIemModal,
    setShowIemModal,
    showAmendModal,
    setShowAmendModal,
    showNewManifestModal,
    setShowNewManifestModal,
    // Actions
    addNewManifest,
    fileWithIem,
    fileSupplementaryAmendment,
    exportCsv
  } = useEgmManager({
    initialFilings,
    initialConsignments,
    currentUser,
    onToast,
    onFilingsChange
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30">
            <Ship className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
              Indian Customs ICEGATE EGM Compliance &bull; Mandatory 7-Day Post-Sailing Filing (Sec 41)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onDownloadPackage && (
            <button
              onClick={onDownloadPackage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-[#F4EFE6] text-xs font-semibold transition-colors"
              title="Download standalone EGM code bundle for integration"
            >
              <Package className="w-4 h-4 text-[#E88B2A]" />
              <span>Download EGM Code (.zip)</span>
            </button>
          )}

          <button
            onClick={() => setShowNewManifestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Vessel Manifest</span>
          </button>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
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
          <span className="text-2xl font-black text-emerald-400 font-mono">{filedCount}</span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">IEM Acknowledged</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Amended EGM</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <RefreshCw className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-sky-400 font-mono">{amendedCount}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Supplementary filed</span>
        </div>
      </div>

      {/* Main View: Detail / Builder vs Tabbed List */}
      {selectedFiling ? (
        <EgmDetailView
          filing={selectedFiling}
          consignments={consignments}
          onBack={() => setSelectedFilingId(null)}
          onExportCsv={exportCsv}
          onOpenIemModal={() => setShowIemModal(true)}
          onOpenAmendModal={() => setShowAmendModal(true)}
        />
      ) : (
        <EgmManifestList
          filings={filteredFilings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pendingCount={pendingCount}
          urgentCount={urgentCount}
          onSelectFiling={f => setSelectedFilingId(f.id)}
          onExportCsv={exportCsv}
        />
      )}

      {/* Modals */}
      {selectedFiling && (
        <>
          <IemLodgmentModal
            filing={selectedFiling}
            isOpen={showIemModal}
            onClose={() => setShowIemModal(false)}
            onSubmit={iemNumber => {
              fileWithIem(selectedFiling.id, iemNumber);
              setShowIemModal(false);
            }}
          />

          <SupplementaryAmendmentModal
            filing={selectedFiling}
            isOpen={showAmendModal}
            onClose={() => setShowAmendModal(false)}
            onSubmit={params => {
              fileSupplementaryAmendment(selectedFiling.id, params);
              setShowAmendModal(false);
            }}
          />
        </>
      )}

      <NewManifestModal
        isOpen={showNewManifestModal}
        onClose={() => setShowNewManifestModal(false)}
        onSubmit={payload => {
          const created = addNewManifest(payload);
          setShowNewManifestModal(false);
          setSelectedFilingId(created.id);
        }}
      />
    </div>
  );
};
