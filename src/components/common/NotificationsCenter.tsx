import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Ship,
  Receipt,
  MessageSquare,
  FileBox,
  CreditCard,
  Settings,
  ChevronRight,
  VolumeX,
  X
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export interface NotificationItem {
  id: string;
  type: 'shipment' | 'invoice' | 'agent' | 'document' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  snoozed?: boolean;
  priority: 'critical' | 'high' | 'normal';
  route: { view: string; param?: string };
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'shipment',
    title: 'Demurrage Warning: Container MRKU8891234',
    description: 'Free time expires in 18 hours at Eurogate Hamburg. Accruing ₹8,500/day penalty.',
    timestamp: '10 mins ago',
    read: false,
    priority: 'critical',
    route: { view: 'shipments', param: 'MAPS-240338' }
  },
  {
    id: 'notif-2',
    type: 'invoice',
    title: 'Payment Due: Saurashtra Minerals',
    description: 'Invoice MAPS/24-25/INV/028 for ₹4,09,500 is overdue by 32 days.',
    timestamp: '35 mins ago',
    read: false,
    priority: 'high',
    route: { view: 'invoicing', param: 'MAPS/24-25/INV/028' }
  },
  {
    id: 'notif-3',
    type: 'payment',
    title: 'RTGS Payment Received: ₹3,85,000',
    description: 'HDFC UTR #HDFC0089211 received from Krishna Ceramics for Inv #INV/012.',
    timestamp: '1 hour ago',
    read: false,
    priority: 'normal',
    route: { view: 'invoicing', param: 'MAPS/24-25/INV/012' }
  },
  {
    id: 'notif-4',
    type: 'shipment',
    title: 'Vessel Arrival Notice: CMA CGM COLUMBA',
    description: 'Vessel berthed at Mundra MICT terminal. Discharge operations commenced.',
    timestamp: '2 hours ago',
    read: false,
    priority: 'high',
    route: { view: 'shipments', param: 'MAPS-240345' }
  },
  {
    id: 'notif-5',
    type: 'agent',
    title: 'Agent Message: Al-Futtaim Logistics Dubai',
    description: 'Delivery order released to consignee for container TGHU7712398.',
    timestamp: '3 hours ago',
    read: true,
    priority: 'normal',
    route: { view: 'accounting', param: 'agent-1' }
  },
  {
    id: 'notif-6',
    type: 'document',
    title: 'Customs LEO Generated: SB #7891234',
    description: 'Let Export Order signed digitally at Gandhidham Customs House.',
    timestamp: '4 hours ago',
    read: true,
    priority: 'normal',
    route: { view: 'vault' }
  },
  {
    id: 'notif-7',
    type: 'shipment',
    title: 'Gate-in Completed: MSKU 2345678',
    description: 'Container gated in at Adani Mundra Terminal (APSEZ) with verified gross mass 29,360 KG.',
    timestamp: '5 hours ago',
    read: true,
    priority: 'normal',
    route: { view: 'shipments', param: 'MAPS-240342' }
  },
  {
    id: 'notif-8',
    type: 'invoice',
    title: 'GSTR-1 JSON Ready for Filing',
    description: 'Monthly export invoice register prepared with ₹42.8L taxable value.',
    timestamp: '6 hours ago',
    read: true,
    priority: 'normal',
    route: { view: 'reports' }
  },
  {
    id: 'notif-9',
    type: 'agent',
    title: 'Credit Note Approved: EuroAsia Shipping',
    description: 'USD 450 transhipment rebate credited to EuroAsia Hamburg ledger.',
    timestamp: 'Yesterday',
    read: true,
    priority: 'normal',
    route: { view: 'accounting' }
  },
  {
    id: 'notif-10',
    type: 'document',
    title: 'Bill of Lading Original Printed',
    description: 'HBL MAPS-HBL-240342-01 issued and locked for changes.',
    timestamp: 'Yesterday',
    read: true,
    priority: 'normal',
    route: { view: 'hbl' }
  }
];

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ isOpen, onClose }) => {
  const { setActiveView, setViewParam, showToast } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filterType, setFilterType] = useState<string>('all');

  const unreadCount = notifications.filter(n => !n.read && !n.snoozed).length;

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('success', 'All notifications marked as read');
  };

  const snoozeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, snoozed: true } : n))
    );
    showToast('info', 'Alert Snoozed', 'Notification muted for 4 hours');
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // mark as read
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    setActiveView(item.route.view);
    if (item.route.param) {
      setViewParam(item.route.param);
    }
    onClose();
  };

  const filtered = notifications.filter(n => {
    if (n.snoozed) return false;
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  if (!isOpen) return null;

  return (
    <div 
      className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 bg-[#0A1628] border-b border-[#1C2D4A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E88B2A]/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#E88B2A]" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-[#F4EFE6] flex items-center gap-2">
              Notifications & Alerts
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#E88B2A] text-[#0A1628]">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#A8A299]">Live port and billing alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-[#E88B2A] hover:underline flex items-center gap-1 font-semibold"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-2 bg-[#0A1628]/50 border-b border-[#1C2D4A] overflow-x-auto text-[11px]">
        {[
          { id: 'all', label: 'All' },
          { id: 'shipment', label: 'Shipments' },
          { id: 'invoice', label: 'Invoices' },
          { id: 'payment', label: 'Payments' },
          { id: 'agent', label: 'Agents' },
          { id: 'document', label: 'Docs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-[#16263F] text-[#E88B2A] border border-[#E88B2A]/40 font-semibold'
                : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#1C2D4A]/60">
        {filtered.length > 0 ? (
          filtered.map(item => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                !item.read ? 'bg-[#16263F]/40 hover:bg-[#16263F]/70' : 'hover:bg-[#16263F]/30'
              }`}
            >
              {/* Type Icon */}
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                  item.priority === 'critical'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                    : item.type === 'shipment'
                    ? 'bg-[#E88B2A]/20 text-[#E88B2A]'
                    : item.type === 'invoice'
                    ? 'bg-amber-950 text-amber-400'
                    : item.type === 'payment'
                    ? 'bg-emerald-950 text-emerald-400'
                    : item.type === 'agent'
                    ? 'bg-sky-950 text-sky-400'
                    : 'bg-purple-950 text-purple-400'
                }`}
              >
                {item.type === 'shipment' && <Ship className="w-4 h-4" />}
                {item.type === 'invoice' && <Receipt className="w-4 h-4" />}
                {item.type === 'payment' && <CreditCard className="w-4 h-4" />}
                {item.type === 'agent' && <MessageSquare className="w-4 h-4" />}
                {item.type === 'document' && <FileBox className="w-4 h-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-semibold truncate ${!item.read ? 'text-[#F4EFE6]' : 'text-slate-300'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[#6E6A64] whitespace-nowrap shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A299] line-clamp-2 mt-0.5">
                  {item.description}
                </p>

                {/* Actions Row */}
                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  {!item.read && (
                    <button
                      onClick={e => markAsRead(item.id, e)}
                      className="text-[#E88B2A] hover:underline flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                  <button
                    onClick={e => snoozeNotification(item.id, e)}
                    className="text-[#A8A299] hover:text-[#F4EFE6] flex items-center gap-0.5"
                  >
                    <Clock className="w-3 h-3" /> Snooze 4h
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 flex items-center self-center">
                {!item.read ? (
                  <span className="w-2 h-2 rounded-full bg-[#E88B2A]"></span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#6E6A64]" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-[#A8A299]">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold text-[#F4EFE6]">All caught up!</p>
            <p className="text-[11px] text-[#6E6A64] mt-0.5">No notifications in this view.</p>
          </div>
        )}
      </div>

      {/* Footer Link to Settings */}
      <div className="p-2.5 bg-[#0A1628] border-t border-[#1C2D4A] flex items-center justify-between text-xs">
        <button
          onClick={() => {
            setActiveView('settings');
            onClose();
          }}
          className="text-[#A8A299] hover:text-[#F4EFE6] flex items-center gap-1.5 text-[11px] font-medium"
        >
          <Settings className="w-3.5 h-3.5" />
          Notification Preferences
        </button>
        <span className="text-[10px] text-[#6E6A64] font-mono">
          Auto-synced
        </span>
      </div>
    </div>
  );
};
