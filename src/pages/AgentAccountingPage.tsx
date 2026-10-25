import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AgentTransaction } from '../types';
import { Coins, Plus, Printer, CheckCircle2, AlertTriangle, ArrowRightLeft, DollarSign } from 'lucide-react';
import { formatINR, formatUSD, formatEUR } from '../utils/formatters';
import { Modal } from '../components/common/Modal';

export const AgentAccountingPage: React.FC = () => {
  const { parties, agentTransactions, addAgentTransaction, reconcileTransaction, setActivePrintDoc, showToast } = useApp();

  const agents = parties.filter(p => p.type === 'Overseas Agent');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');

  const agent = parties.find(p => p.id === selectedAgentId) || agents[0];
  const agentTx = agentTransactions.filter(t => t.agentId === selectedAgentId);

  // Settlement Dialog
  const [showSettlement, setShowSettlement] = useState(false);
  const [settleAmount, setSettleAmount] = useState<number>(1500);
  const [settleFx, setSettleFx] = useState<number>(91.5);
  const [swiftRef, setSwiftRef] = useState(`SWIFT-HDFC-${Math.floor(100000 + Math.random() * 900000)}`);

  // Running balance
  const debits = agentTx.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
  const credits = agentTx.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = credits - debits;

  const handlePrintStatement = () => {
    setActivePrintDoc({
      type: 'STATEMENT',
      data: {
        agentName: agent.name,
        currency: agent.code.includes('DE') ? 'EUR' : agent.code.includes('JP') ? 'JPY' : 'USD',
        balance: `${netBalance.toFixed(2)} (${netBalance >= 0 ? 'Credit' : 'Debit'})`,
        transactions: agentTx
      }
    });
  };

  const handleConfirmSettlement = () => {
    const isEUR = agent.code.includes('DE') || agent.code.includes('ES');
    const currency = isEUR ? 'EUR' : agent.code.includes('JP') ? 'JPY' : 'USD';
    const amountINR = Math.round(settleAmount * settleFx);

    const newTx: AgentTransaction = {
      id: 'tx-' + Date.now(),
      agentId: selectedAgentId,
      date: '15 Oct 2026',
      type: 'Debit',
      description: `SWIFT Wire Settlement (Ref: ${swiftRef})`,
      shipmentId: 'SETTLEMENT-SWIFT',
      hblNo: 'DIRECT-WIRE',
      currency: currency as any,
      amount: settleAmount,
      fxRate: settleFx,
      amountINR,
      status: 'Matched',
      reconciledDate: '15 Oct 2026'
    };

    addAgentTransaction(newTx);
    setShowSettlement(false);
    showToast('success', 'SWIFT Settlement Logged', `Transferred ${currency} ${settleAmount} (₹${amountINR.toLocaleString('en-IN')})`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#E88B2A]" />
            Multi-Currency Overseas Agent Accounting
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Inter-company ledger reconciliation, freight profit splits, and SWIFT wire settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettlement(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-emerald-400 border border-[#26395A] font-semibold"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Record Wire Settlement
          </button>
          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Printer className="w-4 h-4" />
            Generate Monthly Statement PDF
          </button>
        </div>
      </div>

      {/* Agent Selector & KPI summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider">Select Partner Agent</span>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] mt-2 font-semibold"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.city}, {a.country})</option>
            ))}
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider">Ledger Net Position</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)} {agent.code.includes('DE') ? 'EUR' : agent.code.includes('JP') ? 'JPY' : 'USD'}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Equivalent ~ {formatINR(Math.abs(Math.round(netBalance * 91.5)))}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider">Reconciliation Status</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-[#F4EFE6]">
              {agentTx.filter(t => t.status === 'Matched').length} / {agentTx.length} Reconciled
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">1 pending confirmation from Hamburg</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Job / HBL Ref</th>
                <th className="p-3 text-right">Debit (Owed)</th>
                <th className="p-3 text-right">Credit (Due)</th>
                <th className="p-3 text-right">Fx Rate</th>
                <th className="p-3 text-right">Amount (INR)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] font-mono">
              {agentTx.map(tx => (
                <tr key={tx.id} className="hover:bg-[#16263F]/40 transition-colors">
                  <td className="p-3 font-sans text-zinc-400">{tx.date}</td>
                  <td className="p-3 font-sans font-medium text-[#F4EFE6]">{tx.description}</td>
                  <td className="p-3 text-[#E88B2A]">{tx.hblNo}</td>
                  <td className="p-3 text-right font-bold text-rose-400">
                    {tx.type === 'Debit' ? `${tx.currency} ${tx.amount.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {tx.type === 'Credit' ? `${tx.currency} ${tx.amount.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right text-zinc-400">{tx.fxRate}</td>
                  <td className="p-3 text-right font-bold text-[#F4EFE6]">{formatINR(tx.amountINR)}</td>
                  <td className="p-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'Matched'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-sans">
                    {tx.status !== 'Matched' && (
                      <button
                        onClick={() => reconcileTransaction(tx.id)}
                        className="px-2 py-0.5 rounded bg-[#16263F] hover:bg-[#1D3251] text-emerald-400 border border-[#26395A] font-semibold text-[10px]"
                      >
                        Match
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SWIFT Settlement Modal */}
      {showSettlement && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettlement(false)}
          title={`Record Wire Settlement: ${agent.name}`}
          subtitle="Record outgoing/incoming telegraphic transfer with FX rate conversion"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Settlement Amount ({agent.code.includes('DE') ? 'EUR' : 'USD'})</label>
              <input
                type="number"
                value={settleAmount}
                onChange={e => setSettleAmount(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Live FX Conversion Rate (to INR)</label>
              <input
                type="number"
                step="0.01"
                value={settleFx}
                onChange={e => setSettleFx(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Bank SWIFT Wire Reference UTR</label>
              <input
                type="text"
                value={swiftRef}
                onChange={e => setSwiftRef(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
            <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] text-right font-mono">
              <span className="text-[#A8A299] font-sans">Equivalent Book Value: </span>
              <strong className="text-emerald-400 text-sm ml-1">{formatINR(Math.round(settleAmount * settleFx))}</strong>
            </div>
            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button onClick={() => setShowSettlement(false)} className="px-3 py-1.5 rounded bg-[#16263F] text-[#A8A299]">
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                className="px-4 py-1.5 rounded font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                Confirm Wire Settlement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
