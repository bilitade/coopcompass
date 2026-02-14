import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { OKRDetail, KeyResult } from '../../../shared/types';
import { ArrowLeft, Save, TrendingUp } from 'lucide-react';

export const OKRMeasurementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [okr, setOkr] = useState<OKRDetail | null>(null);
  const [measurements, setMeasurements] = useState<Record<number, string>>({});

  useEffect(() => {
    if (id) {
      loadOKR();
    }
  }, [id]);

  const loadOKR = async () => {
    try {
      const data = await api.getOKR(parseInt(id!));
      setOkr(data);
      
      // Initialize measurements with current values
      const initial: Record<number, string> = {};
      data.key_results.forEach(kr => {
        initial[kr.id] = kr.current_value;
      });
      setMeasurements(initial);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load OKR');
    } finally {
      setLoading(false);
    }
  };

  const updateMeasurement = (krId: number, value: string) => {
    setMeasurements({ ...measurements, [krId]: value });
  };

  const calculateScore = (kr: KeyResult, currentValue: number): number => {
    const base = parseFloat(kr.base_value);
    const target = parseFloat(kr.target_value);
    
    if (target === base) return 0;
    return Math.max(0, Math.min(1, (currentValue - base) / (target - base)));
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number): string => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    try {
      // Update each key result with its new current value
      for (const kr of okr!.key_results) {
        const newValue = parseFloat(measurements[kr.id]);
        if (!isNaN(newValue)) {
          await api.updateKeyResult(kr.id, {
            description: kr.description,
            base_value: parseFloat(kr.base_value),
            target_value: parseFloat(kr.target_value),
            unit: kr.unit,
            weight: parseFloat(kr.weight),
            current_value: newValue,
          });
        }
      }
      
      setSuccess('Measurements saved successfully!');
      await loadOKR(); // Reload to get updated values
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save measurements');
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!okr) {
    return (
      <Layout>
        <Alert type="error" message="OKR not found" />
      </Layout>
    );
  }

  const totalScore = okr.key_results.reduce((sum, kr) => {
    const currentValue = parseFloat(measurements[kr.id] || kr.current_value);
    const score = calculateScore(kr, currentValue);
    return sum + (score * parseFloat(kr.weight));
  }, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/okrs')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to OKRs</span>
          </button>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Update Measurements</h1>
          <p className="text-text-secondary">Track progress by updating current values</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* OKR Info Card */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {okr.okr_level}
            </span>
            <span className="text-sm text-text-secondary">
              {okr.quarters} {okr.year}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">{okr.objective}</h2>
          {okr.description && (
            <p className="text-sm text-text-secondary">{okr.description}</p>
          )}
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp size={24} className="text-primary" />
              Overall Progress
            </h3>
            <span className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
              {(totalScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${getProgressColor(totalScore)}`}
              style={{ width: `${Math.min(totalScore * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Key Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Key Results</h3>
          
          {okr.key_results.map((kr, idx) => {
            const currentValue = parseFloat(measurements[kr.id] || kr.current_value);
            const score = calculateScore(kr, currentValue);
            const weight = parseFloat(kr.weight);

            return (
              <div key={kr.id} className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary mb-1">
                      KR {idx + 1}: {kr.description}
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Weight: {(weight * 100).toFixed(0)}% • 
                      Base: {kr.base_value}{kr.unit} • 
                      Target: {kr.target_value}{kr.unit}
                    </p>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(score)}`}
                      style={{ width: `${Math.min(score * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-text-primary">Current Value:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={measurements[kr.id] || ''}
                    onChange={(e) => updateMeasurement(kr.id, e.target.value)}
                    className="input flex-1 max-w-xs"
                    placeholder="Enter current value"
                  />
                  <span className="text-sm text-text-secondary">{kr.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => navigate('/okrs')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Measurements
          </button>
        </div>
      </div>
    </Layout>
  );
};

