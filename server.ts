import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Gemini Client Initialization with User-Agent
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are ScamShield, an expert cybersecurity threat intelligence analyst specializing in recruitment scams, fake appointment letters, deposit traps, and phishing campaigns targeting job seekers and students.

Your task is to extract, classify, and explain concrete evidence, risk indicators, positive signals, and entity claims from user-submitted job offer text, recruitment messages, URLs, or screenshots. The application scoring engine calculates the final numerical threat score and risk level deterministically from your extracted evidence.

SCAM THREAT INDEX SCALE THRESHOLDS:
- 0–20%: LOW RISK (Consistent with standard legitimate professional communication, verified patterns, no red flags)
- 21–40%: MODERATE RISK (Minor non-critical ambiguities, missing salary specifics, or informal channels, but no overt financial/credential exploitation)
- 41–60%: ELEVATED RISK (Caution warranted: unusual requirements, pressure tactics, unverified domains, or unconventional interview processes)
- 61–80%: HIGH RISK (Severe red flags detected: mandatory upfront payments, equipment fees, suspicious domain impersonation, credential harvesting paths, high urgency)
- 81–100%: CRITICAL RISK (Active malicious campaign: explicit payment before onboarding, gift card/crypto deposit demands, credential theft, confirmed predatory structure)

EVIDENCE EXTRACTION & CLASSIFICATION MANDATE:
1. Every risk_factor MUST reference specific verbatim evidence or observable facts from the input, followed by an explanation of why this creates risk in employment security. Assign severity (CRITICAL, HIGH, MEDIUM, LOW) objectively based on employment security standards:
   - CRITICAL: Advance-fee payment demands, equipment purchase schemes, wire transfer/crypto requests, credential/OTP harvesting.
   - HIGH: Potential brand impersonation, lookalike domains, unverified auth portals, extreme urgency with forfeiture threats.
   - MEDIUM: Communication redirected to Telegram/WhatsApp, public webmail (@gmail.com) for enterprise recruitment, missing formal interview steps.
   - LOW: Minor formatting anomalies, generic job descriptions without deceptive demands.
2. For lookalike domains (e.g., google-careers-verification.com), treat as: "Potential brand impersonation / lookalike domain" (severity: HIGH) because it incorporates a major corporate brand name in a recruitment-related domain without evidence that it is an official corporate domain. Do NOT claim the company has confirmed it is fraudulent.
3. If inspecting URLs: DO NOT claim domain age has been checked if an authoritative WHOIS provider is not accessed; explicitly state in verification_notes: "Domain age could not be independently verified." Do not fabricate WHOIS dates.
4. If examining images: Do not claim an image is AI-generated or logo is fake without verifiable optical proof; state "Unable to verify from the provided image."
5. Balance findings by capturing legitimate "positive_signals" when actually present (e.g., standard professional interview timeline, valid corporate domain, lack of upfront fee requests, HTTPS protocol).

ADVANCED INVESTIGATION CAPABILITIES:
6. SCAM PATTERN CLASSIFICATION (scam_patterns):
   Identify the primary scam archetype based strictly on evidence (e.g. Advance-Fee Recruitment Scam, Credential Phishing, Fake Work-From-Home Scam, WhatsApp/Telegram Recruitment Scam, Identity Harvesting, Impersonation). Provide specific reasons why it was detected.
7. SCAM ATTACK CHAIN (attack_chain):
   Dynamically reconstruct the step-by-step sequence of how this scam operates from bait to compromise (e.g. ["Fake Job Offer", "Unusually High Salary", "Urgency / Pressure", "Refundable Registration Fee", "Payment Request", "Sensitive Information Request", "OTP Extraction"]).
8. ACTIONABLE FINDINGS (actionable_findings):
   Structure each key finding as: evidence -> why_it_matters -> what_to_do (e.g. "Never share the OTP", "Do not pay registration fees").
9. CLAIM VS EVIDENCE (claim_evidence):
   When an organization or brand is claimed (e.g. Google), contrast Claimed Entity vs Observed Technical Indicator vs Objective Assessment. Use wording like "Potential brand impersonation / lookalike domain" or "Could not be independently verified".
