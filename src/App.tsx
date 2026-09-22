import React, { useState, useEffect } from 'react';
import { ThreatAnalysisResult } from './types';
import { ThreatMeter } from './components/ThreatMeter';
import { EvidenceCard } from './components/EvidenceCard';
import { QuickScanBadge } from './components/QuickScanBadge';
import { AttackChain } from './components/AttackChain';
import { ActionableFindings } from './components/ActionableFindings';
import { ClaimVsEvidence } from './components/ClaimVsEvidence';
import { VerificationAssistant } from './components/VerificationAssistant';
import { ExtractedInfoCard } from './components/ExtractedInfoCard';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Globe,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ChevronRight,
  ChevronDown,
  Zap,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [urlMessageContext, setUrlMessageContext] = useState('');
  const [showContextField, setShowContextField] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageNotes, setImageNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalysisResult | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [investigationView, setInvestigationView] = useState<'quick' | 'deep'>('quick');

  // Check health on mount
  useEffect(() => {
    fetch('/api/health').catch(() => {});
  }, []);

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Text Analysis
  const handleAnalyzeText = async () => {
    if (!textContent.trim()) {
      setErrorMessage('Please paste or type the job offer or recruitment message text to analyze.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Analysis request failed');
      }
      setAnalysisResult(data);
      setInvestigationView('quick');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to inspect this text at the moment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run URL Analysis
  const handleAnalyzeUrl = async () => {
    if (!urlContent.trim()) {
      setErrorMessage('Please enter a URL to scan.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlContent,
          messageContext: urlMessageContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'URL scan failed');
      }
      setAnalysisResult(data);
      setInvestigationView('quick');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to inspect this URL at the moment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Image Analysis
  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      setErrorMessage('Please select or upload an offer letter screenshot.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedImage?.type || 'image/png',
          additionalNotes: imageNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Screenshot inspection failed');
      }
      setAnalysisResult(data);
      setInvestigationView('quick');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to inspect this screenshot at the moment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Incident Report
  const copyIncidentReport = () => {
    if (!analysisResult) return;
    const report = `SCAMSHIELD THREAT ASSESSMENT REPORT
Date: ${new Date().toUTCString()}
Action Recommendation: [${analysisResult.action_state || 'STOP'}] ${analysisResult.action_headline || ''}
Scam Threat Index: ${analysisResult.threat_score}/100 (${analysisResult.risk_level})
Confidence: ${analysisResult.analysis_confidence || 'High'}

Verdict:
${analysisResult.verdict}

Summary:
${analysisResult.summary}

${
  analysisResult.scam_patterns && analysisResult.scam_patterns.length > 0
    ? `Scam Patterns:\n${analysisResult.scam_patterns.map((p) => `- ${p.pattern}: ${p.reasons.join(', ')}`).join('\n')}\n\n`
    : ''
}${
  analysisResult.attack_chain && analysisResult.attack_chain.length > 0
    ? `Attack Chain Flow:\n${analysisResult.attack_chain.map((s, i) => `${i + 1}. ${s}`).join(' -> ')}\n\n`
    : ''
}Identified Risk Factors:
${analysisResult.risk_factors
  .map(
    (rf) =>
      `- [${rf.severity}] ${rf.category}: "${rf.evidence}" -> ${rf.explanation}`
  )
  .join('\n')}

${
  analysisResult.positive_signals && analysisResult.positive_signals.length > 0
    ? `Positive Signals:\n${analysisResult.positive_signals.map((p) => `- ${p.indicator}: ${p.detail}`).join('\n')}\n\n`
    : ''
}Recommended Safety Actions:
${analysisResult.recommended_actions.map((a) => `- ${a}`).join('\n')}

Disclaimer: This assessment is generated via automated threat inspection and does not constitute definitive legal proof of fraud.`;

    navigator.clipboard.writeText(report);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2200);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300 bg-grid-cyber">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/90 bg-black/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-lg glow-cyber-emerald">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono block">SCAMSHIELD</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold">SEC-OPS</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Automated Threat Detection & Phishing Forensics Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 shadow-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-[11px] sm:text-xs">SENSOR ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Info & Privacy Notice */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Zap className="w-4 h-4 text-emerald-400" />
              Security Investigation & Phishing Inspector
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Submit an offer letter, recruitment message, or suspicious URL to explain scam patterns,
              reconstruct attack chains, verify identity claims, and receive immediate defensive actions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3.5 py-2.5 rounded-xl flex-shrink-0 font-mono">
            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>Do not submit passwords, OTPs, or active banking credentials.</span>
          </div>
        </div>

        {/* Input Interface Tabs */}
        <div className="rounded-2xl border border-zinc-800 bg-black/90 backdrop-blur-md p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex border-b border-zinc-800 pb-3 gap-2">
            <button
              id="tab-btn-text"
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-zinc-100 text-black shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Offer / Message
            </button>

            <button
              id="tab-btn-url"
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-zinc-100 text-black shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              URL Scanner
            </button>

            <button
              id="tab-btn-image"
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-zinc-100 text-black shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              Screenshot
            </button>
          </div>

          {/* TAB 1: TEXT INSPECTOR */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="offer-text-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    Job Offer, Appointment Letter, or Recruitment Communication:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setTextContent(
                        'Dear Candidate, Congratulations! You have been selected for the Work-from-Home Data Entry Associate position at Google. Your monthly salary will be ₹45,000. Please contact our HR manager Priya on Telegram: @hr_google_careers immediately. You must pay a refundable security deposit of ₹2,500 for your company laptop setup within 2 hours or your offer will be cancelled.'
                      )
                    }
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Load test sample: Fake WFH Job Offer
                  </button>
                </div>
                <textarea
                  id="offer-text-input"
                  rows={8}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste suspicious job offer, recruitment email, messaging app chat, or employment offer text here..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs font-mono text-zinc-500">
                  {textContent.length} CHARACTERS ENTERED
                </div>
                <div className="flex items-center gap-2">
                  {textContent && (
                    <button
                      onClick={() => setTextContent('')}
                      className="px-3 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    id="analyze-offer-btn"
                    onClick={handleAnalyzeText}
                    disabled={isLoading || !textContent.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer font-mono glow-cyber-emerald"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing Security Indicators...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Analyze Offer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: URL SCANNER */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="url-scanner-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    Recruitment / Application Portal URL:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlContent('https://google-careers-verification.com/login?redirect=employee-confirmation');
                      setUrlMessageContext('Received SMS stating: "Congratulations, your Google HR profile is ready. Click link to confirm employment & laptop setup."');
                      setShowContextField(true);
                    }}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Load test sample: Lookalike URL (google-careers-verification.com)
                  </button>
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    id="url-scanner-input"
                    type="url"
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    placeholder="https://example.com/job or https://google-careers-verification.com"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Optional Correlated Message Context */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowContextField(!showContextField)}
                  className="flex items-center justify-between w-full text-xs font-mono font-semibold text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Compare with message context (recommended for brand impersonation checks)
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                      showContextField ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showContextField && (
                  <div className="pt-1.5 space-y-1.5">
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Paste the SMS, message, or company name claiming this link. ScamShield compares the claimed employer vs. the actual observed domain.
                    </p>
                    <textarea
                      id="url-context-input"
                      rows={2}
                      value={urlMessageContext}
                      onChange={(e) => setUrlMessageContext(e.target.value)}
                      placeholder='e.g., "Received WhatsApp message claiming to be Google HR offering data entry job, told to click this link to verify."'
                      className="w-full rounded-xl bg-black border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {(urlContent || urlMessageContext) && (
                  <button
                    onClick={() => {
                      setUrlContent('');
                      setUrlMessageContext('');
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  id="scan-url-btn"
                  onClick={handleAnalyzeUrl}
                  disabled={isLoading || !urlContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer font-mono glow-cyber-emerald"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scanning URL & Domain...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Scan URL
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SCREENSHOT */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Upload Offer Letter Screenshot or Document Image (PNG, JPG, WebP):
                </label>
                <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 text-center bg-zinc-950/70 transition-colors">
                  <input
                    id="screenshot-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="screenshot-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Click to upload or drag and drop image
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      Supports letterheads, email screenshots, and recruitment chat logs
                    </span>
                  </label>
                </div>
              </div>

              {imagePreview && (
                <div className="flex flex-col sm:flex-row gap-4 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 items-start">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-28 h-28 object-cover rounded-xl border border-zinc-800 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 block">
                      {selectedImage?.name} ({(selectedImage?.size || 0) / 1024 > 1000 ? `${((selectedImage?.size || 0) / 1024 / 1024).toFixed(1)} MB` : `${Math.round((selectedImage?.size || 0) / 1024)} KB`})
                    </span>
                    <input
                      type="text"
                      value={imageNotes}
                      onChange={(e) => setImageNotes(e.target.value)}
                      placeholder="Optional notes (e.g., received via unverified channel)"
                      className="w-full text-xs rounded-lg bg-black border border-zinc-800 p-2 text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  id="inspect-image-btn"
                  onClick={handleAnalyzeImage}
                  disabled={isLoading || !imagePreview}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer font-mono glow-cyber-emerald"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Inspecting Screenshot...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Inspect Screenshot
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <strong className="block font-semibold font-mono">INSPECTION ALERT:</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Loading Indicator Card */}
        {isLoading && (
          <div className="rounded-2xl border border-zinc-800 bg-black/90 p-8 text-center space-y-3 backdrop-blur-md">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Analyzing Security Indicators...</h3>
              <p className="text-xs text-zinc-400 font-mono">
                Classifying scam patterns, reconstructing attack steps, and verifying identity claims.
              </p>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* RESULT SECTION: QUICK SCAN VS INVESTIGATE FURTHER */}
        {/* ================================================== */}
        {analysisResult && !isLoading && (
          <section id="analysis-results-section" className="space-y-6 pt-2">
            {/* Results Header with View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-mono">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  SECURITY INVESTIGATION ASSESSMENT
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Evidence-grounded threat evaluation with actionable defensive recommendations.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* View Switcher Toggle */}
                <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                  <button
                    id="toggle-quick-scan-btn"
                    onClick={() => setInvestigationView('quick')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      investigationView === 'quick'
                        ? 'bg-zinc-100 text-black shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Quick Scan
                  </button>
                  <button
                    id="toggle-investigate-btn"
                    onClick={() => setInvestigationView('deep')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      investigationView === 'deep'
                        ? 'bg-zinc-100 text-black shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Investigate Further
                  </button>
                </div>

                <button
                  id="copy-report-btn"
                  onClick={copyIncidentReport}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {reportCopied ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* 1. Quick Scan Badge: Clear Action State (STOP / VERIFY / LOW) + Scam Pattern */}
            <QuickScanBadge
              actionState={analysisResult.action_state}
              actionHeadline={analysisResult.action_headline}
              confidence={analysisResult.analysis_confidence}
              confidenceReason={analysisResult.confidence_reason}
              scamPatterns={analysisResult.scam_patterns}
            />

            {/* 2. Score & Risk Meter */}
            <ThreatMeter
              score={analysisResult.threat_score}
              riskLevel={analysisResult.risk_level}
              confidence={analysisResult.analysis_confidence}
            />

            {/* 3. Executive Verdict & Summary */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl space-y-2.5 backdrop-blur-md">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                EXECUTIVE THREAT VERDICT
              </span>
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed font-sans">
                {analysisResult.verdict}
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                {analysisResult.summary}
              </p>
            </div>

            {/* 4. Actionable Findings (Evidence -> Why It Matters -> What To Do) */}
            {analysisResult.actionable_findings && analysisResult.actionable_findings.length > 0 && (
              <ActionableFindings
                findings={analysisResult.actionable_findings}
                limit={investigationView === 'quick' ? 3 : 6}
              />
            )}

            {/* 5. Extracted Information Forensics Card (Shown when entities are detected) */}
            {analysisResult.extracted_info && Object.keys(analysisResult.extracted_info).length > 0 && (
              <ExtractedInfoCard
                info={analysisResult.extracted_info}
                riskFactors={analysisResult.risk_factors}
              />
            )}

            {/* Quick View Prompt to Investigate Further */}
            {investigationView === 'quick' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    NEED TO EXAMINE DEEPER FORENSICS?
                  </span>
                  <p className="text-xs text-zinc-400 font-sans">
                    Explore the reconstructed attack progression, compare brand identity claims, and complete the verification checklist.
                  </p>
                </div>
                <button
                  onClick={() => setInvestigationView('deep')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-md"
                >
                  INVESTIGATE FURTHER
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ================================================== */}
            {/* DEEP INVESTIGATION VIEW (Chain, Checks & Forensics) */}
            {/* ================================================== */}
            {investigationView === 'deep' && (
              <div className="space-y-6 pt-2 animate-fadeIn">
                {/* 6. Attack Chain ("How The Scam Could Work") */}
                {analysisResult.attack_chain && analysisResult.attack_chain.length > 0 && (
                  <AttackChain chain={analysisResult.attack_chain} />
                )}

                {/* 7. Claim vs Evidence Card */}
                {analysisResult.claim_evidence && analysisResult.claim_evidence.length > 0 && (
                  <ClaimVsEvidence claims={analysisResult.claim_evidence} />
                )}

                {/* 8. Employer Verification Assistant */}
                {analysisResult.investigation_checks && analysisResult.investigation_checks.length > 0 && (
                  <VerificationAssistant checks={analysisResult.investigation_checks} />
                )}

                {/* 9. Key Red Flags Evidence Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    DETAILED RED FLAGS ({analysisResult.risk_factors.length})
                  </h3>

                  {analysisResult.risk_factors.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-mono">
                      No critical payment traps or deceptive red flags detected in this input.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.risk_factors.map((factor, idx) => (
                        <EvidenceCard key={idx} factor={factor} index={idx} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 10. Positive Signals (if any) */}
                {analysisResult.positive_signals && analysisResult.positive_signals.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/90 border border-zinc-800 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        CORROBORATING & POSITIVE SIGNALS
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        Objective Corroboration
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {analysisResult.positive_signals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            ✓
                          </span>
                          <div>
                            <strong className="text-zinc-200 block text-xs mb-0.5 font-mono">
                              {sig.indicator}
                            </strong>
                            <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                              {sig.detail}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Safety Actions (Executive Security Advisory) */}
            <div
              id="recommended-actions-card"
              className="p-5 sm:p-6 rounded-2xl bg-black/90 border border-zinc-800 shadow-2xl space-y-4 backdrop-blur-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">
                      Defensive Next Steps • Executive Security Advisory
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Immediate protective actions recommended by the threat assessment engine
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 self-start sm:self-auto font-bold">
                  WHAT TO DO RIGHT NOW
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {analysisResult.recommended_actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-start gap-3 hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5 font-mono">
                      {idx + 1}
                    </div>
                    <span className="text-zinc-200 font-medium leading-relaxed font-sans">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Verification Details Checkpoints */}
            {analysisResult.verification_notes && analysisResult.verification_notes.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-black/90 overflow-hidden backdrop-blur-md shadow-xl">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-mono font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    TECHNICAL VERIFICATION TELEMETRY ({analysisResult.verification_notes.length} CHECKPOINTS)
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      detailsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {detailsOpen && (
                  <div className="p-4 pt-1 border-t border-zinc-800/80 space-y-2 text-xs bg-zinc-950">
                    {analysisResult.verification_notes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2 font-mono text-[11px] text-zinc-400">
                        <span className="text-emerald-400 flex-shrink-0">[{note.status.toUpperCase()}]</span>
                        <span>
                          <strong className="text-zinc-300">{note.aspect}:</strong> {note.finding}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Disclaimer */}
            <div className="text-[11px] font-mono text-zinc-500 text-center border-t border-zinc-800/80 pt-3">
              <strong>SECURITY DISCLAIMER:</strong> ScamShield is an automated threat indicator scanner.
              It identifies high-risk deception patterns but does not constitute official legal evidence.
              Always independently confirm recruitment inquiries through official company contact channels.
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 bg-black text-zinc-500 text-xs font-mono">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SCAMSHIELD &copy; {new Date().getFullYear()} // THREAT INTELLIGENCE & PHISHING INVESTIGATION</span>
          <span>ENTERPRISE-GRADE FRAUD PREVENTION PROTOCOL</span>
        </div>
      </footer>
    </div>
  );
}

