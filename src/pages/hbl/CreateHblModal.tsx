import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { HBL } from '../../types';
import { FileText, ArrowRight, ArrowLeft, Check, ShieldCheck, Printer, Boxes, Ship, Anchor, MapPin } from 'lucide-react';

interface CreateHblModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateHblModal: React.FC<CreateHblModalProps> = ({ isOpen, onClose }) => {
  const { addHBL, shipments, currentUser, setActivePrintDoc, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [creationMode, setCreationMode] = useState<'shipment' | 'custom'>('shipment');
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id || '');

  const shipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  // Editable HBL fields
  const [hblNumber, setHblNumber] = useState(`MAPS-HBL-24${Math.floor(1000 + Math.random() * 9000)}-01`);
  const [parentMblNumber, setParentMblNumber] = useState(shipment?.mblNo || 'MEDUMUN991024');
  const [placeOfIssue, setPlaceOfIssue] = useState('Gandhidham, Gujarat, India');
  
  // Parties
  const [shipperName, setShipperName] = useState(shipment?.shipperName || 'KRISHNA CERAMICS & TILES PVT LTD');
  const [shipperAddress, setShipperAddress] = useState(shipment?.shipperAddress || 'Plot 48, GIDC Phase II, Morbi, Gujarat 363641, India');
  const [consigneeText, setConsigneeText] = useState(
    shipment ? `TO ORDER OF DEUTSCHE BANK AG\n${shipment.consigneeAddress}` : 'TO ORDER OF DEUTSCHE BANK AG\nAltenwerder Hauptstrasse 12, D-21129 Hamburg, Germany'
  );
  const [notifyParty, setNotifyParty] = useState(
    shipment ? `${shipment.consigneeName}\n${shipment.consigneeAddress}` : 'MUELLER GMBH & CO KG\nAltenwerder Hauptstrasse 12, D-21129 Hamburg, Germany'
  );

  // Vessel & Routing
  const [vesselName, setVesselName] = useState(shipment?.vesselName || 'MSC JADE');
  const [voyageNumber, setVoyageNumber] = useState(shipment?.voyageNumber || '437W');
  const [polName, setPolName] = useState(shipment?.polName || 'Mundra Port (INMUN)');
  const [podName, setPodName] = useState(shipment?.podName || 'Hamburg, Germany (DEHAM)');
  const [placeOfDelivery, setPlaceOfDelivery] = useState(shipment?.placeOfDelivery || 'Hamburg Port CFS, Germany');

  // Cargo & Container
  const [containerNumber, setContainerNumber] = useState(shipment?.containers[0]?.containerNumber || 'MSKU2345678');
  const [sealNumber, setSealNumber] = useState(shipment?.containers[0]?.sealNumber || 'KL789412');
  const [equipmentType, setEquipmentType] = useState(shipment?.containers[0]?.equipmentType || "40'HC");
  const [packageCount, setPackageCount] = useState(shipment?.packagesCount?.toString() || '450');
  const [packageType, setPackageType] = useState(shipment?.packageType || 'WOODEN CRATES');
  const [cargoDescription, setCargoDescription] = useState(shipment?.cargoDescription || 'POLISHED PORCELAIN CERAMIC TILES');
  const [grossWeightKg, setGrossWeightKg] = useState(shipment?.grossWeight || 24800);
  const [volumeCbm, setVolumeCbm] = useState(shipment?.volumeCbm || 58.4);
  const [marksAndNumbers, setMarksAndNumbers] = useState(shipment?.marksAndNumbers || 'KC / HAM / 2026\nMUNDRA-EXP\nAS PER INVOICE');

  // Financials
  const [freightTerm, setFreightTerm] = useState<'Prepaid' | 'Collect'>('Prepaid');
  const [freightAmountUSD, setFreightAmountUSD] = useState(2850);

