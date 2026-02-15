import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface ImprovementAreasCardProps {
  validationData: ValidateOKRResponse;
  onOpenModal: () => void;
}

const ImprovementAreasCard: React.FC<ImprovementAreasCardProps> = ({ validationData, onOpenModal }) => {
  // Get actual improvement areas from backend data
  const backendData = validationData?._backend_response;
  const objectiveRules = backendData?.objectiveRules;
  const krRules = backendData?.krRules;
  
  // Count actual suggestions from backend rules
  const countActualSuggestions = () => {
    let count = 0;
    
    // Count objective suggestions
    if (objectiveRules?.suggestions) {
      count += objectiveRules.suggestions.length;
    }
    
    // Count KR suggestions
    if (krRules) {
      krRules.forEach((krRule: any) => {
        if (krRule?.suggestions) {
          count += krRule.suggestions.length;
        }
      });
    }
    
    return count;
  };
  
  const improvementAreasCount = backendData?.report?.improvementAreasCount || countActualSuggestions();

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Areas for Improvement</h3>
        {improvementAreasCount > 0 && (
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md transition-colors duration-200 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            View Suggestions
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {improvementAreasCount > 0 ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {improvementAreasCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Areas to optimize
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                Click to see specific suggestions
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">All good!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovementAreasCard;
