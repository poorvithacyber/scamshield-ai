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
              className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3.5 shadow-md"
            >
              {/* Category & Severity header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {item.category || 'Threat Indicator'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border tracking-wider ${badge}`}
                >
                  <Icon className="w-3 h-3" />
                  {title}
                </span>
              </div>

              {/* 1. Evidence */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                  Evidence
                </span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 text-xs font-mono text-slate-200 break-words">
                  "{item.evidence}"
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-600 -my-1">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* 2. Risk (Why It Matters) */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-rose-400 block">
                  Risk
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/20">
                  {item.why_it_matters}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-600 -my-1">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* 3. Action (What To Do) */}
              <div className="space-y-1 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Action
                </span>
                <p className="text-xs font-semibold text-emerald-200 leading-snug">
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

