import React from 'react';
import { RiskLevel } from '../types';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ThreatMeterProps {
  score: number;
  riskLevel: RiskLevel;
  confidence?: 'High' | 'Medium' | 'Limited';
}

export const ThreatMeter: React.FC<ThreatMeterProps> = ({ score, riskLevel, confidence }) => {
  // Determine semantic color and styling based on score (Cybersecurity Black / Tactical Emerald & Rose palette)
  let badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
  let gaugeColor = '#10b981'; // emerald-500
  let barGradient = 'from-emerald-500 to-emerald-400';
  let IconComponent = ShieldCheck;
  let severityDescription = 'Minimal threat indicators observed. Continue with standard verification.';

  if (score >= 81) {
    badgeColor = 'bg-rose-950/40 text-rose-400 border-rose-500/30';
    gaugeColor = '#f43f5e'; // rose-500
    barGradient = 'from-rose-600 to-rose-400';
    IconComponent = ShieldAlert;
    severityDescription = 'Critical deceptive markers detected. Immediate cessation of contact recommended.';
  } else if (score >= 61) {
    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-500/30';
    gaugeColor = '#f59e0b'; // amber-500
    barGradient = 'from-amber-600 to-amber-400';
    IconComponent = ShieldAlert;
    severityDescription = 'High risk of financial fraud or credential extraction. Do not disburse funds.';
  } else if (score >= 41) {
    badgeColor = 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30';
    gaugeColor = '#eab308'; // yellow-500
    barGradient = 'from-yellow-600 to-yellow-400';
    IconComponent = AlertTriangle;
    severityDescription = 'Notable inconsistencies identified. Independent corporate validation required.';
  } else if (score >= 21) {
    badgeColor = 'bg-zinc-900 text-zinc-300 border-zinc-700/80';
    gaugeColor = '#a1a1aa'; // zinc-400
    barGradient = 'from-zinc-500 to-zinc-400';
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
      className="p-5 sm:p-6 rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Subtle top indicator bar with smooth glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${barGradient}`}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left: Circular Gauge */}
        <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-zinc-900"
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
            <span className="text-4xl font-black tracking-tight text-white font-mono">
              {score}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              / 100
            </span>
          </div>
        </div>

        {/* Right: Score Interpretation & Threat Level */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Scam Threat Index
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide font-mono ${badgeColor}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {riskLevel}
            </span>
            {confidence && (
              <span className="text-[11px] text-zinc-400 bg-zinc-950 px-2.5 py-0.5 rounded-full border border-zinc-800 font-mono font-medium">
                CONFIDENCE: <strong className="text-zinc-200">{confidence.toUpperCase()}</strong>
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed font-sans max-w-xl">
            {severityDescription}
          </p>

          {/* Linear bar representation with refined indicators */}
          <div className="pt-1.5 space-y-1">
            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-zinc-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />0 SAFE</span>
              <span>50 MODERATE</span>
              <span className="flex items-center gap-1">100 CRITICAL<span className="w-1.5 h-1.5 rounded-full bg-rose-500" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

