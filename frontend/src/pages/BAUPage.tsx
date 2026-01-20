import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { BAUActivity, BAUActivityDetail, BAUMetric } from '../types';
import { Plus, Activity, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';

export const BAUPage: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<BAUActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<BAUActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showEditMetricModal, setShowEditMetricModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<BAUMetric | null>(null);
  const [editMetricForm, setEditMetricForm] = useState({
    name: '',
    target_value: '',
    unit: '',
    weight: '1.0',
    is_higher_better: true,
  });
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<BAUActivity | null>(null);

  const [activityForm, setActivityForm] = useState({ name: '', description: '' });
  const [editActivityForm, setEditActivityForm] = useState({ name: '', description: '', is_active: true });
  const [metricForm, setMetricForm] = useState({
    name: '',
    target_value: '',
    unit: '',
    weight: '1.0',
    is_higher_better: true,
  });
  const [updateValue, setUpdateValue] = useState('');

  useEffect(() => {
    loadActivities();
  }, [user]);

  const loadActivities = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getTeamBAUActivities(user.team_id);
      setActivities(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load BAU activities');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityDetail = async (activityId: number) => {
    try {
      const data = await api.getBAUActivity(activityId);
      setSelectedActivity(data);
    } catch (err: any) {
      setError('Failed to load activity details');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.team_id) return;

    try {
      await api.createBAUActivity(user.team_id, activityForm);
      setSuccess('BAU Activity created successfully');
      setShowActivityModal(false);
      setActivityForm({ name: '', description: '' });
      loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create activity');
    }
  };

  const handleEditActivity = (activity: BAUActivity) => {
    setSelectedActivityForEdit(activity);
    setEditActivityForm({
      name: activity.name,
      description: activity.description || '',
      is_active: activity.is_active
    });
    setShowEditActivityModal(true);
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityForEdit) return;

    try {
      await api.updateBAUActivity(selectedActivityForEdit.id, editActivityForm);
      setSuccess('BAU Activity updated successfully');
      setShowEditActivityModal(false);
      setSelectedActivityForEdit(null);
      setEditActivityForm({ name: '', description: '', is_active: true });
      loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update activity');
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this BAU activity? This will also delete all associated metrics.')) {
      return;
    }

    try {
      await api.deleteBAUActivity(activityId);
      setSuccess('BAU Activity deleted successfully');
      loadActivities();
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete activity');
    }
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    try {
      await api.createBAUMetric(selectedActivity.id, {
        ...metricForm,
        target_value: parseFloat(metricForm.target_value),
        weight: parseFloat(metricForm.weight),
      });
      setSuccess('Metric added successfully');
      setShowMetricModal(false);
      setMetricForm({
        name: '',
        target_value: '',
        unit: '',
        weight: '1.0',
        is_higher_better: true,
      });
      loadActivityDetail(selectedActivity.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add metric');
    }
  };

  const handleUpdateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetric) return;

    try {
      await api.updateBAUMetric(selectedMetric.id, {
        current_value: parseFloat(updateValue),
      });
      setSuccess('Metric updated successfully');
      setShowUpdateModal(false);
      setUpdateValue('');
      setSelectedMetric(null);
      if (selectedActivity) {
        loadActivityDetail(selectedActivity.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update metric');
    }
  };

  const openUpdateModal = (metric: BAUMetric) => {
    setSelectedMetric(metric);
    setUpdateValue(metric.current_value);
    setShowUpdateModal(true);
  };

  const openEditMetricModal = (metric: BAUMetric) => {
    setSelectedMetric(metric);
    setEditMetricForm({
      name: metric.name,
      target_value: metric.target_value,
      unit: metric.unit || '',
      weight: metric.weight.toString(),
      is_higher_better: metric.is_higher_better,
    });
    setShowEditMetricModal(true);
  };

  const handleEditMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetric) return;

    try {
      await api.updateBAUMetric(selectedMetric.id, {
        ...editMetricForm,
        target_value: parseFloat(editMetricForm.target_value),
        weight: parseFloat(editMetricForm.weight),
      });
      setSuccess('Metric updated successfully');
      setShowEditMetricModal(false);
      setSelectedMetric(null);
      setEditMetricForm({
        name: '',
        target_value: '',
        unit: '',
        weight: '1.0',
        is_higher_better: true,
      });
      if (selectedActivity) {
        loadActivityDetail(selectedActivity.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update metric');
    }
  };

  const handleDeleteMetric = async (metricId: number) => {
    if (!confirm('Are you sure you want to delete this metric? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteBAUMetric(metricId);
      setSuccess('Metric deleted successfully');
      if (selectedActivity) {
        loadActivityDetail(selectedActivity.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete metric');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">BAU Activities</h1>
            <p className="text-text-secondary mt-1">Business As Usual operational metrics</p>
          </div>
          <button
            onClick={() => setShowActivityModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Activity</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Activity List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="card cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => loadActivityDetail(activity.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.is_active ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-500/10 dark:bg-gray-500/20 text-text-secondary'
                  }`}>
                    {activity.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditActivity(activity);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                      title="Edit activity"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActivity(activity.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto text-text-secondary" size={48} />
            <h3 className="mt-4 text-lg font-medium text-text-primary">No BAU activities yet</h3>
            <p className="mt-2 text-text-secondary">Get started by creating your first activity</p>
          </div>
        )}

        {/* Activity Detail Modal */}
        {selectedActivity && (
          <Modal
            isOpen={!!selectedActivity}
            onClose={() => setSelectedActivity(null)}
            title={selectedActivity.name}
            size="lg"
          >
            <div className="space-y-4">
              {selectedActivity.description && (
                <p className="text-text-secondary">{selectedActivity.description}</p>
              )}

              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-text-primary">Metrics</h3>
                <button
                  onClick={() => setShowMetricModal(true)}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Metric</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedActivity.metrics.length === 0 ? (
                  <p className="text-text-secondary text-sm">No metrics yet</p>
                ) : (
                  selectedActivity.metrics.map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-text-primary">{metric.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                            <span>Current: {metric.current_value} {metric.unit}</span>
                            <span>Target: {metric.target_value} {metric.unit}</span>
                            <span>Weight: {metric.weight}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {metric.is_higher_better ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-blue-600" />
                          )}
                          <button
                            onClick={() => openUpdateModal(metric)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium px-2 py-1 rounded hover:bg-primary-50"
                            title="Update current value"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => openEditMetricModal(metric)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                            title="Edit metric settings"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMetric(metric.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                            title="Delete metric"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            calculateMetricProgress(metric) >= 100 ? 'bg-green-600 dark:bg-green-500' :
                            calculateMetricProgress(metric) >= 75 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-red-600 dark:bg-red-500'
                          }`}
                          style={{ width: `${Math.min(calculateMetricProgress(metric), 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Create Activity Modal */}
        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title="Create BAU Activity"
        >
          <form onSubmit={handleCreateActivity} className="space-y-4">
            <div>
              <label className="label">Activity Name</label>
              <input
                type="text"
                required
                className="input"
                value={activityForm.name}
                onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                placeholder="e.g., Incident Management"
              />
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input"
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Describe the activity..."
              />
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowActivityModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Create Activity
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Activity Modal */}
        <Modal
          isOpen={showEditActivityModal}
          onClose={() => setShowEditActivityModal(false)}
          title="Edit BAU Activity"
        >
          <form onSubmit={handleUpdateActivity} className="space-y-4">
            <div>
              <label className="label">Activity Name</label>
              <input
                type="text"
                required
                className="input"
                value={editActivityForm.name}
                onChange={(e) => setEditActivityForm({ ...editActivityForm, name: e.target.value })}
                placeholder="e.g., Incident Management"
              />
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input"
                rows={3}
                value={editActivityForm.description}
                onChange={(e) => setEditActivityForm({ ...editActivityForm, description: e.target.value })}
                placeholder="Describe the activity..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editActivityForm.is_active}
                onChange={(e) => setEditActivityForm({ ...editActivityForm, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <label htmlFor="edit_is_active" className="text-sm text-text-secondary">
                Activity is active
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowEditActivityModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Update Activity
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Metric Modal */}
        <Modal
          isOpen={showMetricModal}
          onClose={() => setShowMetricModal(false)}
          title="Add Metric"
        >
          <form onSubmit={handleCreateMetric} className="space-y-4">
            <div>
              <label className="label">Metric Name</label>
              <input
                type="text"
                required
                className="input"
                value={metricForm.name}
                onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
                placeholder="e.g., SLA Adherence"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Target Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={metricForm.target_value}
                  onChange={(e) => setMetricForm({ ...metricForm, target_value: e.target.value })}
                  placeholder="95"
                />
              </div>

              <div>
                <label className="label">Unit</label>
                <input
                  type="text"
                  className="input"
                  value={metricForm.unit}
                  onChange={(e) => setMetricForm({ ...metricForm, unit: e.target.value })}
                  placeholder="e.g., %, mins"
                />
              </div>
            </div>

            <div>
              <label className="label">Weight (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                required
                className="input"
                value={metricForm.weight}
                onChange={(e) => setMetricForm({ ...metricForm, weight: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_higher_better"
                checked={metricForm.is_higher_better}
                onChange={(e) => setMetricForm({ ...metricForm, is_higher_better: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <label htmlFor="is_higher_better" className="text-sm text-text-secondary">
                Higher values are better
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowMetricModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Add Metric
              </button>
            </div>
          </form>
        </Modal>

        {/* Update Metric Modal */}
        <Modal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title="Update Metric Value"
        >
          <form onSubmit={handleUpdateMetric} className="space-y-4">
            {selectedMetric && (
              <>
                <div>
                  <p className="text-sm text-text-secondary mb-2">{selectedMetric.name}</p>
                  <p className="text-sm text-text-secondary">
                    Target: {selectedMetric.target_value} {selectedMetric.unit}
                  </p>
                </div>

                <div>
                  <label className="label">Current Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder="Enter current value"
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowUpdateModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Update
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Metric Modal */}
        <Modal
          isOpen={showEditMetricModal}
          onClose={() => setShowEditMetricModal(false)}
          title="Edit Metric"
        >
          <form onSubmit={handleEditMetric} className="space-y-4">
            <div>
              <label className="label">Metric Name</label>
              <input
                type="text"
                required
                className="input"
                value={editMetricForm.name}
                onChange={(e) => setEditMetricForm({ ...editMetricForm, name: e.target.value })}
                placeholder="e.g., SLA Adherence"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Target Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={editMetricForm.target_value}
                  onChange={(e) => setEditMetricForm({ ...editMetricForm, target_value: e.target.value })}
                  placeholder="95"
                />
              </div>

              <div>
                <label className="label">Unit</label>
                <input
                  type="text"
                  className="input"
                  value={editMetricForm.unit}
                  onChange={(e) => setEditMetricForm({ ...editMetricForm, unit: e.target.value })}
                  placeholder="e.g., %, mins"
                />
              </div>
            </div>

            <div>
              <label className="label">Weight (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                required
                className="input"
                value={editMetricForm.weight}
                onChange={(e) => setEditMetricForm({ ...editMetricForm, weight: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_metric_is_higher_better"
                checked={editMetricForm.is_higher_better}
                onChange={(e) => setEditMetricForm({ ...editMetricForm, is_higher_better: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <label htmlFor="edit_metric_is_higher_better" className="text-sm text-text-secondary">
                Higher values are better
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowEditMetricModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Update Metric
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

const calculateMetricProgress = (metric: BAUMetric): number => {
  const current = parseFloat(metric.current_value);
  const target = parseFloat(metric.target_value);
  
  if (target === 0) return 0;
  
  if (metric.is_higher_better) {
    return (current / target) * 100;
  } else {
    return (target / current) * 100;
  }
};

