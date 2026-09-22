import React from 'react';
import { ClaimVsEvidence as ClaimItem } from '../types';
import { Building, Globe, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

interface ClaimVsEvidenceProps {
  claims: ClaimItem[];
}

export const ClaimVsEvidence: React.FC<ClaimVsEvidenceProps> = ({ claims }) => {
  if (!claims || claims.length === 0) return null;

  return (
    <div
      id="claim-vs-evidence-card"
      className="p-5 sm:p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Claim vs. Evidence Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Contrasting claimed identities against observed technical channels and verification status
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 self-start sm:self-auto">
          {claims.length} Identity Check{claims.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-3.5">
        {claims.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. CLAIM */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-400" />
                  Claim
                </span>
                <span className="font-bold text-slate-100 text-xs sm:text-sm block">
                  "{item.claim}"
                </span>
              </div>

              {/* 2. OBSERVED */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Observed Channel / Domain
                </span>
                <span className="font-mono text-amber-300 text-xs font-bold block break-all">
                  {item.observed}
                </span>
              </div>

              {/* 3. VERIFICATION */}
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Verification Status
                </span>
                <span className="text-xs text-rose-200 leading-snug block font-medium">
                  {item.assessment}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

