import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryOrderItem } from '../../types';
import {
  FileCheck,
  Plus,
  Download,
  Printer,
  Share2,
  Calendar,
  Building2,
  Ship,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  Boxes,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { WhatsAppPreviewModal } from '../../components/common/WhatsAppPreviewModal';

interface DeliveryOrderPageProps {
  onOpenNewDo: () => void;
}

export const DeliveryOrderPage: React.FC<DeliveryOrderPageProps> = ({ onOpenNewDo }) => {
  const { deliveryOrders, updateDeliveryOrder, setActivePrintDoc, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'pending' | 'expired' | 'delivered'>('all');
  const [selectedDoForWa, setSelectedDoForWa] = useState<DeliveryOrderItem | null>(null);

  // Filter Delivery Orders
  const filteredOrders = deliveryOrders.filter(d => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      d.doNumber.toLowerCase().includes(term) ||
      d.blNumber.toLowerCase().includes(term) ||
      d.consigneeName.toLowerCase().includes(term) ||
      d.deliverToParty.toLowerCase().includes(term) ||
      d.cfsName.toLowerCase().includes(term) ||
      d.vesselVoyage.toLowerCase().includes(term) ||
      d.containers.some(c => c.containerNumber.toLowerCase().includes(term));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'issued' && d.status === 'Issued') ||
      (statusFilter === 'pending' && d.status === 'Pending Charges') ||
      (statusFilter === 'expired' && d.status === 'Expired') ||
      (statusFilter === 'delivered' && d.status === 'Delivered');

    return matchSearch && matchStatus;
  });

  // KPI calculations
  const totalOrders = deliveryOrders.length;
  const activeValidCount = deliveryOrders.filter(d => d.status === 'Issued').length;
  const pendingChargesCount = deliveryOrders.filter(d => d.status === 'Pending Charges').length;
  const totalSecurityDeposit = deliveryOrders.reduce((acc, d) => acc + (d.securityDepositINR || 0), 0);

  const handleExtendValidity = (doId: string) => {
    updateDeliveryOrder(doId, {
      validTillDate: '31-10-2026',
      status: 'Issued'
    });
    showToast('success', 'DO Validity Extended', 'Extended validity by 7 days to 31 Oct 2026.');
  };

  const handleMarkDelivered = (doId: string) => {
    updateDeliveryOrder(doId, {
      status: 'Delivered'
    });
    showToast('success', 'Cargo Delivered', 'Empty container return window countdown initiated.');
  };

  const exportRegisterCsv = () => {
    const headers = 'DO Number,DO Date,BL Number,Vessel Voyage,Arrival Date,POL,POD,Destuffing,CFS,Consignee,Deliver To,Containers,Gross Wt,Status,Valid Till,Security Deposit (INR)\n';
    const rows = filteredOrders.map(d =>
      `"${d.doNumber}","${d.doDate}","${d.blNumber}","${d.vesselVoyage.replace(/"/g, '""')}","${d.arrivalDate}","${d.loadPort}","${d.dischargePort}","${d.destuffingType}","${d.cfsName.replace(/"/g, '""')}","${d.consigneeName.replace(/"/g, '""')}","${d.deliverToParty.replace(/"/g, '""')}","${d.containers.map(c => c.containerNumber).join('; ')}","${d.totalGrossWt}","${d.status}","${d.validTillDate}","${d.securityDepositINR}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Delivery_Orders_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('success', 'DO Register Exported', 'Delivery orders register exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Delivery Order (DO) Issuance
              </h1>
              <p className="text-xs text-[#A8A299]">
                Gandhidham • Mundra Port CFS Release & Empty Container Return Clearance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportRegisterCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16263F] hover:bg-[#1D3251] text-xs font-semibold text-[#F4EFE6] border border-[#26395A] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#A8A299]" />
            <span>Export Register</span>
          </button>

          <button
            onClick={onOpenNewDo}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-xs font-bold text-[#0A1628] shadow-md shadow-[#E88B2A]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue Delivery Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Total DOs Issued</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{totalOrders}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Mundra Port import corridor</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Active & Valid</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">{activeValidCount}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Cleared for CFS gate-out</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Pending Payment / D&D</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-[#E88B2A]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#E88B2A] font-mono">{pendingChargesCount}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">THC / security deposit due</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Security Deposit Held</span>
            <span className="p-1.5 rounded-lg bg-teal-950/60 text-teal-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-teal-400 font-mono">
            {formatINR(totalSecurityDeposit)}
          </span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Refundable on empty return</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'issued', label: 'Issued (Valid)' },
            { id: 'pending', label: 'Pending Charges' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'expired', label: 'Expired' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#E88B2A] text-[#0A1628]'
                  : 'bg-[#16263F] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search DO#, BL#, Consignee, Container..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>
      </div>

      {/* Delivery Orders List */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">DO Number & Date</th>
                <th className="p-3.5">B/L Particulars</th>
                <th className="p-3.5">Consignee & Deliver-To</th>
                <th className="p-3.5">Vessel / Voyage</th>
                <th className="p-3.5">CFS / Terminal</th>
                <th className="p-3.5">Containers (Validity)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#A8A299]">
                    <FileCheck className="w-8 h-8 text-[#6E6A64] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-[#F4EFE6]">No Delivery Orders Found</p>
                    <p className="text-xs text-[#6E6A64] mt-0.5">Click "+ Issue Delivery Order" above to create one.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((doItem, idx) => (
                  <tr key={`${doItem.id || doItem.doNumber}-${idx}`} className="hover:bg-[#16263F]/50 transition-colors">
                    {/* DO Number & Date */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#E88B2A] text-xs">
                          {doItem.doNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#A8A299] font-mono block mt-0.5">
                        Date: {doItem.doDate}
                      </span>
                    </td>

                    {/* B/L Particulars */}
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[#F4EFE6] block">
                        {doItem.blNumber}
                      </span>
                      <span className="text-[10px] text-teal-400 font-semibold block">
                        {doItem.destuffingType}
                      </span>
                    </td>

                    {/* Consignee & Deliver To */}
                    <td className="p-3.5 max-w-[200px]">
                      <span className="font-bold text-[#F4EFE6] block truncate" title={doItem.consigneeName}>
                        {doItem.consigneeName}
                      </span>
                      <span className="text-[10px] text-[#A8A299] block truncate mt-0.5" title={doItem.deliverToParty}>
                        Bearer: {doItem.deliverToParty.split(' or bearer')[0]}
                      </span>
                    </td>

                    {/* Vessel / Voyage */}
                    <td className="p-3.5">
                      <span className="font-semibold text-[#F4EFE6] block">
                        {doItem.vesselVoyage}
                      </span>
                      <span className="text-[10px] text-[#A8A299] block font-mono">
                        POD: {doItem.dischargePort} • Arr: {doItem.arrivalDate}
                      </span>
                    </td>

                    {/* CFS / Terminal */}
                    <td className="p-3.5">
                      <span className="font-semibold text-[#F4EFE6] block">
                        {doItem.cfsName.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-[#A8A299] block">
                        Empty to: {doItem.emptyReturnDepot.split(' ')[0]}
                      </span>
                    </td>

                    {/* Containers & Validity */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {doItem.containers.map((c, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="font-bold text-[#F4EFE6]">{c.containerNumber}</span>
                            <span className="px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800 text-[#E88B2A] text-[9px] font-bold">
                              {c.sizeType}
                            </span>
                          </div>
                        ))}
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          Valid Till: {doItem.validTillDate}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          doItem.status === 'Issued'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : doItem.status === 'Pending Charges'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : doItem.status === 'Delivered'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {doItem.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View / Download DO PDF */}
                        <button
                          onClick={() => setActivePrintDoc({ type: 'DO', data: doItem })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
                          title="View and Download official PDF Delivery Order"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View & Download DO</span>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => setSelectedDoForWa(doItem)}
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 transition-colors"
                          title="Dispatch Delivery Order via WhatsApp to CHA/Consignee"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Extend Validity */}
                        {doItem.status !== 'Delivered' && (
                          <button
                            onClick={() => handleExtendValidity(doItem.id)}
                            className="px-2 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-[#A8A299] hover:text-[#F4EFE6] text-xs transition-colors"
                            title="Extend DO Validity by 7 Days"
                          >
                            +7d
                          </button>
                        )}

                        {/* Mark Delivered */}
                        {doItem.status === 'Issued' && (
                          <button
                            onClick={() => handleMarkDelivered(doItem.id)}
                            className="p-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-800 text-teal-400 transition-colors"
                            title="Mark Cargo Delivered to Consignee"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Dispatch Modal */}
      {selectedDoForWa && (
        <WhatsAppPreviewModal
          isOpen={!!selectedDoForWa}
          onClose={() => setSelectedDoForWa(null)}
          recipientName={selectedDoForWa.consigneeName}
          phoneNumber="+91 98250 88992"
          docTitle={`Delivery Order ${selectedDoForWa.doNumber}`}
          defaultMessage={`Dear ${selectedDoForWa.consigneeName},\n\nOfficial Delivery Order (DO) *${selectedDoForWa.doNumber}* has been issued for your import consignment.\n\n📄 *B/L No:* ${selectedDoForWa.blNumber}\n🚢 *Vessel/Voyage:* ${selectedDoForWa.vesselVoyage}\n📍 *Discharge Port:* ${selectedDoForWa.dischargePort}\n🏢 *Destination CFS:* ${selectedDoForWa.cfsName}\n📦 *Containers:* ${selectedDoForWa.containers.map(c => c.containerNumber).join(', ')}\n⏳ *DO Valid Till:* ${selectedDoForWa.validTillDate}\n\nEmpty containers must be returned to *${selectedDoForWa.emptyReturnDepot}* within DO validity.\n\nDownload verified DO document:\nhttps://mapsnvocc.in/tracking/do/${selectedDoForWa.doNumber}\n\nWarm regards,\n*MAPS Freight Solutions Pvt Ltd, Gandhidham*`}
        />
      )}
    </div>
  );
};
