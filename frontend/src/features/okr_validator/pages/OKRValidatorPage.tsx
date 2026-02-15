import React, { useState } from 'react';
import { Target, XCircle, Loader2, BarChart3, Clock } from 'lucide-react';
import { Layout } from '../../../shared/components/Layout';
import ValidatingPage from './ValidatingPage';
import ImprovingPage from './ImprovingPage';
import ValidationResultsPage from './ValidationResultsPage';
import CorrectionResultsPage from './CorrectionResultsPage';
import { validateOKRStream, correctOKRStream } from '../services/api';
import type { ValidateOKRResponse, CorrectOKRResponse, ProgressEvent } from '../types';

const examples = {
  best: `O1: Transform MSME banking to achieve 30% loan book share and empower 50,000 businesses by Q4
KR1: Grow MSME loan portfolio from Birr 12B to Birr 18B by quarter-end (lagging)
KR2: Increase MSME customer NPS from 45 to 70 through streamlined digital onboarding by Q4 (leading)
KR3: Reduce MSME loan processing time from 7 days to 2 days via automated credit scoring by Q4 (leading)
KR4: Achieve NPF ratio below 3% for MSME portfolio through enhanced risk management by quarter-end (lagging)`,

  bad: `O1: Improve our banking services and customer satisfaction
KR1: Conduct customer satisfaction surveys
KR2: Launch new digital features
KR3: Complete staff training programs
KR4: Increase revenue`
};

type PageState = 'input' | 'validating' | 'validation-results' | 'correcting' | 'correction-results';

