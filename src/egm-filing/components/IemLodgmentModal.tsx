import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { EgmFiling } from '../types';

interface IemLodgmentModalProps {
  filing: EgmFiling;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (iemNumber: string) => void;
}

export const IemLodgmentModal: React.FC<IemLodgmentModalProps> = ({
  filing,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [iemInput, setIemInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = iemInput.trim();
    if (!clean) {
      setError('Please enter the Indian Customs ICEGATE IEM Acknowledgement Number.');
      return;
    }
    if (clean.length < 5) {
      setError('IEM Acknowledgement number should be at least 5 alphanumeric characters.');
      return;
    }
    setError('');
    onSubmit(clean);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2 border-b border-[#1C2D4A]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
              Mark EGM as Lodged to ICEGATE
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
            <span className="text-[#A8A299]">Vessel / Voyage:</span>
            <span className="font-mono font-bold text-[#F4EFE6]">{filing.vesselVoyage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A8A299]">Port of Loading:</span>
            <span className="text-[#F4EFE6]">{filing.pol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A8A299]">Manifest Items:</span>
            <span className="text-[#E88B2A] font-bold">{filing.hblList.length} HBLs ({filing.containerCount} Containers)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A8A299] mb-1.5">
              ICEGATE IEM Number (Indian Export Manifest Reference):
            </label>
            <input
              type="text"
              placeholder="e.g. IEM-MUN-2026-881920"
              value={iemInput}
              onChange={e => {
                setIemInput(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 text-sm bg-[#16263F] border border-[#26395A] rounded-xl text-[#F4EFE6] font-mono placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
              autoFocus
            />
            {error && (
              <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
            <p className="text-[11px] text-[#A8A299] mt-1.5">
              Reference provided upon successful flat file transmission on the Indian Customs Electronic Gateway (ICEGATE 2.0).
            </p>
          </div>

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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Lodgment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
