import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { WeeklyPriorityPlan, MonthlyHeadsUp, WorkItem, WeeklyPriority as WeeklyPriorityItem } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Target, Plus, Trash2, Star, CheckCircle } from 'lucide-react';

interface WeeklyPriorityProps {
  headsup: MonthlyHeadsUp;
  week: string;
  onSaved?: (plan: WeeklyPriorityPlan) => void;
}

export const WeeklyPriority: React.FC<WeeklyPriorityProps> = ({ headsup, week, onSaved }) => {
  const [weekFocus, setWeekFocus] = useState('');
  const [plan, setPlan] = useState<WeeklyPriorityPlan | null>(null);
  const [monthWorkItems, setMonthWorkItems] = useState<WorkItem[]>([]);
  const [priorities, setPriorities] = useState<WeeklyPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Priority Form State
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriority, setNewPriority] = useState({
    work_item_id: 0,
    priority: 1 as 1 | 2 | 3,
  });

  useEffect(() => {
    loadAllData();
  }, [headsup.id, week]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [planData, workItemsData] = await Promise.all([
        api.getWeeklyPriorityPlan(headsup.id, week).catch(err => err.response?.status === 404 ? null : Promise.reject(err)),
        api.getWorkItems({ monthly_headsup_id: headsup.id } as any)
      ]);

      if (planData) {
        setPlan(planData);
        setWeekFocus(planData.week_focus);
        const prioritiesData = await api.getWeeklyPriorities(planData.id);
        setPriorities(prioritiesData);
      } else {
        setPlan(null);
        setWeekFocus('');
        setPriorities([]);
      }

      setMonthWorkItems(workItemsData);
    } catch (err: any) {
      setError('Failed to load weekly planning data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!weekFocus.trim()) {
      setError('Week focus is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      let updated;
      if (plan) {
        updated = await api.updateWeeklyPriorityPlan(plan.id, { week_focus: weekFocus });
      } else {
        updated = await api.createWeeklyPriorityPlan({
          monthly_headsup_id: headsup.id,
          week,
          week_focus: weekFocus
        });
      }
      setPlan(updated);
      setSuccess('Weekly focus saved successfully');
      if (onSaved) onSaved(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save weekly plan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPriority = async () => {
    if (!plan) {
      setError('Save the weekly focus first');
      return;
    }
    if (newPriority.work_item_id === 0) {
      setError('Select a work item');
      return;
    }

    // P1 Validation
    if (newPriority.priority === 1) {
      const p1Count = priorities.filter(p => p.priority === 1).length;
      if (p1Count >= 3) {
        setError('Maximum 3 P1 priorities allowed per week');
        return;
      }
    }

    try {
      setSaving(true);
      const created = await api.setWeeklyPriority({
        plan_id: plan.id,
        work_item_id: newPriority.work_item_id,
        priority: newPriority.priority,
      });
      
      // Update local state (handle if it was an update or create)
      const existingIdx = priorities.findIndex(p => p.work_item_id === newPriority.work_item_id);
      if (existingIdx >= 0) {
        const updatedPriorities = [...priorities];
        updatedPriorities[existingIdx] = created;
        setPriorities(updatedPriorities);
      } else {
        setPriorities([...priorities, created]);
      }
      
      setIsAddingPriority(false);
      setNewPriority({ work_item_id: 0, priority: 1 });
      setSuccess('Priority set successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set priority');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriority = async (id: number) => {
    try {
      await api.deleteWeeklyPriority(id);
      setPriorities(priorities.filter(p => p.id !== id));
      setSuccess('Priority removed');
    } catch (err: any) {
      setError('Failed to remove priority');
    }
  };

  const currentP1Count = priorities.filter(p => p.priority === 1).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Weekly Focus Section */}
      <div className="card space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Weekly Focus</h2>
            <p className="text-sm text-text-secondary">Core objective for week {week}</p>
          </div>
        </div>

        <div className="bg-surface-hover p-4 rounded-lg border border-border">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Monthly Context</h3>
          <p className="text-text-primary text-sm italic">"{headsup.description}"</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="space-y-4">
          <div>
            <label className="label text-xs font-semibold uppercase text-text-secondary mb-2 block">Weekly Goal / Focus Area</label>
            <textarea
              className="input w-full min-h-[80px] text-base"
              placeholder="What must be achieved this week?"
              value={weekFocus}
              onChange={(e) => setWeekFocus(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : plan ? 'Update Week' : 'Initialize Week'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priorities Section */}
      {plan && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                <Star size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Weekly Priorities</h2>
                <p className="text-sm text-text-secondary">P1: critical, P2: important, P3: nice to have</p>
              </div>
            </div>
            {!isAddingPriority && (
              <button
                onClick={() => setIsAddingPriority(true)}
                className="btn btn-outline-primary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Priority</span>
              </button>
            )}
          </div>

          {isAddingPriority && (
            <div className="bg-surface-hover p-4 rounded-lg border border-primary/20 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Select Work Item</label>
                  <select
                    className="input w-full"
                    value={newPriority.work_item_id}
                    onChange={(e) => setNewPriority({ ...newPriority, work_item_id: parseInt(e.target.value) })}
                  >
                    <option value="0">Choose from month items...</option>
                    {monthWorkItems
                      .filter(wi => !priorities.some(p => p.work_item_id === wi.id))
                      .map(wi => (
                        <option key={wi.id} value={wi.id}>{wi.title}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="label">Priority Level</label>
                  <select
                    className="input w-full"
                    value={newPriority.priority}
                    onChange={(e) => setNewPriority({ ...newPriority, priority: parseInt(e.target.value) as 1 | 2 | 3 })}
                  >
                    <option value="1">P1 - Critical (Max 3)</option>
                    <option value="2">P2 - Important</option>
                    <option value="3">P3 - Nice to Have</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsAddingPriority(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleAddPriority} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Set Priority'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {[1, 2, 3].map(level => {
              const levelPriorities = priorities.filter(p => p.priority === level);
              if (levelPriorities.length === 0 && !isAddingPriority) return null;
              
              const levelMeta = {
                1: { label: 'P1 - Critical', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
                2: { label: 'P2 - Important', color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
                3: { label: 'P3 - Nice to Have', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
              }[level as 1 | 2 | 3];

              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`${levelMeta.color} w-3 h-3 rounded-full`} />
                    <h3 className="text-sm font-bold text-text-primary">{levelMeta.label}</h3>
                    {level === 1 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentP1Count >= 1 && currentP1Count <= 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {currentP1Count}/3 Set
                      </span>
                    )}
                  </div>
                  <div className="pl-5 space-y-2">
                    {levelPriorities.length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No {levelMeta.label} items set.</p>
                    ) : (
                      levelPriorities.map(p => {
                        const wi = monthWorkItems.find(item => item.id === p.work_item_id);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl group hover:border-primary/30 transition-all">
                            <div className="flex items-center space-x-3">
                              <CheckCircle size={16} className="text-text-secondary" />
                              <span className="text-sm font-medium text-text-primary">{wi?.title || 'Unknown Item'}</span>
                            </div>
                            <button
                              onClick={() => handleDeletePriority(p.id)}
                              className="p-1.5 text-text-secondary hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
            
            {priorities.length === 0 && !isAddingPriority && (
              <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border rounded-xl">
                Add priorities to start tracking specific work items for this week.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
