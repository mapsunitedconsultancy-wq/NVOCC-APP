import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShippingInstruction } from '../types/v4Types';
import {
  FileText,
  MessageSquare,
  Globe,
  Mail,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const ShippingInstructionsPage: React.FC = () => {
  const {
    shippingInstructions,
    addShippingInstruction,
    convertSiToHblDraft,
    showToast,
    setActiveView
  } = useApp();

  const [selectedSi, setSelectedSi] = useState<ShippingInstruction | null>(null);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'WhatsApp' | 'Portal' | 'Email'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSiModal, setShowNewSiModal] = useState(false);
  const [newChannel, setNewChannel] = useState<'WhatsApp' | 'Portal' | 'Email'>('WhatsApp');
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderContact, setNewSenderContact] = useState('');
  const [newRawText, setNewRawText] = useState('');

  // Filtered SIs
  const filteredSis = shippingInstructions.filter(si => {
    const matchChannel = filterChannel === 'ALL' || si.channel === filterChannel;
    const matchQuery = si.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      si.siNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (si.matchedShipmentId && si.matchedShipmentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchChannel && matchQuery;
  });

  const handleSimulateGeminiParse = (si: ShippingInstruction) => {
    showToast('info', 'Gemini AI Extracting SI', 'Running multimodal entity parsing on shipping document...');
    setTimeout(() => {
      setSelectedSi({
        ...si,
        status: 'Parsed',
        parsingConfidence: 96,
        parsedData: {
          shipperName: si.parsedData.shipperName || 'KRISHNA CERAMICS MORBI',
          consigneeName: si.parsedData.consigneeName || 'TO ORDER OF EMIRATES NBD BANK DUBAI',
          pol: si.parsedData.pol || 'MUNDRA, INDIA',
          pod: si.parsedData.pod || 'JEBEL ALI, UAE',
          cargoDescription: si.parsedData.cargoDescription || 'INDIAN VITRIFIED TILES 600X600',
          hsCode: si.parsedData.hsCode || '69072100',
          packageCount: si.parsedData.packageCount || '1800 BOXES',
          grossWeightKg: si.parsedData.grossWeightKg || 54200
        }
      });
      showToast('success', 'SI Extracted', 'Entities parsed with 96% confidence score.');
    }, 700);
  };

  const handleCreateDraft = (siId: string) => {
    const hblNo = convertSiToHblDraft(siId);
    if (hblNo) {
      setSelectedSi(null);
      setActiveView('hbl');
    }
  };

  const handleSaveManualSi = () => {
    if (!newSenderName || !newRawText) {
      showToast('error', 'Missing Information', 'Please provide sender name and SI content.');
      return;
    }
    const newSi: ShippingInstruction = {
      id: 'si-' + Date.now(),
      siNumber: `SI-${newChannel.toUpperCase().slice(0, 2)}-2026-${Math.floor(100 + Math.random() * 900)}`,
      channel: newChannel,
      senderName: newSenderName,
      senderContact: newSenderContact || '+91 98250 00000',
      receivedAt: 'Today ' + new Date().toLocaleTimeString().slice(0, 5),
      status: 'Parsed',
      rawContent: newRawText,
      parsingConfidence: 94,
      parsedData: {
        shipperName: newSenderName.toUpperCase(),
        cargoDescription: 'EXPORT CONSIGNMENT (AUTO EXTRACTED)',
        pol: 'Mundra',
        pod: 'Jebel Ali',
        grossWeightKg: 25000,
        packageCount: '1 LOT'
      }
    };
    addShippingInstruction(newSi);
    setShowNewSiModal(false);
    setNewSenderName('');
    setNewSenderContact('');
    setNewRawText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Shipping Instructions (SI) Inbox &amp; AI Parser
              </h1>
              <p className="text-xs text-[#A8A299]">
                Multi-Channel SI Intake (AiSensy WhatsApp &bull; Customer Portal &bull; Email) &bull; Gemini Entity Extraction &bull; 1-Click HBL Draft
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewSiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingest Shipping Instruction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Total SIs Received</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{shippingInstructions.length}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Across all 3 channels</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">WhatsApp Channel</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {shippingInstructions.filter(s => s.channel === 'WhatsApp').length}
          </span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">AiSensy Webhook sync</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Customer Portal</span>
            <span className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-purple-400 font-mono">
            {shippingInstructions.filter(s => s.channel === 'Portal').length}
          </span>
          <span className="text-[11px] text-purple-300/80 block mt-1">Shipper direct submissions</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Converted to Draft HBL</span>
            <span className="p-1.5 rounded-lg bg-teal-950/60 text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-teal-400 font-mono">
            {shippingInstructions.filter(s => s.status === 'Converted to HBL Draft').length}
          </span>
          <span className="text-[11px] text-[#A8A299] block mt-1">100% automated parsing</span>
        </div>
      </div>

      {/* Screen 2: Side-by-Side Parser View */}
      {selectedSi ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16263F] border border-[#26395A] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSi(null)}
                className="p-1.5 rounded-lg bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F4EFE6] font-mono">
                    {selectedSi.siNumber}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedSi.channel === 'WhatsApp' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedSi.channel === 'Portal' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}>
                    {selectedSi.channel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A1628] text-amber-300 border border-[#26395A]">
                    {selectedSi.status}
                  </span>
                </div>
                <p className="text-xs text-[#A8A299]">
                  From: <strong className="text-[#F4EFE6]">{selectedSi.senderName}</strong> ({selectedSi.senderContact}) &bull; Received: {selectedSi.receivedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateDraft(selectedSi.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Auto-Generate Draft HBL</span>
              </button>
            </div>
          </div>

          {/* Side by Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Original Raw Content */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1C2D4A]">
                  <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#E88B2A]" />
                    <span>Original Received SI Document / Text</span>
                  </h3>
                  {selectedSi.attachedDocName && (
                    <span className="text-[10px] text-sky-400 font-mono bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                      {selectedSi.attachedDocName}
                    </span>
                  )}
                </div>
                <div className="bg-[#0A1628] p-3 rounded-lg border border-[#1C2D4A] font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {selectedSi.rawContent}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1C2D4A] flex justify-between items-center text-xs text-[#A8A299]">
                <span>Channel: <strong>{selectedSi.channel}</strong></span>
                <button
                  onClick={() => handleSimulateGeminiParse(selectedSi)}
                  className="flex items-center gap-1 text-[#E88B2A] hover:underline font-semibold"
                >
                  <span>Re-run Gemini AI Extraction</span>
                </button>
              </div>
            </div>

            {/* Right: Structured AI Extracted Fields */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1C2D4A]">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Extracted Structured Fields</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Confidence: {selectedSi.parsingConfidence}%
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Shipper / Exporter:</span>
                      <span className="font-semibold text-[#F4EFE6] block mt-0.5">{selectedSi.parsedData.shipperName || selectedSi.senderName}</span>
                    </div>
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Consignee:</span>
                      <span className="font-semibold text-[#F4EFE6] block mt-0.5">{selectedSi.parsedData.consigneeName || 'TO ORDER'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Port of Loading:</span>
                      <span className="font-semibold text-[#F4EFE6] block mt-0.5">{selectedSi.parsedData.pol || 'Mundra (INMUN)'}</span>
                    </div>
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Port of Discharge:</span>
                      <span className="font-semibold text-sky-400 block mt-0.5">{selectedSi.parsedData.pod || 'Jebel Ali (AEJEA)'}</span>
                    </div>
                  </div>

                  <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                    <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Cargo Description:</span>
                    <span className="font-semibold text-[#F4EFE6] block mt-0.5">{selectedSi.parsedData.cargoDescription || 'VITRIFIED TILES'}</span>
                    <span className="text-[10px] text-[#A8A299] font-mono block mt-1">HS Code: {selectedSi.parsedData.hsCode || '69072100'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Gross Weight:</span>
                      <span className="font-mono font-bold text-[#F4EFE6] block mt-0.5">
                        {(selectedSi.parsedData.grossWeightKg || 25000).toLocaleString()} KG
                      </span>
                    </div>
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold">Packages:</span>
                      <span className="font-semibold text-[#F4EFE6] block mt-0.5">{selectedSi.parsedData.packageCount || '1800 BOXES'}</span>
                    </div>
                  </div>

                  {selectedSi.parsedData.containers && selectedSi.parsedData.containers.length > 0 && (
                    <div className="bg-[#16263F] p-2.5 rounded-lg border border-[#26395A]">
                      <span className="text-[10px] text-[#A8A299] block uppercase font-bold mb-1">Stuffed Containers:</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {selectedSi.parsedData.containers.map((c, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-[#0A1628] border border-[#26395A] text-amber-300">
                            {c.containerNumber} ({c.sizeType}) / {c.sealNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1C2D4A] flex justify-end">
                <button
                  onClick={() => handleCreateDraft(selectedSi.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <span>Auto-Create HBL Draft</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 1: SI Inbox Table */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
              <button
                onClick={() => setFilterChannel('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  filterChannel === 'ALL' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                All Channels ({shippingInstructions.length})
              </button>
              <button
                onClick={() => setFilterChannel('WhatsApp')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  filterChannel === 'WhatsApp' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => setFilterChannel('Portal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  filterChannel === 'Portal' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <Globe className="w-3 h-3 text-purple-400" />
                <span>Customer Portal</span>
              </button>
              <button
                onClick={() => setFilterChannel('Email')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  filterChannel === 'Email' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <Mail className="w-3 h-3 text-sky-400" />
                <span>Email SMTP</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search SI, sender, shipment..."
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
                    <th className="p-3.5">SI Reference</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Sender &amp; Contact</th>
                    <th className="p-3.5">Received Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">AI Confidence</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredSis.map(si => (
                    <tr key={si.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-[#E88B2A] font-mono block">{si.siNumber}</span>
                        {si.matchedShipmentId && (
                          <span className="text-[10px] text-[#A8A299] block">Bkg: {si.matchedShipmentId}</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          si.channel === 'WhatsApp' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          si.channel === 'Portal' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}>
                          {si.channel}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold block">{si.senderName}</span>
                        <span className="text-[10px] text-[#A8A299] block font-mono">{si.senderContact}</span>
                      </td>

                      <td className="p-3.5 font-mono text-[#A8A299]">
                        {si.receivedAt}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          si.status === 'Converted to HBL Draft'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : si.status === 'Parsed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {si.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="text-emerald-400 font-bold">{si.parsingConfidence}%</span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSi(si)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
                          >
                            <span>Review &amp; Parse</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual SI Ingestion Modal */}
      {showNewSiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
              <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
                Ingest New Shipping Instruction
              </h3>
              <button onClick={() => setShowNewSiModal(false)} className="text-[#A8A299] hover:text-[#F4EFE6]">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A8A299] block mb-1">Intake Channel:</label>
                  <select
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value as any)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                  >
                    <option value="WhatsApp">WhatsApp (AiSensy Webhook)</option>
                    <option value="Portal">Customer Portal</option>
                    <option value="Email">Email SMTP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#A8A299] block mb-1">Sender Name / Company:</label>
                  <input
                    type="text"
                    placeholder="e.g. Saurashtra Minerals"
                    value={newSenderName}
                    onChange={e => setNewSenderName(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Contact Phone / Email:</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98250 12345 or exports@company.com"
                  value={newSenderContact}
                  onChange={e => setNewSenderContact(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Shipping Instruction Text / Body:</label>
                <textarea
                  rows={6}
                  placeholder="Paste shipper message with containers, marks, weights..."
                  value={newRawText}
                  onChange={e => setNewRawText(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewSiModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualSi}
                className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                Save &amp; Parse with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
