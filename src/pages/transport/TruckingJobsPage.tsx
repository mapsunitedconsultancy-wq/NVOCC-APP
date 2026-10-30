import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TruckingTrip, TransporterRateMatrix } from '../../types/v4Types';
import { MOCK_TRANSPORTER_RATES } from '../../data/v4DemoData';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  DollarSign,
  Camera,
  X,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export const TruckingJobsPage: React.FC = () => {
  const { truckingTrips, addTruckingTrip, updateTruckingTrip, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'trips' | 'rate_cards' | 'new_trip'>('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedTrip, setSelectedTrip] = useState<TruckingTrip | null>(null);

  // New Trip form state
  const [containerNumber, setContainerNumber] = useState('FCIU2316385');
  const [tripType, setTripType] = useState<TruckingTrip['tripType']>('Factory to CFS');
  const [origin, setOrigin] = useState('Krishna Ceramics, Morbi Zone 2');
  const [destination, setDestination] = useState('Mundhra CFS, Mundra Port');
  const [transporterName, setTransporterName] = useState('Shree Kutch Roadways');
  const [truckNumber, setTruckNumber] = useState('GJ-12-BV-4420');
  const [driverName, setDriverName] = useState('Pravin Ahir');
  const [driverPhone, setDriverPhone] = useState('+91 94288 33198');
  const [agreedRateINR, setAgreedRateINR] = useState(18500);

  const filteredTrips = truckingTrips.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchQuery = t.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.truckNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrip: TruckingTrip = {
      id: 'trip-' + Date.now(),
      tripNumber: `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      containerNumber,
      tripType,
      origin,
      destination,
      transporterId: 'tr-' + Date.now(),
      transporterName,
      lrNumber: `LR-${Math.floor(10000 + Math.random() * 90000)}`,
      truckNumber,
      driverName,
      driverPhone,
      scheduledPickup: 'Today 14:00',
      status: 'Assigned',
      agreedRateINR: Number(agreedRateINR),
      fuelSurchargeINR: 1200,
      detentionChargeINR: 0,
      notes: 'Dispatched for direct port loading'
    };
    addTruckingTrip(newTrip);
    setActiveTab('trips');
  };

  const handleMarkDelivered = (tripId: string) => {
    const now = new Date();
    const timeStr = `${now.getDate()} Oct 2026 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    updateTruckingTrip(tripId, {
      status: 'Completed',
      deliveredTime: timeStr
    });
    if (selectedTrip && selectedTrip.id === tripId) {
      setSelectedTrip(prev => prev ? { ...prev, status: 'Completed', deliveredTime: timeStr } : null);
    }
    showToast('success', 'Trip Completed', 'Container delivered at destination. Gate-in receipt verified.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E88B2A]/20 text-[#E88B2A]">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-[#F4EFE6] tracking-tight">
                Transporter / Trucking Jobs
              </h1>
              <p className="text-xs text-[#A8A299]">
                Container Drayage &bull; Factory-to-CFS Haulage &bull; Lorry Receipts (LR) &bull; Transporter Rate Matrices
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'trips' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Trip Dashboard
            </button>
            <button
              onClick={() => setActiveTab('rate_cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'rate_cards' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Rate Cards
            </button>
            <button
              onClick={() => setActiveTab('new_trip')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'new_trip' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              + Create Trip
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Active Trips</span>
            <span className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">{truckingTrips.length}</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Gujarat port corridor</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">En Route</span>
            <span className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {truckingTrips.filter(t => t.status === 'En Route' || t.status === 'Assigned').length}
          </span>
          <span className="text-[11px] text-amber-300/80 block mt-1">Live tracking active</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Completed Deliveries</span>
            <span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {truckingTrips.filter(t => t.status === 'Completed').length}
          </span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">POD &amp; EIR signed off</span>
        </div>

        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A8A299] uppercase tracking-wider">Avg Haulage Cost</span>
            <span className="p-1.5 rounded-lg bg-teal-950/60 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-[#F4EFE6] font-mono">₹18,500</span>
          <span className="text-[11px] text-[#A8A299] block mt-1">Morbi to Mundra 20GP</span>
        </div>
      </div>

      {/* Trip Card Detail View */}
      {selectedTrip ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16263F] border border-[#26395A] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-1.5 rounded-lg bg-[#0F1D33] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A]"
              >
                &larr; Back
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F4EFE6] font-mono">
                    {selectedTrip.tripNumber} &bull; {selectedTrip.containerNumber}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedTrip.status === 'Completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedTrip.status}
                  </span>
                </div>
                <p className="text-xs text-[#A8A299]">
                  Transporter: <strong className="text-[#F4EFE6]">{selectedTrip.transporterName}</strong> &bull; Truck: <strong className="font-mono text-[#E88B2A]">{selectedTrip.truckNumber}</strong> &bull; LR: <span className="font-mono">{selectedTrip.lrNumber}</span>
                </p>
              </div>
            </div>

            {selectedTrip.status !== 'Completed' && (
              <button
                onClick={() => handleMarkDelivered(selectedTrip.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Delivered at Gate</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">Route Particulars</span>
              <div className="text-xs">
                <span className="text-[#A8A299] block">Origin / Pickup:</span>
                <span className="font-semibold text-[#F4EFE6] block">{selectedTrip.origin}</span>
                <span className="text-[#A8A299] block mt-2">Destination / Delivery:</span>
                <span className="font-semibold text-sky-400 block">{selectedTrip.destination}</span>
              </div>
            </div>

            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">Driver &amp; Vehicle</span>
              <div className="text-xs space-y-1">
                <p><span className="text-[#A8A299]">Driver:</span> <strong className="text-[#F4EFE6]">{selectedTrip.driverName}</strong></p>
                <p><span className="text-[#A8A299]">Phone:</span> <strong className="font-mono text-emerald-400">{selectedTrip.driverPhone}</strong></p>
                <p><span className="text-[#A8A299]">Truck:</span> <strong className="font-mono text-[#F4EFE6]">{selectedTrip.truckNumber}</strong></p>
              </div>
            </div>

            <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#A8A299] uppercase font-bold">Financials &amp; Charges</span>
              <div className="text-xs space-y-1 font-mono">
                <p className="flex justify-between"><span className="text-[#A8A299]">Base Rate:</span> <span>₹{selectedTrip.agreedRateINR.toLocaleString()}</span></p>
                <p className="flex justify-between"><span className="text-[#A8A299]">Fuel Surcharge:</span> <span>₹{selectedTrip.fuelSurchargeINR.toLocaleString()}</span></p>
                <p className="flex justify-between font-bold text-emerald-400 border-t border-[#26395A] pt-1">
                  <span>Total Payable:</span> <span>₹{(selectedTrip.agreedRateINR + selectedTrip.fuelSurchargeINR).toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'trips' ? (
        /* Screen 1: Trips Table */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1D33] border border-[#26395A] rounded-xl p-3">
            <div className="flex items-center gap-1 p-1 bg-[#16263F] rounded-lg">
              {['ALL', 'Assigned', 'En Route', 'Completed'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    filterStatus === st ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
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
                placeholder="Search container, transporter, truck..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#16263F] border border-[#26395A] rounded-lg text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              />
            </div>
          </div>

          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">Trip Number</th>
                    <th className="p-3.5">Container No</th>
                    <th className="p-3.5">Trip Type</th>
                    <th className="p-3.5">Route</th>
                    <th className="p-3.5">Transporter &amp; Truck</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                  {filteredTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-[#16263F]/50 transition-colors">
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#E88B2A] block">{trip.tripNumber}</span>
                        <span className="text-[10px] text-[#A8A299] block">{trip.lrNumber}</span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-[#F4EFE6]">
                        {trip.containerNumber}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16263F] border border-[#26395A] text-amber-300">
                          {trip.tripType}
                        </span>
                      </td>

                      <td className="p-3.5 text-[11px]">
                        <span className="text-[#A8A299] block truncate max-w-[180px]">{trip.origin}</span>
                        <span className="text-sky-400 font-semibold block truncate max-w-[180px]">&rarr; {trip.destination}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold block">{trip.transporterName}</span>
                        <span className="text-[10px] text-[#A8A299] font-mono block">
                          {trip.truckNumber} ({trip.driverName.split(' ')[0]})
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          trip.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {trip.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedTrip(trip)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
                        >
                          Trip Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'rate_cards' ? (
        /* Screen 3: Transporter Rate Card */
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#1C2D4A] flex justify-between items-center bg-[#16263F]/50">
            <h3 className="text-xs font-bold text-[#F4EFE6] uppercase tracking-wider">
              Standard Transporter Haulage Rate Cards
            </h3>
            <span className="text-[11px] text-[#A8A299]">Auto-applies when dispatching trips</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A1628] text-[#A8A299] border-b border-[#1C2D4A] font-semibold text-[11px]">
                <tr>
                  <th className="p-3.5">Transporter Name</th>
                  <th className="p-3.5">Origin &rarr; Destination</th>
                  <th className="p-3.5">Equipment</th>
                  <th className="p-3.5">Base Rate (INR)</th>
                  <th className="p-3.5">Fuel Surcharge %</th>
                  <th className="p-3.5">Waiting Time Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A] text-[#F4EFE6]">
                {MOCK_TRANSPORTER_RATES.map(r => (
                  <tr key={r.id} className="hover:bg-[#16263F]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[#F4EFE6]">{r.transporterName}</td>
                    <td className="p-3.5 font-semibold text-sky-400">{r.origin} &rarr; {r.destination}</td>
                    <td className="p-3.5 font-mono">{r.containerType}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">₹{r.baseRateINR.toLocaleString()}</td>
                    <td className="p-3.5 font-mono">{r.fuelSurchargePercent}%</td>
                    <td className="p-3.5 text-[#A8A299]">{r.freeWaitingHours} hrs free &bull; ₹{r.waitingPerHourINR}/hr thereafter</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Create Trip Form */
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl p-6 max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#1C2D4A]">
            <h2 className="text-base font-bold text-[#F4EFE6]">Dispatch Container Drayage / Trip</h2>
            <button onClick={() => setActiveTab('trips')} className="px-3 py-1 text-xs text-[#A8A299] bg-[#16263F] rounded-lg">
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">Container Number:</label>
                <input
                  type="text"
                  required
                  value={containerNumber}
                  onChange={e => setContainerNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Trip Type:</label>
                <select
                  value={tripType}
                  onChange={e => setTripType(e.target.value as any)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                >
                  <option value="Factory to CFS">Factory to CFS (Export)</option>
                  <option value="CFS to Port">CFS to Port (Direct Loading)</option>
                  <option value="Port to Factory">Port to Factory (Import Destuff)</option>
                  <option value="Empty Return">Empty Return to Depot</option>
                  <option value="Empty Pickup">Empty Pickup from Yard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">Pickup Origin:</label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Delivery Destination:</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[#A8A299] block mb-1">Transporter:</label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={e => setTransporterName(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Truck Number:</label>
                <input
                  type="text"
                  required
                  value={truckNumber}
                  onChange={e => setTruckNumber(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
                />
              </div>
              <div>
                <label className="text-[#A8A299] block mb-1">Agreed Rate (INR):</label>
                <input
                  type="number"
                  required
                  value={agreedRateINR}
                  onChange={e => setAgreedRateINR(Number(e.target.value))}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono font-bold text-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2D4A]">
              <button
                type="button"
                onClick={() => setActiveTab('trips')}
                className="px-4 py-2 rounded-xl bg-[#16263F] text-xs font-semibold text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-xs"
              >
                Dispatch Trip
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