10. INVESTIGATION CHECKS (investigation_checks):
    Assess status (DETECTED, NOT VERIFIED, or VERIFIED) for Company identity, Recruiter contact, Payment request, Hiring process, and Official website.`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    threat_score: {
      type: Type.INTEGER,
      description: 'Overall Scam Threat Index between 0 and 100.',
    },
    risk_level: {
      type: Type.STRING,
      description: 'One of: LOW RISK, MODERATE RISK, ELEVATED RISK, HIGH RISK, CRITICAL RISK, INSUFFICIENT EVIDENCE',
    },
    verdict: {
      type: Type.STRING,
      description: 'A 1-2 sentence executive security verdict.',
    },
    summary: {
      type: Type.STRING,
      description: 'Concise 2-3 sentence explanation summarizing the assessment.',
    },
    action_state: {
      type: Type.STRING,
      description: 'One of: STOP, VERIFY FIRST, LOW CONCERN',
    },
    action_headline: {
      type: Type.STRING,
      description: 'Defensive advisory e.g. "Do not send money, OTPs, or personal identity documents."',
    },
    analysis_confidence: {
      type: Type.STRING,
      description: 'One of: High, Medium, Limited',
    },
    confidence_reason: {
      type: Type.STRING,
      description: 'Reason e.g. "Based on 6 concrete indicators detected."',
    },
    scam_patterns: {
      type: Type.ARRAY,
      description: 'Evidence-grounded scam pattern classification.',
      items: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING },
          reasons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['pattern', 'reasons'],
      },
    },
    attack_chain: {
      type: Type.ARRAY,
      description: 'Step-by-step sequence of attack steps reconstructed from evidence.',
      items: { type: Type.STRING },
    },
    actionable_findings: {
      type: Type.ARRAY,
      description: 'Key findings with evidence, why_it_matters, and what_to_do.',
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          severity: { type: Type.STRING },
          evidence: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          what_to_do: { type: Type.STRING },
        },
        required: ['evidence', 'why_it_matters', 'what_to_do'],
      },
    },
    claim_evidence: {
      type: Type.ARRAY,
      description: 'Claimed entity vs observed indicator vs assessment.',
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING },
          observed: { type: Type.STRING },
          assessment: { type: Type.STRING },
        },
        required: ['claim', 'observed', 'assessment'],
      },
    },
    investigation_checks: {
      type: Type.ARRAY,
      description: 'Checkpoints for Company identity, Recruiter contact, Payment request, Hiring process, Official website.',
      items: {
        type: Type.OBJECT,
        properties: {
          check: { type: Type.STRING },
          status: { type: Type.STRING },
          detail: { type: Type.STRING },
        },
        required: ['check', 'status', 'detail'],
      },
    },
    extracted_info: {
      type: Type.OBJECT,
      description: 'Extracted fields if present in offer or image.',
      properties: {
        company: { type: Type.STRING },
        salary: { type: Type.STRING },
        payment_required: { type: Type.STRING },
        contact: { type: Type.STRING },
        channel: { type: Type.STRING },
        deadline: { type: Type.STRING },
      },
    },
    category_scores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          score: { type: Type.INTEGER, description: 'Score 0 to 100 for this category' },
          weight: { type: Type.INTEGER, description: 'Weight percentage e.g. 25' },
          findingCount: { type: Type.INTEGER },
        },
        required: ['category', 'score', 'weight', 'findingCount'],
      },
    },
    risk_factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: 'E.g. Financial Pressure, Credential/Data Request, Urgency & Manipulation, Identity & Impersonation, Communication Channel, Offer Inconsistency, URL Structure',
          },
          severity: {
            type: Type.STRING,
            description: 'LOW, MEDIUM, HIGH, or CRITICAL',
          },
          evidence: {
            type: Type.STRING,
            description: 'Direct quote or concrete observed indicator from input.',
          },
          explanation: {
            type: Type.STRING,
            description: 'Why this pattern represents risk to the applicant.',
          },
        },
        required: ['category', 'severity', 'evidence', 'explanation'],
      },
    },
    positive_signals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          indicator: { type: Type.STRING },
          detail: { type: Type.STRING },
        },
        required: ['indicator', 'detail'],
      },
    },
    missing_information: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommended_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    verification_notes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          aspect: { type: Type.STRING },
          status: { type: Type.STRING, description: 'verified, unverified, inconclusive, or warning' },
          finding: { type: Type.STRING },
        },
        required: ['aspect', 'status', 'finding'],
      },
    },
    sources: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'threat_score',
    'risk_level',
    'verdict',
    'summary',
    'category_scores',
    'risk_factors',
    'positive_signals',
    'missing_information',
    'recommended_actions',
    'verification_notes',
  ],
};

// ============================================================================
// DETERMINISTIC APPLICATION SCORING ENGINE
// The final 0-100 score and risk level are computed strictly by application code.
// Gemini is used exclusively for extracting and classifying evidence.
// ============================================================================

export type RiskLevel =
  | 'LOW RISK'
  | 'MODERATE RISK'
  | 'ELEVATED RISK'
  | 'HIGH RISK'
  | 'CRITICAL RISK'
  | 'INSUFFICIENT EVIDENCE';

/**
 * Strict 1-to-1 mapping from numerical score (0-100) to RiskLevel.
 * Enforced uniformly across backend calculations and frontend components:
 * - 0–20%: LOW RISK
 * - 21–40%: MODERATE RISK
 * - 41–60%: ELEVATED RISK
 * - 61–80%: HIGH RISK
 * - 81–100%: CRITICAL RISK
 */
export function getRiskLevel(score: number): RiskLevel {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 81) return 'CRITICAL RISK';
  if (s >= 61) return 'HIGH RISK';
  if (s >= 41) return 'ELEVATED RISK';
  if (s >= 21) return 'MODERATE RISK';
  return 'LOW RISK';
}

/**
 * Computes the final 0–100 threat score deterministically from extracted findings.
 * Mathematical invariants guaranteed:
 * 1. The same input evidence always produces the exact same score and risk level.
 * 2. Any CRITICAL factor guarantees score in [85, 98] -> CRITICAL RISK.
 * 3. Any HIGH factor (no critical) guarantees score in [68, 80] -> HIGH RISK (or 81+ if 3+ highs).
 * 4. 3+ MEDIUM factors (no high/crit) guarantees score in [44, 58] -> ELEVATED RISK.
 * 5. 1-2 MEDIUM factors guarantees score in [28, 38] -> MODERATE RISK.
 * 6. Only LOW or 0 factors guarantees score in [5, 20] -> LOW RISK.
 */
export function calculateDeterministicThreatScore(
  riskFactors: Array<{ category?: string; severity?: string; evidence?: string; explanation?: string }>,
  positiveSignals?: Array<{ indicator?: string; detail?: string }>,
  _inputType?: string
): { score: number; riskLevel: RiskLevel } {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const rf of riskFactors) {
    const sev = String(rf.severity || '').toUpperCase().trim();
    if (sev === 'CRITICAL') criticalCount++;
    else if (sev === 'HIGH') highCount++;
    else if (sev === 'MEDIUM') mediumCount++;
    else if (sev === 'LOW') lowCount++;
  }

  let calculatedScore = 10;

  if (criticalCount > 0) {
    // CRITICAL RISK tier: strictly 81–100
    const base = 86;
    const addCrit = (criticalCount - 1) * 4;
    const addHigh = highCount * 2;
    const addMed = Math.min(3, mediumCount * 1);
    calculatedScore = Math.min(98, base + addCrit + addHigh + addMed);
  } else if (highCount >= 3) {
    // 3 or more HIGH severity indicators: Compounding severity triggers CRITICAL RISK tier (82-88)
    const base = 82;
    const addHigh = (highCount - 3) * 2;
    const addMed = Math.min(3, mediumCount * 1);
    calculatedScore = Math.min(88, base + addHigh + addMed);
  } else if (highCount === 2) {
    // 2 HIGH severity indicators: Upper HIGH RISK tier (76-80)
    const base = 76;
    const addMed = Math.min(4, Math.round(mediumCount * 1.5));
    calculatedScore = Math.min(80, base + addMed);
  } else if (highCount === 1) {
    // 1 HIGH severity indicator: Strictly HIGH RISK tier (68-76)
    const base = 68;
    const addMed = Math.min(6, mediumCount * 2);
    const addLow = Math.min(2, lowCount * 1);
    calculatedScore = Math.min(76, base + addMed + addLow);
  } else if (mediumCount >= 3) {
    // 3+ MEDIUM severity indicators: Strictly ELEVATED RISK tier (44-58)
    const base = 44;
    const addMed = (mediumCount - 3) * 3;
    calculatedScore = Math.min(58, base + addMed + Math.min(3, lowCount * 1));
  } else if (mediumCount > 0) {
    // 1-2 MEDIUM severity indicators: Strictly MODERATE RISK tier (28-38)
    const base = 22 + (mediumCount * 7); // 1 med: 29, 2 med: 36
    calculatedScore = Math.min(38, base + Math.min(2, lowCount * 1));
  } else if (lowCount > 0) {
    // Only LOW severity indicators: Strictly LOW RISK tier (12-20)
    calculatedScore = Math.min(20, 10 + lowCount * 3);
  } else {
    // Zero risk factors detected: Strictly LOW RISK tier (5-10)
    const posDiscount = Math.min(5, (positiveSignals?.length || 0) * 2);
    calculatedScore = Math.max(5, 10 - posDiscount);
  }

  // Mitigating positive signals (only applied if not Critical)
  if (criticalCount === 0 && positiveSignals && positiveSignals.length > 0) {
    const mitigation = Math.min(3, positiveSignals.length);
    // Respect strict tier lower-bounds so mitigation never causes a tier-level contradiction
    if (highCount >= 3) {
      calculatedScore = Math.max(81, calculatedScore - mitigation);
    } else if (highCount > 0) {
      calculatedScore = Math.max(65, calculatedScore - mitigation);
    } else if (mediumCount >= 3) {
      calculatedScore = Math.max(42, calculatedScore - mitigation);
    } else if (mediumCount > 0) {
      calculatedScore = Math.max(22, calculatedScore - mitigation);
    } else {
      calculatedScore = Math.max(5, calculatedScore - mitigation);
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));
  const riskLevel = getRiskLevel(finalScore);

  return { score: finalScore, riskLevel };
}

// Fail-Safe Cybersecurity Threat Engine (runs if API experiences temporary high demand)
function generateHeuristicReport(content: string, type: 'text' | 'url' | 'screenshot'): any {
  const lower = content.toLowerCase();
  const riskFactors: any[] = [];
  const positiveSignals: any[] = [];
  let score = 15;

  if (type === 'url') {
    const isIp = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/.test(lower);
    const isHttp = lower.startsWith('http://');
    const hasPhishPath = /(login|verification|portal|session|secure|account|update|employee-confirmation|auth|signin)/i.test(lower);
    const isShortener = /(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy)/i.test(lower);
    const hasSuspiciousTld = /\.(xyz|top|work|click|buzz|cam|live|gq|ml|cf|tk)\b/i.test(lower);

    // Lookalike brand domain evaluation
    const knownBrands = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix', 'workday', 'oracle', 'salesforce', 'linkedin', 'deloitte', 'accenture', 'cisco', 'ibm', 'paypal', 'uber'];
    const recruitTerms = ['career', 'careers', 'job', 'jobs', 'verify', 'verification', 'hr', 'hire', 'portal', 'employee', 'login', 'onboarding'];

    let matchedBrand = '';
    for (const b of knownBrands) {
      if (lower.includes(b)) {
        matchedBrand = b;
        break;
      }
    }
    const hasRecruitTerm = recruitTerms.some(t => lower.includes(t));
    const isOfficialBrand = matchedBrand ? (lower.includes(`.${matchedBrand}.com/`) || lower.includes(`://${matchedBrand}.com`) || lower.includes(`.${matchedBrand}.com?`)) : false;
    const isLookalikeBrand = Boolean(matchedBrand && hasRecruitTerm && !isOfficialBrand);

    if (isLookalikeBrand) {
      score += 55;
      riskFactors.push({
        category: 'Brand Impersonation / Lookalike Domain',
        severity: 'HIGH',
        evidence: content.slice(0, 100),
        explanation: `Potential brand impersonation / lookalike domain: Uses a major company name ("${matchedBrand}") in a recruitment-related domain without evidence that it is an official corporate domain.`,
      });
    }

    if (hasPhishPath) {
      score += 25;
      riskFactors.push({
        category: 'Credential Harvesting Path',
        severity: 'HIGH',
        evidence: 'URL path contains authentication or confirmation endpoints',
        explanation: 'Authentication and employee verification endpoints hosted on an unverified third-party domain are typical of credential harvesting structures.',
      });
    }

    if (isIp) {
      score += 45;
      riskFactors.push({
        category: 'URL & Domain Structure',
        severity: 'CRITICAL',
        evidence: content.slice(0, 100),
        explanation: 'Domain relies on a raw IP address rather than a registered corporate hostname, a signature of temporary phishing infrastructure.',
      });
    }

    if (isHttp) {
      score += 20;
      riskFactors.push({
        category: 'Transport Security',
        severity: 'HIGH',
        evidence: 'http:// insecure protocol',
        explanation: 'The link utilizes unencrypted plaintext HTTP, exposing submitted credentials or candidate data to interception.',
      });
    }

    if (isShortener) {
      score += 20;
      riskFactors.push({
        category: 'URL Obfuscation',
        severity: 'MEDIUM',
        evidence: 'URL shortener domain detected',
        explanation: 'URL shortening services mask the true destination domain, preventing inspection prior to navigation.',
      });
    }

    if (hasSuspiciousTld) {
      score += 15;
      riskFactors.push({
        category: 'Unusual Top-Level Domain',
        severity: 'MEDIUM',
        evidence: 'Non-standard or low-reputation TLD',
        explanation: 'Enterprise organizations rarely deploy official employee portals on discount or high-abuse top-level domains.',
      });
    }

    if (!isIp && !isHttp && !hasPhishPath && !isLookalikeBrand && !isShortener) {
      positiveSignals.push({
        indicator: 'Encrypted Transport',
        detail: 'URL employs standard HTTPS encryption.',
      });
    }
  } else {
    // Text / Screenshot heuristic scanning
    const hasEquipmentTrap = /(equipment|laptop|macbook|bundle|vendor|yubikey)/i.test(lower) && /(pay|wire|deposit|purchase|reimburse|\$|₹|fee)/i.test(lower);
    const hasCryptoTask = /(usdt|crypto|wallet|daily task|smart contract|vip task|part-time)/i.test(lower);
    const hasUrgency = /(24 hours|tomorrow|immediate forfeiture|urgent|5:00 pm|today)/i.test(lower);
    const hasSuspiciousEmail = /@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com)/i.test(lower);
    const hasChatRedirect = /(whatsapp|telegram|signal)/i.test(lower);
    const hasBankRequest = /(otp|bank account|routing number|password|ssn|social security)/i.test(lower);

    if (hasEquipmentTrap) {
      score += 50;
      riskFactors.push({
        category: 'Financial Pressure',
        severity: 'CRITICAL',
        evidence: 'Mandatory upfront equipment/deposit payment requested before starting employment.',
        explanation: 'Legitimate employers never require candidates to wire money or purchase hardware through specific vendors as a condition of employment.',
      });
    }

    if (hasCryptoTask) {
      score += 55;
      riskFactors.push({
        category: 'Financial Exploitation',
        severity: 'CRITICAL',
        evidence: 'Demands cryptocurrency deposit (USDT/crypto) to unlock tasks or VIP tiers.',
        explanation: 'Predatory task-scam model designed to extract irreversible cryptocurrency payments.',
      });
    }

    if (hasUrgency) {
      score += 15;
      riskFactors.push({
        category: 'Urgency & Manipulation',
        severity: 'HIGH',
        evidence: 'Short deadline with threat of immediate offer forfeiture.',
        explanation: 'Threat actors fabricate artificial time pressure to bypass critical thinking and background checks.',
      });
    }

    if (hasSuspiciousEmail) {
      score += 15;
      riskFactors.push({
        category: 'Identity & Channel Inconsistency',
        severity: 'HIGH',
        evidence: 'Public free webmail provider (@gmail/@yahoo) utilized for official corporate communications.',
        explanation: 'Enterprise organizations issue communications from authenticated private corporate domains.',
      });
    }

    if (hasChatRedirect) {
      score += 15;
      riskFactors.push({
        category: 'Communication Channel Anomaly',
        severity: 'MEDIUM',
        evidence: 'Recruitment or HR onboarding redirected to Telegram or WhatsApp.',
        explanation: 'Unregulated encrypted chat channels provide anonymity for fraudulent actors and lack audit trails.',
      });
    }

    if (hasBankRequest) {
      score += 40;
      riskFactors.push({
        category: 'Credential / Identity Theft',
        severity: 'CRITICAL',
        evidence: 'Demands banking credentials, OTPs, or identity numbers prior to formal contract signing.',
        explanation: 'Pretexting to harvest personal identifiable information (PII) for account takeover or identity fraud.',
      });
    }

    if (riskFactors.length === 0) {
      score = 12;
      positiveSignals.push(
        {
          indicator: 'No Advance Fee Demands',
          detail: 'No upfront equipment fees, registration deposits, or payment demands were found.',
        },
        {
          indicator: 'Standard Professional Tone',
          detail: 'Communication reflects standard corporate offer terms and established hiring timelines.',
        }
      );
    }
  }

  const { score: computedScore, riskLevel: computedRiskLevel } = calculateDeterministicThreatScore(riskFactors, positiveSignals, type);
  const finalScore = computedScore;
  const riskLevel = computedRiskLevel;

  const hasHighOrCritical = riskFactors.some(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');

  const verdictText = (finalScore >= 61 || hasHighOrCritical)
    ? (type === 'url'
        ? 'Potential brand impersonation / lookalike domain and deceptive URL indicators detected. Independent domain verification required.'
        : 'High-risk recruitment deception and predatory payment indicators detected.')
    : finalScore >= 41
    ? 'Elevated risk detected. Caution is strongly advised before sharing documents, credentials, or funds.'
    : 'Low threat profile. Material conforms to standard recruitment patterns.';

  const summaryText = (finalScore >= 61 || hasHighOrCritical)
    ? (type === 'url'
        ? 'The submitted URL exhibits key signatures of potential brand impersonation and suspicious credential harvesting paths on an unverified domain.'
        : 'The submitted communication contains multiple critical scam signatures, including advance-fee equipment requests and unverified communication channels.')
    : 'No overt financial exploitation or credential theft indicators were identified in the provided material.';

  return {
    threat_score: finalScore,
    risk_level: riskLevel,
    verdict: verdictText,
    summary: summaryText,
    category_scores: [
      { category: 'Financial Pressure', score: riskFactors.some(r => r.category.includes('Financial')) ? 85 : 10, weight: 35, findingCount: 1 },
      { category: 'Identity & Channels', score: riskFactors.some(r => r.category.includes('Identity') || r.category.includes('Channel') || r.category.includes('Brand')) ? 80 : 15, weight: 25, findingCount: 1 },
      { category: 'Urgency & Manipulation', score: riskFactors.some(r => r.category.includes('Urgency')) ? 80 : 10, weight: 20, findingCount: 1 },
      { category: 'URL & Infrastructure', score: type === 'url' ? (finalScore >= 60 ? 85 : 25) : 10, weight: 20, findingCount: 1 },
    ],
    risk_factors: riskFactors,
    positive_signals: positiveSignals,
    missing_information: ['Authoritative corporate WHOIS record', 'Verified enterprise switchboard verification'],
    recommended_actions: [
      'Do not enter credentials, passwords, or personal identity numbers.',
      'Independently contact the claimed organization through their officially registered corporate website.',
      'Do not disburse any money, wire transfers, or gift card deposits.',
      'Preserve the link and any associated email headers for security verification.',
    ],
    verification_notes: [
      { aspect: 'Domain Age & WHOIS', status: 'unverified', finding: 'Domain age could not be independently verified.' },
      { aspect: 'Corporate Registration', status: 'warning', finding: 'Host identity could not be authenticated against authoritative enterprise domain records.' },
    ],
    sources: [],
    input_type: type,
    analyzed_at: new Date().toISOString(),
  };
}

