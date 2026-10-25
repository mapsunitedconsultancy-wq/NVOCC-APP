import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Ship,
  FileText,
  FileCheck,
  Layers,
  Boxes,
  Container,
  BadgePercent,
  Receipt,
  Users,
  Coins,
  Archive,
  Compass,
  MessageSquare,
  BarChart3,
  Settings,
  ExternalLink,
  X,
  Anchor,
  Truck,
  Flame,
  TrendingUp,
  FileSpreadsheet,
  Search,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Activity,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  tooltip?: string;
  roles?: string[];
}

interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  onCloseMobile
}) => {
  const {
    activeView,
    setActiveView,
    setViewParam,
    currentUser,
    egmFilings,
    shippingInstructions,
    shipments,
    approvalRequests
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');

  // Live operational telemetry counts
  const pendingEgmCount = egmFilings ? egmFilings.filter(f => f.status === 'Draft').length : 0;
  const pendingSiCount = shippingInstructions ? shippingInstructions.filter(s => s.status === 'Unparsed' || s.status === 'Parsed').length : 0;
  const pendingApprovalsCount = approvalRequests ? approvalRequests.filter(r => r.status === 'Pending').length : 0;
  const activeShipmentsCount = shipments ? shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length : 0;

  // Professional ERP Multi-Tier Navigation Architecture
  const navSections: NavSection[] = [
    {
      id: 'operations',
      title: 'Operations & Documentation',
      icon: Ship,
      items: [
        {
          id: 'shipments',
          label: 'Shipments Register',
          icon: Ship,
          badge: activeShipmentsCount > 0 ? `${activeShipmentsCount}` : '25',
          badgeColor: 'amber',
          tooltip: 'All Active FCL/LCL Corridors',
          roles: ['super_admin', 'operations', 'sales']
        },
        {
          id: 'shipping_instructions',
          label: 'Shipping Instructions (SI)',
          icon: FileSpreadsheet,
          badge: pendingSiCount > 0 ? `${pendingSiCount} New` : undefined,
          badgeColor: 'purple',
          tooltip: 'Multi-Channel SI Inbox & Verification',
          roles: ['super_admin', 'operations', 'sales']
        },
        {
          id: 'hbl',
          label: 'House B/L (HBL)',
          icon: FileText,
          badge: 'Print',
          tooltip: 'HBL Generation & Originals Issuance',
          roles: ['super_admin', 'operations']
        },
        {
          id: 'mbl',
          label: 'Master B/L (MBL)',
          icon: Layers,
          tooltip: 'Carrier Ocean Booking & Liner Releases',
          roles: ['super_admin', 'operations']
        },
        {
          id: 'delivery_orders',
          label: 'Delivery Order (DO)',
          icon: FileCheck,
          badge: 'DO',
          badgeColor: 'sky',
          tooltip: 'CFS Destuffing & Empty Container Return Release',
          roles: ['super_admin', 'operations', 'sales', 'finance']
        },
        {
          id: 'consolidation',
          label: 'LCL Consolidation',
          icon: Boxes,
          badge: 'Groupage',
          tooltip: 'LCL Cargo Consolidation Load Planner',
          roles: ['super_admin', 'operations']
        }
      ]
    },
    {
      id: 'customs',
      title: 'Customs & ICEGATE EDI',
      icon: Anchor,
      items: [
        {
          id: 'export_manifest',
          label: 'Export Manifest (EGM)',
          icon: Ship,
          badge: pendingEgmCount > 0 ? `${pendingEgmCount} Due` : '7-Day',
          badgeColor: pendingEgmCount > 0 ? 'amber' : 'slate',
          tooltip: 'ICEGATE 7-Day Sailed Manifest Filing Desk',
          roles: ['super_admin', 'operations']
        },
        {
          id: 'import_manifest',
          label: 'Import Manifest (IGM)',
          icon: Anchor,
          badge: 'Inbound',
          tooltip: 'Inbound Vessel IGM & Arrival Notices',
          roles: ['super_admin', 'operations', 'finance']
        },
        {
          id: 'cha_tracker',
          label: 'CHA & Shipping Bill',
          icon: FileCheck,
          badge: 'ICEGATE',
          badgeColor: 'teal',
          tooltip: 'Shipping Bill & LEO Customs Clearance Tracker',
          roles: ['super_admin', 'operations']
        },
        {
          id: 'dangerous_goods',
          label: 'Dangerous Goods (IMDG)',
          icon: Flame,
          badge: 'IMDG',
          badgeColor: 'rose',
          tooltip: 'IMO DGD Declarations & UN Segregation Checker',
          roles: ['super_admin', 'operations']
        }
      ]
    },
    {
      id: 'fleet',
      title: 'Equipment & Drayage',
      icon: Container,
      items: [
        {
          id: 'container_control',
          label: 'Container Control',
          icon: Container,
          badge: 'LIVE D&D',
          badgeColor: 'teal',
          tooltip: 'Live Container Fleet Tracking + D&D Calculations',
          roles: ['super_admin', 'operations', 'finance']
        },
        {
          id: 'trucking_jobs',
          label: 'Trucking & Drayage',
          icon: Truck,
          badge: 'LR Bilty',
          tooltip: 'Port & CFS Drayage Trips & Lorry Receipts (LR)',
          roles: ['super_admin', 'operations']
        }
      ]
    },
    {
      id: 'commercial',
      title: 'Commercial & Financials',
      icon: Receipt,
      items: [
        {
          id: 'quotation_pipeline',
          label: 'Quotation Pipeline',
          icon: TrendingUp,
          badge: 'Funnel',
          tooltip: 'Sales Pipeline, RFQs & Conversion Funnel',
          roles: ['super_admin', 'sales', 'operations']
        },
        {
          id: 'quotes',
          label: 'Rates & Ocean Tariffs',
          icon: BadgePercent,
          tooltip: 'Ocean Carrier Contracts & Surcharge Matrix',
          roles: ['super_admin', 'sales', 'operations']
        },
        {
          id: 'invoicing',
          label: 'Invoicing & GST',
          icon: Receipt,
          badge: 'IRN / EWB',
          badgeColor: 'emerald',
          tooltip: 'Tax Invoices, Debit/Credit Notes, GST E-Invoicing',
          roles: ['super_admin', 'finance']
        },
        {
          id: 'agent_accounting',
          label: 'Agent Accounting',
          icon: Coins,
          badge: 'D/C Note',
          tooltip: 'Overseas Agent Settlements & Multi-Currency Ledgers',
          roles: ['super_admin', 'finance']
        }
      ]
    },
    {
      id: 'master_data',
      title: 'Master Data & MIS',
      icon: Building2,
      items: [
        {
          id: 'crm',
          label: 'Party Master (CRM)',
          icon: Users,
          tooltip: 'Shippers, Consignees, Liners & Transporters Master',
          roles: ['super_admin', 'sales', 'operations', 'finance']
        },
        {
          id: 'vault',
          label: 'Document Vault',
          icon: Archive,
          badge: 'OCR',
          tooltip: 'Digital Document Repository & Customs OCR Files',
          roles: ['super_admin', 'operations', 'finance']
        },
        {
          id: 'communication',
          label: 'Communication Hub',
          icon: MessageSquare,
          badge: 'WhatsApp',
          badgeColor: 'emerald',
          tooltip: 'Automated WhatsApp & Email Customer Notifications',
          roles: ['super_admin', 'operations', 'sales']
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
          tooltip: 'Executive MIS, Volume Trends & Profitability Reports',
          roles: ['super_admin', 'finance', 'operations']
        },
        {
          id: 'intelligence',
          label: 'Corridor Intelligence',
          icon: Activity,
          tooltip: 'Real-Time Port Alerts & Margin Optimization Telemetry',
          roles: ['super_admin', 'operations', 'finance']
        },
        {
          id: 'settings',
          label: 'Settings & Admin',
          icon: Settings,
          tooltip: 'Branch, Tariffs, Users & System Administration',
          roles: ['super_admin']
        }
      ]
    },
    {
      id: 'portals',
      title: 'Portals & External Access',
      icon: Compass,
      items: [
        {
          id: 'customer_portal',
          label: 'Customer Portal',
          icon: Compass,
          badge: 'B2B',
          badgeColor: 'emerald',
          tooltip: 'Customer Self-Service Portal & Inward Tracking'
        },
        {
          id: 'public_tracking',
          label: 'Public Tracking',
          icon: ExternalLink,
          badge: '/track',
          badgeColor: 'sky',
          tooltip: 'Public Ocean Freight Live Milestone Tracker'
        }
      ]
    }
  ];

  // Accordion state management: Keep all sections open by default so all functions are visible
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operations: true,
    customs: true,
    fleet: true,
    commercial: true,
    master_data: true,
    portals: true
  });

  // Global ⌘B / Ctrl+B keyboard shortcut to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, setCollapsed]);

  // Auto-expand section containing active view
  useEffect(() => {
    for (const sec of navSections) {
      if (sec.items.some(item => item.id === activeView)) {
        setOpenSections(prev => ({ ...prev, [sec.id]: true }));
        break;
      }
    }
  }, [activeView]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter items by search query (keeps all functions fully accessible without hiding)
  const filteredSections = useMemo(() => {
    return navSections
      .map(sec => {
        const matchingItems = sec.items.filter(item => {
          if (!searchFilter.trim()) return true;
          return (
            item.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
            item.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
            (item.badge && item.badge.toLowerCase().includes(searchFilter.toLowerCase())) ||
            sec.title.toLowerCase().includes(searchFilter.toLowerCase())
          );
        });
        return {
          ...sec,
          items: matchingItems
        };
      })
      .filter(sec => sec.items.length > 0);
  }, [navSections, searchFilter]);

  const renderBadge = (badge: string, color?: string) => {
    let classes = 'bg-[#16263F] text-[#A8A299] border-[#26395A]';
    if (color === 'emerald') classes = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 font-semibold';
    if (color === 'amber') classes = 'bg-amber-950/80 text-amber-300 border-amber-800/60 font-semibold';
    if (color === 'teal') classes = 'bg-teal-950/80 text-teal-300 border-teal-700/60 font-bold';
    if (color === 'sky') classes = 'bg-sky-950/80 text-sky-300 border-sky-800/60 font-semibold';
    if (color === 'purple') classes = 'bg-purple-950/80 text-purple-300 border-purple-800/60 font-semibold';
    if (color === 'rose') classes = 'bg-rose-950/80 text-rose-300 border-rose-800/60 font-semibold';

    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider border shrink-0 ${classes}`}>
        {badge}
      </span>
    );
  };

  const renderNavContent = (isMobile: boolean = false) => {
    const isExpanded = !collapsed || isMobile;

    return (
      <div className="flex flex-col h-full bg-[#08101E] border-r border-[#15233C] select-none">
        {/* 1. Professional ERP Application Brand Header */}
        <div className="p-3.5 border-b border-[#15233C] bg-[#0C172A] shrink-0">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                setActiveView('dashboard');
                setViewParam(undefined);
                if (isMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E88B2A] to-[#B06010] flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-[#E88B2A]/20 shrink-0 group-hover:scale-105 transition-transform">
                <Ship className="w-4 h-4 stroke-[2.5]" />
              </div>

              {isExpanded && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-[#F4EFE6] tracking-wide truncate group-hover:text-[#E88B2A] transition-colors font-display">
                      MAPS NVOCC PRO
                    </h2>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-[#E88B2A]/20 text-[#E88B2A] font-mono font-bold border border-[#E88B2A]/30">
                      v4.2
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#A8A299] truncate mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="truncate">Mundra Hub (INMUN1)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse toggle / mobile close */}
            {isMobile ? (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] transition-colors"
                title="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] hidden lg:block transition-colors"
                title={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#A8A299]" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-[#A8A299]" />
                )}
              </button>
            )}
          </div>

          {/* Quick ERP Module Search Filter */}
          {isExpanded && (
            <div className="mt-2.5 relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Jump to ERP module..."
                className="w-full bg-[#101C30] border border-[#1C2E4C] focus:border-[#E88B2A] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-hidden transition-colors"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A8A299] hover:text-[#F4EFE6]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Scrollable ERP Nav Menu List */}
        <div className="flex-1 py-2.5 px-2 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-[#1C2E4C]">
          {/* Top Quick Access Shelf: Command Center */}
          <div className="px-1 space-y-1">
            <button
              onClick={() => {
                setActiveView('dashboard');
                setViewParam(undefined);
                if (isMobile) onCloseMobile();
              }}
              title={!isExpanded ? 'Command Center Dashboard' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group ${
                activeView === 'dashboard'
                  ? 'bg-[#E88B2A] text-slate-950 shadow-md shadow-[#E88B2A]/20'
                  : 'text-[#F4EFE6] hover:bg-[#13223B] bg-[#0E1A2E] border border-[#182844]'
              }`}
            >
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeView === 'dashboard' ? 'text-slate-950' : 'text-[#E88B2A]'
                }`}
              />
              {isExpanded && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">Command Center</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                      activeView === 'dashboard'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    }`}
                  >
                    Live
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Module Categories (Accordions) */}
          {filteredSections.map(section => {
            const SectionIcon = section.icon;
            const isOpen = searchFilter.trim() ? true : openSections[section.id] !== false;
            const hasActiveItem = section.items.some(i => i.id === activeView);

            return (
              <div
                key={section.id}
                className={`rounded-xl transition-colors ${
                  hasActiveItem && isExpanded ? 'bg-[#0B1526]/60 border border-[#162744]' : ''
                }`}
              >
                {/* Section Accordion Header */}
                {isExpanded ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-[#8E8A82] hover:text-[#F4EFE6] rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SectionIcon className="w-3.5 h-3.5 text-[#6E6A64] group-hover:text-[#E88B2A] transition-colors shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                        {section.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono text-[#5A5751] px-1 rounded bg-[#101C30]">
                        {section.items.length}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#6E6A64] group-hover:text-[#F4EFE6] transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#6E6A64] group-hover:text-[#F4EFE6] transition-transform" />
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="my-1.5 border-t border-[#15233C]" />
                )}

                {/* Section Items */}
                {(isOpen || !isExpanded) && (
                  <div className={`space-y-0.5 ${isExpanded ? 'mt-0.5 px-1 pb-1' : ''}`}>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id);
                            setViewParam(undefined);
                            if (isMobile) onCloseMobile();
                          }}
                          title={item.tooltip || (!isExpanded ? item.label : undefined)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                            isActive
                              ? 'bg-[#E88B2A]/15 text-[#E88B2A] font-semibold border-l-2 border-[#E88B2A] shadow-xs'
                              : 'text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#122038] border-l-2 border-transparent'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#E88B2A]'
                                : 'text-[#6E6A64] group-hover:text-[#F4EFE6]'
                            }`}
                          />
                          {isExpanded && (
                            <div className="flex-1 flex items-center justify-between text-left truncate">
                              <span className="truncate text-xs">{item.label}</span>
                              {item.badge && renderBadge(item.badge, item.badgeColor)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* 3. Clean, Professional ERP Footer Bar */}
        <div className="p-2.5 border-t border-[#15233C] bg-[#0A1424] shrink-0">
          {isExpanded ? (
            <div className="flex items-center justify-between text-[11px] text-[#A8A299]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate font-medium text-[#F4EFE6]">
                  EDI & Ports Live
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#6E6A64]">
                INMUN1
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-full overflow-hidden transition-all duration-200 z-20 ${
          collapsed ? 'w-16' : 'w-64 xl:w-72'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-xs animate-in fade-in duration-150"
          />
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-[#08101E] border-r border-[#15233C] z-50 flex flex-col lg:hidden shadow-2xl animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </>
      )}
    </>
  );
};
