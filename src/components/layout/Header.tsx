import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Ship,
  FileText,
  FileCheck,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Shield,
  ShieldAlert,
  UserCheck,
  Menu,
  User,
  Settings,
  SlidersHorizontal
} from 'lucide-react';

import { NotificationsCenter } from '../common/NotificationsCenter';

interface HeaderProps {
  onOpenNewShipment: () => void;
  onOpenNewHbl: () => void;
  onOpenNewDo?: () => void;
  onOpenNewInvoice: () => void;
  onOpenSearch?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenApprovals?: () => void;
  onOpenAccountSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewShipment,
  onOpenNewHbl,
  onOpenNewDo,
  onOpenNewInvoice,
  onOpenSearch,
  onToggleMobileMenu,
  onOpenApprovals,
  onOpenAccountSettings
}) => {
  const {
    currentUser,
    switchUserRole,
    theme,
    toggleTheme,
    density,
    toggleDensity,
    universalSearch,
    setUniversalSearch,
    shipments,
    approvalRequests,
    setActiveView,
    setViewParam
  } = useApp();

  const pendingApprovalsCount = approvalRequests ? approvalRequests.filter(r => r.status === 'Pending').length : 0;

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = universalSearch.trim()
    ? shipments.filter(s =>
        s.id.toLowerCase().includes(universalSearch.toLowerCase()) ||
        s.shipperName.toLowerCase().includes(universalSearch.toLowerCase()) ||
        s.consigneeName.toLowerCase().includes(universalSearch.toLowerCase()) ||
        s.vesselName.toLowerCase().includes(universalSearch.toLowerCase()) ||
        s.containers.some(c => c.containerNumber.toLowerCase().includes(universalSearch.toLowerCase())) ||
        (s.hblNo && s.hblNo.toLowerCase().includes(universalSearch.toLowerCase()))
      ).slice(0, 5)
    : [];

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'super_admin', label: 'Super Admin (Aman Dana)', desc: 'Full system & financial control' },
    { role: 'operations', label: 'Operations (Utsav Panchal)', desc: 'Shipments, HBLs, container ops' },
    { role: 'finance', label: 'Finance (Seema Dana)', desc: 'Invoices, agent ledgers, payments' },
    { role: 'sales', label: 'Sales (Rahul Mehta)', desc: 'Quotes, CRM, customer pipeline' },
    { role: 'customer', label: 'Customer (Krishna Ceramics)', desc: 'External shipper self-service portal' }
  ];

  return (
    <div className="sticky top-0 z-30 shrink-0">
      {/* Live FX Rate Scrolling Ticker */}
      <div className="w-full bg-[#060D18] border-b border-[#16263F] py-1 px-3 sm:px-6 text-[10px] text-[#A8A299] flex items-center justify-between overflow-hidden select-none">
        <div className="flex items-center gap-1.5 shrink-0 font-bold uppercase tracking-wider text-[#E88B2A]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px]">LIVE FX (RBI / ICEGATE):</span>
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar mx-3">
          <div className="flex items-center gap-5 whitespace-nowrap font-mono">
            <span className="text-[#F4EFE6]"><strong className="text-emerald-400">USD/INR</strong> ₹83.92 <span className="text-emerald-400 text-[9px]">(+0.04%)</span></span>
            <span className="text-[#3A4D6B]">•</span>
            <span className="text-[#F4EFE6]"><strong className="text-sky-300">EUR/INR</strong> ₹91.45 <span className="text-rose-400 text-[9px]">(-0.12%)</span></span>
            <span className="text-[#3A4D6B]">•</span>
            <span className="text-[#F4EFE6]"><strong className="text-amber-300">AED/INR</strong> ₹22.85 <span className="text-[#A8A299] text-[9px]">(0.00%)</span></span>
            <span className="text-[#3A4D6B]">•</span>
            <span className="text-[#F4EFE6]"><strong className="text-emerald-400">GBP/INR</strong> ₹109.18 <span className="text-emerald-400 text-[9px]">(+0.21%)</span></span>
            <span className="text-[#3A4D6B]">•</span>
            <span className="text-[#F4EFE6]"><strong className="text-sky-300">JPY/INR (100)</strong> ₹56.40 <span className="text-emerald-400 text-[9px]">(+0.08%)</span></span>
            <span className="text-[#3A4D6B]">•</span>
            <span className="text-amber-300 font-sans text-[10px]">Mundra Customs Circular 14/2026</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 shrink-0 text-[9px] text-emerald-400 font-mono">
          <span>PORT INMUN LIVE</span>
        </div>
      </div>

      <header className="h-14 border-b border-[#1C2D4A] bg-[#0A1628]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] -ml-1 transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div 
          onClick={() => { setActiveView('dashboard'); setViewParam(undefined); }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E88B2A] to-[#B06010] flex items-center justify-center font-black text-slate-950 shadow-md shadow-[#E88B2A]/20">
            <Ship className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-[#F4EFE6] group-hover:text-[#E88B2A] transition-colors">
                MAPS NVOCC PRO
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#E88B2A]/20 text-[#E88B2A] rounded border border-[#E88B2A]/30">
                v3.0
              </span>
            </div>
            <p className="text-[10px] text-[#A8A299] -mt-0.5 font-medium hidden sm:block">
              Gandhidham • Mundra • Kandla
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Universal Search (Cmd+K) */}
      <div 
        onClick={() => onOpenSearch ? onOpenSearch() : setShowSearchResults(true)}
        className="relative flex-1 min-w-[200px] max-w-md mx-3 hidden md:block cursor-pointer group"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-[#A8A299] group-hover:text-[#E88B2A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
          <input
            type="text"
            readOnly
            onClick={() => onOpenSearch && onOpenSearch()}
            placeholder="Universal search: Shipments, HBLs, Invoices, Parties..."
            className="w-full bg-[#0F1D33] border border-[#26395A] group-hover:border-[#E88B2A]/60 rounded-lg pl-9 pr-14 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] cursor-pointer transition-colors shadow-inner"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#A8A299] bg-[#16263F] border border-[#26395A] rounded pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Quick Actions, Alerts, Theme, User */}
      <div className="flex items-center gap-2">
        {/* Fast Action Buttons (Desktop) */}
        {currentUser.role !== 'customer' && (
          <div className="hidden lg:flex items-center gap-1.5 mr-2">
            <button
              onClick={onOpenNewShipment}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-sm shadow-[#E88B2A]/20"
              title="Shortcut: ⌘N"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Shipment</span>
            </button>
            <button
              onClick={onOpenNewHbl}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#E88B2A]" />
              <span>HBL</span>
            </button>
            {onOpenNewDo && (
              <button
                onClick={onOpenNewDo}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
                title="Create & Issue Delivery Order"
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>DO</span>
              </button>
            )}
            <button
              onClick={onOpenNewInvoice}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Invoice</span>
            </button>
          </div>
        )}

        {/* Role Switcher Pill */}
        <div ref={roleRef} className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#16263F] border border-[#26395A] hover:border-[#E88B2A]/50 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-[#E88B2A]" />
            <span className="capitalize font-semibold text-[#F4EFE6]">
              {currentUser.role.replace('_', ' ')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A8A299]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0F1D33] border border-[#26395A] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[#1C2D4A] mb-1">
                <span className="text-[10px] font-bold text-[#A8A299] uppercase tracking-wider">
                  Test Role-Based Access Control (RBAC)
                </span>
                <p className="text-[11px] text-[#F4EFE6] font-medium mt-0.5">Switch active user persona:</p>
              </div>
              <div className="space-y-1">
                {roles.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setShowRoleMenu(false);
                      if (r.role === 'customer') {
                        setActiveView('customer_portal');
                      }
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                      currentUser.role === r.role
                        ? 'bg-[#E88B2A]/15 text-[#E88B2A] border border-[#E88B2A]/30'
                        : 'hover:bg-[#16263F] text-slate-300'
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 shrink-0 mt-0.5 ${currentUser.role === r.role ? 'text-[#E88B2A]' : 'text-[#6E6A64]'}`} />
                    <div>
                      <div className="font-semibold text-[#F4EFE6]">{r.label}</div>
                      <div className="text-[10px] text-[#A8A299]">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unified Approvals Queue Gatekeeper */}
        {onOpenApprovals && (
          <button
            onClick={onOpenApprovals}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#16263F] border border-[#26395A] hover:border-amber-500/50 hover:bg-[#1D3251] text-[#F4EFE6] transition-colors"
            title="Unified Approval Engine & Gatekeeper Queue"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-semibold">Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Alert Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] relative transition-colors"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E88B2A] animate-pulse"></span>
          </button>

          <NotificationsCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Theme Toggle Active Switcher */}
        <button
          onClick={toggleTheme}
          data-testid="theme-toggle"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] bg-[#16263F]/70 hover:bg-[#16263F] border border-[#26395A] transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold text-[#F4EFE6] hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-semibold text-[#0F172A] hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Top-Right User Account & Settings Section */}
        <div ref={accountRef} className="relative pl-1 border-l border-[#1C2D4A]">
          <button
            onClick={() => setShowAccountMenu(prev => !prev)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-[#122038] hover:bg-[#182B4B] border border-[#20365B] hover:border-[#E88B2A]/50 transition-all cursor-pointer group select-none"
            title="Open Account Menu & Settings"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#F4EFE6] leading-tight group-hover:text-[#E88B2A] transition-colors truncate max-w-[125px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-[#A8A299] font-medium capitalize truncate max-w-[125px]">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>

            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E88B2A] to-[#B06010] text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-[#E88B2A]/20">
                {currentUser.avatar || 'AD'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0A1628]" />
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-[#A8A299] group-hover:text-[#F4EFE6] transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Accounts Dropdown Menu */}
          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User Identity Header */}
              <div className="p-3 bg-[#08101E] border border-[#16263F] rounded-xl mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E88B2A] to-[#B06010] text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    {currentUser.avatar || 'AD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-xs text-[#F4EFE6] truncate">
                        {currentUser.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30 capitalize shrink-0">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A8A299] truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-[#6E6A64] truncate mt-0.5">{currentUser.title} • {currentUser.department}</p>
                  </div>
                </div>
              </div>

              {/* Account Menu Navigation */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    if (onOpenAccountSettings) onOpenAccountSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#F4EFE6] hover:bg-[#16263F] transition-colors text-left group cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#E88B2A] shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold block">Account Settings & Profile</span>
                    <span className="text-[10px] text-[#A8A299]">Change name, port defaults, currency, alerts</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    setActiveView('settings');
                    setViewParam(undefined);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#F4EFE6] hover:bg-[#16263F] transition-colors text-left group cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold block">Tenant Firm & System Settings</span>
                    <span className="text-[10px] text-[#A8A299]">GST, Bank accounts, API tokens, numbering</span>
                  </div>
                </button>
              </div>

              {/* Quick Settings Section */}
              <div className="pt-2 mt-2 border-t border-[#1C2D4A] space-y-1.5">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6E6A64] block">
                  Quick Display Settings
                </span>

                {/* Theme Switcher */}
                <div className="flex items-center justify-between px-3 py-1 text-xs text-[#A8A299]">
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Theme Mode</span>
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#16263F] border border-[#26395A] hover:border-[#E88B2A]/50 text-[#F4EFE6] transition-colors"
                  >
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Density Switcher */}
                <div className="flex items-center justify-between px-3 py-1 text-xs text-[#A8A299]">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#E88B2A]" />
                    <span>Display Density</span>
                  </span>
                  <button
                    onClick={toggleDensity}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#16263F] border border-[#26395A] hover:border-[#E88B2A]/50 text-[#F4EFE6] transition-colors capitalize"
                  >
                    {density}
                  </button>
                </div>
              </div>

              {/* Role Switcher Drawer Accordion / Link */}
              <div className="pt-2 mt-2 border-t border-[#1C2D4A]">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    setShowRoleMenu(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-900/50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Switch Active Persona (RBAC)</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  </div>
  );
};
