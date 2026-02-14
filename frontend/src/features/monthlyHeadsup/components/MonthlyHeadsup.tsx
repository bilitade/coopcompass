import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { MonthlyHeadsUp, WorkItem, OKRDetail, BAUActivity } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Calendar, Plus, Trash2, Link as LinkIcon, CheckCircle, ListTodo, Edit, X } from 'lucide-react';

interface MonthlyHeadsupProps {
  teamId: number;
  month: string;
  onSaved?: (headsup: MonthlyHeadsUp) => void;
  isCreating?: boolean;
}

export const MonthlyHeadsup: React.FC<MonthlyHeadsupProps> = ({ teamId, month, onSaved, isCreating = false }) => {
  const [description, setDescription] = useState('');
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [okrs, setOkrs] = useState<OKRDetail[]>([]);
  const [bauActivities, setBauActivities] = useState<BAUActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Work Item Form State
  const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
  const [newItem, setNewItem] = useState({
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
        setDescription(headsupData.description);
        const wiData = await api.getWorkItems({ monthly_headsup_id: headsupData.id } as any);
        setWorkItems(wiData);
        setIsEditing(false); // Reset to view mode when data loads
      } else {
        setHeadsup(null);
        setDescription('');
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
        updated = await api.updateMonthlyHeadsUp(headsup.id, { description });
      } else {
        updated = await api.createMonthlyHeadsUp(teamId, { month, description });
      }
      setHeadsup(updated);
      setDescription(updated.description);
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

  // Don't show anything if no headsup exists and we're not in creation mode
  // The parent page should handle showing the empty state
  if (!headsup && !isCreating) {
    return null;
  }

  if (loading) return <LoadingSpinner />;

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
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-outline-primary flex items-center space-x-2 px-4"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (headsup) {
                    setDescription(headsup.description);
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

            <div className="flex justify-end gap-3">
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (headsup) {
                      setDescription(headsup.description);
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
          <div className="space-y-4">
            <div className="bg-surface-hover/50 border border-border rounded-lg p-6">
              <p className="text-base leading-relaxed text-text-primary whitespace-pre-wrap">
                {headsup?.description || 'No description provided'}
              </p>
            </div>
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
                  
                  return (
                    <div key={item.id} className="flex items-start justify-between p-4 bg-surface border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all group">
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
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this work item?')) {
                            handleDeleteWorkItem(item.id);
                          }
                        }}
                        className="p-2 text-text-secondary hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all ml-4 flex-shrink-0"
                        title="Remove work item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
