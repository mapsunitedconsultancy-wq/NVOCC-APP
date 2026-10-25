import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ContainerControlInvoice } from '../../data/container-control';
import { X, Printer, Download, ShieldCheck, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import { formatINR, numberToWordsINR } from '../../utils/formatters';

interface ContainerInvoiceModalProps {
  invoice: ContainerControlInvoice | null;
  onClose: () => void;
}

export const ContainerInvoiceModal: React.FC<ContainerInvoiceModalProps> = ({
  invoice,
  onClose
}) => {
  const { firmDetails, showToast } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast('info', 'Opening Print Dialog', 'Select "Save as PDF" to download high-resolution GST invoice.');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 no-print animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="px-5 py-3 border-b border-[#1C2D4A] flex items-center justify-between bg-[#16263F] shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              GST Tax Invoice
            </span>
            <span className="text-sm font-bold text-[#F4EFE6] font-mono">
              {invoice.invoiceNumber}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
              invoice.status === 'Paid'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : invoice.status === 'Overdue'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1D3251] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#1a2332] flex justify-center">
          <div
            ref={printAreaRef}
            className="printable-area w-full max-w-[800px] bg-white text-zinc-900 p-8 sm:p-10 shadow-2xl rounded-sm border border-zinc-300 text-xs leading-relaxed font-sans relative"
          >
            {/* Header Box */}
            <div className="border-2 border-zinc-900 pb-3 mb-0 p-4 rounded-t-sm flex justify-between items-start bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-[#0A1628] text-white flex items-center justify-center font-black text-2xl shadow">
                  M
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-wider text-zinc-950 uppercase">{firmDetails.legalName}</h1>
                  <p className="text-[10px] text-zinc-600 font-medium leading-tight">
                    {firmDetails.registeredAddress}<br />
                    Phone: {firmDetails.phone} • Email: {firmDetails.email}<br />
                    GSTIN: <strong className="text-zinc-900">{firmDetails.gstin}</strong> • PAN: <strong className="text-zinc-900">{firmDetails.pan}</strong>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-black font-serif text-zinc-950 uppercase tracking-tight">TAX INVOICE</h2>
                <span className="inline-block px-2 py-0.5 bg-zinc-900 text-white font-bold text-[9px] rounded uppercase mt-1">
                  ORIGINAL FOR RECIPIENT
                </span>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">
                  SAC CODE: <strong>996611</strong> (Container Handling)
                </p>
              </div>
            </div>

            {/* Meta Details Row */}
            <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 text-xs">
              <div className="p-3 border-r-2 border-zinc-900 bg-white">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Bill To (Customer Particulars):
                </span>
                <p className="font-bold text-zinc-950 text-[11px] uppercase">{invoice.customerName}</p>
                <p className="text-zinc-700 text-[10px] leading-tight mt-0.5">{invoice.customerAddress}</p>
                <p className="font-mono text-[10px] font-semibold text-zinc-900 mt-1">
                  GSTIN: {invoice.customerGstin}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 space-y-1 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-500 text-[10px]">Invoice Number:</span>
                  <span className="font-bold text-zinc-950">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-500 text-[10px]">Invoice Date:</span>
                  <span className="text-zinc-900">{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-500 text-[10px]">Payment Due Date:</span>
                  <span className="font-bold text-zinc-950">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-500 text-[10px]">Place of Supply:</span>
                  <span className="text-zinc-900">{invoice.placeOfSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-500 text-[10px]">Billing Model:</span>
                  <span className="font-sans font-semibold text-emerald-800">{invoice.billingModel}</span>
                </div>
              </div>
            </div>

            {/* Service Title */}
            <div className="border-x-2 border-b-2 border-zinc-900 px-3 py-1.5 bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center">
              <span>Container Control Services — {invoice.billingPeriod}</span>
              <span className="text-[9px] font-mono text-zinc-600">State Code: 24 (Gujarat)</span>
            </div>

            {/* Line Items Table */}
            <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-300">
                  <tr>
                    <th className="p-2 w-8 text-center">Sl</th>
                    <th className="p-2">Description of Service</th>
                    <th className="p-2 text-center">HSN/SAC</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate (₹)</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {invoice.items.map(item => (
                    <tr key={item.sl}>
                      <td className="p-2 text-center text-zinc-500">{item.sl}</td>
                      <td className="p-2 font-sans font-medium text-zinc-900">{item.description}</td>
                      <td className="p-2 text-center text-zinc-600">{item.hsnSac}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold text-zinc-950">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Tax Table */}
            <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
              <div className="col-span-7 p-3 border-r-2 border-zinc-900 flex flex-col justify-between bg-zinc-50">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">
                    Amount in Words:
                  </span>
                  <p className="font-serif italic text-zinc-900 text-[11px] font-bold leading-tight">
                    {numberToWordsINR(invoice.totalINR)}
                  </p>
                </div>

                {/* Bank Account Details */}
                <div className="mt-4 pt-2 border-t border-zinc-300 text-[10px] space-y-0.5">
                  <span className="font-bold text-zinc-900 block text-[9px] uppercase">Bank Remittance Particulars:</span>
                  <p className="font-mono text-zinc-800">
                    Bank: <strong>HDFC Bank Ltd</strong>, Gandhidham Branch<br />
                    Account Name: <strong>MAPS FREIGHT SOLUTIONS PVT LTD</strong><br />
                    Account No: <strong>50200012345678</strong> • IFSC: <strong>HDFC0001234</strong><br />
                    UPI ID: <strong>mapsfreight@hdfcbank</strong>
                  </p>
                </div>
              </div>

              <div className="col-span-5 p-3 font-mono text-[11px] space-y-1.5 bg-white">
                <div className="flex justify-between">
                  <span className="font-sans text-zinc-600">Taxable Subtotal:</span>
                  <span className="font-bold text-zinc-900">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span className="font-sans text-[10px]">CGST @ 9%:</span>
                  <span>₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span className="font-sans text-[10px]">SGST @ 9%:</span>
                  <span>₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t-2 border-zinc-900 flex justify-between text-sm font-black text-zinc-950">
                  <span className="font-sans">Total (INR):</span>
                  <span className="text-[#0A1628]">₹{invoice.totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-200">
                  <div className="text-[9px] text-zinc-500 font-sans leading-tight">
                    Scan UPI QR to pay directly from any banking app
                  </div>
                  <div className="w-12 h-12 border border-zinc-300 rounded p-1 flex items-center justify-center bg-white shadow-sm">
                    <QrCode className="w-10 h-10 text-zinc-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Signature */}
            <div className="border-x-2 border-b-2 border-zinc-900 p-4 rounded-b-sm grid grid-cols-2 bg-zinc-50 text-[10px]">
              <div className="text-zinc-600 flex flex-col justify-end">
                <p>
                  1. Interest @ 18% p.a. will be levied on overdue payments exceeding credit terms.<br />
                  2. Subject to Gandhidham (Kutch) Jurisdiction.
                </p>
              </div>

              <div className="flex flex-col items-end text-right justify-between">
                <span className="font-bold text-zinc-900">
                  For and on behalf of<br />
                  <strong className="text-[11px] uppercase font-black text-zinc-950">{firmDetails.legalName}</strong>
                </span>

                <div className="my-2 flex items-center gap-2">
                  <div className="w-12 h-12 border border-dashed border-emerald-600 rounded-full flex flex-col items-center justify-center text-[6.5px] font-bold text-emerald-800 rotate-[-10deg] p-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    AUTHORIZED
                  </div>
                  <div className="border-b border-zinc-900 w-32 text-center pb-0.5">
                    <span className="font-serif italic text-xs font-bold text-zinc-900">Aman Dana</span>
                  </div>
                </div>

                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Authorized Signatory (Gandhidham HQ)</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
