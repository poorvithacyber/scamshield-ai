import React from 'react';
import { ActionableFinding } from '../types';
import { AlertOctagon, AlertTriangle, AlertCircle, ArrowDown, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ActionableFindingsProps {
  findings: ActionableFinding[];
  limit?: number;
}

export const ActionableFindings: React.FC<ActionableFindingsProps> = ({ findings, limit = 4 }) => {
  if (!findings || findings.length === 0) return null;

  const displayFindings = findings.slice(0, limit);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: AlertOctagon,
          title: 'CRITICAL',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: AlertTriangle,
          title: 'HIGH',
        };
      default:
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertCircle,
          title: 'WARNING',
        };
    }
  };

  return (
    <div id="actionable-findings-section" className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Evidence &rarr; Risk &rarr; Action Triad
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {displayFindings.length} Key Finding{displayFindings.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayFindings.map((item, idx) => {
          const { badge, icon: Icon, title } = getSeverityBadge(item.severity);

          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-black/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3.5 shadow-xl backdrop-blur-md"
            >
              {/* Category & Severity header */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  {item.category || 'Threat Indicator'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wider shadow-sm ${badge}`}
                >
                  <Icon className="w-3 h-3" />
                  {title}
                </span>
              </div>

              {/* 1. Evidence */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400 block">
                  Observed Payload / Text Evidence
                </span>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 break-words leading-relaxed">
                  "{item.evidence}"
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-zinc-600 -my-1">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* 2. Risk (Why It Matters) */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-400 block">
                  Exploitation Analysis
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-500/20 font-sans">
                  {item.why_it_matters}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-zinc-600 -my-1">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* 3. Action (What To Do) */}
              <div className="space-y-1 bg-emerald-950/20 border border-emerald-500/25 p-3 rounded-xl">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Remediation Directive
                </span>
                <p className="text-xs font-semibold text-emerald-200 leading-snug font-sans">
                  {item.what_to_do}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

