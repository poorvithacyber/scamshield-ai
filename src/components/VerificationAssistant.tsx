import React, { useState } from 'react';
import { InvestigationCheck } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckSquare, Square, Search, HelpCircle, ChevronDown } from 'lucide-react';

interface VerificationAssistantProps {
  checks: InvestigationCheck[];
}

export const VerificationAssistant: React.FC<VerificationAssistantProps> = ({ checks }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    website: false,
    careers: false,
    identity: false,
    noPay: true, // Golden safety rule
  });

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DETECTED':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: AlertOctagon,
          label: 'DETECTED',
        };
      case 'WARNING':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          label: 'WARNING',
        };
      case 'VERIFIED':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'VERIFIED',
        };
      case 'NOT VERIFIED':
      default:
        return {
          badge: 'bg-zinc-900 text-zinc-400 border-zinc-700',
          icon: HelpCircle,
          label: 'NOT VERIFIED',
        };
    }
  };

  return (
    <div
      id="verification-assistant-card"
      className="rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-md"
    >
      {/* Expandable Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 bg-zinc-950/70 hover:bg-zinc-900/60 transition-colors text-left cursor-pointer border-b border-zinc-800/80"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">
              Verification Checkpoints & Due Diligence
            </h3>
            <p className="text-xs text-zinc-400">
              Deeper corroboration checks and employer due diligence checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 font-semibold hidden sm:inline-block">
            {checks ? checks.length : 0} CHECKS
          </span>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Technical Checkpoints Grid */}
          {checks && checks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {checks.map((item, idx) => {
                const { badge, icon: Icon, label } = getStatusBadge(item.status);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-zinc-200 text-xs">
                        {item.check}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge} flex-shrink-0`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug font-sans">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Interactive Pre-Flight Due Diligence Checklist */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 block">
              PRE-ACTION DEFENSIVE DUE DILIGENCE CHECKLIST
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => toggleCheck('website')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  checklist.website
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {checklist.website ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span>Verify company through its official top-level domain</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('careers')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  checklist.careers
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {checklist.careers ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span>Confirm requisition exists on official corporate careers portal</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('identity')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  checklist.identity
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {checklist.identity ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span>Verify recruiter identity via official corporate communications</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('noPay')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  checklist.noPay
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {checklist.noPay ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span className="font-semibold text-emerald-300">
                  Defensive rule: Never pay or deposit money to obtain employment
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

