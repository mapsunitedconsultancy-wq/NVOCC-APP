import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { validateISO6346 } from '../../utils/formatters';
import { CFS_TARIFF_MASTER } from '../../data/container-control';
import { X, Boxes, ShieldCheck, AlertCircle, Plus, Check } from 'lucide-react';

interface AddContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContainerModal: React.FC<AddContainerModalProps> = ({ isOpen, onClose }) => {
  const { shipments, addContainer, showToast } = useApp();

  const [containerNumber, setContainerNumber] = useState('MSKU');
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id || 'MAPS-240342');
  const [shipperName, setShipperName] = useState('Krishna Ceramics Pvt Ltd');
  const [carrierName, setCarrierName] = useState('Maersk Line');
  const [equipmentType, setEquipmentType] = useState<any>("40'HC");
  const [cargoType, setCargoType] = useState<any>('General Cargo');
  const [direction, setDirection] = useState<'Import' | 'Export'>('Import');
  const [currentStage, setCurrentStage] = useState<any>('AT CFS');
  const [cfsId, setCfsId] = useState('cfs-allcargo-mun');
  const [freeTimeDays, setFreeTimeDays] = useState(7);
  const [sealNumber, setSealNumber] = useState(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [grossWeightKg, setGrossWeightKg] = useState(26500);

  if (!isOpen) return null;

  const isoValidation = validateISO6346(containerNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isoValidation.isValid) {
      showToast('warning', 'Invalid ISO 6346 Container', isoValidation.message);
      return;
    }

    const selectedCfs = CFS_TARIFF_MASTER.find(c => c.id === cfsId) || CFS_TARIFF_MASTER[0];

    addContainer({
      containerNumber: containerNumber.trim().toUpperCase(),
      shipmentId: selectedShipmentId,
      shipperName,
      consigneeName: 'Overseas Consignee',
      carrierName,
      carrierScac: carrierName.slice(0, 4).toUpperCase(),
      equipmentType,
      cargoType,
      sealNumber,
      direction,
      currentStage,
      cfsName: selectedCfs.name,
      cfsLocation: selectedCfs.location,
      freeTimeDays,
      grossWeightKg: Number(grossWeightKg) || 24000,
      vgmWeightKg: Number(grossWeightKg) || 24000
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in no-print">
      <div className="relative w-full max-w-xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1C2D4A] bg-[#16263F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E88B2A]/20 text-[#E88B2A] flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider">
                Add Container to Fleet Control
              </h2>
              <p className="text-[11px] text-[#A8A299]">
                ISO 6346 validation, D&D clock calibration & CFS tariff linkage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1D3251]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* ISO 6346 Input with live validation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-[#A8A299] uppercase tracking-wider">
                Container Number (ISO 6346):
              </label>
              <span className={`text-[10px] font-mono font-bold ${isoValidation.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isoValidation.message}
              </span>
            </div>
            <input
              type="text"
              value={containerNumber}
              onChange={e => setContainerNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MSKU 2345678"
              maxLength={11}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
              required
            />
            {isoValidation.isValid && isoValidation.ownerCode && (
              <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Owner: <strong>{isoValidation.ownerCode}</strong> • Category: <strong>{isoValidation.equipmentCategory}</strong> • Serial: <strong>{isoValidation.serialNumber}</strong> • Check: <strong>{isoValidation.checkDigit}</strong></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Direction:
              </label>
              <select
                value={direction}
                onChange={e => {
                  setDirection(e.target.value as any);
                  setCurrentStage(e.target.value === 'Import' ? 'AT CFS' : 'EMPTY PICKED UP');
                }}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-semibold text-[#F4EFE6]"
              >
                <option value="Import">Import (Discharge to CFS)</option>
                <option value="Export">Export (Factory to Port)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Current Stage:
              </label>
              <select
                value={currentStage}
                onChange={e => setCurrentStage(e.target.value as any)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-semibold text-[#F4EFE6]"
              >
                {direction === 'Import' ? (
                  <>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="DISCHARGED">DISCHARGED</option>
                    <option value="AT CFS">AT CFS</option>
                    <option value="DO RECEIVED">DO RECEIVED</option>
                    <option value="GATED OUT">GATED OUT</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </>
                ) : (
                  <>
                    <option value="BOOKING">BOOKING</option>
                    <option value="EMPTY PICKED UP">EMPTY PICKED UP</option>
                    <option value="STUFFING">STUFFING</option>
                    <option value="IN TRANSIT">IN TRANSIT</option>
                    <option value="GATE-IN">GATE-IN</option>
                    <option value="LEO/LOADED">LEO/LOADED</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Equipment Type:
              </label>
              <select
                value={equipmentType}
                onChange={e => setEquipmentType(e.target.value as any)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              >
                <option value="20'GP">20' Standard Dry (20'GP)</option>
                <option value="40'GP">40' Standard Dry (40'GP)</option>
                <option value="40'HC">40' High Cube Dry (40'HC)</option>
                <option value="20'RF">20' Reefer (20'RF)</option>
                <option value="40'RF">40' High Cube Reefer (40'RF)</option>
                <option value="20'OT">20' Open Top (20'OT)</option>
                <option value="40'OT">40' Open Top (40'OT)</option>
                <option value="20'FR">20' Flat Rack (20'FR)</option>
                <option value="40'FR">40' Flat Rack (40'FR)</option>
                <option value="20'TK">20' ISO Tank (20'TK)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Cargo Type:
              </label>
              <select
                value={cargoType}
                onChange={e => setCargoType(e.target.value as any)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              >
                <option value="General Cargo">General Cargo (Non-Hazardous)</option>
                <option value="Hazardous / DG">Hazardous / IMDG (Special Yard)</option>
                <option value="Reefer">Temperature Controlled Reefer</option>
                <option value="ODC / OOG">Over-Dimensional Cargo (ODC)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                CFS Location:
              </label>
              <select
                value={cfsId}
                onChange={e => setCfsId(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              >
                {CFS_TARIFF_MASTER.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Free Time Days:
              </label>
              <input
                type="number"
                value={freeTimeDays}
                onChange={e => setFreeTimeDays(Number(e.target.value))}
                min={1}
                max={30}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Shipper / Customer Name:
              </label>
              <input
                type="text"
                value={shipperName}
                onChange={e => setShipperName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                Gross VGM Weight (KG):
              </label>
              <input
                type="number"
                value={grossWeightKg}
                onChange={e => setGrossWeightKg(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1C2D4A] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Register Container
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
