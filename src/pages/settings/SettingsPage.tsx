import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Building2, CreditCard, Hash, Cable, ShieldCheck, Check, Image, Upload, FileText, Download, User, Search, History, Eye, Trash2, Lock } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { DEFAULT_CARRIER_SEAL_SVG, processImageFile } from '../../utils/imageUtils';

export const SettingsPage: React.FC = () => {
  const { firmDetails, updateFirmDetails, auditLogs, showToast, currentUser, companySeal, setCompanySeal } = useApp();

  const [activeTab, setActiveTab] = useState<'firm' | 'branding' | 'audit' | 'bank' | 'numbering' | 'integrations' | 'subscription' | 'branches' | 'approvals'>('firm');
  const [logoPreview, setLogoPreview] = useState<string | null>(() => localStorage.getItem('maps_firm_logo') || null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(() => localStorage.getItem('maps_firm_signature') || null);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditModule, setSelectedAuditModule] = useState('ALL');

  // Firm Editable State (GSTIN is strictly immutable)
  const [legalName, setLegalName] = useState(firmDetails.legalName);
  const [tradeName, setTradeName] = useState(firmDetails.tradeName);
  const [iec, setIec] = useState(firmDetails.iec);
  const [registeredAddress, setRegisteredAddress] = useState(firmDetails.registeredAddress);
  const [phone, setPhone] = useState(firmDetails.phone || '');
  const [email, setEmail] = useState(firmDetails.email || '');
  const [website, setWebsite] = useState(firmDetails.website || '');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.entityId.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesModule = selectedAuditModule === 'ALL' || log.module === selectedAuditModule;
    return matchesSearch && matchesModule;
  });

  const exportAuditCsv = () => {
    const headers = 'Timestamp,User,Action,Module,EntityID,Details\n';
    const rows = filteredLogs.map(l => `"${l.timestamp}","${l.user}","${l.action}","${l.module}","${l.entityId}","${l.details.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAPS_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('success', 'Audit Log Exported', 'Downloaded CSV history');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#E88B2A]" />
            Tenant Firm Settings & System Admin
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Legal identity, custom branding, audit trail, multi-currency bank accounts, and port API integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1C2D4A] pb-1 overflow-x-auto text-xs">
        {[
          { id: 'firm', label: 'Firm Identity & Tax' },
          { id: 'branding', label: 'Firm Branding & Letterhead' },
          { id: 'audit', label: `Audit Log (${auditLogs.length})` },
          { id: 'bank', label: 'Bank Accounts & UPI' },
          { id: 'numbering', label: 'Document Numbering Series' },
          { id: 'integrations', label: 'Integrations & Port APIs' },
          { id: 'branches', label: 'Branch Management (4)' },
          { id: 'approvals', label: 'Approval Chains Config' },
          { id: 'subscription', label: 'Subscription Plan (Growth)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-[#16263F] text-[#E88B2A] border-b-2 border-[#E88B2A]'
                : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FIRM */}
      {activeTab === 'firm' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Registered Business Entity Profile
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Legal Entity Name</label>
              <input
                type="text"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] font-semibold focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Brand / Trade Name</label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] focus:outline-hidden"
              />
            </div>

            {/* GSTIN: STRICTLY IMMUTABLE / LOCKED */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#A8A299] font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>GSTIN Number</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                  LOCKED (Statutory Anchor)
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={firmDetails.gstin || '24AARCM6698J1ZK'}
                  className="w-full bg-[#0B1424] border border-[#21375B] rounded-lg p-2 text-[#C5BFA9] font-mono font-bold opacity-80 cursor-not-allowed select-all"
                />
              </div>
              <span className="text-[10px] text-[#8C877D] mt-1 block">
                GSTIN is permanently anchored to this business entity for GST / e-Way bill & customs compliance. It cannot be edited.
              </span>
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Importer Exporter Code (IEC)</label>
              <input
                type="text"
                value={iec}
                onChange={e => setIec(e.target.value.toUpperCase())}
                className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] font-mono uppercase focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Official Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 2836 123456"
                className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Official Invoicing Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="accounts@mapsfreight.com"
                className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold">Registered Office Address</label>
            <textarea
              value={registeredAddress}
              onChange={e => setRegisteredAddress(e.target.value)}
              rows={2}
              className="w-full bg-[#16263F] border border-[#26395A] focus:border-[#E88B2A] rounded-lg p-2 text-[#F4EFE6] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                updateFirmDetails({
                  legalName,
                  tradeName,
                  iec,
                  registeredAddress,
                  phone,
                  email,
                  website
                });
                showToast('success', 'Firm Details Saved', 'Company identity updated across all HBLs, manifests & invoices.');
              }}
              className="px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs transition-colors shadow-md shadow-[#E88B2A]/20 cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: FIRM BRANDING & LETTERHEAD */}
      {activeTab === 'branding' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <div>
              <span className="font-bold text-sm text-[#F4EFE6] block">
                Custom Firm Branding, Letterhead & Digital Signatures
              </span>
              <p className="text-[11px] text-[#A8A299]">
                These assets are automatically embedded into your generated HBLs, GST Tax Invoices, Quotations, and Container Gate Passes
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
              Active on PDFs & Invoices
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Asset 1: Company Logo */}
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-xs text-[#F4EFE6] flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-[#E88B2A]" />
                  Company Logo (Header)
                </span>
                <p className="text-[10px] text-[#A8A299] mt-1">
                  High-res logo for header & customer tracking portal. Recommended 400x120px transparent PNG.
                </p>

                <div className="mt-3 aspect-video bg-[#0F1D33] border-2 border-dashed border-[#26395A] rounded-lg flex flex-col items-center justify-center p-3 text-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="max-h-16 object-contain" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E88B2A] to-[#B06010] flex items-center justify-center font-black text-slate-950 text-sm shadow">
                        MAPS
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-xs text-[#F4EFE6] block">MAPS NVOCC</span>
                        <span className="text-[9px] text-[#A8A299]">Gandhidham, Gujarat</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1D33] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold cursor-pointer transition-colors text-center">
                  <Upload className="w-3.5 h-3.5 text-[#E88B2A]" />
                  Upload New Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processImageFile(file);
                          setLogoPreview(dataUrl);
                          localStorage.setItem('maps_firm_logo', dataUrl);
                          showToast('success', 'Logo Uploaded', 'New firm logo applied to documents.');
                        } catch {
                          showToast('error', 'Upload Error', 'Could not process logo file.');
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Asset 2: Official Company Seal (Printed on HBL) */}
            <div className="bg-[#16263F] border border-[#E88B2A]/50 shadow-md shadow-[#E88B2A]/5 rounded-xl p-3.5 space-y-3 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#E88B2A] text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl uppercase">
                HBL Print Box
              </div>
              <div>
                <span className="font-bold text-xs text-[#F4EFE6] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#E88B2A]" />
                  Company Seal (HBL)
                </span>
                <p className="text-[10px] text-[#A8A299] mt-1">
                  Printed in the designated Carrier Seal box in the top-right quadrant of House Bills of Lading.
                </p>

                <div className="mt-3 aspect-video bg-white border-2 border-dashed border-[#26395A] rounded-lg flex flex-col items-center justify-center p-2 text-center shadow-inner overflow-hidden">
                  <img
                    src={companySeal || DEFAULT_CARRIER_SEAL_SVG}
                    alt="Company Seal on HBL"
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-slate-950 font-bold cursor-pointer transition-colors text-center text-xs shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  {companySeal ? 'Change HBL Seal' : 'Upload HBL Seal'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processImageFile(file);
                          setCompanySeal(dataUrl);
                          showToast('success', 'Company Seal Linked', 'Image updated and ready to print in HBL box.');
                        } catch {
                          showToast('error', 'Upload Error', 'Could not process seal image.');
                        }
                      }
                    }}
                  />
                </label>

                {companySeal && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanySeal(null);
                      showToast('info', 'Seal Reset', 'Default official carrier seal restored for HBL.');
                    }}
                    className="w-full flex items-center justify-center gap-1 text-[10px] text-rose-300 hover:text-rose-200 py-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset to Default Seal
                  </button>
                )}
              </div>
            </div>

            {/* Asset 3: Letterhead Artwork */}
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-xs text-[#F4EFE6] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Letterhead Artwork / Border
                </span>
                <p className="text-[10px] text-[#A8A299] mt-1">
                  Official letterhead border with ISO 9001 and Gandhidham Chamber of Commerce badge.
                </p>

                <div className="mt-3 aspect-video bg-[#0F1D33] border-2 border-dashed border-[#26395A] rounded-lg flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-full h-full border border-sky-800/40 rounded p-2 flex flex-col justify-between bg-sky-950/10">
                    <div className="h-2 bg-gradient-to-r from-[#E88B2A] to-sky-500 rounded-sm"></div>
                    <span className="text-[9px] text-[#A8A299] font-mono">MAPS FREIGHT SOLUTIONS PVT LTD • GANDHIDHAM</span>
                    <div className="h-1 bg-[#26395A] rounded-sm"></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1D33] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold cursor-pointer transition-colors text-center">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  Upload Letterhead
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={() => showToast('success', 'Letterhead Updated', 'Letterhead frame applied.')}
                  />
                </label>
              </div>
            </div>

            {/* Asset 4: Authorized Signatory Stamp & Signature */}
            <div className="bg-[#16263F] border border-[#26395A] rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-xs text-[#F4EFE6] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Authorized Signature Stamp
                </span>
                <p className="text-[10px] text-[#A8A299] mt-1">
                  Digital signature and agent endorsement stamp for the signing block.
                </p>

                <div className="mt-3 aspect-video bg-[#0F1D33] border-2 border-dashed border-[#26395A] rounded-lg flex flex-col items-center justify-center p-3 text-center">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Signature Preview" className="max-h-16 object-contain" />
                  ) : (
                    <div className="space-y-1">
                      <div className="font-serif italic text-base text-sky-300 font-bold border-b border-sky-400/40 pb-0.5">
                        Aman Dana
                      </div>
                      <div className="text-[8px] font-mono text-[#E88B2A] border border-[#E88B2A]/40 px-1 rounded inline-block">
                        MAPS FREIGHT (SEAL #MUN-7712)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1D33] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold cursor-pointer transition-colors text-center">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Upload Signature Stamp
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processImageFile(file);
                          setSignaturePreview(dataUrl);
                          localStorage.setItem('maps_firm_signature', dataUrl);
                          showToast('success', 'Signature Stamp Saved', 'Authorized stamp linked to HBL printing.');
                        } catch {
                          showToast('error', 'Upload Error', 'Could not process signature file.');
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG VIEWER */}
      {activeTab === 'audit' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1C2D4A]">
            <div>
              <span className="font-bold text-sm text-[#F4EFE6] block">
                System Audit Trail & Compliance Ledger
              </span>
              <p className="text-[11px] text-[#A8A299]">
                Immutable record of every user action, status transition, payment, and document upload
              </p>
            </div>

            <button
              onClick={exportAuditCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-[#F4EFE6] border border-[#26395A] font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-[#E88B2A]" />
              Export Audit Trail (CSV)
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by keyword, entity ID, user, or details..."
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6]"
              />
            </div>

            <div className="flex items-center gap-1">
              {['ALL', 'Shipments', 'HBL', 'Invoicing', 'Vault', 'Automation Engine'].map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedAuditModule(m)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedAuditModule === m
                      ? 'bg-[#E88B2A] text-[#0A1628]'
                      : 'bg-[#16263F] text-[#A8A299] hover:text-[#F4EFE6]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Audit List Table */}
          <div className="border border-[#26395A] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#16263F] text-[#A8A299] font-semibold border-b border-[#26395A]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] font-mono">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#16263F]/50">
                    <td className="p-3 text-[#A8A299] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 text-[#F4EFE6] font-semibold font-sans">{log.user}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.2 rounded bg-[#16263F] text-[#E88B2A] border border-[#26395A] text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-sans font-medium text-[#F4EFE6]">{log.action}</td>
                    <td className="p-3 text-[#E88B2A] font-bold">{log.entityId}</td>
                    <td className="p-3 font-sans text-[#A8A299] max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BANK */}
      {activeTab === 'bank' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Designated Freight Remittance Bank Accounts
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {firmDetails.bankAccounts.map(b => (
              <div key={b.id} className="p-4 rounded-xl bg-[#16263F] border border-[#26395A] space-y-2 font-mono">
                <div className="flex items-center justify-between font-sans">
                  <h3 className="font-bold text-sm text-[#F4EFE6]">{b.bankName}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-bold">
                    Primary
                  </span>
                </div>
                <p className="text-[11px] font-sans text-zinc-300">{b.accountName}</p>
                <div className="pt-2 border-t border-[#1C2D4A] space-y-1 text-xs">
                  <div><span className="font-sans text-[#6E6A64]">A/c Number:</span> <strong>{b.accountNumber}</strong></div>
                  <div><span className="font-sans text-[#6E6A64]">IFSC:</span> {b.ifsc}</div>
                  <div><span className="font-sans text-[#6E6A64]">SWIFT:</span> {b.swift}</div>
                  <div><span className="font-sans text-[#6E6A64]">UPI ID:</span> <span className="text-[#E88B2A]">{b.upiId}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NUMBERING */}
      {activeTab === 'numbering' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Financial Year Automated Numbering Series (FY 2024-2025 / 2026-2027)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg">
              <span className="font-sans text-[10px] text-[#A8A299] uppercase font-bold block">House B/L (HBL) Format</span>
              <p className="font-bold text-sm text-[#E88B2A] mt-1">MAPS-HBL-24[SEQ]-01</p>
              <p className="font-sans text-[10px] text-[#6E6A64] mt-0.5">Consecutive numerical sequence</p>
            </div>
            <div className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg">
              <span className="font-sans text-[10px] text-[#A8A299] uppercase font-bold block">Tax Invoice Format</span>
              <p className="font-bold text-sm text-emerald-400 mt-1">MAPS/24-25/INV/[001]</p>
              <p className="font-sans text-[10px] text-[#6E6A64] mt-0.5">GSTN Section 31 compliant</p>
            </div>
            <div className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg">
              <span className="font-sans text-[10px] text-[#A8A299] uppercase font-bold block">Quotations Format</span>
              <p className="font-bold text-sm text-sky-400 mt-1">MAPS/QTN/24-25/[001]</p>
              <p className="font-sans text-[10px] text-[#6E6A64] mt-0.5">Annual rolling counter</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Third-Party Port, Customs & Accounting Gateway Connectors
          </span>

          <div className="space-y-2">
            {[
              { name: 'Tally Prime (XML/ODBC Sync)', desc: 'Real-time voucher sync for sales & ledger debits', status: 'Connected', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              { name: 'AiSensy WhatsApp Business API', desc: 'Port cutoff alerts and automated shipment tracking', status: 'Connected', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              { name: 'ICEGATE Customs EDI Portal', desc: 'Shipping bill verification and Let Export Order (LEO)', status: 'Connected', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              { name: 'Razorpay UPI Gateway', desc: 'Instant customer payments with automated ledger credit', status: 'Active', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              { name: 'Container Control & Liner EDI', desc: 'Real-time container movement tracking with Maersk/MSC', status: 'Synced', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              { name: 'PCS 1x National Port Community System', desc: 'Mundra & Kandla Port gate-in automation', status: 'Ready Q1 2027', badge: 'bg-sky-950 text-sky-300 border-sky-800' }
            ].map((conn, idx) => (
              <div key={idx} className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#F4EFE6]">{conn.name}</h4>
                  <p className="text-[11px] text-[#A8A299]">{conn.desc}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${conn.badge}`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <div>
              <span className="font-bold text-sm text-[#F4EFE6]">Current Plan: MAPS Growth Plan</span>
              <p className="text-[11px] text-[#A8A299]">Active subscription billed monthly</p>
            </div>
            <span className="text-xl font-bold font-mono text-[#E88B2A]">₹25,000 / month</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {[
              { title: 'Starter Plan', price: '₹5,000/mo', sub: '1-3 Users • 50 Shipments', active: false },
              { title: 'Growth Plan', price: '₹25,000/mo', sub: '5-10 Users • 200 Shipments', active: true, tag: 'MOST POPULAR' },
              { title: 'Pro Plan', price: '₹40,000/mo', sub: '10-30 Users • Unlimited Jobs', active: false },
              { title: 'Enterprise', price: 'Custom', sub: '30+ Users • Dedicated Support', active: false }
            ].map((p, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  p.active ? 'bg-[#16263F] border-[#E88B2A] ring-2 ring-[#E88B2A]/20' : 'bg-[#16263F]/50 border-[#26395A]'
                }`}
              >
                <div>
                  {p.tag && <span className="px-1.5 py-0.2 rounded bg-[#E88B2A] text-[#0A1628] font-bold text-[9px] mb-1 inline-block">{p.tag}</span>}
                  <h4 className="font-bold text-sm text-[#F4EFE6]">{p.title}</h4>
                  <p className="font-mono font-bold text-base text-[#E88B2A] mt-1">{p.price}</p>
                  <p className="text-[10px] text-[#A8A299] mt-1">{p.sub}</p>
                </div>
                <div className="pt-3 border-t border-[#1C2D4A] mt-3">
                  {p.active ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <Check className="w-3.5 h-3.5" /> Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => showToast('info', 'Plan Upgrade', 'Contact MAPS sales desk for immediate upgrade')}
                      className="w-full py-1 rounded bg-[#0F1D33] hover:bg-[#1D3251] text-[#F4EFE6] text-xs font-semibold"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: BRANCH MANAGEMENT */}
      {activeTab === 'branches' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <div>
              <span className="font-bold text-sm text-[#F4EFE6]">Operational Port Branches & Terminal Offices</span>
              <p className="text-[11px] text-[#A8A299]">4 active regional branches in Western India maritime corridor</p>
            </div>
            <button
              onClick={() => showToast('success', 'Branch Added', 'New branch location created.')}
              className="px-3 py-1.5 rounded-lg bg-[#E88B2A] text-[#0A1628] font-bold text-xs"
            >
              + Add Branch Office
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { code: 'GIM-HO', name: 'Gandhidham Head Office', role: 'Commercial & Financial HQ', address: 'Plot 45-48, Sector 9, Gandhidham, Kutch, Gujarat - 370201', ops: 'Deepak Merchant (VP)', gstin: '24AABCM9012E1Z8' },
              { code: 'MUN-OPS', name: 'Mundra Port Operations Desk', role: 'Gate-In, CFS & Port Examination', address: 'APSEZ Commercial Complex, Old Port Road, Mundra, Kutch - 370421', ops: 'Utsav Panchal (Ops Mgr)', gstin: '24AABCM9012E1Z8' },
              { code: 'IXY-OPS', name: 'Kandla Marine Terminal Hub', role: 'Bulk & Breakbulk Clearing', address: 'Near Oil Jetty Gate, Deendayal Port, Kandla, Gujarat - 370210', ops: 'Ketan Trivedi (Harbor Lead)', gstin: '24AABCM9012E1Z8' },
              { code: 'JNPT-OPS', name: 'Nhava Sheva / JNPT Liaison', role: 'Maharashtra Transhipment Hub', address: 'Sector 11, Dronagiri Node, Navi Mumbai, Maharashtra - 400707', ops: 'Ramesh Sawant (CHA Lead)', gstin: '27AABCM9012E1Z5' }
            ].map(b => (
              <div key={b.code} className="p-3.5 bg-[#16263F] border border-[#26395A] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#E88B2A] text-xs">{b.code}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                    Active
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#F4EFE6]">{b.name}</h4>
                <p className="text-[11px] text-zinc-300">{b.address}</p>
                <div className="pt-2 border-t border-[#1C2D4A] flex justify-between text-[10px] text-[#A8A299]">
                  <span>Lead: <strong className="text-[#F4EFE6]">{b.ops}</strong></span>
                  <span className="font-mono">GSTIN: {b.gstin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: APPROVAL CHAINS CONFIG */}
      {activeTab === 'approvals' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
            <div>
              <span className="font-bold text-sm text-[#F4EFE6]">Automated Multi-Level Approval Chains (RBAC)</span>
              <p className="text-[11px] text-[#A8A299]">Enforce policy gates before high-risk maritime operations execute</p>
            </div>
            <button
              onClick={() => showToast('success', 'Policy Saved', 'Approval matrix updated.')}
              className="px-3 py-1.5 rounded-lg bg-[#E88B2A] text-[#0A1628] font-bold text-xs"
            >
              Save Approval Policy
            </button>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Credit Limit Exception Approval', desc: 'Required when shipper booking value exceeds established trade credit threshold (>₹10,00,000)', approver: 'Super Admin or Finance Director', defaultAuto: false },
              { title: 'Delivery Order (DO) Release Waiver', desc: 'Allows releasing DO without ocean freight invoice clearance or unendorsed HBL', approver: 'Super Admin Only (Legal Lock)', defaultAuto: false },
              { title: 'Carrier Demurrage & Detention Tariff Discount', desc: 'Discounts on accrued container detention exceeding 15% of standard carrier daily slab', approver: 'Operations Head', defaultAuto: false },
              { title: 'Dangerous Goods (IMDG) Port Gate-In Clearance', desc: 'Mandatory verification of signed IMO Dangerous Goods Declaration prior to terminal gate pass', approver: 'Hazmat Compliance Officer', defaultAuto: true }
            ].map((chain, idx) => (
              <div key={idx} className="p-3 bg-[#16263F] border border-[#26395A] rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#F4EFE6]">{chain.title}</h4>
                  <p className="text-[11px] text-[#A8A299]">{chain.desc}</p>
                  <span className="text-[10px] text-amber-400 font-semibold block">Designated Approver: {chain.approver}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-950 border border-emerald-800">
                    Enforced (Gatekeeper)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
