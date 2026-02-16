import React from 'react';
import { RefreshCw, Check, Loader2, Sparkles } from 'lucide-react';

interface CorrectionStep {
  id: number;
  name: string;
  icon: string;
}

interface ImprovingPageProps {
  correctionSteps: CorrectionStep[];
  currentStep: number;
}

const ImprovingPage: React.FC<ImprovingPageProps> = ({ correctionSteps, currentStep }) => {
  const progressPercentage = (currentStep / correctionSteps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          AI Improvement in Progress
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Enhancing your OKRs using AI-powered optimization for better clarity and impact
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-secondary">
            Step {currentStep} of {correctionSteps.length}
          </span>
          <span className="text-lg font-bold text-text-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-surface-hover rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-6">
          {correctionSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center mx-8 ${
                index + 1 < currentStep ? 'opacity-100' : 
                index + 1 === currentStep ? 'opacity-100 scale-110' : 
                'opacity-50'
              } transition-all duration-300`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index + 1 < currentStep
                    ? 'bg-emerald-500 text-white'
                    : index + 1 === currentStep
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-surface-hover text-text-secondary'
                }`}
              >
                {index + 1 < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs text-text-secondary mt-2 text-center max-w-24">
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Details */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {currentStep <= correctionSteps.length ? (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                {currentStep < correctionSteps.length ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Check className="w-6 h-6 text-white" />
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {currentStep <= correctionSteps.length 
                ? correctionSteps[currentStep - 1]?.name || 'Processing Improvement...'
                : 'Improvement Complete'
              }
            </h3>
            <p className="text-sm text-text-secondary">
              {currentStep <= correctionSteps.length 
                ? currentStep < correctionSteps.length 
                  ? `AI is ${correctionSteps[currentStep - 1]?.name?.toLowerCase() || 'improving your OKRs'}...`
                  : 'Finalizing improved OKRs...'
                : 'OKR improvement completed successfully'
              }
            </p>
          </div>
        </div>
        
        {/* Additional Progress Details */}
        {currentStep === 1 && currentStep <= correctionSteps.length && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                AI Analysis in Progress
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Our AI is analyzing your OKRs, identifying improvement opportunities, and generating enhanced versions for better clarity, measurability, and impact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovingPage;
