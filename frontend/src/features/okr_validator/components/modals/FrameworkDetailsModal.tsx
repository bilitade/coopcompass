import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Calculator } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface FrameworkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationData: ValidateOKRResponse | null;
}

const FrameworkDetailsModal: React.FC<FrameworkDetailsModalProps> = ({
  isOpen,
  onClose,
  validationData
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl dark:shadow-2xl transition-all max-h-[95vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary dark:text-primary-foreground" />
                    Framework Performance Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                  {/* OKR Display */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-hidden flex flex-col border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex-shrink-0 font-medium">Your OKRs</h4>
                    <div className="space-y-4 overflow-y-auto flex-1">
                      {validationData?.okr_data?.objectives?.map((obj, objIdx) => (
                        <div key={obj.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary dark:text-primary-foreground">O{objIdx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{obj.text}</div>
                              {obj.level && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  obj.level === 'Strategic' ? 'bg-info/50 dark:bg-info/90/30 text-info-700 dark:text-info-300 border border-info/200 dark:border-info-700' :
                                  obj.level === 'Tactical' ? 'bg-primary/10 dark:bg-primary/20 text-primary-foreground border border-primary/200 dark:border-primary-700' :
                                  'bg-accent/10 dark:bg-accent/20 text-accent-foreground border border-accent/200 dark:border-accent-700'
                                }`}>
                                  {obj.level}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 ml-11">
                            {obj.key_results?.map((kr) => (
                              <div key={kr.id} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                                • {kr.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Framework Calculations */}
                  <div className="space-y-6 overflow-hidden flex flex-col">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 flex-shrink-0 border border-primary/200 dark:border-primary-700">
                      <h4 className="text-sm font-semibold text-primary dark:text-primary-foreground mb-3">Overall Scoring Formula</h4>
                      <div className="text-xs text-primary/70 dark:text-primary/400 space-y-1">
                        <div>• Total Score = S.C.A.L.E.I.T + C.L.E.A.R + OKR Alignment + Strategy Alignment</div>
                        <div>• S.C.A.L.E.I.T: Max 40 points (Objectives framework)</div>
                        <div>• C.L.E.A.R: Max 30 points (Key Results framework)</div>
                        <div>• OKR Alignment: Max 10 points (KR-Objective alignment)</div>
                        <div>• Strategy Alignment: Max 20 points (Strategic pillar alignment)</div>
                        <div>• Maximum possible score: 100 points</div>
                        <div>• Decision thresholds: PASS greater than or equal to 90, CONDITIONAL PASS greater than or equal to 80, FAIL less than 80</div>
                        <div>• Auto-fail conditions: No strategic alignment, invalid KR count, weak strategy alignment</div>
                      </div>
                    </div>

                    <div className="space-y-4 overflow-y-auto flex-1">
                      {(() => {
                        const detailedData: Array<{
                          framework: string,
                          totalScore: number,
                          maxScore: number,
                          percentage: number,
                          details: Array<{dimension: string, score: number, maxScore: number, percentage: number, objective?: string, krIndex?: number, isHeader?: boolean, krText?: string}>,
                          color: string
                        }> = [];

                        // S.C.A.L.E.I.T Details
                        if (validationData?.validation_scores) {
                          const objWeights = { strategic: 8, concrete: 6, action_oriented: 5, linked_to_purpose: 5, emotionally_engaging: 5, impactful: 6, time_bound: 5 };
                          const scaleitDetails: Array<{dimension: string, score: number, maxScore: number, percentage: number}> = [];
                          let totalScaleitScore = 0;

                          Object.values(validationData?.validation_scores).forEach(objData => {
                            if (typeof objData === 'object') {
                              Object.entries(objWeights).forEach(([dim, weight]) => {
                                const dimData = objData[dim];
                                if (dimData && typeof dimData === 'object' && 'score' in dimData) {
                                  const score = dimData.score || 0;
                                  const weightedScore = score * weight;
                                  totalScaleitScore += weightedScore;
                                  scaleitDetails.push({
                                    dimension: dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                    score: weightedScore,
                                    maxScore: weight,
                                    percentage: Math.round((weightedScore / weight) * 100)
                                  });
                                }
                              });
                            }
                          });

                          if (scaleitDetails.length > 0) {
                            detailedData.push({
                              framework: 'S.C.A.L.E.I.T (Objectives)',
                              totalScore: totalScaleitScore,
                              maxScore: 40,
                              percentage: Math.round((totalScaleitScore / 40) * 100),
                              details: scaleitDetails,
                              color: 'primary'
                            });
                          }
                        }

                        // C.L.E.A.R Details - Grouped by Objective and KR
                        if (validationData?.validation_scores && validationData?.okr_data?.objectives) {
                          const krWeights = { concrete: 10, leading_lagging: 8, evaluated: 8, ambitious: 7, real_time_trackable: 7 };
                          const clearDetails: Array<{dimension: string, score: number, maxScore: number, percentage: number, objective?: string, krIndex?: number, isHeader?: boolean, krText?: string}> = [];
                          let totalClearScore = 0;
                          let krCount = 0;

                          // Group KR scores by objective
                          validationData.okr_data.objectives.forEach((obj, objIdx) => {
                            const objData = validationData.validation_scores?.[obj.id];
                            if (objData && typeof objData === 'object') {
                              obj.key_results?.forEach((kr, krIdx) => {
                                const krData = objData[kr.id];
                                if (krData && typeof krData === 'object' && 'concrete' in krData) {
                                  let krScore = 0;

                                  // Add KR header
                                  clearDetails.push({
                                    dimension: `O${objIdx + 1}-KR${krIdx + 1}`,
                                    score: 0,
                                    maxScore: 0,
                                    percentage: 0,
                                    objective: `O${objIdx + 1}`,
                                    krIndex: krIdx + 1,
                                    isHeader: true,
                                    krText: kr.text
                                  });

                                  // Add dimension scores for this KR
                                  Object.entries(krWeights).forEach(([dim, weight]) => {
                                    const dimData = krData[dim];
                                    if (dimData && typeof dimData === 'object' && 'score' in dimData) {
                                      const score = dimData.score || 0;
                                      const weightedScore = score * weight;
                                      krScore += weightedScore;
                                      clearDetails.push({
                                        dimension: dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                        score: weightedScore,
                                        maxScore: weight,
                                        percentage: Math.round((weightedScore / weight) * 100),
                                        objective: `O${objIdx + 1}`,
                                        krIndex: krIdx + 1
                                      });
                                    }
                                  });

                                  if (krData.is_task) {
                                    krScore -= 5;
                                    clearDetails.push({
                                      dimension: 'Anti-pattern: Task',
                                      score: -5,
                                      maxScore: 0,
                                      percentage: 0,
                                      objective: `O${objIdx + 1}`,
                                      krIndex: krIdx + 1
                                    });
                                  }
                                  if (krData.is_vanity) {
                                    krScore -= 5;
                                    clearDetails.push({
                                      dimension: 'Anti-pattern: Vanity',
                                      score: -5,
                                      maxScore: 0,
                                      percentage: 0,
                                      objective: `O${objIdx + 1}`,
                                      krIndex: krIdx + 1
                                    });
                                  }

                                  totalClearScore += Math.max(0, krScore);
                                  krCount++;
                                }
                              });
                            }
                          });

                          if (clearDetails.length > 0 && krCount > 0) {
                            const avgClearScore = totalClearScore / krCount;
                            detailedData.push({
                              framework: 'C.L.E.A.R (Key Results)',
                              totalScore: avgClearScore,
                              maxScore: 40,
                              percentage: Math.round((avgClearScore / 40) * 100),
                              details: clearDetails,
                              color: 'accent'
                            });
                          }
                        }

                        // Strategic Details  
                        const strategicScore = (validationData?.strategic_alignment?.score || 0) * 20; // Convert 0-1 to 0-20
                        detailedData.push({
                          framework: 'Strategic Alignment',
                          totalScore: strategicScore,
                          maxScore: 20,
                          percentage: Math.round((validationData?.strategic_alignment?.score || 0) * 100),
                          details: [{
                            dimension: 'Strategic Alignment',
                            score: strategicScore,
                            maxScore: 20,
                            percentage: Math.round((validationData?.strategic_alignment?.score || 0) * 100)
                          }],
                          color: 'info'
                        });

                        // OKR Alignment Details
                        const backendData = validationData?._backend_response;
                        const okr_alignment = backendData?.okrAlignment;
                        const okrAlignmentScore = (okr_alignment?.score || 0) * 10; // Convert 0-1 to 0-10
                        detailedData.push({
                          framework: 'OKR Alignment',
                          totalScore: okrAlignmentScore,
                          maxScore: 10,
                          percentage: Math.round((okr_alignment?.score || 0) * 100),
                          details: [{
                            dimension: 'OKR Alignment',
                            score: okrAlignmentScore,
                            maxScore: 10,
                            percentage: Math.round((okr_alignment?.score || 0) * 100)
                          }],
                          color: 'warning'
                        });

                        return detailedData.map((item, index) => (
                          <div key={index} className={`border rounded-lg p-4 ${
                            item.color === 'primary' ? 'border-primary/200 dark:border-primary-700 bg-primary/10 dark:bg-primary/20' :
                            item.color === 'accent' ? 'border-accent/200 dark:border-accent-700 bg-accent/10 dark:bg-accent/20' :
                            item.color === 'warning' ? 'border-warning/200 dark:border-warning-700 bg-warning/10 dark:bg-warning/20' :
                            'border-info/200 dark:border-info-700 bg-info/10 dark:bg-info/20'
                          }`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-sm font-medium ${
                                item.color === 'primary' ? 'text-primary-800 dark:text-primary-300' :
                                item.color === 'accent' ? 'text-accent-800 dark:text-accent-300' :
                                item.color === 'warning' ? 'text-warning-800 dark:text-warning-300' :
                                'text-info-800 dark:text-info-300'
                              }`}>
                                {item.framework}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  item.percentage >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' :
                                  item.percentage >= 60 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                                }`}>
                                  {item.percentage}% ({Math.round(item.totalScore)}/{item.maxScore})
                                </span>
                                <span className={`text-xs font-medium ${
                                  item.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                                  item.color === 'accent' ? 'text-accent-600 dark:text-accent-400' :
                                  item.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
                                  'text-info-600 dark:text-info-400'
                                }`}>
                                  × {item.color === 'primary' ? '40pts' : item.color === 'accent' ? '30pts' : item.color === 'warning' ? '10pts' : '20pts'}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {item.details.map((detail, dIndex) => (
                                detail.isHeader ? (
                                  <div key={dIndex} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border-l-4 border-accent-500 dark:border-accent-400">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{detail.dimension}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate" title={detail.krText}>
                                      {detail.krText}
                                    </div>
                                  </div>
                                ) : (
                                  <div key={dIndex} className="flex justify-between items-center text-xs bg-white dark:bg-gray-700 rounded px-3 py-2 ml-4 border-l-2 border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-700 dark:text-gray-300">{detail.dimension}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                        detail.percentage >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                        detail.percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                      }`}>
                                        {detail.score >= 0 ? '+' : ''}{Math.round(detail.score)}
                                      </span>
                                      {detail.maxScore > 0 && (
                                        <span className="text-gray-500">/{detail.maxScore}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FrameworkDetailsModal;
