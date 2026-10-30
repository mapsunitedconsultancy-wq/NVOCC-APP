import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Shipment, ContainerItem } from '../../types';
import { MOCK_PORTS, MOCK_EQUIPMENTS, MOCK_HS_CODES } from '../../data/mockData';
import { validateISO6346, validateHSCode, validateVGM } from '../../utils/validators';
import { Ship, Check, AlertCircle, Plus, Trash2, ArrowRight, ArrowLeft, Scan, ShieldAlert } from 'lucide-react';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({ isOpen, onClose }) => {
  const { addShipment, parties, currentUser, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [jobType, setJobType] = useState<'Export' | 'Import' | 'Cross-trade'>('Export');
  const [mode, setMode] = useState<'Ocean' | 'Air'>('Ocean');
  const [serviceType, setServiceType] = useState<'FCL' | 'LCL' | 'Breakbulk'>('FCL');
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF' | 'EXW' | 'DDP'>('CIF');
  const [referenceNo, setReferenceNo] = useState('PO-9289');
  const [bookingNo, setBookingNo] = useState('MAEU-BKG-249289');

  // Step 2: Parties
  const shippers = parties.filter(p => p.type === 'Shipper');
  const consignees = parties.filter(p => p.type === 'Consignee');
  const carriers = parties.filter(p => p.type === 'Carrier');

  const [selectedShipperId, setSelectedShipperId] = useState(shippers[0]?.id || '');
  const [selectedConsigneeId, setSelectedConsigneeId] = useState(consignees[0]?.id || '');
  const [selectedCarrierId, setSelectedCarrierId] = useState(carriers[0]?.id || '');

  // Step 3: Route
  const [placeOfReceipt, setPlaceOfReceipt] = useState('Morbi, Gujarat');
  const [polCode, setPolCode] = useState('INMUN');
  const [podCode, setPodCode] = useState('DEHAM');
  const [placeOfDelivery, setPlaceOfDelivery] = useState('Hamburg, Germany');

  // Step 4: Cargo & Containers
  const [cargoDesc, setCargoDesc] = useState('Vitrified Ceramic Floor Tiles');
  const [hsCode, setHsCode] = useState('69089090');
  const [packagesCount, setPackagesCount] = useState(1180);
  const [packageType, setPackageType] = useState('Bags on Pallets');
  const [grossWeight, setGrossWeight] = useState(25480);
  const [volumeCbm, setVolumeCbm] = useState(67.0);
  const [isHazardous, setIsHazardous] = useState(false);
  const [unNumber, setUnNumber] = useState('');

  // Container
  const [containerNumber, setContainerNumber] = useState('MSKU2345619');
  const [equipmentType, setEquipmentType] = useState<any>("40'HC");
  const [sealNumber, setSealNumber] = useState('KL789412');

  // Step 5: Vessel & Cutoffs
  const [vesselName, setVesselName] = useState('MSC JADE');
  const [voyageNumber, setVoyageNumber] = useState('437W');
  const [etd, setEtd] = useState('20 Oct 2026');
  const [eta, setEta] = useState('22 Nov 2026');
  const [cyCutoff, setCyCutoff] = useState('18 Oct 2026 18:00');

  // Step 6: Charges
  const [freightUSD, setFreightUSD] = useState(2850);
  const [thcINR, setThcINR] = useState(15500);

  // Step 7: Options
  const [createHblDraft, setCreateHblDraft] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Validation
  const containerCheck = validateISO6346(containerNumber);
  const hsCheck = validateHSCode(hsCode);
  const tareWeight = equipmentType.includes('40') ? 3880 : 2280;
  const vgmWeight = grossWeight;
  const vgmCheck = validateVGM(vgmWeight, tareWeight);

  const handleSave = () => {
    const nextSeq = Math.floor(1000 + Math.random() * 9000);
    const newId = `MAPS-24${nextSeq}`;

    const shipper = parties.find(p => p.id === selectedShipperId) || shippers[0];
    const consignee = parties.find(p => p.id === selectedConsigneeId) || consignees[0];
    const carrier = parties.find(p => p.id === selectedCarrierId) || carriers[0];
    const pol = MOCK_PORTS.find(p => p.code === polCode) || MOCK_PORTS[0];
    const pod = MOCK_PORTS.find(p => p.code === podCode) || MOCK_PORTS[6];

    const containerItem: ContainerItem = {
      id: 'cntr-' + Date.now(),
      containerNumber: containerNumber.trim().toUpperCase(),
      equipmentType,
      sealNumber: sealNumber || 'TBD',
      tareWeight: equipmentType.includes('40') ? 3880 : 2280,
      cargoWeight: grossWeight,
      grossWeight: grossWeight + (equipmentType.includes('40') ? 3880 : 2280),
      vgmWeight: grossWeight + (equipmentType.includes('40') ? 3880 : 2280),
      vgmMethod: 'SM1',
      vgmCertifier: 'Port Weighbridge',
      vgmDate: '15 Oct 2026',
      currentLocation: pol.name + ' CFS Yard',
      status: 'Booking Created',
      freeTimeDays: 14,
      freeTimeExpiry: '06 Dec 2026',
      demurragePerDay: 4800
    };

    const newShipment: Shipment = {
      id: newId,
      referenceNo: referenceNo || `PO-${nextSeq}`,
      bookingNo: bookingNo || `${carrier.code}-BKG-${nextSeq}`,
      mblNo: `${carrier.code}MUN${nextSeq}0`,
      hblNo: createHblDraft ? `MAPS-HBL-24${nextSeq}-01` : undefined,
      jobType,
      mode,
      serviceType,
      incoterm,
      status: 'booked',
      statusLabel: 'Booked (Awaiting CFS)',
      createdDate: '15 Oct 2026',
      assignedTo: currentUser.name,
      shipperId: shipper.id,
      shipperName: shipper.name,
      shipperAddress: shipper.address,
      shipperGstin: shipper.gstin || '24AABCK1234D1Z5',
      consigneeId: consignee.id,
      consigneeName: consignee.name,
      consigneeAddress: consignee.address,
      consigneeCountry: consignee.country,
      agentId: 'agent-1',
      agentName: 'Hamburg Shipping Services GmbH',
      placeOfReceipt,
      polCode: pol.code,
      polName: `${pol.name} Port, India`,
      podCode: pod.code,
      podName: `${pod.name} Port, ${pod.country}`,
      placeOfDelivery,
      carrierId: carrier.id,
      carrierName: carrier.name,
      carrierScac: carrier.code,
      vesselName,
      voyageNumber,
      etd,
      eta,
      transitDays: 30,
      cyCutoff,
      siCutoff: '17 Oct 2026 12:00',
      vgmCutoff: '18 Oct 2026 10:00',
      docCutoff: '17 Oct 2026 17:00',
      cargoDescription: cargoDesc,
      hsCode,
      packagesCount,
      packageType,
      grossWeight,
      netWeight: Math.round(grossWeight * 0.98),
      volumeCbm,
      marksAndNumbers: `MAPS / ${consignee.code} / ${newId}`,
      isHazardous,
      unNumber: isHazardous ? unNumber : undefined,
      isTempControlled: equipmentType.includes('RF'),
      containers: [containerItem],
      charges: [
        {
          id: 'chg-' + Date.now(),
          chargeCode: 'BAS',
          chargeName: 'Ocean Freight (Prepaid)',
          category: 'Ocean Freight',
          currency: 'USD',
          amount: freightUSD,
          rate: 84.2,
          amountInINR: Math.round(freightUSD * 84.2),
          billedTo: 'shipper',
          paymentTerm: 'Prepaid',
          status: 'pending'
        }
      ],
      totalRevenueINR: Math.round(freightUSD * 84.2) + thcINR,
      totalCostINR: Math.round(freightUSD * 84.2 * 0.85),
      marginINR: Math.round((freightUSD * 84.2) * 0.15) + thcINR,
      marginPercent: 18.5,
      events: [
        {
          id: 'ev-init',
          timestamp: '15 Oct 2026 11:30',
          title: 'Booking Confirmed with Carrier',
          location: 'Gandhidham Head Office',
          description: `Booking confirmed with ${carrier.name} on ${vesselName} ${voyageNumber}`,
          category: 'booking',
          source: 'MANUAL',
          user: currentUser.name
        }
      ],
      isPinned: true
    };

    addShipment(newShipment);
    onClose();
  };

  const handleNextStep = () => {
    if (step === 4) {
      if (!containerCheck.isValid) {
        setStepError(containerCheck.message || 'Wrong container check digit (must pass ISO 6346 validation).');
        showToast('error', 'Validation Blocked', containerCheck.message || 'Invalid container number check digit');
        return;
      }
      if (!hsCheck.isValid) {
        setStepError(hsCheck.message || 'HS code must be 8 digits');
        showToast('error', 'Validation Blocked', 'HS code must be 8 digits (ITC-HS format)');
        return;
      }
      if (!vgmCheck.isValid) {
        setStepError(vgmCheck.message || 'VGM weight must be greater than container tare weight');
        showToast('error', 'Validation Blocked', vgmCheck.message || 'VGM weight must exceed container tare weight');
        return;
      }
    }
    setStepError(null);
    setStep(step + 1);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create New Shipment Booking"
        subtitle="7-step wizard with ISO 6346 validation, ITC-HS code search, and instant HBL drafting"
        maxWidth="4xl"
      >
      {/* Inline Step Error Banner */}
      {stepError && (
        <div className="p-3 mb-4 bg-rose-950/80 border border-rose-500 rounded-lg text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{stepError}</span>
          </div>
          <button
            type="button"
            onClick={() => setStepError(null)}
            className="text-xs text-rose-300 hover:text-white underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Wizard Steps Stepper */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C2D4A] mb-5 overflow-x-auto text-xs">
        {[
          { s: 1, label: 'Basic' },
          { s: 2, label: 'Parties' },
          { s: 3, label: 'Route' },
          { s: 4, label: 'Cargo' },
          { s: 5, label: 'Vessel' },
          { s: 6, label: 'Charges' },
          { s: 7, label: 'Review' }
        ].map(st => (
          <div
            key={st.s}
            onClick={() => setStep(st.s)}
            className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-colors ${
              step === st.s
                ? 'bg-[#E88B2A]/20 text-[#E88B2A] font-bold border border-[#E88B2A]/30'
                : step > st.s
                ? 'text-emerald-400 font-medium'
                : 'text-[#6E6A64]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === st.s
                  ? 'bg-[#E88B2A] text-[#0A1628]'
                  : step > st.s
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-[#16263F] text-[#A8A299]'
              }`}
            >
              {step > st.s ? <Check className="w-3 h-3 stroke-[3]" /> : st.s}
            </span>
            <span>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="min-h-[320px] text-xs">
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 1 — Shipment Type & Service</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Job Type</label>
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  <option value="Export">Export</option>
                  <option value="Import">Import</option>
                  <option value="Cross-trade">Cross-trade</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Mode</label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  <option value="Ocean">Ocean Freight</option>
                  <option value="Air">Air Freight</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Service Type</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  <option value="FCL">FCL (Full Container)</option>
                  <option value="LCL">LCL (Consolidation)</option>
                  <option value="Breakbulk">Breakbulk</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Incoterm</label>
                <select
                  value={incoterm}
                  onChange={e => setIncoterm(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  <option value="CIF">CIF (Cost, Ins, Freight)</option>
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Customer PO / Ref Number</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  placeholder="e.g. PO-78921"
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Carrier Booking Ref (Optional)</label>
                <input
                  type="text"
                  value={bookingNo}
                  onChange={e => setBookingNo(e.target.value)}
                  placeholder="e.g. MSCBKG-9901"
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Parties */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 2 — Trade Parties</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Shipper (Indian Exporter)</label>
                <select
                  value={selectedShipperId}
                  onChange={e => setSelectedShipperId(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {shippers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#6E6A64] mt-1">Auto-populates GSTIN & Morbi/Bhuj address</p>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Consignee (Buyer)</label>
                <select
                  value={selectedConsigneeId}
                  onChange={e => setSelectedConsigneeId(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {consignees.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#6E6A64] mt-1">Overseas importer & delivery address</p>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Shipping Line (Carrier)</label>
                <select
                  value={selectedCarrierId}
                  onChange={e => setSelectedCarrierId(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {carriers.map(cr => (
                    <option key={cr.id} value={cr.id}>{cr.name} ({cr.code})</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#6E6A64] mt-1">Liner contract & SCAC identifier</p>
              </div>
            </div>

            {/* Shipper Credit Limit & Financial Risk Gate */}
            {(() => {
              const currentShipper = shippers.find(s => s.id === selectedShipperId) || shippers[0];
              if (!currentShipper) return null;
              const limit = currentShipper.creditLimitINR || 5000000;
              const outstanding = currentShipper.outstandingBalanceINR || 1285000;
              const available = limit - outstanding;
              const isOverLimit = available < 0;

              return (
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isOverLimit ? 'bg-rose-950/40 border-rose-800' : 'bg-[#16263F] border-[#26395A]'
                }`}>
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-[#F4EFE6] flex items-center gap-2">
                      <span>Shipper Credit Exposure Check:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        isOverLimit ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {isOverLimit ? 'Credit Limit Exceeded' : 'Credit Approved (Safe)'}
                      </span>
                    </span>
                    <p className="text-[11px] text-[#A8A299]">
                      Credit Limit: <strong className="text-[#F4EFE6] font-mono">₹{limit.toLocaleString('en-IN')}</strong> • Outstanding Due: <strong className="text-amber-400 font-mono">₹{outstanding.toLocaleString('en-IN')}</strong> • Available Buffer: <strong className="text-emerald-400 font-mono">₹{available.toLocaleString('en-IN')}</strong>
                    </p>
                  </div>
                  {isOverLimit && (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-900/60 text-rose-200 border border-rose-700 font-semibold">
                      Requires Approval Gate Override
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 3: Route */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 3 — Routing & Port Pair</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Place of Receipt</label>
                <input
                  type="text"
                  value={placeOfReceipt}
                  onChange={e => setPlaceOfReceipt(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Port of Loading (POL)</label>
                <select
                  value={polCode}
                  onChange={e => setPolCode(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {MOCK_PORTS.filter(p => p.country === 'India').map(p => (
                    <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Port of Discharge (POD)</label>
                <select
                  value={podCode}
                  onChange={e => setPodCode(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {MOCK_PORTS.filter(p => p.country !== 'India').map(p => (
                    <option key={p.code} value={p.code}>{p.name}, {p.country} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Place of Delivery</label>
                <input
                  type="text"
                  value={placeOfDelivery}
                  onChange={e => setPlaceOfDelivery(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Cargo & ISO 6346 Validation */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 4 — Cargo, Weights & ISO 6346 Container</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[#A8A299] mb-1 font-medium">Cargo Description</label>
                <input
                  type="text"
                  value={cargoDesc}
                  onChange={e => setCargoDesc(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">HS Code (ITC-HS Searchable)</label>
                <select
                  value={hsCode}
                  onChange={e => setHsCode(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                >
                  {MOCK_HS_CODES.map(h => (
                    <option key={h.code} value={h.code}>{h.code} - {h.desc.substring(0, 24)}...</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Container Details & ISO 6346 Live Checker */}
            <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E88B2A] block">
                Primary Container Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A8A299] mb-1 font-medium">Equipment Type</label>
                  <select
                    value={equipmentType}
                    onChange={e => setEquipmentType(e.target.value)}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] focus:border-[#E88B2A]"
                  >
                    {MOCK_EQUIPMENTS.map(eq => (
                      <option key={eq.code} value={eq.code}>{eq.code} ({eq.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#A8A299] font-medium">Container Number (ISO 6346)</label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="text-[10px] text-[#E88B2A] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Scan className="w-3 h-3" /> Scan EIR
                    </button>
                  </div>
                    <input
                    type="text"
                    value={containerNumber}
                    onChange={e => {
                      setContainerNumber(e.target.value.toUpperCase());
                      setStepError(null);
                    }}
                    placeholder="e.g. MSKU2345619"
                    className={`w-full bg-[#0F1D33] border rounded-lg p-2 text-[#F4EFE6] font-mono ${
                      containerCheck.isValid ? 'border-emerald-500/80 focus:border-emerald-400' : 'border-rose-500 focus:border-rose-400'
                    }`}
                  />
                  <div className="mt-1 flex flex-col gap-1 text-[10px]">
                    {containerCheck.isValid ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3" /> Valid ISO 6346 (Check digit: {containerCheck.checkDigit})
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold bg-rose-950/60 p-1.5 rounded border border-rose-800">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        {containerCheck.message}
                      </span>
                    )}

                    {/* Quick Test Data Toggle for Testing Pack */}
                    <div className="flex items-center gap-2 pt-1 font-sans">
                      <span className="text-[10px] text-[#A8A299]">Test Pack:</span>
                      <button
                        type="button"
                        onClick={() => { setContainerNumber('MSKU2345619'); setStepError(null); }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                      >
                        Valid (MSKU2345619)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setContainerNumber('MSKU2345610'); setStepError(null); }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900"
                      >
                        Invalid Checksum (MSKU2345610)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] mb-1 font-medium">Seal Number</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={e => setSealNumber(e.target.value)}
                    placeholder="e.g. KL789412"
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono focus:border-[#E88B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[#A8A299] mb-1 font-medium">Gross Weight (KG)</label>
                  <input
                    type="number"
                    value={grossWeight}
                    onChange={e => setGrossWeight(Number(e.target.value))}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A8A299] mb-1 font-medium">Volume (CBM)</label>
                  <input
                    type="number"
                    value={volumeCbm}
                    onChange={e => setVolumeCbm(Number(e.target.value))}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A8A299] mb-1 font-medium">Packages Count</label>
                  <input
                    type="number"
                    value={packagesCount}
                    onChange={e => setPackagesCount(Number(e.target.value))}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Carrier & Vessel */}
        {step === 5 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 5 — Vessel, Voyage & Cutoffs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Vessel Name</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={e => setVesselName(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Voyage Number</label>
                <input
                  type="text"
                  value={voyageNumber}
                  onChange={e => setVoyageNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">ETD at Mundra</label>
                <input
                  type="text"
                  value={etd}
                  onChange={e => setEtd(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">ETA at Discharge Port</label>
                <input
                  type="text"
                  value={eta}
                  onChange={e => setEta(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Charges */}
        {step === 6 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 6 — Freight & Local Quotation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Ocean Freight (USD)</label>
                <input
                  type="number"
                  value={freightUSD}
                  onChange={e => setFreightUSD(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-medium">Origin THC & Handling (INR)</label>
                <input
                  type="number"
                  value={thcINR}
                  onChange={e => setThcINR(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>
            <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] text-xs">
              <span className="text-[#A8A299]">Projected Shipment Gross Margin: </span>
              <strong className="text-emerald-400 font-mono text-sm ml-2">₹48,500 (18.5%)</strong>
            </div>
          </div>
        )}

        {/* STEP 7: Review & Confirm */}
        {step === 7 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F4EFE6]">Step 7 — Review Booking & Options</h4>
            <div className="p-4 bg-[#16263F] rounded-lg border border-[#26395A] space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-[#A8A299]">Route:</span> <strong className="text-[#F4EFE6]">{polCode} → {podCode}</strong></div>
                <div><span className="text-[#A8A299]">Vessel/Voy:</span> <strong className="text-[#F4EFE6]">{vesselName} / {voyageNumber}</strong></div>
                <div><span className="text-[#A8A299]">Container:</span> <strong className="text-[#F4EFE6] font-mono">{containerNumber} ({equipmentType})</strong></div>
                <div><span className="text-[#A8A299]">Cargo:</span> <strong className="text-[#F4EFE6]">{grossWeight.toLocaleString('en-IN')} KG</strong></div>
              </div>

              <div className="pt-3 border-t border-[#1C2D4A] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[#F4EFE6]">
                  <input
                    type="checkbox"
                    checked={createHblDraft}
                    onChange={e => setCreateHblDraft(e.target.checked)}
                    className="rounded bg-[#0F1D33] border-[#26395A] text-[#E88B2A] focus:ring-[#E88B2A]"
                  />
                  <span>Automatically generate linked House Bill of Lading (HBL) draft</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-[#1C2D4A] flex items-center justify-between mt-4">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] text-[#F4EFE6] hover:bg-[#1D3251] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 7 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#E88B2A] hover:bg-[#d67b1c] text-[#0A1628] transition-all"
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
          >
            Confirm & Save Booking
          </button>
        )}
      </div>
    </Modal>

    <BarcodeScannerModal
      isOpen={showBarcodeScanner}
      onClose={() => setShowBarcodeScanner(false)}
      onScan={scanned => setContainerNumber(scanned)}
    />
  </>
  );
};
