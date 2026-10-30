import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quotation } from '../../types';
import { MOCK_PORTS, MOCK_EQUIPMENTS } from '../../data/mockData';
import { formatUSD, formatINR } from '../../utils/formatters';
import { BadgePercent, Plus, Printer, ArrowRight, ArrowLeft, Check, Send, MessageSquare } from 'lucide-react';

interface QuoteBuilderProps {
  onBack: () => void;
}

export const QuoteBuilderPage: React.FC<QuoteBuilderProps> = ({ onBack }) => {
  const { parties, carrierRates, addQuotation, quotations, setActivePrintDoc, showToast } = useApp();

  const shippers = parties.filter(p => p.type === 'Shipper');

  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(shippers[0]?.id || '');
  const [podName, setPodName] = useState('Hamburg');
  const [equipmentType, setEquipmentType] = useState<any>("40'HC");
  const [carrierName, setCarrierName] = useState('MSC');
  const [baseFreightUSD, setBaseFreightUSD] = useState(2850);
  const [bafUSD, setBafUSD] = useState(160);
  const [cafUSD, setCafUSD] = useState(40);
  const [localChargesINR, setLocalChargesINR] = useState(14200);
  const [marginPercent, setMarginPercent] = useState(15);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validUntil, setValidUntil] = useState('29 Oct 2026');
  const [paymentTerms, setPaymentTerms] = useState('15 Days Credit');

  const customer = parties.find(p => p.id === selectedCustomerId) || shippers[0];

  // Point 09: Landed buy = base + BAF + CAF
  const landedBuyUSD = baseFreightUSD + bafUSD + cafUSD;
  const landedBuyINR = Math.round(landedBuyUSD * 83.92);
  const standardMarginINR = Math.round(landedBuyINR * (marginPercent / 100));
  const discountAmountINR = Math.round((landedBuyINR + standardMarginINR) * (discountPercent / 100));
  const grandTotalQuoteINR = landedBuyINR + localChargesINR + standardMarginINR - discountAmountINR;

  // Point 09: 22% discount trips approval rule (>20%)
  const isApprovalRequired = discountPercent > 20;

  const handleSaveAndPrint = (shouldPrint = true) => {
    const nextSeq = Math.floor(100 + Math.random() * 900);
    const quoteNumber = `MAPS/QTN/24-25/0${nextSeq}`;

    const newQuote: Quotation = {
      id: 'QTN-' + nextSeq,
      quoteNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      polName: 'Mundra Port',
      podName,
      equipmentType,
      carrierName,
      baseFreightUSD,
      surchargesUSD: (bafUSD + cafUSD),
      localChargesINR,
      marginINR: standardMarginINR,
      totalPriceINR: grandTotalQuoteINR,
      validUntil,
      status: 'Sent',
      paymentTerms,
      notes: `Direct liner booking with ${carrierName}. Standard 14 days destination free time included.`,
      createdDate: '15 Oct 2026'
    };

    addQuotation(newQuote);
    if (shouldPrint) {
      setActivePrintDoc({ type: 'QUOTE', data: newQuote });
    }
    onBack();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <button onClick={onBack} className="text-[#A8A299] hover:text-[#F4EFE6] flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Rates
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-[#E88B2A]" />
            Multi-Carrier Freight Quote Builder
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Build branded customer quotations with automatic carrier tariff sync, margins, and PDF issuance
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A] overflow-x-auto text-xs">
          {[
            { s: 1, label: '1. Customer' },
            { s: 2, label: '2. Route & Specs' },
            { s: 3, label: '3. Carrier & Margin' },
            { s: 4, label: '4. Preview & Dispatch' }
          ].map(st => (
            <div
              key={st.s}
              onClick={() => setStep(st.s)}
              className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${
                step === st.s
                  ? 'bg-[#E88B2A]/20 text-[#E88B2A] font-bold border border-[#E88B2A]/30'
                  : 'text-[#6E6A64]'
              }`}
            >
              <span>{st.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Customer */}
        {step === 1 && (
          <div className="space-y-3">
            <label className="block text-[#A8A299] font-semibold text-xs">Select Shipper / Client</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2.5 text-[#F4EFE6]"
            >
              {shippers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city}, Gujarat)</option>
              ))}
            </select>
            {customer && (
              <div className="p-3 bg-[#16263F] rounded border border-[#26395A] text-[11px] space-y-1">
                <div><span className="text-[#A8A299]">Contact Person:</span> {customer.primaryContactName} ({customer.phone})</div>
                <div><span className="text-[#A8A299]">Email:</span> {customer.email}</div>
                <div><span className="text-[#A8A299]">GSTIN:</span> <span className="font-mono">{customer.gstin}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Route & Equipment */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Origin Port</label>
                <input
                  type="text"
                  value="Mundra Port, Gujarat (INMUN)"
                  disabled
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Destination Port</label>
                <select
                  value={podName}
                  onChange={e => setPodName(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="Hamburg">Hamburg, Germany (DEHAM)</option>
                  <option value="Jebel Ali">Jebel Ali, UAE (AEJEA)</option>
                  <option value="Los Angeles">Los Angeles, USA (USLAX)</option>
                  <option value="Rotterdam">Rotterdam, Netherlands (NLRTM)</option>
                  <option value="Yokohama">Yokohama, Japan (JPYOK)</option>
                  <option value="Barcelona">Barcelona, Spain (ESBCN)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Equipment Type</label>
              <select
                value={equipmentType}
                onChange={e => setEquipmentType(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              >
                {MOCK_EQUIPMENTS.map(eq => (
                  <option key={eq.code} value={eq.code}>{eq.code} — {eq.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Carrier & Margin (Point 09) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Carrier</label>
                <select
                  value={carrierName}
                  onChange={e => {
                    const c = e.target.value;
                    setCarrierName(c);
                    if (c === 'Maersk Line') {
                      setBaseFreightUSD(2750); setBafUSD(180); setCafUSD(45); setLocalChargesINR(14500);
                    } else if (c === 'MSC') {
                      setBaseFreightUSD(2850); setBafUSD(160); setCafUSD(40); setLocalChargesINR(14200);
                    } else if (c === 'CMA CGM') {
                      setBaseFreightUSD(2900); setBafUSD(175); setCafUSD(50); setLocalChargesINR(14800);
                    } else if (c === 'ONE') {
                      setBaseFreightUSD(2650); setBafUSD(190); setCafUSD(45); setLocalChargesINR(14400);
                    }
                  }}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded p-2 text-[#F4EFE6]"
                >
                  <option value="MSC">MSC ($2,850 + BAF 160 + CAF 40)</option>
                  <option value="Maersk Line">Maersk ($2,750 + BAF 180 + CAF 45)</option>
                  <option value="CMA CGM">CMA CGM ($2,900 + BAF 175 + CAF 50)</option>
                  <option value="ONE">ONE ($2,650 + BAF 190 + CAF 45)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Base Buy (USD)</label>
                <input
                  type="number"
                  value={baseFreightUSD}
                  onChange={e => setBaseFreightUSD(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">BAF / CAF (USD)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={bafUSD}
                    onChange={e => setBafUSD(Number(e.target.value))}
                    className="w-1/2 bg-[#16263F] border border-[#26395A] rounded p-2 text-[#F4EFE6] font-mono"
                    placeholder="BAF"
                  />
                  <input
                    type="number"
                    value={cafUSD}
                    onChange={e => setCafUSD(Number(e.target.value))}
                    className="w-1/2 bg-[#16263F] border border-[#26395A] rounded p-2 text-[#F4EFE6] font-mono"
                    placeholder="CAF"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Origin THC (INR)</label>
                <input
                  type="number"
                  value={localChargesINR}
                  onChange={e => setLocalChargesINR(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>

            {/* Landed Buy Summary Strip */}
            <div className="p-3 bg-[#0F1D33] rounded-lg border border-[#26395A] flex flex-wrap justify-between items-center text-xs">
              <div>
                <span className="text-[#A8A299]">Landed Buy Cost (Base + BAF + CAF): </span>
                <span className="font-bold font-mono text-[#F4EFE6]">${landedBuyUSD} (₹{landedBuyINR.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A8A299]">Margin %:</span>
                <input
                  type="number"
                  value={marginPercent}
                  onChange={e => setMarginPercent(Number(e.target.value))}
                  className="w-16 bg-[#16263F] border border-[#26395A] rounded px-2 py-1 font-mono text-emerald-400 font-bold"
                />
                <span className="text-[#A8A299]">Discount %:</span>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className={`w-16 bg-[#16263F] border rounded px-2 py-1 font-mono font-bold ${
                    isApprovalRequired ? 'border-rose-500 text-rose-400' : 'border-[#26395A] text-amber-400'
                  }`}
                />
              </div>
            </div>

            {/* Quick Test Scenarios for Point 09 */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[#A8A299] font-semibold">Test Point 09:</span>
              <button
                type="button"
                onClick={() => { setMarginPercent(15); setDiscountPercent(0); }}
                className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold"
              >
                Standard 15% Margin
              </button>
              <button
                type="button"
                onClick={() => { setDiscountPercent(22); }}
                className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold"
              >
                22% Discount (Trips Approval Gate)
              </button>
            </div>

            {/* Approval Warning Banner */}
            {isApprovalRequired && (
              <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-lg text-rose-200 text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <span className="font-bold block">Commercial Director Sign-Off Required</span>
                    <span className="text-[11px] text-rose-300">
                      {discountPercent}% discount exceeds standard commercial limits (&gt;20%). System will hold quotation in "Pending Approval" state.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-rose-900 border border-rose-600 font-mono font-bold uppercase">
                  APPROVAL TRIP
                </span>
              </div>
            )}

            <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] flex justify-between items-center font-mono">
              <div>
                <span className="text-[#A8A299] font-sans">Margin Earned: </span>
                <span className="font-bold text-emerald-400">{formatINR(standardMarginINR - discountAmountINR)}</span>
              </div>
              <div>
                <span className="text-[#A8A299] font-sans">Final Quote Total: </span>
                <span className="font-bold text-xl text-[#E88B2A]">{formatINR(grandTotalQuoteINR)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="p-4 bg-[#16263F] rounded-lg border border-[#26395A] space-y-3">
            <h3 className="font-bold text-sm text-[#F4EFE6]">Quotation Summary Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div><span className="font-sans text-[#A8A299]">Client:</span> {customer.name}</div>
              <div><span className="font-sans text-[#A8A299]">Route:</span> Mundra → {podName} ({equipmentType})</div>
              <div><span className="font-sans text-[#A8A299]">Carrier:</span> {carrierName}</div>
              <div><span className="font-sans text-[#A8A299]">Valid Until:</span> {validUntil}</div>
            </div>
            <div className="pt-2 border-t border-[#1C2D4A] flex justify-between items-center text-sm font-bold">
              <span>All-In Quote Price:</span>
              <span className="font-mono text-emerald-400 text-lg">{formatINR(grandTotalQuoteINR)}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="pt-3 border-t border-[#1C2D4A] flex justify-between items-center">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-3 py-1.5 rounded bg-[#16263F] text-[#F4EFE6]">
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="px-4 py-1.5 rounded font-bold bg-[#E88B2A] text-[#0A1628]">
              Continue
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveAndPrint(false)}
                className="px-4 py-1.5 rounded bg-[#16263F] border border-[#26395A] text-[#F4EFE6]"
              >
                Save Quote
              </button>
              <button
                onClick={() => handleSaveAndPrint(true)}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                Generate Printable PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
