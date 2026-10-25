import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Ship,
  Container,
  FileText,
  Receipt,
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { activeView, setActiveView, setViewParam, shipments, invoices } = useApp();

  const activeShipmentsCount = shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length;
  const pendingInvoicesCount = invoices.filter(i => i.status === 'Issued' || i.status === 'Overdue').length;

  const tabs = [
    { id: 'dashboard', label: 'Command', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Ship, badge: activeShipmentsCount },
    { id: 'container_control', label: 'Containers', icon: Container },
    { id: 'hbl', label: 'HBL', icon: FileText },
    { id: 'invoicing', label: 'Billing', icon: Receipt, badge: pendingInvoicesCount }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0A1628]/95 backdrop-blur-md border-t border-[#1C2D4A] z-30 flex items-center justify-around px-2 shadow-lg">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id);
              setViewParam(undefined);
            }}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              isActive ? 'text-[#E88B2A] font-bold' : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            <div className="relative">
              <Icon className="w-4 h-4" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold rounded-full bg-[#E88B2A] text-[#0A1628] leading-tight">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={onOpenMenu}
        className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[#A8A299] hover:text-[#F4EFE6] transition-colors"
      >
        <Menu className="w-4 h-4" />
        <span className="text-[10px] tracking-tight">Modules</span>
      </button>
    </nav>
  );
};
