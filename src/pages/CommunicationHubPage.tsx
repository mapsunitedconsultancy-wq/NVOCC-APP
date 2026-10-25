import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CommunicationMessage } from '../types';
import { MessageSquare, Send, Mail, CheckCircle2, Search, Filter, Smartphone, Bot } from 'lucide-react';

export const CommunicationHubPage: React.FC = () => {
  const { communications, sendMessage, shipments, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'inbox' | 'templates' | 'triggers' | 'gateway'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick compose state
  const [recipient, setRecipient] = useState('+91 98250 11223 (Krishna Ceramics)');
  const [channel, setChannel] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [messageText, setMessageText] = useState('');

  // 20+ Alert Templates with dynamic variable insertion
  const alertTemplates = [
    { id: 't1', title: 'Booking Confirmation', cat: 'Status', text: 'Dear [SHIPPER_NAME], your shipment [SHIPMENT_ID] has been booked with [CARRIER] on vessel [VESSEL]. HBL ready by [DATE]. Track: https://mapsfreight.com/track/[SHIPMENT_ID]' },
    { id: 't2', title: 'Factory Container Pickup', cat: 'Status', text: 'Container [CONTAINER_NO] picked up from factory on [DATE]. In transit to Mundra CFS.' },
    { id: 't3', title: 'CFS Gate-In & Customs', cat: 'Status', text: 'Container [CONTAINER_NO] arrived at [CFS_NAME] on [DATE]. Shipping Bill filed, customs examination in progress.' },
    { id: 't4', title: 'Customs LEO Clearance', cat: 'Status', text: 'Let Export Order (LEO) granted for [SHIPMENT_ID] on [DATE] at [TIME]. Moving to port gate.' },
    { id: 't5', title: 'Port Gate-In (MICT)', cat: 'Status', text: 'Container [CONTAINER_NO] entered Mundra Port Gate on [DATE] within CY cutoff.' },
    { id: 't6', title: 'Vessel Sailing Alert', cat: 'Status', text: 'Vessel [VESSEL] with container [CONTAINER_NO] has sailed from Mundra on [DATE]. ETA [POD] on [ETA_DATE].' },
    { id: 't7', title: 'Destination Port Discharge', cat: 'Status', text: 'Container [CONTAINER_NO] discharged at [POD] on [DATE]. Free time clock initiated.' },
    { id: 't8', title: 'Cargo Delivered Proof', cat: 'Status', text: 'Container [CONTAINER_NO] successfully delivered to [CONSIGNEE] on [DATE]. Signed POD in vault.' },
    { id: 't9', title: 'Demurrage Warning Alert', cat: 'Risk', text: 'URGENT: Container [CONTAINER_NO] free time expires in [HOURS] hours. Current demurrage tariff: ₹[AMOUNT]/day.' },
    { id: 't10', title: 'Vessel Schedule Delay', cat: 'Risk', text: 'Carrier Notice: Vessel [VESSEL] delayed by [DAYS] days due to port congestion. New ETA: [NEW_ETA].' },
    { id: 't11', title: 'Missing VGM Alert', cat: 'Risk', text: 'CRITICAL: Verified Gross Mass (VGM) missing for [CONTAINER_NO]. Cutoff in [HOURS] hours.' },
    { id: 't12', title: 'Invoice Due Reminder', cat: 'Billing', text: 'Tax Invoice [INVOICE_NO] of ₹[AMOUNT] is due in [DAYS] days. Pay via UPI: mapsfreight@hdfcbank' },
    { id: 't13', title: 'Payment Receipt Thanks', cat: 'Billing', text: 'Payment of ₹[AMOUNT] received for Invoice [INVOICE_NO]. Official receipt credited to ledger.' },
    { id: 't14', title: 'Overdue Notice (30d)', cat: 'Billing', text: 'Overdue Notice: Invoice [INVOICE_NO] of ₹[AMOUNT] is overdue by [DAYS] days. Please clear today.' },
    { id: 't15', title: 'HBL Original Ready', cat: 'Docs', text: '3 Original House Bills of Lading (HBL) issued for [SHIPMENT_ID]. Dispatched via BlueDart AWB [AWB].' },
    { id: 't16', title: 'Quotation Shared', cat: 'Sales', text: 'Dear [NAME], your freight quotation [QUOTE_NO] for Mundra to [POD] is ready. View & accept: [LINK]' }
  ];

  const handleApplyTemplate = (tmpl: any) => {
    setMessageText(
      tmpl.text
        .replace('[SHIPPER_NAME]', 'Krishna Ceramics')
        .replace('[SHIPMENT_ID]', 'MAPS-240342')
        .replace('[CARRIER]', 'MSC')
        .replace('[VESSEL]', 'MSC JADE 437W')
        .replace('[CONTAINER_NO]', 'MSKU2345678')
        .replace('[DATE]', '15 Oct 2026')
        .replace('[POD]', 'Hamburg')
        .replace('[ETA_DATE]', '15 Nov 2026')
    );
    showToast('info', 'Template Applied', tmpl.title);
  };

  const handleSendQuickMessage = () => {
    if (!messageText.trim()) return;
    sendMessage({
      partyName: 'Krishna Ceramics',
      channel,
      direction: 'Outbound',
      recipient,
      body: messageText,
      status: 'Sent'
    });
    setMessageText('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#E88B2A]" />
            Unified Communication Hub & WhatsApp Gateway
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Automated WhatsApp notifications, client status alerts, and email threads via AiSensy & SMTP
          </p>
        </div>

        {/* Gateway indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1D33] border border-emerald-800/60 text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AiSensy WhatsApp API: Connected (+91 98765 43210)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1C2D4A] pb-1">
        {[
          { id: 'inbox', label: 'Live Unified Stream' },
          { id: 'templates', label: '20+ Industry Alert Templates' },
          { id: 'triggers', label: 'Automated Trigger Rules' },
          { id: 'gateway', label: 'AiSensy & SMS Gateway Health' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition-colors ${
              activeTab === t.id
                ? 'bg-[#16263F] text-[#E88B2A] border-b-2 border-[#E88B2A]'
                : 'text-[#A8A299] hover:text-[#F4EFE6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INBOX & QUICK DISPATCH */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Messages list (2 Cols) */}
          <div className="lg:col-span-2 bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
              <span className="font-bold text-sm text-[#F4EFE6]">Real-Time Message Dispatch Stream</span>
              <span className="text-[#A8A299] font-mono">{communications.length} Messages</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {communications.map(msg => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-[#16263F] border border-[#26395A] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold flex items-center gap-1.5 ${
                      msg.channel === 'WhatsApp' ? 'text-emerald-400' : 'text-sky-400'
                    }`}>
                      {msg.channel === 'WhatsApp' ? <Smartphone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      {msg.direction} • {msg.partyName}
                    </span>
                    <span className="text-[10px] font-mono text-[#6E6A64]">{msg.timestamp}</span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed">{msg.body}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#6E6A64] pt-1 border-t border-[#1C2D4A]">
                    <span>To: {msg.recipient}</span>
                    <span className="text-emerald-400 font-bold uppercase">{msg.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Dispatch Composer (1 Col) */}
          <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
            <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
              Quick Broadcast Dispatch
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setChannel('WhatsApp')}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      channel === 'WhatsApp' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-[#16263F] text-[#A8A299] border-[#26395A]'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setChannel('Email')}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      channel === 'Email' ? 'bg-sky-950 text-sky-300 border-sky-700' : 'bg-[#16263F] text-[#A8A299] border-[#26395A]'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Recipient Mobile / Email</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
                />
              </div>

              <div>
                <label className="block text-[#A8A299] mb-1 font-semibold">Message Text</label>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  rows={6}
                  placeholder="Type message or pick an alert template from the Templates tab..."
                  className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] leading-relaxed text-xs focus:border-[#E88B2A]"
                />
              </div>

              <button
                onClick={handleSendQuickMessage}
                className="w-full py-2 rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#E88B2A]/20"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Alert Instantly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alertTemplates.map(tmpl => (
            <div
              key={tmpl.id}
              className="p-3.5 rounded-xl bg-[#0F1D33] border border-[#26395A] hover:border-[#E88B2A]/50 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#E88B2A] uppercase tracking-wider">{tmpl.cat}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Pre-Approved</span>
                </div>
                <h4 className="font-bold text-sm text-[#F4EFE6] mt-1">{tmpl.title}</h4>
                <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed bg-[#16263F] p-2 rounded border border-[#1C2D4A] font-sans">
                  {tmpl.text}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1C2D4A] flex justify-end">
                <button
                  onClick={() => {
                    handleApplyTemplate(tmpl);
                    setActiveTab('inbox');
                  }}
                  className="text-xs font-bold text-[#E88B2A] hover:underline"
                >
                  Use Template in Compose →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TRIGGERS */}
      {activeTab === 'triggers' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            Configured Automated Event Triggers (Business Hours: 09:00 - 19:00 IST)
          </span>

          <div className="space-y-2">
            {[
              { rule: 'IF Container status = "Sailed" THEN send WhatsApp sailing notification to Shipper', active: true },
              { rule: 'IF Port Gate-In recorded by MICT EDI THEN dispatch customs LEO confirmation', active: true },
              { rule: 'IF Free time expiry < 48 hours THEN alert Shipper, Consignee & Operations Desk', active: true },
              { rule: 'IF Invoice unpaid > 15 days THEN trigger WhatsApp payment link reminder', active: true },
              { rule: 'IF Vessel delayed > 48h THEN dispatch EDI carrier schedule revision advisory', active: true }
            ].map((r, i) => (
              <div key={i} className="p-3 bg-[#16263F] border border-[#26395A] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#E88B2A]" />
                  <span className="font-mono text-zinc-200">{r.rule}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GATEWAY */}
      {activeTab === 'gateway' && (
        <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-4 space-y-3">
          <span className="font-bold text-sm text-[#F4EFE6] block pb-2 border-b border-[#1C2D4A]">
            AiSensy WhatsApp API Gateway Configuration
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#16263F] border border-[#26395A]">
              <span className="text-[#A8A299] block font-semibold text-[10px]">Registered Sender ID</span>
              <span className="text-sm font-bold text-[#F4EFE6] font-mono">+91 98765 43210</span>
              <p className="text-[10px] text-emerald-400 mt-1">Official Meta Green Tick Verified</p>
            </div>
            <div className="p-3 rounded-lg bg-[#16263F] border border-[#26395A]">
              <span className="text-[#A8A299] block font-semibold text-[10px]">Daily Quota</span>
              <span className="text-sm font-bold text-[#F4EFE6] font-mono">1,420 / 10,000</span>
              <p className="text-[10px] text-zinc-400 mt-1">Tier 2 Enterprise Tier</p>
            </div>
            <div className="p-3 rounded-lg bg-[#16263F] border border-[#26395A]">
              <span className="text-[#A8A299] block font-semibold text-[10px]">Delivery Success Rate</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">99.8%</span>
              <p className="text-[10px] text-zinc-400 mt-1">Avg latency: 1.2s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