  // Sync when shipment selection changes
  const handleShipmentSelect = (sId: string) => {
    setSelectedShipmentId(sId);
    const selected = shipments.find(s => s.id === sId);
    if (selected) {
      setShipperName(selected.shipperName);
      setShipperAddress(selected.shipperAddress);
      setConsigneeText(`TO ORDER OF DEUTSCHE BANK AG\n${selected.consigneeAddress}`);
      setNotifyParty(`${selected.consigneeName}\n${selected.consigneeAddress}`);
      setVesselName(selected.vesselName);
      setVoyageNumber(selected.voyageNumber);
      setPolName(selected.polName);
      setPodName(selected.podName);
      setPlaceOfDelivery(selected.placeOfDelivery);
      setParentMblNumber(selected.mblNo || 'MEDUMUN991024');
      if (selected.containers && selected.containers[0]) {
        setContainerNumber(selected.containers[0].containerNumber);
        setSealNumber(selected.containers[0].sealNumber);
        setEquipmentType(selected.containers[0].equipmentType);
      }
      setPackageCount(selected.packagesCount?.toString() || '450');
      setPackageType(selected.packageType || 'WOODEN CRATES');
      setCargoDescription(selected.cargoDescription || 'GENERAL MERCHANDISE');
      setGrossWeightKg(selected.grossWeight || 24800);
      setVolumeCbm(selected.volumeCbm || 58.4);
      setMarksAndNumbers(selected.marksAndNumbers || 'AS PER INVOICE');
    }
  };

