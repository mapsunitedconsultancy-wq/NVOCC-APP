import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DangerousGoodsItem, UnReferenceItem } from '../types/v4Types';
import { UN_DATABASE_LOOKUP } from '../data/v4DemoData';
import {
  Flame,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  X,
  ChevronRight
} from 'lucide-react';

export const DangerousGoodsPage: React.FC = () => {
  const { dgShipments, addDgShipment, updateDgShipment, showToast, setActivePrintDoc } = useApp();

  const [activeTab, setActiveTab] = useState<'shipments' | 'un_lookup' | 'segregation' | 'dgd_builder'>('shipments');
  const [searchQuery, setSearchQuery] = useState('');
  const [unSearch, setUnSearch] = useState('');
  const [selectedDg, setSelectedDg] = useState<DangerousGoodsItem | null>(null);

  // Segregation checker inputs
  const [itemA, setItemA] = useState('UN1789'); // Hydrochloric Acid (Class 8 Acid)
  const [itemB, setItemB] = useState('UN1824'); // Sodium Hydroxide (Class 8 Alkali)
  const [segregationResult, setSegregationResult] = useState<string | null>(null);

  // DGD Builder form
  const [unNumber, setUnNumber] = useState('UN1230');
  const [properShippingName, setProperShippingName] = useState('METHANOL');
  const [imdgClass, setImdgClass] = useState('3 (6.1)');
  const [packingGroup, setPackingGroup] = useState<'I' | 'II' | 'III'>('II');
  const [flashPoint, setFlashPoint] = useState('11°C c.c.');
  const [hblNumber, setHblNumber] = useState('MAPS-HBL-240398-01');
  const [netQuantityKg, setNetQuantityKg] = useState(18000);
  const [emergencyContact, setEmergencyContact] = useState('Chemtrec / Dr. K. Mehta (+91 98250 99911)');

  const filteredDgShipments = dgShipments.filter(d =>
    d.unNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.properShippingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.hblNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnDatabase = UN_DATABASE_LOOKUP.filter(u =>
    u.unNumber.toLowerCase().includes(unSearch.toLowerCase()) ||
    u.properShippingName.toLowerCase().includes(unSearch.toLowerCase()) ||
    u.imdgClass.includes(unSearch)
  );

  const handleSelectUnItem = (item: UnReferenceItem) => {
    setUnNumber(item.unNumber);
    setProperShippingName(item.properShippingName);
    setImdgClass(item.imdgClass);
    setPackingGroup(item.packingGroup);
    setActiveTab('dgd_builder');
    showToast('info', 'UN Substance Selected', `Pre-filled ${item.unNumber} (${item.properShippingName}) into DGD form.`);
  };

  const handleRunSegregation = () => {
    // Check known incompatibilities per IMDG Code 7.2.4 Segregation Table
    if (
      (itemA === 'UN1263' && itemB === 'UN1830') ||
      (itemA === 'UN1830' && itemB === 'UN1263')
    ) {
      setSegregationResult('INCOMPATIBLE CONFLICT (IMDG 7.2.4 Table 1): Class 3 Flammable Liquid (UN1263 PAINT) and Class 8 Corrosive Strong Acid (UN1830 SULPHURIC ACID) MUST NOT be co-loaded in the same Cargo Transport Unit (CTU / Container). Segregation code 2: "Separated from" required. Risk of severe exothermic reaction, toxic fumes, and fire.');
    } else if (
      (itemA === 'UN1789' && itemB === 'UN1824') ||
      (itemA === 'UN1824' && itemB === 'UN1789')
    ) {
      setSegregationResult('INCOMPATIBLE: Class 8 Strong Acid (UN1789) and Class 8 Strong Alkali (UN1824) must NOT be packed in the same container. Segregation code: "Separated from" (2 compartment separation or separate CTUs required).');
    } else if (itemA === 'UN1230' && (itemB === 'UN1789' || itemB === 'UN1830')) {
      setSegregationResult('CAUTION / INCOMPATIBLE: Class 3 Flammable Liquid (UN1230 METHANOL) and Class 8 Strong Acid require strict segregation. Dangerous goods reaction hazard in enclosed space.');
    } else {
      setSegregationResult('COMPATIBLE: Both items may be co-loaded in the same container under general IMDG Code segregation provisions.');
    }
  };

  const handleCreateDgd = (e: React.FormEvent) => {
    e.preventDefault();
    const newDg: DangerousGoodsItem = {
      id: 'dg-' + Date.now(),
      shipmentId: 'MAPS-EXP-' + Math.floor(1000 + Math.random() * 9000),
      hblNumber,
      unNumber,
      properShippingName,
      imdgClass,
      packingGroup,
      flashPoint,
      marinePollutant: false,
      segregationGroup: 'None',
      emsNumber: 'F-E, S-D',
      status: 'DGD Submitted',
      netQuantityKg: Number(netQuantityKg),
      grossWeightKg: Number(netQuantityKg) + 1500,
      packageType: '80 STEEL DRUMS 220L',
      emergencyContact,
      consigneeNotice: 'Hazardous cargo declaration issued compliant with IMDG Code Amendment 41-22.'
    };
    addDgShipment(newDg);
    setActiveTab('shipments');
    showToast('success', 'Dangerous Goods Declaration Lodged', `DGD for ${unNumber} submitted to carrier.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Dangerous Goods (IMDG) Management
              </h1>
              <p className="text-xs text-[#A8A299]">
                IMO / IMDG Code Compliance &bull; Shipper's Declaration (DGD) Generator &bull; LCL Segregation Matrix &bull; Carrier Approval Tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'shipments' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              DG Shipments
            </button>
            <button
              onClick={() => setActiveTab('un_lookup')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'un_lookup' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              UN Database
            </button>
            <button
              onClick={() => setActiveTab('segregation')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'segregation' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Segregation Matrix
            </button>
            <button
              onClick={() => setActiveTab('dgd_builder')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'dgd_builder' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              + Create DGD
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Active DG Consignments</span>
            <span className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-rose-400 font-mono">{dgShipments.length}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Hazardous bookings</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Carrier Approved</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {dgShipments.filter(d => d.status === 'Carrier Approved').length}
          </span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">Ready for vessel loading</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Pending Carrier Approval</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {dgShipments.filter(d => d.status === 'DGD Submitted').length}
          </span>
          <span className="text-[11px] text-amber-300/80 block mt-1">Awaiting line approval reference</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">UN Database</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-sky-400 font-mono">{UN_DATABASE_LOOKUP.length} UN Numbers</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">IMDG Code Amendment 41-22</span>
        </div>
      </div>

      {/* Screen 1: DG Shipments List */}
      {activeTab === 'shipments' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm space-y-4">
          <div className="p-3 border-b border-[#1C2D4A] flex justify-between items-center">
            <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Dangerous Goods Manifest Tracking
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search UN number, HBL..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                <tr>
                  <th className="p-3.5">UN Number</th>
                  <th className="p-3.5">Proper Shipping Name</th>
                  <th className="p-3.5">Class / PG</th>
                  <th className="p-3.5">Flash Point</th>
                  <th className="p-3.5">House B/L No</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Carrier Approval Ref</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                {filteredDgShipments.map(item => (
                  <tr key={item.id} className="hover:bg-[#16263F]/50 transition-colors">
                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        {item.unNumber}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-[#F4EFE6]">
                      {item.properShippingName}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="font-bold">{item.imdgClass}</span> / PG {item.packingGroup}
                    </td>

                    <td className="p-3.5 font-mono text-zinc-300">
                      {item.flashPoint || 'N/A (Solid)'}
                    </td>

                    <td className="p-3.5 font-mono text-[#E88B2A] font-bold">
                      {item.hblNumber}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'Carrier Approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      {item.carrierApprovalRef ? (
                        <span className="text-emerald-400 font-bold">{item.carrierApprovalRef}</span>
                      ) : (
                        <span className="text-[#6E6A64]">Pending line auth</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (!item.carrierApprovalRef) {
                            showToast(
                              'error',
                              'Loading Gate Blocked!',
                              `Carrier approval reference missing for ${item.unNumber}. Cargo cannot be loaded onto vessel until approval reference is recorded.`
                            );
                          } else {
                            showToast(
                              'success',
                              'Carrier Approval Verified',
                              `Ref: ${item.carrierApprovalRef}. Container authorized for vessel loading.`
                            );
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors shadow-sm ${
                          item.carrierApprovalRef
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                        }`}
                        title="Test Carrier Approval Gate before vessel loading"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{item.carrierApprovalRef ? 'Gate Passed' : 'Test Gate'}</span>
                      </button>

                      {!item.carrierApprovalRef && (
                        <button
                          onClick={() => {
                            updateDgShipment(item.id, {
                              carrierApprovalRef: 'MAEU-DG-MUN-2026-99124',
                              status: 'Carrier Approved'
                            });
                            showToast(
                              'success',
                              'Carrier Approval Recorded',
                              'Approval Ref MAEU-DG-MUN-2026-99124 attached. Loading gate now UNLOCKED.'
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-sky-400 border border-[#26395A]"
                          title="Authorize carrier approval"
                        >
                          + Authorize
                        </button>
                      )}

                      <button
                        onClick={() => setActivePrintDoc({ type: 'DGD', data: item })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-colors shadow-sm"
                        title="Generate and print official IMO Dangerous Goods Declaration"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Print DGD</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screen 2: UN Database Lookup */}
      {activeTab === 'un_lookup' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Searchable IMDG Code UN Substance Catalog
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search UN number (e.g. UN1230), chemical..."
                value={unSearch}
                onChange={e => setUnSearch(e.target.value)}
                className="w-full sm:w-72 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64]"
              />
            </div>
          </div>

          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">UN Number</th>
                    <th className="p-3.5">Proper Shipping Name</th>
                    <th className="p-3.5">IMDG Class</th>
                    <th className="p-3.5">Packing Group</th>
                    <th className="p-3.5">Segregation Group</th>
                    <th className="p-3.5">EmS Number</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredUnDatabase.map(item => (
                    <tr key={item.unNumber} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-rose-400">
                        {item.unNumber}
                      </td>
                      <td className="p-3.5 font-semibold text-[#F4EFE6]">
                        {item.properShippingName}
                      </td>
                      <td className="p-3.5 font-mono">
                        {item.imdgClass} {item.subsidiaryRisk ? `(${item.subsidiaryRisk})` : ''}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        PG {item.packingGroup}
                      </td>
                      <td className="p-3.5 text-[#A8A299]">
                        {item.segregationGroup}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-sky-400">
                        {item.ems}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSelectUnItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
                        >
                          Use in DGD &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: LCL Segregation Matrix Checker */}
      {activeTab === 'segregation' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-6 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-[#1C2D4A] pb-3">
            <h2 className="text-base font-bold text-[#F4EFE6] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>IMDG LCL Consolidation Cargo Segregation Checker</span>
            </h2>
            <p className="text-xs text-[#A8A299]">
              Validate chemical compatibility before stuffing multiple hazardous LCL bookings into a shared container.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#A8A299] block mb-1">Cargo Item A (UN Number):</label>
                <select
                  value={itemA}
                  onChange={e => setItemA(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                >
                  <option value="UN1263">UN1263 - Paint (Class 3 Flammable)</option>
                  <option value="UN1830">UN1830 - Sulphuric Acid (Class 8 Strong Acid)</option>
                  <option value="UN1789">UN1789 - Hydrochloric Acid (Class 8 Acid)</option>
                  <option value="UN1824">UN1824 - Sodium Hydroxide (Class 8 Alkali)</option>
                  <option value="UN1230">UN1230 - Methanol (Class 3 Flammable)</option>
                  <option value="UN3077">UN3077 - Env Hazardous Substance (Class 9)</option>
                </select>
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Cargo Item B (UN Number):</label>
                <select
                  value={itemB}
                  onChange={e => setItemB(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                >
                  <option value="UN1830">UN1830 - Sulphuric Acid (Class 8 Strong Acid)</option>
                  <option value="UN1263">UN1263 - Paint (Class 3 Flammable)</option>
                  <option value="UN1824">UN1824 - Sodium Hydroxide (Class 8 Alkali)</option>
                  <option value="UN1789">UN1789 - Hydrochloric Acid (Class 8 Acid)</option>
                  <option value="UN1230">UN1230 - Methanol (Class 3 Flammable)</option>
                  <option value="UN3077">UN3077 - Env Hazardous Substance (Class 9)</option>
                </select>
              </div>
          </div>

          <button
            onClick={handleRunSegregation}
            className="w-full py-2.5 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
          >
            Run IMDG Table 7.2.4 Segregation Check
          </button>

          {segregationResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              segregationResult.includes('INCOMPATIBLE')
                ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                : segregationResult.includes('CAUTION')
                ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {segregationResult.includes('INCOMPATIBLE') ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>Assessment Outcome</span>
              </div>
              <p>{segregationResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 4: DGD Generator */}
      {activeTab === 'dgd_builder' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-6 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-[#1C2D4A] pb-3">
            <h2 className="text-base font-bold text-[#F4EFE6] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E88B2A]" />
              <span>Shipper's Declaration for Dangerous Goods (DGD Generator)</span>
            </h2>
            <p className="text-xs text-[#A8A299]">
              Format compliant with IMO Multimodal Dangerous Goods Declaration Form &bull; SOLAS Chapter VII
            </p>
          </div>

          <form onSubmit={handleCreateDgd} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">UN Number:</label>
                <input
                  type="text"
                  required
                  value={unNumber}
                  onChange={e => setUnNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono text-rose-400 font-bold"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Associated House B/L:</label>
                <input
                  type="text"
                  required
                  value={hblNumber}
                  onChange={e => setHblNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[#A8A299] block mb-1">Proper Shipping Name (PSN):</label>
              <input
                type="text"
                required
                value={properShippingName}
                onChange={e => setProperShippingName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">IMDG Class:</label>
                <input
                  type="text"
                  required
                  value={imdgClass}
                  onChange={e => setImdgClass(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Packing Group:</label>
                <select
                  value={packingGroup}
                  onChange={e => setPackingGroup(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="I">PG I (Great Danger)</option>
                  <option value="II">PG II (Medium Danger)</option>
                  <option value="III">PG III (Minor Danger)</option>
                </select>
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Flash Point:</label>
                <input
                  type="text"
                  value={flashPoint}
                  onChange={e => setFlashPoint(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">Net Explosive / Cargo Qty (KG):</label>
                <input
                  type="number"
                  required
                  value={netQuantityKg}
                  onChange={e => setNetQuantityKg(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">24-Hour Emergency Response Phone:</label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2D4A]">
              <button
                type="button"
                onClick={() => setActiveTab('shipments')}
                className="px-4 py-2 rounded-xl bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                Generate DGD &amp; Submit to Carrier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
