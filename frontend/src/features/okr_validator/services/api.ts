import axios from 'axios';
import type { 
  ValidateOKRRequest, 
  ValidateOKRResponse, 
  CorrectOKRRequest, 
  CorrectOKRResponse,
  BackendValidateRequest,
  BackendValidateResponse,
  BackendCorrectionRequest,
  BackendCorrectionResponse
} from '../types';
import { 
  normalizeObjectiveRules,
  normalizeKRRules,
  normalizeValidationReport
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

// Transformation functions
const transformValidateRequest = (frontendRequest: ValidateOKRRequest): BackendValidateRequest => ({
  raw_input: frontendRequest.okr_text
});

const transformValidateResponse = (backendResponse: BackendValidateResponse): ValidateOKRResponse => {
  const { okr, objectiveRules, objective_rules, krRules, kr_rules, strategyAlignment, strategy_alignment, report } = backendResponse;
  
  // Use normalized rules with proper fallback handling
  const objRules = normalizeObjectiveRules(objectiveRules || objective_rules);
  const krRulesList = (krRules || kr_rules || []).map(normalizeKRRules);
  const stratAlign = strategyAlignment || strategy_alignment;
  const normalizedReport = normalizeValidationReport(report);
  
  // Transform OKR data
  const okr_data = {
    objectives: [{
      id: 'O1',
      text: okr.objective,
      level: okr.level.toLowerCase(),
      key_results: (okr.keyResults || okr.key_results || []).map((kr: string, index: number) => ({
        id: `K${index + 1}`,
        text: kr
      }))
    }]
  };

  // Transform validation scores using normalized data
  const validation_scores: any = {
    'O1': {
      strategic: { score: objRules.strategic, suggestion: '' },
      concrete: { score: objRules.concrete, suggestion: '' },
      action_oriented: { score: objRules.actionOriented, suggestion: '' },
      linked_to_purpose: { score: objRules.linkedToPurpose, suggestion: '' },
      emotionally_engaging: { score: objRules.emotionallyEngaging, suggestion: '' },
      impactful: { score: objRules.impactful, suggestion: '' },
      time_bound: { score: objRules.timeBound, suggestion: '' }
    }
  };

  // Add KR validation scores
  krRulesList.forEach((krRule, index) => {
    const krId = `K${index + 1}`;
    validation_scores['O1'][krId] = {
      concrete: { score: krRule.concrete, suggestion: '' },
      leading_lagging: { score: krRule.leadingLagging, suggestion: '' },
      evaluated: { score: krRule.evaluated, suggestion: '' },
      ambitious: { score: krRule.ambitious, suggestion: '' },
      real_time_trackable: { score: krRule.realTimeTrackable, suggestion: '' }
    };
  });

  // Create failure contract (empty for now, would need actual failure logic)
  const failure_contract = {
    failed_objectives: [],
    failed_krs: [],
    failure_reasons: {}
  };

  // Transform strategic alignment
  const strategic_alignment = stratAlign ? {
    primary_pillar: stratAlign.pillar,
    alignment_strength: stratAlign.strength,
    score: stratAlign.score
  } : undefined;

  return {
    okr_data,
    validation_scores,
    strategic_alignment,
    failure_contract,
    overall_score: normalizedReport.overallHealthScore,
    decision: normalizedReport.decision,
    framework_performance: normalizedReport.frameworkPerformance,
    objective_analysis: normalizedReport.objectiveAnalysis,
    key_results_analysis: normalizedReport.keyResultsAnalysis,
    okr_alignment: normalizedReport.okrAlignment,
    strategy_alignment: normalizedReport.strategyAlignment,
    _backend_response: backendResponse
  };
};

const transformCorrectionRequest = (frontendRequest: CorrectOKRRequest): BackendCorrectionRequest => {
  const backendResponse = frontendRequest._backend_response as BackendValidateResponse;
  if (!backendResponse) {
    throw new Error('Backend validation response is required for correction');
  }

  return {
    okr: backendResponse.okr,
    report: backendResponse.report
  };
};

const transformCorrectionResponse = (backendResponse: BackendCorrectionResponse): CorrectOKRResponse => {
  const { corrected_okr, correctedOkr, correction_summary, correctionSummary } = backendResponse;
  
  const corrected = corrected_okr || correctedOkr;
  const summary = correction_summary || correctionSummary;

  // Transform corrected OKR data
  const corrected_okr_data = {
    objectives: [{
      id: 'O1',
      text: corrected.objective,
      level: corrected.level.toLowerCase(),
      key_results: (corrected.keyResults || corrected.key_results || []).map((kr: string, index: number) => ({
        id: `K${index + 1}`,
        text: kr
      }))
    }]
  };

  // For simplicity, create empty validation scores
  const validation_scores: any = {};

  return {
    corrected_okr_data,
    validation_scores,
    overall_score: 0, // Would need actual scoring logic
    decision: 'PASS', // Would need actual decision logic
    report: summary,
    _backend_response: backendResponse
  };
};

// API functions
export const validateOKR = async (request: ValidateOKRRequest): Promise<ValidateOKRResponse> => {
  try {
    const backendRequest = transformValidateRequest(request);
    const response = await axios.post(`${API_BASE_URL}/ai-engine/v1/validate`, backendRequest);
    return transformValidateResponse(response.data);
  } catch (error) {
    console.error('Error validating OKR:', error);
    throw error;
  }
};

export const validateOKRStream = async (
  request: ValidateOKRRequest,
  onProgress: (event: any) => void
): Promise<ValidateOKRResponse> => {
  try {
    const backendRequest = transformValidateRequest(request);
    
    const response = await fetch(`${API_BASE_URL}/ai-engine/v1/validate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: ValidateOKRResponse | null = null;

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Skip empty lines and keep-alive comments
        if (!line.trim() || line.trim().startsWith(':')) {
          continue;
        }
        
        if (line.startsWith('data: ')) {
          try {
            const jsonLine = line.slice(6); // Remove 'data: ' prefix
            const event = JSON.parse(jsonLine);
            
            console.log('[SSE] Received event:', {
              event_type: event.event_type,
              step_number: event.step_number,
              step_name: event.step_name,
              total_steps: event.total_steps
            });
            
            // Call progress callback immediately for real-time updates
            onProgress(event);
            
            // Store final result if this is a complete event
            if (event.event_type === 'complete' && event.data?.result) {
              finalResult = transformValidateResponse(event.data.result);
            }
          } catch (e) {
            console.warn('Failed to parse SSE line:', line, 'Error:', e);
          }
        }
      }
    }

    // Return final result from stream or fallback API call
    if (finalResult) {
      return finalResult;
    } else {
      console.warn('No final result from stream, making fallback API call');
      const fallbackResponse = await axios.post(`${API_BASE_URL}/ai-engine/v1/validate`, backendRequest);
      return transformValidateResponse(fallbackResponse.data);
    }
  } catch (error) {
    console.error('Error validating OKR stream:', error);
    throw error;
  }
};

export const correctOKR = async (request: CorrectOKRRequest): Promise<CorrectOKRResponse> => {
  try {
    const backendRequest = transformCorrectionRequest(request);
    const response = await axios.post(`${API_BASE_URL}/ai-engine/v1/correct`, backendRequest);
    return transformCorrectionResponse(response.data);
  } catch (error) {
    console.error('Error correcting OKR:', error);
    throw error;
  }
};

export const correctOKRStream = async (
  request: CorrectOKRRequest,
  onProgress: (event: any) => void
): Promise<CorrectOKRResponse> => {
  try {
    const backendRequest = transformCorrectionRequest(request);
    
    const response = await fetch(`${API_BASE_URL}/ai-engine/v1/correct/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: CorrectOKRResponse | null = null;

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Skip empty lines and keep-alive comments
        if (!line.trim() || line.trim().startsWith(':')) {
          continue;
        }
        
        if (line.startsWith('data: ')) {
          try {
            const jsonLine = line.slice(6); // Remove 'data: ' prefix
            const event = JSON.parse(jsonLine);
            
            // Call progress callback immediately for real-time updates
            onProgress(event);
            
            // Store final result if this is a complete event
            if (event.event_type === 'complete' && event.data?.result) {
              finalResult = transformCorrectionResponse(event.data.result);
            }
          } catch (e) {
            console.warn('Failed to parse SSE correction line:', line, 'Error:', e);
          }
        }
      }
    }

    // Return final result from stream or fallback API call
    if (finalResult) {
      return finalResult;
    } else {
      console.warn('No final result from stream, making fallback API call');
      const fallbackResponse = await axios.post(`${API_BASE_URL}/ai-engine/v1/correct`, backendRequest);
      return transformCorrectionResponse(fallbackResponse.data);
    }
  } catch (error) {
    console.error('Error correcting OKR stream:', error);
    throw error;
  }
};
