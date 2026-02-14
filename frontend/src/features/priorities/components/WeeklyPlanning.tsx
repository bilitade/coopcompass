import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { WeeklyPriorityPlan, MonthlyHeadsUp } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Target } from 'lucide-react';

interface WeeklyPlanningProps {
  headsup: MonthlyHeadsUp;
  week: string;
  onSaved?: (plan: WeeklyPriorityPlan) => void;
}

export const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({ headsup, week, onSaved }) => {
  const [weekFocus, setWeekFocus] = useState('');
  const [plan, setPlan] = useState<WeeklyPriorityPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPlan();
  }, [headsup.id, week]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await api.getWeeklyPriorityPlan(headsup.id, week);
      setPlan(data);
      setWeekFocus(data.week_focus);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setPlan(null);
        setWeekFocus('');
      } else {
        setError('Failed to load weekly plan');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
      setSuccess('Weekly priority plan saved successfully');
      if (onSaved) onSaved(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save weekly plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Target size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Weekly Priority Plan</h2>
          <p className="text-sm text-text-secondary">Define the focus for week {week}</p>
        </div>
      </div>

      <div className="bg-surface-hover p-4 rounded-lg border border-border">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Monthly Context</h3>
        <p className="text-text-primary italic">"{headsup.description}"</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="space-y-4">
        <div>
          <label className="label">Weekly Focus</label>
          <textarea
            className="input w-full min-h-[100px]"
            placeholder="What is the main focus for this week? (e.g., Complete AWS configuration)"
            value={weekFocus}
            onChange={(e) => setWeekFocus(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Weekly Plan'}</span>
        </button>
      </div>
    </div>
  );
};
