import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ManagedContainer } from '../../data/container-control';
import {
  Ship,
  Boxes,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Phone,
  MessageSquare,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface PublicContainerTrackingViewProps {
  containerNumber?: string;
  onBack?: () => void;
}

export const PublicContainerTrackingView: React.FC<PublicContainerTrackingViewProps> = ({
  containerNumber = 'MSKU2345678',
  onBack
}) => {
  const { managedContainers, showToast, setActivePrintDoc } = useApp();
  const [copied, setCopied] = useState(false);

  // Find container or fallback to first
  const container: ManagedContainer = 
    managedContainers.find(c => c.containerNumber.toUpperCase() === containerNumber.toUpperCase()) ||
    managedContainers[0];

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('success', 'Tracking Link Copied', 'Public tracking link copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const isImport = container.direction === 'Import';
  const importStages = ['CONFIRMED', 'ARRIVED', 'DISCHARGED', 'AT CFS', 'DO RECEIVED', 'GATED OUT', 'DELIVERED', 'EMPTY IN TRANSIT', 'EMPTY RETURNED', 'BILLED'];
  const exportStages = ['BOOKING', 'EMPTY PICKED UP', 'STUFFING', 'IN TRANSIT', 'GATE-IN', 'LEO/LOADED', 'BILLED'];
  const stages = isImport ? importStages : exportStages;
  const currentStageIndex = stages.indexOf(container.currentStage);

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F4EFE6] p-3 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Top Header Bar */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E88B2A]/20 border border-[#E88B2A]/40 text-[#E88B2A] flex items-center justify-center font-black text-xl shadow">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#E88B2A] font-bold">
                  MAPS CONTAINER CONTROL
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                  VERIFIED PUBLIC FEED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#F4EFE6]">
                Container {container.containerNumber}
              </h1>
              <p className="text-xs text-[#A8A299]">
                Shipment {container.shipmentId} • Carrier: {container.carrierName} ({container.carrierScac})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-xs font-semibold text-[#F4EFE6] border border-[#26395A] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#A8A299]" />}
              <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-xs font-bold text-[#0A1628] transition-colors shadow-md"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Status Highlight Banner */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
          container.riskLevel === 'Overdue'
            ? 'bg-rose-950/40 border-rose-800 text-rose-200'
            : container.riskLevel === 'Critical'
            ? 'bg-amber-950/40 border-amber-800 text-amber-200'
            : container.riskLevel === 'Watch'
            ? 'bg-yellow-950/30 border-yellow-800 text-yellow-200'
            : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#0F1D33] border border-white/10">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                {container.riskLevel === 'Overdue' ? 'Demurrage Penal Status' : 'Port Free-Time Status'}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {container.riskLevel === 'Overdue'
                  ? `OVERDUE: ₹${container.totalDemurrageAccruedINR.toLocaleString('en-IN')} Penal Demurrage Accruing`
                  : `${Math.floor(container.freeTimeHoursRemaining / 24)}d ${container.freeTimeHoursRemaining % 24}h Remaining Until Demurrage Starts`}
              </span>
              <p className="text-xs opacity-75 mt-0.5">
                Free time expiry: {container.freeTimeEnd} • Daily tariff if delayed: ₹{container.demurragePerDayINR.toLocaleString('en-IN')}/day
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-black/40 border border-white/20">
              Stage: {container.currentStage}
            </span>
          </div>
        </div>

        {/* Lifecycle Chain Visualization (Sub-Module 2) */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
            <div>
              <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#E88B2A]" />
                {container.direction.toUpperCase()} LIFECYCLE PROGRESSION ({stages.length} MILESTONES)
              </h2>
              <p className="text-[11px] text-[#A8A299] mt-0.5">
                GPS telemetry, terminal EDI 315 & ICEGATE customs interchange
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#E88B2A]">
              Step {currentStageIndex + 1} of {stages.length}
            </span>
          </div>

          {/* Horizontal Chevron Timeline */}
          <div className="overflow-x-auto pb-3">
            <div className="flex items-center min-w-[700px] gap-1.5">
              {stages.map((stg, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isFuture = idx > currentStageIndex;

                return (
                  <div key={stg} className="flex-1 flex flex-col items-center relative group">
                    <div className={`w-full py-2.5 px-2 rounded-lg text-center text-[10px] font-bold tracking-tight border transition-all flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                      isCurrent
                        ? 'bg-[#E88B2A] text-[#0A1628] border-[#E88B2A] shadow-lg shadow-[#E88B2A]/20 ring-2 ring-[#E88B2A]/40'
                        : isPassed
                        ? 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                        : 'bg-[#16263F]/50 text-[#6E6A64] border-[#1C2D4A]'
                    }`}>
                      <div className="flex items-center gap-1">
                        {isPassed && <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />}
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-[#0A1628] animate-ping shrink-0" />}
                        <span className="uppercase">{stg}</span>
                      </div>
                      <span className={`text-[8.5px] font-mono ${isCurrent ? 'text-[#0A1628] font-semibold' : 'opacity-70'}`}>
                        {isCurrent ? `${container.daysAtStage}d here` : isPassed ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & CFS Particulars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location Box */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Custody & Physical Location
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE IN YARD
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">Current Facility:</span>
                <span className="font-bold text-[#F4EFE6] text-right">{container.cfsName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">Zone / Area:</span>
                <span className="font-mono text-[#F4EFE6] text-right">{container.cfsLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">Yard Ingate Date:</span>
                <span className="font-mono text-[#F4EFE6] text-right">{container.cfsEntryDate} ({container.cfsDays} days)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A8A299]">Accrued CFS Charges:</span>
                <span className="font-mono font-bold text-emerald-400 text-right">₹{container.cfsChargesAccruedINR.toLocaleString('en-IN')} (incl. GST)</span>
              </div>
            </div>
          </div>

          {/* Equipment & Cargo Specs */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E88B2A]" />
                Equipment & Verified VGM
              </span>
              <span className="text-[10px] text-[#A8A299] font-mono">
                ISO 6346 VALIDATED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">Container Type:</span>
                <span className="font-bold text-[#F4EFE6]">{container.equipmentType} ({container.cargoType})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">High Security Seal:</span>
                <span className="font-mono font-bold text-sky-400">{container.sealNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                <span className="text-[#A8A299]">VGM Certified Weight:</span>
                <span className="font-mono font-bold text-[#F4EFE6]">{container.vgmWeightKg?.toLocaleString('en-IN')} KG</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A8A299]">Associated Parties:</span>
                <span className="text-xs text-[#F4EFE6] text-right truncate max-w-[220px]">{container.shipperName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Downloadable Documents Section */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
            <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E88B2A]" />
              Official Digital Documents & Proof of Clearance
            </h2>
            <span className="text-xs text-[#A8A299]">Instant Print & PDF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setActivePrintDoc({ type: 'HBL', data: { hblNumber: `MAPS-HBL-${container.containerNumber.slice(0, 7)}`, shipperName: container.shipperName, oceanVessel: 'MSC JADE', voyageNo: '437W', portOfLoading: 'MUNDRA PORT (INMUN)', portOfDischarge: 'HAMBURG (DEHAM)', placeOfDelivery: 'HAMBURG', containerAndSeals: `${container.containerNumber} / Seal: ${container.sealNumber}`, grossWeightKg: container.grossWeightKg, measurementCbm: 42, freightTerm: 'Prepaid', numberOfOriginals: 3, dateOfIssue: '15 Oct 2026', totalFreightUSD: 2450 } })}
              className="p-3.5 rounded-xl bg-[#16263F] hover:bg-[#1E3558] border border-[#26395A] text-left transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#E88B2A] block transition-colors">
                  House Bill of Lading (HBL)
                </span>
                <span className="text-[10px] text-[#A8A299]">FIATA Standard • 3 Originals</span>
              </div>
              <Download className="w-4 h-4 text-[#A8A299] group-hover:text-[#E88B2A]" />
            </button>

            <button
              onClick={() => setActivePrintDoc({ type: 'INVOICE', data: { invoiceNumber: `MAPS/CC/24-25/0012`, customerName: container.shipperName, invoiceDate: '15 Oct 2026', dueDate: '30 Oct 2026', placeOfSupply: 'Gujarat (24)', totalINR: container.cfsChargesAccruedINR, lineItems: [{ description: `Container Control Tracking & CFS pass-through for ${container.containerNumber}`, amount: container.cfsChargesAccruedINR }] } })}
              className="p-3.5 rounded-xl bg-[#16263F] hover:bg-[#1E3558] border border-[#26395A] text-left transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#E88B2A] block transition-colors">
                  Tax Invoice / CFS Receipt
                </span>
                <span className="text-[10px] text-[#A8A299]">GST SAC 996611 Compliant</span>
              </div>
              <Download className="w-4 h-4 text-[#A8A299] group-hover:text-[#E88B2A]" />
            </button>

            <div className="p-3.5 rounded-xl bg-[#16263F] border border-[#26395A] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F4EFE6] block">
                  Scan QR Verification
                </span>
                <span className="text-[10px] text-[#A8A299]">Live Terminal Interchange</span>
              </div>
              <QrCode className="w-6 h-6 text-[#E88B2A]" />
            </div>
          </div>
        </div>

        {/* Live Support Strip */}
        <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#F4EFE6]">Need expedited Delivery Order (DO) or trailer placement?</p>
              <p className="text-[11px] text-[#A8A299]">24/7 Mundra & Gandhidham Terminal Operations Desk</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/919825011492?text=Hello%20MAPS%20Freight%2C%20inquiring%20about%20Container%20Control%20for%20container"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Ops Desk</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
