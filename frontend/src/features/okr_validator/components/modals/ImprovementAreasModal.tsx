import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Lightbulb } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface ImprovementAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationData: ValidateOKRResponse | null;
}

const ImprovementAreasModal: React.FC<ImprovementAreasModalProps> = ({
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl dark:shadow-2xl transition-all max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent dark:text-accent-foreground" />
                    Improvement Suggestions
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

                  {/* Suggestions Details */}
                  <div className="space-y-6 overflow-hidden flex flex-col">
                    <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-4 flex-shrink-0 border border-accent/200 dark:border-accent-700">
                      <h4 className="text-sm font-semibold text-accent-800 dark:text-accent-300 mb-3">Areas for Enhancement</h4>
                      <div className="text-xs text-accent-700 dark:text-accent-400 space-y-1">
                        <div>• Focused suggestions to strengthen your OKRs</div>
                        <div>• Implement these improvements for better clarity and measurability</div>
                        <div>• Based on framework analysis and best practices</div>
                      </div>
                    </div>

                    <div className="space-y-4 overflow-y-auto flex-1">
                      {/* Extract backend data */}
                      {(() => {
                        const backendData = validationData?._backend_response;
                        const objectiveRules = backendData?.objectiveRules;
                        const krRules = backendData?.krRules;
                        const okr_alignment = backendData?.okrAlignment;
                        const strategy_alignment = backendData?.strategyAlignment;

                        return (
                          <>
                            {/* Objective Suggestions */}
                            {objectiveRules?.suggestions && objectiveRules.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                  <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0" />
                                  Objective Enhancements
                                </h4>
                                <div className="space-y-3">
                                  {objectiveRules.suggestions.map((suggestion: any, idx: number) => (
                                    <div key={idx} className="border border-primary/200 dark:border-primary-700 rounded-lg p-4 bg-primary/10 dark:bg-primary/20">
                                      <div className="flex items-start gap-3">
                                        <Lightbulb className="w-4 h-4 text-primary dark:text-primary-foreground flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-1">
                                            {suggestion.dimension.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                          </div>
                                          <div className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                                            {suggestion.comment}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Key Results Suggestions */}
                            {krRules && krRules.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                  <div className="w-4 h-4 bg-accent rounded-full flex-shrink-0" />
                                  Key Results Improvements
                                </h4>
                                <div className="space-y-3">
                                  {krRules.map((kr: any, krIdx: number) => (
                                    <div key={krIdx}>
                                      <div className="text-sm font-medium text-accent-800 dark:text-accent-300 mb-2">
                                        Key Result {krIdx + 1}
                                      </div>
                                      {kr.suggestions && kr.suggestions.length > 0 && (
                                        <div className="space-y-2 ml-4">
                                          {kr.suggestions.map((suggestion: any, idx: number) => (
                                            <div key={idx} className="border border-accent/200 dark:border-accent-700 rounded-lg p-3 bg-accent/10 dark:bg-accent/20">
                                              <div className="flex items-start gap-2">
                                                <Lightbulb className="w-3 h-3 text-accent dark:text-accent-foreground flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                  <div className="text-xs font-medium text-accent-800 dark:text-accent-300 mb-1">
                                                    {suggestion.dimension.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                  </div>
                                                  <div className="text-xs text-accent-700 dark:text-accent-400 leading-relaxed">
                                                    {suggestion.comment}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* OKR Alignment Suggestions */}
                            {okr_alignment?.suggestions && okr_alignment.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                  <div className="w-4 h-4 bg-warning rounded-full flex-shrink-0" />
                                  OKR Alignment Enhancements
                                </h4>
                                <div className="space-y-3">
                                  {okr_alignment.suggestions.map((suggestion: any, idx: number) => (
                                    <div key={idx} className="border border-warning/200 dark:border-warning-700 rounded-lg p-4 bg-warning/10 dark:bg-warning/20">
                                      <div className="flex items-start gap-3">
                                        <Lightbulb className="w-4 h-4 text-warning dark:text-warning-foreground flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-xs text-warning-700 dark:text-warning-400 leading-relaxed">
                                            {suggestion.comment}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Strategy Alignment Suggestions */}
                            {strategy_alignment?.suggestions && strategy_alignment.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                  <div className="w-4 h-4 bg-info rounded-full flex-shrink-0" />
                                  Strategy Alignment Improvements
                                </h4>
                                <div className="space-y-3">
                                  {strategy_alignment.suggestions.map((suggestion: any, idx: number) => (
                                    <div key={idx} className="border border-info/200 dark:border-info-700 rounded-lg p-4 bg-info/10 dark:bg-info/20">
                                      <div className="flex items-start gap-3">
                                        <Lightbulb className="w-4 h-4 text-info dark:text-info-foreground flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-xs text-info-700 dark:text-info-400 leading-relaxed">
                                            {suggestion.comment}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
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

export default ImprovementAreasModal;
