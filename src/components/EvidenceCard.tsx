import React, { useState } from 'react';
import { RiskFactor } from '../types';
import { AlertCircle, AlertOctagon, AlertTriangle, ChevronDown, Info } from 'lucide-react';

interface EvidenceCardProps {
  factor: RiskFactor;
  index: number;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ factor, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  let severityBadge = 'bg-slate-800 text-slate-300 border-slate-700';
  let severityAccent = 'border-slate-700';
  let Icon = Info;

  if (factor.severity === 'CRITICAL') {
    severityBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    severityAccent = 'border-rose-500/40';
    Icon = AlertOctagon;
  } else if (factor.severity === 'HIGH') {
    severityBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    severityAccent = 'border-amber-500/40';
    Icon = AlertTriangle;
  } else if (factor.severity === 'MEDIUM') {
    severityBadge = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    severityAccent = 'border-yellow-500/40';
    Icon = AlertCircle;
  }

  return (
    <div
      id={`evidence-card-${index}`}
      className="rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${severityBadge}`}>
            <Icon className="w-3 h-3" />
            {factor.severity}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {factor.category}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
          aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Body Content */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {/* Evidence snippet */}
          <div className={`rounded-lg bg-slate-950 p-2.5 border-l-2 ${severityAccent} text-xs font-mono text-slate-300 break-words`}>
            <span className="text-slate-500 mr-2 uppercase text-[10px] font-bold tracking-wider font-sans block mb-1">
              Evidence:
            </span>
            <span className="text-slate-200">"{factor.evidence}"</span>
          </div>

          {/* Why it matters */}
          <div className="text-xs text-slate-300 leading-relaxed pt-0.5">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider mb-0.5">
              Why this matters:
            </span>
            <p className="text-slate-300">{factor.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

