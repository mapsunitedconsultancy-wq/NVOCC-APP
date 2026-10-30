import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Ship, FileText, Receipt, MessageSquare, Download, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { StatusPill } from '../../components/common/StatusPill';
import { formatINR } from '../../utils/formatters';

export const CustomerPortalPage: React.FC = () => {
  const { shipments, invoices, hbls, setActivePrintDoc, setActiveView, setViewParam } = useApp();

  // Shipper shipments for Krishna Ceramics
  const customerShipments = shipments.filter(s => s.shipperName.includes('Krishna Ceramics'));
  const customerInvoices = invoices.filter(i => i.billToPartyName.includes('Krishna Ceramics'));

  const activeCount = customerShipments.filter(s => s.status !== 'delivered').length;
  const deliveredCount = customerShipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="space-y-5 text-xs">
      {/* Shipper Portal Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F1D33] via-[#16263F] to-[#0A1628] border border-[#26395A] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Shipper Self-Service Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] mt-1">
            Krishna Ceramics Export Desk
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Lalpar Ceramic Zone, Morbi, Gujarat • GSTIN: 24AABCK1234D1Z5
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveView('shipping_instructions');
              setViewParam('submit');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold transition-all shadow-md shadow-[#E88B2A]/20 cursor-pointer"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            Submit SI
          </button>
          <a
            href="https://wa.me/919876543210?text=Hi%20MAPS%20Ops,%20need%20assistance%20with%20our%20Mundra%20export%20containers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Dedicated Ops
          </a>
        </div>
      </div>

      {/* Shipper Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase">Active Shipments</span>
          <p className="text-2xl font-bold font-mono text-[#F4EFE6] mt-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">In transit or at Mundra Port</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase">Delivered (YTD)</span>
          <p className="text-2xl font-bold font-mono text-[#F4EFE6] mt-1">{deliveredCount + 28}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Europe, US & Middle East</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase">Total TEU Exported</span>
          <p className="text-2xl font-bold font-mono text-[#E88B2A] mt-1">68 TEU</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Vitrified tiles export volume</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase">Open Invoices</span>
          <p className="text-2xl font-bold font-mono text-[#F4EFE6] mt-1">₹0</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Account in good credit standing</p>
        </div>
      </div>

      {/* Active Shipper Shipments */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
          <span className="font-bold text-sm text-[#F4EFE6] flex items-center gap-1.5">
            <Ship className="w-4 h-4 text-[#E88B2A]" />
            Your Live Export Shipments
          </span>
          <span className="text-[#A8A299] font-mono">{customerShipments.length} Records</span>
        </div>

        <div className="space-y-3">
          {customerShipments.map(s => {
            const hbl = hbls.find(h => h.shipmentId === s.id);

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-[#16263F]/70 border border-[#26395A] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#E88B2A]">{s.id}</span>
                      <StatusPill status={s.status} size="xs" pulse={s.status === 'on_vessel'} />
                      <span className="text-[11px] text-[#A8A299]">Ref: {s.referenceNo}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">
                      Destination: {s.consigneeName} ({s.podName})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hbl && (
                      <button
                        onClick={() => setActivePrintDoc({ type: 'HBL', data: hbl })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F1D33] hover:bg-[#1D3251] text-[#E88B2A] border border-[#26395A] font-semibold text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download HBL
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveView('public_tracking');
                        setViewParam(s.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 border border-sky-800/60 font-semibold text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Live Container Tracking
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1C2D4A] text-[11px] font-mono">
                  <div><span className="font-sans text-[#6E6A64]">Container:</span> <strong className="text-[#F4EFE6]">{s.containers[0]?.containerNumber || 'TBD'}</strong></div>
                  <div><span className="font-sans text-[#6E6A64]">Vessel:</span> {s.vesselName} ({s.voyageNumber})</div>
                  <div><span className="font-sans text-[#6E6A64]">Cargo:</span> {s.grossWeight.toLocaleString('en-IN')} KG Tiles</div>
                  <div><span className="font-sans text-[#6E6A64]">ETA:</span> <strong className="text-emerald-400">{s.eta}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
