import React from 'react';
import { Calculator } from 'lucide-react';
import type { ValidateOKRResponse } from '../../types';

interface FrameworkPerformanceCardProps {
  validationData: ValidateOKRResponse;
  onOpenModal: () => void;
}

const FrameworkPerformanceCard: React.FC<FrameworkPerformanceCardProps> = ({ validationData, onOpenModal }) => {
  return (
    <div className="card card-hover h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Framework Performance</h3>
        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md transition-colors duration-200 shadow-sm"
        >
          <Calculator className="w-3.5 h-3.5" />
          View Details
        </button>
      </div>
      <div className="flex-1 space-y-3">
        {(() => {
          // Try to get framework performance from backend first
          const backendFrameworkData = validationData?.framework_performance;
          
          let scaleitPercent = 0;
          let clearPercent = 0;
          let strategicPercent = 0;
          let okrAlignmentPercent = 0;
          let scaleitPoints = 0;
          let clearPoints = 0;
          let strategicPoints = 0;
          let okrAlignmentPoints = 0;

          // Use backend framework performance data if available
          if (backendFrameworkData) {
            // S.C.A.L.E.I.T (Objectives) - use backend data directly (backend sends scaleIt)
            if (backendFrameworkData.scaleIt) {
              scaleitPercent = Math.min(100, backendFrameworkData.scaleIt.percentage || 0);
              const pointsDisplay = backendFrameworkData.scaleIt.pointsDisplay || '0/40';
              scaleitPoints = parseFloat(pointsDisplay.split('/')[0]) || 0;
            }
            
            // C.L.E.A.R (Key Results) - use backend data directly
            if (backendFrameworkData.clear) {
              clearPercent = Math.min(100, backendFrameworkData.clear.percentage || 0);
              const pointsDisplay = backendFrameworkData.clear.pointsDisplay || '0/30';
              clearPoints = parseFloat(pointsDisplay.split('/')[0]) || 0;
            }
            
            // Strategic - use backend data directly
            if (backendFrameworkData.strategic) {
              strategicPercent = Math.min(100, backendFrameworkData.strategic.percentage || 0);
              const pointsDisplay = backendFrameworkData.strategic.pointsDisplay || '0/20';
              strategicPoints = parseFloat(pointsDisplay.split('/')[0]) || 0;
            }
            
            // OKR Alignment - use backend data directly (backend sends okrAlignment)
            if (backendFrameworkData.okrAlignment) {
              okrAlignmentPercent = Math.min(100, backendFrameworkData.okrAlignment.percentage || 0);
              const pointsDisplay = backendFrameworkData.okrAlignment.pointsDisplay || '0/10';
              okrAlignmentPoints = parseFloat(pointsDisplay.split('/')[0]) || 0;
            }
          } else {
            // Fallback: Only calculate if backend data not available
            console.warn('Backend framework performance data not available, using fallback calculation');
            
            let scaleitScore = 0;
            let clearScore = 0;
            let strategicScore = validationData?.strategic_alignment?.score || 0;

            // Calculate S.C.A.L.E.I.T score (objectives) - using backend weights
            if (validationData?.validation_scores) {
              const objWeights = { strategic: 8, concrete: 6, action_oriented: 5, linked_to_purpose: 5, emotionally_engaging: 5, impactful: 6, time_bound: 5 };
              Object.values(validationData?.validation_scores).forEach(objData => {
                if (typeof objData === 'object') {
                  Object.entries(objWeights).forEach(([dim, weight]) => {
                    const dimData = objData[dim];
                    if (dimData && typeof dimData === 'object' && 'score' in dimData) {
                      scaleitScore += (dimData.score || 0) * weight;
                    }
                  });
                }
              });
            }

            // Calculate C.L.E.A.R score (key results) - using backend weights
            if (validationData?.validation_scores) {
              let totalKrScore = 0;
              let krCount = 0;
              const krWeights = { concrete: 7, leading_lagging: 5, evaluated: 5, ambitious: 5, real_time_trackable: 5 };

              Object.values(validationData?.validation_scores).forEach(objData => {
                if (typeof objData === 'object') {
                  Object.values(objData).forEach(krData => {
                    if (typeof krData === 'object' && 'concrete' in krData) {
                      let krScore = 0;
                      Object.entries(krWeights).forEach(([dim, weight]) => {
                        const dimData = krData[dim];
                        if (dimData && typeof dimData === 'object' && 'score' in dimData) {
                          krScore += (dimData.score || 0) * weight;
                        }
                      });
                      if (krData.is_task) krScore -= 5;
                      if (krData.is_vanity) krScore -= 5;
                      totalKrScore += Math.max(0, krScore);
                      krCount++;
                    }
                  });
                }
              });

              if (krCount > 0) {
                // Apply backend normalization: multiply by (30/27) and cap at 30
                const krAvg = totalKrScore / krCount;
                clearScore = krAvg * (30.0 / 27.0);
                clearScore = Math.min(30.0, clearScore);
              }
            }

            scaleitPercent = Math.min(100, Math.round((scaleitScore / 40) * 100));
            clearPercent = Math.min(100, Math.round((clearScore / 30) * 100));
            strategicPercent = Math.min(100, Math.round((strategicScore / 20) * 100));
            
            scaleitPoints = Math.round(scaleitScore);
            clearPoints = Math.round(clearScore);
            strategicPoints = Math.round(strategicScore * 20);
            
            // OKR Alignment fallback
            okrAlignmentPercent = Math.min(100, Math.round((validationData?.okr_alignment?.score || 0) * 100));
            okrAlignmentPoints = Math.round((validationData?.okr_alignment?.score || 0) * 10);
          }

          return (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">S.C.A.L.E.I.T</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-1 rounded-full shadow-sm ${
                    scaleitPercent >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                    scaleitPercent >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                  }`}>
                    {scaleitPercent}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({scaleitPoints}/40)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">C.L.E.A.R</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-1 rounded-full shadow-sm ${
                    clearPercent >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                    clearPercent >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                  }`}>
                    {clearPercent}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({clearPoints}/30)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Strategic</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-1 rounded-full shadow-sm ${
                    strategicPercent >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                    strategicPercent >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                  }`}>
                    {strategicPercent}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({strategicPoints}/20)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">OKR Alignment</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-1 rounded-full shadow-sm ${
                    okrAlignmentPercent >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' :
                    okrAlignmentPercent >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                  }`}>
                    {okrAlignmentPercent}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({okrAlignmentPoints}/10)</span>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default FrameworkPerformanceCard;
