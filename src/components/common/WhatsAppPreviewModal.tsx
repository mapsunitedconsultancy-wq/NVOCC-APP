import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  X,
  Check,
  Smartphone,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  phoneNumber?: string;
  defaultMessage: string;
  shipmentId?: string;
  docTitle?: string;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  phoneNumber = '+91 98250 12345',
  defaultMessage,
  shipmentId,
  docTitle
}) => {
  const { sendMessage, showToast } = useApp();
  const [messageText, setMessageText] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(phoneNumber);

  // Sync if defaultMessage changes
  React.useEffect(() => {
    setMessageText(defaultMessage);
  }, [defaultMessage]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    showToast('info', 'Message Copied', 'WhatsApp message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendApi = () => {
    sendMessage({
      shipmentId,
      partyName: recipientName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: `${recipientName} (${phone})`,
      body: messageText,
      status: 'Sent'
    });
    showToast('success', 'WhatsApp Dispatched', `Delivered via AiSensy Gateway to ${phone}`);
    onClose();
  };

  const handleOpenWhatsAppWeb = () => {
    const encoded = encodeURIComponent(messageText);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    sendMessage({
      shipmentId,
      partyName: recipientName,
      channel: 'WhatsApp',
      direction: 'Outbound',
      recipient: `${recipientName} (${phone})`,
      body: messageText,
      status: 'Sent'
    });
    onClose();
  };

  const insertVariable = (variable: string) => {
    setMessageText(prev => prev + ' ' + variable);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0A1628] border border-[#26395A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* WhatsApp Top Header Bar */}
        <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-sm shadow">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm leading-tight">{recipientName}</h3>
                <span className="text-[10px] bg-[#128C7E] px-1.5 py-0.2 rounded font-mono">
                  Verified Business
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                <Smartphone className="w-3 h-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="bg-transparent border-b border-emerald-300/40 text-xs text-white focus:outline-none w-32 font-mono"
                />
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[#10233F] border-b border-[#1C2D4A] px-4 py-2 flex items-center justify-between text-xs text-[#A8A299]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AiSensy Official WhatsApp Business API Gateway
          </span>
          {shipmentId && (
            <span className="font-mono text-[#E88B2A] font-bold">
              {shipmentId}
            </span>
          )}
        </div>

        {/* WhatsApp Chat Simulated Screen */}
        <div className="p-4 bg-[#0B141B] flex-1 overflow-y-auto space-y-3">
          {/* WhatsApp message bubble */}
          <div className="bg-[#005C4B] text-white rounded-lg rounded-tr-none p-3.5 max-w-[92%] ml-auto shadow-md border border-[#02735E]/40 font-sans">
            <div className="text-[11px] text-emerald-200 font-semibold mb-1 flex items-center justify-between">
              <span>MAPS NVOCC Dispatch</span>
              <span className="font-mono text-[9px] text-emerald-300">Today 14:32</span>
            </div>

            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              rows={8}
              className="w-full bg-black/20 rounded p-2 text-xs text-white font-sans leading-relaxed resize-none focus:outline-none border border-emerald-500/20 focus:border-emerald-400"
              placeholder="Type or edit your WhatsApp template..."
            />

            {docTitle && (
              <div className="mt-2.5 p-2 bg-[#024B3D] rounded border border-emerald-600/30 flex items-center justify-between text-xs">
                <span className="truncate text-emerald-100 font-medium">📎 {docTitle}</span>
                <span className="text-[10px] text-emerald-300 font-mono">PDF Stamped</span>
              </div>
            )}

            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-300 font-mono">
              <span>Read</span>
              <span className="text-sky-300 font-bold">✓✓</span>
            </div>
          </div>

          {/* Quick Insert Variables */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A299] flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#E88B2A]" />
              Quick Variables:
            </span>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                `https://mapsfreight.in/track/${shipmentId || 'MAPS-240342'}`,
                'ETA: 18 Oct 2026',
                'Mundra APSEZ Berth 2',
                'Container: MSKU2345678',
                'LUT #AD2404260012891'
              ].map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded bg-[#16263F] hover:bg-[#1E3558] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0F1D33] p-3.5 border-t border-[#1C2D4A] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1E3558] text-xs font-semibold text-[#F4EFE6] border border-[#26395A] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#A8A299]" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D3557] hover:bg-[#254572] text-xs font-semibold text-[#F4EFE6] border border-[#26395A] transition-colors"
              title="Open chat in WhatsApp Web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Open WhatsApp Web
            </button>

            <button
              type="button"
              onClick={handleSendApi}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-xs font-bold text-slate-950 shadow-md shadow-emerald-900/40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Send via Business API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
