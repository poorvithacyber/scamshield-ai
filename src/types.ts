export type RiskLevel =
  | 'LOW RISK'
  | 'MODERATE RISK'
  | 'ELEVATED RISK'
  | 'HIGH RISK'
  | 'CRITICAL RISK'
  | 'INSUFFICIENT EVIDENCE';

export type ActionState = 'STOP' | 'VERIFY FIRST' | 'LOW CONCERN';

export interface RiskFactor {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  explanation: string;
}

export interface ActionableFinding {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  why_it_matters: string;
  what_to_do: string;
}

export interface ScamPattern {
  pattern: string;
  reasons: string[];
}

export interface ClaimVsEvidence {
  claim: string;
  observed: string;
  assessment: string;
}

export interface InvestigationCheck {
  check: string;
  status: 'DETECTED' | 'NOT VERIFIED' | 'VERIFIED' | 'WARNING';
  detail: string;
}

export interface ExtractedInfo {
  company?: string;
  salary?: string;
  payment_required?: string;
  contact?: string;
  channel?: string;
  deadline?: string;
}

export interface PositiveSignal {
  indicator: string;
  detail: string;
}

export interface VerificationNote {
  aspect: string;
  status: 'verified' | 'unverified' | 'inconclusive' | 'warning';
  finding: string;
}

export interface CategoryScore {
  category: string;
  score: number; // 0 to 100
  weight: number; // weight percentage
  findingCount: number;
}

export interface ThreatAnalysisResult {
  threat_score: number; // 0 to 100
  risk_level: RiskLevel;
  verdict: string;
  summary: string;
  action_state?: ActionState;
  action_headline?: string;
  analysis_confidence?: 'High' | 'Medium' | 'Limited';
  confidence_reason?: string;
  scam_patterns?: ScamPattern[];
  attack_chain?: string[];
  actionable_findings?: ActionableFinding[];
  claim_evidence?: ClaimVsEvidence[];
  investigation_checks?: InvestigationCheck[];
  extracted_info?: ExtractedInfo;
  category_scores: CategoryScore[];
  risk_factors: RiskFactor[];
  positive_signals: PositiveSignal[];
  missing_information: string[];
  recommended_actions: string[];
  verification_notes: VerificationNote[];
  sources: string[];
  input_type: 'offer_text' | 'url' | 'screenshot';
  analyzed_at: string;
  correlated_message?: string;
}

