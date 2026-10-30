import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Boxes, Plus, Trash2, Printer, Check, AlertCircle, ArrowRight, X } from 'lucide-react';
import { formatUSD, formatINR } from '../../utils/formatters';

export const ConsolidationPage: React.FC = () => {
  const { hbls, setActivePrintDoc, showToast } = useApp();

  // Container configuration - Point 07 Golden LCL Consolidation (Mundra -> Jebel Ali)
  const [containerNumber, setContainerNumber] = useState('GESU5522039');
  const [equipmentType, setEquipmentType] = useState<"20'GP" | "40'HC">("40'HC");
  const maxWeightKg = equipmentType === "40'HC" ? 28600 : 26480;
  const maxCbm = equipmentType === "40'HC" ? 76.4 : 33.2;

  // LCL items in this consolidation - Exactly 3 Morbi shippers
  const [items, setItems] = useState([
    { id: '1', hbl: 'MAPS-HBL-240315-01', shipper: 'Krishna Ceramics', cbm: 24.5, weight: 9800, pkgs: '450 Bags Tiles', dest: 'Jebel Ali' },
    { id: '2', hbl: 'MAPS-HBL-240316-01', shipper: 'Pragati Ceramics', cbm: 22.0, weight: 8900, pkgs: '380 Cartons Wall Tiles', dest: 'Jebel Ali' },
    { id: '3', hbl: 'MAPS-HBL-240318-01', shipper: 'Saurashtra Minerals', cbm: 18.0, weight: 7400, pkgs: '12 Jumbo Bags Clay', dest: 'Jebel Ali' }
  ]);

  // Modal for adding consignment
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHblNumber, setNewHblNumber] = useState('');
  const [newShipper, setNewShipper] = useState('');
  const [newPkgs, setNewPkgs] = useState('');
  const [newCbm, setNewCbm] = useState(12.5);
  const [newWeight, setNewWeight] = useState(5200);
  const [newDest, setNewDest] = useState('Jebel Ali');

  // Allocation Method
  const [allocationMethod, setAllocationMethod] = useState<'weight' | 'volume' | 'equal'>('volume');
  const totalSharedOceanFreightUSD = 3200;

  // Calculate totals
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalCbm = items.reduce((sum, item) => sum + item.cbm, 0);

  const rawWeightPct = Math.round((totalWeight / maxWeightKg) * 100);
  const rawCbmPct = Math.round((totalCbm / maxCbm) * 100);
  const weightPct = Math.min(100, rawWeightPct);
  const cbmPct = Math.min(100, rawCbmPct);

  const isOverWeight = totalWeight > maxWeightKg;
  const isOverCbm = totalCbm > maxCbm;

  const handlePrintManifest = () => {
    setActivePrintDoc({
      type: 'MANIFEST',
      data: {
        containerNumber,
        vessel: 'MSC JADE 437W',
        voyage: '437W',
        portOfLoading: 'Mundra (INMUN)',
        portOfDischarge: 'Jebel Ali (AEJEA)',
        seal: 'KL889102',
        utilization: `${rawCbmPct}% (Volume) / ${rawWeightPct}% (Weight)`,
        totalWeight: `${totalWeight.toLocaleString()} KG`,
        totalCbm: `${totalCbm.toFixed(1)} CBM`,
        mblNumber: 'MSCU-LCL-JEA-2026',
        hbls: items
      }
    });
    showToast('success', 'LCL Manifest Issued', `Master B/L MSCU-LCL-JEA-2026 linked with 3 HBLs in container ${containerNumber}`);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('info', 'Consignment Removed', 'Container utilization recalculated.');
  };

  const handleAddConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    const hblCode = newHblNumber || `MAPS-HBL-240${Math.floor(320 + Math.random() * 50)}-01`;
    const shipperName = newShipper || 'Western Agro Exports';
    const pkgDesc = newPkgs || '200 Cartons General Goods';

    setItems(prev => [
      ...prev,
      {
        id: `lcl-${Date.now()}`,
        hbl: hblCode,
        shipper: shipperName,
        cbm: Number(newCbm) || 10,
        weight: Number(newWeight) || 3000,
        pkgs: pkgDesc,
        dest: newDest
      }
    ]);

    setShowAddModal(false);
    showToast('success', 'Consignment Added', `Linked ${hblCode} to container ${containerNumber}.`);
    // Reset form
    setNewHblNumber('');
    setNewShipper('');
    setNewPkgs('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#E88B2A]" />
            LCL Consolidation & Cost Allocation Engine
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Optimize container stuffing capacity, allocate shared ocean freight, and generate consolidated manifests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E88B2A]" />
            Add Consignment
          </button>

          <button
            onClick={handlePrintManifest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Printer className="w-4 h-4" />
            Generate Cargo Manifest PDF
          </button>
        </div>
      </div>

      {/* Over-Capacity Warning Banner */}
      {(isOverWeight || isOverCbm) && (
        <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-3.5 text-rose-200 flex items-start gap-3 shadow-lg animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-100 flex items-center gap-2">
              <span>CRITICAL CONTAINER OVER-CAPACITY WARNING</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 border border-rose-600 font-mono">
                {isOverWeight && `Weight: +${(totalWeight - maxWeightKg).toLocaleString()} KG OVER`}
                {isOverWeight && isOverCbm && ' | '}
                {isOverCbm && `Volume: +${(totalCbm - maxCbm).toFixed(1)} CBM OVER`}
              </span>
            </h4>
            <p className="text-[11px] text-rose-300">
              Payload exceeds ISO standards for equipment {equipmentType}. Terminal gate-in weighbridge at APSEZ / MICT Mundra will reject this container. Offload or reallocate consignments before releasing the EIR pass.
            </p>
          </div>
        </div>
      )}

      {/* Equipment Selector Strip */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#A8A299]">Box No:</span>
          <input
            type="text"
            value={containerNumber}
            onChange={e => setContainerNumber(e.target.value.toUpperCase())}
            className="bg-[#16263F] border border-[#26395A] rounded px-2.5 py-1 text-xs text-[#F4EFE6] font-mono font-bold"
          />
          <span className="font-bold text-[#A8A299] ml-2">Equipment:</span>
          <div className="inline-flex rounded-lg bg-[#16263F] p-0.5 border border-[#26395A]">
            <button
              type="button"
              onClick={() => setEquipmentType("20'GP")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                equipmentType === "20'GP" ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              20'GP (33.2 CBM / 26.4T)
            </button>
            <button
              type="button"
              onClick={() => setEquipmentType("40'HC")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                equipmentType === "40'HC" ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              40'HC (76.4 CBM / 28.6T)
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#A8A299]">
          Port of Destination: <span className="font-bold text-[#F4EFE6]">Jebel Ali, UAE (AEJEA)</span> • Hub: <span className="text-[#E88B2A]">Mundra Gateway CFS</span>
        </div>
      </div>

      {/* Container Tank Meter Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight Gauge */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#A8A299] uppercase tracking-wider text-[11px]">Payload Weight Utilization</span>
            <span className="font-mono font-bold text-sm text-[#F4EFE6]">
              {totalWeight.toLocaleString()} / {maxWeightKg.toLocaleString()} KG ({weightPct}%)
            </span>
          </div>
          <div className="w-full bg-[#16263F] h-4 rounded-full overflow-hidden p-0.5 border border-[#26395A]">
            <div
              style={{ width: `${weightPct}%` }}
              className={`h-full rounded-full transition-all ${
                weightPct > 95 ? 'bg-rose-500' : weightPct > 80 ? 'bg-[#E88B2A]' : 'bg-emerald-500'
              }`}
            ></div>
          </div>
          <p className="text-[10px] text-[#6E6A64]">
            Remaining Weight Allowance: {(maxWeightKg - totalWeight).toLocaleString()} KG
          </p>
        </div>

        {/* Volume CBM Gauge */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#A8A299] uppercase tracking-wider text-[11px]">Volumetric CBM Utilization</span>
            <span className="font-mono font-bold text-sm text-[#E88B2A]">
              {totalCbm.toFixed(1)} / {maxCbm} CBM ({cbmPct}%)
            </span>
          </div>
          <div className="w-full bg-[#16263F] h-4 rounded-full overflow-hidden p-0.5 border border-[#26395A]">
            <div
              style={{ width: `${cbmPct}%` }}
              className={`h-full rounded-full transition-all ${
                cbmPct > 95 ? 'bg-rose-500' : 'bg-[#E88B2A]'
              }`}
            ></div>
          </div>
          <p className="text-[10px] text-[#6E6A64]">
            Remaining Volume: {(maxCbm - totalCbm).toFixed(1)} CBM available in container
          </p>
        </div>
      </div>

      {/* Stuffing Manifest Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
          <span className="font-bold text-sm text-[#F4EFE6]">
            Consolidated Consignments Inside Container {containerNumber} ({equipmentType})
          </span>
          <span className="text-[#A8A299]">{items.length} HBL Consignments</span>
        </div>

        <table className="w-full text-left border border-[#26395A] rounded-lg overflow-hidden">
          <thead className="bg-[#16263F] text-[#A8A299] font-semibold text-[10px] uppercase">
            <tr>
              <th className="p-3">HBL Number</th>
              <th className="p-3">Shipper</th>
              <th className="p-3">Cargo Description</th>
              <th className="p-3 text-right">CBM</th>
              <th className="p-3 text-right">Gross Weight</th>
              <th className="p-3 text-right">Allocated Freight (USD)</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2D4A] font-mono">
            {items.map(item => {
              // Calculate allocated cost based on allocation method
              let shareUSD = 0;
              if (allocationMethod === 'volume' && totalCbm > 0) {
                shareUSD = Math.round((item.cbm / totalCbm) * totalSharedOceanFreightUSD);
              } else if (allocationMethod === 'weight' && totalWeight > 0) {
                shareUSD = Math.round((item.weight / totalWeight) * totalSharedOceanFreightUSD);
              } else {
                shareUSD = Math.round(totalSharedOceanFreightUSD / items.length);
              }

              return (
                <tr key={item.id} className="hover:bg-[#16263F]/40">
                  <td className="p-3 font-bold text-[#E88B2A]">{item.hbl}</td>
                  <td className="p-3 font-sans font-medium text-[#F4EFE6]">{item.shipper}</td>
                  <td className="p-3 font-sans text-zinc-300">{item.pkgs}</td>
                  <td className="p-3 text-right font-bold text-[#F4EFE6]">{item.cbm} CBM</td>
                  <td className="p-3 text-right text-zinc-300">{item.weight.toLocaleString()} KG</td>
                  <td className="p-3 text-right font-bold text-emerald-400">{formatUSD(shareUSD)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-950"
                      title="Remove from Container"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Cost Allocation Controls */}
        <div className="pt-3 border-t border-[#1C2D4A] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#16263F]/40 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#A8A299]">Allocation Formula:</span>
            <select
              value={allocationMethod}
              onChange={e => setAllocationMethod(e.target.value as any)}
              className="bg-[#0F1D33] border border-[#26395A] rounded px-2 py-1 text-[#F4EFE6]"
            >
              <option value="volume">Pro-rata by Volume (CBM)</option>
              <option value="weight">Pro-rata by Weight (KG)</option>
              <option value="equal">Equal Split per Consignment</option>
            </select>
          </div>

          <div className="font-mono text-xs">
            <span className="text-[#A8A299]">Total Shared Freight: </span>
            <strong className="text-emerald-400 text-sm ml-1">{formatUSD(totalSharedOceanFreightUSD)}</strong>
          </div>
        </div>
      </div>

      {/* Add Consignment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add LCL Consignment to Container"
        subtitle={`Stuffing into container ${containerNumber} (${equipmentType})`}
        maxWidth="lg"
      >
        <form onSubmit={handleAddConsignment} className="space-y-4 text-xs">
          {/* Quick pick from active HBLs if available */}
          {hbls && hbls.length > 0 && (
            <div>
              <label className="block text-[#A8A299] font-bold uppercase tracking-wider text-[10px] mb-1">
                Select Registered HBL (Optional)
              </label>
              <select
                onChange={e => {
                  const selected = hbls.find(h => h.hblNumber === e.target.value);
                  if (selected) {
                    setNewHblNumber(selected.hblNumber);
                    setNewShipper(selected.shipperName);
                    setNewPkgs(selected.packageCountAndType || selected.cargoDescription);
                    setNewCbm(selected.measurementCbm || 14.0);
                    setNewWeight(selected.grossWeightKg || 6000);
                    setNewDest(selected.portOfDischarge || 'Hamburg');
                  }
                }}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              >
                <option value="">-- Choose active HBL or type details below --</option>
                {hbls.map(h => (
                  <option key={h.id || h.hblNumber} value={h.hblNumber}>
                    {h.hblNumber} — {h.shipperName} ({h.measurementCbm} CBM / {h.grossWeightKg} KG)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">HBL Number</label>
              <input
                type="text"
                required
                value={newHblNumber}
                onChange={e => setNewHblNumber(e.target.value)}
                placeholder="e.g. MAPS-HBL-240325-01"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">Shipper Name</label>
              <input
                type="text"
                required
                value={newShipper}
                onChange={e => setNewShipper(e.target.value)}
                placeholder="e.g. Sun Ceramic Exports"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">Packages & Cargo Description</label>
            <input
              type="text"
              required
              value={newPkgs}
              onChange={e => setNewPkgs(e.target.value)}
              placeholder="e.g. 350 Wooden Crates of Glazed Tiles"
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">Volume (CBM)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={newCbm}
                onChange={e => setNewCbm(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">Weight (KG)</label>
              <input
                type="number"
                min="1"
                required
                value={newWeight}
                onChange={e => setNewWeight(parseInt(e.target.value) || 0)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] font-bold text-[10px] uppercase mb-1">Destination</label>
              <input
                type="text"
                required
                value={newDest}
                onChange={e => setNewDest(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2D4A]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold shadow-md shadow-[#E88B2A]/20"
            >
              Add to Container
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
