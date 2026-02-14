import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import type { MonthlyHeadsUp } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Save, Calendar } from 'lucide-react';

interface MonthlyPlanningProps {
  teamId: number;
  month: string;
  onSaved?: (headsup: MonthlyHeadsUp) => void;
}

export const MonthlyPlanning: React.FC<MonthlyPlanningProps> = ({ teamId, month, onSaved }) => {
  const [description, setDescription] = useState('');
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadHeadsUp();
  }, [teamId, month]);

  const loadHeadsUp = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlyHeadsUp(teamId, month);
      setHeadsup(data);
      setDescription(data.description);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHeadsup(null);
        setDescription('');
      } else {
        setError('Failed to load monthly heads-up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Calendar size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Monthly Heads-Up</h2>
          <p className="text-sm text-text-secondary">Set the primary focus and goals for {month}</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="space-y-4">
        <div>
          <label className="label">Monthly Focus / High-level Goal</label>
          <textarea
            className="input w-full min-h-[150px]"
            placeholder="What is the main objective for this month? (e.g., Focus on cloud migration and stability)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Monthly Plan'}</span>
        </button>
      </div>
    </div>
  );
};
