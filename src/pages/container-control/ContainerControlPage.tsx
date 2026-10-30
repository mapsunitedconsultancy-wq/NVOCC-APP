import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ManagedContainer,
  LifecycleStage,
  RiskLevel,
  CFSTariff,
  CFS_TARIFF_MASTER,
  calculateCFSCharges,
  CARRIER_FREE_TIME_RULES,
  calculateDemurrageAndDetention,
  WHATSAPP_ALERT_TEMPLATES,
  fillWhatsAppTemplate,
  MOCK_ALERT_HISTORY,
  CONTAINER_CONTROL_PRICING_PLANS,
  USD_TO_INR_RATE
} from '../../data/container-control';
import {
  Boxes,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  MapPin,
  CheckCircle2,
  RefreshCw,
  FileText,
  DollarSign,
  Download,
  MessageSquare,
  QrCode,
  Calendar,
  Layers,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Check,
  FileSpreadsheet,
  Send,
  Eye,
  Sliders,
  PhoneCall,
  Coins,
  TrendingUp,
  Percent,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { formatINR, validateISO6346 } from '../../utils/formatters';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import { WhatsAppPreviewModal } from '../../components/common/WhatsAppPreviewModal';
import { AddContainerModal } from '../../components/container-control/AddContainerModal';
import { BulkImportContainersModal } from '../../components/container-control/BulkImportContainersModal';
import { ContainerInvoiceModal } from '../../components/container-control/ContainerInvoiceModal';
import { PublicContainerTrackingView } from '../../components/container-control/PublicContainerTrackingView';

export const ContainerControlPage: React.FC = () => {
  const {
    managedContainers,
    updateContainerStage,
    sendContainerWhatsAppAlert,
    saveCfsChargeToShipment,
    containerControlInvoices,
    markContainerInvoicePaid,
    customerLedgers,
    shipments,
    setActiveView,
    setViewParam,
    showToast,
    currentUser,
    setActivePrintDoc
  } = useApp();

  // Active top-level sub-module tab
  const [activeTab, setActiveTab] = useState<'fleet' | 'dnd' | 'cfs' | 'alerts' | 'billing' | 'ledger'>('fleet');

  // Sub-Module 1 view mode (Table, Kanban, Risk Grid, CFS View)
  const [fleetViewMode, setFleetViewMode] = useState<'table' | 'kanban' | 'risk_grid' | 'cfs_view'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'Import' | 'Export'>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'Safe' | 'Watch' | 'Critical' | 'Overdue'>('ALL');
  const [cfsFilter, setCfsFilter] = useState<string>('ALL');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');

  // Multi-selection for bulk actions
  const [selectedContainerIds, setSelectedContainerIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedContainerForLifecycle, setSelectedContainerForLifecycle] = useState<ManagedContainer | null>(null);
  const [selectedContainerForPublic, setSelectedContainerForPublic] = useState<string | null>(null);
  const [selectedContainerForWa, setSelectedContainerForWa] = useState<ManagedContainer | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any | null>(null);

  // Sub-Module 4: CFS Calculator State (5 steps)
  const [cfsStep, setCfsStep] = useState<number>(1);
  const [selectedCfsId, setSelectedCfsId] = useState<string>('cfs-allcargo-mun');
  const [selectedEquipType, setSelectedEquipType] = useState<string>("40'HC");
  const [selectedCargoType, setSelectedCargoType] = useState<'General Cargo' | 'Hazardous / DG' | 'Reefer' | 'ODC / OOG'>('General Cargo');
  const [cfsDays, setCfsDays] = useState<number>(7);
  const [forkliftMoves, setForkliftMoves] = useState<number>(2);
  const [hasWeighment, setHasWeighment] = useState<boolean>(true);
  const [hasFumigation, setHasFumigation] = useState<boolean>(false);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [isBaselineTest, setIsBaselineTest] = useState<boolean>(false);

  // Sub-Module 5: WhatsApp Simulator State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-72h-warning');
  const [customPhone, setCustomPhone] = useState<string>('+91 98250 11492');
  const [simulatedContainerNo, setSimulatedContainerNo] = useState<string>(managedContainers[0]?.containerNumber || 'MSKU2345678');

  // Sub-Module 3: Fleet D&D Calculator State
  const [dndCarrier, setDndCarrier] = useState<string>('Maersk Line');
  const [dndEquip, setDndEquip] = useState<string>("40'HC");
  const [dndTotalDays, setDndTotalDays] = useState<number>(12);
  const [dndCustomFreeDays, setDndCustomFreeDays] = useState<number>(7);

  // ══════════════════════════════════════════════════════════════════════════
  // METRICS COMPUTATION
  // ══════════════════════════════════════════════════════════════════════════
  const totalFleetCount = managedContainers.length;
  const importCount = managedContainers.filter(c => c.direction === 'Import').length;
  const exportCount = managedContainers.filter(c => c.direction === 'Export').length;
  
  const safeCount = managedContainers.filter(c => c.riskLevel === 'Safe').length;
  const watchCount = managedContainers.filter(c => c.riskLevel === 'Watch').length;
  const criticalCount = managedContainers.filter(c => c.riskLevel === 'Critical').length;
  const overdueCount = managedContainers.filter(c => c.riskLevel === 'Overdue').length;

  const totalDemurrageExposureINR = managedContainers.reduce((sum, c) => sum + (c.totalDemurrageAccruedINR || 0) + (c.riskLevel === 'Critical' ? c.demurragePerDayINR * 2 : 0), 0);
  const totalCfsAccruedINR = managedContainers.reduce((sum, c) => sum + (c.cfsChargesAccruedINR || 0), 0);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED CONTAINERS
  // ══════════════════════════════════════════════════════════════════════════
  const filteredContainers = useMemo(() => {
    return managedContainers.filter(c => {
      const matchSearch =
        c.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.consigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sealNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cfsName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDirection = directionFilter === 'ALL' || c.direction === directionFilter;
      const matchStage = stageFilter === 'ALL' || c.currentStage === stageFilter;
      const matchRisk = riskFilter === 'ALL' || c.riskLevel === riskFilter;
      const matchCfs = cfsFilter === 'ALL' || c.cfsName.toLowerCase().includes(cfsFilter.toLowerCase());
      const matchCarrier = carrierFilter === 'ALL' || c.carrierName.toLowerCase().includes(carrierFilter.toLowerCase());

      return matchSearch && matchDirection && matchStage && matchRisk && matchCfs && matchCarrier;
    });
  }, [managedContainers, searchTerm, directionFilter, stageFilter, riskFilter, cfsFilter, carrierFilter]);

  // Bulk Selection Helpers
  const handleToggleSelectAll = () => {
    if (selectedContainerIds.length === filteredContainers.length) {
      setSelectedContainerIds([]);
    } else {
      setSelectedContainerIds(filteredContainers.map(c => c.id));
    }
  };

  const handleToggleSelectContainer = (id: string) => {
    setSelectedContainerIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkWhatsApp = () => {
    selectedContainerIds.forEach(id => {
      sendContainerWhatsAppAlert(id, 'tpl-72h-warning');
    });
    showToast('success', 'Bulk Alerts Dispatched', `WhatsApp alerts dispatched to ${selectedContainerIds.length} container consignees.`);
    setSelectedContainerIds([]);
  };

  const handleExportCSV = () => {
    const headers = ['Container #', 'Shipment #', 'Direction', 'Stage', 'Days at Stage', 'Risk Level', 'Free Time End', 'CFS Facility', 'Accrued CFS (INR)', 'Demurrage (INR)'];
    const rows = filteredContainers.map(c => [
      c.containerNumber,
      c.shipmentId,
      c.direction,
      c.currentStage,
      c.daysAtStage,
      c.riskLevel,
      c.freeTimeEnd,
      `"${c.cfsName}"`,
      c.cfsChargesAccruedINR,
      c.totalDemurrageAccruedINR
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAPS_Container_Control_Fleet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', 'Container fleet report downloaded to your computer.');
  };

  // CFS Calculator Calculation
  const cfsCalculationResult = useMemo(() => {
    return calculateCFSCharges({
      cfsId: selectedCfsId,
      equipmentType: selectedEquipType,
      cargoType: selectedCargoType,
      days: cfsDays,
      forkliftMoves,
      hasWeighment,
      hasFumigation,
      isWeekendGateout: isWeekend,
      isBaselineBenchmark: isBaselineTest
    });
  }, [selectedCfsId, selectedEquipType, selectedCargoType, cfsDays, forkliftMoves, hasWeighment, hasFumigation, isWeekend, isBaselineTest]);

  // D&D Fleet Calculator Calculation
  const dndResult = useMemo(() => {
    return calculateDemurrageAndDetention({
      carrierName: dndCarrier,
      equipmentType: dndEquip,
      totalDays: dndTotalDays,
      freeTimeDays: dndCustomFreeDays
    });
  }, [dndCarrier, dndEquip, dndTotalDays, dndCustomFreeDays]);

  // If public tracking preview is open
  if (selectedContainerForPublic) {
    return (
      <PublicContainerTrackingView
        containerNumber={selectedContainerForPublic}
        onBack={() => setSelectedContainerForPublic(null)}
      />
    );
  }

  return (
    <div className="space-y-5 text-xs">
      
      {/* ══════════════════════════════════════════════════════════════════════════
         TOP HEADER BAR
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1C2D4A]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
              <Boxes className="w-6 h-6 text-[#E88B2A]" />
              Container Control & D&D Fleet Tracking
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 uppercase tracking-widest animate-pulse">
              LIVE MODULE 16
            </span>
          </div>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Real-time demurrage clocks, free-time detention meters, 12 CFS tariff engine & automated WhatsApp billing alerts
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Add Container</span>
          </button>

          <button
            onClick={() => { setActiveTab('cfs'); setCfsStep(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] font-semibold text-xs border border-[#26395A] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E88B2A]" />
            <span>CFS Calculator</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] font-semibold text-xs border border-[#26395A] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk Import (Excel)</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] font-semibold text-xs border border-[#26395A] transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Scan EIR Barcode</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-800 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Send D&D Alerts</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
         TOP 4 METRIC STRIP (Module 10 Integration)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Fleet Under Custody */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">
              Fleet Under Custody
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#F4EFE6]">{totalFleetCount}</span>
              <span className="text-xs text-[#A8A299]">Box Units</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#A8A299]">
              <span className="text-emerald-400 font-semibold">{importCount} Import</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">{exportCount} Export</span>
            </div>
          </div>
          <Boxes className="w-6 h-6 text-[#E88B2A]" />
        </div>

        {/* Card 2: Free-Time Expiry Alert */}
        <div className="bg-[#0F1D33] border border-amber-800/40 rounded-xl p-3.5 shadow-sm flex items-center justify-between bg-gradient-to-br from-[#0F1D33] to-amber-950/15">
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Free-Time Expiry Alert
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-200">{watchCount + criticalCount}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-900/60 text-amber-300 border border-amber-700/50">
                &lt; 72H LEFT
              </span>
            </div>
            <p className="text-[10px] text-amber-300/70 mt-1">
              {criticalCount} Critical (&lt;24h) • {watchCount} on Watch
            </p>
          </div>
          <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        {/* Card 3: Demurrage Penal Risk (₹2,45,000 Exposure) */}
        <div className="bg-[#0F1D33] border border-rose-800/50 rounded-xl p-3.5 shadow-sm flex items-center justify-between bg-gradient-to-br from-[#0F1D33] to-rose-950/20">
          <div>
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
              Demurrage Penal Risk
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-200">
                {formatINR(totalDemurrageExposureINR)}
              </span>
            </div>
            <p className="text-[10px] text-rose-300/80 mt-1">
              {overdueCount} Overdue accruing daily • 10 carriers
            </p>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>

        {/* Card 4: CFS Charges Accrued MTD */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">
              CFS Charges Accrued
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {formatINR(totalCfsAccruedINR)}
              </span>
            </div>
            <p className="text-[10px] text-[#A8A299] mt-1">
              12 CFS yards in Mundra & Kandla
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE NAVIGATION TABS (All 7 Sub-Modules)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1C2D4A]">
        {[
          { id: 'fleet', label: '1. Container Fleet', icon: Boxes, badge: `${filteredContainers.length}` },
          { id: 'dnd', label: '2. D&D Exposure Engine', icon: Clock, badge: '10 Carriers' },
          { id: 'cfs', label: '3. CFS Charge Calculator', icon: Sliders, badge: '12 CFS Tariffs' },
          { id: 'alerts', label: '4. WhatsApp Alert Hub', icon: MessageSquare, badge: '4 Templates' },
          { id: 'billing', label: '5. Invoices & Billing', icon: FileText, badge: `${containerControlInvoices.length}` },
          { id: 'ledger', label: '6. Party Ledger & Aging', icon: Coins, badge: '5 Buckets' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-bold text-xs whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-[#E88B2A] text-[#E88B2A] bg-[#16263F]/70'
                  : 'border-transparent text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? 'bg-[#E88B2A]/20 text-[#E88B2A]' : 'bg-[#0F1D33] text-[#A8A299]'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 1 & 2: CONTAINER FLEET LIST & LIFECYCLE
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters & View Toggles */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search container # (MSKU), shipment, shipper, carrier, CFS..."
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
                />
              </div>

              {/* View Switchers */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <div className="flex items-center bg-[#16263F] border border-[#26395A] rounded-lg p-0.5">
                  <button
                    onClick={() => setFleetViewMode('table')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                      fleetViewMode === 'table' ? 'bg-[#0F1D33] text-[#E88B2A] shadow' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setFleetViewMode('kanban')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                      fleetViewMode === 'kanban' ? 'bg-[#0F1D33] text-[#E88B2A] shadow' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setFleetViewMode('risk_grid')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                      fleetViewMode === 'risk_grid' ? 'bg-[#0F1D33] text-[#E88B2A] shadow' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Risk Grid</span>
                  </button>
                  <button
                    onClick={() => setFleetViewMode('cfs_view')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                      fleetViewMode === 'cfs_view' ? 'bg-[#0F1D33] text-[#E88B2A] shadow' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>CFS Yard</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-[#1C2D4A]">
              {/* Direction */}
              <select
                value={directionFilter}
                onChange={e => setDirectionFilter(e.target.value as any)}
                className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1 text-xs text-[#F4EFE6] font-semibold"
              >
                <option value="ALL">Direction: All (Import & Export)</option>
                <option value="Import">Import Only ({importCount})</option>
                <option value="Export">Export Only ({exportCount})</option>
              </select>

              {/* Risk Level */}
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value as any)}
                className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1 text-xs text-[#F4EFE6] font-semibold"
              >
                <option value="ALL">Risk Status: All</option>
                <option value="Safe">🟢 Safe (&gt; 72h)</option>
                <option value="Watch">🟡 Watch (24-72h)</option>
                <option value="Critical">🔴 Critical (&lt; 24h)</option>
                <option value="Overdue">⚫ Overdue (Accruing Demurrage)</option>
              </select>

              {/* CFS Location */}
              <select
                value={cfsFilter}
                onChange={e => setCfsFilter(e.target.value)}
                className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1 text-xs text-[#F4EFE6] font-semibold"
              >
                <option value="ALL">CFS Yard: All 12 CFSs</option>
                {CFS_TARIFF_MASTER.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Carrier */}
              <select
                value={carrierFilter}
                onChange={e => setCarrierFilter(e.target.value)}
                className="bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1 text-xs text-[#F4EFE6] font-semibold"
              >
                <option value="ALL">Shipping Line: All</option>
                <option value="Maersk">Maersk Line</option>
                <option value="MSC">MSC</option>
                <option value="CMA">CMA CGM</option>
                <option value="Hapag">Hapag-Lloyd</option>
                <option value="COSCO">COSCO</option>
                <option value="ONE">ONE</option>
              </select>

              {(searchTerm || directionFilter !== 'ALL' || riskFilter !== 'ALL' || cfsFilter !== 'ALL' || carrierFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDirectionFilter('ALL');
                    setRiskFilter('ALL');
                    setCfsFilter('ALL');
                    setCarrierFilter('ALL');
                  }}
                  className="text-xs text-[#E88B2A] hover:underline ml-auto font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Bulk Actions Banner (When selected) */}
            {selectedContainerIds.length > 0 && (
              <div className="bg-[#E88B2A]/10 border border-[#E88B2A]/40 rounded-lg p-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#E88B2A]" />
                  <span className="font-bold text-[#F4EFE6]">
                    {selectedContainerIds.length} container(s) selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkWhatsApp}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send WhatsApp Alert</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold text-[11px] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      selectedContainerIds.forEach(id => updateContainerStage(id, 'DELIVERED'));
                      setSelectedContainerIds([]);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-800 hover:bg-teal-700 text-white font-semibold text-[11px] transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
             VIEW 1: TABLE VIEW (Sub-Module 1)
             ══════════════════════════════════════════════════════════════════════ */}
          {fleetViewMode === 'table' && (
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[1050px]">
                  <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedContainerIds.length === filteredContainers.length && filteredContainers.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-[#26395A] bg-[#0F1D33] text-[#E88B2A]"
                        />
                      </th>
                      <th className="p-3">Container #</th>
                      <th className="p-3">Shipment</th>
                      <th className="p-3">Shipper / Account</th>
                      <th className="p-3">Lifecycle Stage</th>
                      <th className="p-3">Free Time Clock</th>
                      <th className="p-3">D&D Risk</th>
                      <th className="p-3 text-right">CFS Accrued (₹)</th>
                      <th className="p-3">CFS Location</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2D4A] font-mono">
                    {filteredContainers.map(c => {
                      const isSelected = selectedContainerIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-[#16263F]/50 transition-colors ${
                            isSelected ? 'bg-[#E88B2A]/5' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectContainer(c.id)}
                              className="rounded border-[#26395A] bg-[#0F1D33] text-[#E88B2A]"
                            />
                          </td>

                          {/* Container # & Equipment */}
                          <td className="p-3 font-bold text-[#E88B2A]">
                            <div className="flex items-center gap-1.5">
                              <span>{c.containerNumber}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-sans font-bold bg-[#16263F] text-[#A8A299] border border-[#26395A]">
                                {c.equipmentType}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#A8A299] font-sans block">
                              Seal: {c.sealNumber} • {c.carrierName.split(' ')[0]}
                            </span>
                          </td>

                          {/* Shipment Clickable */}
                          <td className="p-3 font-mono font-bold text-sky-400">
                            <button
                              onClick={() => {
                                setActiveView('shipments');
                                setViewParam(c.shipmentId);
                              }}
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{c.shipmentId}</span>
                              <ExternalLink className="w-3 h-3 text-[#A8A299]" />
                            </button>
                            <span className="text-[10px] text-[#A8A299] font-sans block">
                              {c.direction}
                            </span>
                          </td>

                          {/* Shipper */}
                          <td className="p-3 font-sans font-medium text-[#F4EFE6] max-w-[170px] truncate">
                            {c.shipperName}
                            {c.isHold && (
                              <span className="text-[9.5px] text-rose-400 block font-semibold truncate">
                                ⚠ {c.holdReason?.split(':')[0]}
                              </span>
                            )}
                          </td>

                          {/* Current Stage */}
                          <td className="p-3 font-sans">
                            <button
                              onClick={() => setSelectedContainerForLifecycle(c)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] transition-colors"
                              title="Click to view full chevron lifecycle progression"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E88B2A]"></span>
                              <span>{c.currentStage}</span>
                              <ChevronRight className="w-3 h-3 text-[#A8A299]" />
                            </button>
                            <span className="text-[9.5px] text-[#A8A299] block mt-0.5 font-mono">
                              {c.daysAtStage}d at this stage
                            </span>
                          </td>

                          {/* Free Time Clock */}
                          <td className="p-3 font-sans">
                            {c.riskLevel === 'Overdue' ? (
                              <span className="font-mono text-rose-400 font-bold text-xs block">
                                EXPIRED ({Math.abs(c.freeTimeHoursRemaining)}h ago)
                              </span>
                            ) : (
                              <span className="font-mono text-[#F4EFE6] font-semibold text-xs block">
                                {Math.floor(c.freeTimeHoursRemaining / 24)}d {c.freeTimeHoursRemaining % 24}h remaining
                              </span>
                            )}
                            <span className="text-[10px] text-[#A8A299] block font-mono">
                              Expires: {c.freeTimeEnd.slice(0, 10)}
                            </span>
                          </td>

                          {/* Risk Status */}
                          <td className="p-3 font-sans">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                              c.riskLevel === 'Safe'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : c.riskLevel === 'Watch'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : c.riskLevel === 'Critical'
                                ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                                : 'bg-zinc-900 text-rose-400 border-rose-900 font-black'
                            }`}>
                              {c.riskLevel === 'Overdue' ? '⚫ OVERDUE' : c.riskLevel === 'Critical' ? '🔴 CRITICAL' : c.riskLevel === 'Watch' ? '🟡 WATCH' : '🟢 SAFE'}
                            </span>
                          </td>

                          {/* CFS Accrued */}
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {formatINR(c.cfsChargesAccruedINR)}
                            <span className="text-[9px] text-[#A8A299] font-sans block">
                              {c.cfsDays} days yard stay
                            </span>
                          </td>

                          {/* CFS Location */}
                          <td className="p-3 font-sans max-w-[150px] truncate text-[#A8A299]">
                            <span className="text-[#F4EFE6] font-semibold block truncate">
                              {c.cfsName.split(',')[0]}
                            </span>
                            <span className="text-[10px] truncate block">
                              {c.cfsLocation.split(',')[0]}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-sans">
                              {/* Open Lifecycle Drawer */}
                              <button
                                onClick={() => setSelectedContainerForLifecycle(c)}
                                className="p-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
                                title="View Interactive Lifecycle Timeline & Advance Stage"
                              >
                                <Boxes className="w-3.5 h-3.5 text-[#E88B2A]" />
                              </button>

                              {/* WhatsApp Direct Alert */}
                              <button
                                onClick={() => setSelectedContainerForWa(c)}
                                className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors"
                                title="Send Real-time WhatsApp Demurrage Alert to Shipper"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                              </button>

                              {/* Public Tracking Client Link */}
                              <button
                                onClick={() => setSelectedContainerForPublic(c.containerNumber)}
                                className="p-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-sky-400 border border-[#26395A] transition-colors"
                                title="Open Client Self-Service Tracking Page (/ccontrol)"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
             VIEW 2: KANBAN BOARD BY LIFECYCLE STAGE
             ══════════════════════════════════════════════════════════════════════ */}
          {fleetViewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start gap-3 min-w-[1100px]">
                {['ARRIVED', 'AT CFS', 'DO RECEIVED', 'GATED OUT', 'DELIVERED', 'STUFFING', 'GATE-IN'].map(stage => {
                  const stageContainers = filteredContainers.filter(c => c.currentStage === stage);
                  return (
                    <div key={stage} className="flex-1 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 space-y-2.5 min-w-[220px]">
                      <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                        <span className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E88B2A]"></span>
                          {stage}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#16263F] text-[#A8A299] font-bold">
                          {stageContainers.length}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {stageContainers.map(c => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedContainerForLifecycle(c)}
                            className="p-2.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] border border-[#26395A] cursor-pointer transition-all space-y-1.5 shadow-sm group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-[#E88B2A]">
                                {c.containerNumber}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                c.riskLevel === 'Overdue' ? 'bg-rose-950 text-rose-300' : c.riskLevel === 'Critical' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                              }`}>
                                {c.riskLevel}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#F4EFE6] font-medium truncate">
                              {c.shipperName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-[#A8A299] font-mono pt-1 border-t border-[#1C2D4A]/60">
                              <span>{c.equipmentType}</span>
                              <span className="text-emerald-400 font-bold">{formatINR(c.cfsChargesAccruedINR)}</span>
                            </div>
                          </div>
                        ))}
                        {stageContainers.length === 0 && (
                          <div className="p-4 text-center text-[#6E6A64] text-xs border border-dashed border-[#1C2D4A] rounded-lg">
                            No boxes at this stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
             VIEW 3: RISK GRID (Grouped by Safe, Watch, Critical, Overdue)
             ══════════════════════════════════════════════════════════════════════ */}
          {fleetViewMode === 'risk_grid' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Safe Fleet (> 72h)', level: 'Safe', color: 'emerald', count: safeCount, desc: 'Ample free time remaining' },
                { title: 'Watch List (24-72h)', level: 'Watch', color: 'amber', count: watchCount, desc: 'Expiring within 3 days' },
                { title: 'Critical Risk (< 24h)', level: 'Critical', color: 'rose', count: criticalCount, desc: 'Demurrage clock imminent' },
                { title: 'Demurrage Overdue', level: 'Overdue', color: 'purple', count: overdueCount, desc: 'Penal charges accumulating daily' }
              ].map(group => {
                const groupContainers = filteredContainers.filter(c => c.riskLevel === group.level);
                return (
                  <div key={group.level} className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 space-y-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                        <div>
                          <h3 className="font-bold text-xs text-[#F4EFE6]">{group.title}</h3>
                          <p className="text-[10px] text-[#A8A299]">{group.desc}</p>
                        </div>
                        <span className="text-lg font-bold font-mono text-[#E88B2A]">{groupContainers.length}</span>
                      </div>

                      <div className="mt-3 space-y-2 max-h-[480px] overflow-y-auto">
                        {groupContainers.map(c => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedContainerForLifecycle(c)}
                            className="p-2.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] border border-[#26395A] cursor-pointer transition-all space-y-1 shadow-sm"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-xs text-[#F4EFE6]">{c.containerNumber}</span>
                              <span className="text-[10px] font-bold text-rose-400">
                                {c.riskLevel === 'Overdue' ? `₹${c.totalDemurrageAccruedINR.toLocaleString('en-IN')}` : `${c.freeTimeHoursRemaining}h left`}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#A8A299] truncate">{c.shipperName}</p>
                            <div className="text-[9px] text-[#6E6A64] flex justify-between font-mono pt-1">
                              <span>{c.cfsName.split(' ')[0]}</span>
                              <span>₹{c.demurragePerDayINR}/day</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
             VIEW 4: CFS YARD LOCATION VIEW (All 12 CFSs)
             ══════════════════════════════════════════════════════════════════════ */}
          {fleetViewMode === 'cfs_view' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CFS_TARIFF_MASTER.map(cfs => {
                const cfsContainers = filteredContainers.filter(c => c.cfsName.toLowerCase().includes(cfs.name.toLowerCase()));
                const cfsTotalAccrued = cfsContainers.reduce((sum, c) => sum + c.cfsChargesAccruedINR, 0);

                return (
                  <div key={cfs.id} className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                        <div>
                          <h3 className="font-bold text-xs text-[#F4EFE6]">{cfs.name}</h3>
                          <span className="text-[10px] text-[#A8A299] block">{cfs.zone}</span>
                        </div>
                        <span className="text-sm font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {cfsContainers.length} Boxes
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#A8A299]">Total CFS Accrued:</span>
                          <span className="font-mono font-bold text-emerald-400">{formatINR(cfsTotalAccrued)}</span>
                        </div>
                        <div className="flex justify-between text-[#A8A299]">
                          <span>Specialty:</span>
                          <span className="text-[#F4EFE6] text-right truncate max-w-[180px]">{cfs.specialty}</span>
                        </div>
                      </div>

                      {/* Mini container badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {cfsContainers.map(c => (
                          <span
                            key={c.id}
                            onClick={() => setSelectedContainerForLifecycle(c)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#16263F] hover:bg-[#1E3558] text-[#E88B2A] border border-[#26395A] cursor-pointer"
                          >
                            {c.containerNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 3: D&D EXPOSURE ENGINE & FLEET CALCULATOR
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dnd' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Carrier Tariff Master & Live Calculator */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
                <div>
                  <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E88B2A]" />
                    Interactive Liner Demurrage & Detention Calculator
                  </h2>
                  <p className="text-[11px] text-[#A8A299]">
                    10 Carrier rules, graduated penal slabs, and USD to INR live conversion (@ ₹{USD_TO_INR_RATE}/USD)
                  </p>
                </div>
              </div>

              {/* Calculator Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                    Shipping Line:
                  </label>
                  <select
                    value={dndCarrier}
                    onChange={e => {
                      setDndCarrier(e.target.value);
                      const matched = CARRIER_FREE_TIME_RULES.find(c => c.carrierName === e.target.value);
                      if (matched) setDndCustomFreeDays(matched.defaultFreeTimeDays);
                    }}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6]"
                  >
                    {CARRIER_FREE_TIME_RULES.map(c => (
                      <option key={c.scac} value={c.carrierName}>{c.carrierName} ({c.defaultFreeTimeDays}d Free)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                    Container Size:
                  </label>
                  <select
                    value={dndEquip}
                    onChange={e => setDndEquip(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6]"
                  >
                    <option value="20'GP">20' Standard Dry (20'GP)</option>
                    <option value="40'HC">40' High Cube Dry (40'HC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                    Free Time Days:
                  </label>
                  <input
                    type="number"
                    value={dndCustomFreeDays}
                    onChange={e => setDndCustomFreeDays(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F4EFE6]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block mb-1">
                    Total Stay Days:
                  </label>
                  <input
                    type="number"
                    value={dndTotalDays}
                    onChange={e => setDndTotalDays(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F4EFE6]"
                  />
                </div>
              </div>

              {/* Slider for Days */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-[#A8A299] mb-1 font-mono">
                  <span>Day 1 (Gate-in)</span>
                  <span className="font-bold text-[#E88B2A]">{dndTotalDays} Total Days</span>
                  <span>Day 45 (Severe Penal)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={45}
                  value={dndTotalDays}
                  onChange={e => setDndTotalDays(Number(e.target.value))}
                  className="w-full accent-[#E88B2A] cursor-pointer"
                />
              </div>

              {/* Calculation Output Box */}
              <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="font-sans text-[#A8A299] text-[10px] block">Days Exceeded:</span>
                  <span className={`text-xl font-bold ${dndResult.daysExceeded > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {dndResult.daysExceeded} Days
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[#A8A299] text-[10px] block">Current Daily Rate:</span>
                  <span className="text-xl font-bold text-[#F4EFE6]">
                    ${dndResult.dailyRateUSD}/day
                  </span>
                  <span className="text-[10px] text-[#A8A299] font-sans block">
                    (₹{dndResult.dailyRateINR}/day)
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[#A8A299] text-[10px] block">Demurrage (USD):</span>
                  <span className="text-xl font-bold text-amber-400">
                    ${dndResult.demurrageUSD}
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[#A8A299] text-[10px] block">Total Demurrage (INR):</span>
                  <span className="text-xl font-bold text-rose-400">
                    {formatINR(dndResult.demurrageINR)}
                  </span>
                </div>
              </div>
            </div>

            {/* 10 Carriers Free Time Comparison Table */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#1C2D4A] bg-[#16263F]">
                <h3 className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider">
                  Carrier Standard Free Time & Demurrage Slab Master (20' vs 40')
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#16263F]/50 text-[#A8A299] font-bold border-b border-[#26395A]">
                    <tr>
                      <th className="p-2.5">Carrier Line</th>
                      <th className="p-2.5">SCAC</th>
                      <th className="p-2.5 text-center">Default Free Days</th>
                      <th className="p-2.5">Demurrage Days 1-5 (20'/40')</th>
                      <th className="p-2.5">Demurrage Days 6-10</th>
                      <th className="p-2.5">Demurrage Days 16+</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2D4A] font-mono">
                    {CARRIER_FREE_TIME_RULES.map(c => (
                      <tr key={c.scac} className="hover:bg-[#16263F]/40">
                        <td className="p-2.5 font-sans font-bold text-[#F4EFE6]">{c.carrierName}</td>
                        <td className="p-2.5 text-sky-400">{c.scac}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-400">{c.defaultFreeTimeDays} Days</td>
                        <td className="p-2.5 text-[#F4EFE6]">${c.demurrageTiers20USD.days1to5} / ${c.demurrageTiers40USD.days1to5}</td>
                        <td className="p-2.5 text-[#F4EFE6]">${c.demurrageTiers20USD.days6to10} / ${c.demurrageTiers40USD.days6to10}</td>
                        <td className="p-2.5 text-rose-400 font-bold">${c.demurrageTiers20USD.days16plus} / ${c.demurrageTiers40USD.days16plus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Col: Fuel Gauge & Overdue Exposure List */}
          <div className="space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Fleet Demurrage Fuel Gauge
              </h3>

              {/* Visual Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{safeCount} Safe (75%)</span>
                  <span className="text-amber-400 font-bold">{watchCount + criticalCount} Warning</span>
                  <span className="text-rose-400 font-bold">{overdueCount} Overdue</span>
                </div>
                <div className="w-full bg-[#16263F] h-3 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(safeCount / totalFleetCount) * 100}%` }}></div>
                  <div className="bg-amber-500 h-full" style={{ width: `${((watchCount + criticalCount) / totalFleetCount) * 100}%` }}></div>
                  <div className="bg-rose-600 h-full" style={{ width: `${(overdueCount / totalFleetCount) * 100}%` }}></div>
                </div>
              </div>

              {/* Overdue Items List */}
              <div className="pt-3 border-t border-[#1C2D4A] space-y-2">
                <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">
                  Top Demurrage Accruing Boxes:
                </span>
                {managedContainers.filter(c => c.totalDemurrageAccruedINR > 0).map(c => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-[#16263F] border border-rose-900/50 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-rose-300 block">{c.containerNumber}</span>
                      <span className="text-[10px] text-[#A8A299]">{c.shipperName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-400 block">₹{c.totalDemurrageAccruedINR.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-[#A8A299]">Accrued</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 4: CFS CHARGE CALCULATOR (THE BIG ONE)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cfs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: 5-Step Workflow UI */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-5">
              
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
                <div>
                  <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#E88B2A]" />
                    5-Step CFS Charge & Ground Rent Estimator
                  </h2>
                  <p className="text-[11px] text-[#A8A299]">
                    Select CFS yard, container size, cargo classification, and days to calculate statutory GST charges
                  </p>
                </div>

                {/* Baseline 5-Day Test Button */}
                <button
                  onClick={() => {
                    setSelectedCfsId('cfs-allcargo-mun');
                    setSelectedEquipType("20'GP");
                    setSelectedCargoType('General Cargo');
                    setCfsDays(5);
                    setIsBaselineTest(true);
                    showToast('info', 'Loaded Audit Baseline', "Allcargo 20'GP General 5 days loaded = ₹45,626 exact match test.");
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
                >
                  Load Allcargo 5-Day Test (₹45,626)
                </button>
              </div>

              {/* Step 1: Pick CFS (12 CFS Grid) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center justify-between">
                  <span>Step 1: Pick Container Freight Station (12 Mundra & Kandla Facilities)</span>
                  <span className="text-[10px] text-[#E88B2A] font-mono">
                    Selected: {CFS_TARIFF_MASTER.find(c => c.id === selectedCfsId)?.name}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {CFS_TARIFF_MASTER.map(cfs => {
                    const isSelected = selectedCfsId === cfs.id;
                    return (
                      <button
                        key={cfs.id}
                        type="button"
                        onClick={() => { setSelectedCfsId(cfs.id); setIsBaselineTest(false); }}
                        className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#E88B2A]/20 border-[#E88B2A] text-[#F4EFE6] shadow'
                            : 'bg-[#16263F] border-[#26395A] text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1E3558]'
                        }`}
                      >
                        <span className="font-bold text-[11px] truncate block">{cfs.name.split(',')[0]}</span>
                        <span className="text-[9.5px] text-[#A8A299] block">{cfs.zone}</span>
                        <span className="text-[9px] font-mono text-[#E88B2A] mt-1">{cfs.typicalCostRange.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Pick Container Type */}
              <div className="space-y-2 pt-2 border-t border-[#1C2D4A]">
                <label className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider block">
                  Step 2: Pick Container Equipment Specification
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["20'GP", "40'GP", "40'HC", "20'RF", "40'RF", "20'OT", "40'OT", "20'FR", "40'FR", "20'TK"].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setSelectedEquipType(t); setIsBaselineTest(false); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                        selectedEquipType === t
                          ? 'bg-[#E88B2A] text-[#0A1628]'
                          : 'bg-[#16263F] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Pick Cargo Type */}
              <div className="space-y-2 pt-2 border-t border-[#1C2D4A]">
                <label className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider block">
                  Step 3: Cargo Nature & IMDG Surcharges
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'General Cargo', label: 'General Dry Cargo', desc: 'Standard tariff' },
                    { id: 'Hazardous / DG', label: 'Hazardous (IMDG)', desc: '1.5x - 1.7x ground rent' },
                    { id: 'Reefer', label: 'Reefer Temperature', desc: 'Daily plug power + 2.5x' },
                    { id: 'ODC / OOG', label: 'Over-Dimensional (ODC)', desc: '2.0x heavy crane rate' }
                  ].map(cg => (
                    <button
                      key={cg.id}
                      type="button"
                      onClick={() => { setSelectedCargoType(cg.id as any); setIsBaselineTest(false); }}
                      className={`p-2.5 rounded-lg text-left border transition-colors ${
                        selectedCargoType === cg.id
                          ? 'bg-[#E88B2A]/20 border-[#E88B2A] text-[#F4EFE6]'
                          : 'bg-[#16263F] border-[#26395A] text-[#A8A299] hover:text-[#F4EFE6]'
                      }`}
                    >
                      <span className="font-bold text-xs block">{cg.label}</span>
                      <span className="text-[10px] text-[#A8A299]">{cg.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Days Slider */}
              <div className="space-y-2 pt-2 border-t border-[#1C2D4A]">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#F4EFE6] uppercase tracking-wider">
                    Step 4: Duration at CFS Yard (Days of Ground Rent)
                  </span>
                  <span className="text-base font-mono text-[#E88B2A]">{cfsDays} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={cfsDays}
                  onChange={e => { setCfsDays(Number(e.target.value)); setIsBaselineTest(false); }}
                  className="w-full accent-[#E88B2A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A8A299] font-mono">
                  <span>Day 1 (Free/Base)</span>
                  <span>Day 7 (Normal)</span>
                  <span>Day 15 (Penal Tier 3)</span>
                  <span>Day 30+ (Penal Tier 5)</span>
                </div>
              </div>

              {/* Step 4b: Additional CFS Extras */}
              <div className="pt-2 border-t border-[#1C2D4A] flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#F4EFE6]">
                  <input
                    type="checkbox"
                    checked={hasWeighment}
                    onChange={e => setHasWeighment(e.target.checked)}
                    className="rounded border-[#26395A] bg-[#16263F] text-[#E88B2A]"
                  />
                  <span>Electronic Weighbridge (VGM)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[#F4EFE6]">
                  <input
                    type="checkbox"
                    checked={hasFumigation}
                    onChange={e => setHasFumigation(e.target.checked)}
                    className="rounded border-[#26395A] bg-[#16263F] text-[#E88B2A]"
                  />
                  <span>Fumigation Bay Preparation</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[#F4EFE6]">
                  <input
                    type="checkbox"
                    checked={isWeekend}
                    onChange={e => setIsWeekend(e.target.checked)}
                    className="rounded border-[#26395A] bg-[#16263F] text-[#E88B2A]"
                  />
                  <span>Weekend / Port Holiday Gate-out (1.25x)</span>
                </label>
              </div>

            </div>
          </div>

          {/* Right Col: Step 5 See Breakdown & Rules Fired */}
          <div className="space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#1C2D4A]">
                <span className="text-[10px] font-bold text-[#E88B2A] uppercase tracking-widest block font-mono">
                  STEP 5: TARIFF BREAKDOWN
                </span>
                <h3 className="font-bold text-sm text-[#F4EFE6]">
                  {cfsCalculationResult.cfs.name}
                </h3>
                <p className="text-[10px] text-[#A8A299]">
                  {selectedEquipType} • {selectedCargoType} • {cfsDays} Days
                </p>
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                  <span className="font-sans text-[#A8A299]">Ground Rent:</span>
                  <span className="text-[#F4EFE6]">₹{cfsCalculationResult.breakdown.groundRent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                  <span className="font-sans text-[#A8A299]">Handling (THC):</span>
                  <span className="text-[#F4EFE6]">₹{cfsCalculationResult.breakdown.handling.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                  <span className="font-sans text-[#A8A299]">EIR & Documentation:</span>
                  <span className="text-[#F4EFE6]">₹{cfsCalculationResult.breakdown.documentation.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                  <span className="font-sans text-[#A8A299]">Forklift (2 moves):</span>
                  <span className="text-[#F4EFE6]">₹{cfsCalculationResult.breakdown.forklift.toLocaleString('en-IN')}</span>
                </div>
                {cfsCalculationResult.breakdown.weighment > 0 && (
                  <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50">
                    <span className="font-sans text-[#A8A299]">Weighment (VGM):</span>
                    <span className="text-[#F4EFE6]">₹{cfsCalculationResult.breakdown.weighment.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {cfsCalculationResult.breakdown.specialSurcharges > 0 && (
                  <div className="flex justify-between py-1 border-b border-[#1C2D4A]/50 text-amber-300">
                    <span className="font-sans">Special Surcharges:</span>
                    <span>₹{cfsCalculationResult.breakdown.specialSurcharges.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#1C2D4A] flex justify-between font-bold text-sm text-[#F4EFE6]">
                  <span className="font-sans">Subtotal:</span>
                  <span>₹{cfsCalculationResult.breakdown.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#A8A299]">
                  <span className="font-sans">GST @ 18% (SAC 996611):</span>
                  <span>₹{cfsCalculationResult.breakdown.gst18.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t-2 border-[#E88B2A]/40 flex justify-between text-base font-black text-emerald-400">
                  <span className="font-sans">TOTAL (INR):</span>
                  <span>₹{cfsCalculationResult.breakdown.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Estimate Range */}
              <div className="p-2.5 rounded-lg bg-[#16263F] text-[10px] space-y-1">
                <span className="font-bold text-[#A8A299] uppercase block font-sans">Confidence Range:</span>
                <div className="flex justify-between font-mono text-[#F4EFE6]">
                  <span>Low: ₹{cfsCalculationResult.estimateRange.low.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-emerald-400">Likely: ₹{cfsCalculationResult.estimateRange.likely.toLocaleString('en-IN')}</span>
                  <span>High: ₹{cfsCalculationResult.estimateRange.high.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    const firstShipment = shipments[0]?.id || 'MAPS-240342';
                    saveCfsChargeToShipment(firstShipment, {
                      cfsName: cfsCalculationResult.cfs.name,
                      total: cfsCalculationResult.breakdown.total,
                      subtotal: cfsCalculationResult.breakdown.subtotal
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Shipment Charges</span>
                </button>

                <button
                  onClick={() => {
                    showToast('info', 'Opening Print Dialog', 'Select "Save as PDF" to download high-resolution CFS estimate.');
                    window.print();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Estimate PDF</span>
                </button>
              </div>

              {/* Terms Evaluator */}
              <div className="pt-3 border-t border-[#1C2D4A] space-y-1.5">
                <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">
                  Tariff Rules Fired:
                </span>
                <div className="space-y-1 text-[9.5px] text-[#A8A299]">
                  {cfsCalculationResult.rulesFired.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 5: WHATSAPP ALERT ENGINE & SIMULATOR
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Alert Templates & Interactive Simulator */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
                <div>
                  <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Automated D&D Alert Cascade Templates
                  </h2>
                  <p className="text-[11px] text-[#A8A299]">
                    Auto-triggered via WhatsApp Business API (Gupshup / AiSensy) with business-hours validation (9 AM - 7 PM IST)
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                  ACTIVE BUSINESS HOURS
                </span>
              </div>

              {/* Template Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {WHATSAPP_ALERT_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-3 rounded-lg text-left border transition-all ${
                      selectedTemplateId === t.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-[#F4EFE6] shadow'
                        : 'bg-[#16263F] border-[#26395A] text-[#A8A299] hover:text-[#F4EFE6]'
                    }`}
                  >
                    <span className="font-bold text-xs block">{t.name}</span>
                    <span className="text-[10px] text-[#A8A299] mt-0.5 block">{t.triggerEvent}</span>
                  </button>
                ))}
              </div>

              {/* Live Preview & Send Box */}
              <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-[#26395A]">
                  <span className="font-bold text-xs text-[#F4EFE6]">
                    Template Preview with Dynamic Variables:
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={simulatedContainerNo}
                      onChange={e => setSimulatedContainerNo(e.target.value)}
                      className="bg-[#0F1D33] border border-[#26395A] rounded px-2 py-1 text-xs text-[#F4EFE6] font-mono"
                    >
                      {managedContainers.map(c => (
                        <option key={c.id} value={c.containerNumber}>{c.containerNumber} ({c.shipperName.split(' ')[0]})</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={customPhone}
                      onChange={e => setCustomPhone(e.target.value)}
                      className="bg-[#0F1D33] border border-[#26395A] rounded px-2 py-1 text-xs text-[#F4EFE6] font-mono w-36"
                    />
                  </div>
                </div>

                {/* Preformatted WhatsApp Bubble */}
                <div className="bg-[#075E54]/20 border border-[#128C7E]/40 rounded-xl p-4 font-sans text-xs text-[#F4EFE6] whitespace-pre-line leading-relaxed shadow-inner">
                  {fillWhatsAppTemplate(selectedTemplateId, {
                    SHIPPER_NAME: managedContainers.find(c => c.containerNumber === simulatedContainerNo)?.shipperName || 'Krishna Ceramics Pvt Ltd',
                    'CONTAINER#': simulatedContainerNo,
                    CFS_NAME: managedContainers.find(c => c.containerNumber === simulatedContainerNo)?.cfsName || 'Allcargo CFS Mundra',
                    EXPIRY_DATE: '20 Oct 2026, 18:00 IST',
                    CURRENT_CFS_COST: '14,396',
                    DEMURRAGE_RATE: '7,500',
                    DAILY_RATE: '7,500',
                    DAYS_OVERDUE: '3',
                    TOTAL_ACCRUED: '22,500',
                    TRACKING_LINK: `https://mapsnvocc.in/ccontrol/${simulatedContainerNo}`,
                    CONTACT_PHONE: '+91 98250 11492'
                  })}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      sendContainerWhatsAppAlert(simulatedContainerNo, selectedTemplateId, customPhone);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test WhatsApp Alert</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 50+ Alert History Log Table */}
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#1C2D4A] bg-[#16263F] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider">
                    Recent D&D Alert Logs & Delivery Receipts ({MOCK_ALERT_HISTORY.length} Records)
                  </h3>
                  <p className="text-[10px] text-[#A8A299]">
                    Monitored response rate: 94.2% opened / acted within 4 hours
                  </p>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#16263F]/50 text-[#A8A299] text-[10px] font-bold border-b border-[#26395A]">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Alert Type</th>
                      <th className="p-2.5">Recipient</th>
                      <th className="p-2.5">Message Preview</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2D4A] font-mono text-[11px]">
                    {MOCK_ALERT_HISTORY.slice(0, 15).map(alt => (
                      <tr key={alt.id} className="hover:bg-[#16263F]/40">
                        <td className="p-2.5 text-[#A8A299]">{alt.timestamp}</td>
                        <td className="p-2.5 font-bold text-[#E88B2A]">{alt.type}</td>
                        <td className="p-2.5 font-sans text-[#F4EFE6]">{alt.recipient}</td>
                        <td className="p-2.5 font-sans text-[#A8A299] max-w-xs truncate">{alt.messagePreview}</td>
                        <td className="p-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            alt.status === 'action_taken' ? 'bg-teal-950 text-teal-300' : alt.status === 'replied' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {alt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Col: Performance Stats */}
          <div className="space-y-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider">
                WhatsApp Dispatch Performance
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[#A8A299] mb-1">
                    <span>Sent This Week:</span>
                    <span className="font-mono font-bold text-[#F4EFE6]">142 Messages</span>
                  </div>
                  <div className="w-full bg-[#16263F] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[94%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#A8A299] mb-1">
                    <span>Open Rate:</span>
                    <span className="font-mono font-bold text-emerald-400">96.8%</span>
                  </div>
                  <div className="w-full bg-[#16263F] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[96.8%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#A8A299] mb-1">
                    <span>Delivery Order Action Taken:</span>
                    <span className="font-mono font-bold text-sky-400">82.4%</span>
                  </div>
                  <div className="w-full bg-[#16263F] h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full w-[82.4%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 6: BILLING & INVOICES (GST SAC 996611 @ 18%)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {/* Pricing Models Comparison Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTAINER_CONTROL_PRICING_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`bg-[#0F1D33] border rounded-xl p-4 shadow-sm flex flex-col justify-between ${
                  plan.isPopular ? 'border-[#E88B2A] ring-1 ring-[#E88B2A]/40' : 'border-[#26395A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                    <span className="font-bold text-sm text-[#F4EFE6]">{plan.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#16263F] text-[#E88B2A] border border-[#26395A]">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="mt-2 text-base font-bold font-mono text-[#E88B2A]">
                    {plan.priceLabel}
                  </div>
                  <p className="text-[11px] text-[#A8A299] mt-1">
                    {plan.description}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[10.5px] text-[#F4EFE6]">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 8 Container Control Invoices Table */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#1C2D4A] bg-[#16263F] flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs text-[#F4EFE6] uppercase tracking-wider">
                  Container Control Monthly Invoices (GST SAC 996611 @ 18%)
                </h3>
                <p className="text-[10px] text-[#A8A299]">
                  Automatic consolidated pass-through billing with HDFC bank QR remittance
                </p>
              </div>

              <button
                onClick={() => {
                  showToast('success', 'Auto-Billing Complete', '1st of month billing executed. 8 GST invoices generated & queued.');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs shadow"
              >
                + Run 1st-of-Month Auto-Billing
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-[#16263F]/50 text-[#A8A299] text-[10px] font-bold border-b border-[#26395A]">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer / Party</th>
                    <th className="p-3">Billing Model</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Total (INR)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] font-mono">
                  {containerControlInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#16263F]/40 transition-colors">
                      <td className="p-3 font-bold text-[#E88B2A]">{inv.invoiceNumber}</td>
                      <td className="p-3 font-sans font-medium text-[#F4EFE6]">{inv.customerName}</td>
                      <td className="p-3 font-sans text-[#A8A299]">{inv.billingModel}</td>
                      <td className="p-3 text-[#A8A299]">{inv.invoiceDate}</td>
                      <td className="p-3 text-[#F4EFE6]">{inv.dueDate}</td>
                      <td className="p-3 text-right text-[#A8A299]">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">₹{inv.totalINR.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {inv.status} {inv.daysOverdue ? `(${inv.daysOverdue}d)` : ''}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="px-2.5 py-1 rounded bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] text-xs font-semibold"
                          >
                            View Invoice
                          </button>
                          {inv.status !== 'Paid' && (
                            <button
                              onClick={() => markContainerInvoicePaid(inv.id)}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         SUB-MODULE 7: PARTY LEDGER WITH AGING (5 Buckets)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerLedgers.map(led => (
              <div key={led.customerId} className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                    <div>
                      <h3 className="font-bold text-xs text-[#F4EFE6]">{led.customerName}</h3>
                      <span className="text-[10px] text-[#A8A299] font-mono">GSTIN: {led.gstin}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#A8A299] block">Closing Balance:</span>
                      <span className={`text-base font-bold font-mono ${led.closingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatINR(led.closingBalance)} {led.closingBalance > 0 ? '(Dr)' : '(Nil)'}
                      </span>
                    </div>
                  </div>

                  {/* Aging Stacked Bar */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider block">
                      Aging Distribution (5 Buckets):
                    </span>
                    <div className="w-full bg-[#16263F] h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${led.aging.current > 0 ? 30 : 0}%` }}></div>
                      <div className="bg-amber-500 h-full" style={{ width: `${led.aging.days16to30 > 0 ? 30 : 0}%` }}></div>
                      <div className="bg-orange-500 h-full" style={{ width: `${led.aging.days31to60 > 0 ? 25 : 0}%` }}></div>
                      <div className="bg-rose-600 h-full" style={{ width: `${led.aging.days61to90 > 0 ? 15 : 0}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-[#A8A299]">
                      <span>0-15d: ₹{led.aging.current}</span>
                      <span>16-30d: ₹{led.aging.days16to30}</span>
                      <span>31-60d: ₹{led.aging.days31to60}</span>
                      <span>61-90d: ₹{led.aging.days61to90}</span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="mt-3 border border-[#1C2D4A] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A]">
                        <tr>
                          <th className="p-1.5">Date</th>
                          <th className="p-1.5">Description</th>
                          <th className="p-1.5 text-right">Debit (₹)</th>
                          <th className="p-1.5 text-right">Credit (₹)</th>
                          <th className="p-1.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C2D4A] font-mono">
                        {led.entries.map(e => (
                          <tr key={e.id}>
                            <td className="p-1.5 text-[#A8A299]">{e.date}</td>
                            <td className="p-1.5 font-sans text-[#F4EFE6]">{e.description}</td>
                            <td className="p-1.5 text-right text-rose-300">{e.debit > 0 ? e.debit.toLocaleString('en-IN') : '-'}</td>
                            <td className="p-1.5 text-right text-emerald-400">{e.credit > 0 ? e.credit.toLocaleString('en-IN') : '-'}</td>
                            <td className="p-1.5 text-right font-bold text-[#F4EFE6]">₹{e.runningBalance.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      showToast('info', 'Opening Statement', `Generating monthly ledger statement for ${led.customerName}`);
                      window.print();
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Monthly Statement</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         MODAL: LIFECYCLE PROGRESSION & ADVANCE STAGE (Sub-Module 2)
         ══════════════════════════════════════════════════════════════════════════ */}
      {selectedContainerForLifecycle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in no-print">
          <div className="relative w-full max-w-3xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
              <div>
                <span className="text-[10px] font-mono text-[#E88B2A] font-bold uppercase tracking-wider">
                  CONTAINER LIFECYCLE CONTROLLER
                </span>
                <h2 className="text-lg font-bold text-[#F4EFE6]">
                  {selectedContainerForLifecycle.containerNumber} ({selectedContainerForLifecycle.direction})
                </h2>
                <p className="text-xs text-[#A8A299]">
                  {selectedContainerForLifecycle.shipperName} • {selectedContainerForLifecycle.cfsName}
                </p>
              </div>
              <button
                onClick={() => setSelectedContainerForLifecycle(null)}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1D3251]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stage Highlight */}
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#A8A299] block">Active Lifecycle Stage:</span>
                <span className="text-base font-bold text-[#E88B2A] uppercase">
                  {selectedContainerForLifecycle.currentStage}
                </span>
                <p className="text-[11px] text-[#A8A299] mt-0.5 font-mono">
                  Current location: {selectedContainerForLifecycle.cfsLocation} • D&D clock active
                </p>
              </div>

              {/* Fast Advance Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#F4EFE6] font-semibold">Advance to:</span>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      updateContainerStage(selectedContainerForLifecycle.id, e.target.value as any);
                      setSelectedContainerForLifecycle(prev => prev ? { ...prev, currentStage: e.target.value as any } : null);
                    }
                  }}
                  className="bg-[#0F1D33] border border-[#E88B2A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6] font-bold"
                  defaultValue=""
                >
                  <option value="" disabled>Select Next Milestone</option>
                  {selectedContainerForLifecycle.direction === 'Import' ? (
                    <>
                      <option value="ARRIVED">ARRIVED</option>
                      <option value="DISCHARGED">DISCHARGED</option>
                      <option value="AT CFS">AT CFS</option>
                      <option value="DO RECEIVED">DO RECEIVED</option>
                      <option value="GATED OUT">GATED OUT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="EMPTY RETURNED">EMPTY RETURNED</option>
                      <option value="BILLED">BILLED</option>
                    </>
                  ) : (
                    <>
                      <option value="BOOKING">BOOKING</option>
                      <option value="EMPTY PICKED UP">EMPTY PICKED UP</option>
                      <option value="STUFFING">STUFFING</option>
                      <option value="IN TRANSIT">IN TRANSIT</option>
                      <option value="GATE-IN">GATE-IN</option>
                      <option value="LEO/LOADED">LEO/LOADED</option>
                      <option value="BILLED">BILLED</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Audit History Log */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider block">
                Recorded Milestone Audit Trail:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedContainerForLifecycle.stageHistory.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#16263F] border border-[#26395A] flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-[#F4EFE6] uppercase">{h.stage}</span>
                        <span className="text-[10px] text-[#A8A299] block">{h.location} • By {h.updatedBy}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#A8A299]">{h.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#1C2D4A]">
              <button
                onClick={() => {
                  setSelectedContainerForPublic(selectedContainerForLifecycle.containerNumber);
                  setSelectedContainerForLifecycle(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16263F] hover:bg-[#1E3558] text-xs font-semibold text-sky-400 border border-[#26395A]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Public Tracking Client View</span>
              </button>

              <button
                onClick={() => setSelectedContainerForLifecycle(null)}
                className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
         GLOBAL MODALS INTEGRATION
         ══════════════════════════════════════════════════════════════════════════ */}
      <AddContainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <BulkImportContainersModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned: string) => {
          setSearchTerm(scanned);
          showToast('info', 'EIR Barcode Scanned', `Filter applied for container ${scanned}`);
        }}
      />

      <ContainerInvoiceModal
        invoice={selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
      />

      {selectedContainerForWa && (
        <WhatsAppPreviewModal
          isOpen={true}
          onClose={() => setSelectedContainerForWa(null)}
          recipientName={selectedContainerForWa.shipperName}
          phoneNumber="+91 98250 11492"
          defaultMessage={`Dear ${selectedContainerForWa.shipperName},\n\nYour container *${selectedContainerForWa.containerNumber}* (${selectedContainerForWa.equipmentType}) at *${selectedContainerForWa.cfsName}* has *${Math.floor(selectedContainerForWa.freeTimeHoursRemaining / 24)}d ${selectedContainerForWa.freeTimeHoursRemaining % 24}h* of free time remaining.\n\nFree time expires: ${selectedContainerForWa.freeTimeEnd}\nDaily demurrage if delayed: ₹${selectedContainerForWa.demurragePerDayINR}/day\n\nTrack live status & documents here:\nhttps://mapsnvocc.in/ccontrol/${selectedContainerForWa.containerNumber}\n\nMAPS Freight Solutions`}
          docTitle={`Container Control Alert: ${selectedContainerForWa.containerNumber}`}
        />
      )}

    </div>
  );
};
