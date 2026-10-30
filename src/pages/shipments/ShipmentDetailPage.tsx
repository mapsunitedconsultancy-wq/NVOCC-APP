import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shipment, ContainerItem, ChargeItem } from '../../types';
import { StatusPill } from '../../components/common/StatusPill';
import { formatINR, formatUSD, formatWeight, formatCBM, validateISO6346 } from '../../utils/formatters';
import {
  ArrowLeft,
  Ship,
  FileText,
  Printer,
  Share2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Edit,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Download,
  Eye,
  FileCheck
} from 'lucide-react';
import { WhatsAppPreviewModal } from '../../components/common/WhatsAppPreviewModal';

interface ShipmentDetailProps {
  shipmentId: string;
  onBack: () => void;
}

export const ShipmentDetailPage: React.FC<ShipmentDetailProps> = ({ shipmentId, onBack }) => {
  const {
    shipments,
    updateShipment,
    hbls,
    setActivePrintDoc,
    setActiveView,
    setViewParam,
    sendMessage,
    showToast,
    currentUser
  } = useApp();

  const shipment = shipments.find(s => s.id === shipmentId);

  const [activeTab, setActiveTab] = useState<'overview' | 'containers' | 'documents' | 'timeline' | 'charges' | 'communication' | 'notes' | 'audit'>('overview');
  
  // Note state
  const [newNote, setNewNote] = useState('');
  
  // Timeline add state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  
  // Charge add state
  const [newChargeDesc, setNewChargeDesc] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState<number>(0);
  const [newChargeCurrency, setNewChargeCurrency] = useState<'INR' | 'USD'>('USD');
  const [newChargeCategory, setNewChargeCategory] = useState<any>('Ocean Freight');

  // WhatsApp quick trigger
  const [showWhatsAppBox, setShowWhatsAppBox] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [leoAlert, setLeoAlert] = useState<string | null>(null);

  if (!shipment) {
    return (
      <div className="p-8 text-center text-xs">
        <p className="text-rose-400">Shipment not found: {shipmentId}</p>
        <button onClick={onBack} className="mt-3 px-3 py-1.5 rounded bg-[#16263F] text-[#F4EFE6]">
          Return to Shipments
        </button>
      </div>
    );
  }

  const linkedHbl = hbls.find(h => h.shipmentId === shipment.id || h.hblNumber === shipment.hblNo);

  // Status progress pipeline
  const stages = [
    { key: 'booked', label: 'Booked' },
    { key: 'at_cfs', label: 'At CFS' },
    { key: 'at_port', label: 'Port Gate' },
    { key: 'loaded', label: 'Loaded' },
    { key: 'on_vessel', label: 'On Vessel' },
    { key: 'discharged', label: 'Discharged' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentStageIndex = stages.findIndex(st => st.key === shipment.status);

  const handleStageChange = (newStatus: string) => {
    // Point 05: Gate Check — HBL cannot reach 'loaded' or beyond until LEO date is recorded
    if ((newStatus === 'loaded' || newStatus === 'on_vessel') && !shipment.leoDate) {
      const msg = `Point 05 LEO Gate Violation: Shipment ${shipment.id} (HBL ${shipment.hblNo || 'MAPS-HBL-246483-01'}) CANNOT reach "Loaded" until Customs Let Export Order (LEO) date is recorded. Indian Customs regulations strictly prohibit vessel loading prior to LEO generation.`;
      setLeoAlert(msg);
      showToast('error', 'Vessel Loading Blocked', 'LEO date must be recorded before container loading.');
      return;
    }

    setLeoAlert(null);
    updateShipment(shipment.id, {
      status: newStatus as any,
      statusLabel: stages.find(s => s.key === newStatus)?.label || newStatus
    });
    showToast('success', 'Stage Advanced', `Shipment status updated to ${newStatus.toUpperCase()}`);
  };

  const handleRecordLeo = (leoDateVal: string = '2026-10-19') => {
    updateShipment(shipment.id, {
      leoDate: leoDateVal,
      shippingBillNo: shipment.shippingBillNo || '7891234',
      shippingBillDate: shipment.shippingBillDate || '2026-10-18'
    });
    setLeoAlert(null);
    showToast('success', 'LEO Date Recorded', `Let Export Order dated ${leoDateVal} linked to Shipping Bill 7891234.`);
  };

  const handleClearLeo = () => {
    updateShipment(shipment.id, {
      leoDate: undefined
    });
    showToast('warning', 'LEO Date Cleared', 'Status gate reset for testing.');
  };

  const handleGenerateEgmManifest = () => {
    setActivePrintDoc({
      type: 'MANIFEST',
      data: {
        containerNumber: shipment.containers[0]?.containerNumber || 'MSKU2345619',
        vessel: `${shipment.vesselName} ${shipment.voyageNumber}`,
        voyage: shipment.voyageNumber,
        portOfLoading: `${shipment.polName} (${shipment.polCode})`,
        portOfDischarge: `${shipment.podName} (${shipment.podCode})`,
        seal: shipment.containers[0]?.sealNumber || 'KL789412',
        utilization: '100% (FCL 40HC)',
        totalWeight: `${shipment.grossWeight.toLocaleString()} KG`,
        totalCbm: `${shipment.volumeCbm.toFixed(1)} CBM`,
        mblNumber: shipment.mblNo || 'MAEUMUN92890',
        egmNumber: 'EGM-MSC-437W-2026-0928',
        sailedDate: '2026-10-20',
        hbls: [
          {
            hbl: shipment.hblNo || 'MAPS-HBL-246483-01',
            shipper: shipment.shipperName,
            cbm: shipment.volumeCbm,
            weight: shipment.grossWeight,
            pkgs: `${shipment.packagesCount} ${shipment.packageType}`,
            dest: shipment.placeOfDelivery,
            leoDate: shipment.leoDate || '2026-10-19',
            sbNo: shipment.shippingBillNo || '7891234'
          }
        ]
      }
    });
    showToast('success', 'EGM Manifest Generated', `Auto-pulled ${shipment.hblNo || 'MAPS-HBL-246483-01'} onto ${shipment.vesselName} ${shipment.voyageNumber} manifest.`);
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const now = new Date();
    const timestamp = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEvent = {
      id: 'ev-' + Date.now(),
      timestamp,
      title: newEventTitle,
      location: shipment.polName,
      description: newEventDesc || 'Status updated by operations team.',
      category: 'port' as const,
      source: 'MANUAL' as const,
      user: currentUser.name
    };
    updateShipment(shipment.id, {
      events: [newEvent, ...shipment.events]
    });
    setNewEventTitle('');
    setNewEventDesc('');
    showToast('success', 'Timeline Event Logged', newEventTitle);
  };

  const handleAddCharge = () => {
    if (!newChargeDesc || !newChargeAmount) return;
    const isUSD = newChargeCurrency === 'USD';
    const amountInINR = isUSD ? Math.round(newChargeAmount * 84.2) : newChargeAmount;
    const newChg: ChargeItem = {
      id: 'chg-' + Date.now(),
      chargeCode: 'GEN',
      chargeName: newChargeDesc,
      category: newChargeCategory,
      currency: newChargeCurrency,
      amount: newChargeAmount,
      rate: 84.2,
      amountInINR,
      billedTo: 'shipper',
      paymentTerm: 'Prepaid',
      status: 'pending'
    };
    updateShipment(shipment.id, {
      charges: [...shipment.charges, newChg],
      totalRevenueINR: shipment.totalRevenueINR + amountInINR,
      marginINR: shipment.marginINR + amountInINR
    });
    setNewChargeDesc('');
    setNewChargeAmount(0);
    showToast('success', 'Charge Added', `${newChargeDesc} - ${newChargeCurrency} ${newChargeAmount}`);
  };

  const handleSendWhatsApp = () => {
    if (!waMessage.trim()) return;
    sendMessage({
      shipmentId: shipment.id,
      partyName: shipment.shipperName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: shipment.shipperName,
      body: waMessage,
      status: 'Sent'
    });
    setShowWhatsAppBox(false);
    setWaMessage('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#A8A299] hover:text-[#F4EFE6] transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shipments
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#E88B2A]">
              {shipment.id}
            </h1>
            <StatusPill status={shipment.status} size="md" pulse={shipment.status === 'on_vessel' || shipment.status === 'delayed'} />
            <span className="text-xs text-[#A8A299] hidden sm:inline">
              Ref: {shipment.referenceNo}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {linkedHbl && (
            <button
              onClick={() => setActivePrintDoc({ type: 'HBL', data: linkedHbl })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#E88B2A]" />
              View HBL ({linkedHbl.hblNumber.split('-').pop()})
            </button>
          )}

          <button
            onClick={() => {
              setWaMessage(`Dear ${shipment.shipperName}, your shipment ${shipment.id} on vessel ${shipment.vesselName} is currently ${shipment.statusLabel}. Live tracking: https://mapsfreight.com/track/${shipment.id}`);
              setShowWhatsAppBox(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp Update
          </button>

          <button
            onClick={() => {
              setActiveView('public_tracking');
              setViewParam(shipment.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-sky-400 border border-[#26395A] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Track Link
          </button>
        </div>
      </div>

      {/* WhatsApp Preview-Before-Send Modal */}
      <WhatsAppPreviewModal
        isOpen={showWhatsAppBox}
        onClose={() => setShowWhatsAppBox(false)}
        recipientName={shipment.shipperName}
        phoneNumber="+91 98250 88214"
        defaultMessage={waMessage}
        shipmentId={shipment.id}
        docTitle={`Shipment Advice — ${shipment.id}`}
      />

      {/* Point 05 LEO Gate Status & Actions Strip */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#A8A299]">Point 05 LEO Gate:</span>
          {shipment.leoDate ? (
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              LEO Recorded ({shipment.leoDate}) • SB #{shipment.shippingBillNo || '7891234'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              LEO Pending • Vessel Loading Blocked
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {shipment.leoDate ? (
            <button
              onClick={handleClearLeo}
              className="text-[10px] px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800"
            >
              Clear LEO (Test Gate Block)
            </button>
          ) : (
            <button
              onClick={() => handleRecordLeo('2026-10-19')}
              className="text-[10px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-sm"
            >
              Record LEO Date (2026-10-19)
            </button>
          )}

          <button
            onClick={handleGenerateEgmManifest}
            className="text-[10px] px-2.5 py-1 rounded bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <Printer className="w-3 h-3" />
            Build EGM Manifest (MSC JADE)
          </button>
        </div>
      </div>

      {/* LEO Gate Alert Banner */}
      {leoAlert && (
        <div className="p-3 bg-rose-950 border border-rose-500 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{leoAlert}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRecordLeo('2026-10-19')}
              className="px-2.5 py-1 rounded bg-emerald-600 text-slate-950 font-bold text-xs"
            >
              Grant LEO Clearance Now
            </button>
            <button
              onClick={() => setLeoAlert(null)}
              className="text-xs text-rose-300 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Lifecycle Progress Bar */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
          {stages.map((st, idx) => {
            const isCompleted = currentStageIndex >= idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <button
                key={st.key}
                type="button"
                onClick={() => handleStageChange(st.key)}
                className="flex-1 flex flex-col items-center min-w-[70px] relative text-left group cursor-pointer focus:outline-none"
              >
                {idx > 0 && (
                  <div
                    className={`absolute top-3 right-1/2 left-[-50%] h-0.5 z-0 ${
                      isCompleted ? 'bg-[#E88B2A]' : 'bg-[#1C2D4A]'
                    }`}
                  />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all group-hover:scale-125 ${
                    isCurrent
                      ? 'bg-[#E88B2A] text-[#0A1628] ring-4 ring-[#E88B2A]/20 scale-110'
                      : isCompleted
                      ? 'bg-[#E88B2A] text-[#0A1628]'
                      : 'bg-[#16263F] text-[#6E6A64] border border-[#26395A]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-medium mt-1.5 uppercase tracking-wider text-center ${
                    isCurrent ? 'text-[#E88B2A] font-bold' : isCompleted ? 'text-[#F4EFE6]' : 'text-[#6E6A64]'
                  }`}
                >
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8 Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#1C2D4A] overflow-x-auto text-xs pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'containers', label: `Containers (${shipment.containers.length})` },
          { id: 'documents', label: 'Documents (5)' },
          { id: 'timeline', label: `Timeline (${shipment.events.length})` },
          { id: 'charges', label: `Charges & P&L` },
          { id: 'communication', label: 'Communication Hub' },
          { id: 'notes', label: 'Notes & Special Instructions' },
          { id: 'audit', label: 'Audit Trail' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#E88B2A] text-[#E88B2A] bg-[#16263F]/50 font-semibold'
                : 'border-transparent text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Parties Block */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <span className="font-bold text-[#E88B2A] uppercase tracking-wider block text-[11px] pb-1 border-b border-[#1C2D4A]">
              Trade Parties
            </span>
            <div>
              <span className="text-[10px] font-bold text-[#6E6A64] uppercase">Shipper:</span>
              <p className="font-bold text-[#F4EFE6] text-sm">{shipment.shipperName}</p>
              <p className="text-[#A8A299] text-[11px]">{shipment.shipperAddress}</p>
              <p className="font-mono text-[#E88B2A] text-[10px] mt-0.5">GSTIN: {shipment.shipperGstin}</p>
            </div>
            <div className="pt-2 border-t border-[#1C2D4A]">
              <span className="text-[10px] font-bold text-[#6E6A64] uppercase">Consignee:</span>
              <p className="font-bold text-[#F4EFE6]">{shipment.consigneeName}</p>
              <p className="text-[#A8A299] text-[11px]">{shipment.consigneeAddress}</p>
              <p className="text-[10px] text-zinc-400">Destination: {shipment.consigneeCountry}</p>
            </div>
            <div className="pt-2 border-t border-[#1C2D4A]">
              <span className="text-[10px] font-bold text-[#6E6A64] uppercase">Overseas Agent:</span>
              <p className="font-medium text-[#F4EFE6]">{shipment.agentName}</p>
            </div>
          </div>

          {/* Route Block */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <span className="font-bold text-[#E88B2A] uppercase tracking-wider block text-[11px] pb-1 border-b border-[#1C2D4A]">
              Routing & Port Details
            </span>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Place of Receipt:</span>
                <p className="font-semibold text-[#F4EFE6]">{shipment.placeOfReceipt}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Port of Loading (POL):</span>
                <p className="font-bold text-emerald-400 text-sm">{shipment.polName} ({shipment.polCode})</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Port of Discharge (POD):</span>
                <p className="font-bold text-sky-400 text-sm">{shipment.podName} ({shipment.podCode})</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Place of Delivery:</span>
                <p className="font-semibold text-[#F4EFE6]">{shipment.placeOfDelivery}</p>
              </div>
            </div>
          </div>

          {/* Vessel & Deadlines */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <span className="font-bold text-[#E88B2A] uppercase tracking-wider block text-[11px] pb-1 border-b border-[#1C2D4A]">
              Vessel & Cutoff Schedule
            </span>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">Carrier:</span>
                <span className="font-bold text-[#F4EFE6]">{shipment.carrierName} ({shipment.carrierScac})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">Vessel / Voy:</span>
                <span className="font-bold text-[#F4EFE6]">{shipment.vesselName} / {shipment.voyageNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">ETD Mundra:</span>
                <span className="text-emerald-400 font-bold">{shipment.etd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">ETA Destination:</span>
                <span className="text-sky-400 font-bold">{shipment.eta}</span>
              </div>
              <div className="pt-2 border-t border-[#1C2D4A] space-y-1 text-[11px]">
                <div className="flex justify-between text-rose-300">
                  <span className="font-sans">CY Cutoff:</span>
                  <span>{shipment.cyCutoff}</span>
                </div>
                <div className="flex justify-between text-[#A8A299]">
                  <span className="font-sans">SI Cutoff:</span>
                  <span>{shipment.siCutoff}</span>
                </div>
                <div className="flex justify-between text-[#A8A299]">
                  <span className="font-sans">VGM Cutoff:</span>
                  <span>{shipment.vgmCutoff}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Details */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3 md:col-span-2">
            <span className="font-bold text-[#E88B2A] uppercase tracking-wider block text-[11px] pb-1 border-b border-[#1C2D4A]">
              Cargo Specification & Measurements
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Packages:</span>
                <p className="font-bold text-[#F4EFE6]">{shipment.packagesCount} {shipment.packageType}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Gross Weight:</span>
                <p className="font-bold text-[#F4EFE6]">{formatWeight(shipment.grossWeight)}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">Volume:</span>
                <p className="font-bold text-[#F4EFE6]">{formatCBM(shipment.volumeCbm)}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6E6A64] uppercase">ITC-HS Code:</span>
                <p className="font-mono font-bold text-[#E88B2A]">{shipment.hsCode}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1C2D4A]">
              <span className="text-[10px] text-[#6E6A64] uppercase">Full Description:</span>
              <p className="text-[#F4EFE6] mt-0.5 font-medium">{shipment.cargoDescription}</p>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <span className="font-bold text-[#E88B2A] uppercase tracking-wider block text-[11px] pb-1 border-b border-[#1C2D4A]">
              Financial Margin Snapshot
            </span>
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">Billed Revenue:</span>
                <span className="text-[#F4EFE6] font-bold">{formatINR(shipment.totalRevenueINR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A8A299] font-sans">Direct Cost:</span>
                <span className="text-zinc-400">{formatINR(shipment.totalCostINR)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1C2D4A]">
                <span className="text-[#A8A299] font-sans">Gross Margin:</span>
                <span className="text-emerald-400 font-bold">{formatINR(shipment.marginINR)} ({shipment.marginPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAINERS & CONTAINER CONTROL INTEGRATION PANEL */}
      {activeTab === 'containers' && (
        <div className="space-y-4 text-xs">
          {/* Container Control Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Widget 1: Live D&D Meter */}
            <div className="bg-[#0F1D33] border border-amber-800/40 rounded-xl p-4 bg-gradient-to-br from-[#0F1D33] to-amber-950/20 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E88B2A]" />
                  Demurrage & Detention Clock
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700/50">
                  {shipment.containers[0]?.freeTimeDays || 7} Days Free
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono text-[#F4EFE6]">
                    {shipment.containers[0]?.freeTimeDays ? `${shipment.containers[0].freeTimeDays}d Left` : 'Active'}
                  </div>
                  <p className="text-[11px] text-[#A8A299] mt-0.5">
                    Expiry: <strong className="text-[#F4EFE6]">{shipment.containers[0]?.freeTimeExpiry || '22 Oct 2026'}</strong>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#A8A299] block font-sans">Current Daily Rate</span>
                  <span className="text-sm font-bold text-rose-300">
                    {formatINR(shipment.containers[0]?.demurragePerDay || 4500)} / day
                  </span>
                </div>
              </div>

              {/* Tariff Tier Ladder */}
              <div className="mt-3 pt-2.5 border-t border-[#1C2D4A] grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                <div className="bg-[#16263F] p-1.5 rounded border border-[#26395A]">
                  <span className="text-emerald-400 font-bold block">Days 1–7</span>
                  <span className="text-[#A8A299]">FREE</span>
                </div>
                <div className="bg-[#16263F] p-1.5 rounded border border-[#26395A]">
                  <span className="text-amber-400 font-bold block">Days 8–14</span>
                  <span className="text-[#A8A299]">₹3,500/d</span>
                </div>
                <div className="bg-[#16263F] p-1.5 rounded border border-[#26395A]">
                  <span className="text-rose-400 font-bold block">Days 15+</span>
                  <span className="text-[#A8A299]">₹7,000/d</span>
                </div>
              </div>
            </div>

            {/* Widget 2: CFS Gate-In & Terminal Status */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                <span className="font-bold text-xs uppercase tracking-wider text-[#F4EFE6] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  CFS Gate-In & Terminal Logistics
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Gate-In Cleared
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Designated CFS:</span>
                  <span className="font-semibold text-[#F4EFE6]">Seabird Marine CFS, Mundra</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Gate-In Timestamp:</span>
                  <span className="font-mono text-[#F4EFE6]">14 Oct 2026, 09:42 IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Interchange (EIR) #:</span>
                  <span className="font-mono text-[#E88B2A]">EIR-MUN-2026-98124</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Terminal Berth:</span>
                  <span className="text-[#F4EFE6]">APSEZ MICT Terminal (Berth 2)</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Security Deposit & Empty Return */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                <span className="font-bold text-xs uppercase tracking-wider text-[#F4EFE6] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Deposit & Empty Return Control
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  Refundable
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Security Deposit:</span>
                  <span className="font-mono font-bold text-[#F4EFE6]">₹50,000 / Box</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Deposit Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Deposited (HDFC Ref #7721)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Designated Empty Yard:</span>
                  <span className="text-[#F4EFE6]">Gateway Distriparks Yard, Mundra</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A299]">Return Cutoff Date:</span>
                  <span className="font-mono text-amber-300">24 Oct 2026, 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Containers Table */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
              <span className="font-bold text-sm text-[#F4EFE6]">
                Assigned Containers Inventory & ISO 6346 Validation
              </span>
              <span className="text-[#A8A299]">{shipment.containers.length} Container Tracked</span>
            </div>

            <div className="border border-[#26395A] rounded-lg overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold">
                  <tr>
                    <th className="p-3">Container Number</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Seal No</th>
                    <th className="p-3">VGM Weight</th>
                    <th className="p-3">Current Location</th>
                    <th className="p-3">Free Time Expiry</th>
                    <th className="p-3 text-right">Demurrage / Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A]">
                  {shipment.containers.map(c => {
                    const check = validateISO6346(c.containerNumber);
                    return (
                      <tr key={c.id} className="hover:bg-[#16263F]/40 font-mono">
                        <td className="p-3 font-bold text-[#E88B2A]">
                          {c.containerNumber}
                          {check.isValid ? (
                            <span className="block text-[9px] text-emerald-400 font-sans font-normal">ISO 6346 Verified Checksum</span>
                          ) : (
                            <span className="block text-[9px] text-amber-400 font-sans font-normal">{check.message}</span>
                          )}
                        </td>
                        <td className="p-3 font-sans font-medium text-[#F4EFE6]">{c.equipmentType}</td>
                        <td className="p-3 text-slate-300">{c.sealNumber}</td>
                        <td className="p-3 text-emerald-400 font-bold">{c.vgmWeight ? `${c.vgmWeight.toLocaleString('en-IN')} KG` : 'Pending'}</td>
                        <td className="p-3 font-sans text-slate-300">{c.currentLocation}</td>
                        <td className="p-3 font-sans text-rose-300">{c.freeTimeExpiry} ({c.freeTimeDays}d)</td>
                        <td className="p-3 text-right font-bold text-slate-200">{formatINR(c.demurragePerDay)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Document Vault & Automated OCR Extractions
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
              AI OCR Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: 'Commercial Invoice (Shipper)', category: 'Commercial Invoice', file: 'KC-INV-118.pdf', size: '1.4 MB', ocr: 'USD 38,400 • 25,480 KG' },
              { title: 'Verified Gross Mass (VGM)', category: 'VGM Certificate', file: 'VGM-CERT-MSKU2345678.pdf', size: '480 KB', ocr: '29,360 KG (Method SM1)' },
              { title: 'Customs Let Export Order (LEO)', category: 'Customs LEO', file: 'ICEGATE-LEO-7891234.pdf', size: '620 KB', ocr: 'SB #7891234 • Passed' },
              { title: 'House Bill of Lading (Original)', category: 'HBL', file: 'MAPS-HBL-240342-01.pdf', size: '890 KB', ocr: '3 Originals Issued' },
              { title: 'Packing List & Net Tare Sheet', category: 'Packing List', file: 'PL-MORBI-4401.pdf', size: '320 KB', ocr: '1100 Bags on 22 Pallets' }
            ].map((doc, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#E88B2A] uppercase">{doc.category}</span>
                    <span className="text-[10px] text-[#6E6A64]">{doc.size}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#F4EFE6] mt-1">{doc.title}</h4>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{doc.file}</p>
                </div>
                <div className="pt-2 border-t border-[#1C2D4A] flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-mono">OCR: {doc.ocr}</span>
                  <button
                    onClick={() => showToast('info', 'Viewing Document', doc.title)}
                    className="p-1 rounded bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Milestone Timeline & Port Gate Events
            </span>
            <span className="text-[#A8A299]">{shipment.events.length} Historical Events</span>
          </div>

          {/* Quick Add Event */}
          <div className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="Milestone title (e.g. Cleared Customs, Discharged at Terminal...)"
              className="flex-1 bg-[#0F1D33] border border-[#26395A] rounded-lg px-3 py-1.5 text-[#F4EFE6] focus:outline-none"
            />
            <input
              type="text"
              value={newEventDesc}
              onChange={e => setNewEventDesc(e.target.value)}
              placeholder="Description details..."
              className="flex-1 bg-[#0F1D33] border border-[#26395A] rounded-lg px-3 py-1.5 text-[#F4EFE6] focus:outline-none"
            />
            <button
              onClick={handleAddEvent}
              className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold transition-all shrink-0"
            >
              + Log Event
            </button>
          </div>

          {/* Timeline List */}
          <div className="relative border-l-2 border-[#1C2D4A] ml-3 space-y-4 pl-4 pt-1">
            {shipment.events.map((ev, i) => (
              <div key={ev.id} className="relative group">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[#E88B2A] ring-4 ring-[#0F1D33]"></div>
                <div className="flex items-baseline justify-between">
                  <h4 className="font-semibold text-sm text-[#F4EFE6]">{ev.title}</h4>
                  <span className="text-[10px] font-mono text-[#A8A299]">{ev.timestamp}</span>
                </div>
                <p className="text-zinc-300 text-xs mt-0.5">{ev.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#6E6A64] mt-1 font-mono">
                  <span>Location: {ev.location}</span>
                  <span>•</span>
                  <span>Source: {ev.source}</span>
                  {ev.user && (
                    <>
                      <span>•</span>
                      <span>By: {ev.user}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHARGES & PROFITABILITY */}
      {activeTab === 'charges' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Shipment Line Charges & Commercial Margin
            </span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              Net Profit: {formatINR(shipment.marginINR)} ({shipment.marginPercent}%)
            </span>
          </div>

          {/* Add Charge */}
          <div className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={newChargeDesc}
              onChange={e => setNewChargeDesc(e.target.value)}
              placeholder="Charge Description (e.g. Origin THC, VGM Filing, BAF...)"
              className="flex-1 min-w-[200px] bg-[#0F1D33] border border-[#26395A] rounded-lg px-3 py-1.5 text-[#F4EFE6]"
            />
            <select
              value={newChargeCategory}
              onChange={e => setNewChargeCategory(e.target.value as any)}
              className="bg-[#0F1D33] border border-[#26395A] rounded-lg px-2 py-1.5 text-[#F4EFE6]"
            >
              <option value="Ocean Freight">Ocean Freight</option>
              <option value="THC">THC</option>
              <option value="Documentation">Documentation</option>
              <option value="VGM">VGM Fee</option>
              <option value="Customs">Customs Clearance</option>
              <option value="CFS">CFS Handling</option>
            </select>
            <input
              type="number"
              value={newChargeAmount || ''}
              onChange={e => setNewChargeAmount(Number(e.target.value))}
              placeholder="Amount"
              className="w-24 bg-[#0F1D33] border border-[#26395A] rounded-lg px-3 py-1.5 text-[#F4EFE6] font-mono"
            />
            <select
              value={newChargeCurrency}
              onChange={e => setNewChargeCurrency(e.target.value as any)}
              className="bg-[#0F1D33] border border-[#26395A] rounded-lg px-2 py-1.5 text-[#F4EFE6]"
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
            <button
              onClick={handleAddCharge}
              className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold"
            >
              + Add Line Item
            </button>
          </div>

          {/* Charges Table */}
          <table className="w-full text-left border border-[#26395A] rounded-lg overflow-hidden">
            <thead className="bg-[#16263F] text-[#A8A299] font-semibold">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Currency</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Amount (INR)</th>
                <th className="p-3">Payment Term</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] font-mono">
              {shipment.charges.map(chg => (
                <tr key={chg.id} className="hover:bg-[#16263F]/40">
                  <td className="p-3 font-sans font-medium text-[#F4EFE6]">{chg.chargeName}</td>
                  <td className="p-3 font-sans text-zinc-400">{chg.category}</td>
                  <td className="p-3">{chg.currency}</td>
                  <td className="p-3 text-right font-bold text-[#F4EFE6]">{chg.amount.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{formatINR(chg.amountInINR)}</td>
                  <td className="p-3 font-sans text-zinc-300">{chg.paymentTerm}</td>
                  <td className="p-3 font-sans capitalize text-[#E88B2A]">{chg.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: COMMUNICATION */}
      {activeTab === 'communication' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <span className="font-bold text-sm text-[#F4EFE6]">
              WhatsApp & Email Dispatch Log for {shipment.id}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Gateway: Connected</span>
          </div>

          <div className="space-y-3">
            {[
              { ch: 'WhatsApp', to: shipment.shipperName, date: '13 Oct 07:15', dir: 'Outbound', text: `Container loaded on vessel ${shipment.vesselName}. Sailed on 13 Oct. ETA ${shipment.podName} on ${shipment.eta}.` },
              { ch: 'Email', to: 'export@krishnaceramics.com', date: '13 Oct 08:30', dir: 'Outbound', text: `House Bill of Lading (MAPS-HBL-240342-01) and Tax Invoice dispatched. 3 Originals sent via courier.` },
              { ch: 'Email', to: 'agency@hamburgshipping.de', date: '12 Oct 16:00', dir: 'Outbound', text: `Pre-alert: Vessel ${shipment.vesselName} ETA Hamburg 15 Nov. Manifest and non-negotiable BL attached.` }
            ].map((msg, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${msg.ch === 'WhatsApp' ? 'text-emerald-400' : 'text-sky-400'}`}>
                    [{msg.ch}] {msg.dir} → {msg.to}
                  </span>
                  <span className="text-[10px] font-mono text-[#A8A299]">{msg.date}</span>
                </div>
                <p className="text-zinc-200">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4 text-xs">
          <span className="font-bold text-sm text-[#F4EFE6]">Internal Instructions & Notes</span>
          <textarea
            value={shipment.notes || ''}
            onChange={e => updateShipment(shipment.id, { notes: e.target.value })}
            rows={4}
            placeholder="Add internal notes, LC conditions, customer delivery instructions..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-3 text-[#F4EFE6] text-xs focus:border-[#E88B2A]"
          />
          <p className="text-[10px] text-[#A8A299]">Notes are automatically saved to internal operational audit log.</p>
        </div>
      )}

      {/* TAB 8: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3 text-xs">
          <span className="font-bold text-sm text-[#F4EFE6]">Immutable Change History</span>
          <div className="space-y-2">
            {[
              { d: '15 Oct 10:15', u: 'Utsav Panchal', act: 'Container seal KL789412 verified with port gate' },
              { d: '14 Oct 16:40', u: 'Seema Dana', act: 'Recorded payment of ₹2,75,317 against linked invoice' },
              { d: '12 Oct 08:20', u: 'Aman Dana', act: 'HBL MAPS-HBL-240342-01 issued and digitally signed' }
            ].map((aud, i) => (
              <div key={i} className="p-2 rounded bg-[#16263F] border border-[#1C2D4A] flex justify-between">
                <div>
                  <p className="font-semibold text-[#F4EFE6]">{aud.act}</p>
                  <p className="text-[10px] text-[#A8A299]">By {aud.u}</p>
                </div>
                <span className="font-mono text-[10px] text-[#6E6A64]">{aud.d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
