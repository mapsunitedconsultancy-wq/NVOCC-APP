import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { DeliveryOrderItem } from '../../types';
import { FileCheck, ArrowRight, ArrowLeft, Check, ShieldCheck, Printer, Boxes, Ship, MapPin, Building2, Calendar, AlertCircle } from 'lucide-react';

interface CreateDeliveryOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedShipmentId?: string;
}

const POPULAR_CFS_LIST = [
  { name: 'MUNDHRA CFS, MUNDRA', address: 'Old Port Road, Near APSEZ Gate 2, Mundra, Kutch, Gujarat - 370421' },
  { name: 'APSEZ CFS, MUNDRA', address: 'Adani Ports & SEZ Terminal Area, Mundra, Kutch, Gujarat - 370421' },
  { name: 'SAURASHTRA CFS, MUNDRA', address: 'Plot No. 12/B, Baroi Road, Mundra, Kutch, Gujarat - 370421' },
  { name: 'SEABIRD MARINE CFS, MUNDRA', address: 'National Highway 8A, Village Dhrub, Mundra, Kutch, Gujarat - 370421' },
  { name: 'CONTINENTAL CFS, KANDLA', address: 'Kandla Free Trade Zone (KASEZ) Gate, Gandhidham, Gujarat - 370230' },
  { name: 'ACTL CFS, GANDHIDHAM', address: 'Plot 45-48, Sector 9, Gandhidham, Kutch, Gujarat - 370201' }
];

const EMPTY_RETURN_DEPOTS = [
  {
    name: 'KDPP TERMINALS',
    address: 'Samagoga Survey no.120/1,- Near Borana yash water plant ,Pragpar-,Vill - Nana Kapaya Kutch - 370421',
    contact: '8488006739',
    email: 'docs.mundra@kdppcontainer.com'
  },
  {
    name: 'CONCOR CONTAINER DEPOT MUNDRA',
    address: 'CONCOR Multi-Modal Logistics Park, Village Baroi, Mundra, Kutch - 370421',
    contact: '02838-271900',
    email: 'mundra.yard@concorindia.com'
  },
  {
    name: 'GATEWAY DISTRIPARKS DEPOT',
    address: 'Survey No. 45/1, Mundra-Gandhidham Highway, Dhrub, Mundra - 370421',
    contact: '9825201944',
    email: 'operations.mun@gatewaydistriparks.com'
  },
  {
    name: 'ALLCARGO EMPTY YARD GANDHIDHAM',
    address: 'Plot 104, Transport Nagar, NH-8A, Gandhidham, Gujarat - 370201',
    contact: '02836-234910',
    email: 'emptyreturn.gim@allcargologistics.com'
  }
];

