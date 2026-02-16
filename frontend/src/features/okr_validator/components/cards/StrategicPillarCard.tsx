import React from 'react';
import type { ValidateOKRResponse } from '../../types';

interface StrategicPillarCardProps {
  validationData: ValidateOKRResponse;
}

const StrategicPillarCard: React.FC<StrategicPillarCardProps> = ({ validationData }) => {
  return (
    <div className="card card-hover h-full flex flex-col">
      <h3 className="font-semibold text-text-primary mb-4 text-sm text-center">Strategic Alignment</h3>
      <div className="flex-1 flex flex-col justify-center">
        {validationData?.strategic_alignment ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {validationData?.strategic_alignment.primary_pillar}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {validationData?.strategic_alignment.alignment_strength}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium">
                Score: {Math.round(validationData?.strategic_alignment.score * 100)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Analysis pending</div>
        )}
      </div>
    </div>
  );
};

export default StrategicPillarCard;
