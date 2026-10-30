import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalesQuotation } from '../../types/v4Types';
import { Shipment } from '../../types';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ArrowRight,
  Send,
  MessageSquare,
  BarChart2,
  Calendar,
  Layers,
  ChevronRight,
  Ship
} from 'lucide-react';

const STAGES: Array<SalesQuotation['stage']> = [
  'RFQ Received',
  'Quote Drafted',
  'Sent to Customer',
  'Negotiating',
  'Won',
  'Lost'
];

export const QuotationPipelinePage: React.FC = () => {
  const { salesQuotations, addSalesQuotation, updateSalesQuotation, addShipment, setActiveView, setViewParam, carrierRates, parties, showToast, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'funnel' | 'analytics' | 'intake'>('funnel');
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<SalesQuotation | null>(null);

  // Convert Won Quote to Live Ocean Booking
  const handleConvertToBooking = (quote: SalesQuotation) => {
    const nextSeq = Math.floor(1000 + Math.random() * 9000);
    const newShipmentId = `MAPS-24${nextSeq}`;
    const newShipment: Shipment = {
      id: newShipmentId,
      referenceNo: quote.quoteNumber,
      bookingNo: `BKG-Q-${nextSeq}`,
      mblNo: `MSKU${nextSeq}00`,
      hblNo: `MAPS-HBL-24${nextSeq}-01`,
      jobType: 'Export',
      mode: 'Ocean',
      serviceType: 'FCL',
      incoterm: 'CIF',
      status: 'booked',
      statusLabel: 'Booked from Won Quote',
      createdDate: '15 Oct 2026',
      assignedTo: quote.salesPerson,
      shipperId: 'p-krishna',
      shipperName: quote.customerName,
      shipperAddress: 'Plot 48, GIDC Phase II, Morbi, Gujarat 363641',
      shipperGstin: '24AABCK1234D1Z5',
      consigneeId: 'p-consignee',
      consigneeName: 'Global Importers AG',
      consigneeAddress: 'Port Free Zone, ' + quote.pod,
      consigneeCountry: 'Destination Country',
      agentId: 'agent-1',
      agentName: 'Hamburg Shipping Services GmbH',
      placeOfReceipt: 'Morbi, Gujarat',
      polCode: quote.pol.includes('INMUN') ? 'INMUN' : 'INIXY',
      polName: quote.pol,
      podCode: quote.pod.slice(0, 5),
      podName: quote.pod,
      placeOfDelivery: quote.pod,
      carrierId: 'c-msc',
      carrierName: quote.carrierOptions?.[0]?.carrier || 'MSC',
      carrierScac: 'MSCU',
      vesselName: 'MSC JADE',
      voyageNumber: '437W',
      etd: '24 Oct 2026',
      eta: '25 Nov 2026',
      transitDays: 32,
      cyCutoff: '22 Oct 2026 18:00',
      siCutoff: '21 Oct 2026 12:00',
      vgmCutoff: '22 Oct 2026 10:00',
      docCutoff: '21 Oct 2026 17:00',
      cargoDescription: quote.commodity,
      hsCode: '69072100',
      packagesCount: quote.containerCount * 450,
      packageType: 'Bags on Pallets',
      grossWeight: quote.containerCount * 24000,
      netWeight: quote.containerCount * 23500,
      volumeCbm: quote.containerCount * 58.0,
      marksAndNumbers: `MAPS / ${quote.pod.slice(0, 5)} / ${newShipmentId}`,
      isHazardous: false,
      isTempControlled: quote.containerType.includes('RF'),
      containers: [
        {
          id: 'cntr-' + Date.now(),
          containerNumber: 'MSKU' + Math.floor(2000000 + Math.random() * 8000000),
          equipmentType: quote.containerType.includes('40') ? "40'HC" : "20'GP",
          sealNumber: 'KL' + Math.floor(100000 + Math.random() * 900000),
          tareWeight: 3880,
          cargoWeight: 24000,
          grossWeight: 27880,
          vgmWeight: 27880,
          vgmMethod: 'SM1',
          vgmCertifier: 'Port Weighbridge',
          vgmDate: '15 Oct 2026',
          currentLocation: 'Morbi CFS Depot',
          status: 'Booking Created',
          freeTimeDays: 14,
          freeTimeExpiry: '08 Dec 2026',
          demurragePerDay: 4800
        }
      ],
      charges: [
        {
          id: 'chg-1',
          chargeCode: 'BAS',
          chargeName: 'Ocean Freight (Won Quote Rate)',
          category: 'Ocean Freight',
          currency: 'USD',
          amount: quote.offeredRateUSD * quote.containerCount,
          rate: 84.0,
          amountInINR: Math.round(quote.offeredRateUSD * quote.containerCount * 84.0),
          billedTo: 'shipper',
          paymentTerm: 'Prepaid',
          status: 'pending'
        }
      ],
      totalRevenueINR: Math.round(quote.offeredRateUSD * quote.containerCount * 84.0) + 15500,
      totalCostINR: Math.round(quote.offeredRateUSD * quote.containerCount * 84.0 * 0.85),
      marginINR: quote.marginINR || 35000,
      marginPercent: 18.0,
      events: [
        {
          id: 'ev-1',
          timestamp: '15 Oct 2026 14:00',
          title: 'Booking Converted from Won Quote',
          location: 'Gandhidham HQ Sales Desk',
          description: `Successfully converted won sales quote ${quote.quoteNumber} for ${quote.customerName} into live ocean job.`,
          category: 'booking',
          source: 'MANUAL',
          user: quote.salesPerson
        }
      ]
    };

    addShipment(newShipment);
    showToast('success', 'Quote Converted to Live Booking!', `Created ocean shipment ${newShipmentId} with contracted freight rates.`);
    setActiveView('shipments');
    setViewParam(newShipmentId);
  };

  // New RFQ State
  const [customerName, setCustomerName] = useState('Krishna Ceramics');
  const [pol, setPol] = useState('Mundra (INMUN)');
  const [pod, setPod] = useState('Jebel Ali (AEJEA)');
  const [containerType, setContainerType] = useState('20GP');
  const [containerCount, setContainerCount] = useState(5);
  const [commodity, setCommodity] = useState('Ceramic Vitrified Tiles');
  const [targetRateUSD, setTargetRateUSD] = useState('750');
  const [offeredRateUSD, setOfferedRateUSD] = useState('820');
  const [marginINR, setMarginINR] = useState('35000');
  const [requiredByDate, setRequiredByDate] = useState('25-10-2026');
  const [salesPerson, setSalesPerson] = useState<'Rahul Sharma' | 'Utsav Joshi' | 'Seema Patel' | 'Aman Dana'>('Rahul Sharma');

  // Filtered quotes
  const filteredQuotes = salesQuotations.filter(q => {
    const matchSales = filterSalesPerson === 'ALL' || q.salesPerson === filterSalesPerson;
    const matchQuery = q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.pod.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSales && matchQuery;
  });

  // Calculate Pipeline Analytics
  const totalQuotes = salesQuotations.length;
  const wonQuotes = salesQuotations.filter(q => q.stage === 'Won').length;
  const lostQuotes = salesQuotations.filter(q => q.stage === 'Lost').length;
  const winRate = totalQuotes > 0 ? Math.round((wonQuotes / (wonQuotes + lostQuotes || 1)) * 100) : 0;
  const totalPipelineValueUSD = salesQuotations
    .filter(q => q.stage !== 'Lost' && q.stage !== 'Expired')
    .reduce((acc, q) => acc + (q.offeredRateUSD * q.containerCount), 0);

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    const newQ: SalesQuotation = {
      id: 'quote-pipe-' + Date.now(),
      quoteNumber: `Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: 'p-' + Date.now(),
      customerName,
      pol,
      pod,
      containerType,
      containerCount: Number(containerCount),
      commodity,
      targetRateUSD: targetRateUSD ? Number(targetRateUSD) : undefined,
      offeredRateUSD: Number(offeredRateUSD) || 800,
      marginINR: Number(marginINR) || 25000,
      validTill: '15-11-2026',
      requiredByDate,
      salesPerson,
      stage: 'RFQ Received',
      ageDays: 0,
      createdAt: 'Today',
      paymentTerms: 'Credit 30 Days',
      carrierOptions: [
        { carrier: 'Unifeeder', transitDays: 4, baseFreightUSD: 740, surchargesUSD: 40, totalUSD: 780, validTill: '31-10-2026', frequency: '2 sailings/week' },
        { carrier: 'DP World', transitDays: 5, baseFreightUSD: 760, surchargesUSD: 30, totalUSD: 790, validTill: '31-10-2026', frequency: 'Weekly' }
      ]
    };
    addSalesQuotation(newQ);
    setActiveTab('funnel');
  };

  const handleMoveStage = (id: string, newStage: SalesQuotation['stage']) => {
    updateSalesQuotation(id, { stage: newStage });
    showToast('info', 'Stage Updated', `Moved to ${newStage}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Quotation Pipeline &amp; Sales CRM
              </h1>
              <p className="text-xs text-[#A8A299]">
                Live Sales Kanban Funnel &bull; Carrier Rate Multi-Option Builder &bull; Rahul Sharma Sales Performance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
            <button
              onClick={() => setActiveTab('funnel')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'funnel' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Kanban Funnel
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'analytics' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Pipeline Analytics
            </button>
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'intake' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              + Create RFQ
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Active Pipeline</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">
            ${totalPipelineValueUSD.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Total active deal volume</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Win Rate (30 Days)</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">{winRate}%</span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">{wonQuotes} Won / {lostQuotes} Lost deals</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Avg Quote-to-Close</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">4.2 Days</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Faster than 7d industry average</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Lead Sales Rep</span>
            <span className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400">
              <User className="w-4 h-4" />
            </span>
          </div>
          <span className="text-base font-bold text-[#F4EFE6] truncate block">Rahul Sharma</span>
          <span className="text-[11px] text-purple-300/80 block mt-1">₹4.8L gross margin booked</span>
        </div>
      </div>

      {/* Screen 1: Kanban Funnel */}
      {activeTab === 'funnel' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A8A299] font-semibold">Filter Rep:</span>
              <select
                value={filterSalesPerson}
                onChange={e => setFilterSalesPerson(e.target.value)}
                className="bg-[#16263F] border border-[#26395A] text-xs text-[#F4EFE6] rounded-lg px-2.5 py-1"
              >
                <option value="ALL">All Sales Persons</option>
                <option value="Rahul Sharma">Rahul Sharma (Sales Lead)</option>
                <option value="Utsav Joshi">Utsav Joshi (Operations)</option>
                <option value="Aman Dana">Aman Dana (Director)</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search quotes, customer, POD..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageQuotes = filteredQuotes.filter(q => q.stage === stage);
              return (
                <div key={stage} className="bg-[#0F1D33] border border-[#26395A] rounded-xl flex flex-col min-w-[210px]">
                  <div className="p-3 border-b border-[#1C2D4A] flex justify-between items-center bg-[#16263F]/50">
                    <h3 className="text-xs font-bold text-[#F4EFE6] tracking-tight">{stage}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#0A1628] text-amber-300 border border-[#26395A]">
                      {stageQuotes.length}
                    </span>
                  </div>

                  <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                    {stageQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="bg-[#16263F] border border-[#26395A] hover:border-[#E88B2A]/50 rounded-lg p-3 text-xs space-y-2 transition-all shadow-sm group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-[#E88B2A] text-[11px]">{quote.quoteNumber}</span>
                          <span className="text-[10px] text-[#A8A299] font-mono">{quote.ageDays}d old</span>
                        </div>

                        <div>
                          <p className="font-bold text-[#F4EFE6] text-xs leading-snug truncate">{quote.customerName}</p>
                          <p className="text-[11px] text-[#A8A299]">
                            {quote.pol.split(' ')[0]} &rarr; <span className="text-sky-400 font-semibold">{quote.pod.split(' ')[0]}</span>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#26395A] flex justify-between items-center text-[11px]">
                          <span className="font-mono text-[#F4EFE6] font-bold">
                            {quote.containerCount}x{quote.containerType}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${(quote.offeredRateUSD * quote.containerCount).toLocaleString()}
                          </span>
                        </div>

                        {/* Move stage controls */}
                        <div className="pt-1 flex items-center justify-between text-[10px] text-[#A8A299]">
                          <span className="truncate">{quote.salesPerson.split(' ')[0]}</span>
                          <div className="flex gap-1">
                            {stage === 'RFQ Received' && (
                              <button
                                onClick={() => handleMoveStage(quote.id, 'Quote Drafted')}
                                className="px-1.5 py-0.5 rounded bg-[#0A1628] text-[#E88B2A] hover:bg-[#E88B2A] hover:text-[#0A1628] font-bold"
                              >
                                Draft &rarr;
                              </button>
                            )}
                            {stage === 'Quote Drafted' && (
                              <button
                                onClick={() => handleMoveStage(quote.id, 'Sent to Customer')}
                                className="px-1.5 py-0.5 rounded bg-[#0A1628] text-sky-400 hover:bg-sky-600 hover:text-white font-bold"
                              >
                                Send &rarr;
                              </button>
                            )}
                            {stage === 'Sent to Customer' && (
                              <button
                                onClick={() => handleMoveStage(quote.id, 'Negotiating')}
                                className="px-1.5 py-0.5 rounded bg-[#0A1628] text-amber-400 hover:bg-amber-600 hover:text-white font-bold"
                              >
                                Neg &rarr;
                              </button>
                            )}
                            {stage === 'Negotiating' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMoveStage(quote.id, 'Won')}
                                  className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold"
                                >
                                  Won
                                </button>
                                <button
                                  onClick={() => handleMoveStage(quote.id, 'Lost')}
                                  className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 hover:bg-rose-600 hover:text-white font-bold"
                                >
                                  Lost
                                </button>
                              </div>
                            )}
                            {stage === 'Won' && (
                              <button
                                onClick={() => handleConvertToBooking(quote)}
                                className="w-full mt-2 py-1 px-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                                title="Create live ocean shipment from this won quote with contracted rates"
                              >
                                <Ship className="w-3 h-3" />
                                <span>+ Convert to Booking</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {stageQuotes.length === 0 && (
                      <div className="p-4 text-center text-[#6E6A64] text-[11px] italic">
                        No quotes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 2: RFQ Intake Form */}
      {activeTab === 'intake' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-6 max-w-3xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#1C2D4A]">
            <h2 className="text-base font-bold text-[#F4EFE6] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#E88B2A]" />
              <span>Intake New Freight RFQ / Customer Rate Request</span>
            </h2>
            <button
              onClick={() => setActiveTab('funnel')}
              className="px-3 py-1 text-xs text-[#A8A299] bg-[#16263F] rounded-lg"
            >
              Back to Funnel
            </button>
          </div>

          <form onSubmit={handleCreateRfq} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#A8A299] block mb-1">Customer / Shipper Name:</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Sales Person (Assigned):</label>
                <select
                  value={salesPerson}
                  onChange={e => setSalesPerson(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                >
                  <option value="Rahul Sharma">Rahul Sharma (Sales Lead)</option>
                  <option value="Utsav Joshi">Utsav Joshi (Operations)</option>
                  <option value="Seema Patel">Seema Patel (Finance)</option>
                  <option value="Aman Dana">Aman Dana (Director)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#A8A299] block mb-1">Port of Loading (POL):</label>
                <input
                  type="text"
                  required
                  value={pol}
                  onChange={e => setPol(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Port of Discharge (POD):</label>
                <input
                  type="text"
                  required
                  value={pod}
                  onChange={e => setPod(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[#A8A299] block mb-1">Container Type:</label>
                <select
                  value={containerType}
                  onChange={e => setContainerType(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                >
                  <option value="20GP">20' General Purpose</option>
                  <option value="40HC">40' High Cube</option>
                  <option value="40GP">40' General Purpose</option>
                  <option value="20RF">20' Reefer</option>
                </select>
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Container Count (TEU/FEU):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={containerCount}
                  onChange={e => setContainerCount(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Commodity / Cargo:</label>
                <input
                  type="text"
                  required
                  value={commodity}
                  onChange={e => setCommodity(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[#A8A299] block mb-1">Customer Target Rate (USD):</label>
                <input
                  type="number"
                  value={targetRateUSD}
                  onChange={e => setTargetRateUSD(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Proposed Offered Rate (USD):</label>
                <input
                  type="number"
                  required
                  value={offeredRateUSD}
                  onChange={e => setOfferedRateUSD(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Est. Gross Margin (INR):</label>
                <input
                  type="number"
                  required
                  value={marginINR}
                  onChange={e => setMarginINR(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono text-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2D4A]">
              <button
                type="button"
                onClick={() => setActiveTab('funnel')}
                className="px-4 py-2 rounded-xl bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs shadow-md shadow-[#E88B2A]/20"
              >
                Create RFQ &amp; Enter Funnel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Screen 4: Pipeline Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Sales Rep Leaderboard (Deals Won &amp; Margin)</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#16263F] rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#F4EFE6] block">Rahul Sharma (Sales Lead)</span>
                    <span className="text-[10px] text-[#A8A299]">Win Rate: 68% &bull; 14 Quotes Closed</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">₹4,80,000 Margin</span>
                </div>
                <div className="p-3 bg-[#16263F] rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#F4EFE6] block">Utsav Joshi (Operations / Cross-sell)</span>
                    <span className="text-[10px] text-[#A8A299]">Win Rate: 50% &bull; 6 Quotes Closed</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">₹1,95,000 Margin</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>Top Trade Lanes by Won Value</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#16263F] rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-[#F4EFE6]">Mundra &rarr; Jebel Ali (Middle East)</span>
                  <span className="font-mono font-bold text-sky-400">$48,200 (62 TEU)</span>
                </div>
                <div className="p-3 bg-[#16263F] rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-[#F4EFE6]">Mundra &rarr; Hamburg (Europe)</span>
                  <span className="font-mono font-bold text-sky-400">$34,500 (28 TEU)</span>
                </div>
                <div className="p-3 bg-[#16263F] rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-[#F4EFE6]">Kandla &rarr; Qingdao (Far East)</span>
                  <span className="font-mono font-bold text-sky-400">$18,900 (25 TEU)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
