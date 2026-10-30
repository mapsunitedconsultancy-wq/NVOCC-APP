import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shipment, ShipmentStatus } from '../../types';
import { StatusPill } from '../../components/common/StatusPill';
import { formatINR } from '../../utils/formatters';
import {
  Ship,
  Plus,
  Download,
  Upload,
  LayoutList,
  Kanban,
  CalendarRange,
  Globe,
  Filter,
  Search,
  MoreVertical,
  Eye,
  FileText,
  MessageSquare,
  Trash2,
  Copy,
  ChevronDown,
  CheckSquare,
  Square,
  AlertTriangle,
  Pin
} from 'lucide-react';

interface ShipmentsPageProps {
  onOpenNewShipment: () => void;
  onSelectShipment: (id: string) => void;
}

export const ShipmentsPage: React.FC<ShipmentsPageProps> = ({
  onOpenNewShipment,
  onSelectShipment
}) => {
  const { shipments, deleteShipment, togglePinShipment, showToast, currentUser, viewParam } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline' | 'map'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sync drilldown filters from KPI clicks
  React.useEffect(() => {
    if (viewParam) {
      if (viewParam === 'filter:delayed') {
        setStatusFilter('delayed');
      } else if (viewParam === 'filter:active') {
        setStatusFilter('at_port');
      } else if (viewParam === 'filter:transit') {
        setStatusFilter('on_vessel');
      }
    }
  }, [viewParam]);

  // Filtered dataset
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.consigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.containers.some(c => c.containerNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.hblNo && s.hblNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || s.carrierName.toLowerCase().includes(carrierFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ['Shipment ID', 'Shipper', 'Consignee', 'POL', 'POD', 'Carrier', 'Vessel', 'Status', 'Container', 'ETD', 'ETA', 'Revenue INR'];
    const rows = filteredShipments.map(s => [
      s.id,
      `"${s.shipperName}"`,
      `"${s.consigneeName}"`,
      s.polName,
      s.podName,
      s.carrierName,
      `"${s.vesselName} ${s.voyageNumber}"`,
      s.status,
      s.containers[0]?.containerNumber || '',
      s.etd,
      s.eta,
      s.totalRevenueINR
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAPS_Shipments_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Export Generated', `Exported ${filteredShipments.length} shipments to CSV`);
  };

  // Kanban Columns
  const kanbanColumns: { status: ShipmentStatus; label: string }[] = [
    { status: 'booked', label: 'Booked' },
    { status: 'at_cfs', label: 'At CFS' },
    { status: 'at_port', label: 'Port Gate' },
    { status: 'loaded', label: 'Loaded' },
    { status: 'on_vessel', label: 'On Vessel' },
    { status: 'delayed', label: 'Delayed' },
    { status: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Ship className="w-6 h-6 text-[#E88B2A]" />
            Shipment Operations Management
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            {filteredShipments.length} active jobs • Export, Import & Cross-trade container tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-800/60 rounded-lg text-xs font-semibold text-amber-300">
              <span>{selectedIds.length} Selected</span>
              <button
                onClick={() => {
                  showToast('info', 'Bulk Action Triggered', `Status update notification queued for ${selectedIds.length} shipments.`);
                  setSelectedIds([]);
                }}
                className="ml-2 text-xs underline hover:text-white"
              >
                Send Updates
              </button>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#A8A299]" />
            Export CSV
          </button>

          <button
            onClick={onOpenNewShipment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + New Shipment
          </button>
        </div>
      </div>

      {/* 2. Filters & View Switchers */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm text-xs">
        {/* Search & Filter Toggles */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by ID, container #, shipper, vessel..."
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-[#E88B2A]/20 text-[#E88B2A] border-[#E88B2A]' : 'bg-[#16263F] text-[#A8A299] border-[#26395A]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1 bg-[#16263F] p-1 rounded-lg border border-[#26395A]">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'table' ? 'bg-[#E88B2A] text-[#0A1628] font-bold' : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'kanban' ? 'bg-[#E88B2A] text-[#0A1628] font-bold' : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Board
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'timeline' ? 'bg-[#E88B2A] text-[#0A1628] font-bold' : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" /> Timeline
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'map' ? 'bg-[#E88B2A] text-[#0A1628] font-bold' : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Map
          </button>
        </div>
      </div>

      {/* Collapsible Filter Drawer */}
      {showFilters && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in">
          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold uppercase text-[10px]">Shipment Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-1.5 text-[#F4EFE6]"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="at_cfs">At CFS</option>
              <option value="at_port">At Port</option>
              <option value="loaded">Loaded</option>
              <option value="on_vessel">On Vessel</option>
              <option value="discharged">Discharged</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A8A299] mb-1 font-semibold uppercase text-[10px]">Carrier Line</label>
            <select
              value={carrierFilter}
              onChange={e => setCarrierFilter(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-1.5 text-[#F4EFE6]"
            >
              <option value="all">All Carriers</option>
              <option value="MSC">MSC</option>
              <option value="Maersk">Maersk Line</option>
              <option value="CMA">CMA CGM</option>
              <option value="ONE">ONE</option>
              <option value="Hapag">Hapag-Lloyd</option>
            </select>
          </div>

          <div className="col-span-2 flex items-end justify-end">
            <button
              onClick={() => { setStatusFilter('all'); setCarrierFilter('all'); setSearchTerm(''); }}
              className="text-xs text-[#E88B2A] hover:underline pb-1.5"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* 3. VIEW MODE 1: TABLE */}
      {viewMode === 'table' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold tracking-wider uppercase text-[10px]">
                <tr>
                  <th className="p-3 w-8 text-center">
                    <button onClick={toggleSelectAll}>
                      {selectedIds.length === filteredShipments.length && filteredShipments.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#E88B2A]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#6E6A64]" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Shipper (Morbi/Kutch)</th>
                  <th className="p-3">Consignee</th>
                  <th className="p-3">POL → POD</th>
                  <th className="p-3">Container (ISO 6346)</th>
                  <th className="p-3">Vessel & Voyage</th>
                  <th className="p-3">ETD / ETA</th>
                  <th className="p-3">Assigned</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] font-mono">
                {filteredShipments.map(shipment => {
                  const isSelected = selectedIds.includes(shipment.id);

                  return (
                    <tr
                      key={shipment.id}
                      onClick={() => onSelectShipment(shipment.id)}
                      className={`hover:bg-[#16263F]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#16263F]/70' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelectOne(shipment.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#E88B2A]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6E6A64]" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-[#E88B2A]">
                        {shipment.id}
                        {shipment.isPinned && (
                          <Pin className="w-3 h-3 text-[#E88B2A] inline ml-1 fill-current" />
                        )}
                      </td>
                      <td className="p-3 font-sans">
                        <StatusPill status={shipment.status} size="xs" pulse={shipment.status === 'on_vessel' || shipment.status === 'delayed'} />
                      </td>
                      <td className="p-3 font-sans font-medium text-[#F4EFE6]">
                        {shipment.shipperName}
                      </td>
                      <td className="p-3 font-sans text-[#A8A299]">
                        {shipment.consigneeName} ({shipment.consigneeCountry})
                      </td>
                      <td className="p-3 font-sans text-slate-300">
                        {shipment.polCode} → <span className="text-sky-400 font-bold">{shipment.podCode}</span>
                      </td>
                      <td className="p-3 text-[#F4EFE6]">
                        {shipment.containers[0]?.containerNumber || 'TBD'}
                        <span className="text-[10px] text-[#A8A299] block font-sans">
                          {shipment.containers[0]?.equipmentType || "40'HC"}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-300">
                        {shipment.vesselName}
                        <span className="text-[10px] text-[#6E6A64] block font-mono">
                          {shipment.voyageNumber} ({shipment.carrierScac})
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {shipment.etd.split(' ')[0]} {shipment.etd.split(' ')[1]}
                        <span className="text-[10px] text-sky-400 block font-mono">
                          ETA {shipment.eta.split(' ')[0]} {shipment.eta.split(' ')[1]}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-zinc-400 text-[11px]">
                        {shipment.assignedTo}
                      </td>
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectShipment(shipment.id)}
                            className="p-1 rounded hover:bg-[#1D3251] text-[#A8A299] hover:text-[#F4EFE6]"
                            title="View Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'super_admin' && (
                            <button
                              onClick={() => deleteShipment(shipment.id)}
                              className="p-1 rounded hover:bg-rose-950 text-[#6E6A64] hover:text-rose-400"
                              title="Delete (Super Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 overflow-x-auto pb-4 text-xs">
          {kanbanColumns.map(col => {
            const colShipments = filteredShipments.filter(s => s.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col min-w-[220px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A] mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#F4EFE6]">
                    {col.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#16263F] text-[#E88B2A] font-mono font-bold">
                    {colShipments.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colShipments.map(s => (
                    <div
                      key={s.id}
                      onClick={() => onSelectShipment(s.id)}
                      className="p-2.5 rounded-lg bg-[#16263F] border border-[#1C2D4A] hover:border-[#E88B2A]/60 cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#E88B2A] group-hover:underline">
                          {s.id}
                        </span>
                        <span className="text-[10px] text-[#A8A299] font-mono">{s.podCode}</span>
                      </div>
                      <p className="font-semibold text-xs text-[#F4EFE6] mt-1 line-clamp-1">{s.shipperName}</p>
                      <p className="text-[10px] text-[#A8A299] mt-0.5 line-clamp-1">To: {s.consigneeName}</p>
                      
                      <div className="mt-2 pt-1.5 border-t border-[#1C2D4A] flex items-center justify-between text-[10px] text-[#6E6A64]">
                        <span>{s.containers[0]?.equipmentType || "40'HC"}</span>
                        <span>ETA: {s.eta.split(' ')[0]} {s.eta.split(' ')[1]}</span>
                      </div>
                    </div>
                  ))}
                  {colShipments.length === 0 && (
                    <div className="p-4 text-center text-[10px] text-[#6E6A64] border border-dashed border-[#1C2D4A] rounded-lg">
                      No active jobs
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE 3: TIMELINE GANTT */}
      {viewMode === 'timeline' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3 text-xs">
          <div className="pb-2 border-b border-[#1C2D4A] flex justify-between items-center">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Voyage Lifecycle Gantt Tracker (October - November 2026)
            </span>
            <span className="text-[10px] text-[#A8A299]">X-Axis: Days in transit</span>
          </div>

          <div className="space-y-3">
            {filteredShipments.slice(0, 8).map(s => (
              <div key={s.id} onClick={() => onSelectShipment(s.id)} className="cursor-pointer group">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-mono font-bold text-[#E88B2A] group-hover:underline">
                    {s.id} • {s.shipperName} → {s.podName}
                  </span>
                  <span className="text-[#A8A299]">Vessel: {s.vesselName} ({s.statusLabel})</span>
                </div>
                <div className="w-full bg-[#16263F] h-4 rounded-full overflow-hidden flex items-center p-0.5">
                  <div
                    style={{ width: s.status === 'delivered' ? '100%' : s.status === 'on_vessel' ? '65%' : s.status === 'loaded' ? '35%' : '15%' }}
                    className={`h-full rounded-full transition-all ${
                      s.status === 'delivered'
                        ? 'bg-emerald-500'
                        : s.status === 'delayed'
                        ? 'bg-rose-500'
                        : 'bg-[#E88B2A]'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. VIEW MODE 4: PORT MAP */}
      {viewMode === 'map' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 text-xs space-y-4">
          <div className="pb-2 border-b border-[#1C2D4A] flex justify-between items-center">
            <span className="font-bold text-sm text-[#F4EFE6]">
              Global Destination Network Throughput (Origin: Mundra / Kandla)
            </span>
            <span className="text-emerald-400 font-mono">15 Global Trade Lanes Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { port: 'Hamburg (DEHAM), Germany', active: 7, teu: 14, carrier: 'MSC / Maersk' },
              { port: 'Jebel Ali (AEJEA), UAE', active: 6, teu: 12, carrier: 'CMA CGM / MSC' },
              { port: 'Los Angeles (USLAX), USA', active: 4, teu: 8, carrier: 'ONE / CMA CGM' },
              { port: 'Rotterdam (NLRTM), Netherlands', active: 3, teu: 6, carrier: 'Hapag-Lloyd' },
              { port: 'Yokohama (JPYOK), Japan', active: 3, teu: 6, carrier: 'ONE / Maersk' },
              { port: 'Barcelona (ESBCN), Spain', active: 2, teu: 4, carrier: 'MSC' }
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg hover:border-[#E88B2A]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#F4EFE6]">{p.port}</h4>
                  <span className="font-mono text-[#E88B2A] font-bold">{p.active} Jobs</span>
                </div>
                <p className="text-[10px] text-[#A8A299] mt-1">{p.teu} TEU Volume • Preferred: {p.carrier}</p>
                <div className="mt-2 pt-2 border-t border-[#1C2D4A] flex justify-between items-center text-[10px]">
                  <span className="text-emerald-400">Regular Feeder & Mother Vessel</span>
                  <span className="underline text-sky-400 cursor-pointer">Filter Port</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
