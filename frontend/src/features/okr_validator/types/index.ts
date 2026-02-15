// Type definitions for OKR Intelligence API responses

export interface KeyResult {
  id: string;
  text: string;
  deadline?: string;
}

export interface Objective {
  id: string;
  text: string;
  level?: string;
  key_results: KeyResult[];
}

export interface OKRData {
  objectives: Objective[];
}

// Backend-compatible types
export interface BackendOKR {
  level: "STRATEGIC" | "TACTICAL" | "OPERATIONAL";
  objective: string;
  key_results: string[];
  keyResults?: string[]; // Alternative field name from backend response
}

export interface DimensionFeedback {
  dimension: string;
  comment: string;
}

export interface ObjectiveRules {
  strategic: number;
  concrete: number;
  actionOriented: number;  // Backend sends camelCase
  action_oriented?: number; // Fallback
  linkedToPurpose: number; // Backend sends camelCase
  linked_to_purpose?: number; // Fallback
  emotionallyEngaging: number; // Backend sends camelCase
  emotionally_engaging?: number; // Fallback
  impactful: number;
  timeBound: number; // Backend sends camelCase
  time_bound?: number; // Fallback
  positiveFeedback: DimensionFeedback[]; // Backend sends camelCase
  positive_feedback?: DimensionFeedback[]; // Fallback
  suggestions: DimensionFeedback[];
}

// Helper function to normalize dimension names from camelCase to snake_case
export const normalizeDimensionName = (dimension: string): string => {
  const dimensionMap: Record<string, string> = {
    'actionOriented': 'action_oriented',
    'linkedToPurpose': 'linked_to_purpose',
    'emotionallyEngaging': 'emotionally_engaging',
    'timeBound': 'time_bound',
    'positiveFeedback': 'positive_feedback',
    'leadingLagging': 'leading_lagging',
    'realTimeTrackable': 'real_time_trackable'
  };
  return dimensionMap[dimension] || dimension;
};

// Helper function to normalize objective rules field names
export const normalizeObjectiveRules = (rules: any): ObjectiveRules => {
  return {
    strategic: rules.strategic || 0,
    concrete: rules.concrete || 0,
    actionOriented: rules.actionOriented || rules.action_oriented || 0,
    linkedToPurpose: rules.linkedToPurpose || rules.linked_to_purpose || 0,
    emotionallyEngaging: rules.emotionallyEngaging || rules.emotionally_engaging || 0,
    impactful: rules.impactful || 0,
    timeBound: rules.timeBound || rules.time_bound || 0,
    positiveFeedback: rules.positiveFeedback || rules.positive_feedback || [],
    suggestions: rules.suggestions || []
  };
};

// Helper function to normalize KR rules field names
export const normalizeKRRules = (rules: any): KRRules => {
  return {
    concrete: rules.concrete || 0,
    leadingLagging: rules.leadingLagging || rules.leading_lagging || 0,
    evaluated: rules.evaluated || 0,
    ambitious: rules.ambitious || 0,
    realTimeTrackable: rules.realTimeTrackable || rules.real_time_trackable || 0,
    positiveFeedback: rules.positiveFeedback || rules.positive_feedback || [],
    suggestions: rules.suggestions || []
  };
};

export interface KRRules {
  concrete: number;
  leadingLagging: number; // Backend sends camelCase
  leading_lagging?: number; // Fallback
  evaluated: number;
  ambitious: number;
  realTimeTrackable: number; // Backend sends camelCase
  real_time_trackable?: number; // Fallback
  positiveFeedback: DimensionFeedback[]; // Backend sends camelCase
  positive_feedback?: DimensionFeedback[]; // Fallback
  suggestions: DimensionFeedback[];
}

export interface AlignmentResult {
  strength: "Strong" | "Partial" | "Weak";
  score: number;
  positiveFeedback: DimensionFeedback[]; // Backend sends camelCase
  positive_feedback?: DimensionFeedback[]; // Fallback
  suggestions: DimensionFeedback[];
}

export interface StrategicContext {
  pillar: string;
  strength: "Strong" | "Partial" | "Weak";
  score: number;
  positiveFeedback: DimensionFeedback[]; // Backend sends camelCase
  positive_feedback?: DimensionFeedback[]; // Fallback
  suggestions: DimensionFeedback[];
  primaryPillar?: string; // Backend sends camelCase
  primary_pillar?: string; // Fallback
}

export interface ValidationReport {
  overallHealthScore: number; // Backend sends camelCase
  overall_health_score?: number; // Fallback
  decision: "PASS" | "FAIL" | "CONDITIONAL PASS";
  strategicContext: StrategicContext; // Backend sends camelCase
  strategic_context?: StrategicContext; // Fallback
  frameworkPerformance: any; // Backend sends camelCase
  framework_performance?: any; // Fallback
  improvementAreasCount: number; // Backend sends camelCase
  improvement_areas_count?: number; // Fallback
  objectiveAnalysis: any; // Backend sends camelCase
  objective_analysis?: any; // Fallback
  keyResultsAnalysis: any[]; // Backend sends camelCase
  key_results_analysis?: any[]; // Fallback
  okrAlignment?: any; // Backend sends camelCase
  okr_alignment?: any; // Fallback
  strategyAlignment?: any; // Backend sends camelCase
  strategy_alignment?: any; // Fallback
}

