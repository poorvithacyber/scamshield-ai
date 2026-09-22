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
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: HelpCircle,
          label: 'NOT VERIFIED',
        };
    }
  };

  return (
    <div
      id="verification-assistant-card"
      className="rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden"
    >
      {/* Expandable Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-950/40 hover:bg-slate-800/40 transition-colors text-left cursor-pointer border-b border-slate-800/80"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Verification Details & Checkpoints
            </h3>
            <p className="text-xs text-slate-400">
              Deeper corroboration checks and employer due diligence checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold hidden sm:inline-block">
            {checks ? checks.length : 0} Checks
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
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
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200 text-xs">
                        {item.check}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge} flex-shrink-0`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Interactive Pre-Flight Due Diligence Checklist */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Pre-Action Employer Verification Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => toggleCheck('website')}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                  checklist.website
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {checklist.website ? (
                  <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span>Verify company through its official top-level domain</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('careers')}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                  checklist.careers
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {checklist.careers ? (
                  <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span>Confirm requisition exists on official corporate careers portal</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('identity')}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                  checklist.identity
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {checklist.identity ? (
                  <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span>Verify recruiter identity via official corporate communications</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('noPay')}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                  checklist.noPay
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {checklist.noPay ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
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

