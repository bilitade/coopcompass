import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layout } from '../../../shared/components/Layout';
import { useAuth } from '../../../app/context/AuthContext';
import { MonthlyHeadsup } from '../components/MonthlyHeadsup';
import { api } from '../../../shared/services/api';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Calendar, FileText, Sparkles, Edit, X, Target, AlertTriangle, ListTodo, CheckCircle } from 'lucide-react';
import type { MonthlyHeadsUp, MonthlyPlanOutput } from '../../../shared/types';

export const MonthlyHeadsupPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<MonthlyPlanOutput | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user?.team_id) {
      loadHeadsup();
    }
  }, [user?.team_id, selectedMonth]);

  const loadHeadsup = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlyHeadsUp(user!.team_id!, selectedMonth);
      setHeadsup(data);
      setIsCreating(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHeadsup(null);
        setIsCreating(false);
      } else {
        console.error('Error loading headsup:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHeadsupSaved = (savedHeadsup: MonthlyHeadsUp) => {
    setHeadsup(savedHeadsup);
    setIsCreating(false);
  };

  const handleHeadsupDeleted = () => {
    // Reload to show empty state
    loadHeadsup();
  };

  const handleGenerateWithAI = async () => {
    if (!user?.team_id) return;
    
    try {
      setGenerating(true);
      const plan = await api.generateMonthlyPlan(user.team_id, selectedMonth);
      console.log('Generated plan:', plan);
      setPreviewPlan(plan);
      setShowPreview(true);
      console.log('Preview modal should be visible now');
    } catch (err: any) {
      console.error('Error generating plan:', err);
      alert(`Failed to generate plan: ${err.response?.data?.detail || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCommitPreview = async () => {
    if (!user?.team_id || !previewPlan) return;
    
    try {
      setGenerating(true);
      await api.generateAndCreateMonthlyPlan(user.team_id, selectedMonth, true);
      setShowPreview(false);
      setPreviewPlan(null);
      await loadHeadsup();
    } catch (err: any) {
      console.error('Error creating plan:', err);
      alert(`Failed to create plan: ${err.response?.data?.detail || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegeneratePreview = async () => {
    await handleGenerateWithAI();
  };

  if (!user?.team_id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-text-primary">Team Assignment Required</h1>
            <p className="text-text-secondary">You must be assigned to a team to access the monthly planning.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Show empty state if no headsup exists
  if (!headsup && !isCreating) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Monthly Headsup</h1>
              <p className="text-text-secondary mt-1 font-medium">Define the core focus and work items for the month.</p>
            </div>
            
            <div className="card flex items-center space-x-3 px-4 py-2 bg-surface shadow-sm border border-border">
              <Calendar className="text-primary" size={20} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-semibold text-text-primary"
              />
            </div>
          </div>

          <div className="card border-2 border-dashed border-border bg-surface/50">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FileText className="text-primary" size={48} />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-text-primary">No Monthly Headsup for {formatMonth(selectedMonth)}</h2>
                <p className="text-text-secondary">
                  Create a monthly heads-up to define your team's focus, objectives, and key work items for this month.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={() => setIsCreating(true)}
                  className="btn btn-outline-primary flex items-center justify-center space-x-2 px-8 py-3 text-lg"
                >
                  <Edit size={20} />
                  <span>Create Manually</span>
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={generating}
                  className="btn btn-primary flex items-center justify-center space-x-2 px-8 py-3 text-lg"
                >
                  <Sparkles size={20} />
                  <span>{generating ? 'Generating...' : 'Generate with AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal - must be outside conditional returns */}
        {showPreview && previewPlan && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
            <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">AI Generated Monthly Plan Preview</h2>
                    <p className="text-sm text-text-secondary">Review the plan before committing</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewPlan(null);
                  }}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Monthly Description</h3>
                  <div className="bg-surface-hover/50 border border-border rounded-lg p-4">
                    <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                      {previewPlan.description}
                    </p>
                  </div>
                </div>

                {/* Focus Areas */}
                {previewPlan.focus_areas && previewPlan.focus_areas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Target size={18} className="text-primary" />
                      Focus Areas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {previewPlan.focus_areas.map((area, idx) => (
                        <span
                          key={idx}
                          className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Alignment */}
                {previewPlan.strategic_alignment && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Target size={18} className="text-primary" />
                      Strategic Alignment
                    </h3>
                    <div className="bg-surface-hover/50 border border-border rounded-lg p-4">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {previewPlan.strategic_alignment}
                      </p>
                    </div>
                  </div>
                )}

                {/* Risks & Considerations */}
                {previewPlan.risks_and_considerations && previewPlan.risks_and_considerations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-yellow-500" />
                      Risks & Considerations
                    </h3>
                    <ul className="space-y-2">
                      {previewPlan.risks_and_considerations.map((risk, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-text-secondary bg-surface-hover/50 border border-border rounded-lg p-3"
                        >
                          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Work Items Preview */}
                {previewPlan.work_items && previewPlan.work_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <ListTodo size={18} className="text-blue-500" />
                      Suggested Work Items ({previewPlan.work_items.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {previewPlan.work_items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-surface-hover/50 border border-border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-text-primary">{item.title}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.priority === 'High'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : item.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span className={`px-2 py-1 rounded ${
                              item.source_type === 'OKR'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.source_type}
                            </span>
                            <span>{item.source_name}</span>
                          </div>
                          {item.rationale && (
                            <p className="text-xs text-text-secondary mt-2 italic">
                              {item.rationale}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewPlan(null);
                    }}
                    className="btn btn-secondary"
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegeneratePreview}
                    disabled={generating}
                    className="btn btn-outline-primary flex items-center gap-2"
                  >
                    <Sparkles size={16} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleCommitPreview}
                    disabled={generating}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    {generating ? (
                      <span>Creating...</span>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Commit Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Monthly Headsup</h1>
            <p className="text-text-secondary mt-1 font-medium">
              {headsup ? 'Manage your monthly focus and work items' : 'Create your monthly focus and work items'}
            </p>
          </div>
          
          <div className="card flex items-center space-x-3 px-4 py-2 bg-surface shadow-sm border border-border">
            <Calendar className="text-primary" size={20} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-semibold text-text-primary"
            />
          </div>
        </div>

        <MonthlyHeadsup 
          teamId={user.team_id} 
          month={selectedMonth} 
          onSaved={handleHeadsupSaved}
          onDeleted={handleHeadsupDeleted}
          isCreating={isCreating}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && previewPlan && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">AI Generated Monthly Plan Preview</h2>
                  <p className="text-sm text-text-secondary">Review the plan before committing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewPlan(null);
                }}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Monthly Description</h3>
                <div className="bg-surface-hover/50 border border-border rounded-lg p-4">
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {previewPlan.description}
                  </p>
                </div>
              </div>

              {/* Focus Areas */}
              {previewPlan.focus_areas && previewPlan.focus_areas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {previewPlan.focus_areas.map((area, idx) => (
                      <span
                        key={idx}
                        className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Alignment */}
              {previewPlan.strategic_alignment && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    Strategic Alignment
                  </h3>
                  <div className="bg-surface-hover/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {previewPlan.strategic_alignment}
                    </p>
                  </div>
                </div>
              )}

              {/* Risks & Considerations */}
              {previewPlan.risks_and_considerations && previewPlan.risks_and_considerations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-500" />
                    Risks & Considerations
                  </h3>
                  <ul className="space-y-2">
                    {previewPlan.risks_and_considerations.map((risk, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-text-secondary bg-surface-hover/50 border border-border rounded-lg p-3"
                      >
                        <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Work Items Preview */}
              {previewPlan.work_items && previewPlan.work_items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <ListTodo size={18} className="text-blue-500" />
                    Suggested Work Items ({previewPlan.work_items.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {previewPlan.work_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-surface-hover/50 border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-text-primary">{item.title}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.priority === 'High'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : item.priority === 'Medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                          <span className={`px-2 py-1 rounded ${
                            item.source_type === 'OKR'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.source_type}
                          </span>
                          <span>{item.source_name}</span>
                        </div>
                        {item.rationale && (
                          <p className="text-xs text-text-secondary mt-2 italic">
                            {item.rationale}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewPlan(null);
                  }}
                  className="btn btn-secondary"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegeneratePreview}
                  disabled={generating}
                  className="btn btn-outline-primary flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Regenerate
                </button>
                <button
                  onClick={handleCommitPreview}
                  disabled={generating}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {generating ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Commit Plan</span>
                    </>
                  )}
                </button>
              </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Layout>
  );
};

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
