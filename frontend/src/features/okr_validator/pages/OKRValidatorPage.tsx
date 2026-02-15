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
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Validate Your <span className="text-primary">OKRs</span>
              </h1>
              <p className="text-text-secondary text-sm">
                Get instant AI-powered feedback on your Objectives and Key Results
              </p>
            </div>

            {/* OKR Input Component */}
            <div className="mb-4">
              <div className="card space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="label">
                      OKR Cycle
                    </label>
                    <input
                      type="text"
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value)}
                      placeholder="e.g., Q1 FY25"
                      className="input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label">
                    Objectives & Key Results
                  </label>
                  <div className="relative">
                    <textarea
                      value={okrText}
                      onChange={(e) => setOkrText(e.target.value)}
                      placeholder={`Describe your OKRs in natural language. For example:

"I want to become the most trusted digital bank in Ethiopia this quarter by increasing our NPS from 45 to 70, reducing complaint resolution time from 48 to 24 hours, and launching our mobile app with 4.5+ stars."

The AI will automatically extract and structure your objectives and key results.`}
                      className="w-full min-h-[160px] px-3 py-2 bg-surface text-text-primary border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none resize-y font-mono text-xs leading-relaxed placeholder:text-text-secondary/50"
                    />
                    <div className="absolute bottom-2 right-2 flex space-x-2 text-[10px] font-medium text-text-secondary">
                       <span>{wordCount} words</span>
                       <span>{okrText.length} chars</span>
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div className="bg-surface-hover rounded-lg p-2 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-text-primary">Quick Start Templates</span>
                      <span className="text-[9px] text-text-secondary">Click to autofill</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => loadExample(examples.best)}
                        className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all font-medium text-[10px] border border-emerald-200 dark:border-emerald-800"
                        title="Load a strong OKR example written in natural language"
                      >
                        Best Example
                      </button>
                      <button
                        onClick={() => loadExample(examples.bad)}
                        className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-all font-medium text-[10px] border border-red-200 dark:border-red-800"
                        title="Load a weak OKR example to see what to avoid"
                      >
                        Bad Example
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleValidate}
                      disabled={!hasValidContent}
                      className="btn btn-primary w-full py-2 text-sm"
                    >
                      <Target className="w-4 h-4" />
                      Validate My OKRs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="card text-center p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Clear Objective
                </h4>
                <p className="text-xs text-text-secondary">
                  Describe what you want to achieve
                </p>
              </div>

              <div className="card text-center p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Measurable KRs
                </h4>
                <p className="text-xs text-text-secondary">
                  Include numbers and percentages
                </p>
              </div>

              <div className="card text-center p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Time-bound
                </h4>
                <p className="text-xs text-text-secondary">
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
      <div className="min-h-screen bg-background">
        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto pt-4 px-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(pageState === 'validating' || pageState === 'correcting') && progress && (
          <div className="max-w-4xl mx-auto pt-4 px-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">
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
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="text-center">
              <button
                onClick={handleReset}
                className="btn btn-ghost text-sm"
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
