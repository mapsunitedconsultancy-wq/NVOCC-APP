import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/formatters';
import {
  Ship,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Container,
  Clock,
  ArrowUpRight,
  Pin,
  RefreshCw,
  Plus,
  FileText,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Anchor,
  Filter,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Zap,
  Activity,
  Boxes,
  Compass,
  ArrowRight
} from 'lucide-react';
import { StatusPill } from '../components/common/StatusPill';

interface DashboardProps {
  onOpenNewShipment: () => void;
  onOpenNewHbl: () => void;
  onOpenNewInvoice: () => void;
  onOpenNewQuote: () => void;
  onOpenNewDo?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  onOpenNewShipment,
  onOpenNewHbl,
  onOpenNewInvoice,
  onOpenNewQuote,
  onOpenNewDo
}) => {
  const {
    currentUser,
    firmDetails,
    shipments,
    invoices,
    auditLogs,
    setActiveView,
    setViewParam,
    togglePinShipment,
    showToast
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<'all' | 'port' | 'transit' | 'delayed' | 'attention'>('all');
  const [tickerTime, setTickerTime] = useState(60);
  const [aiCardIndex, setAiCardIndex] = useState(0);

  // Auto-refresh countdown simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerTime(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AI Card Auto-rotate every 7 seconds
  useEffect(() => {
    const aiTimer = setInterval(() => {
      setAiCardIndex(prev => (prev + 1) % 4);
    }, 7000);
    return () => clearInterval(aiTimer);
  }, []);

  // Live KPI calculations
  const activeShipmentsCount = shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length;
  const totalRevenue = shipments.reduce((sum, s) => sum + (s.totalRevenueINR || 0), 0);
  const atRiskCount = shipments.filter(s => s.status === 'delayed' || s.status === 'discharged').length;
  const pendingInvoices = invoices.filter(i => i.status === 'Issued' || i.status === 'Overdue');
  const pendingInvoicesTotal = pendingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const totalTeu = shipments.reduce((acc, s) => {
    return acc + s.containers.reduce((cntrAcc, c) => cntrAcc + (c.equipmentType.includes('40') ? 2 : 1), 0);
  }, 0);

  // Filtered live feed
  const filteredFeed = shipments.filter(s => {
    if (feedFilter === 'port') return s.status === 'at_port' || s.status === 'at_cfs' || s.status === 'customs_cleared';
    if (feedFilter === 'transit') return s.status === 'on_vessel' || s.status === 'sailed' || s.status === 'transhipment';
    if (feedFilter === 'delayed') return s.status === 'delayed';
    if (feedFilter === 'attention') return s.status === 'delayed' || s.status === 'discharged' || s.containers.some(c => c.vgmWeight === 0);
    return true;
  });

  const pinnedShipments = shipments.filter(s => s.isPinned);

  // Recalculate dynamic cutoffs on page load based on real-time clock
  const now = new Date();
  const currentHour = now.getHours() + (now.getMinutes() / 60);
  const cyGateInRemaining = Math.max(0.5, Number((18.5 - (currentHour % 12)).toFixed(1)));
  const siFilingRemaining = Math.max(1.2, Number((21.0 - (currentHour % 14)).toFixed(1)));
  const vgmRemaining = Number((28.0 - (currentHour % 10)).toFixed(1));

  // Next 3 Port Cutoffs with Dynamic Countdown Clocks
  const next3Cutoffs = [
    {
      shipmentId: 'MAPS-240345',
      cutoffType: 'CY Gate-In',
      terminal: 'APSEZ CT-2 (Mundra)',
      vessel: 'CMA CGM COLUMBA',
      hours: Math.floor(cyGateInRemaining),
      minutes: Math.round((cyGateInRemaining % 1) * 60),
      deadline: 'Today 14:00',
      critical: true
    },
    {
      shipmentId: 'MAPS-240352',
      cutoffType: 'SI Shipping Line',
      terminal: 'MICT Berth 4 (Mundra)',
      vessel: 'MAERSK SEOUL',
      hours: Math.floor(siFilingRemaining),
      minutes: Math.round((siFilingRemaining % 1) * 60),
      deadline: 'Today 17:30',
      critical: true
    },
    {
      shipmentId: 'MAPS-240350',
      cutoffType: 'VGM e-Gatepass',
      terminal: 'APSEZ CT-3 (Mundra)',
      vessel: 'ONE COMMITMENT',
      hours: Math.floor(vgmRemaining),
      minutes: Math.round((vgmRemaining % 1) * 60),
      deadline: 'Tomorrow 10:00',
      critical: false
    }
  ];

  // Top lanes volume
  const topLanes = [
    { lane: 'Mundra (INMUN) → Hamburg (DEHAM)', teu: 42, revenue: 1425000, trend: '+18%' },
    { lane: 'Mundra (INMUN) → Jebel Ali (AEJEA)', teu: 36, revenue: 890000, trend: '+24%' },
    { lane: 'Mundra (INMUN) → Los Angeles (USLAX)', teu: 28, revenue: 1680000, trend: '+12%' },
    { lane: 'Mundra (INMUN) → Rotterdam (NLRTM)', teu: 22, revenue: 950000, trend: '+8%' },
    { lane: 'Kandla (INIXY) → Durban (ZADUR)', teu: 18, revenue: 640000, trend: '+5%' }
  ];

  // Vessel ETA Tracker: Mundra Arrivals this week
  const mundraArrivalsThisWeek = [
    { vessel: 'MSC JADE', voyage: '437W', line: 'MSC', scac: 'MSCU', berth: 'APSEZ Berth 2', eta: 'Today 18:30', status: 'Berthed', teu: '14,000 TEU', linkedJobs: 'MAPS-240342' },
    { vessel: 'MAERSK SEOUL', voyage: '2408W', line: 'Maersk', scac: 'MAEU', berth: 'MICT Berth 4', eta: 'Tomorrow 06:00', status: 'Approaching', teu: '11,000 TEU', linkedJobs: 'MAPS-240352' },
    { vessel: 'CMA CGM COLUMBA', voyage: '0MSK1W', line: 'CMA CGM', scac: 'CMDU', berth: 'APSEZ CT-3', eta: '17 Oct 14:00', status: 'In Gulf of Kutch', teu: '13,500 TEU', linkedJobs: 'MAPS-240345' },
    { vessel: 'ONE COMMITMENT', voyage: '028E', line: 'ONE', scac: 'ONEY', berth: 'APSEZ Berth 1', eta: '18 Oct 09:30', status: 'En Route', teu: '8,500 TEU', linkedJobs: 'MAPS-240350' },
    { vessel: 'VALPARAISO EXPRESS', voyage: '2411W', line: 'Hapag-Lloyd', scac: 'HLCU', berth: 'MICT Berth 3', eta: '19 Oct 22:00', status: 'Scheduled', teu: '10,500 TEU', linkedJobs: 'MAPS-240355' }
  ];

  // Expiry Alerts for Insurance / LC
  const expiryAlerts = [
    { type: 'Cargo Insurance', title: 'ICICI Lombard Marine Policy #IC-MUN-9921', shipmentId: 'MAPS-240345', expiry: 'in 4 days (20 Oct)', risk: 'Critical', party: 'Kutch Chemicals Industries' },
    { type: 'Letter of Credit (LC)', title: 'LC #LC-MORBI-992 (Deutsche Bank)', shipmentId: 'MAPS-240338', expiry: 'in 6 days (22 Oct)', risk: 'Urgent', party: 'Saurashtra Minerals Pvt Ltd' },
    { type: 'Carrier Contract', title: 'Maersk Service Agreement ME-2401', shipmentId: 'Contract #MAEU-MUN-01', expiry: 'in 7 days (23 Oct)', risk: 'Scheduled', party: 'Maersk Line India' }
  ];

  // Last 24h Activity Summary Card
  const last24hSummary = {
    operationsExecuted: 14,
    cutoffsMetPercent: 100,
    invoicedCollectedINR: 1285000,
    newBookings: 3
  };

  // Rotating AI Insights
  const aiInsights = [
    {
      category: 'Rate Arbitrage & Margin Opportunity',
      badge: 'PROFIT OPTIMIZER',
      title: 'Spot freight drop on Mundra → Hamburg via CMA CGM',
      text: 'Carrier spot rate dropped $120/TEU on CMA CGM Columba (0MSK1W). Booking 4 unassigned FEUs on this vessel captures ₹84,000 in immediate gross margin gain.',
      impact: '+₹84,000 Margin Gain',
      action: 'Open Rate Master',
      view: 'quotes'
    },
    {
      category: 'Detention Risk Prevention',
      badge: 'FREE-TIME RISK',
      title: 'Container MRKU8891234 free time expires in 18h at Hamburg',
      text: 'Consignee Mueller GmbH has not submitted customs release PIN. Auto-dispatch reminder to consignee accounts team to avert ₹8,500/day detention penalty.',
      impact: 'Avert ₹8,500/day Penal D&D',
      action: 'Send Consignee WhatsApp Alert',
      view: 'communication'
    },
    {
      category: 'Port Congestion Intelligence',
      badge: 'ROUTING ADVISORY',
      title: 'Jebel Ali berth congestion warning — 36h wait time',
      text: 'Adani Mundra port advisory reports 36-hour waiting time at DP World Jebel Ali. Recommend routing urgent Dubai reefer shipments via Salalah feeder.',
      impact: 'Save 48h Transit Time',
      action: 'View Alternative Routing',
      view: 'quotes'
    },
    {
      category: 'GST & Compliance Alert',
      badge: 'ITC RECOVERY',
      title: '3 CHA invoices missing Reverse Charge Mechanism (RCM) tag',
      text: 'Unclaimed Input Tax Credit of ₹38,400 identified on local CFS handling vouchers. Reclassify under SAC 9965 before GSTR-3B monthly filing deadline.',
      impact: '₹38,400 ITC Recoverable',
      action: 'Reconcile RCM Invoices',
      view: 'invoicing'
    }
  ];

  // Helper functions for shipment card badges
  const getCarrierBadge = (carrierName: string) => {
    const c = carrierName.toLowerCase();
    if (c.includes('maersk')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 text-[10px] font-bold tracking-tight">
          <span className="text-sky-400">★</span> MAERSK
        </span>
      );
    }
    if (c.includes('msc')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold tracking-tight">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> MSC
        </span>
      );
    }
    if (c.includes('cma')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-bold tracking-tight">
          <span className="text-rose-400 font-black">⚓</span> CMA CGM
        </span>
      );
    }
    if (c.includes('hapag')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700 text-[10px] font-bold tracking-tight">
          <span className="text-orange-400">◆</span> HAPAG
        </span>
      );
    }
    if (c.includes('one')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700 text-[10px] font-bold tracking-tight">
          <span className="text-pink-400">●</span> ONE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#16263F] text-[#A8A299] border border-[#26395A] text-[10px] font-bold">
        {carrierName.split(' ')[0]}
      </span>
    );
  };

  const getShipperHealth = (shipperName: string) => {
    const s = shipperName.toLowerCase();
    if (s.includes('krishna')) return { score: 98, grade: 'A+', text: 'Fast Payer' };
    if (s.includes('saurashtra')) return { score: 86, grade: 'B+', text: 'Payment Due' };
    if (s.includes('western')) return { score: 95, grade: 'A', text: 'Reefer Trusted' };
    if (s.includes('kutch')) return { score: 93, grade: 'A', text: 'HAZCHEM Verified' };
    return { score: 91, grade: 'A', text: 'Good Standing' };
  };

  const getCarrierReliability = (carrierName: string) => {
    const c = carrierName.toLowerCase();
    if (c.includes('maersk')) return '94% On-Time';
    if (c.includes('msc')) return '89% On-Time';
    if (c.includes('cma')) return '92% On-Time';
    if (c.includes('one')) return '93% On-Time';
    if (c.includes('hapag')) return '95% On-Time';
    return '90% On-Time';
  };

  const getDocCompleteness = (shipmentId: string) => {
    const lastChar = shipmentId.charCodeAt(shipmentId.length - 1);
    const count = (lastChar % 2 === 0) ? 5 : 4;
    return { count, total: 5, pct: (count / 5) * 100 };
  };

  const getProfitabilityBadge = (marginINR: number, marginPercent: number) => {
    if (marginPercent >= 18) {
      return {
        label: `₹${(marginINR / 1000).toFixed(0)}k (${marginPercent}%)`,
        badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
        dotClass: 'bg-emerald-400'
      };
    }
    if (marginPercent >= 10) {
      return {
        label: `₹${(marginINR / 1000).toFixed(0)}k (${marginPercent}%)`,
        badgeClass: 'bg-amber-950 text-amber-300 border-amber-700/60',
        dotClass: 'bg-amber-400'
      };
    }
    return {
      label: `₹${(marginINR / 1000).toFixed(0)}k (${marginPercent}%)`,
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-700/60',
      dotClass: 'bg-rose-400'
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6]">
              Operational Command Center
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Mundra Sync ({tickerTime}s)
            </span>
          </div>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Good afternoon, <strong className="text-[#F4EFE6]">{currentUser.name}</strong> • {firmDetails.registeredAddress.split(',')[3]}, Gujarat • Thursday, 15 October 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveView('shipments'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
          >
            <Ship className="w-3.5 h-3.5 text-[#E88B2A]" />
            All Shipments ({shipments.length})
          </button>
          <button
            onClick={onOpenNewShipment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Booking
          </button>
        </div>
      </div>

      {/* 2. Today's Priority Strip (Item 2) */}
      <div className="bg-[#0D1B2E] border border-amber-500/30 rounded-xl p-2.5 sm:px-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-gradient-to-r from-amber-950/20 via-[#0D1B2E] to-sky-950/20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-[#E88B2A] font-bold text-[11px] uppercase tracking-wider shrink-0 border border-amber-500/40">
            <AlertCircle className="w-3.5 h-3.5" />
            Today's Priority
          </div>
          <span className="text-[11px] text-[#A8A299] hidden sm:inline">• Mundra port queue & compliance checks</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px]">
          {/* Priority 1: Cutoffs */}
          <div 
            onClick={() => { setActiveView('shipments'); setViewParam('MAPS-240345'); }}
            className="flex items-center gap-1.5 bg-[#16263F] hover:bg-[#1E3558] px-2.5 py-1 rounded-lg border border-[#26395A] cursor-pointer transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-[#F4EFE6] font-semibold">Port Cutoff:</span>
            <span className="text-rose-300 font-mono font-bold">MAPS-240345 (CY 14:00)</span>
          </div>

          {/* Priority 2: Pending LEO */}
          <div 
            onClick={() => { setActiveView('shipments'); setViewParam('filter:active'); }}
            className="flex items-center gap-1.5 bg-[#16263F] hover:bg-[#1E3558] px-2.5 py-1 rounded-lg border border-[#26395A] cursor-pointer transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[#F4EFE6] font-semibold">3 Customs LEO Pending:</span>
            <span className="text-sky-300 font-mono">Mundra Berth 2</span>
          </div>

          {/* Priority 3: Delayed Vessel */}
          <div 
            onClick={() => { setActiveView('shipments'); setViewParam('filter:delayed'); }}
            className="flex items-center gap-1.5 bg-[#16263F] hover:bg-[#1E3558] px-2.5 py-1 rounded-lg border border-[#26395A] cursor-pointer transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[#F4EFE6] font-semibold">Vessel Delay:</span>
            <span className="text-amber-300 font-mono font-bold">MAERSK SEOUL (+3d)</span>
          </div>
        </div>
      </div>

      {/* 3. 6 Live KPI Cards with Container Control (Sub-Module 10 Integration) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => { setActiveView('shipments'); setViewParam('filter:active'); }}
          className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 hover:border-[#E88B2A]/60 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#A8A299]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Shipments</span>
            <Ship className="w-3.5 h-3.5 text-[#E88B2A] group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">{activeShipmentsCount}</span>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
              +14% 7d
            </span>
          </div>
          <p className="text-[9.5px] text-[#6E6A64] mt-1">Active ocean jobs</p>
        </div>

        {/* KPI 2: Container Control Module 16 */}
        <div
          onClick={() => setActiveView('container_control')}
          className="bg-[#0F1D33] border border-teal-800/60 rounded-xl p-3 hover:border-teal-400 transition-all cursor-pointer group shadow-sm bg-gradient-to-br from-[#0F1D33] to-teal-950/25"
        >
          <div className="flex items-center justify-between text-teal-300">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-teal-400" />
              Container Control
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded font-extrabold uppercase bg-teal-950 text-teal-300 border border-teal-800">
              LIVE
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">30 Active</span>
            <span className="text-[10px] font-bold text-rose-400">5 Critical</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] font-mono">
            <span className="text-amber-400 font-semibold">₹2,45,000 D&D</span>
            <span className="text-emerald-400 font-semibold">₹1,15,000 CFS</span>
          </div>
          <p className="text-[9.5px] text-teal-300/70 mt-0.5">Click for Fleet & CFS</p>
        </div>

        {/* KPI 3: At-Risk Containers with ₹ Value at Risk (Item 3) */}
        <div
          onClick={() => { setActiveView('container_control'); }}
          className="bg-[#0F1D33] border border-rose-800/50 rounded-xl p-3 hover:border-rose-600 transition-all cursor-pointer group shadow-sm bg-gradient-to-br from-[#0F1D33] to-rose-950/20"
        >
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-[10px] font-bold uppercase tracking-wider">At-Risk Containers</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-200">{atRiskCount}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-rose-900/60 text-rose-300 border border-rose-700/50">
              D&D Risk
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-rose-400">₹4,25,000 at risk</span>
            <span className="text-[9px] text-[#A8A299]">Penal</span>
          </div>
          <p className="text-[9.5px] text-rose-300/70 mt-0.5">Click for Critical risk</p>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => { setActiveView('reports'); setViewParam('tab:revenue'); }}
          className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 hover:border-[#E88B2A]/60 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#A8A299]">
            <span className="text-[10px] font-bold uppercase tracking-wider">October Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">
              {formatINR(totalRevenue)}
            </span>
          </div>
          <div className="mt-1 w-full bg-[#16263F] h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[78%] rounded-full"></div>
          </div>
          <p className="text-[9.5px] text-[#6E6A64] mt-0.5">78% of monthly target</p>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => { setActiveView('invoicing'); setViewParam('filter:pending'); }}
          className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 hover:border-[#E88B2A]/60 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#A8A299]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Invoices</span>
            <Receipt className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">{pendingInvoices.length}</span>
            <span className="text-[10px] font-semibold text-amber-400">
              {formatINR(pendingInvoicesTotal)}
            </span>
          </div>
          <p className="text-[9.5px] text-[#6E6A64] mt-1">5 overdue &gt; 30 days</p>
        </div>

        {/* KPI 6 */}
        <div
          onClick={() => setActiveView('reports')}
          className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 hover:border-[#E88B2A]/60 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#A8A299]">
            <span className="text-[10px] font-bold uppercase tracking-wider">TEU This Month</span>
            <Container className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#F4EFE6]">{totalTeu}</span>
            <span className="text-[10px] font-semibold text-sky-400 flex items-center">
              +22% MoM
            </span>
          </div>
          <p className="text-[9.5px] text-[#6E6A64] mt-1">42 FCL / 14 LCL</p>
        </div>
      </div>

      {/* 4. Middle Section: Live Shipment Feed with Enhanced Cards & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shipment Feed */}
        <div className="lg:col-span-2 bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1C2D4A]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-[#E88B2A]" />
                Active Shipments Live Stream
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16263F] text-[#A8A299] font-mono">
                {filteredFeed.length} showing
              </span>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {(['all', 'port', 'transit', 'delayed', 'attention'] as const).map(chip => (
                <button
                  key={chip}
                  onClick={() => setFeedFilter(chip)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize whitespace-nowrap transition-colors ${
                    feedFilter === chip
                      ? 'bg-[#E88B2A] text-[#0A1628] font-bold'
                      : 'bg-[#16263F] text-[#A8A299] hover:text-[#F4EFE6]'
                  }`}
                >
                  {chip === 'all' ? 'All Live' : chip === 'port' ? 'At Port' : chip === 'transit' ? 'In Transit' : chip === 'delayed' ? 'Delayed' : 'Needs Attention'}
                </button>
              ))}
            </div>
          </div>

          {/* Shipment Cards Grid (Items 4, 5, 8, 9, 13) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 flex-1 overflow-y-auto max-h-[520px] pr-1">
            {filteredFeed.map((shipment, index) => {
              const carrierBadge = getCarrierBadge(shipment.carrierName);
              const shipperHealth = getShipperHealth(shipment.shipperName);
              const carrierRel = getCarrierReliability(shipment.carrierName);
              const docComp = getDocCompleteness(shipment.id);
              const profitBadge = getProfitabilityBadge(shipment.marginINR, shipment.marginPercent);

              // Shipment age simulator (Day 4/18, etc.)
              const ageDay = 3 + (index % 12);
              const totalDays = 18;
              const progressPct = Math.min(100, Math.round((ageDay / totalDays) * 100));

              return (
                <div
                  key={shipment.id}
                  onClick={() => {
                    setActiveView('shipments');
                    setViewParam(shipment.id);
                  }}
                  className="bg-[#16263F]/70 border border-[#1C2D4A] hover:border-[#E88B2A]/50 rounded-lg p-3 cursor-pointer transition-all hover:bg-[#16263F] group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: ID, Status, Carrier Logo (Item 4) & Pin */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#E88B2A] group-hover:underline">
                            {shipment.id}
                          </span>
                          <StatusPill status={shipment.status} size="xs" pulse={shipment.status === 'on_vessel' || shipment.status === 'delayed'} />
                          {/* Item 4: Carrier Logo Badge */}
                          {carrierBadge}
                        </div>

                        <h3 className="text-xs font-semibold text-[#F4EFE6] mt-1 line-clamp-1">
                          {shipment.shipperName}
                        </h3>
                        <p className="text-[11px] text-[#A8A299] line-clamp-1">
                          Consignee: {shipment.consigneeName} ({shipment.consigneeCountry})
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinShipment(shipment.id);
                        }}
                        className={`p-1 rounded hover:bg-[#1D3251] transition-colors ${
                          shipment.isPinned ? 'text-[#E88B2A]' : 'text-[#6E6A64] hover:text-[#A8A299]'
                        }`}
                        title={shipment.isPinned ? 'Unpin' : 'Pin to Dashboard'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Route & Vessel */}
                    <div className="mt-2.5 p-2 bg-[#0F1D33] rounded border border-[#1C2D4A] text-[11px]">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-[#F4EFE6]">{shipment.polName.split(' ')[0]}</span>
                        <span className="text-[#E88B2A] font-mono">→</span>
                        <span className="text-[#F4EFE6]">{shipment.podName.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#A8A299] mt-0.5">
                        <span>{shipment.vesselName} ({shipment.voyageNumber})</span>
                        <span className="font-mono">ETA: {shipment.eta.split(' ')[0]} {shipment.eta.split(' ')[1]}</span>
                      </div>
                    </div>

                    {/* Item 5: Shipment Age & Progress Bar */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#A8A299]">
                        <span>Journey Progress: <strong className="text-[#F4EFE6]">Day {ageDay}</strong> / {totalDays}</span>
                        <span className="font-mono text-emerald-400 font-bold">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-[#0F1D33] h-1.5 rounded-full overflow-hidden border border-[#26395A]">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className={`h-full rounded-full transition-all ${
                            shipment.status === 'delayed' ? 'bg-amber-500' : 'bg-gradient-to-r from-[#E88B2A] to-emerald-400'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Item 8 & 9 & 13: Scores, Margin & Doc Completeness */}
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[10px]">
                      {/* Profitability Indicator (Item 8) */}
                      <div className={`p-1.5 rounded border ${profitBadge.badgeClass} flex flex-col justify-between`}>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">Gross Margin</span>
                        <span className="font-mono font-bold flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${profitBadge.dotClass}`}></span>
                          {profitBadge.label}
                        </span>
                      </div>

                      {/* Shipper & Carrier Health Score (Item 9) */}
                      <div className="p-1.5 rounded bg-[#0F1D33] border border-[#26395A] flex flex-col justify-between">
                        <span className="text-[9px] uppercase tracking-wider text-[#A8A299] font-semibold">Reliability</span>
                        <span className="text-[#F4EFE6] font-bold font-mono">
                          {carrierRel}
                        </span>
                      </div>

                      {/* Document Completeness % (Item 13) */}
                      <div className="p-1.5 rounded bg-[#0F1D33] border border-[#26395A] flex flex-col justify-between">
                        <span className="text-[9px] uppercase tracking-wider text-[#A8A299] font-semibold">Vault Docs</span>
                        <span className="font-mono text-sky-400 font-bold">
                          {docComp.count}/{docComp.total} ({docComp.pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Container & Operator */}
                  <div className="mt-2.5 pt-2 border-t border-[#1C2D4A] flex items-center justify-between text-[10px] text-[#6E6A64]">
                    <span className="font-mono text-[#A8A299]">
                      {shipment.containers[0]?.containerNumber || 'Container'} • {shipment.containers[0]?.equipmentType || "40'HC"}
                    </span>
                    <span className="text-[#A8A299] flex items-center gap-1 font-sans">
                      Shipper Score: <strong className="text-emerald-400">{shipperHealth.score} ({shipperHealth.grade})</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Actions, Expanded Port Cutoffs (Item 19) & Last 24h Summary (Item 15) */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider mb-2.5">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenNewShipment}
                className="p-2.5 bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] rounded-lg text-left transition-colors group"
              >
                <Plus className="w-4 h-4 text-[#E88B2A] mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-[#F4EFE6] leading-tight">+ Shipment</span>
                <span className="text-[10px] text-[#6E6A64]">Booking wizard</span>
              </button>

              <button
                onClick={onOpenNewHbl}
                className="p-2.5 bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] rounded-lg text-left transition-colors group"
              >
                <FileText className="w-4 h-4 text-[#E88B2A] mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-[#F4EFE6] leading-tight">+ New HBL</span>
                <span className="text-[10px] text-[#6E6A64]">3-Original draft</span>
              </button>

              <button
                onClick={onOpenNewQuote}
                className="p-2.5 bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] rounded-lg text-left transition-colors group"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-[#F4EFE6] leading-tight">+ New Quote</span>
                <span className="text-[10px] text-[#6E6A64]">Rate master sync</span>
              </button>

              <button
                onClick={onOpenNewInvoice}
                className="p-2.5 bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] rounded-lg text-left transition-colors group"
              >
                <DollarSign className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-[#F4EFE6] leading-tight">+ Invoice</span>
                <span className="text-[10px] text-[#6E6A64]">GST compliant</span>
              </button>
            </div>
          </div>

          {/* Item 19: Expanded Port Cutoffs Widget (Next 3 with Real Countdown Clocks) */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A] mb-2.5">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E88B2A]" />
                Port Cutoffs Countdown (Next 3)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Live Clock</span>
            </div>

            <div className="space-y-2.5">
              {next3Cutoffs.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveView('shipments');
                    setViewParam(item.shipmentId);
                  }}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    item.critical
                      ? 'bg-rose-950/30 border-rose-800/40 hover:bg-rose-900/20'
                      : 'bg-[#16263F] border-[#1C2D4A] hover:bg-[#1D3251]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#E88B2A]">{item.shipmentId}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.critical
                          ? 'bg-rose-900 text-rose-200 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      ⏱ {String(item.hours).padStart(2, '0')}h {String(item.minutes).padStart(2, '0')}m Left
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#F4EFE6] mt-1">
                    {item.cutoffType}: {item.deadline}
                  </div>
                  <div className="text-[10px] text-[#A8A299] mt-0.5 flex items-center justify-between">
                    <span>Vessel: {item.vessel}</span>
                    <span className="font-mono text-[#6E6A64]">{item.terminal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item 15: "Last 24h Activity" Summary Card */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 shadow-sm bg-gradient-to-br from-[#0F1D33] to-[#12243D]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A] mb-2.5">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Last 24h Operations Summary
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">
                Active Day
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#16263F] p-2 rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] block">Ops Executed</span>
                <span className="font-mono font-bold text-base text-[#F4EFE6]">{last24hSummary.operationsExecuted} Actions</span>
              </div>
              <div className="bg-[#16263F] p-2 rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] block">Cutoffs Met</span>
                <span className="font-mono font-bold text-base text-emerald-400">{last24hSummary.cutoffsMetPercent}% On-Time</span>
              </div>
              <div className="bg-[#16263F] p-2 rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] block">Invoiced & Billed</span>
                <span className="font-mono font-bold text-base text-[#E88B2A]">{formatINR(last24hSummary.invoicedCollectedINR)}</span>
              </div>
              <div className="bg-[#16263F] p-2 rounded-lg border border-[#26395A]">
                <span className="text-[10px] text-[#A8A299] block">New Bookings</span>
                <span className="font-mono font-bold text-base text-sky-400">+{last24hSummary.newBookings} Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Middle Grid: Vessel ETA Tracker (Item 7) & Insurance/LC Expiry Alerts (Item 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item 7: Vessel ETA Tracker — Mundra Arrivals This Week (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A]">
            <div>
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-sky-400" />
                Vessel ETA Tracker — Mundra Arrivals This Week
              </h3>
              <p className="text-[10px] text-[#A8A299]">
                Real-time AIS vessel telemetry and APSEZ / MICT terminal berth allocations
              </p>
            </div>
            <span className="text-[10px] text-sky-300 font-mono bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
              5 Vessels Scheduled
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#16263F] text-[#A8A299] font-semibold border-b border-[#26395A]">
                <tr>
                  <th className="p-2.5">Vessel & Voyage</th>
                  <th className="p-2.5">Shipping Line</th>
                  <th className="p-2.5">Berth / Terminal</th>
                  <th className="p-2.5">ETA Mundra</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Linked Job</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] font-mono">
                {mundraArrivalsThisWeek.map((v, i) => (
                  <tr key={i} className="hover:bg-[#16263F]/50 transition-colors">
                    <td className="p-2.5 font-bold text-[#F4EFE6]">
                      {v.vessel} <span className="text-[#A8A299] font-normal">({v.voyage})</span>
                      <span className="text-[10px] text-[#6E6A64] block font-sans">{v.teu}</span>
                    </td>
                    <td className="p-2.5 font-sans">
                      {getCarrierBadge(v.line)}
                    </td>
                    <td className="p-2.5 font-sans text-[#F4EFE6]">
                      {v.berth}
                    </td>
                    <td className="p-2.5 text-[#E88B2A] font-semibold">
                      {v.eta}
                    </td>
                    <td className="p-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'Berthed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : v.status === 'Approaching'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-[#16263F] text-[#A8A299]'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => {
                          setActiveView('shipments');
                          setViewParam(v.linkedJobs);
                        }}
                        className="font-bold text-[#E88B2A] hover:underline"
                      >
                        {v.linkedJobs}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item 14: Expiry Alerts for Insurance / LC on Dashboard (1 Col) */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A] mb-3">
              <span className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Insurance & LC Expiry Alerts
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">Action Required</span>
            </div>

            <div className="space-y-3">
              {expiryAlerts.map((alert, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#16263F] border border-[#26395A] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                      {alert.type}
                    </span>
                    <span className="font-mono text-rose-400 font-bold text-[10px]">
                      Expires {alert.expiry}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[#F4EFE6] text-[11px]">{alert.title}</h4>
                  <p className="text-[10px] text-[#A8A299] line-clamp-1">{alert.party}</p>
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-[#E88B2A]">{alert.shipmentId}</span>
                    <button
                      onClick={() => showToast('info', 'Renewal Queued', `Extension notice prepared for ${alert.party}`)}
                      className="text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      Renew / Extend &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1C2D4A] text-center text-[10px] text-[#6E6A64]">
            Automated compliance audits synchronized with ICEGATE & banking desk
          </div>
        </div>
      </div>

      {/* 6. Visual Analytics Charts Grid (4 Live Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chart 1: Shipments by Status Donut */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="pb-2 border-b border-[#1C2D4A]">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Shipments by Status
            </h3>
            <p className="text-[10px] text-[#A8A299]">Live distribution of 25 active jobs</p>
          </div>

          <div className="my-4 flex items-center justify-center gap-4">
            {/* Visual SVG Donut */}
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#16263F" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E88B2A" strokeWidth="4" strokeDasharray="32 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#4FBDA3" strokeWidth="4" strokeDasharray="24 100" strokeDashoffset="-32" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#5BA3D4" strokeWidth="4" strokeDasharray="24 100" strokeDashoffset="-56" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E85A4F" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-80" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold font-mono text-[#F4EFE6]">25</span>
                <span className="text-[8px] uppercase tracking-wider text-[#A8A299]">Total Jobs</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#E88B2A]"></span><span>On Vessel (32%)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#4FBDA3]"></span><span>Delivered (24%)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#5BA3D4]"></span><span>At Port/CFS (24%)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#E85A4F]"></span><span>Delayed (20%)</span></div>
            </div>
          </div>
        </div>

        {/* Chart 2: Monthly Revenue Trend (12 Months) */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="pb-2 border-b border-[#1C2D4A]">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Revenue Trend (INR)
            </h3>
            <p className="text-[10px] text-[#A8A299]">Past 6 months vs ₹60L target</p>
          </div>

          <div className="my-3 flex items-end justify-between h-28 gap-1.5 px-2">
            {[
              { m: 'May', h: '45%', v: '32L' },
              { m: 'Jun', h: '60%', v: '41L' },
              { m: 'Jul', h: '70%', v: '48L' },
              { m: 'Aug', h: '75%', v: '52L' },
              { m: 'Sep', h: '88%', v: '59L' },
              { m: 'Oct', h: '82%', v: '55L', active: true }
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] font-mono text-[#A8A299] opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.v}
                </span>
                <div className="w-full bg-[#16263F] rounded-t overflow-hidden h-20 flex items-end">
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-t transition-all ${
                      bar.active ? 'bg-[#E88B2A]' : 'bg-[#26395A] group-hover:bg-[#E88B2A]/60'
                    }`}
                  ></div>
                </div>
                <span className="text-[9px] font-medium text-[#6E6A64]">{bar.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Top 5 Shippers by Revenue */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="pb-2 border-b border-[#1C2D4A]">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Top Shippers by Volume
            </h3>
            <p className="text-[10px] text-[#A8A299]">Morbi & Kutch exporters</p>
          </div>

          <div className="space-y-2 mt-2">
            {[
              { name: 'Krishna Ceramics', val: '₹14.2L', pct: '85%' },
              { name: 'Saurashtra Minerals', val: '₹12.5L', pct: '74%' },
              { name: 'Western Marine', val: '₹9.4L', pct: '56%' },
              { name: 'Kutch Chemicals', val: '₹7.8L', pct: '48%' },
              { name: 'Pragati Ceramics', val: '₹6.5L', pct: '40%' }
            ].map((s, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#F4EFE6] font-medium truncate">{s.name}</span>
                  <span className="font-mono text-[#E88B2A] font-semibold">{s.val}</span>
                </div>
                <div className="w-full bg-[#16263F] h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: s.pct }} className="bg-[#E88B2A] h-full rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Top Trade Lanes */}
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="pb-2 border-b border-[#1C2D4A]">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Top Trade Lanes (TEU)
            </h3>
            <p className="text-[10px] text-[#A8A299]">Mundra container throughput</p>
          </div>

          <div className="space-y-2 mt-2 text-xs">
            {topLanes.slice(0, 4).map((l, i) => (
              <div key={i} className="p-2 rounded bg-[#16263F] border border-[#1C2D4A] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#F4EFE6] text-[11px] truncate max-w-[140px]">{l.lane.replace('Mundra (INMUN) → ', '')}</p>
                  <p className="text-[10px] text-[#A8A299]">{l.teu} TEU this month</p>
                </div>
                <span className="font-mono text-emerald-400 font-bold text-[10px]">{l.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Bottom Section: Rotating AI Insights Cards (Item 20) */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-lg bg-gradient-to-r from-[#0F1D33] via-[#132742] to-[#0F1D33] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E88B2A]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A] mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#E88B2A]/20 text-[#E88B2A]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                MAPS Operational Intelligence
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E88B2A] text-[#0A1628] font-black">
                  ACTIVE
                </span>
              </h3>
              <p className="text-[11px] text-[#A8A299]">
                Live predictive suggestions derived from Indian port schedules, carrier tariffs, and customs telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#A8A299] font-mono hidden sm:inline">
              Insight {aiCardIndex + 1} of {aiInsights.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAiCardIndex(prev => (prev === 0 ? aiInsights.length - 1 : prev - 1))}
                className="p-1 rounded-md bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
                title="Previous insight"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAiCardIndex(prev => (prev + 1) % aiInsights.length)}
                className="p-1 rounded-md bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
                title="Next insight"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active AI Insight Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center animate-fade-in">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                {aiInsights[aiCardIndex].badge}
              </span>
              <span className="text-xs font-semibold text-[#A8A299]">
                {aiInsights[aiCardIndex].category}
              </span>
            </div>

            <h4 className="text-base font-bold text-[#F4EFE6]">
              {aiInsights[aiCardIndex].title}
            </h4>

            <p className="text-xs text-[#A8A299] leading-relaxed">
              {aiInsights[aiCardIndex].text}
            </p>
          </div>

          <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3.5 flex flex-col justify-between gap-3 text-center">
            <div>
              <span className="text-[10px] text-[#A8A299] uppercase tracking-wider block font-semibold">
                Projected Impact
              </span>
              <span className="font-mono text-base font-black text-emerald-400 block mt-0.5">
                {aiInsights[aiCardIndex].impact}
              </span>
            </div>

            <button
              onClick={() => {
                setActiveView(aiInsights[aiCardIndex].view);
                showToast('success', 'Insight Action Triggered', aiInsights[aiCardIndex].title);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{aiInsights[aiCardIndex].action}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {aiInsights.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setAiCardIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                aiCardIndex === idx ? 'w-6 bg-[#E88B2A]' : 'w-2 bg-[#26395A] hover:bg-[#A8A299]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
