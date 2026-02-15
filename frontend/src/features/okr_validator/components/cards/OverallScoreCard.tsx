import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface OverallScoreCardProps {
  validationData: ValidateOKRResponse;
}

const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ validationData }) => {
  const getStatusColor = (decision: string) => {
    switch (decision) {
      case 'PASS': return { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700' };
      case 'FAIL': return { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700' };
      default: return { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' };
    }
  };

  const statusColors = getStatusColor(validationData.decision);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm text-center">Overall Health Score</h3>
      <div className="flex-1 flex flex-col justify-center items-center space-y-4">
        <div className={`w-24 h-24 ${statusColors.bg} rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-3xl font-bold text-white">
            {Math.round(validationData.overall_score)}
          </span>
        </div>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${statusColors.badge} ${statusColors.text} border`}>
          {validationData.decision === 'PASS' && <CheckCircle className="w-4 h-4 mr-1.5" />}
          {validationData.decision === 'FAIL' && <AlertTriangle className="w-4 h-4 mr-1.5" />}
          {validationData.decision}
        </div>
      </div>
    </div>
  );
};

export default OverallScoreCard;
