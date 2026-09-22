import React from 'react';
import { ArrowRight, ArrowDown, ShieldAlert, GitCommit, Layers } from 'lucide-react';

interface AttackChainProps {
  chain: string[];
}

export const AttackChain: React.FC<AttackChainProps> = ({ chain }) => {
  if (!chain || chain.length === 0) return null;

  // Determine stage accent: early steps are reconnaissance/bait, middle steps are pressure/trap, final are monetization/exfiltration
  const getStepStyle = (index: number, total: number) => {
    const ratio = index / Math.max(1, total - 1);
    if (ratio >= 0.75) {
      return {
        badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:border-rose-500/60',
        dot: 'bg-rose-400 ring-rose-500/20',
        stage: 'Exploitation',
      };
    }
    if (ratio >= 0.4) {
      return {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-500/60',
        dot: 'bg-amber-400 ring-amber-500/20',
        stage: 'Coercion & Urgency',
      };
    }
    return {
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:border-sky-500/60',
      dot: 'bg-sky-400 ring-sky-500/20',
      stage: 'Initial Lure',
    };
  };

  return (
    <div
      id="attack-chain-card"
      className="p-5 sm:p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Attack Progression Chain
            </h3>
            <p className="text-xs text-slate-400">
              Sequential threat progression model reconstructed from observed evidence
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 self-start sm:self-auto">
          {chain.length} Sequence Nodes
        </span>
      </div>

      {/* Visual Timeline Flow */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
          {chain.map((step, idx) => {
            const style = getStepStyle(idx, chain.length);
            const isLast = idx === chain.length - 1;

            return (
              <React.Fragment key={idx}>
                {/* Node Box */}
                <div
                  className={`flex-1 min-w-[140px] sm:flex-initial p-3 rounded-xl border text-xs transition-all shadow-sm ${style.badge}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Phase {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ring-2 ${style.dot}`} />
                  </div>
                  <span className="font-bold text-slate-100 block text-xs sm:text-sm leading-tight">
                    {step}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {style.stage}
                  </span>
                </div>

                {/* Connecting arrow */}
                {!isLast && (
                  <>
                    {/* Desktop horizontal arrow */}
                    <div className="hidden sm:flex items-center text-slate-600 px-0.5">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    {/* Mobile vertical arrow */}
                    <div className="flex sm:hidden justify-center text-slate-600 py-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Narrative footnote */}
        <div className="mt-4 pt-3 border-t border-slate-900 flex items-center gap-2 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Scammers rely on this progressive pipeline to systematically lower defenses before soliciting payment or authentication credentials.
          </span>
        </div>
      </div>
    </div>
  );
};

