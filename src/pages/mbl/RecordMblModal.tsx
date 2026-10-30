import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MBL } from '../../types';
import { X, Layers, Plus, Check, Ship, DollarSign, Boxes, Calendar } from 'lucide-react';

interface RecordMblModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordMblModal: React.FC<RecordMblModalProps> = ({ isOpen, onClose }) => {
  const { addMBL, hbls, shipments, showToast } = useApp();

  const carriers = [
    { name: 'Mediterranean Shipping Company (MSC)', scac: 'MSCU', prefix: 'MEDU' },
    { name: 'Maersk Line', scac: 'MAEU', prefix: 'MAEU' },
    { name: 'CMA CGM', scac: 'CMDU', prefix: 'CMDU' },
    { name: 'Hapag-Lloyd', scac: 'HLCU', prefix: 'HLCU' },
    { name: 'Ocean Network Express (ONE)', scac: 'ONEY', prefix: 'ONEU' }
  ];

  const [selectedCarrier, setSelectedCarrier] = useState(carriers[0]);
  const [mblNumber, setMblNumber] = useState(`MEDUMUN${Math.floor(100000 + Math.random() * 900000)}`);
  const [bookingRef, setBookingRef] = useState(`BKG-MUN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [vesselVoyage, setVesselVoyage] = useState('MSC JADE / 437W');
  const [pol, setPol] = useState('Mundra Port (INMUN)');
  const [pod, setPod] = useState('Hamburg (DEHAM)');
  const [etd, setEtd] = useState('18 Oct 2026');
  const [eta, setEta] = useState('15 Nov 2026');
  const [containerInput, setContainerInput] = useState('MSKU2345678, MSCU4492104');
  const [totalTeu, setTotalTeu] = useState(2);
  const [totalWeightKg, setTotalWeightKg] = useState(26400);
  const [freightAmountUSD, setFreightAmountUSD] = useState(2450);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Collect'>('Paid');
  const [status, setStatus] = useState<MBL['status']>('Issued');
  const [selectedHbls, setSelectedHbls] = useState<string[]>(
    hbls.slice(0, 2).map(h => h.hblNumber)
  );

  if (!isOpen) return null;

  const handleCarrierChange = (carrierName: string) => {
    const c = carriers.find(item => item.name === carrierName) || carriers[0];
    setSelectedCarrier(c);
    setMblNumber(`${c.prefix}MUN${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const toggleHbl = (hblNo: string) => {
    setSelectedHbls(prev =>
      prev.includes(hblNo) ? prev.filter(h => h !== hblNo) : [...prev, hblNo]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const containers = containerInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const newMbl: MBL = {
      id: `mbl-${Date.now()}`,
      mblNumber: mblNumber.trim().toUpperCase(),
      carrierName: selectedCarrier.name,
      carrierScac: selectedCarrier.scac,
      carrierBookingRef: bookingRef.trim().toUpperCase(),
      vesselVoyage: vesselVoyage.trim(),
      pol,
      pod,
      etd,
      eta,
      status,
      containerNumbers: containers.length > 0 ? containers : ['MSKU2345678'],
      totalContainers: containers.length || 1,
      totalTeu: Number(totalTeu) || 1,
      totalWeightKg: Number(totalWeightKg) || 24000,
      linkedHbls: selectedHbls,
      freightAmountUSD: Number(freightAmountUSD) || 0,
      paymentStatus,
      reconciled: true,
      shipperName: 'MAPS FREIGHT SOLUTIONS PVT LTD (FORWARDER)',
      consigneeName: 'TO ORDER OF DESTINATION AGENT',
      dateOfIssue: `${new Date().getDate()} Oct 2026`,
      placeOfIssue: 'Mundra Port Office'
    };

    addMBL(newMbl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1C2D4A] bg-[#16263F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E88B2A]/20 text-[#E88B2A] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4EFE6]">
                Record Carrier Master Bill of Lading (MBL)
              </h2>
              <p className="text-[11px] text-[#A8A299]">
                Ingest carrier contract bill of lading, booking reference, and container manifest
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1D3251] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] text-xs">
          {/* Carrier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Ocean Shipping Line *</label>
              <select
                value={selectedCarrier.name}
                onChange={e => handleCarrierChange(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6] font-semibold focus:outline-none focus:border-[#E88B2A]"
              >
                {carriers.map(c => (
                  <option key={c.scac} value={c.name}>
                    {c.name} ({c.scac})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Carrier MBL Number *</label>
              <input
                type="text"
                value={mblNumber}
                onChange={e => setMblNumber(e.target.value)}
                required
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#E88B2A] font-mono font-bold focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          {/* Booking & Vessel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Carrier Booking Reference</label>
              <input
                type="text"
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value)}
                required
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Ocean Vessel & Voyage *</label>
              <input
                type="text"
                value={vesselVoyage}
                onChange={e => setVesselVoyage(e.target.value)}
                required
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6]"
              />
            </div>
          </div>

          {/* Ports & Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Port of Loading</label>
              <input
                type="text"
                value={pol}
                onChange={e => setPol(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Port of Discharge</label>
              <input
                type="text"
                value={pod}
                onChange={e => setPod(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">ETD Mundra</label>
              <input
                type="text"
                value={etd}
                onChange={e => setEtd(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">ETA Destination</label>
              <input
                type="text"
                value={eta}
                onChange={e => setEta(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
          </div>

          {/* Containers & Weights */}
          <div className="bg-[#16263F] p-3 rounded-xl border border-[#26395A] space-y-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">
                Container Numbers (comma separated) *
              </label>
              <input
                type="text"
                value={containerInput}
                onChange={e => setContainerInput(e.target.value)}
                placeholder="e.g. MSKU2345678, MSCU4492104"
                className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Total TEU</label>
                <input
                  type="number"
                  value={totalTeu}
                  onChange={e => setTotalTeu(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Gross Weight (KG)</label>
                <input
                  type="number"
                  value={totalWeightKg}
                  onChange={e => setTotalWeightKg(Number(e.target.value))}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Ocean Freight (USD)</label>
                <input
                  type="number"
                  value={freightAmountUSD}
                  onChange={e => setFreightAmountUSD(Number(e.target.value))}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Status & Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">MBL Document Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6] font-semibold"
              >
                <option value="Carrier Draft">Carrier Draft</option>
                <option value="Issued">Issued</option>
                <option value="Originals Received">Originals Received</option>
                <option value="Surrendered">Surrendered</option>
                <option value="Telex Released">Telex Released</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Freight Terms</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6] font-semibold"
              >
                <option value="Paid">Prepaid / Paid at Origin</option>
                <option value="Collect">Freight Collect at Destination</option>
              </select>
            </div>
          </div>

          {/* Linked HBLs Checklist */}
          <div>
            <label className="block text-[#A8A299] mb-1.5 font-semibold">
              Select Linked House Bills of Lading (HBLs) to Consolidate:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-[#16263F] rounded-lg border border-[#26395A]">
              {hbls.map((h, idx) => {
                const isSelected = selectedHbls.includes(h.hblNumber);
                return (
                  <div
                    key={`${h.id || h.hblNumber || 'hbl'}-${idx}`}
                    onClick={() => toggleHbl(h.hblNumber)}
                    className={`p-2 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#E88B2A]/15 border-[#E88B2A] text-[#F4EFE6]'
                        : 'bg-[#0F1D33] border-[#26395A] text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold block">{h.hblNumber}</span>
                      <span className="text-[10px] text-[#A8A299] block line-clamp-1">{h.shipperName}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#E88B2A]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1C2D4A] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-all shadow-md shadow-[#E88B2A]/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Save & Link Master B/L
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
