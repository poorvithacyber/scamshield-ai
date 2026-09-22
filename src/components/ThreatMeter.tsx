import React from 'react';
import { RiskLevel } from '../types';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ThreatMeterProps {
  score: number;
  riskLevel: RiskLevel;
  confidence?: 'High' | 'Medium' | 'Limited';
}

export const ThreatMeter: React.FC<ThreatMeterProps> = ({ score, riskLevel, confidence }) => {
  // Determine semantic color and styling based on score
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let gaugeColor = '#10b981'; // emerald
  let barGradient = 'from-emerald-500 to-teal-400';
  let IconComponent = ShieldCheck;
  let severityDescription = 'Minimal threat indicators observed. Continue with standard verification.';

  if (score >= 81) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    gaugeColor = '#f43f5e'; // rose-500
    barGradient = 'from-rose-500 to-red-600';
    IconComponent = ShieldAlert;
    severityDescription = 'Critical deceptive markers detected. Immediate cessation of contact recommended.';
  } else if (score >= 61) {
    badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    gaugeColor = '#f97316'; // orange-500
    barGradient = 'from-orange-500 to-amber-500';
    IconComponent = ShieldAlert;
    severityDescription = 'High risk of financial fraud or credential extraction. Do not disburse funds.';
  } else if (score >= 41) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    gaugeColor = '#eab308'; // amber-500
    barGradient = 'from-amber-500 to-yellow-400';
    IconComponent = AlertTriangle;
    severityDescription = 'Notable inconsistencies identified. Independent corporate validation required.';
  } else if (score >= 21) {
    badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    gaugeColor = '#0ea5e9'; // sky-500
    barGradient = 'from-sky-500 to-blue-400';
    IconComponent = Shield;
    severityDescription = 'Elevated or ambiguous indicators present. Proceed with normal scrutiny.';
  }

  // Calculate circle stroke offset for SVG gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div
      id="threat-meter-container"
      className="p-5 sm:p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${barGradient}`}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Circular Gauge */}
        <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={gaugeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
              {score}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              / 100
            </span>
          </div>
        </div>

        {/* Right: Score Interpretation & Threat Level */}
        <div className="flex-1 text-center sm:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Scam Threat Index
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${badgeColor}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {riskLevel}
            </span>
            {confidence && (
              <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-medium">
                Confidence: <strong className="text-slate-200">{confidence}</strong>
              </span>
            )}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
            {severityDescription}
          </p>

          {/* Linear bar representation */}
          <div className="pt-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
              <span>0 (Safe)</span>
              <span>50 (Moderate)</span>
              <span>100 (Critical)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

