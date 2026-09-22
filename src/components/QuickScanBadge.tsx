import React from 'react';
import { ActionState, ScamPattern } from '../types';
import { AlertOctagon, AlertTriangle, ShieldCheck, Target, ChevronRight } from 'lucide-react';

interface QuickScanBadgeProps {
  actionState?: ActionState;
  actionHeadline?: string;
  confidence?: 'High' | 'Medium' | 'Limited';
  confidenceReason?: string;
  scamPatterns?: ScamPattern[];
}

export const QuickScanBadge: React.FC<QuickScanBadgeProps> = ({
  actionState = 'STOP',
  actionHeadline,
  confidence,
  confidenceReason,
  scamPatterns,
}) => {
  // Action State Visuals
  const getActionConfig = () => {
    switch (actionState) {
      case 'STOP':
        return {
          banner: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
          badge: 'bg-rose-600 text-white shadow-rose-900/30',
          icon: AlertOctagon,
          title: 'STOP',
          defaultHeadline: 'Do not send money, OTPs, or personal identity documents.',
        };
      case 'VERIFY FIRST':
        return {
          banner: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
          badge: 'bg-amber-500 text-slate-950 font-black shadow-amber-900/30',
          icon: AlertTriangle,
          title: 'VERIFY FIRST',
          defaultHeadline: 'Independently confirm the employer and recruiter before proceeding.',
        };
      case 'LOW CONCERN':
      default:
        return {
          banner: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
          badge: 'bg-emerald-600 text-white shadow-emerald-900/30',
          icon: ShieldCheck,
          title: 'LOW CONCERN',
          defaultHeadline: 'No major warning indicators detected. Practice standard due diligence.',
        };
    }
  };

  const actionConfig = getActionConfig();
  const ActionIcon = actionConfig.icon;

  return (
    <div id="quick-scan-action-section" className="space-y-3.5">
      {/* 1. Prominent Action Recommendation Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-md ${actionConfig.banner}`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black tracking-wider flex items-center gap-1.5 shadow-md flex-shrink-0 ${actionConfig.badge}`}
          >
            <ActionIcon className="w-4 h-4" />
            <span>{actionConfig.title}</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight font-sans tracking-tight">
              {actionHeadline || actionConfig.defaultHeadline}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              DEFENSIVE POSTURE DIRECTIVE // EXTRACTED THREAT PROFILE
            </p>
          </div>
        </div>
      </div>

      {/* 2. Scam Patterns Chips Section */}
      {scamPatterns && scamPatterns.length > 0 && (
        <div className="p-4 sm:p-4.5 rounded-2xl bg-black/90 border border-zinc-800 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-500" />
              IDENTIFIED SCAM SIGNATURES
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {scamPatterns.length} {scamPatterns.length === 1 ? 'SIGNATURE' : 'SIGNATURES'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {scamPatterns.map((p, idx) => (
              <div
                key={idx}
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 text-xs font-mono transition-all shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                <span className="font-semibold text-zinc-200">{p.pattern}</span>
                {p.reasons && p.reasons.length > 0 && (
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    // {p.reasons.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

