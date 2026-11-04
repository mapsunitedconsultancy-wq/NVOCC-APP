import React, { useState } from 'react';
import { X, Ship, Plus, AlertCircle } from 'lucide-react';
import { NewManifestPayload } from '../types';

interface NewManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewManifestPayload) => void;
}

export const NewManifestModal: React.FC<NewManifestModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [vesselName, setVesselName] = useState('');
  const [voyageNumber, setVoyageNumber] = useState('');
  const [carrierName, setCarrierName] = useState('Ocean Network Express (ONE)');
  const [pol, setPol] = useState('Mundra (INMUN)');
  const [pod, setPod] = useState('Jebel Ali (AEJEA)');
  const [sailedDate, setSailedDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
  const [containerCount, setContainerCount] = useState('16');
  const [totalGrossWtKg, setTotalGrossWtKg] = useState('340000');
  const [hblInput, setHblInput] = useState('LCMUNJEALMU2600407, MAPS-HBL-240342-01');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName.trim() || !voyageNumber.trim()) {
      setError('Please provide both Vessel Name and Voyage Number.');
      return;
    }
    const hbls = hblInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (hbls.length === 0) {
      setError('Please provide at least one House Bill of Lading (HBL).');
      return;
    }

    const cCount = parseInt(containerCount, 10) || 1;
    const wt = parseInt(totalGrossWtKg, 10) || 20000;

    setError('');
    onSubmit({
      vesselName: vesselName.trim(),
      voyageNumber: voyageNumber.trim(),
      carrierName,
      pol,
      pod,
      sailedDate,
      hblList: hbls,
      containerCount: cCount,
      totalGrossWtKg: wt
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30">
              <Ship className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
              Initiate New Vessel EGM Manifest
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A8A299] hover:text-[#F4EFE6] p-1 rounded-lg hover:bg-[#16263F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#A8A299]">
          Register a sailed voyage to start tracking the mandatory 7-day ICEGATE EGM lodgment window under Section 41.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Vessel Name *</label>
              <input
                type="text"
                placeholder="e.g. ONE COMMITMENT"
                value={vesselName}
                onChange={e => setVesselName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] uppercase font-mono focus:outline-none focus:border-[#E88B2A]"
                required
              />
            </div>
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Voyage Number *</label>
              <input
                type="text"
                placeholder="e.g. 054W"
                value={voyageNumber}
                onChange={e => setVoyageNumber(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] uppercase font-mono focus:outline-none focus:border-[#E88B2A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[#A8A299] font-semibold block mb-1">Shipping Line / Carrier</label>
            <input
              type="text"
              value={carrierName}
              onChange={e => setCarrierName(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Port of Loading (POL)</label>
              <select
                value={pol}
                onChange={e => setPol(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
              >
                <option value="Mundra (INMUN)">Mundra (INMUN)</option>
                <option value="Nhava Sheva (INNSA)">Nhava Sheva (INNSA)</option>
                <option value="Pipavav (INPAV)">Pipavav (INPAV)</option>
                <option value="Hazira (INHZR)">Hazira (INHZR)</option>
                <option value="Chennai (INMAA)">Chennai (INMAA)</option>
                <option value="Cochin (INCOK)">Cochin (INCOK)</option>
              </select>
            </div>
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Port of Discharge (POD)</label>
              <select
                value={pod}
                onChange={e => setPod(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
              >
                <option value="Jebel Ali (AEJEA)">Jebel Ali (AEJEA)</option>
                <option value="Rotterdam (NLRTM)">Rotterdam (NLRTM)</option>
                <option value="Hamburg (DEHAM)">Hamburg (DEHAM)</option>
                <option value="Singapore (SGSIN)">Singapore (SGSIN)</option>
                <option value="Port Klang (MYPKG)">Port Klang (MYPKG)</option>
                <option value="Antwerp (BEANR)">Antwerp (BEANR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Sailed Date</label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={sailedDate}
                onChange={e => setSailedDate(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Containers</label>
              <input
                type="number"
                value={containerCount}
                onChange={e => setContainerCount(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
            <div>
              <label className="text-[#A8A299] font-semibold block mb-1">Gross Wt (KG)</label>
              <input
                type="number"
                value={totalGrossWtKg}
                onChange={e => setTotalGrossWtKg(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#A8A299] font-semibold block mb-1">
              House Bills of Lading (comma separated):
            </label>
            <input
              type="text"
              value={hblInput}
              onChange={e => setHblInput(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1C2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299] hover:text-[#F4EFE6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Vessel Manifest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
