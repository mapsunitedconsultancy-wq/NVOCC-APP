import React from 'react';
import {
  Keyboard,
  X,
  Search,
  Plus,
  Ship,
  FileText,
  DollarSign,
  Box,
  LayoutDashboard
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Global & Navigation',
      shortcuts: [
        { keys: ['⌘', 'K'], alt: ['Ctrl', 'K'], desc: 'Open Universal Search Palette' },
        { keys: ['/'], desc: 'Quick-focus Search' },
        { keys: ['?'], desc: 'Show this Keyboard Shortcuts legend' },
        { keys: ['ESC'], desc: 'Close open modal or slide-over' }
      ]
    },
    {
      category: 'Creation & Wizards',
      shortcuts: [
        { keys: ['⌘', 'N'], alt: ['Ctrl', 'N'], desc: 'Create New Shipment Booking' },
        { keys: ['⌘', 'H'], alt: ['Ctrl', 'H'], desc: 'Generate House B/L (HBL)' },
        { keys: ['⌘', 'I'], alt: ['Ctrl', 'I'], desc: 'Create GST Tax Invoice' }
      ]
    },
    {
      category: 'Module Quick Jumps (Press G then Key)',
      shortcuts: [
        { keys: ['G', 'D'], desc: 'Go to Command Center Dashboard' },
        { keys: ['G', 'S'], desc: 'Go to Shipments List' },
        { keys: ['G', 'C'], desc: 'Go to Container Control (D&D)' },
        { keys: ['G', 'B'], desc: 'Go to House B/L (HBL)' },
        { keys: ['G', 'I'], desc: 'Go to Invoicing & GST' },
        { keys: ['G', 'V'], desc: 'Go to Document Vault' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0A1628] border border-[#26395A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1C2D4A] flex items-center justify-between bg-[#0F1D33]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#E88B2A]/20 text-[#E88B2A]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F4EFE6]">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-[#A8A299]">Speed up daily NVOCC operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#16263F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#E88B2A] flex items-center gap-1.5">
                <span>{group.category}</span>
              </h4>

              <div className="bg-[#0F1D33] border border-[#1C2D4A] rounded-xl divide-y divide-[#1C2D4A] overflow-hidden">
                {group.shortcuts.map((sc, sIdx) => (
                  <div key={sIdx} className="p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#F4EFE6]">{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#16263F] border border-[#26395A] text-[#E88B2A] shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                      {sc.alt && (
                        <span className="text-[10px] text-[#6E6A64] ml-1 font-mono">
                          or {sc.alt.join('+')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1C2D4A] bg-[#0F1D33] text-center text-[11px] text-[#A8A299]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[#16263F] text-[#E88B2A] font-mono border border-[#26395A]">?</kbd> anywhere to open or dismiss this cheat-sheet.
        </div>
      </div>
    </div>
  );
};