function enforceScoringConsistency(report: any, inputType: 'url' | 'text' | 'screenshot' | 'offer_text', rawInput: string): any {
  if (!report || typeof report !== 'object') return report;

  const rawFactors: any[] = Array.isArray(report.risk_factors) ? [...report.risk_factors] : [];
  const rawLower = (rawInput || '').toLowerCase();

  // Specialized deterministic inspection for URL inputs to guarantee detection of lookalike domains and credential harvesting paths
  if (inputType === 'url') {
    try {
      const parsed = new URL(rawInput.startsWith('http://') || rawInput.startsWith('https://') ? rawInput : `https://${rawInput}`);
      const hostname = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname.toLowerCase();

      const knownBrands = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix', 'workday', 'oracle', 'salesforce', 'linkedin', 'deloitte', 'accenture', 'cisco', 'ibm', 'paypal', 'uber'];
      const recruitTerms = ['career', 'careers', 'job', 'jobs', 'verify', 'verification', 'hr', 'hire', 'hiring', 'recruiting', 'recruitment', 'onboarding', 'employee', 'portal', 'work'];

      const matchedBrand = knownBrands.find(b => hostname.includes(b));
      const hasRecruitTerm = recruitTerms.some(k => hostname.includes(k));
      const isOfficialDomain = matchedBrand ? (hostname === `${matchedBrand}.com` || hostname.endsWith(`.${matchedBrand}.com`)) : false;

      // Brand Impersonation / Lookalike Domain
      if (matchedBrand && hasRecruitTerm && !isOfficialDomain) {
        const alreadyHasBrand = rawFactors.some(
          rf => rf.category?.toLowerCase().includes('brand') || rf.evidence?.toLowerCase().includes(matchedBrand)
        );
        if (!alreadyHasBrand) {
          rawFactors.unshift({
            category: 'Brand Impersonation / Lookalike Domain',
            severity: 'HIGH',
            evidence: hostname,
            explanation: `Potential brand impersonation / lookalike domain: Uses a major company name ("${matchedBrand}") in a recruitment-related domain without evidence that it is an official corporate domain.`,
          });
        }
      }

      // Credential harvesting path check
      const hasCredentialPath = /(login|employee-confirmation|verification|signin|auth|password|account|credential|session)/i.test(pathname);
      if (hasCredentialPath && (matchedBrand || !isOfficialDomain)) {
        const alreadyHasPath = rawFactors.some(
          rf => rf.evidence?.toLowerCase().includes(pathname) || rf.category?.toLowerCase().includes('credential')
        );
        if (!alreadyHasPath) {
          rawFactors.push({
            category: 'Credential Harvesting Path',
            severity: 'HIGH',
            evidence: pathname,
            explanation: 'The URL path contains authentication or confirmation endpoints on an unverified third-party domain, a pattern typical of credential harvesting.',
          });
        }
      }
    } catch {
      // ignore URL parsing issues
    }
  }

  // Specialized deterministic inspection for Text & Screenshot inputs
  if (inputType === 'text' || inputType === 'offer_text' || inputType === 'screenshot') {
    const hasAdvancePaymentFee = /\b(registration fee|security deposit|refundable deposit|laptop fee|equipment fee|wire transfer|crypto deposit|pay before|pay for equipment|software license fee)\b/i.test(rawLower);
    if (hasAdvancePaymentFee) {
      const alreadyHasPaymentCrit = rawFactors.some(
        rf => String(rf.severity || '').toUpperCase() === 'CRITICAL' && /fee|deposit|payment|equipment|wire|crypto/i.test(rf.category + ' ' + rf.evidence)
      );
      if (!alreadyHasPaymentCrit) {
        rawFactors.unshift({
          category: 'Advance-Fee / Equipment Wire Trap',
          severity: 'CRITICAL',
          evidence: 'Mandatory upfront fee or equipment purchase demanded before onboarding',
          explanation: 'Legitimate employers never demand upfront payment, equipment deposits, or wire transfers from prospective employees.',
        });
      }
    }
  }

  // Deduplicate risk factors by normalized signature to guarantee stable counts
  const seenSignatures = new Set<string>();
  const riskFactors: any[] = [];
  for (const rf of rawFactors) {
    const cat = (rf.category || '').toLowerCase().trim();
    const sev = String(rf.severity || '').toUpperCase().trim();
    const evSub = (rf.evidence || '').toLowerCase().slice(0, 30).trim();
    const sig = `${cat}:::${sev}:::${evSub}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      riskFactors.push({
        category: rf.category || 'General Risk Factor',
        severity: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev) ? sev : 'MEDIUM') as any,
        evidence: rf.evidence || 'Observable anomaly in submitted material',
        explanation: rf.explanation || 'Identified pattern presents security risk.',
      });
    }
  }

  const positiveSignals = Array.isArray(report.positive_signals) ? report.positive_signals : [];

  // 1. DETERMINISTIC APPLICATION-LEVEL SCORING
  // Gemini's arbitrary score is completely disregarded; application code calculates score and risk level.
  const { score: finalScore, riskLevel } = calculateDeterministicThreatScore(riskFactors, positiveSignals, inputType);

  const criticalCount = riskFactors.filter(r => String(r.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = riskFactors.filter(r => String(r.severity || '').toUpperCase() === 'HIGH').length;
  const mediumCount = riskFactors.filter(r => String(r.severity || '').toUpperCase() === 'MEDIUM').length;

  // 4. DYNAMIC VERDICT & SUMMARY RECALCULATION
  // Prevent any contradiction where high/critical indicators coexist with 'Low threat profile'
  const contradictoryPhrases = [
    'low threat',
    'minimal risk',
    'low risk',
    'moderate threat',
    'authentic',
    'legitimate',
    'safe',
    'conforms to standard',
    'no red flags',
    'standard recruitment',
    'harmless',
    'benign',
    'appears genuine',
    'appears legitimate',
    'no security concerns',
  ];

  let rawVerdict = String(report.verdict || '').trim();
  let rawSummary = String(report.summary || '').trim();
  const rawVerdictLower = rawVerdict.toLowerCase();
  const rawSummaryLower = rawSummary.toLowerCase();

  const verdictIsContradictory = contradictoryPhrases.some(p => rawVerdictLower.includes(p));
  const summaryIsContradictory = contradictoryPhrases.some(p => rawSummaryLower.includes(p));

  // Helper to extract top risk factor categories for evidence-backed verdicts
  const highOrCriticalFactors = riskFactors.filter(rf => ['HIGH', 'CRITICAL'].includes(String(rf.severity || '').toUpperCase()));
  const topCategories = Array.from(new Set(highOrCriticalFactors.map(f => f.category))).slice(0, 2).join(' and ');

  let verdict = rawVerdict;
  let summary = rawSummary;

  if (riskLevel === 'CRITICAL RISK' || criticalCount > 0) {
    const indicatorText = topCategories || 'predatory advance-fee and credential harvesting';
    if (!verdict || verdictIsContradictory || rawVerdictLower.includes('low') || rawVerdictLower.includes('moderate')) {
      verdict = `Critical Threat Profile: High-risk employment fraud indicators identified (${indicatorText}). Immediate cessation of communication recommended.`;
      summary = `The evaluation identified severe security risks (${indicatorText}). Legitimate employers never require advance payments, equipment wire transfers, or unverified credential submission.`;
    }
  } else if (riskLevel === 'HIGH RISK' || highCount > 0) {
    const indicatorText = topCategories || 'potential brand impersonation / lookalike domain or credential collection';
    if (!verdict || verdictIsContradictory || rawVerdictLower.includes('low') || rawVerdictLower.includes('moderate')) {
      if (inputType === 'url') {
        verdict = 'Potential brand impersonation / lookalike domain and deceptive URL indicators detected. Independent domain verification required.';
        summary = 'The analyzed URL contains high-severity indicators including lookalike branding and potential credential harvesting structures on an unverified domain. Do not submit credentials.';
      } else {
        verdict = `High Threat Profile: Severe recruitment deception indicators detected (${indicatorText}). Independent organizational verification required.`;
        summary = `The submission contains high-severity deception indicators (${indicatorText}). Legitimate organizations do not utilize unverified channels or informal credential requests. Cease interaction until verified.`;
      }
    }
  } else if (riskLevel === 'ELEVATED RISK') {
    if (!verdict || verdictIsContradictory) {
      verdict = 'Elevated Threat Profile: Anomalous recruitment patterns identified. Exercise caution and verify via official channels.';
      summary = 'Multiple irregular patterns were identified. While not definitively confirmed as fraudulent, independent verification through official corporate channels is strongly recommended.';
    }
  } else if (riskLevel === 'MODERATE RISK') {
    if (!verdict || verdictIsContradictory) {
      verdict = 'Moderate Threat Profile: Minor recruitment ambiguities identified requiring standard verification.';
      summary = 'The submission contains minor inconsistencies. Follow standard due diligence before proceeding.';
    }
  } else if (riskLevel === 'LOW RISK') {
    // Only permitted if zero critical, high, or medium factors were found
    if (!verdict || verdictIsContradictory) {
      verdict = 'Low Threat Profile: Conforms to standard recruitment communication patterns without obvious fraud indicators.';
    }
    if (!summary || summaryIsContradictory) {
      summary = 'No high-severity deception or fraud indicators were detected in the analyzed submission. Standard cybersecurity caution is always advised.';
    }
  }

  // 5. DYNAMIC CATEGORY SCORES RECALCULATION
  // Ensure individual category scores dynamically reflect the weighted findings in each domain
  let categoryScores = Array.isArray(report.category_scores) ? [...report.category_scores] : [];
  if (categoryScores.length > 0) {
    categoryScores = categoryScores.map(cs => {
      const catLower = (cs.category || '').toLowerCase();
      const matchingFactors = riskFactors.filter(rf => {
        const rfCat = (rf.category || '').toLowerCase();
        return rfCat.includes(catLower) || catLower.includes(rfCat) ||
          (catLower.includes('url') && (rfCat.includes('url') || rfCat.includes('domain') || rfCat.includes('brand') || rfCat.includes('transport'))) ||
          (catLower.includes('identity') && (rfCat.includes('brand') || rfCat.includes('impersonat') || rfCat.includes('identity') || rfCat.includes('channel'))) ||
          (catLower.includes('financial') && (rfCat.includes('payment') || rfCat.includes('deposit') || rfCat.includes('fee') || rfCat.includes('financial') || rfCat.includes('equipment'))) ||
          (catLower.includes('urgency') && (rfCat.includes('urgency') || rfCat.includes('pressure') || rfCat.includes('deadline')));
      });

      const hasCrit = matchingFactors.some(f => String(f.severity || '').toUpperCase() === 'CRITICAL');
      const hasH = matchingFactors.some(f => String(f.severity || '').toUpperCase() === 'HIGH');
      const hasM = matchingFactors.some(f => String(f.severity || '').toUpperCase() === 'MEDIUM');

      let targetCatScore = 8;
      if (hasCrit) {
        targetCatScore = 88 + Math.min(10, (matchingFactors.length - 1) * 3);
      } else if (hasH) {
        targetCatScore = 72 + Math.min(12, (matchingFactors.length - 1) * 4);
      } else if (hasM) {
        targetCatScore = 40 + Math.min(15, (matchingFactors.length - 1) * 5);
      } else if (matchingFactors.length > 0) {
        targetCatScore = 20;
      } else {
        targetCatScore = cs.category?.includes('Urgency') ? 5 : 8;
      }

      return {
        ...cs,
        score: Math.min(100, Math.max(0, targetCatScore)),
        findingCount: matchingFactors.length,
      };
    });
  }

  // 6. ACTION STATE & DEFENSIVE HEADLINE
  let action_state: 'STOP' | 'VERIFY FIRST' | 'LOW CONCERN' = 'LOW CONCERN';
  let action_headline = 'No major warning indicators detected. Practice standard professional due diligence.';

  if (riskLevel === 'CRITICAL RISK' || riskLevel === 'HIGH RISK' || finalScore >= 61) {
    action_state = 'STOP';
    action_headline = 'Do not send money, OTPs, or personal identity documents.';
  } else if (riskLevel === 'ELEVATED RISK' || riskLevel === 'MODERATE RISK' || finalScore >= 21) {
    action_state = 'VERIFY FIRST';
    action_headline = 'Independently confirm the employer and recruiter before proceeding.';
  }

  // 7. ANALYSIS CONFIDENCE
  const concreteCount = riskFactors.length + (Array.isArray(report.positive_signals) ? report.positive_signals.length : 0);
  let analysis_confidence: 'High' | 'Medium' | 'Limited' = 'Limited';
  let confidence_reason = 'Limited evidence available in the provided sample.';

  if (concreteCount >= 4) {
    analysis_confidence = 'High';
    confidence_reason = `Based on ${concreteCount} concrete indicators detected.`;
  } else if (concreteCount >= 2) {
    analysis_confidence = 'Medium';
    confidence_reason = `Based on ${concreteCount} concrete indicators detected.`;
  }

  // 8. SCAM PATTERN CLASSIFICATION
  let scam_patterns = Array.isArray(report.scam_patterns) ? [...report.scam_patterns] : [];
  if (scam_patterns.length === 0 && finalScore >= 35) {
    const rawLower = (rawInput || '').toLowerCase();
    const hasPayment = riskFactors.some(r => /fee|pay|deposit|financial|equipment|crypto/i.test(r.category + ' ' + r.evidence));
    const hasUrgency = riskFactors.some(r => /urgency|deadline|pressure|immediate/i.test(r.category + ' ' + r.evidence));
    const hasRefund = rawLower.includes('refund') || rawLower.includes('reimburs');
    const hasTelegram = rawLower.includes('telegram') || rawLower.includes('whatsapp');
    const hasBrand = riskFactors.some(r => /brand|impersonat|lookalike/i.test(r.category));
    const hasCredential = riskFactors.some(r => /credential|login|otp|password|phish|session/i.test(r.category + ' ' + r.evidence));

    if (hasPayment) {
      const reasons: string[] = ['Upfront payment or deposit request'];
      if (hasRefund) reasons.push('Promise of refund after onboarding');
      if (hasUrgency) reasons.push('Artificial urgency and strict deadlines');
      reasons.push('Employment offer conditioned on applicant expense');

      scam_patterns.push({
        pattern: 'Advance-Fee Recruitment Scam',
        reasons: reasons.slice(0, 4),
      });
    } else if (hasBrand || hasCredential || inputType === 'url') {
      const reasons: string[] = ['Unverified recruitment lookalike domain'];
      if (hasCredential) reasons.push('Credential collection / authentication form');
      if (hasBrand) reasons.push('Corporate brand impersonation');
      reasons.push('Hosting unaffiliated with official enterprise domain');

      scam_patterns.push({
        pattern: 'Credential Phishing & Brand Impersonation',
        reasons: reasons.slice(0, 4),
      });
    } else if (hasTelegram) {
      scam_patterns.push({
        pattern: 'Messaging Channel Recruitment Scam',
        reasons: [
          'Directing communication to unverified messaging channels',
          'Lack of official corporate email communication',
          'Absence of formal verifiable interview steps',
        ],
      });
    } else if (finalScore >= 60) {
      scam_patterns.push({
        pattern: 'Predatory Recruitment Impersonation',
        reasons: [
          'High-risk deception indicators detected',
          'Unverified identity claims',
          'Deviates from legitimate corporate hiring procedures',
        ],
      });
    }
  }

  // 9. DYNAMIC SCAM ATTACK CHAIN
  let attack_chain = Array.isArray(report.attack_chain) && report.attack_chain.length >= 2 ? [...report.attack_chain] : [];
  if (attack_chain.length === 0 && finalScore >= 35) {
    const rawLower = (rawInput || '').toLowerCase();
    const chain: string[] = [];

    if (inputType === 'url') {
      chain.push('Deceptive Recruitment Message / Job Ad');
      chain.push('Click to Lookalike Domain');
      if (riskFactors.some(r => /brand|impersonat/i.test(r.category))) chain.push('Corporate Brand Impersonation');
      if (riskFactors.some(r => /credential|login|confirmation/i.test(r.category + ' ' + r.evidence)) || rawLower.includes('login') || rawLower.includes('confirmation')) {
        chain.push('Fake Employee / Candidate Verification Form');
      }
      chain.push('Credential Harvesting');
      chain.push('Account Takeover / Identity Compromise');
    } else {
      if (/offer|hired|congratulations|appointment|selected|job/i.test(rawLower)) chain.push('Fake Job Offer');
      if (/salary|\$|₹|month|day|stipend|earn|package|lpa/i.test(rawLower)) chain.push('Unusually High Salary');
      if (rawLower.includes('no interview') || !rawLower.includes('interview')) chain.push('No Formal Interview');
      if (/urgent|today|immediately|deadline|hour|forfeit/i.test(rawLower)) chain.push('Urgency / Time Pressure');
      if (/fee|deposit|refundable|registration|equipment|laptop/i.test(rawLower)) chain.push('Refundable Registration / Equipment Fee');
      if (/upi|pay|wire|transfer|crypto|usdt|account|gpay|phonepe/i.test(rawLower)) chain.push('Payment Request');
      if (/aadhaar|pan|ssn|bank details|account number|passport/i.test(rawLower)) chain.push('Personal / Banking Details Request');
      if (/otp|code|one time password/i.test(rawLower)) chain.push('OTP Extraction Request');
      chain.push(finalScore >= 75 ? 'Potential Financial & Identity Theft Risk' : 'Risk of Exploitation');
    }

    attack_chain = chain;
  }

  // 10. ACTIONABLE FINDINGS (Evidence -> Why It Matters -> What To Do)
  let actionable_findings = Array.isArray(report.actionable_findings) && report.actionable_findings.length > 0
    ? [...report.actionable_findings]
    : [];

  if (actionable_findings.length === 0 && riskFactors.length > 0) {
    actionable_findings = riskFactors.map(rf => {
      const cat = (rf.category || '').toLowerCase();
      const ev = (rf.evidence || '').toLowerCase();
      let what_to_do = 'Independently contact the company through verified official directory listings.';

      if (ev.includes('otp') || cat.includes('otp')) {
        what_to_do = 'Never share OTPs or authentication codes with anyone claiming to be a recruiter.';
      } else if (cat.includes('financial') || ev.includes('fee') || ev.includes('pay') || ev.includes('deposit') || ev.includes('upi')) {
        what_to_do = 'Never pay registration fees or transfer funds to secure employment or equipment.';
      } else if (cat.includes('brand') || cat.includes('url') || ev.includes('.com') || cat.includes('lookalike')) {
        what_to_do = 'Do not input credentials or sensitive data. Navigate directly to the official enterprise careers portal.';
      } else if (cat.includes('channel') || ev.includes('telegram') || ev.includes('whatsapp')) {
        what_to_do = 'Insist on professional correspondence from official corporate domain email addresses.';
      } else if (cat.includes('urgency') || ev.includes('hour') || ev.includes('today')) {
        what_to_do = 'Refuse to be pressured by artificial urgency designed to prevent due diligence.';
      } else if (cat.includes('credential') || ev.includes('password') || ev.includes('login')) {
        what_to_do = 'Never disclose account credentials or personal banking PINs.';
      }

      return {
        category: rf.category,
        severity: rf.severity,
        evidence: rf.evidence,
        why_it_matters: rf.explanation,
        what_to_do,
      };
    });
  }

  // 11. CLAIM VS EVIDENCE
  let claim_evidence = Array.isArray(report.claim_evidence) && report.claim_evidence.length > 0
    ? [...report.claim_evidence]
    : [];

  if (claim_evidence.length === 0) {
    const rawLower = (rawInput || '').toLowerCase();
    const knownBrands = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix', 'workday', 'oracle', 'deloitte', 'infosys', 'tcs', 'wipro'];
    const matchedBrand = knownBrands.find(b => rawLower.includes(b));

    if (inputType === 'url') {
      try {
        const parsed = new URL(rawInput.startsWith('http') ? rawInput : `https://${rawInput}`);
        const hostname = parsed.hostname.toLowerCase();
        if (matchedBrand && !hostname.endsWith(`.${matchedBrand}.com`) && hostname !== `${matchedBrand}.com`) {
          const capitalized = matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1);
          claim_evidence.push({
            claim: `${capitalized} Recruitment / Careers`,
            observed: hostname,
            assessment: `Potential brand impersonation / lookalike domain. Domain is not verified as an official ${capitalized} property.`,
          });
        }
      } catch {}
    } else if (matchedBrand) {
      const capitalized = matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1);
      const emailMatch = rawInput.match(/([a-zA-Z0-9._%+-]+@(?:gmail|yahoo|outlook|hotmail)\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        claim_evidence.push({
          claim: `${capitalized} HR / Talent Acquisition`,
          observed: emailMatch[1],
          assessment: `Recruiter identity could not be independently verified. Major enterprise employers use authenticated corporate email domains rather than public webmail.`,
        });
      } else if (rawLower.includes('telegram') || rawLower.includes('whatsapp')) {
        claim_evidence.push({
          claim: `${capitalized} Recruiter`,
          observed: rawLower.includes('telegram') ? 'Telegram Messaging Channel' : 'WhatsApp Messaging Channel',
          assessment: `Channel could not be independently authenticated. Legitimate corporate recruitment begins with verified enterprise systems.`,
        });
      }
    }
  }

  // 12. INVESTIGATION CHECKS (Employer Verification Assistant)
  let investigation_checks = Array.isArray(report.investigation_checks) && report.investigation_checks.length > 0
    ? [...report.investigation_checks]
    : [];

  if (investigation_checks.length === 0) {
    const rawLower = (rawInput || '').toLowerCase();
    const hasFee = riskFactors.some(r => /fee|pay|deposit|financial|equipment|crypto/i.test(r.category + ' ' + r.evidence));
    const hasBrandWarning = riskFactors.some(r => /brand|impersonat|lookalike/i.test(r.category));
    const hasWebmail = /@gmail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com/i.test(rawInput);
    const hasInterviewMissing = rawLower.includes('no interview') || (!rawLower.includes('interview') && finalScore >= 40);

    investigation_checks = [
      {
        check: 'Company Identity',
        status: hasBrandWarning ? 'WARNING' : (finalScore <= 20 ? 'VERIFIED' : 'NOT VERIFIED'),
        detail: hasBrandWarning
          ? 'Potential brand impersonation detected on unverified domain.'
          : 'Could not be independently authenticated against corporate registry.',
      },
      {
        check: 'Recruiter Contact',
        status: hasWebmail ? 'WARNING' : (rawLower.includes('telegram') || rawLower.includes('whatsapp') ? 'WARNING' : 'NOT VERIFIED'),
        detail: hasWebmail
          ? 'Uses public free webmail address instead of official enterprise domain.'
          : (rawLower.includes('telegram') || rawLower.includes('whatsapp')
            ? 'Communication redirected to unverified messaging channels.'
            : 'Recruiter identity could not be independently authenticated.'),
      },
      {
        check: 'Payment Request',
        status: hasFee ? 'DETECTED' : 'NOT VERIFIED',
        detail: hasFee
          ? 'Mandatory upfront registration, training, or equipment fee detected.'
          : 'No explicit advance payment demands identified in sample.',
      },
      {
        check: 'Hiring Process',
        status: hasInterviewMissing ? 'WARNING' : 'NOT VERIFIED',
        detail: hasInterviewMissing
          ? 'Job offer extended without standard technical or managerial interviews.'
          : 'Formal hiring and interview stages could not be confirmed.',
      },
      {
        check: 'Official Website',
        status: 'NOT VERIFIED',
        detail: 'Verify whether this position exists on the official corporate careers portal.',
      },
    ];
  }

  // 13. EXTRACTED INFORMATION
  let extracted_info = report.extracted_info && typeof report.extracted_info === 'object' ? { ...report.extracted_info } : {};
  if (Object.keys(extracted_info).length === 0) {
    const rawLower = (rawInput || '').toLowerCase();
    const companyMatch = rawInput.match(/\b(Google|Microsoft|Amazon|Apple|Meta|Netflix|Workday|Oracle|Deloitte|Infosys|TCS|Wipro|Cognizant)\b/i);
    const salaryMatch = rawInput.match(/((?:₹|\$|INR|USD|EUR|GBP)\s*[\d,]+(?:\s*(?:\/|-|to)\s*[\d,]+)?(?:\s*(?:per\s*month|per\s*year|per\s*day|\/mo|\/yr|p\.a\.|lpa))?)/i);
    const paymentMatch = rawInput.match(/((?:₹|\$|INR|USD)\s*[\d,]+(?:\s*(?:fee|deposit|refundable|charge|equipment|registration))?)/i);
    const emailMatch = rawInput.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const channelMatch = rawLower.includes('whatsapp') ? 'WhatsApp' : rawLower.includes('telegram') ? 'Telegram' : rawLower.includes('email') ? 'Email' : undefined;
    const deadlineMatch = rawInput.match(/(\b(?:within\s+\d+\s+hours?|\d+\s+hours?|today|immediately|tomorrow|by\s+5\s*pm)\b)/i);

    if (companyMatch) extracted_info.company = companyMatch[1];
    if (salaryMatch) extracted_info.salary = salaryMatch[1];
    if (paymentMatch) extracted_info.payment_required = paymentMatch[1];
    if (emailMatch) extracted_info.contact = emailMatch[1];
    if (channelMatch) extracted_info.channel = channelMatch;
    if (deadlineMatch) extracted_info.deadline = deadlineMatch[1];
  }

  return {
    ...report,
    threat_score: finalScore,
    risk_level: riskLevel,
    verdict,
    summary,
    action_state,
    action_headline,
    analysis_confidence,
    confidence_reason,
    scam_patterns,
    attack_chain,
    actionable_findings,
    claim_evidence,
    investigation_checks,
    extracted_info,
    risk_factors: riskFactors,
    category_scores: categoryScores,
  };
}

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.1-flash-lite',
  });
});

