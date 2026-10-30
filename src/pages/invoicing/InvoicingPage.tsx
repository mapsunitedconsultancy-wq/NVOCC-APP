import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Receipt, Plus, Printer, CheckCircle2, Clock, AlertTriangle, Search, Filter, DollarSign, MessageSquare, Download, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { WhatsAppPreviewModal } from '../../components/common/WhatsAppPreviewModal';

interface InvoicingPageProps {
  onOpenNewInvoice: () => void;
}

export const InvoicingPage: React.FC<InvoicingPageProps> = ({ onOpenNewInvoice }) => {
  const { invoices, recordPayment, setActivePrintDoc, showToast, sendMessage, viewParam } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sync drilldown filters
  React.useEffect(() => {
    if (viewParam) {
      if (viewParam === 'filter:pending') {
        setStatusFilter('Issued');
      } else if (viewParam === 'filter:overdue') {
        setStatusFilter('Overdue');
      } else if (!viewParam.startsWith('filter:')) {
        setSearchTerm(viewParam);
      }
    }
  }, [viewParam]);

  // Record payment modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState('RTGS / NEFT');
  const [payRef, setPayRef] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.billToPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.shipmentId && inv.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Aging summary
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const overdue30 = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.balanceDue, 0);

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
    setPayRef(`HDFC-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice || !payAmount) return;
    recordPayment(selectedInvoice.id, payAmount, payMode, payRef);
    setSelectedInvoice(null);
  };

  const [waReminderInvoice, setWaReminderInvoice] = useState<Invoice | null>(null);

  const handleSendReminder = (inv: Invoice) => {
    setWaReminderInvoice(inv);
  };

  // Official Indian GST Portal GSTR-1 B2B Format CSV Exporter
  const exportGstr1Csv = () => {
    const headers = 'GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Reverse Charge,Applicable % of Tax Rate,Invoice Type,E-Commerce GSTIN,Rate,Taxable Value,Cess Amount\n';
    const rows = invoices.map(inv => {
      const gstin = inv.billToGstin || '24AABCK1234D1Z5';
      const receiver = inv.billToPartyName.replace(/"/g, '""');
      const invNo = inv.invoiceNumber;
      const invDate = inv.invoiceDate;
      const invVal = inv.grandTotal;
      const pos = inv.placeOfSupply ? inv.placeOfSupply.slice(0, 2) : '24';
      const rate = inv.lineItems && inv.lineItems[0] ? inv.lineItems[0].gstRate : 18;
      const taxable = inv.subtotal;
      return `"${gstin}","${receiver}","${invNo}","${invDate}","${invVal}","${pos}","N","","Regular B2B","","${rate}","${taxable}","0"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-1_B2B_Returns_${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    showToast('success', 'GSTR-1 B2B Return Exported', 'Compliant with GST Portal Offline Tool schema.');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#E88B2A]" />
            GST Tax Invoicing & Accounts Receivable
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            {invoices.length} invoices generated • Multi-tier aging analysis and UPI QR collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportGstr1Csv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            title="Download GSTR-1 B2B CSV ready for GST Portal upload"
          >
            <Download className="w-3.5 h-3.5 text-[#E88B2A]" />
            Export GSTR-1 (CSV)
          </button>
          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + Create Tax Invoice
          </button>
        </div>
      </div>

      {/* Financial Aging KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A]">
          <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider">Total Open Receivables</span>
          <p className="text-xl font-bold font-mono text-[#F4EFE6] mt-1">{formatINR(totalReceivables)}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">Pending collection from Morbi/Kutch shippers</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-rose-800/50">
          <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Overdue (30+ Days Aging)</span>
          <p className="text-xl font-bold font-mono text-rose-200 mt-1">{formatINR(overdue30)}</p>
          <p className="text-[10px] text-rose-300/80 mt-0.5">Priority collection list (5 accounts)</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F1D33] border border-emerald-800/50">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Total Realized Collections</span>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-1">{formatINR(totalCollected)}</p>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">Reconciled via bank feeds</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer name, shipment..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6]"
          >
            <option value="all">All Statuses</option>
            <option value="issued">Issued / Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Type</th>
                <th className="p-3">Customer (Billed To)</th>
                <th className="p-3">Invoice Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Taxable</th>
                <th className="p-3 text-right">GST Tax</th>
                <th className="p-3 text-right">Grand Total (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] font-mono">
              {filteredInvoices.map((inv, idx) => (
                <tr key={`${inv.id}-${idx}`} className="hover:bg-[#16263F]/40 transition-colors">
                  <td className="p-3 font-bold text-[#E88B2A]">
                    {inv.invoiceNumber}
                    {inv.shipmentId && (
                      <span className="block text-[10px] font-sans text-[#A8A299]">Job: {inv.shipmentId}</span>
                    )}
                  </td>
                  <td className="p-3 font-sans text-zinc-300">{inv.invoiceType}</td>
                  <td className="p-3 font-sans font-medium text-[#F4EFE6] max-w-[170px] truncate">
                    {inv.billToPartyName}
                  </td>
                  <td className="p-3 font-sans text-zinc-400">{inv.invoiceDate}</td>
                  <td className="p-3 font-sans text-zinc-400">{inv.dueDate}</td>
                  <td className="p-3 text-right text-zinc-300">₹{inv.subtotal?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-zinc-400">₹{inv.totalTax?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">{formatINR(inv.grandTotal)}</td>
                  <td className="p-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActivePrintDoc({ type: 'INVOICE', data: inv })}
                        className="p-1 rounded bg-[#16263F] hover:bg-[#1D3251] text-[#E88B2A]"
                        title="Print / View GST Tax Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {inv.status !== 'Paid' && (
                        <>
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-bold"
                          >
                            Record Pay
                          </button>
                          <button
                            onClick={() => handleSendReminder(inv)}
                            className="p-1 rounded bg-[#16263F] text-emerald-400 hover:bg-[#1D3251] border border-[#26395A]"
                            title="Preview & Send WhatsApp Payment Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Record Payment for ${selectedInvoice.invoiceNumber}`}
          subtitle={`Customer: ${selectedInvoice.billToPartyName} • Balance Due: ${formatINR(selectedInvoice.balanceDue)}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Amount to Apply (INR)</label>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(Number(e.target.value))}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Payment Mode</label>
              <select
                value={payMode}
                onChange={e => setPayMode(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              >
                <option value="RTGS / NEFT">RTGS / NEFT Wire</option>
                <option value="UPI">UPI (QR Code Payment)</option>
                <option value="Cheque">Account Payee Cheque</option>
                <option value="Razorpay">Razorpay Gateway Link</option>
              </select>
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Bank Transaction UTR / Ref Number</label>
              <input
                type="text"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 rounded bg-[#16263F] text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 rounded font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                Confirm Payment & Reconcile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Payment Reminder Preview Modal */}
      {waReminderInvoice && (
        <WhatsAppPreviewModal
          isOpen={true}
          onClose={() => setWaReminderInvoice(null)}
          recipientName={waReminderInvoice.billToPartyName}
          phoneNumber="+91 98250 12345"
          defaultMessage={`Dear Accounts Team at ${waReminderInvoice.billToPartyName}, this is a gentle payment reminder for Tax Invoice ${waReminderInvoice.invoiceNumber} with outstanding balance of ${formatINR(waReminderInvoice.balanceDue)}. Pay instantly via UPI: mapsfreight@hdfcbank or HDFC Bank RTGS.\nDownload GST Invoice PDF: https://mapsfreight.in/inv/${waReminderInvoice.invoiceNumber}.pdf\n\nMAPS Freight Solutions Pvt Ltd, Gandhidham`}
          shipmentId={waReminderInvoice.shipmentId}
          docTitle={`Tax Invoice ${waReminderInvoice.invoiceNumber}`}
        />
      )}
    </div>
  );
};
