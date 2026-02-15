import React, { type RefObject } from 'react';
import { Target, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface DetailedAnalysisSectionProps {
  validationData: ValidateOKRResponse;
  detailAnalysisRef: RefObject<HTMLDivElement>;
}

const DetailedAnalysisSection: React.FC<DetailedAnalysisSectionProps> = ({
  validationData,
  detailAnalysisRef
}) => {
  // Extract backend data if available
  const backendData = validationData?._backend_response;
  const objectiveRules = backendData?.objectiveRules;
  const krRules = backendData?.krRules;
  const okr_alignment = backendData?.okrAlignment;
  const strategy_alignment = backendData?.strategyAlignment;
  
  // Dimension display mappings
  const dimensionDisplayNames: Record<string, string> = {
    'strategic': 'Strategic',
    'concrete': 'Concrete',
    'action_oriented': 'Action Oriented',
    'linked_to_purpose': 'Linked to Purpose',
    'emotionally_engaging': 'Emotionally Engaging',
    'impactful': 'Impactful',
    'time_bound': 'Time Bound',
    'leading_lagging': 'Leading / Lagging',
    'evaluated': 'Evaluated',
    'ambitious': 'Ambitious',
    'real_time_trackable': 'Real Time Trackable'
  };
  
  console.log('DetailedAnalysis backend data:', backendData);
  console.log('Objective rules:', objectiveRules);
  console.log('Objective suggestions:', objectiveRules?.suggestions);
  console.log('KR rules:', krRules);
  console.log('KR suggestions for first KR:', krRules?.[0]?.suggestions);
  console.log('OKR alignment:', okr_alignment);
  console.log('Strategy alignment:', strategy_alignment);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm dark:shadow-lg transition-all duration-300">
      <div ref={detailAnalysisRef}>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-medium">Detailed OKR Analysis</h2>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Comprehensive breakdown of all validation scores and improvement suggestions</p>
        </div>

        {/* Strategic Context */}
        {validationData?.strategic_alignment && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              Strategic Context
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6 border border-blue-200/50 dark:border-blue-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 block">Primary Pillar</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{validationData?.strategic_alignment.primary_pillar}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 block">Alignment Strength</span>
                  <span className={`text-lg font-bold ${(validationData?.strategic_alignment?.alignment_strength || validationData?.strategic_alignment?.strength) === 'Strong' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {validationData?.strategic_alignment?.alignment_strength || validationData?.strategic_alignment?.strength}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 block">Score Contribution</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round((validationData?.strategic_alignment.score || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Objectives Analysis */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Objectives Analysis (S.C.A.L.E.I.T Framework)
          </h3>
          <div className="space-y-8">
            {validationData?.okr_data?.objectives?.map((obj, objIdx) => {
              const objScores = validationData?.validation_scores?.[obj.id];
              return (
                <div key={obj.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  {/* Objective Header */}
                  <div className="mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-lg font-bold text-white">O{objIdx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {obj.text}
                          </h4>
                          {obj.level && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              obj.level === 'Strategic'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                : obj.level === 'Tactical'
                                ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                            }`}>
                              {obj.level}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          S.C.A.L.E.I.T Framework Assessment
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  {objScores && (
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Individual Criteria Scores
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(objScores).map(([dimension, data]: [string, any]) => {
                          if (typeof data === 'object' && 'score' in data) {
                            const score = data.score;
                            const suggestion = data.suggestion;
                            
                            console.log(`Objective dimension: ${dimension}, score: ${score}`);
                            console.log(`Available feedback dimensions:`, objectiveRules?.positiveFeedback?.map(f => f.dimension));
                            console.log(`Available suggestion dimensions:`, objectiveRules?.suggestions?.map(s => s.dimension));
                            
                            return (
                              <div key={dimension} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                    {dimensionDisplayNames[dimension] || dimension.replace('_', ' ')}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                      score >= 0.8 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                                      score >= 0.6 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' :
                                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                                    }`}>
                                      {Math.round(score * 100)}%
                                    </span>
                                  </div>
                                </div>
                                {/* Add suggestions from backend objectiveRules - only show if score is less than 100% */}
                                {score < 1.0 && objectiveRules?.suggestions?.map((suggestion: any) => {
                                  const normalizedDimension = suggestion.dimension;
                                  return normalizedDimension === dimension ? (
                                    <div key={suggestion.dimension} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                        <div className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                          <span className="font-medium">Suggestion:</span> {suggestion.comment}
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                                {suggestion && score < 1.0 && !objectiveRules?.suggestions?.some((s: any) => s.dimension === dimension) && (
                                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                      <div className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                        <span className="font-medium">Suggestion:</span> {suggestion}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* Add positive feedback from backend objectiveRules - only show if score is 100% */}
                                {score >= 1.0 && objectiveRules?.positiveFeedback?.map((feedback: any) => {
                                  const normalizedDimension = feedback.dimension;
                                  return normalizedDimension === dimension ? (
                                    <div key={feedback.dimension} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-3 mt-2">
                                      <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <div className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                                          <span className="font-medium">Feedback:</span> {feedback.comment}
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Results Analysis */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Key Results Analysis (C.L.E.A.R Framework)
          </h3>
          <div className="space-y-8">
            {validationData?.okr_data?.objectives?.map((obj, objIdx) => (
              <div key={`kr-${obj.id}`} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-sm font-bold text-white">O{objIdx + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Objective {objIdx + 1}</h4>
                    <div className="text-sm text-gray-500">
                      Key Results Assessment
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {obj.key_results?.map((kr, krIdx) => {
                    const krScores = validationData?.validation_scores?.[obj.id]?.[kr.id];
                    return (
                      <div key={kr.id} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-600">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-sm font-bold text-white">KR{krIdx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-base text-gray-900 dark:text-white leading-relaxed font-medium">
                              {kr.text}
                            </p>
                            <div className="text-sm text-gray-500 mt-1">
                              C.L.E.A.R Framework Assessment
                            </div>
                          </div>
                        </div>

                        {krScores && (
                          <div className="space-y-4">
                            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              Individual Criteria Scores
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(krScores).map(([dimension, data]: [string, any]) => {
                                if (typeof data === 'object' && 'score' in data) {
                                  const score = data.score;
                                  const suggestion = data.suggestion;
                                  const isVanity = data.is_vanity;
                                  
                                  console.log(`KR dimension: ${dimension}, score: ${score}`);
                                  console.log(`Available KR feedback dimensions:`, krRules?.[krIdx]?.positiveFeedback?.map(f => f.dimension));
                                  console.log(`Available KR suggestion dimensions:`, krRules?.[krIdx]?.suggestions?.map(s => s.dimension));

                                  return (
                                    <div key={dimension} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                          {dimensionDisplayNames[dimension] || dimension.replace('_', ' ')}
                                          {isVanity && dimension === 'concrete' && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                        </span>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                          score >= 0.8 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                                          score >= 0.6 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' :
                                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                                        }`}>
                                          {Math.round(score * 100)}%
                                        </span>
                                      </div>
                                      {/* Add suggestions from backend krRules - only show if score is less than 100% */}
                                      {score < 1.0 && krRules?.[krIdx]?.suggestions?.map((suggestion: any) => {
                                        const normalizedDimension = suggestion.dimension;
                                        return normalizedDimension === dimension ? (
                                          <div key={suggestion.dimension} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                                            <div className="flex items-start gap-2">
                                              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                              <div className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                                <span className="font-medium">Suggestion:</span> {suggestion.comment}
                                              </div>
                                            </div>
                                          </div>
                                        ) : null;
                                      })}
                                      {suggestion && score < 1.0 && !krRules?.[krIdx]?.suggestions?.some((s: any) => s.dimension === dimension) && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                                          <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                            <div className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                              <span className="font-medium">Suggestion:</span> {suggestion}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {/* Add positive feedback from backend krRules - only show if score is 100% */}
                                      {score >= 1.0 && krRules?.[krIdx]?.positiveFeedback?.map((feedback: any) => {
                                        const normalizedDimension = feedback.dimension;
                                        return normalizedDimension === dimension ? (
                                          <div key={feedback.dimension} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-3 mt-2">
                                            <div className="flex items-start gap-2">
                                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                              <div className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                                                <span className="font-medium">Feedback:</span> {feedback.comment}
                                              </div>
                                            </div>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework Summary */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Framework Summary</h3>
          <div className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-300 mb-1">Objectives</div>
                <div className="text-lg font-bold text-cyan-400 dark:text-cyan-300">S.C.A.L.E.I.T</div>
                <div className="text-xs text-gray-400 mt-1">7 Dimensions - 40%</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-300 mb-1">Key Results</div>
                <div className="text-lg font-bold text-purple-400 dark:text-purple-300">C.L.E.A.R</div>
                <div className="text-xs text-gray-400 mt-1">5 Dimensions - 30%</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-300 mb-1">OKR</div>
                <div className="text-lg font-bold text-yellow-400 dark:text-yellow-300">Alignment</div>
                <div className="text-xs text-gray-400 mt-1">KR-Objective - 10%</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-300 mb-1">Strategy</div>
                <div className="text-lg font-bold text-blue-400 dark:text-blue-300">Alignment</div>
                <div className="text-xs text-gray-400 mt-1">Contextual - 20%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisSection;
