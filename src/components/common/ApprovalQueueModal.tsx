import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApprovalRequest } from '../../types/v4Types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

interface ApprovalQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApprovalQueueModal: React.FC<ApprovalQueueModalProps> = ({
  isOpen,
  onClose
}) => {
  const { approvalRequests, decideApprovalRequest, currentUser } = useApp();

  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [filterRole, setFilterRole] = useState<'ALL' | 'MINE'>('MINE');

  if (!isOpen) return null;

  const relevantRequests = approvalRequests.filter(req => {
    if (filterRole === 'MINE') {
      if (currentUser.role === 'super_admin') return true;
      return req.requiredRole === currentUser.role;
    }
    return true;
  });

  const handleDecide = (id: string, status: 'Approved' | 'Rejected') => {
    const notes = decisionNotes[id] || (status === 'Approved' ? 'Authorized per policy' : 'Rejected due to credit/pricing parameters');
    decideApprovalRequest(id, status, notes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#16263F] border-b border-[#1C2D4A] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4EFE6] flex items-center gap-2">
                <span>Unified Approval Engine &amp; Gatekeeper Queue</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono font-bold border border-amber-800">
                  {approvalRequests.filter(r => r.status === 'Pending').length} Pending
                </span>
              </h2>
              <p className="text-xs text-[#A8A299]">
                Authorized role: <strong className="text-[#E88B2A] uppercase">{currentUser.role}</strong> ({currentUser.name})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#0F1D33]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 bg-[#0A1628] border-b border-[#1C2D4A] flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('MINE')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterRole === 'MINE' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              Actionable by My Role
            </button>
            <button
              onClick={() => setFilterRole('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterRole === 'ALL' ? 'bg-[#E88B2A] text-[#0A1628]' : 'text-[#A8A299] hover:text-[#F4EFE6]'
              }`}
            >
              All Requests ({approvalRequests.length})
            </button>
          </div>
          <span className="text-[#A8A299] text-[11px]">Audit trail recorded append-only</span>
        </div>

        {/* Requests List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {relevantRequests.map(req => (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition-all ${
                req.status === 'Pending'
                  ? 'bg-[#16263F] border-[#26395A]'
                  : req.status === 'Approved'
                  ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75'
                  : 'bg-rose-950/20 border-rose-800/40 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#26395A]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F4EFE6] text-sm">{req.ruleTitle}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                      req.status === 'Pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : req.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {req.status}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono text-[#A8A299] bg-[#0A1628] border border-[#26395A]">
                      Requires {req.requiredRole.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-[#E88B2A] font-semibold block mt-0.5 font-mono">
                    {req.entityReference}
                  </span>
                </div>

                <div className="text-right text-[11px] text-[#A8A299]">
                  <span>Requested by <strong>{req.requestedBy}</strong></span>
                  <span className="block font-mono">{req.requestedAt}</span>
                </div>
              </div>

              <div className="py-2.5">
                <span className="text-[#A8A299] block font-semibold mb-0.5">Justification &amp; Impact:</span>
                <p className="text-[#F4EFE6] leading-relaxed bg-[#0A1628] p-2.5 rounded-lg border border-[#26395A]">
                  {req.reason}
                </p>
              </div>

              {req.status === 'Pending' ? (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Decision notes or compliance authorization reason..."
                    value={decisionNotes[req.id] || ''}
                    onChange={e => setDecisionNotes({ ...decisionNotes, [req.id]: e.target.value })}
                    className="flex-1 bg-[#0A1628] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64]"
                  />
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleDecide(req.id, 'Rejected')}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecide(req.id, 'Approved')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      Approve &amp; Release
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-[11px] text-[#A8A299] flex justify-between">
                  <span>Decided by: <strong>{req.decidedBy}</strong> on {req.decidedAt}</span>
                  <span className="italic">{req.decisionNotes}</span>
                </div>
              )}
            </div>
          ))}

          {relevantRequests.length === 0 && (
            <div className="p-8 text-center text-[#A8A299]">
              No approval requests pending in your queue.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#16263F] border-t border-[#1C2D4A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0F1D33] text-xs font-semibold text-[#F4EFE6] hover:bg-[#1D3251]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
