import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { EgmFiling } from '../types';
import { DGFT_REASON_CODES } from '../data/mockEgmData';

interface SupplementaryAmendmentModalProps {
  filing: EgmFiling;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    reasonCode: string;
    reasonDescription: string;
    newTotalGrossWtKg?: number;
  }) => void;
}

export const SupplementaryAmendmentModal: React.FC<SupplementaryAmendmentModalProps> = ({
  filing,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [reasonCode, setReasonCode] = useState(DGFT_REASON_CODES[0].code);
  const [newGrossWt, setNewGrossWt] = useState(filing.totalGrossWtKg.toString());
  const [reasonDesc, setReasonDesc] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wtNum = Number(newGrossWt);
    if (isNaN(wtNum) || wtNum <= 0) {
      setError('Please provide a valid gross cargo weight in KG.');
      return;
    }
    if (!reasonDesc.trim()) {
      setError('Please provide officer notes or the customs examination order justification.');
      return;
    }
    setError('');
    onSubmit({
      reasonCode,
      reasonDescription: reasonDesc.trim(),
      newTotalGrossWtKg: wtNum
    });
  };

  const selectedDgftInfo = DGFT_REASON_CODES.find(c => c.code === reasonCode);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800">
              <RefreshCw className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
              File Supplementary EGM Amendment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A8A299] hover:text-[#F4EFE6] p-1 rounded-lg hover:bg-[#16263F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-[#16263F]/70 border border-[#26395A] rounded-xl text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#A8A299]">Vessel Voyage:</span>
            <span className="font-mono font-bold text-[#F4EFE6]">{filing.vesselVoyage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A8A299]">Original Manifest Weight:</span>
            <span className="font-mono text-zinc-300">{(filing.totalGrossWtKg).toLocaleString()} KG ({(filing.totalGrossWtKg / 1000).toFixed(1)} MT)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A8A299]">ICEGATE Reference:</span>
            <span className="font-mono text-[#E88B2A]">{filing.iemNumber || 'Draft'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[#A8A299] font-semibold block mb-1.5">
              DGFT Amendment Reason Code:
            </label>
            <select
              value={reasonCode}
              onChange={e => setReasonCode(e.target.value)}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
            >
              {DGFT_REASON_CODES.map(rc => (
                <option key={rc.code} value={rc.code}>
                  {rc.label}
                </option>
              ))}
            </select>
            {selectedDgftInfo && (
              <p className="text-[11px] text-[#A8A299] mt-1 italic">
                {selectedDgftInfo.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-[#A8A299] font-semibold block mb-1.5">
              Revised Total Gross Cargo Weight (KG):
            </label>
            <input
              type="number"
              placeholder="e.g. 582000"
              value={newGrossWt}
              onChange={e => {
                setNewGrossWt(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] font-mono focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          <div>
            <label className="text-[#A8A299] font-semibold block mb-1.5">
              Customs Officer Notes / Order Justification:
            </label>
            <textarea
              rows={3}
              placeholder="State reason per customs examination report (e.g., SOLAS VGM weighbridge variance or container re-stuffing)..."
              value={reasonDesc}
              onChange={e => {
                setReasonDesc(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#16263F] border border-[#26395A] rounded-xl p-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#E88B2A]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1C2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#16263F] text-xs font-semibold text-[#A8A299] hover:text-[#F4EFE6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>File Supplementary EGM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
