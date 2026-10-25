import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  Bell,
  Globe,
  DollarSign,
  Save,
  CheckCircle,
  Key,
  Lock,
  Anchor,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, updateCurrentUser, theme, toggleTheme, density, toggleDensity, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'notifications'>('profile');

  // Profile Form state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [title, setTitle] = useState(currentUser.title);
  const [department, setDepartment] = useState(currentUser.department);
  const [avatar, setAvatar] = useState(currentUser.avatar || 'AD');

  // Logistics & Preferences state
  const [primaryPort, setPrimaryPort] = useState(() => localStorage.getItem('maps_pref_port') || 'INMUN1');
  const [currency, setCurrency] = useState(() => localStorage.getItem('maps_pref_currency') || 'INR');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('maps_pref_date_format') || 'DD/MM/YYYY');

  // Notifications state
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyIcegate, setNotifyIcegate] = useState(true);
  const [notifyDemurrage, setNotifyDemurrage] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Validation Error', 'Name cannot be blank.');
      return;
    }

    // Save profile updates
    updateCurrentUser({
      name,
      email,
      phone,
      title,
      department,
      avatar: avatar.toUpperCase().slice(0, 2)
    });

    // Save preferences
    localStorage.setItem('maps_pref_port', primaryPort);
    localStorage.setItem('maps_pref_currency', currency);
    localStorage.setItem('maps_pref_date_format', dateFormat);

    onClose();
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Security Check', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Security Updated', 'Password successfully changed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0A1628] border border-[#1C2E4C] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1C2E4C] bg-[#0F1D33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E88B2A] to-[#B06010] flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-[#E88B2A]/20">
              {avatar || 'AD'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F4EFE6] font-display">
                  Account Settings & Preferences
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#A8A299]">
                Manage personal profile, branch defaults, notifications, and security
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-5 bg-[#08101E] border-b border-[#15233C] gap-1 overflow-x-auto text-xs">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'preferences', label: 'Preferences & Port', icon: Globe },
            { id: 'notifications', label: 'Alerts & Comms', icon: Bell },
            { id: 'security', label: 'Security & Auth', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#E88B2A] text-[#E88B2A]'
                    : 'border-transparent text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] font-medium focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Initials / Avatar Code (2 Chars)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={avatar}
                    onChange={e => setAvatar(e.target.value.toUpperCase())}
                    className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg px-3 py-2 text-[#F4EFE6] font-mono font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Official Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="Executive Management">Executive Management</option>
                      <option value="Operations & CFS Logistics">Operations & CFS Logistics</option>
                      <option value="Commercial & Sales">Commercial & Sales</option>
                      <option value="Finance & Tax Accounts">Finance & Tax Accounts</option>
                      <option value="Customs Documentation">Customs Documentation</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#08101E] border border-[#16263F] rounded-xl flex items-center justify-between text-xs text-[#A8A299]">
                <div>
                  <span className="font-semibold text-[#F4EFE6] block">Account Status: Active</span>
                  <span>Last session authenticated: {currentUser.lastLogin || 'Today, 09:15 AM'}</span>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  VERIFIED
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-slate-950 font-bold text-xs transition-colors shadow-md shadow-[#E88B2A]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Default Port of Loading (POL)
                  </label>
                  <div className="relative">
                    <Anchor className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <select
                      value={primaryPort}
                      onChange={e => setPrimaryPort(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="INMUN1">Mundra Port (INMUN1) - APSEZ / MICT</option>
                      <option value="INIXY1">Kandla Port (INIXY1) - DPT</option>
                      <option value="INNSA1">Nhava Sheva (INNSA1) - JNPA</option>
                      <option value="INPAV1">Pipavav Port (INPAV1) - APM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Default Operating Currency
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="INR">INR (₹) - Indian Rupee (Default GST)</option>
                      <option value="USD">USD ($) - US Dollar (Ocean Freight)</option>
                      <option value="EUR">EUR (€) - Euro (Europe Corridors)</option>
                      <option value="AED">AED (د.إ) - UAE Dirham (Gulf)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Date & Timestamp Format
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <select
                      value={dateFormat}
                      onChange={e => setDateFormat(e.target.value)}
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Standard Indian Logistics)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 Customs EDI)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Liner Format)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Table Display Density
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={toggleDensity}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                        density === 'dense'
                          ? 'bg-[#E88B2A]/20 border-[#E88B2A] text-[#E88B2A]'
                          : 'bg-[#0F1D33] border-[#26395A] text-[#A8A299]'
                      }`}
                    >
                      Compact (ERP Grid)
                    </button>
                    <button
                      type="button"
                      onClick={toggleDensity}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                        density === 'comfortable'
                          ? 'bg-[#E88B2A]/20 border-[#E88B2A] text-[#E88B2A]'
                          : 'bg-[#0F1D33] border-[#26395A] text-[#A8A299]'
                      }`}
                    >
                      Comfortable
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('maps_pref_port', primaryPort);
                    localStorage.setItem('maps_pref_currency', currency);
                    localStorage.setItem('maps_pref_date_format', dateFormat);
                    showToast('success', 'Preferences Saved', 'Operating defaults updated.');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-slate-950 font-bold text-xs transition-colors shadow-md shadow-[#E88B2A]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <p className="text-xs text-[#A8A299]">
                Choose which automated triggers deliver notifications to your dashboard and mobile channels:
              </p>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D33] border border-[#26395A] cursor-pointer hover:border-[#E88B2A]/40 transition-colors">
                  <div>
                    <span className="font-semibold text-[#F4EFE6] block">WhatsApp Dispatch Alerts</span>
                    <span className="text-[11px] text-[#A8A299]">Receive customer booking, BL issuance, and arrival notice copy on WhatsApp</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={e => setNotifyWhatsapp(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E88B2A] focus:ring-0 bg-[#16263F] border-[#26395A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D33] border border-[#26395A] cursor-pointer hover:border-[#E88B2A]/40 transition-colors">
                  <div>
                    <span className="font-semibold text-[#F4EFE6] block">ICEGATE EDI Status & LEO Approvals</span>
                    <span className="text-[11px] text-[#A8A299]">Instant push alert when customs grants Let Export Order (LEO) or flags error</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyIcegate}
                    onChange={e => setNotifyIcegate(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E88B2A] focus:ring-0 bg-[#16263F] border-[#26395A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D33] border border-[#26395A] cursor-pointer hover:border-[#E88B2A]/40 transition-colors">
                  <div>
                    <span className="font-semibold text-[#F4EFE6] block">Demurrage & D&D Expiry Warnings (&lt; 48h)</span>
                    <span className="text-[11px] text-[#A8A299]">Alert when destination free time falls below 48 hours to prevent port fines</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyDemurrage}
                    onChange={e => setNotifyDemurrage(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E88B2A] focus:ring-0 bg-[#16263F] border-[#26395A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0F1D33] border border-[#26395A] cursor-pointer hover:border-[#E88B2A]/40 transition-colors">
                  <div>
                    <span className="font-semibold text-[#F4EFE6] block">Approval Queue Escalations</span>
                    <span className="text-[11px] text-[#A8A299]">Notify when high-value waivers, D/O releases, or special discounts require action</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyApprovals}
                    onChange={e => setNotifyApprovals(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E88B2A] focus:ring-0 bg-[#16263F] border-[#26395A]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', 'Alert Rules Saved', 'Operational notifications updated.');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-slate-950 font-bold text-xs transition-colors shadow-md shadow-[#E88B2A]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Subscriptions</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8A299] font-medium mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6A64]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#0F1D33] border border-[#26395A] focus:border-[#E88B2A] rounded-lg pl-9 pr-3 py-2 text-[#F4EFE6] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#08101E] border border-[#16263F] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#F4EFE6] block">Two-Factor Authentication (2FA)</span>
                  <span className="text-[11px] text-[#A8A299]">SMS OTP to {phone} active for financial release authorizations</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800 text-[10px]">
                  ENABLED
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-slate-950 font-bold text-xs transition-colors shadow-md shadow-[#E88B2A]/20"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
