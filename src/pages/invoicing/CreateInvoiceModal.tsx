import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Invoice, InvoiceLineItem } from '../../types';
import { numberToWordsINR, formatINR } from '../../utils/formatters';
import { Receipt, Plus, Trash2, ShieldCheck } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose }) => {
  const { addInvoice, parties, shipments, currentUser, setActivePrintDoc } = useApp();

  const shippers = parties.filter(p => p.type === 'Shipper');

  const [invoiceType, setInvoiceType] = useState<any>('Tax Invoice');
  const [selectedPartyId, setSelectedPartyId] = useState(shippers[0]?.id || '');
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id || '');

  const party = parties.find(p => p.id === selectedPartyId) || shippers[0];
  const shipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  const nextSeq = Math.floor(10 + Math.random() * 89);
  const [invoiceNumber] = useState('MAPS/26-27/INV/938');
  const [testStateMode, setTestStateMode] = useState<'Gujarat' | 'Maharashtra'>('Gujarat');

  // Point 10: Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li-1',
      hsnSacCode: '996521',
      description: 'Ocean Freight (export, LUT - 0%)',
      quantity: 1,
      unit: '40HC',
      rate: 248000,
      currency: 'INR',
      amount: 248000,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 248000
    },
    {
      id: 'li-2',
      hsnSacCode: '996611',
      description: 'Terminal Handling (Origin, Mundra)',
      quantity: 1,
      unit: 'Job',
      rate: 15500,
      currency: 'INR',
      amount: 15500,
      gstRate: 18,
      gstAmount: 2790,
      totalAmount: 18290
    },
    {
      id: 'li-3',
      hsnSacCode: '996713',
      description: 'Documentation / BL fee',
      quantity: 1,
      unit: 'Doc',
      rate: 2500,
      currency: 'INR',
      amount: 2500,
      gstRate: 18,
      gstAmount: 450,
      totalAmount: 2950
    }
  ]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0); // 2,66,000
  const totalGst = lineItems.reduce((sum, item) => sum + item.gstAmount, 0); // 3,240

  // Point 10: Auto-determine Intra-state (Gujarat Code 24: CGST + SGST) vs Inter-state (Maharashtra Code 27: IGST)
  const isIntraState = testStateMode === 'Gujarat';
  const partyState = testStateMode;
  const cgstAmount = isIntraState ? 1620 : 0;
  const sgstAmount = isIntraState ? 1620 : 0;
  const igstAmount = isIntraState ? 0 : 3240;
  const grandTotal = subtotal + totalGst; // 2,69,240

  const handleSaveInvoice = (shouldPrint = true) => {
    const newInvoice: Invoice = {
      id: invoiceNumber,
      invoiceNumber,
      invoiceType,
      invoiceDate: '15 Oct 2026',
      dueDate: '30 Oct 2026',
      shipmentId: shipment?.id,
      hblId: shipment?.hblNo,
      referenceNo: shipment?.referenceNo,
      billToPartyId: party.id,
      billToPartyName: party.name,
      billToAddress: party.address,
      billToGstin: party.gstin || '24AABCK1234D1Z5',
      billToState: partyState,
      billToStateCode: isIntraState ? '24' : (party.gstin?.slice(0, 2) || '27'),
      placeOfSupply: isIntraState ? 'Gujarat (State Code 24)' : `${partyState} (Inter-State IGST)`,
      isExport: false,
      isReverseCharge: false,
      lineItems,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax: totalGst,
      roundOff: 0,
      grandTotal,
      amountInWords: numberToWordsINR(grandTotal),
      amountPaid: 0,
      balanceDue: grandTotal,
      status: 'Issued',
      paymentTerms: '15 Days Credit'
    };

    addInvoice(newInvoice);
    onClose();
    if (shouldPrint) {
      setActivePrintDoc({ type: 'INVOICE', data: newInvoice });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create GST Tax Invoice"
      subtitle="Automated CGST+SGST / IGST tax calculation with SAC codes (996521, 996611, 996713)"
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold">Invoice Type</label>
            <select
              value={invoiceType}
              onChange={e => setInvoiceType(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
            >
              <option value="Tax Invoice">Tax Invoice</option>
              <option value="Freight Invoice">Freight Invoice</option>
              <option value="Credit Note">Credit Note</option>
              <option value="Debit Note">Debit Note</option>
              <option value="Proforma">Proforma Invoice</option>
            </select>
          </div>
          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold">Bill To Customer</label>
            <select
              value={selectedPartyId}
              onChange={e => setSelectedPartyId(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
            >
              {shippers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold">Link Shipment (Optional)</label>
            <select
              value={selectedShipmentId}
              onChange={e => setSelectedShipmentId(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
            >
              {shipments.map(s => (
                <option key={s.id} value={s.id}>{s.id} — {s.shipperName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line items table */}
        <div className="space-y-2">
          <span className="font-bold text-[#E88B2A] uppercase tracking-wider block">Line Items</span>
          <div className="border border-[#26395A] rounded-lg overflow-hidden">
            <table className="w-full text-left font-mono">
              <thead className="bg-[#16263F] text-[#A8A299] font-sans text-[10px] uppercase">
                <tr>
                  <th className="p-2">SAC</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Taxable (₹)</th>
                  <th className="p-2 text-center">GST %</th>
                  <th className="p-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A]">
                {lineItems.map(item => (
                  <tr key={item.id}>
                    <td className="p-2 text-[#E88B2A]">{item.hsnSacCode}</td>
                    <td className="p-2 font-sans font-medium text-[#F4EFE6]">{item.description}</td>
                    <td className="p-2 text-right">{item.amount.toLocaleString('en-IN')}</td>
                    <td className="p-2 text-center font-sans">{item.gstRate}%</td>
                    <td className="p-2 text-right font-bold text-emerald-400">{item.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Point 10 Place of Supply & Tax Mode Selector */}
        <div className="p-3 bg-[#0F1D33] rounded-lg border border-[#26395A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#A8A299]">Point 10 Tax Regime:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold ${
              isIntraState ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
            }`}>
              {isIntraState ? '24-Gujarat Intrastate (CGST 9% + SGST 9%)' : '27-Maharashtra Interstate (IGST 18%)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#A8A299]">Test Switch:</span>
            <button
              type="button"
              onClick={() => setTestStateMode('Gujarat')}
              className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${
                testStateMode === 'Gujarat' ? 'bg-[#E88B2A] text-[#0A1628]' : 'bg-[#16263F] text-[#A8A299]'
              }`}
            >
              Gujarat (CGST ₹1,620 + SGST ₹1,620)
            </button>
            <button
              type="button"
              onClick={() => setTestStateMode('Maharashtra')}
              className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${
                testStateMode === 'Maharashtra' ? 'bg-sky-500 text-slate-950' : 'bg-[#16263F] text-[#A8A299]'
              }`}
            >
              Maharashtra (IGST ₹3,240)
            </button>
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] grid grid-cols-2 gap-4 font-mono">
          <div className="text-[11px] space-y-1">
            <div><span className="font-sans text-[#A8A299]">Subtotal (Taxable):</span> ₹{subtotal.toLocaleString('en-IN')}</div>
            {isIntraState ? (
              <>
                <div><span className="font-sans text-[#A8A299]">CGST 9% (Gujarat Intra-State):</span> ₹{cgstAmount.toLocaleString('en-IN')}</div>
                <div><span className="font-sans text-[#A8A299]">SGST 9% (Gujarat Intra-State):</span> ₹{sgstAmount.toLocaleString('en-IN')}</div>
              </>
            ) : (
              <div><span className="font-sans text-[#A8A299]">IGST 18% (Maharashtra Inter-State):</span> ₹{igstAmount.toLocaleString('en-IN')}</div>
            )}
            <div className="text-[10px] text-emerald-400 font-sans">
              LUT Export Freight SAC 996521 taxed @ 0% • THC & Doc Fee taxed @ 18%
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <span className="font-sans text-[10px] text-[#A8A299] uppercase font-bold">Grand Total (INR):</span>
            <span className="text-2xl font-bold text-[#E88B2A]">{formatINR(grandTotal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-[#16263F] text-[#A8A299]">
            Cancel
          </button>
          <button
            onClick={() => handleSaveInvoice(false)}
            className="px-4 py-1.5 rounded bg-[#16263F] border border-[#26395A] text-[#F4EFE6] font-semibold"
          >
            Save Invoice
          </button>
          <button
            onClick={() => handleSaveInvoice(true)}
            className="px-5 py-1.5 rounded font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20"
          >
            Generate Tax Invoice PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};