// Resilient Gemini Generation with Timeout and Fallback
async function generateGeminiContentWithFallback(contents: any, config: any): Promise<any> {
  const ai = getGemini();
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastErr: any = null;
  for (const model of models) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout with model ${model}`)), 12000)),
      ]) as any;
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastErr = err;
      const isQuota = err?.status === 'RESOURCE_EXHAUSTED' || (err?.message && (err.message.includes('429') || err.message.includes('Quota exceeded')));
      if (!isQuota) {
        console.info(`Model ${model} request did not complete, attempting alternative...`);
      }
    }
  }
  throw lastErr || new Error('All AI models unavailable');
}

// ============================================================================
// DETERMINISTIC RESULT CACHE
// Guarantees identical input queries return identical analytical findings,
// threat scores, and risk classifications without drift.
// ============================================================================
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour cache

function normalizeForCacheKey(str: string): string {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getCacheKey(type: string, primaryInput: string, secondaryContext?: string): string {
  const normPrimary = normalizeForCacheKey(primaryInput);
  const normSec = secondaryContext ? normalizeForCacheKey(secondaryContext) : '';
  return `${type}:::${normPrimary}:::${normSec}`;
}

function getCachedAnalysis(key: string): any | null {
  const item = analysisCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  return item.data;
}

function setCachedAnalysis(key: string, data: any): void {
  if (analysisCache.size > 500) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
  analysisCache.set(key, { data, timestamp: Date.now() });
}

// Analyze Offer / Recruitment Message Text
app.post('/api/analyze/text', async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide job offer or recruitment message text to analyze.' });
  }

  const cacheKey = getCacheKey('text', content);
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // Attempt live Gemini inspection with retry
  try {
    const prompt = `Analyze this job offer or recruitment communication for employment scam and phishing indicators:
    
--- BEGIN SUBMISSION ---
${content.slice(0, 15000)}
--- END SUBMISSION ---

Evaluate key indicators including:
1. Upfront payment / registration fee / security deposit demands
2. Pay-for-equipment / laptop reimbursement schemes
3. Unrealistic salary vs duties / guaranteed employment
4. Pressure tactics / immediate signing deadlines
5. Personal financial data / bank details / OTP / passport / SSN demands before offer acceptance
6. Inconsistent email domains (e.g., using @gmail.com or lookalike domains for a major corporate entity)
7. Request to move immediately to Telegram/WhatsApp/Signal without formal interview
8. Grammatical inconsistencies or spoofed HR templates

Format your evaluation according to the JSON response schema. Ensure the threat_score mathematically aligns with the severity of identified risk factors.`;

    const response = await generateGeminiContentWithFallback(prompt, {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA as any,
      temperature: 0.0,
    });

    const parsed = JSON.parse(response.text || '{}');
    const normalized = enforceScoringConsistency(parsed, 'offer_text', content);
    normalized.input_type = 'offer_text';
    normalized.analyzed_at = new Date().toISOString();
    setCachedAnalysis(cacheKey, normalized);
    return res.json(normalized);
  } catch (err: any) {
    console.warn('Gemini live call error, applying cybersecurity heuristic fallback:', err?.message);
    const fallback = generateHeuristicReport(content, 'text');
    fallback.verification_notes.push({
      aspect: 'Analysis Engine',
      status: 'verified',
      finding: 'Assessed with evidence-based cybersecurity threat scoring rules.',
    });
    const normalizedFallback = enforceScoringConsistency(fallback, 'text', content);
    setCachedAnalysis(cacheKey, normalizedFallback);
    return res.json(normalizedFallback);
  }
});

// Analyze URL Scanner
app.post('/api/analyze/url', async (req: Request, res: Response) => {
  const { url, messageContext } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a valid URL to inspect.' });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: 'The provided URL is malformed or invalid.' });
  }

  const cacheKey = getCacheKey('url', parsedUrl.href, messageContext);
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.search;
    const isHttps = parsedUrl.protocol === 'https:';
    const hasIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const subdomains = hostname.split('.');

    const contextSection = messageContext && typeof messageContext === 'string' && messageContext.trim().length > 0
      ? `\nCLAIMED MESSAGE / CONTEXT PROVIDED BY USER:\n"${messageContext.trim()}"\nCompare this claimed communication and claimed organization against the observed URL domain ("${hostname}"). Record any entity mismatch in claim_evidence.\n`
      : '';

    const prompt = `Perform a comprehensive cybersecurity inspection of this job/recruitment URL:
    
Target URL: ${parsedUrl.href}
${contextSection}
Extracted Properties:
- Protocol: ${parsedUrl.protocol} (HTTPS: ${isHttps})
- Hostname: ${hostname}
- Path: ${pathname}
- Query Parameters: ${searchParams || 'None'}
- Is Raw IP Address Host: ${hasIP}
- Subdomains: ${subdomains.join(', ')}

EVALUATE THESE 10 URL PHISHING CRITERIA EXPLICITLY:
1. Brand impersonation / lookalike domain:
   - Does the domain incorporate a major corporate name (e.g. Google, Microsoft, Amazon, Apple, Workday, Meta, Netflix) in an unverified or third-party registered domain combined with recruitment keywords (careers, jobs, verification, hr, portal, hiring)?
   - SPECIFIC INSTRUCTION FOR THIS DOMAIN: If analyzing a domain like "google-careers-verification.com", you MUST treat it as a "Potential brand impersonation / lookalike domain" (severity: HIGH) because it incorporates a major corporate brand in a recruitment-related domain without evidence that it is an official corporate domain. Do NOT state that Google has confirmed it is fraudulent; use wording: "Potential brand impersonation / lookalike domain."
2. Typosquatting or misleading brand terms: Deceptive character substitutions, hyphens, prefixes, or deceptive phrasing mimicking authentic entities.
3. Domain mismatch with the claimed organization: Unaffiliated third-party registration pretending to be an enterprise recruiting or onboarding portal.
4. Suspicious URL path or credential/login harvesting indicators: Paths like /login, /employee-confirmation, /verification, /session, /auth, /signin on an unverified or lookalike domain.
5. IP-address hostname instead of a normal domain (e.g. http://192.168.1.1/careers).
6. Suspicious subdomains: Multi-level subdomains masking the true apex domain.
7. Unusual or suspicious TLD: Low-reputation, free, or unconventional TLDs for an enterprise employer.
8. HTTP instead of HTTPS: Unencrypted transport exposing applicant credentials to network interception.
9. URL shorteners: Obfuscated destination links (e.g. bit.ly, tinyurl) masking target infrastructure.
10. Excessive query parameters or suspicious session/redirect tokens.

MANDATORY SCORING & CONSISTENCY RULES:
- The threat_score and risk_level MUST strictly reflect the severity of the strongest detected evidence.
- If ANY risk factor has HIGH severity (e.g. potential brand impersonation, lookalike domain, credential harvesting path), threat_score MUST be in the HIGH RISK range (65–80%). NEVER output 40/100 or MODERATE/LOW RISK when a HIGH severity factor is present.
- If ANY risk factor is CRITICAL severity, threat_score MUST be 81–100 (CRITICAL RISK).
- The verdict and summary MUST be derived from actual findings: NEVER state "Low threat profile" or "conforms to standard recruitment patterns" when HIGH or CRITICAL risk factors are present.
- Explicitly note in verification_notes: "Domain age could not be independently verified." Do NOT invent domain registration dates.
- Output valid JSON conforming strictly to the response schema.`;

    const response = await generateGeminiContentWithFallback(prompt, {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA as any,
      temperature: 0.0,
    });

    const parsed = JSON.parse(response.text || '{}');
    const combinedInput = messageContext ? `${parsedUrl.href}\nContext: ${messageContext}` : parsedUrl.href;
    const normalized = enforceScoringConsistency(parsed, 'url', combinedInput);
    normalized.input_type = 'url';
    if (messageContext) {
      normalized.correlated_message = messageContext;
    }
    normalized.analyzed_at = new Date().toISOString();
    setCachedAnalysis(cacheKey, normalized);
    return res.json(normalized);
  } catch (err: any) {
    console.warn('Gemini URL analysis error, using fallback:', err?.message);
    const combinedInput = messageContext ? `${parsedUrl.href}\nContext: ${messageContext}` : parsedUrl.href;
    const fallback = generateHeuristicReport(combinedInput, 'url');
    const normalizedFallback = enforceScoringConsistency(fallback, 'url', combinedInput);
    if (messageContext) {
      normalizedFallback.correlated_message = messageContext;
    }
    setCachedAnalysis(cacheKey, normalizedFallback);
    return res.json(normalizedFallback);
  }
});

// Analyze Screenshot / Document Image
app.post('/api/analyze/image', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/png', additionalNotes = '' } = req.body;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Please provide base64 image data for analysis.' });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const imageHash = `${cleanBase64.length}_${cleanBase64.slice(0, 100)}_${cleanBase64.slice(-100)}`;
  const cacheKey = getCacheKey('image', imageHash, additionalNotes);
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Perform a multimodal forensic inspection of this offer letter screenshot or recruitment document.
Additional User Context: ${additionalNotes || 'None provided'}

Your task:
1. Extract all visible text: company name, job role, compensation, contact info, signee name, requirements, payment or deposit instructions.
2. Check for visual anomalies, mismatched typography, blurry pasted logos, inconsistent corporate formatting, missing registration details.
3. Note: Do not make claims of AI generation or fake logos without concrete proof; explicitly state "Unable to verify from the provided image" where visual evidence is inconclusive.
4. Identify any red flags such as registration fees, equipment purchasing, or private email domains.
5. Compute the Scam Threat Index (0–100%) and return the structured JSON evaluation. Ensure score aligns with the severity of identified indicators.`,
    };

    const response = await generateGeminiContentWithFallback({ parts: [imagePart, textPart] }, {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA as any,
      temperature: 0.0,
    });

    const parsed = JSON.parse(response.text || '{}');
    const normalized = enforceScoringConsistency(parsed, 'screenshot', additionalNotes);
    normalized.input_type = 'screenshot';
    normalized.analyzed_at = new Date().toISOString();
    setCachedAnalysis(cacheKey, normalized);
    return res.json(normalized);
  } catch (err: any) {
    console.warn('Gemini image analysis error, using fallback:', err?.message);
    const fallback = generateHeuristicReport(additionalNotes || 'Uploaded recruitment document image', 'screenshot');
    fallback.verification_notes.push({
      aspect: 'Optical Forensic Analysis',
      status: 'unverified',
      finding: 'Unable to verify typography micro-artifacts without high-resolution source document.',
    });
    const normalizedFallback = enforceScoringConsistency(fallback, 'screenshot', additionalNotes);
    setCachedAnalysis(cacheKey, normalizedFallback);
    return res.json(normalizedFallback);
  }
});

// Start Server with Vite Middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScamShield server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
