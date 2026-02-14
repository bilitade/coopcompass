import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { MonthlyHeadsUp, WorkItem, OKRDetail, BAUActivity } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Calendar, Plus, Trash2, Link as LinkIcon, CheckCircle, ListTodo } from 'lucide-react';

interface MonthlyHeadsupProps {
  teamId: number;
  month: string;
  onSaved?: (headsup: MonthlyHeadsUp) => void;
}

export const MonthlyHeadsup: React.FC<MonthlyHeadsupProps> = ({ teamId, month, onSaved }) => {
  const [description, setDescription] = useState('');
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [okrs, setOkrs] = useState<OKRDetail[]>([]);
  const [bauActivities, setBauActivities] = useState<BAUActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      } else {
        setHeadsup(null);
        setDescription('');
        setWorkItems([]);
      }

      setOkrs(okrsData);
      setBauActivities(bauData);
    } catch (err: any) {
      setError('Failed to load planning data');
      console.error(err);
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

  if (loading) return <LoadingSpinner />;

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
              <h2 className="text-xl font-bold">Monthly Focus</h2>
              <p className="text-sm text-text-secondary">High-level goals for {month}</p>
            </div>
          </div>
          {headsup && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle size={14} /> Quarter Initialized
            </span>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="space-y-4">
          <div>
            <label className="label text-sm font-semibold mb-2 block text-text-secondary uppercase">Month Description</label>
            <textarea
              className="input w-full min-h-[100px] text-lg leading-relaxed italic"
              placeholder="What is the main objective for this month? (e.g., Launch referral program and improve operational efficiency)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveHeadsUp}
              disabled={saving}
              className="btn btn-primary flex items-center space-x-2 px-6"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : headsup ? 'Update Plan' : 'Initialize Month'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Work Items Section */}
      {headsup && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <ListTodo size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Monthly Work Items</h2>
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
              <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border rounded-xl">
                No work items added yet. Add at least 5-10 items for the month.
              </div>
            ) : (
              workItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/30 transition-all group shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-12 rounded-full ${item.source_type === 'OKR' ? 'bg-primary' : 'bg-green-500'}`} />
                    <div>
                      <h4 className="font-semibold text-text-primary">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          item.source_type === 'OKR' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.source_type}
                        </span>
                        <div className="flex items-center text-xs text-text-secondary italic">
                          <LinkIcon size={12} className="mr-1" />
                          <span className="truncate max-w-[200px]">
                            {item.source_type === 'OKR' 
                              ? okrs.flatMap(o => o.key_results).find(kr => kr.id === item.source_id)?.description || 'Source not found'
                              : bauActivities.find(a => a.id === item.source_id)?.name || 'Source not found'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWorkItem(item.id)}
                    className="p-2 text-text-secondary hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
