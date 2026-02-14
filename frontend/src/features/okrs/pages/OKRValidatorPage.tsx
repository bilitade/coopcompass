import React, { useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { Alert } from '../../../shared/components/Alert';
import { Target, Sparkles, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const BEST_EXAMPLE = `I want to become the most trusted digital bank in Ethiopia this quarter by increasing our NPS from 45 to 70, reducing complaint resolution time from 48 to 24 hours, and launching our mobile app with 4.5+ stars.`;

const BAD_EXAMPLE = `We want to improve customer satisfaction and make our product better. We'll work on various improvements and try to get more users.`;

export const OKRValidatorPage: React.FC = () => {
  const [okrCycle, setOkrCycle] = useState('');
  const [okrText, setOkrText] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');

  const wordCount = okrText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = okrText.length;

  const handleTemplateClick = (template: string) => {
    setOkrText(template);
    setValidationResult(null);
  };

  const handleValidate = async () => {
    if (!okrText.trim()) {
      setError('Please enter your OKRs to validate');
      return;
    }

    setValidating(true);
    setError('');
    setValidationResult(null);

    // Simulate AI validation (replace with actual API call later)
    setTimeout(() => {
      const hasNumbers = /\d+/.test(okrText);
      const hasPercentages = /%/.test(okrText);
      const hasTimeframes = /(quarter|month|week|day|hour)/i.test(okrText);
      const hasMetrics = /(from|to|increase|decrease|reduce|improve|launch|achieve)/i.test(okrText);
      
      const result = {
        score: hasNumbers && hasMetrics ? 85 : hasMetrics ? 60 : 40,
        feedback: {
          strengths: [
            hasMetrics && 'Clear action-oriented language',
            hasNumbers && 'Includes measurable metrics',
            hasPercentages && 'Contains percentage-based metrics',
            hasTimeframes && 'Contains time-bound elements',
          ].filter(Boolean),
          improvements: [
            !hasNumbers && 'Add specific numbers and percentages',
            !hasTimeframes && 'Include time-bound targets',
            !hasMetrics && 'Use action verbs (increase, reduce, launch, etc.)',
          ].filter(Boolean),
          extracted: {
            objective: okrText.split(' by ')[0] || okrText.split('.')[0] || 'Objective extracted',
            keyResults: okrText.split(' by ')[1]?.split(',').map(kr => kr.trim()).filter(Boolean) || 
                       okrText.split(',').slice(1).map(kr => kr.trim()).filter(Boolean) || 
                       ['Key results will be extracted here']
          }
        }
      };
      
      setValidationResult(result);
      setValidating(false);
    }, 1500);
  };

  const handleClear = () => {
    setOkrText('');
    setValidationResult(null);
    setError('');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="text-primary" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Validate Your OKRs</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Get instant AI-powered feedback on your Objectives and Key Results
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Main Content Card */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          {/* OKR Cycle Input */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              OKR Cycle
            </label>
            <input
              type="text"
              value={okrCycle}
              onChange={(e) => setOkrCycle(e.target.value)}
              placeholder="e.g., Q1 FY25"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-text-primary"
            />
          </div>

          {/* Objectives & Key Results Textarea */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Objectives & Key Results
            </label>
            <p className="text-xs text-text-secondary mb-2">
              Describe your OKRs in natural language. For example:
            </p>
            <div className="relative">
              <textarea
                value={okrText}
                onChange={(e) => {
                  setOkrText(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="I want to become the most trusted digital bank in Ethiopia this quarter by increasing our NPS from 45 to 70, reducing complaint resolution time from 48 to 24 hours, and launching our mobile app with 4.5+ stars."
                rows={6}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-text-primary resize-none"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] text-text-secondary bg-surface/90 px-2 py-0.5 rounded">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              The AI will automatically extract and structure your objectives and key results.
            </p>
          </div>

          {/* Quick Start Templates */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-2">
              Quick Start Templates
            </label>
            <p className="text-xs text-text-secondary mb-2">Click to autofill</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => handleTemplateClick(BEST_EXAMPLE)}
                className="flex items-center gap-2 p-3 border-2 border-emerald-500/30 bg-emerald-500/5 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-left group"
              >
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle className="text-emerald-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-text-primary mb-0.5">Best Example</h4>
                  <p className="text-[10px] text-text-secondary line-clamp-1">
                    Well-structured OKR with clear objectives and measurable key results
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleTemplateClick(BAD_EXAMPLE)}
                className="flex items-center gap-2 p-3 border-2 border-red-500/30 bg-red-500/5 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all text-left group"
              >
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                  <XCircle className="text-red-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-text-primary mb-0.5">Bad Example</h4>
                  <p className="text-[10px] text-text-secondary line-clamp-1">
                    Vague OKR without specific metrics or measurable outcomes
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleValidate}
              disabled={validating || !okrText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {validating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Validate My OKRs</span>
                </>
              )}
            </button>
            {okrText && (
              <button
                onClick={handleClear}
                className="px-3 py-2.5 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Guidance Tips */}
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <FileText className="text-primary flex-shrink-0 mt-0.5" size={14} />
                <div>
                  <h4 className="font-bold text-xs text-text-primary mb-0.5">Clear Objective</h4>
                  <p className="text-[10px] text-text-secondary">
                    Describe what you want to achieve
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <Target className="text-primary flex-shrink-0 mt-0.5" size={14} />
                <div>
                  <h4 className="font-bold text-xs text-text-primary mb-0.5">Measurable KRs</h4>
                  <p className="text-[10px] text-text-secondary">
                    Include numbers and percentages
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-text-primary">Validation Results</h2>
            </div>

            {/* Score */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-primary">OKR Quality Score</span>
                  <span className="text-base font-bold text-text-primary">{validationResult.score}%</span>
                </div>
                <div className="w-full bg-border/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      validationResult.score >= 80
                        ? 'bg-emerald-500'
                        : validationResult.score >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${validationResult.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Extracted OKRs */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-bold text-text-primary mb-1.5">Extracted Objective</h3>
                <div className="p-2.5 bg-surface-hover border border-border rounded-lg">
                  <p className="text-xs text-text-primary">{validationResult.feedback.extracted.objective}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-text-primary mb-1.5">Extracted Key Results</h3>
                <div className="space-y-1.5">
                  {validationResult.feedback.extracted.keyResults.map((kr: string, index: number) => (
                    <div key={index} className="p-2.5 bg-surface-hover border border-border rounded-lg">
                      <p className="text-xs text-text-primary">• {kr}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths */}
            {validationResult.feedback.strengths.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="text-emerald-600" size={14} />
                  Strengths
                </h3>
                <ul className="space-y-0.5">
                  {validationResult.feedback.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {validationResult.feedback.improvements.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <XCircle className="text-amber-600" size={14} />
                  Areas for Improvement
                </h3>
                <ul className="space-y-0.5">
                  {validationResult.feedback.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

