import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Download, Printer, Filter, Calendar, TrendingUp, DollarSign, Container, ShieldCheck } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { shipments, invoices, showToast } = useApp();

  const [activeReport, setActiveReport] = useState<'dsr' | 'volume' | 'profitability' | 'gst' | 'dwell'>('dsr');

  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReport === 'dsr') {
      headers = ['Job ID', 'Shipper', 'POD', 'Carrier', 'Vessel', 'Voyage', 'Container', 'Status', 'ETD', 'ETA'];
      rows = shipments.map(s => [
        s.id,
        s.shipperName,
        s.podName,
        s.carrierName,
        s.vesselName,
        s.voyageNumber,
        s.containers[0]?.containerNumber || 'TBD',
        s.statusLabel,
        s.etd,
        s.eta
      ]);
    } else if (activeReport === 'gst') {
      headers = ['Invoice Number', 'Invoice Date', 'Recipient GSTIN', 'Recipient Name', 'Place of Supply', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Grand Total'];
      rows = invoices.map(i => [
        i.invoiceNumber,
        i.invoiceDate,
        i.billToGstin,
        i.billToPartyName,
        i.placeOfSupply || '24-Gujarat',
        i.subtotal,
        i.cgstAmount || 0,
        i.sgstAmount || 0,
        i.igstAmount || 0,
        i.grandTotal
      ]);
    } else if (activeReport === 'volume') {
      headers = ['Region', 'TEU Count', 'Share Pct', 'Estimated Revenue'];
      rows = [
        ['Northern Europe (Hamburg, Rotterdam)', 48, '42%', 2850000],
        ['Middle East & Gulf (Jebel Ali)', 32, '28%', 1420000],
        ['US West Coast (Los Angeles, Long Beach)', 24, '21%', 2280000]
      ];
    } else if (activeReport === 'profitability') {
      headers = ['Category', 'Amount INR'];
      rows = [
        ['Total Billed Revenue', 5840000],
        ['Total Carrier Expenses', 4860000],
        ['Net Operating Margin', 980000],
        ['Margin Percentage', '16.78%']
      ];
    } else {
      headers = ['Terminal / Facility', 'Dwell Time', 'Benchmark Target'];
      rows = [
        ['Adani CFS Mundra', '1.8 Days', '2.5 Days'],
        ['Concor CFS Gandhidham', '2.4 Days', '3.0 Days'],
        ['Port Gate to Berthing', '14 Hours', '24 Hours']
      ];
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MAPS_${activeReport.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'Report Exported', `${activeReport.toUpperCase()} CSV downloaded successfully`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#E88B2A]" />
            Logistics MIS, Operations & Financial Reports
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Automated Daily Shipment Reports (DSR), TEU throughput by trade lane, Carrier performance, and GSTR-1 previews
          </p>
        </div>

        <button
          onClick={handleExportReportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1C2D4A] pb-1 overflow-x-auto text-xs">
        {[
          { id: 'dsr', label: 'Daily Shipment Report (DSR)' },
          { id: 'volume', label: 'Monthly TEU Throughput' },
          { id: 'profitability', label: 'Shipment Margin P&L' },
          { id: 'gst', label: 'GSTR-1 Tax Return Preview' },
          { id: 'dwell', label: 'CFS & Port Dwell Time' }
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id as any)}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition-colors ${
              activeReport === r.id
                ? 'bg-[#16263F] text-[#E88B2A] border-b-2 border-[#E88B2A]'
                : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: DSR */}
      {activeReport === 'dsr' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Daily Operations Status Report — Generated 15 Oct 2026 12:00 IST
            </span>
            <span className="text-emerald-400 font-mono">Auto-Emailed to Management</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-[#16263F] text-[#A8A299] font-sans text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Job ID</th>
                  <th className="p-2.5">Shipper</th>
                  <th className="p-2.5">POD</th>
                  <th className="p-2.5">Carrier</th>
                  <th className="p-2.5">Vessel/Voy</th>
                  <th className="p-2.5">Container</th>
                  <th className="p-2.5">Milestone Status</th>
                  <th className="p-2.5">ETD</th>
                  <th className="p-2.5">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A]">
                {shipments.slice(0, 10).map(s => (
                  <tr key={s.id} className="hover:bg-[#16263F]/40">
                    <td className="p-2.5 font-bold text-[#E88B2A]">{s.id}</td>
                    <td className="p-2.5 font-sans font-medium text-[#F4EFE6]">{s.shipperName}</td>
                    <td className="p-2.5 font-sans text-sky-400 font-semibold">{s.podName.split(' ')[0]}</td>
                    <td className="p-2.5 font-sans text-zinc-300">{s.carrierName}</td>
                    <td className="p-2.5 font-sans text-zinc-300">{s.vesselName} ({s.voyageNumber})</td>
                    <td className="p-2.5 text-[#F4EFE6]">{s.containers[0]?.containerNumber || 'TBD'}</td>
                    <td className="p-2.5 font-sans text-emerald-400">{s.statusLabel}</td>
                    <td className="p-2.5 text-zinc-400">{s.etd.split(' ')[0]} {s.etd.split(' ')[1]}</td>
                    <td className="p-2.5 text-zinc-400">{s.eta.split(' ')[0]} {s.eta.split(' ')[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: VOLUME */}
      {activeReport === 'volume' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Container Volume Throughput by Destination Region (October 2026)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { reg: 'Northern Europe (Hamburg, Rotterdam)', teu: 48, pct: '42%', rev: '₹28,50,000' },
              { reg: 'Middle East & Gulf (Jebel Ali)', teu: 32, pct: '28%', rev: '₹14,20,000' },
              { reg: 'US West Coast (Los Angeles, Long Beach)', teu: 24, pct: '21%', rev: '₹22,80,000' }
            ].map((reg, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-[#16263F] border border-[#26395A] space-y-2">
                <span className="font-bold text-sm text-[#F4EFE6]">{reg.reg}</span>
                <p className="text-2xl font-bold font-mono text-[#E88B2A]">{reg.teu} TEU</p>
                <div className="w-full bg-[#0F1D33] h-2 rounded-full overflow-hidden">
                  <div style={{ width: reg.pct }} className="bg-[#E88B2A] h-full"></div>
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-[#A8A299]">
                  <span>Share: {reg.pct}</span>
                  <span className="font-bold text-emerald-400">{reg.rev}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT 3: PROFITABILITY */}
      {activeReport === 'profitability' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Shipment Commercial P&L Analysis (October 2026)
          </span>

          <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] flex justify-between items-center font-mono text-sm">
            <div>
              <span className="text-[#A8A299] font-sans">Total Billed Revenue: </span>
              <strong className="text-[#F4EFE6]">₹58,40,000</strong>
            </div>
            <div>
              <span className="text-[#A8A299] font-sans">Net Operating Margin: </span>
              <strong className="text-emerald-400 text-lg">₹9,80,000 (16.78%)</strong>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: GSTR-1 */}
      {activeReport === 'gst' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            GSTR-1 Outward Supplies Return Preview (Tax Period: October 2026)
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-[#16263F] text-[#A8A299] font-sans text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Recipient GSTIN</th>
                  <th className="p-2.5">Recipient Name</th>
                  <th className="p-2.5 text-right">Taxable Value</th>
                  <th className="p-2.5 text-right">CGST (2.5%)</th>
                  <th className="p-2.5 text-right">SGST (2.5%)</th>
                  <th className="p-2.5 text-right">Invoice Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A]">
                {invoices.slice(0, 8).map((inv, idx) => (
                  <tr key={`${inv.id}-${idx}`}>
                    <td className="p-2.5 font-bold text-[#E88B2A]">{inv.invoiceNumber}</td>
                    <td className="p-2.5 text-zinc-300">{inv.billToGstin}</td>
                    <td className="p-2.5 font-sans font-medium text-[#F4EFE6]">{inv.billToPartyName}</td>
                    <td className="p-2.5 text-right">₹{inv.subtotal?.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-zinc-400">₹{inv.cgstAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-zinc-400">₹{inv.sgstAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">{formatINR(inv.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: DWELL */}
      {activeReport === 'dwell' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            CFS Dwell Time & Port Gate-In Turnaround Performance
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#16263F] rounded border border-[#26395A]">
              <span className="text-[10px] text-[#A8A299]">Adani CFS Mundra</span>
              <p className="text-xl font-bold font-mono text-[#F4EFE6] mt-1">1.8 Days</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Under 2.5d target benchmark</p>
            </div>
            <div className="p-3 bg-[#16263F] rounded border border-[#26395A]">
              <span className="text-[10px] text-[#A8A299]">Concor CFS Gandhidham</span>
              <p className="text-xl font-bold font-mono text-[#F4EFE6] mt-1">2.4 Days</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Customs appraising on schedule</p>
            </div>
            <div className="p-3 bg-[#16263F] rounded border border-[#26395A]">
              <span className="text-[10px] text-[#A8A299]">Port Gate to Berthing</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">14 Hours</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Within CY Cutoff window</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
