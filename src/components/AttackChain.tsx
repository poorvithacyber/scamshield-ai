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
        badge: 'bg-rose-950/30 text-rose-300 border-rose-500/40 hover:border-rose-500/80',
        dot: 'bg-rose-500 ring-rose-500/30',
        stage: 'Exploitation & Exfiltration',
      };
    }
    if (ratio >= 0.4) {
      return {
        badge: 'bg-amber-950/30 text-amber-300 border-amber-500/40 hover:border-amber-500/80',
        dot: 'bg-amber-500 ring-amber-500/30',
        stage: 'Coercion & Leverage',
      };
    }
    return {
      badge: 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500',
      dot: 'bg-zinc-400 ring-zinc-500/30',
      stage: 'Reconnaissance & Initial Lure',
    };
  };

  return (
    <div
      id="attack-chain-card"
      className="p-5 sm:p-6 rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl space-y-4 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              Attack Progression Chain
            </h3>
            <p className="text-xs text-zinc-400">
              Sequential threat progression model reconstructed from observed payload evidence
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 self-start sm:self-auto font-medium">
          {chain.length} SEQUENCE NODES
        </span>
      </div>

      {/* Visual Timeline Flow */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
          {chain.map((step, idx) => {
            const style = getStepStyle(idx, chain.length);
            const isLast = idx === chain.length - 1;

            return (
              <React.Fragment key={idx}>
                {/* Node Box */}
                <div
                  className={`flex-1 min-w-[150px] sm:flex-initial p-3.5 rounded-2xl border text-xs transition-all shadow-sm ${style.badge}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      PHASE {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ring-2 ${style.dot}`} />
                  </div>
                  <span className="font-bold text-zinc-100 block text-xs sm:text-sm leading-tight font-sans">
                    {step}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                    {style.stage}
                  </span>
                </div>

                {/* Connecting arrow */}
                {!isLast && (
                  <>
                    {/* Desktop horizontal arrow */}
                    <div className="hidden sm:flex items-center text-zinc-600 px-0.5">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    {/* Mobile vertical arrow */}
                    <div className="flex sm:hidden justify-center text-zinc-600 py-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Narrative footnote */}
        <div className="mt-4 pt-3.5 border-t border-zinc-900 flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            Scammers rely on this progressive pipeline to systematically lower defenses before soliciting payment or authentication credentials.
          </span>
        </div>
      </div>
    </div>
  );
};

