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
        className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${actionConfig.banner}`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider flex items-center gap-1.5 shadow-md flex-shrink-0 ${actionConfig.badge}`}
          >
            <ActionIcon className="w-4 h-4" />
            <span>{actionConfig.title}</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
              {actionHeadline || actionConfig.defaultHeadline}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Immediate defensive posture advised based on extracted threat evidence.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Scam Patterns Chips Section */}
      {scamPatterns && scamPatterns.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              Identified Scam Patterns
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {scamPatterns.length} {scamPatterns.length === 1 ? 'Pattern' : 'Patterns'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {scamPatterns.map((p, idx) => (
              <div
                key={idx}
                className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                <span className="font-semibold text-slate-200">{p.pattern}</span>
                {p.reasons && p.reasons.length > 0 && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    &bull; {p.reasons.slice(0, 2).join(', ')}
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

