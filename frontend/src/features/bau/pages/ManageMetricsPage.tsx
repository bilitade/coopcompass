import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { api } from '../../../shared/services/api';
import type { BAUActivityDetail } from '../../../shared/types';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

interface MetricFormData {
  id?: number;
  name: string;
  target_value: string;
  current_value: string;
  unit: string;
  weight: string;
  metric_type: 'Higher is Better' | 'Lower is Better';
  isNew?: boolean;
}

export const ManageMetricsPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState<BAUActivityDetail | null>(null);
  const [metrics, setMetrics] = useState<MetricFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  useEffect(() => {
    validateWeights();
  }, [metrics]);

  const loadActivity = async () => {
    if (!activityId) return;

    try {
      const data = await api.getBAUActivity(parseInt(activityId));
      setActivity(data);
      
      // Convert existing metrics to form data
      const formMetrics: MetricFormData[] = data.metrics.map(m => ({
        id: m.id,
        name: m.name,
        target_value: m.target_value.toString(),
        current_value: m.current_value.toString(),
        unit: m.unit || '',
        weight: m.weight.toString(),
        metric_type: m.metric_type,
        isNew: false,
      }));
      
      setMetrics(formMetrics);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const validateWeights = () => {
    const totalWeight = metrics.reduce((sum, m) => sum + (parseFloat(m.weight) || 0), 0);
    const diff = Math.abs(totalWeight - 1.0);
    
    if (diff > 0.01 && metrics.length > 0) {
      setValidationWarning(`⚠️ Weights should sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
    } else {
      setValidationWarning('');
    }
  };

  const addMetric = () => {
    const newMetric: MetricFormData = {
      name: '',
      target_value: '100',
      current_value: '0',
      unit: '',
      weight: metrics.length === 0 ? '1.0' : '0.5',
      metric_type: 'Higher is Better',
      isNew: true,
    };
    setMetrics([...metrics, newMetric]);
  };

  const updateMetric = (index: number, field: keyof MetricFormData, value: string) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: value };
    setMetrics(updated);
  };

  const deleteMetric = (index: number) => {
    const updated = metrics.filter((_, i) => i !== index);
    setMetrics(updated);
  };

  const handleSave = async () => {
    // Validate
    const totalWeight = metrics.reduce((sum, m) => sum + (parseFloat(m.weight) || 0), 0);
    const diff = Math.abs(totalWeight - 1.0);
    
    if (diff > 0.01 && metrics.length > 0) {
      setError(`Weights must sum to 1.0 (currently ${totalWeight.toFixed(2)}). Please adjust weights before saving.`);
      return;
    }

    // Validate required fields
    for (let i = 0; i < metrics.length; i++) {
      const m = metrics[i];
      if (!m.name.trim()) {
        setError(`Metric ${i + 1}: Name is required`);
        return;
      }
      if (!m.target_value || isNaN(parseFloat(m.target_value))) {
        setError(`Metric ${i + 1}: Valid target value is required`);
        return;
      }
      if (!m.weight || isNaN(parseFloat(m.weight))) {
        setError(`Metric ${i + 1}: Valid weight is required`);
        return;
      }
    }

    setSaving(true);
    setError('');
    
    try {
      // 1. Delete metrics that were removed
      const existingIds = metrics.filter(m => !m.isNew).map(m => m.id);
      const originalIds = activity?.metrics.map(m => m.id) || [];
      const toDelete = originalIds.filter(id => !existingIds.includes(id));
      
      for (const id of toDelete) {
        await api.deleteBAUMetric(id!);
      }

      // 2. Create new metrics
      const newMetrics = metrics.filter(m => m.isNew);
      for (const metric of newMetrics) {
        await api.createBAUMetric(parseInt(activityId!), {
          name: metric.name,
          target_value: parseFloat(metric.target_value),
          current_value: parseFloat(metric.current_value),
          unit: metric.unit,
          weight: parseFloat(metric.weight),
          metric_type: metric.metric_type,
        });
      }

      // 3. Update existing metrics
      const existingMetrics = metrics.filter(m => !m.isNew);
      for (const metric of existingMetrics) {
        await api.updateBAUMetric(metric.id!, {
          name: metric.name,
          target_value: parseFloat(metric.target_value),
          current_value: parseFloat(metric.current_value),
          unit: metric.unit,
          weight: parseFloat(metric.weight),
          metric_type: metric.metric_type,
        });
      }

      setSuccess('Metrics saved successfully!');
      // Reload the activity to show updated metrics
      loadActivity();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Failed to save metrics';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!activity) return <Layout><Alert type="error" message="Activity not found" /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/bau-activities')}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              title="Back to BAU Activities"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Manage Metrics</h1>
              <p className="text-text-secondary mt-1">{activity.name}</p>
            </div>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
        
        {validationWarning && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">{validationWarning}</span>
          </div>
        )}

        {/* Metrics Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Metric Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                      No metrics yet. Click "Add Metric" to create one.
                    </td>
                  </tr>
                ) : (
                  metrics.map((metric, index) => (
                    <tr key={index} className="hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className="input w-full"
                          value={metric.name}
                          onChange={(e) => updateMetric(index, 'name', e.target.value)}
                          placeholder="e.g., Response Time"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          className="input w-24"
                          value={metric.target_value}
                          onChange={(e) => updateMetric(index, 'target_value', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          className="input w-24"
                          value={metric.current_value}
                          onChange={(e) => updateMetric(index, 'current_value', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className="input w-20"
                          value={metric.unit}
                          onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                          placeholder="%, ms"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="input w-20"
                          value={metric.weight}
                          onChange={(e) => updateMetric(index, 'weight', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="input w-36"
                          value={metric.metric_type}
                          onChange={(e) => updateMetric(index, 'metric_type', e.target.value as any)}
                        >
                          <option value="Higher is Better">
                            Higher is Better
                          </option>
                          <option value="Lower is Better">
                            Lower is Better
                          </option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteMetric(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete metric"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={addMetric}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Metric</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/bau-activities')}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center space-x-2"
              disabled={saving || metrics.length === 0}
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Metrics'}</span>
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="text-sm text-text-secondary bg-surface-hover p-4 rounded-lg">
          <p className="font-medium mb-2">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Weights must sum to 1.0 across all metrics</li>
            <li>Use "Higher is Better" for metrics like revenue, uptime, completion rate</li>
            <li>Use "Lower is Better" for metrics like response time, error rate, cost</li>
            <li>You can add multiple metrics and adjust weights before saving</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

