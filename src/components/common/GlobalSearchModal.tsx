import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Ship,
  FileText,
  DollarSign,
  Users,
  FileBox,
  ArrowRight,
  Clock,
  CornerDownLeft,
  X
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'shipment' | 'hbl' | 'invoice' | 'party' | 'document';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'shipment' | 'hbl' | 'invoice' | 'party' | 'document';
  badge: string;
  badgeColor: string;
  route: { view: string; param?: string };
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    shipments,
    hbls,
    invoices,
    parties,
    documents,
    setActiveView,
    setViewParam
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Compute search results across all entities
  const q = query.toLowerCase().trim();

  const allItems: SearchResultItem[] = [];

  // 1. Shipments
  shipments.forEach(s => {
    const match =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.shipperName.toLowerCase().includes(q) ||
      s.consigneeName.toLowerCase().includes(q) ||
      s.vesselName.toLowerCase().includes(q) ||
      s.polName.toLowerCase().includes(q) ||
      s.podName.toLowerCase().includes(q) ||
      s.containers.some(c => c.containerNumber.toLowerCase().includes(q)) ||
      (s.hblNo && s.hblNo.toLowerCase().includes(q));

    if (match) {
      allItems.push({
        id: `shipment-${s.id}`,
        title: `${s.id} • ${s.shipperName}`,
        subtitle: `${s.polCode} → ${s.podCode} • ${s.vesselName} • ${s.containers[0]?.containerNumber || 'Container'}`,
        category: 'shipment',
        badge: s.statusLabel,
        badgeColor: 'bg-[#E88B2A]/20 text-[#E88B2A] border-[#E88B2A]/40',
        route: { view: 'shipments', param: s.id }
      });
    }
  });

  // 2. HBLs
  hbls.forEach(h => {
    const match =
      !q ||
      h.hblNumber.toLowerCase().includes(q) ||
      h.shipperName.toLowerCase().includes(q) ||
      h.consigneeText.toLowerCase().includes(q) ||
      h.shipmentId.toLowerCase().includes(q);

    if (match) {
      allItems.push({
        id: `hbl-${h.id}`,
        title: `${h.hblNumber} (HBL)`,
        subtitle: `Shipper: ${h.shipperName} • Dest: ${h.placeOfDelivery}`,
        category: 'hbl',
        badge: h.status.toUpperCase(),
        badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
        route: { view: 'hbl', param: h.id }
      });
    }
  });

  // 3. Invoices
  invoices.forEach(inv => {
    const match =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.billToPartyName.toLowerCase().includes(q) ||
      (inv.shipmentId && inv.shipmentId.toLowerCase().includes(q));

    if (match) {
      allItems.push({
        id: `invoice-${inv.id}`,
        title: `${inv.invoiceNumber} • ${inv.billToPartyName}`,
        subtitle: `Total: ${formatINR(inv.grandTotal)} • Balance: ${formatINR(inv.balanceDue)}`,
        category: 'invoice',
        badge: inv.status,
        badgeColor:
          inv.status === 'Paid'
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
            : inv.status === 'Overdue'
            ? 'bg-rose-950 text-rose-300 border-rose-800'
            : 'bg-amber-950 text-amber-300 border-amber-800',
        route: { view: 'invoicing', param: inv.id }
      });
    }
  });

  // 4. Parties
  parties.forEach(p => {
    const match =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.gstin && p.gstin.toLowerCase().includes(q)) ||
      p.type.toLowerCase().includes(q);

    if (match) {
      allItems.push({
        id: `party-${p.id}`,
        title: `${p.name} (${p.city})`,
        subtitle: `${p.type} • GSTIN: ${p.gstin || 'N/A'} • Outstanding: ${formatINR(p.outstandingBalanceINR)}`,
        category: 'party',
        badge: p.type,
        badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
        route: { view: 'parties', param: p.id }
      });
    }
  });

  // 5. Documents
  documents.forEach(doc => {
    const match =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.fileName.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.shipmentId && doc.shipmentId.toLowerCase().includes(q));

    if (match) {
      allItems.push({
        id: `doc-${doc.id}`,
        title: `${doc.title} (${doc.category})`,
        subtitle: `File: ${doc.fileName} • Job: ${doc.shipmentId || 'General'} • Size: ${doc.fileSize}`,
        category: 'document',
        badge: doc.category,
        badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
        route: { view: 'vault', param: doc.id }
      });
    }
  });

  // Filter by active category tab
  const filteredResults = allItems
    .filter(item => (selectedCategory === 'all' ? true : item.category === selectedCategory))
    .slice(0, 15);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item: SearchResultItem) => {
    setActiveView(item.route.view);
    if (item.route.param) {
      setViewParam(item.route.param);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1C2D4A] gap-3 bg-[#0A1628]">
          <Search className="w-5 h-5 text-[#E88B2A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search shipments, containers, HBLs, parties, invoices, docs... (Cmd+K)"
            className="w-full bg-transparent text-sm sm:text-base text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#A8A299] bg-[#16263F] border border-[#26395A] rounded">
            ESC
          </kbd>
        </div>

        {/* Entity Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#1C2D4A] bg-[#0A1628]/60 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'shipment', label: 'Shipments', icon: Ship },
            { id: 'hbl', label: 'HBLs', icon: FileText },
            { id: 'invoice', label: 'Invoices', icon: DollarSign },
            { id: 'party', label: 'Parties', icon: Users },
            { id: 'document', label: 'Documents', icon: FileBox }
          ].map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as SearchCategory);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#E88B2A] text-[#0A1628] font-bold'
                    : 'text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-[#1C2D4A]/50 flex-1">
          {filteredResults.length > 0 ? (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#16263F] border border-[#E88B2A]/40'
                      : 'hover:bg-[#16263F]/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.category === 'shipment'
                          ? 'bg-[#E88B2A]/20 text-[#E88B2A]'
                          : item.category === 'hbl'
                          ? 'bg-emerald-950 text-emerald-400'
                          : item.category === 'invoice'
                          ? 'bg-amber-950 text-amber-400'
                          : item.category === 'party'
                          ? 'bg-sky-950 text-sky-400'
                          : 'bg-purple-950 text-purple-400'
                      }`}
                    >
                      {item.category === 'shipment' && <Ship className="w-4 h-4" />}
                      {item.category === 'hbl' && <FileText className="w-4 h-4" />}
                      {item.category === 'invoice' && <DollarSign className="w-4 h-4" />}
                      {item.category === 'party' && <Users className="w-4 h-4" />}
                      {item.category === 'document' && <FileBox className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-[#F4EFE6] truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A8A299] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#E88B2A] font-mono">
                        Select <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[#6E6A64]" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#A8A299]">
              <Search className="w-8 h-8 mx-auto text-[#6E6A64] mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#F4EFE6]">No matching records found</p>
              <p className="text-xs text-[#6E6A64] mt-1">
                Try searching for a container number (MSKU...), HBL number, party name, or invoice ID.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-[#0A1628] border-t border-[#1C2D4A] flex items-center justify-between text-[11px] text-[#A8A299]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#16263F] border border-[#26395A] rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[#16263F] border border-[#26395A] rounded text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#16263F] border border-[#26395A] rounded text-[10px]">↵</kbd>
              Open
            </span>
          </div>
          <span className="text-[#6E6A64]">
            Universal Search • MAPS NVOCC Pro v2.5
          </span>
        </div>
      </div>
    </div>
  );
};