// Helper function to normalize validation report field names
export const normalizeValidationReport = (report: any): ValidationReport => {
  return {
    overallHealthScore: report.overallHealthScore || report.overall_health_score || 0,
    decision: report.decision || 'CONDITIONAL PASS',
    strategicContext: report.strategicContext || report.strategic_context || {
      pillar: 'General',
      strength: 'Partial',
      score: 0.5,
      positiveFeedback: [],
      suggestions: []
    },
    frameworkPerformance: report.frameworkPerformance || report.framework_performance || {},
    improvementAreasCount: report.improvementAreasCount || report.improvement_areas_count || 0,
    objectiveAnalysis: report.objectiveAnalysis || report.objective_analysis || {},
    keyResultsAnalysis: report.keyResultsAnalysis || report.key_results_analysis || [],
    okrAlignment: report.okrAlignment || report.okr_alignment,
    strategyAlignment: report.strategyAlignment || report.strategy_alignment
  };
};

// Frontend compatibility types
export interface DimensionScore {
  score: number;
  suggestion: string;
}

export interface StrategicPillarAlignment {
  primary_pillar: string;
  secondary_pillar?: string;
  alignment_strength: string; // Frontend field name
  strength?: string; // Backend field name (camelCase)
  score: number;
}

export interface KRValidation {
  concrete: DimensionScore;
  leading_lagging: DimensionScore;
  evaluated: DimensionScore;
  ambitious: DimensionScore;
  real_time_trackable: DimensionScore;
  is_task?: boolean;
  is_vanity?: boolean;
}

export interface ObjectiveValidation {
  strategic: DimensionScore;
  concrete: DimensionScore;
  action_oriented: DimensionScore;
  linked_to_purpose: DimensionScore;
  emotionally_engaging: DimensionScore;
  impactful: DimensionScore;
  time_bound: DimensionScore;
}

// ValidationScores structure: 
// { "O1": { strategic: {...}, ..., "K1": { concrete: {...}, ... }, "K2": {...} } }
export type ObjectiveValidationWithKRs = ObjectiveValidation & {
  [krId: string]: KRValidation | DimensionScore | any;
};

export type ValidationScores = {
  [objectiveId: string]: ObjectiveValidationWithKRs;
};

export interface FailedKR {
  objective_id: string;
  kr_id: string;
}

export interface FailureContract {
  failed_objectives: string[];
  failed_krs: FailedKR[];
  failure_reasons: { [key: string]: string[] };
}

export interface ValidateOKRRequest {
  okr_text: string;
  strategic_pillar?: string;
  cycle?: string;
}

export interface ValidateOKRResponse {
  okr_data: OKRData;
  validation_scores: ValidationScores;
  strategic_alignment?: StrategicPillarAlignment;
  failure_contract: FailureContract;
  overall_score: number;
  decision: string;
  report?: string;
  logs?: string[];
  framework_performance?: any; // Backend framework performance data
  objective_analysis?: any; // Backend objective analysis data
  key_results_analysis?: any[]; // Backend key results analysis data
  okr_alignment?: any; // Backend OKR alignment data
  strategy_alignment?: any; // Backend strategy alignment data
  _backend_response?: BackendValidateResponse; // Complete backend response for localStorage
}

export interface CorrectOKRRequest {
  okr_data: OKRData;
  failure_contract: FailureContract;
  validation_scores?: ValidationScores;
  _backend_response?: BackendValidateResponse; // Store backend validation response for correction
}

export interface CorrectOKRResponse {
  corrected_okr_data: OKRData;
  validation_scores: ValidationScores;
  strategic_alignment?: StrategicPillarAlignment;
  overall_score: number;
  decision: string;
  report?: string;
  logs?: string[];
  _backend_response?: BackendCorrectionResponse; // Complete backend response for localStorage
}

export interface ValidationStep {
  id: number;
  name: string;
  icon: string;
}

// Backend API Request/Response types
export interface BackendValidateRequest {
  raw_input: string;
}

export interface BackendValidateResponse {
  okr: BackendOKR;
  objectiveRules: ObjectiveRules;
  objective_rules?: ObjectiveRules; // Fallback field name
  krRules: KRRules[];
  kr_rules?: KRRules[]; // Fallback field name
  okrAlignment: AlignmentResult;
  okr_alignment?: AlignmentResult; // Fallback field name
  strategyAlignment: StrategicContext;
  strategy_alignment?: StrategicContext; // Fallback field name
  report: ValidationReport;
}

export interface BackendCorrectionRequest {
  okr: BackendOKR;
  report: ValidationReport;
}

export interface BackendCorrectionResponse {
  original_okr: BackendOKR;
  originalOkr?: BackendOKR; // Handle both camelCase and snake_case
  corrected_okr: BackendOKR;
  correctedOkr?: BackendOKR; // Handle both camelCase and snake_case
  correction_summary: string;
  correctionSummary?: string; // Handle both camelCase and snake_case
  improvement: { [entity: string]: string[] };
}

// Progress event types for streaming
export type ProgressEventType = 'step_start' | 'step_complete' | 'step_error' | 'progress' | 'complete';

export interface ProgressEvent {
  event_type: ProgressEventType;
  step_id: string;
  step_name: string;
  step_number: number;
  total_steps: number;
  message?: string;
  error?: string;
  data?: any;
}
