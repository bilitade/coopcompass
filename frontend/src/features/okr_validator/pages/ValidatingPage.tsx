import React from 'react';
import { RefreshCw, Check, Loader2 } from 'lucide-react';

interface ValidationStep {
  id: number;
  name: string;
  icon: string;
}

interface ValidatingPageProps {
  validationSteps: ValidationStep[];
  currentStep: number;
}

const ValidatingPage: React.FC<ValidatingPageProps> = ({ validationSteps, currentStep }) => {
  // Ensure currentStep is at least 1 for display
  const displayStep = Math.max(1, currentStep);
  const progressPercentage = (displayStep / validationSteps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          AI Validation in Progress
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Analyzing your OKRs using advanced AI frameworks for comprehensive evaluation
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-secondary">
            Step {displayStep} of {validationSteps.length}
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
        <div className="flex justify-between mb-6">
          {validationSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index + 1 < currentStep ? 'opacity-100' : 
                index + 1 === currentStep ? 'opacity-100 scale-110' : 
                'opacity-50'
              } transition-all duration-300`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  index + 1 < displayStep
                    ? 'bg-emerald-500 text-white'
                    : index + 1 === displayStep
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-surface-hover text-text-secondary'
                }`}
              >
                {index + 1 < displayStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-text-secondary mt-2 text-center max-w-20">
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
            {displayStep <= validationSteps.length ? (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                {displayStep < validationSteps.length ? (
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
              {displayStep <= validationSteps.length 
                ? validationSteps[displayStep - 1]?.name || 'Processing Validation...'
                : 'Validation Complete'
              }
            </h3>
            <p className="text-sm text-text-secondary">
              {displayStep <= validationSteps.length 
                ? displayStep < validationSteps.length 
                  ? `Processing ${validationSteps[displayStep - 1]?.name?.toLowerCase() || 'validation step'}...`
                  : 'Finalizing validation results...'
                : 'All validation steps completed successfully'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatingPage;
