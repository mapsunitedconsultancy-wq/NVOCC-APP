import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IgmRecord, IgmConsignment } from '../../types/v4Types';
import {
  Anchor,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileCheck,
  Search,
  Filter,
  MessageSquare,
  FileSpreadsheet,
  Clock,
  Loader2,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const ImportManifestPage: React.FC = () => {
  const { igmRecords, addIgmRecord, sendIgmArrivalNotices, showToast, setActiveView, setViewParam, setActivePrintDoc } = useApp();

  const [selectedIgm, setSelectedIgm] = useState<IgmRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'vessels' | 'upload' | 'notices'>('vessels');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Filtered IGM records
  const filteredRecords = igmRecords.filter(r =>
    r.vesselVoyage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.agentOrigin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lineIgmNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulateAiParse = () => {
    if (!uploadText.trim()) {
      showToast('error', 'Manifest Content Required', 'Paste agent manifest email body or EDI data.');
      return;
    }
    setIsAiParsing(true);
    setTimeout(() => {
      setIsAiParsing(false);
      const newIgm: IgmRecord = {
        id: 'igm-' + Date.now(),
        vesselVoyage: 'MSC JADE / 439W',
        vesselName: 'MSC JADE',
        voyageNumber: '439W',
        agentOrigin: 'Trans-Oceanic Freight GmbH (Hamburg)',
        eta: '30-10-2026',
        hblCount: 4,
        lineIgmNumber: '249110',
        lineIgmDate: '24-10-2026',
        itemNumber: '018',
        status: 'Full',
        matchPercentage: 100,
        discrepanciesCount: 0,
        consignments: [
          {
            id: 'c-new-01',
            hblNumber: 'LCMUNHAM2600299',
            mblNumber: 'MEDUMUN991040',
            shipper: 'HENKEL AG & CO KGAA',
            consignee: 'KUTCH CHEMICAL INDUSTRIES LTD',
            consigneeGstin: '24AAACK1122C1Z4',
            consigneeIec: '0308001294',
            isIecVerified: true,
            containerNumber: 'MSCU7710924',
            sealNumber: 'MSC88192',
            sizeType: '40HC',
            cargoDescription: 'INDUSTRIAL ADHESIVES AND SURFACTANTS',
            grossWeightKg: 24500,
            packageCount: '80 DRUMS',
            lineMatched: true,
            arrivalNoticeSent: false,
            doStatus: 'Not Requested',
            cfsName: 'MUNDHRA CFS, MUNDRA',
            chargesEstimateINR: 42000
          }
        ]
      };
      addIgmRecord(newIgm);
      setSelectedIgm(newIgm);
      setActiveTab('vessels');
      setUploadText('');
      showToast('success', 'Gemini AI Manifest Extraction Complete', 'Structured 4 HBLs with automated GSTIN & IEC lookup.');
    }, 1200);
  };

  const handleSendNotices = (igm: IgmRecord) => {
    sendIgmArrivalNotices(igm.id);
    setSelectedIgm(prev => prev && prev.id === igm.id ? {
      ...prev,
      consignments: prev.consignments.map(c => ({ ...c, arrivalNoticeSent: true }))
    } : prev);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <Anchor className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Import General Manifest (IGM)
              </h1>
              <p className="text-xs text-[#A8A299]">
                Mundra & Kandla Inbound Gateway &bull; Agent Manifest Extraction &bull; Arrival Notices &amp; Line IGM Reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Agent Manifest (AI OCR)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Inbound Vessels (30d)</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <Anchor className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{igmRecords.length}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Mundra & Kandla ETA schedule</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Line IGM Match %</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">94.8%</span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">Auto-reconciled with carrier</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">IEC Red Flags</span>
            <span className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-rose-400 font-mono">1</span>
          <span className="text-[11px] text-rose-300/80 block mt-1">Unregistered Importer IEC</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Notices Dispatched</span>
            <span className="p-1.5 rounded-lg bg-teal-950/60 text-teal-400">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-teal-400 font-mono">28</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">WhatsApp & Email Arrival Alerts</span>
        </div>
      </div>

      {/* Screen 2: Agent Manifest AI Upload */}
      {activeTab === 'upload' ? (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#1C2D4A]">
            <div>
              <h2 className="text-base font-bold text-[#F4EFE6] flex items-center gap-2">
                <span>Agent Inward Manifest AI Extractor (Gemini Vision / Text)</span>
              </h2>
              <p className="text-xs text-[#A8A299]">
                Paste overseas agent manifest email or upload Excel/CSV to extract HBLs, verify DGFT IEC codes, and match against shipping line IGM.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('vessels')}
              className="px-3 py-1.5 text-xs text-[#A8A299] hover:text-[#F4EFE6] bg-[#16263F] rounded-lg"
            >
              Back to Inbound Vessels
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#A8A299] block">
              Paste Agent Manifest Content or CSV Rows:
            </label>
            <textarea
              rows={8}
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
              placeholder={`VESSEL: MSC JADE V.439W - ETA MUNDRA 30-OCT-2026
MBL: MEDUMUN991040
HBL: LCMUNHAM2600299 | SHPR: HENKEL AG | CNEE: KUTCH CHEMICAL INDUSTRIES LTD | 1x40HC MSCU7710924 | SEAL: MSC88192 | 80 DRUMS | 24,500 KG | ADHESIVES`}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-3 text-xs text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setUploadText(`VESSEL: MSC JADE V.439W - ETA MUNDRA 30-OCT-2026
MBL: MEDUMUN991040
HBL: LCMUNHAM2600299 | SHPR: HENKEL AG | CNEE: KUTCH CHEMICAL INDUSTRIES LTD | 1x40HC MSCU7710924 | SEAL: MSC88192 | 80 DRUMS | 24,500 KG | ADHESIVES`)}
              className="px-3.5 py-2 rounded-xl bg-[#16263F] text-xs font-semibold text-[#A8A299] hover:text-[#F4EFE6]"
            >
              Load Sample Text
            </button>
            <button
              onClick={handleSimulateAiParse}
              disabled={isAiParsing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs shadow-md shadow-[#E88B2A]/20 transition-all disabled:opacity-50"
            >
              {isAiParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini Parsing &amp; Reconciling...</span>
                </>
              ) : (
                <span>Parse &amp; Create Inward IGM</span>
              )}
            </button>
          </div>
        </div>
      ) : selectedIgm ? (
        /* Screen 2/3: Selected Vessel Inward Detail & Arrival Notice Dispatch */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16263F] border border-[#26395A] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIgm(null)}
                className="p-1.5 rounded-lg bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F4EFE6] font-mono">
                    {selectedIgm.vesselVoyage}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-950 text-teal-300 border border-teal-800">
                    Line IGM: {selectedIgm.lineIgmNumber} / Item {selectedIgm.itemNumber}
                  </span>
                </div>
                <p className="text-xs text-[#A8A299]">
                  Agent Origin: <strong className="text-[#F4EFE6]">{selectedIgm.agentOrigin}</strong> &bull; ETA: <strong className="text-sky-400">{selectedIgm.eta}</strong> &bull; Line Reconciliation: <span className="text-emerald-400 font-bold">{selectedIgm.matchPercentage}%</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSendNotices(selectedIgm)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bulk Send Arrival Notices (WhatsApp + Email)</span>
              </button>
            </div>
          </div>

          {/* Consignments Table */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#1C2D4A] flex justify-between items-center bg-[#16263F]/50">
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
                Inward Manifest HBL Items ({selectedIgm.consignments.length})
              </h3>
              <span className="text-[11px] text-[#A8A299]">
                Direct source for Delivery Order (DO) issuance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">HBL Number</th>
                    <th className="p-3">Consignee &amp; IEC Status</th>
                    <th className="p-3">Container &amp; Seal</th>
                    <th className="p-3">Cargo &amp; Weight</th>
                    <th className="p-3">Line Match</th>
                    <th className="p-3">Arrival Notice</th>
                    <th className="p-3 text-right">DO Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {selectedIgm.consignments.map(c => (
                    <tr key={c.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#E88B2A]">
                        {c.hblNumber}
                        <span className="text-[10px] text-[#A8A299] block font-normal">MBL: {c.mblNumber}</span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold block">{c.consignee}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.isIecVerified ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> IEC: {c.consigneeIec} (Active)
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Missing / Invalid IEC
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <span className="font-bold">{c.containerNumber}</span> ({c.sizeType})
                        <span className="text-[10px] text-[#A8A299] block">Seal: {c.sealNumber}</span>
                      </td>

                      <td className="p-3">
                        <span className="block">{c.cargoDescription}</span>
                        <span className="text-[10px] font-mono text-[#A8A299]">
                          {c.grossWeightKg.toLocaleString()} KG &bull; {c.packageCount}
                        </span>
                      </td>

                      <td className="p-3">
                        {c.lineMatched ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            MATCHED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            DISCREPANCY
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {c.arrivalNoticeSent ? (
                          <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sent via WhatsApp
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              sendIgmArrivalNotices(selectedIgm.id);
                              showToast('success', 'Arrival Notice Dispatched', `Sent to ${c.consignee}`);
                            }}
                            className="px-2 py-1 rounded bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-xs font-semibold text-[#F4EFE6]"
                          >
                            Send Notice
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {c.doStatus === 'Issued' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                            DO ISSUED
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveView('delivery_orders');
                              showToast('info', 'Routing to DO Issuance', `Pre-filling data for ${c.hblNumber}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs shadow-sm"
                          >
                            Issue DO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 1: Inbound Vessels Grid */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Expected Inbound Vessels at Mundra / Kandla Gateway (Next 30 Days)
            </span>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search vessel or agent..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">Vessel / Voyage</th>
                    <th className="p-3.5">Origin Agent</th>
                    <th className="p-3.5">ETA Mundra</th>
                    <th className="p-3.5">HBLs Received</th>
                    <th className="p-3.5">Line IGM No.</th>
                    <th className="p-3.5 text-center">Reconciliation</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-[#F4EFE6] font-mono block">
                          {record.vesselVoyage}
                        </span>
                        <span className="text-[10px] text-[#A8A299] block">{record.vesselName}</span>
                      </td>

                      <td className="p-3.5 text-[#A8A299]">
                        <span className="font-medium text-[#F4EFE6] block">{record.agentOrigin}</span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-sky-400">{record.eta}</span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#E88B2A]">{record.hblCount}</span> HBLs
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="text-[#F4EFE6] font-semibold">{record.lineIgmNumber}</span>
                        <span className="text-[10px] text-[#A8A299] block">Item: {record.itemNumber}</span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-xs ${
                            record.matchPercentage >= 90 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {record.matchPercentage}%
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            record.status === 'Reconciled'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedIgm(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
                        >
                          <span>Review &amp; Notices</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
