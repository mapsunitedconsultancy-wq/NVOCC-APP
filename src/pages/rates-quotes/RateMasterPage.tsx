import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CarrierRate } from '../../types';
import { BadgePercent, Plus, Search, Filter, ArrowRight, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import { formatUSD, formatINR } from '../../utils/formatters';

interface RateMasterPageProps {
  onOpenNewQuote: () => void;
}

export const RateMasterPage: React.FC<RateMasterPageProps> = ({ onOpenNewQuote }) => {
  const { carrierRates, addCarrierRate, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLane, setSelectedLane] = useState<string>('all');
  const [showAddRate, setShowAddRate] = useState(false);

  // New Rate Form state
  const [carrierName, setCarrierName] = useState('MSC');
  const [polName, setPolName] = useState('Mundra Port');
  const [podName, setPodName] = useState('Hamburg');
  const [equipmentType, setEquipmentType] = useState<any>("40'HC");
  const [baseFreightUSD, setBaseFreightUSD] = useState(2850);
  const [transitDays, setTransitDays] = useState(30);

  const filteredRates = carrierRates.filter(r => {
    const matchSearch =
      r.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.podName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.polName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLane = selectedLane === 'all' || r.podName.toLowerCase().includes(selectedLane.toLowerCase());
    return matchSearch && matchLane;
  });

  const handleCreateRate = () => {
    const newRate: CarrierRate = {
      id: 'rate-' + Date.now(),
      carrierId: 'carrier-manual',
      carrierName,
      polCode: 'INMUN',
      polName,
      podCode: 'GENERIC',
      podName,
      equipmentType,
      baseFreightUSD,
      bafUSD: 180,
      cafUSD: 40,
      thcOriginINR: 14500,
      docFeeINR: 4500,
      validFrom: '15 Oct 2026',
      validTo: '15 Nov 2026',
      transitDays,
      serviceRoute: 'Direct Contract',
      contractNo: `MND-${carrierName}-2026`,
      reliabilityScore: 92
    };
    addCarrierRate(newRate);
    setShowAddRate(false);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-[#E88B2A]" />
            Carrier Rate Master & Lane Comparison
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            {carrierRates.length} active contracted liner tariffs from Mundra & Kandla
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddRate(!showAddRate)}
            className="px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] font-semibold"
          >
            + Add Carrier Rate
          </button>
          <button
            onClick={onOpenNewQuote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Build Customer Quote
          </button>
        </div>
      </div>

      {/* Inline Add Rate Form */}
      {showAddRate && (
        <div className="p-4 bg-[#0F1D33] border border-[#E88B2A]/40 rounded-xl space-y-3 animate-in fade-in">
          <h3 className="font-bold text-sm text-[#F4EFE6]">Add Carrier Rate Tariff</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Carrier</label>
              <input
                type="text"
                value={carrierName}
                onChange={e => setCarrierName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded p-1.5 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Destination Port</label>
              <input
                type="text"
                value={podName}
                onChange={e => setPodName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded p-1.5 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Freight (USD)</label>
              <input
                type="number"
                value={baseFreightUSD}
                onChange={e => setBaseFreightUSD(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded p-1.5 text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Transit (Days)</label>
              <input
                type="number"
                value={transitDays}
                onChange={e => setTransitDays(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded p-1.5 text-[#F4EFE6] font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddRate(false)}
              className="px-3 py-1 rounded bg-[#16263F] text-[#A8A299]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRate}
              className="px-4 py-1 rounded font-bold bg-[#E88B2A] text-[#0A1628]"
            >
              Save to Master
            </button>
          </div>
        </div>
      )}

      {/* Lane Comparison Matrix (Mundra -> Hamburg top 4 side by side) */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
          <span className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E88B2A]" />
            Side-by-Side Carrier Comparison: Mundra (INMUN) → Hamburg (DEHAM) 40'HC
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Live Spot Tariffs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { carrier: 'ONE', rate: 2650, baf: 190, transit: 34, score: 88, expiry: 'Expiring in 10d', bestPrice: true },
            { carrier: 'Maersk Line', rate: 2750, baf: 180, transit: 31, score: 92, expiry: 'Valid 31 Oct' },
            { carrier: 'MSC', rate: 2850, baf: 160, transit: 33, score: 89, expiry: 'Valid 31 Oct' },
            { carrier: 'CMA CGM', rate: 2900, baf: 175, transit: 30, score: 94, expiry: 'Valid 31 Oct', fastest: true }
          ].map((c, i) => (
            <div key={i} className={`p-3 rounded-lg border flex flex-col justify-between ${c.bestPrice ? 'bg-[#16263F] border-[#E88B2A]' : 'bg-[#16263F]/70 border-[#26395A]'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#F4EFE6]">{c.carrier}</h4>
                  {c.bestPrice && <span className="px-1.5 py-0.2 rounded bg-[#E88B2A] text-[#0A1628] font-bold text-[9px]">BEST RATE</span>}
                  {c.fastest && <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold text-[9px] border border-emerald-700">FASTEST</span>}
                </div>
                <div className="mt-2 font-mono text-xl font-bold text-[#E88B2A]">
                  {formatUSD(c.rate)}
                </div>
                <p className="text-[10px] text-[#A8A299] font-mono mt-0.5">BAF: ${c.baf} • Transit: {c.transit} Days</p>
                <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Reliability: {c.score}%</p>
              </div>

              <div className="pt-2 border-t border-[#1C2D4A] mt-2 flex justify-between items-center text-[10px]">
                <span className={c.expiry.includes('Expiring') ? 'text-amber-400 font-semibold' : 'text-[#6E6A64]'}>{c.expiry}</span>
                <button onClick={onOpenNewQuote} className="text-[#E88B2A] font-bold hover:underline">Quote</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Master Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Carrier</th>
                <th className="p-3">Origin Port</th>
                <th className="p-3">Destination Port</th>
                <th className="p-3">Equipment</th>
                <th className="p-3 text-right">Base Ocean (USD)</th>
                <th className="p-3 text-right">BAF / CAF</th>
                <th className="p-3 text-right">THC Origin (INR)</th>
                <th className="p-3 text-center">Transit</th>
                <th className="p-3">Validity</th>
                <th className="p-3 text-center">Reliability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] font-mono">
              {filteredRates.map(r => (
                <tr key={r.id} className="hover:bg-[#16263F]/40 transition-colors">
                  <td className="p-3 font-sans font-bold text-[#F4EFE6]">{r.carrierName}</td>
                  <td className="p-3 font-sans text-zinc-300">{r.polName}</td>
                  <td className="p-3 font-sans font-bold text-sky-400">{r.podName}</td>
                  <td className="p-3 font-sans text-zinc-300">{r.equipmentType}</td>
                  <td className="p-3 text-right font-bold text-[#E88B2A]">{formatUSD(r.baseFreightUSD)}</td>
                  <td className="p-3 text-right text-zinc-400">${r.bafUSD} / ${r.cafUSD}</td>
                  <td className="p-3 text-right text-emerald-400">{formatINR(r.thcOriginINR)}</td>
                  <td className="p-3 text-center font-sans">{r.transitDays}d</td>
                  <td className="p-3 font-sans text-zinc-300">{r.validTo}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {r.reliabilityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
