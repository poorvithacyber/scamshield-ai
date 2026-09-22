import React, { useState } from 'react';
import { RiskFactor } from '../types';
import { AlertCircle, AlertOctagon, AlertTriangle, ChevronDown, Info } from 'lucide-react';

interface EvidenceCardProps {
  factor: RiskFactor;
  index: number;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ factor, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  let severityBadge = 'bg-zinc-900 text-zinc-400 border-zinc-700 font-mono';
  let severityAccent = 'border-zinc-700';
  let Icon = Info;

  if (factor.severity === 'CRITICAL') {
    severityBadge = 'bg-rose-950/40 text-rose-400 border-rose-500/40 font-mono';
    severityAccent = 'border-rose-500';
    Icon = AlertOctagon;
  } else if (factor.severity === 'HIGH') {
    severityBadge = 'bg-amber-950/40 text-amber-400 border-amber-500/40 font-mono';
    severityAccent = 'border-amber-500';
    Icon = AlertTriangle;
  } else if (factor.severity === 'MEDIUM') {
    severityBadge = 'bg-yellow-950/40 text-yellow-400 border-yellow-500/40 font-mono';
    severityAccent = 'border-yellow-500';
    Icon = AlertCircle;
  }

  return (
    <div
      id={`evidence-card-${index}`}
      className="rounded-2xl bg-black/90 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden shadow-xl backdrop-blur-md"
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${severityBadge}`}>
            <Icon className="w-3 h-3" />
            {factor.severity}
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            {factor.category}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-zinc-800"
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
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Evidence snippet */}
          <div className={`rounded-xl bg-zinc-950 p-3 border-l-2 ${severityAccent} text-xs font-mono text-zinc-300 break-words leading-relaxed`}>
            <span className="text-zinc-500 mr-2 uppercase text-[10px] font-bold tracking-wider font-mono block mb-1">
              PAYLOAD EXCERPT // OBSERVED TEXT
            </span>
            <span className="text-zinc-200">"{factor.evidence}"</span>
          </div>

          {/* Why it matters */}
          <div className="text-xs text-zinc-300 leading-relaxed pt-0.5 font-sans">
            <span className="text-zinc-400 font-mono font-semibold block text-[11px] uppercase tracking-wider mb-1">
              THREAT EXPLANATION:
            </span>
            <p className="text-zinc-300 leading-relaxed">{factor.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

