import React, { useState } from 'react';
import { Download, Copy, CheckCircle, Check, Sparkles, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import type { CorrectOKRResponse } from '../types';

interface CorrectionResultsPageProps {
  correctionData: CorrectOKRResponse;
  onDownloadReport: () => void;
  onUseImprovedOKR?: (improvedOKRText: string) => void;
}

const CorrectionResultsPage: React.FC<CorrectionResultsPageProps> = ({
  correctionData,
  onDownloadReport,
  onUseImprovedOKR
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Helper functions to extract data from backend response
  const getOriginalOKR = () => {
    const backendData = correctionData._backend_response;
    return backendData?.originalOkr || backendData?.original_okr;
  };

  const getCorrectedOKR = () => {
    const backendData = correctionData._backend_response;
    return backendData?.correctedOkr || backendData?.corrected_okr;
  };

  const getCorrectionSummary = () => {
    const backendData = correctionData._backend_response;
    return backendData?.correctionSummary || backendData?.correction_summary;
  };

  const getImprovements = () => {
    const backendData = correctionData._backend_response;
    return backendData?.improvement || {};
  };

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleUseImprovedOKR = () => {
    const correctedOkr = getCorrectedOKR();
    
    if (!correctedOkr) {
      console.error('No corrected OKR found in backend response');
      return;
    }
    
    const improvedOKRText = `O: ${correctedOkr.objective}\n${(correctedOkr.keyResults || correctedOkr.key_results || []).map((kr: string, index: number) => `K${index + 1}: ${kr}`).join('\n')}`;
    
    if (onUseImprovedOKR) {
      onUseImprovedOKR(improvedOKRText);
    } else {
      // Fallback: copy to clipboard if no handler provided
      handleCopy(improvedOKRText, 'improved-okr');
    }
  };

  const handleDownload = () => {
    const correctedOkr = getCorrectedOKR();
    const correctionSummary = getCorrectionSummary();
    const improvements = getImprovements();
    
    if (!correctedOkr) {
      console.error('No corrected OKR found in backend response');
      return;
    }
    
    const content = `CORRECTED OKR

${correctedOkr.level} OBJECTIVE:
${correctedOkr.objective}

KEY RESULTS:
${(correctedOkr.keyResults || correctedOkr.key_results || []).map((kr: string, index: number) => `${index + 1}. ${kr}`).join('\n')}

CORRECTION SUMMARY:
${correctionSummary}

IMPROVEMENTS:
${Object.entries(improvements).map(([key, improvements]) => 
  `${key.toUpperCase()}:\n${(improvements as string[]).map((imp: string, i: number) => `  ${i + 1}. ${imp}`).join('\n')}`
).join('\n\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrected-okr.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const originalOKR = getOriginalOKR();
  const correctedOKR = getCorrectedOKR();
  const correctionSummary = getCorrectionSummary();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          AI Correction Complete
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your OKRs have been enhanced with AI-powered improvements for better clarity, measurability, and impact.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={handleUseImprovedOKR}
          className="px-6 py-2.5 bg-green-600 dark:bg-green-500 text-white font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Use Improved OKR
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={onDownloadReport}
          className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Correction Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-8 border border-green-200 dark:border-green-700">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              AI Correction Summary
              <span className="px-2 py-1 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                Enhanced by AI
              </span>
            </h3>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-green-200 dark:border-green-700/50">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {correctionSummary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Original OKR */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              Original OKR
            </h3>
            <button
              onClick={() => {
                const originalOkr = getOriginalOKR();
                if (originalOkr) {
                  handleCopy(
                    `O: ${originalOkr.objective}\n${(originalOkr.keyResults || originalOkr.key_results || []).map((kr: string, index: number) => `K${index + 1}: ${kr}`).join('\n')}`,
                    'original'
                  );
                }
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {copiedSection === 'original' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                {originalOKR?.level} Objective
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {originalOKR?.objective}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Key Results
              </div>
              <div className="space-y-2">
                {(originalOKR?.keyResults || originalOKR?.key_results || []).map((kr: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                      {index + 1}.
                    </span>
                    {kr}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Corrected OKR */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Corrected OKR
            </h3>
            <button
              onClick={() => {
                const correctedOkr = getCorrectedOKR();
                if (correctedOkr) {
                  handleCopy(
                    `O: ${correctedOkr.objective}\n${(correctedOkr.keyResults || correctedOkr.key_results || []).map((kr: string, index: number) => `K${index + 1}: ${kr}`).join('\n')}`,
                    'corrected'
                  );
                }
              }}
              className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >
              {copiedSection === 'corrected' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide">
                {correctedOKR?.level} Objective
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                {correctedOKR?.objective}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">
                Key Results
              </div>
              <div className="space-y-2">
                {(correctedOKR?.keyResults || correctedOKR?.key_results || []).map((kr: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 mr-2">
                      {index + 1}.
                    </span>
                    {kr}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Improvements */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          Detailed Improvements
        </h3>
        
        <div className="space-y-6">
          {Object.entries(getImprovements()).map(([key, improvements]) => (
            <div key={key}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary-500" />
                {key === 'objective' ? 'Objective' : key === 'kr1' ? 'Key Result 1' : key === 'kr2' ? 'Key Result 2' : key === 'kr3' ? 'Key Result 3' : key}
              </h4>
              <div className="space-y-2 ml-6">
                {(improvements as string[]).map((improvement: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {improvement}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CorrectionResultsPage;