export const CreateDeliveryOrderModal: React.FC<CreateDeliveryOrderModalProps> = ({
  isOpen,
  onClose,
  preSelectedShipmentId
}) => {
  const { shipments, addDeliveryOrder, setActivePrintDoc, showToast, firmDetails } = useApp();

  const initialShipment = shipments.find(s => s.id === preSelectedShipmentId) || shipments[0];

  const [step, setStep] = useState(1);
  const [selectedShipmentId, setSelectedShipmentId] = useState(initialShipment?.id || '');

  // DO Header Particulars - Point 06 Golden Import Defaults
  const [doNumber, setDoNumber] = useState('LANDOMUN3632026');
  const [doDate, setDoDate] = useState('15-10-2026');
  const [blNumber, setBlNumber] = useState(initialShipment?.hblNo || initialShipment?.mblNo || 'LCSOHMUNSOH2600163');
  const [blDate, setBlDate] = useState('02-09-2026');
  const [vesselVoyage, setVesselVoyage] = useState(`${initialShipment?.vesselName || 'EUPHORIA'} / '${initialShipment?.voyageNumber || 'E603WMUN'}`);
  const [arrivalDate, setArrivalDate] = useState('12-10-2026');
  const [loadPort, setLoadPort] = useState(initialShipment?.polName?.split(' ')[0] || 'SOHAR');
  const [dischargePort, setDischargePort] = useState(initialShipment?.podName?.split(' ')[0] || 'MUNDRA');
  const [finalPlaceOfDelivery, setFinalPlaceOfDelivery] = useState('MUNDRA');
  const [destuffingType, setDestuffingType] = useState<'FACTORY DE-STUFF' | 'CFS DE-STUFF' | 'DOCK DE-STUFF'>('FACTORY DE-STUFF');

  // CFS / Terminal
  const [cfsName, setCfsName] = useState('MUNDHRA CFS, MUNDRA');
  const [cfsAddress, setCfsAddress] = useState('Near Port Gate No. 2, Old Port Road, Mundra Kutch - 370421');

  // Parties
  const [consigneeName, setConsigneeName] = useState(initialShipment?.consigneeName || 'ANANTA METAL RECYCLING PRIVATE LIMITED');
  const [consigneeAddress, setConsigneeAddress] = useState(
    initialShipment?.consigneeAddress || 'SURVEY NO. 112, 114 AND 115, PLOT NO. 5,\nPORT BIZ INDUSTRIAL PARK, MUNDRA GANDHIDHAM\nROAD, VILL. HATDI MUNDRA INDIA 370410'
  );
  const [notifyParty, setNotifyParty] = useState('SAME AS CONSIGNEE');
  const [deliverToParty, setDeliverToParty] = useState('UNIQUE SPEDITORER PVT LTD or bearer ANANTA METAL RECYCLING PRIVATE LIMITED');

  // Cargo & Weight
  const [cargoDescription, setCargoDescription] = useState(initialShipment?.cargoDescription || 'ALUMINIUM SCRAP');
  const [hsCode, setHsCode] = useState(initialShipment?.hsCode || '76020010');
  const [packageCount, setPackageCount] = useState('1 LOT');
  const [totalGrossWt, setTotalGrossWt] = useState('25.730 MT');

  // Containers
  const [containers, setContainers] = useState<Array<{
    containerNumber: string;
    sealNumber: string;
    sizeType: string;
    doValidTill: string;
    selectedForDO?: boolean;
  }>>([
    {
      containerNumber: 'MSCU6678413',
      sealNumber: 'MSK-789013',
      sizeType: '40HC',
      doValidTill: '25-10-2026',
      selectedForDO: true
    }
  ]);
  const [totalContainersSummary, setTotalContainersSummary] = useState("01X40'HC");

  // Empty Return Depot
  const [emptyReturnDepot, setEmptyReturnDepot] = useState('KDPP TERMINALS');
  const [emptyReturnAddress, setEmptyReturnAddress] = useState(
    'Samagoga Survey no.120/1,- Near Borana yash water plant ,Pragpar-,Vill - Nana Kapaya Kutch - 370421'
  );
  const [emptyReturnContact, setEmptyReturnContact] = useState('8488006739');
  const [emptyReturnEmail, setEmptyReturnEmail] = useState('docs.mundra@kdppcontainer.com');

  // Compliance Gates (Point 06)
  const [hblSurrenderStatus, setHblSurrenderStatus] = useState<'Pending' | 'Telex Released' | 'Original Surrendered'>('Pending');
  const [securityDepositINR, setSecurityDepositINR] = useState(25000);
  const [paymentCleared, setPaymentCleared] = useState(false);
  const [gateBlockReason, setGateBlockReason] = useState<string | null>(null);

  // Sync when shipment is selected
  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const s = shipments.find(item => item.id === shipmentId);
    if (!s) return;

    setBlNumber(s.hblNo || s.mblNo || `LC${s.polCode || 'MUN'}${s.podCode || 'HAM'}2600${Math.floor(100 + Math.random()*900)}`);
    setVesselVoyage(`${s.vesselName} / '${s.voyageNumber}`);
    setLoadPort(s.polName.split(' ')[0].toUpperCase());
    setDischargePort(s.podName.split(' ')[0].toUpperCase());
    setFinalPlaceOfDelivery(s.placeOfDelivery.split(' ')[0].toUpperCase() || 'MUNDRA');
    setConsigneeName(s.consigneeName.toUpperCase());
    setConsigneeAddress(s.consigneeAddress);
    setDeliverToParty(`UNIQUE SPEDITORER PVT LTD or bearer ${s.consigneeName.toUpperCase()}`);
    setCargoDescription(s.cargoDescription.toUpperCase());
    setHsCode(s.hsCode || '76020010');
    setTotalGrossWt(`${(s.grossWeight / 1000).toFixed(3)} MT`);

    if (s.containers && s.containers.length > 0) {
      setContainers(
        s.containers.map(c => ({
          containerNumber: c.containerNumber,
          sealNumber: c.sealNumber,
          sizeType: c.equipmentType || '20GP',
          doValidTill: '25-10-2026'
        }))
      );
      setTotalContainersSummary(
        s.containers.length === 1 
          ? `01X${s.containers[0].equipmentType.includes('40') ? '40\'HC' : '20\''}`
          : `${String(s.containers.length).padStart(2, '0')}XCONTAINERS`
      );
    }
  };

  const handleCfsChange = (name: string) => {
    setCfsName(name);
    const found = POPULAR_CFS_LIST.find(c => c.name === name);
    if (found) setCfsAddress(found.address);
  };

  const handleEmptyDepotChange = (name: string) => {
    setEmptyReturnDepot(name);
    const found = EMPTY_RETURN_DEPOTS.find(d => d.name === name);
    if (found) {
      setEmptyReturnAddress(found.address);
      setEmptyReturnContact(found.contact);
      setEmptyReturnEmail(found.email);
    }
  };

  const addContainerRow = () => {
    const nextCntr = `MSKU${Math.floor(2000000 + Math.random() * 8000000)}`;
    const nextSeal = String(Math.floor(1100000 + Math.random() * 900000));
    setContainers(prev => [
      ...prev,
      {
        containerNumber: nextCntr,
        sealNumber: nextSeal,
        sizeType: '20GP',
        doValidTill: '25-10-2026'
      }
    ]);
  };

  const updateContainerRow = (idx: number, field: string, val: string) => {
    setContainers(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeContainerRow = (idx: number) => {
    if (containers.length <= 1) return;
    setContainers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIssueDO = () => {
    // Point 06 DO Compliance Gate 1: HBL Surrender Check
    if (hblSurrenderStatus === 'Pending') {
      const err = `DO Gate Violation: House Bill of Lading ${blNumber} has NOT been surrendered or telex-released. DO release is legally blocked to protect cargo title.`;
      setGateBlockReason(err);
      showToast('error', 'DO Blocked (Gate 1)', 'HBL must be surrendered or telex-released.');
      return;
    }

    // Point 06 DO Compliance Gate 2: Freight & Local Charges Cleared
    if (!paymentCleared) {
      const err = 'DO Gate Violation: Ocean freight, THC, CFS charges, or mandatory container detention security deposit (₹25,000) have not been cleared by accounts.';
      setGateBlockReason(err);
      showToast('error', 'DO Blocked (Gate 2)', 'Local charges and deposit must be marked paid.');
      return;
    }

    const newDo: DeliveryOrderItem = {
      id: `do-${Date.now()}`,
      doNumber,
      doDate,
      shipmentId: selectedShipmentId || 'MAPS-IMP-260163',
      mblNumber: initialShipment?.mblNo || 'MSKUSOH2600091',
      blNumber,
      blDate,
      vesselVoyage,
      arrivalDate,
      loadPort,
      dischargePort,
      finalPlaceOfDelivery,
      destuffingType,
      cfsName,
      cfsAddress,
      consigneeName,
      consigneeAddress,
      notifyParty,
      deliverToParty,
      cargoDescription,
      hsCode,
      packageCount,
      totalGrossWt,
      containers,
      totalContainersSummary: totalContainersSummary || `${String(containers.length).padStart(2, '0')}X40'HC`,
      emptyReturnDepot,
      emptyReturnAddress,
      emptyReturnContact,
      emptyReturnEmail,
      status: 'Issued',
      validTillDate: containers[0]?.doValidTill || '25-10-2026',
      paymentCleared: true,
      securityDepositINR
    };

    addDeliveryOrder(newDo);
    showToast('success', `Delivery Order ${doNumber} Issued!`, 'All gates verified (Telex Released + Charges Paid).');
    onClose();
    // Open immediately in PrintModal so user can download PDF
    setActivePrintDoc({ type: 'DO', data: newDo });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Issue Delivery Order (DO)"
      subtitle="Full Indian NVOCC Combined Transport Format — Mundra / Kandla Gateway"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* DO Compliance Gates Banner (Point 06) */}
        <div className="p-3 bg-[#0F1D33] border border-[#26395A] rounded-xl space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#E88B2A] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Point 06 DO Release Compliance Gates
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setHblSurrenderStatus('Pending');
                  setPaymentCleared(false);
                  setGateBlockReason(null);
                  showToast('info', 'Test State Set', 'Gates reset to PENDING (attempt DO issue to verify block).');
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
              >
                Reset to Blocked
              </button>
              <button
                type="button"
                onClick={() => {
                  setHblSurrenderStatus('Telex Released');
                  setPaymentCleared(true);
                  setGateBlockReason(null);
                  showToast('success', 'Gates Cleared', 'HBL marked Telex-Released & charges marked Paid.');
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
              >
                Pass All Gates
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Gate 1: HBL Surrender */}
            <div className={`p-2 rounded-lg border flex items-center justify-between ${
              hblSurrenderStatus !== 'Pending' ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200' : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
            }`}>
              <div>
                <span className="font-bold text-[11px] block">Gate 1: HBL Surrender</span>
                <span className="text-[10px] opacity-80">{hblSurrenderStatus === 'Pending' ? 'Original HBL not surrendered' : `Verified (${hblSurrenderStatus})`}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHblSurrenderStatus(hblSurrenderStatus === 'Pending' ? 'Telex Released' : 'Pending');
                  setGateBlockReason(null);
                }}
                className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
                  hblSurrenderStatus !== 'Pending' ? 'bg-emerald-600 text-slate-950' : 'bg-rose-600 text-white'
                }`}
              >
                {hblSurrenderStatus !== 'Pending' ? '✓ Released' : 'Mark Released'}
              </button>
            </div>

            {/* Gate 2: Local Charges Clearance */}
            <div className={`p-2 rounded-lg border flex items-center justify-between ${
              paymentCleared ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200' : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
            }`}>
              <div>
                <span className="font-bold text-[11px] block">Gate 2: Finance Clearance</span>
                <span className="text-[10px] opacity-80">{paymentCleared ? 'Freight & ₹25k Deposit Cleared' : 'Invoices & Deposit unpaid'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentCleared(!paymentCleared);
                  setGateBlockReason(null);
                }}
                className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
                  paymentCleared ? 'bg-emerald-600 text-slate-950' : 'bg-rose-600 text-white'
                }`}
              >
                {paymentCleared ? '✓ Paid' : 'Mark Paid'}
              </button>
            </div>
          </div>

          {gateBlockReason && (
            <div className="p-2.5 bg-rose-900/80 border border-rose-500 rounded-lg text-rose-100 text-xs flex items-center justify-between shadow-md">
              <span className="font-medium">{gateBlockReason}</span>
              <button
                type="button"
                onClick={() => setGateBlockReason(null)}
                className="underline text-[10px] text-rose-200 ml-2 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-3">
          <div className="flex items-center gap-3">
            {[
              { num: 1, title: 'Routing & BL Details' },
              { num: 2, title: 'Consignee & CFS Party' },
              { num: 3, title: 'Containers & Empty Return' }
            ].map(s => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  step === s.num
                    ? 'bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/40'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === s.num ? 'bg-[#E88B2A] text-[#0A1628] font-bold' : 'bg-[#16263F] text-[#A8A299]'
                }`}>
                  {s.num}
                </span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-[#E88B2A] font-bold">
            DO #{doNumber}
          </span>
        </div>

        {/* STEP 1: Routing & BL Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#F4EFE6] block">
                  Select Associated Inbound Shipment / Consignment:
                </label>
                <p className="text-[11px] text-[#A8A299]">
                  Auto-fills Vessel, Voyage, Discharge Port, BL Details, Consignee & Containers.
                </p>
              </div>
              <select
                value={selectedShipmentId}
                onChange={e => handleSelectShipment(e.target.value)}
                className="bg-[#0F1D33] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6] font-semibold max-w-xs focus:outline-none focus:border-[#E88B2A]"
              >
                {shipments.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.consigneeName} ({s.podName.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">DO Number *</label>
                <input
                  type="text"
                  value={doNumber}
                  onChange={e => setDoNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="LANDOMUN3632026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">DO Date (DD-MM-YYYY) *</label>
                <input
                  type="text"
                  value={doDate}
                  onChange={e => setDoDate(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="15-10-2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Destuffing Type *</label>
                <select
                  value={destuffingType}
                  onChange={e => setDestuffingType(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-semibold focus:border-[#E88B2A] focus:outline-none"
                >
                  <option value="FACTORY DE-STUFF">FACTORY DE-STUFF (Direct to Consignee)</option>
                  <option value="CFS DE-STUFF">CFS DE-STUFF (Destuff at Port CFS)</option>
                  <option value="DOCK DE-STUFF">DOCK DE-STUFF (Terminal Area)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">B/L Number *</label>
                <input
                  type="text"
                  value={blNumber}
                  onChange={e => setBlNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="LCSOHMUNSOH2600163"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">B/L Date (DD-MM-YYYY) *</label>
                <input
                  type="text"
                  value={blDate}
                  onChange={e => setBlDate(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="02-09-2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Vessel / Voyage *</label>
                <input
                  type="text"
                  value={vesselVoyage}
                  onChange={e => setVesselVoyage(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="EUPHORIA / 'E603WMUN"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Arrival Date (ETA/ATA) *</label>
                <input
                  type="text"
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="12-10-2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Port of Loading (POL)</label>
                <input
                  type="text"
                  value={loadPort}
                  onChange={e => setLoadPort(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="SOHAR"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Discharge Port (POD)</label>
                <input
                  type="text"
                  value={dischargePort}
                  onChange={e => setDischargePort(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="MUNDRA"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Final Place of Delivery</label>
                <input
                  type="text"
                  value={finalPlaceOfDelivery}
                  onChange={e => setFinalPlaceOfDelivery(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="MUNDRA"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Consignee & CFS Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3 space-y-2">
              <label className="text-xs font-bold text-[#F4EFE6] block">
                Destination CFS / Terminal Address:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#A8A299] block mb-1">Select CFS Facility</label>
                  <select
                    value={cfsName}
                    onChange={e => handleCfsChange(e.target.value)}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  >
                    {POPULAR_CFS_LIST.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#A8A299] block mb-1">CFS Address / Details</label>
                  <input
                    type="text"
                    value={cfsAddress}
                    onChange={e => setCfsAddress(e.target.value)}
                    className="w-full bg-[#0F1D33] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Consignee Name *</label>
                <input
                  type="text"
                  value={consigneeName}
                  onChange={e => setConsigneeName(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-bold text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="ANANTA METAL RECYCLING PRIVATE LIMITED"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Notify Party</label>
                <input
                  type="text"
                  value={notifyParty}
                  onChange={e => setNotifyParty(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="SAME AS CONSIGNEE"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A299] mb-1">Consignee Full Address *</label>
              <textarea
                rows={2}
                value={consigneeAddress}
                onChange={e => setConsigneeAddress(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                placeholder="SURVEY NO. 112, 114 AND 115, PLOT NO. 5, PORT BIZ INDUSTRIAL PARK, MUNDRA GANDHIDHAM ROAD..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A299] mb-1">
                Deliver To Party (CHA / Transporter / Bearer) *
              </label>
              <input
                type="text"
                value={deliverToParty}
                onChange={e => setDeliverToParty(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-semibold text-[#E88B2A] focus:border-[#E88B2A] focus:outline-none"
                placeholder="UNIQUE SPEDITORER PVT LTD or bearer ANANTA METAL RECYCLING PRIVATE LIMITED"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Cargo Description</label>
                <input
                  type="text"
                  value={cargoDescription}
                  onChange={e => setCargoDescription(e.target.value.toUpperCase())}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="ALUMINIUM SCRAP"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">HS Code</label>
                <input
                  type="text"
                  value={hsCode}
                  onChange={e => setHsCode(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="76020010"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Total Gross Weight</label>
                <input
                  type="text"
                  value={totalGrossWt}
                  onChange={e => setTotalGrossWt(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="25.730 MT"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Containers & Empty Return Location */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#F4EFE6] flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#E88B2A]" />
                  Authorized Containers Under Delivery Order:
                </label>
                <button
                  type="button"
                  onClick={addContainerRow}
                  className="px-2.5 py-1 rounded bg-[#E88B2A]/20 hover:bg-[#E88B2A]/30 text-[#E88B2A] text-xs font-semibold transition-colors"
                >
                  + Add Container
                </button>
              </div>

              <div className="border border-[#26395A] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A]">
                    <tr>
                      <th className="p-2">Container Number</th>
                      <th className="p-2">Seal Number</th>
                      <th className="p-2">Size / Type</th>
                      <th className="p-2">DO Valid Till</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2D4A] font-mono">
                    {containers.map((c, idx) => (
                      <tr key={idx} className="bg-[#0F1D33]">
                        <td className="p-2">
                          <input
                            type="text"
                            value={c.containerNumber}
                            onChange={e => updateContainerRow(idx, 'containerNumber', e.target.value.toUpperCase())}
                            className="bg-[#16263F] border border-[#26395A] rounded px-2 py-1 text-xs font-bold text-[#F4EFE6] w-full"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={c.sealNumber}
                            onChange={e => updateContainerRow(idx, 'sealNumber', e.target.value)}
                            className="bg-[#16263F] border border-[#26395A] rounded px-2 py-1 text-xs text-[#F4EFE6] w-full"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={c.sizeType}
                            onChange={e => updateContainerRow(idx, 'sizeType', e.target.value)}
                            className="bg-[#16263F] border border-[#26395A] rounded px-2 py-1 text-xs text-[#F4EFE6] w-full"
                          >
                            <option value="20GP">20GP (20' Standard Dry)</option>
                            <option value="40GP">40GP (40' Standard Dry)</option>
                            <option value="40HC">40HC (40' High Cube)</option>
                            <option value="20RF">20RF (20' Reefer)</option>
                            <option value="40RF">40RF (40' Reefer)</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={c.doValidTill}
                            onChange={e => updateContainerRow(idx, 'doValidTill', e.target.value)}
                            className="bg-[#16263F] border border-[#26395A] rounded px-2 py-1 text-xs text-amber-400 font-bold w-full"
                          />
                        </td>
                        <td className="p-2 text-center font-sans">
                          {containers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContainerRow(idx)}
                              className="text-rose-400 hover:text-rose-300 text-xs px-1"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">
                  Container Count Summary (e.g. 01X20', 02X40'HC)
                </label>
                <input
                  type="text"
                  value={totalContainersSummary}
                  onChange={e => setTotalContainersSummary(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                  placeholder="01X20'"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">
                  Empty Return Depot Selection
                </label>
                <select
                  value={emptyReturnDepot}
                  onChange={e => handleEmptyDepotChange(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs text-[#F4EFE6] font-semibold focus:border-[#E88B2A] focus:outline-none"
                >
                  {EMPTY_RETURN_DEPOTS.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3 space-y-2 text-xs">
              <label className="font-bold text-[#F4EFE6] block">Empty Container Return Address & Contact:</label>
              <p className="text-[11px] text-[#A8A299] leading-relaxed">{emptyReturnAddress}</p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-[#E88B2A]">
                <span>CONT: {emptyReturnContact}</span>
                <span>MAIL ID: {emptyReturnEmail}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1C2D4A]">
              <div>
                <label className="block text-xs font-semibold text-[#A8A299] mb-1">Security Deposit / Detention Bond (₹)</label>
                <input
                  type="number"
                  value={securityDepositINR}
                  onChange={e => setSecurityDepositINR(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-2 text-xs font-mono text-[#F4EFE6] focus:border-[#E88B2A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#16263F] border border-[#26395A] rounded-lg self-end">
                <div>
                  <span className="block text-xs font-semibold text-[#F4EFE6]">THC & Local Charges Cleared</span>
                  <span className="text-[10px] text-[#A8A299]">Ready for instant customs gate-out</span>
                </div>
                <input
                  type="checkbox"
                  checked={paymentCleared}
                  onChange={e => setPaymentCleared(e.target.checked)}
                  className="w-4 h-4 accent-[#E88B2A] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1C2D4A]">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-xs font-medium text-[#F4EFE6] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#26395A] text-xs font-medium text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] transition-colors"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] text-xs font-bold transition-colors shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleIssueDO}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] text-xs font-bold transition-colors shadow-md shadow-[#E88B2A]/20"
              >
                <FileCheck className="w-4 h-4" />
                <span>Issue & Generate DO (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