export const OKRValidatorPage: React.FC = () => {
  const [okrText, setOkrText] = useState('');
  const [cycle, setCycle] = useState('');
  const [pageState, setPageState] = useState<PageState>('input');
  const [validationData, setValidationData] = useState<ValidateOKRResponse | null>(null);
  const [correctionData, setCorrectionData] = useState<CorrectOKRResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationSteps] = useState([
    { id: 1, name: 'Extract OKR', icon: 'FileText' },
    { id: 2, name: 'Validate Objectives', icon: 'CheckSquare' },
    { id: 3, name: 'Validate Key Results', icon: 'Target' },
    { id: 4, name: 'OKR Alignment', icon: 'BarChart3' },
    { id: 5, name: 'Strategic Alignment', icon: 'TrendingUp' }
  ]);

  const [correctionSteps] = useState([
    { id: 1, name: 'Correct OKR', icon: 'CheckSquare' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

  const handleValidate = async () => {
    if (!okrText.trim()) {
      setError('Please enter an OKR to validate');
      return;
    }

    setError(null);
    setPageState('validating');
    setCurrentStep(0); // Start at 0, will update when first event arrives

    try {
      const request = {
        okr_text: okrText.trim(),
        strategic_pillar: '',
        cycle: cycle
      };

      // Use streaming validation for better UX
      const result = await validateOKRStream(request, (event) => {
        console.log('Progress event received:', {
          event_type: event.event_type,
          step_number: event.step_number,
          step_name: event.step_name,
          message: event.message,
          total_steps: event.total_steps,
          full_event: event
        });
        setProgress(event);
        
        // Always update step based on step_number from event, regardless of event type
        // This ensures we show progress even if event types are unexpected
        if (event.step_number !== undefined && event.step_number > 0) {
          const displayStep = Math.max(1, Math.min(event.step_number, validationSteps.length));
          setCurrentStep(displayStep);
          console.log(`[UI] Updated to step ${displayStep} (from event step_number: ${event.step_number}, type: ${event.event_type})`);
        }
        
        // Additional handling for specific event types
        if (event.event_type === 'step_start') {
          console.log(`[UI] Step ${event.step_number} started: ${event.step_name}`);
        } else if (event.event_type === 'step_complete') {
          // When a step completes, show the next step (if not the last one)
          const currentStepNum = event.step_number;
          const nextStep = currentStepNum < validationSteps.length 
            ? currentStepNum + 1 
            : validationSteps.length;
          setCurrentStep(nextStep);
          console.log(`[UI] Step ${currentStepNum} completed: ${event.step_name}, moving to step ${nextStep}`);
        } else if (event.event_type === 'step_error') {
          setError(`Error in ${event.step_name}: ${event.error}`);
          console.error(`[UI] Step error: ${event.step_name} - ${event.error}`);
        } else if (event.event_type === 'complete') {
          // Show all steps as complete
          setCurrentStep(validationSteps.length);
          console.log('[UI] Validation completed - showing final step');
        }
      });

      setValidationData(result);
      setPageState('validation-results');
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate OKR. Please try again.');
      setPageState('input');
    }
  };

  const handleImprove = async () => {
    if (!validationData) return;

    setError(null);
    setPageState('correcting');
    setCurrentStep(1); // Start at step 1 for display

    try {
      const request = {
        okr_data: validationData.okr_data,
        failure_contract: validationData.failure_contract,
        validation_scores: validationData.validation_scores,
        _backend_response: validationData._backend_response
      };

      // Use streaming correction for better UX
      const result = await correctOKRStream(request, (event) => {
        console.log('Correction progress event:', event);
        setProgress(event);
        
        // Update step immediately based on event type and step number
        if (event.event_type === 'step_start') {
          // When a step starts, show that step
          const displayStep = Math.max(1, Math.min(event.step_number, correctionSteps.length));
          setCurrentStep(displayStep);
          console.log(`Starting correction step ${displayStep}: ${event.step_name}`);
        } else if (event.event_type === 'step_complete') {
          // When a step completes, show it as complete
          setCurrentStep(correctionSteps.length);
          console.log(`Completed correction step ${event.step_number}: ${event.step_name}`);
        } else if (event.event_type === 'progress') {
          // For progress events, update to the current step number
          const displayStep = Math.max(1, Math.min(event.step_number, correctionSteps.length));
          setCurrentStep(displayStep);
        } else if (event.event_type === 'step_error') {
          setError(`Error in ${event.step_name}: ${event.error}`);
          console.error(`Correction step error: ${event.step_name} - ${event.error}`);
        } else if (event.event_type === 'complete') {
          // Show all steps as complete
          setCurrentStep(correctionSteps.length);
          console.log('Correction completed');
        }
      });

      setCorrectionData(result);
      setPageState('correction-results');
    } catch (err) {
      console.error('Correction error:', err);
      setError('Failed to improve OKR. Please try again.');
      setPageState('validation-results');
    }
  };

  const handleDownloadReport = () => {
    // PDF generation would be implemented here
    alert('PDF download functionality would be implemented here');
  };

  const handleUseImprovedOKR = (improvedOKRText: string) => {
    setOkrText(improvedOKRText);
    setPageState('input');
    setValidationData(null);
    setCorrectionData(null);
  };

  const handleReset = () => {
    setPageState('input');
    setValidationData(null);
    setCorrectionData(null);
    setError(null);
    setProgress(null);
    setCurrentStep(0);
  };

  const loadExample = (example: string) => {
    setOkrText(example);
  };

  const hasValidContent = okrText.trim().length > 10;
  const wordCount = okrText.trim().split(/\s+/).filter(word => word.length > 0).length;

  const renderContent = () => {
    switch (pageState) {
      case 'input':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                Validate Your <span className="text-cyan-500">OKRs</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                Get instant AI-powered feedback on your Objectives and Key Results
              </p>
            </div>

            {/* OKR Input Component */}
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 space-y-4 transition-all duration-300">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      OKR Cycle
                    </label>
                    <input
                      type="text"
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value)}
                      placeholder="e.g., Q1 FY25"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Objectives & Key Results
                  </label>
                  <div className="relative">
                    <textarea
                      value={okrText}
                      onChange={(e) => setOkrText(e.target.value)}
                      placeholder={`Describe your OKRs in natural language. For example:

"I want to become the most trusted digital bank in Ethiopia this quarter by increasing our NPS from 45 to 70, reducing complaint resolution time from 48 to 24 hours, and launching our mobile app with 4.5+ stars."

The AI will automatically extract and structure your objectives and key results.`}
                      className="w-full min-h-[200px] px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all outline-none resize-y font-mono text-xs leading-relaxed text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <div className="absolute bottom-3 right-3 flex space-x-3 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                       <span>{wordCount} words</span>
                       <span>{okrText.length} chars</span>
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Quick Start Templates</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Click to autofill</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => loadExample(examples.best)}
                        className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-all font-medium text-[11px] border border-green-300 dark:border-green-600"
                        title="Load a strong OKR example written in natural language"
                      >
                        Best Example
                      </button>
                      <button
                        onClick={() => loadExample(examples.bad)}
                        className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-all font-medium text-[11px] border border-red-300 dark:border-red-600"
                        title="Load a weak OKR example to see what to avoid"
                      >
                        Bad Example
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleValidate}
                      disabled={!hasValidContent}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl text-sm"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Validate My OKRs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Clear Objective
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Describe what you want to achieve
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Measurable KRs
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Include numbers and percentages
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Time-bound
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set clear deadlines
                </p>
              </div>
            </div>
          </div>
        );

      case 'validating':
        return (
          <ValidatingPage 
            validationSteps={validationSteps} 
            currentStep={currentStep} 
          />
        );

      case 'correcting':
        return (
          <ImprovingPage 
            correctionSteps={correctionSteps} 
            currentStep={currentStep} 
          />
        );

      case 'validation-results':
        return validationData ? (
          <ValidationResultsPage
            validationData={validationData}
            onImprove={handleImprove}
            onDownloadDetailAnalysis={handleDownloadReport}
          />
        ) : null;

      case 'correction-results':
        return correctionData ? (
          <CorrectionResultsPage
            correctionData={correctionData}
            onDownloadReport={handleDownloadReport}
            onUseImprovedOKR={handleUseImprovedOKR}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto pt-8 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(pageState === 'validating' || pageState === 'correcting') && progress && (
          <div className="max-w-4xl mx-auto pt-8 px-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {progress.message || progress.step_name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Navigation Actions */}
        {pageState !== 'input' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
