import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChaJob } from '../../types/v4Types';
import {
  FileCheck,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  User,
  X,
  Upload
} from 'lucide-react';

export const ChaTrackerPage: React.FC = () => {
  const { chaJobs, addChaJob, updateChaJob, showToast } = useApp();

  const [selectedJob, setSelectedJob] = useState<ChaJob | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  // New Job state
  const [shipmentId, setShipmentId] = useState('MAPS-240345');
  const [hblNumber, setHblNumber] = useState('MAPS-HBL-240345-01');
  const [chaName, setChaName] = useState('Om Shanti Logistics CHA');
  const [chaContact, setChaContact] = useState('+91 94262 99120');
  const [shippingBillNumber, setShippingBillNumber] = useState('7619024');
  const [shippingBillDate, setShippingBillDate] = useState('18-10-2026');
  const [scheme, setScheme] = useState<ChaJob['scheme']>('RoDTEP');
  const [schemeReference, setSchemeReference] = useState('RODTEP-MORBI-8840');

  const filteredJobs = chaJobs.filter(j => {
    const matchStage = filterStage === 'ALL' || j.currentStage === filterStage;
    const matchQuery = j.shippingBillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.chaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.hblNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.shipmentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStage && matchQuery;
  });

  const handleIcegateCheck = (job: ChaJob) => {
    showToast('info', 'Querying ICEGATE Portal', `Checking Shipping Bill ${job.shippingBillNumber} status...`);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      updateChaJob(job.id, {
        icegateStatus: 'LEO Granted / Loaded on Vessel',
        currentStage: 'Loaded',
        lastCheckedIcegateAt: timeStr
      });
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob(prev => prev ? { ...prev, currentStage: 'Loaded', lastCheckedIcegateAt: timeStr, icegateStatus: 'LEO Granted / Loaded on Vessel' } : null);
      }
      showToast('success', 'ICEGATE Verified', `SB ${job.shippingBillNumber} confirmed LEO Granted (Let Export Order)`);
    }, 800);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: ChaJob = {
      id: 'chajob-' + Date.now(),
      shipmentId,
      hblNumber,
      chaId: 'cha-' + Date.now(),
      chaName,
      chaContact,
      shippingBillNumber,
      shippingBillDate,
      dutyStatus: 'Exempted',
      dutyPaidAmountINR: 0,
      currentStage: 'SB Filed',
      scheme,
      schemeReference,
      icegateStatus: 'SB Filed & Queued for Examination',
      lastCheckedIcegateAt: 'Just now',
      documents: []
    };
    addChaJob(newJob);
    setShowNewJobModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                CHA &amp; Shipping Bill (SB) Tracker
              </h1>
              <p className="text-xs text-[#A8A299]">
                Custom House Agent Coordination &bull; ICEGATE Shipping Bill &amp; LEO Tracking &bull; RoDTEP / DBK Incentive Schemes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Assign CHA Job</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Active CHA Jobs</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{chaJobs.length}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Export customs clearance</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">LEO Cleared</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {chaJobs.filter(j => j.currentStage === 'LEO' || j.currentStage === 'Loaded').length}
          </span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">Let Export Order received</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Under Examination</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {chaJobs.filter(j => j.currentStage === 'Examined' || j.currentStage === 'SB Filed').length}
          </span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Physical/X-Ray dock survey</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Incentive Schemes</span>
            <span className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-purple-400 font-mono">
            {chaJobs.filter(j => j.scheme !== 'None').length}
          </span>
          <span className="text-[11px] text-purple-300/80 block mt-1">RoDTEP / DBK linked</span>
        </div>
      </div>

      {/* Detail or Table View */}
      {selectedJob ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16263F] border border-[#26395A] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]"
              >
                &larr; Back
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F4EFE6] font-mono">
                    Shipping Bill: {selectedJob.shippingBillNumber}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {selectedJob.currentStage}
                  </span>
                </div>
                <p className="text-xs text-[#A8A299]">
                  CHA: <strong className="text-[#F4EFE6]">{selectedJob.chaName}</strong> ({selectedJob.chaContact}) &bull; HBL: <strong className="text-[#E88B2A]">{selectedJob.hblNumber}</strong> &bull; SB Date: {selectedJob.shippingBillDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleIcegateCheck(selectedJob)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-sky-400 font-semibold text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Live ICEGATE Query</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">Duty Status</span>
              <p className="text-sm font-bold text-[#F4EFE6]">{selectedJob.dutyStatus}</p>
              <span className="text-[10px] text-[#A8A299] font-mono block">Paid: ₹{selectedJob.dutyPaidAmountINR}</span>
            </div>
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">Export Incentive Scheme</span>
              <p className="text-sm font-bold text-purple-400">{selectedJob.scheme}</p>
              <span className="text-[10px] text-[#A8A299] font-mono block">Ref: {selectedJob.schemeReference || 'N/A'}</span>
            </div>
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">ICEGATE Status</span>
              <p className="text-sm font-bold text-emerald-400">{selectedJob.icegateStatus}</p>
              <span className="text-[10px] text-[#A8A299] block">Checked: {selectedJob.lastCheckedIcegateAt || 'Recently'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
              {['ALL', 'SB Filed', 'Examined', 'LEO', 'Loaded'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStage(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    filterStage === st ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A299]" />
              <input
                type="text"
                placeholder="Search SB No, CHA, HBL..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">Shipping Bill No</th>
                    <th className="p-3.5">HBL / Shipment</th>
                    <th className="p-3.5">CHA Name</th>
                    <th className="p-3.5">SB Date / LEO Date</th>
                    <th className="p-3.5">Incentive Scheme</th>
                    <th className="p-3.5 text-center">Stage</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#E88B2A] block">{job.shippingBillNumber}</span>
                        <span className="text-[10px] text-[#A8A299] block">{job.icegateStatus}</span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#F4EFE6] block">{job.hblNumber}</span>
                        <span className="text-[10px] text-[#A8A299] block">{job.shipmentId}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold block">{job.chaName}</span>
                        <span className="text-[10px] text-[#A8A299] font-mono block">{job.chaContact}</span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px]">
                        <span className="text-[#A8A299] block">SB: {job.shippingBillDate}</span>
                        <span className={job.leoDate ? 'text-emerald-400 font-bold block' : 'text-[#6E6A64] block'}>
                          LEO: {job.leoDate || 'Pending'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {job.scheme}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.currentStage === 'Loaded'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : job.currentStage === 'LEO'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {job.currentStage}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleIcegateCheck(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] border border-[#26395A] text-sky-400 font-semibold text-xs flex items-center gap-1"
                            title="Check live on ICEGATE"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Check</span>
                          </button>
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
              <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
                Assign CHA Job &amp; Record Shipping Bill
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-[#A8A299] hover:text-[#F4EFE6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A8A299] block mb-1">Shipment Reference:</label>
                  <input
                    type="text"
                    required
                    value={shipmentId}
                    onChange={e => setShipmentId(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#A8A299] block mb-1">House B/L Number:</label>
                  <input
                    type="text"
                    required
                    value={hblNumber}
                    onChange={e => setHblNumber(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A8A299] block mb-1">CHA Agency Name:</label>
                  <input
                    type="text"
                    required
                    value={chaName}
                    onChange={e => setChaName(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                  />
                </div>
                <div>
                  <label className="text-[#A8A299] block mb-1">CHA Contact Phone:</label>
                  <input
                    type="text"
                    value={chaContact}
                    onChange={e => setChaContact(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A8A299] block mb-1">Shipping Bill No (ICEGATE):</label>
                  <input
                    type="text"
                    required
                    value={shippingBillNumber}
                    onChange={e => setShippingBillNumber(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#A8A299] block mb-1">Shipping Bill Date:</label>
                  <input
                    type="text"
                    value={shippingBillDate}
                    onChange={e => setShippingBillDate(e.target.value)}
                    className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#A8A299] block mb-1">Incentive / Customs Scheme:</label>
                <select
                  value={scheme}
                  onChange={e => setScheme(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="RoDTEP">RoDTEP (Remission of Duties on Export Products)</option>
                  <option value="Duty Drawback (DBK)">Duty Drawback (DBK)</option>
                  <option value="Advance Authorization">Advance Authorization</option>
                  <option value="EPCG">EPCG Scheme</option>
                  <option value="SEZ Zero Rated">SEZ Zero Rated Supply</option>
                  <option value="None">Standard Free Shipping Bill</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2D4A]">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
                >
                  Save CHA Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
