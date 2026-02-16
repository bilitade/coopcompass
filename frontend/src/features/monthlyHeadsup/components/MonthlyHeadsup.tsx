import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { MonthlyHeadsUp, WorkItem, OKRDetail, BAUActivity, MonthlyPlanOutput } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Calendar, Plus, Trash2, Link as LinkIcon, CheckCircle, ListTodo, Edit, X, Sparkles, AlertTriangle, Target } from 'lucide-react';

interface MonthlyHeadsupProps {
  teamId: number;
  month: string;
  onSaved?: (headsup: MonthlyHeadsUp) => void;
  onDeleted?: () => void;
  isCreating?: boolean;
}

export const MonthlyHeadsup: React.FC<MonthlyHeadsupProps> = ({ teamId, month, onSaved, onDeleted, isCreating = false }) => {
  const [description, setDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [strategicAlignment, setStrategicAlignment] = useState('');
  const [risksAndConsiderations, setRisksAndConsiderations] = useState<string[]>([]);
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [okrs, setOkrs] = useState<OKRDetail[]>([]);
  const [bauActivities, setBauActivities] = useState<BAUActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<MonthlyPlanOutput | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Work Item Form State
  const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
  const [editingWorkItemId, setEditingWorkItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    source_type: 'OKR' as 'OKR' | 'BAU',
    source_id: 0,
  });
  const [editItem, setEditItem] = useState({
    title: '',
    source_type: 'OKR' as 'OKR' | 'BAU',
    source_id: 0,
  });

  useEffect(() => {
    loadAllData();
  }, [teamId, month]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [headsupData, okrsData, bauData] = await Promise.all([
        api.getMonthlyHeadsUp(teamId, month).catch(err => err.response?.status === 404 ? null : Promise.reject(err)),
        api.getTeamOKRs(teamId),
        api.getTeamBAUActivities(teamId)
      ]);

      if (headsupData) {
        setHeadsup(headsupData);
        setDescription(headsupData.description || '');
        setFocusAreas(headsupData.focus_areas || []);
        setStrategicAlignment(headsupData.strategic_alignment || '');
        setRisksAndConsiderations(headsupData.risks_and_considerations || []);
        const wiData = await api.getWorkItems({ monthly_headsup_id: headsupData.id } as any);
        setWorkItems(wiData);
        setIsEditing(false); // Reset to view mode when data loads
      } else {
        setHeadsup(null);
        setDescription('');
        setFocusAreas([]);
        setStrategicAlignment('');
        setRisksAndConsiderations([]);
        setWorkItems([]);
        setIsEditing(isCreating); // If creating, start in edit mode
      }

      setOkrs(okrsData);
      setBauActivities(bauData);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Failed to load planning data');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      // Generate plan preview (don't create yet)
      const plan = await api.generateMonthlyPlan(teamId, month);
      
      // Show preview modal
      setPreviewPlan(plan);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate monthly plan with AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleCommitPreview = async () => {
    if (!previewPlan) return;
    
    try {
      setGenerating(true);
      setError('');
      
      // Now create the headsup and work items
      const result = await api.generateAndCreateMonthlyPlan(teamId, month, true);
      
      // Update state with AI-generated data
      setDescription(result.plan.description);
      setFocusAreas(result.plan.focus_areas);
      setStrategicAlignment(result.plan.strategic_alignment);
      setRisksAndConsiderations(result.plan.risks_and_considerations);
      
      // Close preview and reload
      setShowPreview(false);
      setPreviewPlan(null);
      await loadAllData();
      
      setSuccess(`AI generated monthly plan with ${result.work_items_created?.length || 0} work items!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create monthly plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegeneratePreview = async () => {
    await handleGenerateWithAI();
  };

  const handleSaveHeadsUp = async () => {
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      let updated;
      if (headsup) {
        updated = await api.updateMonthlyHeadsUp(headsup.id, { 
          description,
          focus_areas: focusAreas,
          strategic_alignment: strategicAlignment,
          risks_and_considerations: risksAndConsiderations
        });
      } else {
        updated = await api.createMonthlyHeadsUp(teamId, { 
          month, 
          description,
          focus_areas: focusAreas,
          strategic_alignment: strategicAlignment,
          risks_and_considerations: risksAndConsiderations
        });
      }
      setHeadsup(updated);
      setDescription(updated.description || '');
      setFocusAreas(updated.focus_areas || []);
      setStrategicAlignment(updated.strategic_alignment || '');
      setRisksAndConsiderations(updated.risks_and_considerations || []);
      setIsEditing(false); // Switch back to view mode after saving
      setSuccess('Monthly heads-up saved successfully');
      if (onSaved) onSaved(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save heads-up');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWorkItem = async () => {
    if (!headsup) {
      setError('Save the monthly heads-up first');
      return;
    }
    if (!newItem.title.trim() || newItem.source_id === 0) {
      setError('Title and Source are required');
      return;
    }

    try {
      setSaving(true);
      const created = await api.createWorkItem({
        title: newItem.title,
        monthly_headsup_id: headsup.id,
        source_type: newItem.source_type,
        source_id: newItem.source_id,
      });
      setWorkItems([...workItems, created]);
      setNewItem({ title: '', source_type: 'OKR', source_id: 0 });
      setIsAddingWorkItem(false);
      setSuccess('Work item added');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add work item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkItem = async (id: number) => {
    try {
      await api.deleteWorkItem(id);
      setWorkItems(workItems.filter(wi => wi.id !== id));
      setSuccess('Work item removed');
    } catch (err: any) {
      setError('Failed to remove work item');
    }
  };

  const handleStartEditWorkItem = (item: WorkItem) => {
    setEditingWorkItemId(item.id);
    setEditItem({
      title: item.title,
      source_type: item.source_type as 'OKR' | 'BAU',
      source_id: item.source_id,
    });
  };

  const handleCancelEditWorkItem = () => {
    setEditingWorkItemId(null);
    setEditItem({ title: '', source_type: 'OKR', source_id: 0 });
  };

  const handleUpdateWorkItem = async (id: number) => {
    if (!editItem.title.trim() || editItem.source_id === 0) {
      setError('Title and Source are required');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateWorkItem(id, {
        title: editItem.title.trim(),
      });
      setWorkItems(workItems.map(wi => wi.id === id ? updated : wi));
      setEditingWorkItemId(null);
      setEditItem({ title: '', source_type: 'OKR', source_id: 0 });
      setSuccess('Work item updated');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update work item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHeadsup = async () => {
    if (!headsup) return;
    
    const confirmMessage = `Are you sure you want to delete the monthly headsup for ${month}? This will also delete all associated work items. This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);
      await api.deleteMonthlyHeadsUp(headsup.id);
      setSuccess('Monthly headsup deleted successfully');
      // Notify parent to reload
      if (onDeleted) {
        onDeleted();
      } else {
        // Fallback: reload page
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete monthly headsup');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Show component even when no headsup exists so user can generate one

  const showEditForm = isEditing || (!headsup && isCreating);

  return (
    <div className="space-y-6">
      {/* Monthly Focus Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Monthly Focus</h2>
              <p className="text-sm text-text-secondary">High-level goals for {month}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {headsup && (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <CheckCircle size={14} /> Initialized
              </span>
            )}
            {headsup && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline-primary flex items-center space-x-2 px-4"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={generating}
                  className="btn btn-outline-primary flex items-center space-x-2 px-4"
                >
                  <Sparkles size={16} />
                  <span>{generating ? 'Regenerating...' : 'Regenerate with AI'}</span>
                </button>
                <button
                  onClick={handleDeleteHeadsup}
                  disabled={saving}
                  className="btn btn-secondary flex items-center space-x-2 px-4 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600"
                >
                  <Trash2 size={16} />
                  <span>{saving ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (headsup) {
                    setDescription(headsup.description || '');
                    setFocusAreas(headsup.focus_areas || []);
                    setStrategicAlignment(headsup.strategic_alignment || '');
                    setRisksAndConsiderations(headsup.risks_and_considerations || []);
                  }
                }}
                className="btn btn-secondary flex items-center space-x-2 px-4"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {showEditForm ? (
          <div className="space-y-4">
            <div>
              <label className="label text-sm font-semibold mb-2 block text-text-secondary uppercase">Month Description</label>
              <textarea
                className="input w-full min-h-[120px] text-base leading-relaxed"
                placeholder="What is the main objective for this month? (e.g., Launch referral program and improve operational efficiency)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Focus Areas - Editable */}
            <div>
              <label className="label text-sm font-semibold mb-2 block text-text-secondary uppercase">
                Focus Areas
                <span className="text-xs font-normal text-text-secondary ml-2">(One per line)</span>
              </label>
              <textarea
                className="input w-full min-h-[100px] text-base leading-relaxed"
                placeholder="Enter focus areas, one per line&#10;Example:&#10;Complete migration of critical services to the cloud&#10;Enhance system uptime and reduce downtime"
                value={focusAreas.join('\n')}
                onChange={(e) => {
                  const areas = e.target.value.split('\n').filter(line => line.trim() !== '');
                  setFocusAreas(areas);
                }}
              />
              {focusAreas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {focusAreas.map((area, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Strategic Alignment - Editable */}
            <div>
              <label className="label text-sm font-semibold mb-2 block text-text-secondary uppercase">Strategic Alignment</label>
              <textarea
                className="input w-full min-h-[100px] text-base leading-relaxed"
                placeholder="How does this month align with strategic goals? (e.g., This month's plan aligns with our strategic goal of modernizing the core banking infrastructure...)"
                value={strategicAlignment}
                onChange={(e) => setStrategicAlignment(e.target.value)}
              />
            </div>

            {/* Risks & Considerations - Editable */}
            <div>
              <label className="label text-sm font-semibold mb-2 block text-text-secondary uppercase">
                Risks & Considerations
                <span className="text-xs font-normal text-text-secondary ml-2">(One per line)</span>
              </label>
              <textarea
                className="input w-full min-h-[100px] text-base leading-relaxed"
                placeholder="Enter risks and considerations, one per line&#10;Example:&#10;Potential delays in cloud migration due to unforeseen technical challenges&#10;Resource constraints may impact optimization efforts"
                value={risksAndConsiderations.join('\n')}
                onChange={(e) => {
                  const risks = e.target.value.split('\n').filter(line => line.trim() !== '');
                  setRisksAndConsiderations(risks);
                }}
              />
              {risksAndConsiderations.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {risksAndConsiderations.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary bg-surface-hover/50 border border-border rounded-lg p-3">
                      <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (headsup) {
                      setDescription(headsup.description || '');
                      setFocusAreas(headsup.focus_areas || []);
                      setStrategicAlignment(headsup.strategic_alignment || '');
                      setRisksAndConsiderations(headsup.risks_and_considerations || []);
                    }
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveHeadsUp}
                disabled={saving}
                className="btn btn-primary flex items-center space-x-2 px-6"
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : headsup ? 'Save Changes' : 'Create Monthly Headsup'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface-hover/50 border border-border rounded-lg p-6">
              <p className="text-base leading-relaxed text-text-primary whitespace-pre-wrap">
                {headsup?.description || 'No description provided'}
              </p>
            </div>

            {headsup?.focus_areas && headsup.focus_areas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-primary" />
                  <h3 className="text-sm font-semibold text-text-secondary uppercase">Focus Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {headsup.focus_areas.map((area, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {headsup?.strategic_alignment && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-primary" />
                  <h3 className="text-sm font-semibold text-text-secondary uppercase">Strategic Alignment</h3>
                </div>
                <div className="bg-surface-hover/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {headsup.strategic_alignment}
                  </p>
                </div>
              </div>
            )}

            {headsup?.risks_and_considerations && headsup.risks_and_considerations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-yellow-500" />
                  <h3 className="text-sm font-semibold text-text-secondary uppercase">Risks & Considerations</h3>
                </div>
                <ul className="space-y-2">
                  {headsup.risks_and_considerations.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary bg-surface-hover/50 border border-border rounded-lg p-3">
                      <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Work Items Section */}
      {headsup && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ListTodo size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Monthly Work Items</h2>
                <p className="text-sm text-text-secondary">Deliverables linked to OKRs or BAU</p>
              </div>
            </div>
            {!isAddingWorkItem && (
              <button
                onClick={() => setIsAddingWorkItem(true)}
                className="btn btn-outline-primary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Work Item</span>
              </button>
            )}
          </div>

          {isAddingWorkItem && (
            <div className="bg-surface-hover p-4 rounded-lg border border-primary/20 space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Work Item Title</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Enter specific deliverable title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Source Type</label>
                  <select
                    className="input w-full"
                    value={newItem.source_type}
                    onChange={(e) => setNewItem({ ...newItem, source_type: e.target.value as 'OKR' | 'BAU', source_id: 0 })}
                  >
                    <option value="OKR">Strategic (OKR)</option>
                    <option value="BAU">Operational (BAU)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Linking Source</label>
                  <select
                    className="input w-full"
                    value={newItem.source_id}
                    onChange={(e) => setNewItem({ ...newItem, source_id: parseInt(e.target.value) })}
                  >
                    <option value="0">Select a source...</option>
                    {newItem.source_type === 'OKR' ? (
                      okrs.flatMap(okr => okr.key_results.map(kr => (
                        <option key={kr.id} value={kr.id}>{kr.description}</option>
                      )))
                    ) : (
                      bauActivities.map(activity => (
                        <option key={activity.id} value={activity.id}>{activity.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsAddingWorkItem(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleAddWorkItem} disabled={saving} className="btn btn-primary">
                  {saving ? 'Adding...' : 'Save Work Item'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {workItems.length === 0 ? (
              <div className="text-center py-12 text-text-secondary border-2 border-dashed border-border rounded-xl bg-surface/30">
                <ListTodo className="mx-auto mb-3 opacity-40" size={32} />
                <p className="text-sm">No work items added yet.</p>
                <p className="text-xs mt-1 opacity-75">Add work items to track your monthly deliverables</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {workItems.map((item) => {
                  const sourceName = item.source_type === 'OKR' 
                    ? okrs.flatMap(o => o.key_results).find(kr => kr.id === item.source_id)?.description || 'Source not found'
                    : bauActivities.find(a => a.id === item.source_id)?.name || 'Source not found';
                  
                  const isEditing = editingWorkItemId === item.id;
                  
                  return (
                    <div key={item.id} className="bg-surface border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all group">
                      {isEditing ? (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="label">Work Item Title</label>
                              <input
                                type="text"
                                className="input w-full"
                                placeholder="Enter specific deliverable title"
                                value={editItem.title}
                                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="label">Source Type</label>
                              <select
                                className="input w-full"
                                value={editItem.source_type}
                                onChange={(e) => setEditItem({ ...editItem, source_type: e.target.value as 'OKR' | 'BAU', source_id: 0 })}
                              >
                                <option value="OKR">Strategic (OKR)</option>
                                <option value="BAU">Operational (BAU)</option>
                              </select>
                            </div>
                            <div>
                              <label className="label">Linking Source</label>
                              <select
                                className="input w-full"
                                value={editItem.source_id}
                                onChange={(e) => setEditItem({ ...editItem, source_id: parseInt(e.target.value) })}
                              >
                                <option value="0">Select a source...</option>
                                {editItem.source_type === 'OKR' ? (
                                  okrs.flatMap(okr => okr.key_results.map(kr => (
                                    <option key={kr.id} value={kr.id}>{kr.description}</option>
                                  )))
                                ) : (
                                  bauActivities.map(activity => (
                                    <option key={activity.id} value={activity.id}>{activity.name}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={handleCancelEditWorkItem} 
                              className="btn btn-secondary"
                              disabled={saving}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleUpdateWorkItem(item.id)} 
                              disabled={saving} 
                              className="btn btn-primary"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between p-4">
                          <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <div className={`w-1 h-full min-h-[60px] rounded-full flex-shrink-0 ${
                              item.source_type === 'OKR' ? 'bg-primary' : 'bg-green-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-text-primary mb-2">{item.title}</h4>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-xs uppercase font-bold px-2.5 py-1 rounded ${
                                  item.source_type === 'OKR' 
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {item.source_type}
                                </span>
                                <div className="flex items-center text-xs text-text-secondary">
                                  <LinkIcon size={12} className="mr-1.5 flex-shrink-0" />
                                  <span className="truncate">{sourceName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleStartEditWorkItem(item)}
                              className="p-2 text-text-secondary hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                              title="Edit work item"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to remove this work item?')) {
                                  handleDeleteWorkItem(item.id);
                                }
                              }}
                              className="p-2 text-text-secondary hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remove work item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        </div>
      )}
    </div>
  );
};
