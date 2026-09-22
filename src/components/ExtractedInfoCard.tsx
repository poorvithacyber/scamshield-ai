import React from 'react';
import { ExtractedInfo, RiskFactor } from '../types';
import { FileSearch, Building, DollarSign, CreditCard, Mail, MessageSquare, Clock, AlertTriangle } from 'lucide-react';

interface ExtractedInfoCardProps {
  info?: ExtractedInfo;
  riskFactors?: RiskFactor[];
}

export const ExtractedInfoCard: React.FC<ExtractedInfoCardProps> = ({ info, riskFactors }) => {
  if (!info) return null;

  // Filter only fields that are actually present
  const presentFields = [
    { label: 'Organization', value: info.company, icon: Building },
    { label: 'Salary', value: info.salary, icon: DollarSign },
    { label: 'Payment Request', value: info.payment_required, icon: CreditCard, highlight: true },
    { label: 'Contact', value: info.contact, icon: Mail },
    { label: 'Channel', value: info.channel, icon: MessageSquare },
    { label: 'Deadline', value: info.deadline, icon: Clock, highlight: true },
  ].filter((f) => Boolean(f.value && f.value.trim().length > 0));

  if (presentFields.length === 0) return null;

  // Extract detected red flag categories or summaries
  const redFlags = (riskFactors || [])
    .filter((rf) => rf.severity === 'CRITICAL' || rf.severity === 'HIGH')
    .slice(0, 4);

  return (
    <div
      id="extracted-info-card"
      className="p-5 sm:p-6 rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl space-y-4 backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <FileSearch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">
              Extracted Payload Entities
            </h3>
            <p className="text-xs text-zinc-400">
              Specific entities and parameters identified from the submitted material
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 self-start sm:self-auto font-medium">
          {presentFields.length} ATTRIBUTE{presentFields.length === 1 ? '' : 'S'} IDENTIFIED
        </span>
      </div>

      {/* Extracted Fields Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {presentFields.map((field, idx) => {
          const Icon = field.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${
                field.highlight
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  : 'bg-zinc-950 border-zinc-800/90 text-zinc-300'
              }`}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
                {field.label}
              </span>
              <span className={`font-mono font-bold block truncate text-xs sm:text-sm ${field.highlight ? 'text-rose-400' : 'text-zinc-100'}`}>
                {field.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detected Red Flags */}
      {redFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            DETECTED DECEPTION ANOMALIES
          </span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {redFlags.map((rf, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <strong className="text-zinc-200">{rf.category}:</strong> {rf.evidence.slice(0, 50)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

