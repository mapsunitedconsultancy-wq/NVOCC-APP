import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Party } from '../types';
import { Users, Plus, Star, Search, ShieldCheck, Mail, Phone, MapPin, Building2, CreditCard, ShieldAlert, Check } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { validateGSTIN, validatePAN, validateIEC } from '../utils/validators';
import { Modal } from '../components/common/Modal';

export const PartyMasterPage: React.FC = () => {
  const { parties, addParty, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const [showAddParty, setShowAddParty] = useState(false);
  const [newName, setNewName] = useState('Krishna Ceramics');
  const [newType, setNewType] = useState<any>('Shipper');
  const [newCity, setNewCity] = useState('Morbi');
  const [newGstin, setNewGstin] = useState('24AAKCK4521P1Z7');
  const [newPan, setNewPan] = useState('AAKCK4521P');
  const [newIec, setNewIec] = useState('AAKCK4521P');
  const [newEmail, setNewEmail] = useState('export@krishnaceramics.in');
  const [newPhone, setNewPhone] = useState('+919825012345');
  const [formError, setFormError] = useState<string | null>(null);

  const gstinCheck = validateGSTIN(newGstin);
  const panCheck = validatePAN(newPan);

  const filteredParties = parties.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gstin && p.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.pan && p.pan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.iec && p.iec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === 'all' || p.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchSearch && matchType;
  });

  const handleCreateParty = () => {
    if (!newName.trim()) {
      setFormError('Please enter party name.');
      return;
    }

    const isDomestic = newType !== 'Consignee' && newType !== 'Overseas Agent';
    if (isDomestic && newGstin) {
      if (!gstinCheck.isValid) {
        setFormError(gstinCheck.message || 'Invalid GSTIN check digit.');
        showToast('error', 'GSTIN Validation Failed', gstinCheck.message || 'Invalid GSTIN check digit');
        return;
      }
    }

    if (newPan && !panCheck.isValid) {
      setFormError(panCheck.message || 'Invalid PAN format.');
      showToast('error', 'PAN Validation Failed', panCheck.message || 'Invalid PAN format');
      return;
    }

    const newP: Party = {
      id: 'party-' + Date.now(),
      name: newName,
      code: newName.substring(0, 4).toUpperCase() + '-' + newCity.toUpperCase(),
      type: newType,
      country: isDomestic ? 'India' : 'Germany',
      city: newCity,
      state: 'Gujarat',
      address: `${newName} Industrial Complex, ${newCity}, Gujarat`,
      gstin: newGstin,
      pan: newPan || (newGstin ? newGstin.substring(2, 12) : undefined),
      iec: newIec,
      primaryContactName: 'Operations Lead',
      email: newEmail,
      phone: newPhone,
      creditTermsDays: 30,
      creditLimitINR: 5000000,
      outstandingBalanceINR: 0,
      rating: 5,
      lastTransactionDate: '15 Oct 2026',
      shipmentCount: 1
    };
    addParty(newP);
    setShowAddParty(false);
    setFormError(null);
    showToast('success', 'Party Registered', `${newName} added to Party Master CRM.`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#E88B2A]" />
            Party Master & CRM Registry
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            {parties.length} verified trade accounts (Shippers, Consignees, Carriers, CHAs & Overseas Agents)
          </p>
        </div>

        <button
          onClick={() => setShowAddParty(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          + Add Trade Party
        </button>
      </div>

      {/* Controls */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search party by name, city, GSTIN..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6]"
          >
            <option value="all">All Party Types</option>
            <option value="shipper">Shippers (Exporters)</option>
            <option value="consignee">Consignees (Importers)</option>
            <option value="carrier">Ocean Carriers</option>
            <option value="overseas agent">Overseas Agents</option>
            <option value="cha">Customs Brokers (CHA)</option>
            <option value="transporter">Transporters (Fleet)</option>
            <option value="cfs">CFS Operators</option>
          </select>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredParties.map(party => (
          <div
            key={party.id}
            onClick={() => setSelectedParty(party)}
            className="p-4 rounded-xl bg-[#0F1D33] border border-[#26395A] hover:border-[#E88B2A]/60 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[#E88B2A] uppercase tracking-wider">
                    {party.type}
                  </span>
                  <h3 className="font-bold text-sm text-[#F4EFE6] mt-0.5 group-hover:text-[#E88B2A] transition-colors">
                    {party.name}
                  </h3>
                  <p className="text-[11px] text-[#A8A299] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#6E6A64]" /> {party.city}, {party.country}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px] font-bold">{party.rating}.0</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-[#16263F] rounded border border-[#1C2D4A] space-y-1 font-mono text-[10px]">
                {party.gstin && (
                  <div className="flex justify-between">
                    <span className="font-sans text-[#6E6A64]">GSTIN:</span>
                    <span className="text-[#F4EFE6] font-bold">{party.gstin}</span>
                  </div>
                )}
                {party.vatTaxId && (
                  <div className="flex justify-between">
                    <span className="font-sans text-[#6E6A64]">Tax ID:</span>
                    <span className="text-[#F4EFE6] font-bold">{party.vatTaxId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-sans text-[#6E6A64]">Credit Limit:</span>
                  <span className="text-emerald-400 font-bold">{formatINR(party.creditLimitINR)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#1C2D4A] flex items-center justify-between text-[10px] text-[#6E6A64]">
              <span>{party.shipmentCount} Shipments</span>
              <span>Last: {party.lastTransactionDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Party Modal */}
      {showAddParty && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddParty(false)}
          title="Add New Trade Entity to CRM"
          subtitle="Record GSTIN, credit limits, and contact profiles for automated documentation"
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Legal Company Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Royal Vitrified Pvt Ltd"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Entity Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="Shipper">Shipper (Indian Exporter)</option>
                  <option value="Consignee">Consignee (Overseas Buyer)</option>
                  <option value="Overseas Agent">Overseas Destination Agent</option>
                  <option value="Carrier">Shipping Line (Carrier)</option>
                  <option value="CHA">Customs Broker (CHA)</option>
                  <option value="Transporter">Transporter / Drayage Fleet</option>
                  <option value="CFS Operator">CFS Operator / Terminal</option>
                </select>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">City</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>
            {/* Form Error Banner */}
            {formError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded-lg text-rose-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="text-xs text-rose-300 hover:text-white underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">GSTIN (15 Chars)</label>
                <input
                  type="text"
                  value={newGstin}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setNewGstin(val);
                    if (val.length >= 12) {
                      setNewPan(val.substring(2, 12));
                    }
                    setFormError(null);
                  }}
                  className={`w-full bg-[#16263F] border rounded-lg p-2 text-[#F4EFE6] font-mono ${
                    gstinCheck.isValid ? 'border-emerald-500/80' : 'border-rose-500'
                  }`}
                />
                <div className="mt-1 flex flex-col gap-1 text-[10px]">
                  {gstinCheck.isValid ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> Valid GSTIN (State: {gstinCheck.stateCode || '24'}, Check: {gstinCheck.expectedCheckDigit || 'OK'})
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold bg-rose-950/60 p-1 rounded border border-rose-800">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      {gstinCheck.message}
                    </span>
                  )}

                  {/* Testing Pack Quick Loaders */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[9px] text-[#A8A299]">Test:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewGstin('24AAKCK4521P1Z7');
                        setNewPan('AAKCK4521P');
                        setNewIec('AAKCK4521P');
                        setNewName('Krishna Ceramics');
                        setFormError(null);
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                    >
                      Valid (24AAKCK4521P1Z7)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewGstin('24AAKCK4521P1Z8');
                        setFormError(null);
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900"
                    >
                      Bad Checksum (...1Z8)
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Income Tax PAN</label>
                <input
                  type="text"
                  value={newPan}
                  onChange={e => {
                    setNewPan(e.target.value.toUpperCase());
                    setFormError(null);
                  }}
                  placeholder="e.g. AAKCK4521P"
                  className={`w-full bg-[#16263F] border rounded-lg p-2 text-[#F4EFE6] font-mono uppercase ${
                    panCheck.isValid ? 'border-[#26395A]' : 'border-rose-500'
                  }`}
                />
                <div className="mt-1 text-[10px]">
                  {panCheck.isValid && panCheck.entityType && (
                    <span className="text-emerald-400 font-semibold">{panCheck.entityType} Entity</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">DGFT IEC Code</label>
                <input
                  type="text"
                  value={newIec}
                  onChange={e => setNewIec(e.target.value.toUpperCase())}
                  placeholder="10-digit PAN/IEC"
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                onClick={() => setShowAddParty(false)}
                className="px-3 py-1.5 rounded bg-[#16263F] text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParty}
                className="px-4 py-1.5 rounded font-bold bg-[#E88B2A] text-[#0A1628]"
              >
                Save Party
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
