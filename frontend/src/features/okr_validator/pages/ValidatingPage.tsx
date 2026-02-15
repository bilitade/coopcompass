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
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          AI Validation in Progress
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Analyzing your OKRs using advanced AI frameworks for comprehensive evaluation
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {displayStep} of {validationSteps.length}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 transition-all duration-500 ease-out"
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
                    ? 'bg-green-500 text-white'
                    : index + 1 === displayStep
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index + 1 < displayStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center max-w-20">
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Details */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {displayStep <= validationSteps.length ? (
              <div className="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                {displayStep < validationSteps.length ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Check className="w-6 h-6 text-white" />
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {displayStep <= validationSteps.length 
                ? validationSteps[displayStep - 1]?.name || 'Processing Validation...'
                : 'Validation Complete'
              }
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
