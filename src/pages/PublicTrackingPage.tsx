import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ship, Search, Share2, CheckCircle2, Clock, Anchor, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { StatusPill } from '../components/common/StatusPill';

interface PublicTrackingProps {
  initialShipmentId?: string;
  onNavigateHome: () => void;
}

export const PublicTrackingPage: React.FC<PublicTrackingProps> = ({ initialShipmentId, onNavigateHome }) => {
  const { shipments, showToast } = useApp();

  const [searchId, setSearchId] = useState(initialShipmentId || 'MAPS-240342');
  const [activeShipmentId, setActiveShipmentId] = useState(initialShipmentId || 'MAPS-240342');

  const shipment = shipments.find(s => s.id === activeShipmentId) || shipments[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setActiveShipmentId(searchId.trim().toUpperCase());
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://mapsfreight.com/track/${shipment.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    showToast('success', 'Tracking Link Copied', `Direct tracking link for ${shipment.id} copied to clipboard.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs pb-12">
      {/* Public Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C2D4A]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
          <div className="w-8 h-8 rounded-lg bg-[#E88B2A] flex items-center justify-center font-bold text-slate-950">
            <Ship className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-[#F4EFE6] tracking-tight">MAPS PUBLIC CARGO TRACKER</h1>
            <p className="text-[10px] text-[#A8A299]">Live Container & Vessel Tracking Portal</p>
          </div>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#E88B2A] border border-[#26395A] font-semibold"
        >
          Login to NVOCC Dashboard →
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            placeholder="Enter Shipment ID (e.g. MAPS-240342) or Container Number..."
            className="w-full bg-[#0F1D33] border border-[#26395A] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#F4EFE6] placeholder-[#6E6A64] font-mono focus:border-[#E88B2A]"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl font-bold bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all"
        >
          Track Cargo
        </button>
      </form>

      {/* Shipment Tracker Card */}
      {shipment && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-5 space-y-6 shadow-xl">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1C2D4A]">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-[#E88B2A]">{shipment.id}</span>
                <StatusPill status={shipment.status} size="sm" pulse={shipment.status === 'on_vessel'} />
              </div>
              <p className="text-xs text-[#A8A299] mt-1 font-mono">
                Container: <strong className="text-[#F4EFE6]">{shipment.containers[0]?.containerNumber || 'MSKU2345678'}</strong> ({shipment.containers[0]?.equipmentType || "40'HC"})
              </p>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Tracking Link
            </button>
          </div>

          {/* Route Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#16263F] border border-[#26395A]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6E6A64]">Port of Loading</span>
              <p className="text-base font-bold text-[#F4EFE6] mt-0.5">{shipment.polName}</p>
              <p className="text-xs text-[#A8A299]">Sailed on: {shipment.etd}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6E6A64]">Port of Discharge</span>
              <p className="text-base font-bold text-sky-400 mt-0.5">{shipment.podName}</p>
              <p className="text-xs text-emerald-400 font-semibold">Estimated Arrival: {shipment.eta}</p>
            </div>
          </div>

          {/* Vessel Badge */}
          <div className="p-3 bg-[#16263F]/50 rounded-lg border border-[#1C2D4A] flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <Anchor className="w-4 h-4 text-[#E88B2A]" />
              Ocean Vessel: <strong className="text-[#F4EFE6]">{shipment.vesselName} (Voy: {shipment.voyageNumber})</strong>
            </span>
            <span className="text-[#A8A299]">Carrier: {shipment.carrierName}</span>
          </div>

          {/* Milestone Event Journey */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">Milestone Event Journey</h3>
            <div className="relative border-l-2 border-[#1C2D4A] ml-3 pl-4 space-y-4 pt-1">
              {shipment.events.map(ev => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[#E88B2A] ring-4 ring-[#0F1D33]"></div>
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-semibold text-sm text-[#F4EFE6]">{ev.title}</h4>
                    <span className="text-[10px] font-mono text-[#A8A299]">{ev.timestamp}</span>
                  </div>
                  <p className="text-zinc-300 text-xs mt-0.5">{ev.description}</p>
                  <span className="text-[10px] text-[#6E6A64] font-mono mt-1 block">Location: {ev.location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