  const handleIssue = (shouldPrint = false) => {
    const newHbl: HBL = {
      id: hblNumber,
      hblNumber,
      shipmentId: creationMode === 'shipment' ? (shipment?.id || 'SHIP-DIRECT') : `DIRECT-${Date.now().toString().slice(-6)}`,
      mblNumber: parentMblNumber,
      shipperName: shipperName.toUpperCase(),
      shipperAddress,
      consigneeText: consigneeText || 'TO ORDER OF SHIPPER',
      notifyPartyText: notifyParty || 'SAME AS CONSIGNEE',
      preCarriageBy: 'Road Transport / Inland CFS',
      placeOfReceipt: 'Mundra Port / Gandhidham Terminal',
      oceanVessel: vesselName.toUpperCase(),
      voyageNo: voyageNumber.toUpperCase(),
      portOfLoading: polName,
      portOfDischarge: podName,
      placeOfDelivery: placeOfDelivery,
      marksAndNumbers: marksAndNumbers || 'MAPS / 2026\nAS PER INVOICE',
      containerAndSeals: `1 x ${equipmentType} Container\n${containerNumber} / Seal: ${sealNumber}`,
      packageCountAndType: `${packageCount} ${packageType.toUpperCase()}`,
      cargoDescription: cargoDescription.toUpperCase(),
      grossWeightKg: Number(grossWeightKg) || 24000,
      measurementCbm: Number(volumeCbm) || 50,
      freightPayableAt: freightTerm === 'Prepaid' ? 'Origin (Gandhidham, India)' : 'Destination Port',
      freightTerm,
      freightCharges: [
        {
          description: 'Ocean Freight',
          basis: `Per ${equipmentType}`,
          rate: freightAmountUSD.toFixed(2),
          currency: 'USD',
          amount: freightAmountUSD,
          prepaidOrCollect: freightTerm
        },
        {
          description: 'Terminal Handling Origin (THC)',
          basis: 'Per Container',
          rate: '185.00',
          currency: 'USD',
          amount: 185,
          prepaidOrCollect: 'Prepaid'
        },
        {
          description: 'Documentation & BL Issuance',
          basis: 'Per B/L',
          rate: '50.00',
          currency: 'USD',
          amount: 50,
          prepaidOrCollect: 'Prepaid'
        }
      ],
      totalFreightUSD: freightAmountUSD + 235,
      numberOfOriginals: 3,
      placeOfIssue,
      dateOfIssue: `${new Date().getDate()} Oct 2026`,
      status: 'Issued',
      shippersLoadCountSeal: true,
      saidToContain: true,
      carrierName: 'MAPS FREIGHT SOLUTIONS PVT LTD',
      signatoryName: `${currentUser.name} (Authorized Signatory)`
    };

    addHBL(newHbl);
    showToast('success', 'HBL Created & Issued', `House B/L ${hblNumber} recorded with 3 originals.`);
    onClose();

    if (shouldPrint) {
      setActivePrintDoc({ type: 'HBL', data: newHbl });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue House Bill of Lading (HBL)"
      subtitle="Industry-standard legal multimodal transport document with 3 original negotiable copies"
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Step indicator */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#1C2D4A]">
          <button
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
              step === 1 ? 'bg-[#E88B2A] text-[#0A1628]' : 'bg-[#16263F] text-emerald-400'
            }`}
          >
            1. Shipment & Routing
          </button>
          <button
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
              step === 2 ? 'bg-[#E88B2A] text-[#0A1628]' : 'bg-[#16263F] text-[#A8A299]'
            }`}
          >
            2. Cargo & Freight Terms
          </button>
          <button
            onClick={() => setStep(3)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
              step === 3 ? 'bg-[#E88B2A] text-[#0A1628]' : 'bg-[#16263F] text-[#A8A299]'
            }`}
          >
            3. Review & Issue (3 Originals)
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
           STEP 1: Shipment & Routing
           ══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-3.5">
            {/* Mode Selector */}
            <div className="flex items-center gap-3 p-2 bg-[#16263F] rounded-lg border border-[#26395A]">
              <label className="text-[#A8A299] font-semibold text-xs">Creation Mode:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('shipment')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    creationMode === 'shipment'
                      ? 'bg-[#E88B2A] text-[#0A1628]'
                      : 'bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6]'
                  }`}
                >
                  Link Active Booking
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('custom')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    creationMode === 'custom'
                      ? 'bg-[#E88B2A] text-[#0A1628]'
                      : 'bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6]'
                  }`}
                >
                  Custom Direct Entry
                </button>
              </div>
            </div>

            {creationMode === 'shipment' && (
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Select Parent Shipment Booking</label>
                <select
                  value={selectedShipmentId}
                  onChange={e => handleShipmentSelect(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6] font-medium"
                >
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.shipperName} → {s.podName} ({s.containers[0]?.containerNumber || 'Cntr'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shipper & Consignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Shipper / Exporter Name *</label>
                <input
                  type="text"
                  value={shipperName}
                  onChange={e => setShipperName(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-semibold uppercase"
                />
                <label className="block text-[#A8A299] font-semibold mt-2 mb-1">Shipper Address</label>
                <textarea
                  value={shipperAddress}
                  onChange={e => setShipperAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] text-xs"
                />
              </div>

              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Consignee (or TO ORDER OF BANK) *</label>
                <textarea
                  value={consigneeText}
                  onChange={e => setConsigneeText(e.target.value)}
                  rows={2}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-semibold"
                />
                <label className="block text-[#A8A299] font-semibold mt-2 mb-1">Notify Party</label>
                <textarea
                  value={notifyParty}
                  onChange={e => setNotifyParty(e.target.value)}
                  rows={2}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] text-xs"
                />
              </div>
            </div>

            {/* Vessel, Voyage, POL, POD */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#16263F] p-3 rounded-lg border border-[#26395A]">
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Ocean Vessel</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={e => setVesselName(e.target.value)}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Voyage Number</label>
                <input
                  type="text"
                  value={voyageNumber}
                  onChange={e => setVoyageNumber(e.target.value)}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Port of Loading</label>
                <input
                  type="text"
                  value={polName}
                  onChange={e => setPolName(e.target.value)}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Port of Discharge</label>
                <input
                  type="text"
                  value={podName}
                  onChange={e => setPodName(e.target.value)}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-sky-400 font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           STEP 2: Cargo & Freight Terms
           ══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-3.5">
            {/* HBL Number & Parent MBL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">HBL Number *</label>
                <input
                  type="text"
                  value={hblNumber}
                  onChange={e => setHblNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#E88B2A] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Parent Carrier MBL Number</label>
                <input
                  type="text"
                  value={parentMblNumber}
                  onChange={e => setParentMblNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Place of Issue</label>
                <input
                  type="text"
                  value={placeOfIssue}
                  onChange={e => setPlaceOfIssue(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>

            {/* Container & Seal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#16263F] p-3 rounded-lg border border-[#26395A]">
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Container Number *</label>
                <input
                  type="text"
                  value={containerNumber}
                  onChange={e => setContainerNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Customs Seal Number *</label>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={e => setSealNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Equipment Type</label>
                <select
                  value={equipmentType}
                  onChange={e => setEquipmentType(e.target.value as any)}
                  className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-semibold"
                >
                  <option value="20'GP">20' General Purpose</option>
                  <option value="40'GP">40' General Purpose</option>
                  <option value="40'HC">40' High Cube Dry</option>
                  <option value="40'RF">40' Reefer Temperature Controlled</option>
                  <option value="20'OT">20' Open Top</option>
                  <option value="40'FR">40' Flat Rack</option>
                </select>
              </div>
            </div>

            {/* Cargo Description, Packages, Weights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[#A8A299] font-semibold mb-1">Cargo Description *</label>
                <input
                  type="text"
                  value={cargoDescription}
                  onChange={e => setCargoDescription(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] uppercase"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Packages & Type</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={packageCount}
                    onChange={e => setPackageCount(e.target.value)}
                    className="w-20 bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                  <input
                    type="text"
                    value={packageType}
                    onChange={e => setPackageType(e.target.value)}
                    className="flex-1 bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Gross Weight (KG)</label>
                <input
                  type="number"
                  value={grossWeightKg}
                  onChange={e => setGrossWeightKg(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Volume (CBM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={volumeCbm}
                  onChange={e => setVolumeCbm(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Freight Payment Term</label>
                <select
                  value={freightTerm}
                  onChange={e => setFreightTerm(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-semibold"
                >
                  <option value="Prepaid">Freight Prepaid (Origin)</option>
                  <option value="Collect">Freight Collect (POD)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#A8A299] font-semibold mb-1">Base Ocean Freight ($)</label>
                <input
                  type="number"
                  value={freightAmountUSD}
                  onChange={e => setFreightAmountUSD(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           STEP 3: Review & Issue
           ══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="p-4 bg-[#16263F] rounded-xl border border-[#26395A] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                <div>
                  <span className="font-mono text-base font-bold text-[#E88B2A]">{hblNumber}</span>
                  <span className="text-[10px] text-[#A8A299] block">Parent MBL: {parentMblNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-4 h-4" /> Ready to Issue 3 Originals
                  </span>
                  <span className="text-[10px] text-[#A8A299]">MTO DG Shipping Approved Tenor</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Carrier</span>
                  <p className="font-bold text-[#F4EFE6]">MAPS FREIGHT SOLUTIONS PVT LTD</p>
                  <p className="text-[#A8A299] text-[11px]">Gandhidham / Mundra Port Hub</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Shipper</span>
                  <p className="font-bold text-[#F4EFE6]">{shipperName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Vessel & Voyage</span>
                  <p className="font-bold text-[#F4EFE6]">{vesselName} / {voyageNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Routing</span>
                  <p className="font-bold text-[#F4EFE6]">{polName} &rarr; <span className="text-sky-400">{podName}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Container & Seal</span>
                  <p className="font-mono font-bold text-[#E88B2A]">{containerNumber} / Seal: {sealNumber} ({equipmentType})</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A8A299] uppercase block">Freight Terms</span>
                  <p className="font-mono font-bold text-emerald-400">${freightAmountUSD} ({freightTerm})</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1C2D4A] flex items-center justify-between text-[11px] text-[#A8A299]">
                <span>Authorized Signatory: <strong className="text-[#F4EFE6]">{currentUser.name}</strong></span>
                <span>Tenor: 3 Originals / 3 Non-Negotiable Copies</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-[#1C2D4A] flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold transition-all shadow-md"
            >
              Continue <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleIssue(false)}
                className="px-4 py-2 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] font-semibold transition-colors"
              >
                Save as Issued
              </button>
              <button
                onClick={() => handleIssue(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                Issue & Open Printable PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
