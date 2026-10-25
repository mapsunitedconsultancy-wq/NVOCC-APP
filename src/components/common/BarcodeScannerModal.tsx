import React, { useState, useEffect } from 'react';
import {
  Scan,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  RefreshCw,
  Box,
  Hash
} from 'lucide-react';
import { validateISO6346 } from '../../utils/formatters';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (containerNumber: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Container EIR Barcode / ISO 6346 Code'
}) => {
  const [scannedValue, setScannedValue] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [detectedConfidence, setDetectedConfidence] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScannedValue('');
      setIsScanning(true);
      setDetectedConfidence(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (code: string) => {
    setIsScanning(false);
    setScannedValue(code);
    setDetectedConfidence(99.4);
  };

  const handleConfirm = () => {
    if (scannedValue) {
      onScan(scannedValue);
      onClose();
    }
  };

  const validation = scannedValue ? validateISO6346(scannedValue) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0A1628] border border-[#26395A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1C2D4A] flex items-center justify-between bg-[#0F1D33]">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#E88B2A]" />
            <h3 className="font-bold text-sm text-[#F4EFE6]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Simulator */}
        <div className="p-4 space-y-4">
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-[#26395A] flex flex-col items-center justify-center">
            {/* Viewport overlay */}
            <div className="absolute inset-4 border-2 border-dashed border-[#E88B2A]/60 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="w-4 h-4 border-t-2 border-l-2 border-[#E88B2A]"></span>
                <span className="w-4 h-4 border-t-2 border-r-2 border-[#E88B2A]"></span>
              </div>
              <div className="flex justify-between">
                <span className="w-4 h-4 border-b-2 border-l-2 border-[#E88B2A]"></span>
                <span className="w-4 h-4 border-b-2 border-r-2 border-[#E88B2A]"></span>
              </div>
            </div>

            {/* Scanning Laser Animation */}
            {isScanning && (
              <div className="absolute left-6 right-6 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse">
                <div className="w-full h-8 bg-gradient-to-b from-rose-500/20 to-transparent -translate-y-8"></div>
              </div>
            )}

            {/* Camera feed or Scanned confirmation */}
            <div className="text-center space-y-2 z-10 px-4">
              {isScanning ? (
                <>
                  <Camera className="w-10 h-10 text-[#6E6A64] mx-auto animate-bounce" />
                  <p className="text-xs text-[#A8A299]">
                    Point camera at container door markings or EIR barcode
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Auto-ISO 6346 Optical Engine Active
                  </span>
                </>
              ) : (
                <div className="space-y-2 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#F4EFE6] tracking-wider bg-black/60 px-3 py-1 rounded border border-[#26395A]">
                    {scannedValue}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    OCR Confidence: {detectedConfidence}% • Check digit verified
                  </p>
                </div>
              )}
            </div>

            <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-[#6E6A64] bg-black/60 backdrop-blur-sm py-0.5 rounded">
              Gandhidham CFS Optical Scanner v2.5
            </div>
          </div>

          {/* Quick Test / Sample Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#A8A299]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Or Test with sample container:</span>
              <button
                type="button"
                onClick={() => { setIsScanning(true); setScannedValue(''); }}
                className="flex items-center gap-1 text-[10px] text-[#E88B2A] hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Reset Camera
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { code: 'MSKU2345678', line: 'Maersk Line' },
                { code: 'MRKU8891234', line: 'Maersk Tank' },
                { code: 'CMAU7712390', line: 'CMA CGM' },
                { code: 'ONEU6629184', line: 'ONE Line' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSimulateScan(item.code)}
                  className="p-2 rounded-lg bg-[#16263F] hover:bg-[#1E3558] border border-[#26395A] text-left transition-colors group flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[#F4EFE6] group-hover:text-[#E88B2A]">{item.code}</span>
                    <span className="block text-[10px] text-[#A8A299] font-sans">{item.line}</span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-[#6E6A64] group-hover:text-[#E88B2A]" />
                </button>
              ))}
            </div>
          </div>

          {/* ISO 6346 Analysis */}
          {validation && (
            <div className={`p-2.5 rounded-lg border text-xs ${
              validation.isValid 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {validation.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                <span>{validation.isValid ? 'Valid ISO 6346 Container' : 'Check Digit Warning'}</span>
              </div>
              <p className="text-[11px] mt-1 text-[#A8A299]">
                Owner: <strong className="text-[#F4EFE6]">{validation.ownerCode}</strong> • Category: <strong className="text-[#F4EFE6]">{validation.equipmentCategory}</strong> • Serial: <strong className="text-[#F4EFE6]">{validation.serialNumber}</strong> • Check: <strong className="text-[#F4EFE6]">{validation.checkDigit}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[#1C2D4A] bg-[#0F1D33] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!scannedValue}
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] disabled:opacity-40 transition-all shadow-md shadow-[#E88B2A]/20"
          >
            Apply Container ({scannedValue || 'None'})
          </button>
        </div>
      </div>
    </div>
  );
};
