import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        };

        const borderStyles = {
          success: 'border-emerald-600/40 bg-[#0F1D33]/95 shadow-emerald-950/20',
          error: 'border-rose-600/40 bg-[#0F1D33]/95 shadow-rose-950/20',
          warning: 'border-amber-600/40 bg-[#0F1D33]/95 shadow-amber-950/20',
          info: 'border-sky-600/40 bg-[#0F1D33]/95 shadow-sky-950/20'
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 text-left ${borderStyles}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#F4EFE6] leading-snug">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-[#A8A299] mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#6E6A64] hover:text-[#F4EFE6] transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
