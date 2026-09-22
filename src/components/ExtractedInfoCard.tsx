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
      className="p-5 sm:p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <FileSearch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Detected Information
            </h3>
            <p className="text-xs text-slate-400">
              Entities and parameters extracted from the submitted material
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 self-start sm:self-auto">
          {presentFields.length} Attribute{presentFields.length === 1 ? '' : 's'} Detected
        </span>
      </div>

      {/* Extracted Fields Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {presentFields.map((field, idx) => {
          const Icon = field.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                field.highlight
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {field.label}
              </span>
              <span className={`font-bold block truncate text-xs sm:text-sm ${field.highlight ? 'text-rose-300' : 'text-slate-100'}`}>
                {field.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detected Red Flags */}
      {redFlags.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Detected Red Flags
          </span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {redFlags.map((rf, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <strong className="text-slate-200">{rf.category}:</strong> {rf.evidence.slice(0, 50)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

