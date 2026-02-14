import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { BAUActivity } from '../../../shared/types';
import { Plus, Settings, Trash2, Activity as ActivityIcon, Edit, Save, X } from 'lucide-react';

export const BAUActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<BAUActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

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

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.team_id || !newActivityName.trim()) return;

    try {
      await api.createBAUActivity(user.team_id, {
        name: newActivityName,
        description: newActivityDescription || undefined,
      });
      setSuccess('BAU Activity created successfully');
      setNewActivityName('');
      setNewActivityDescription('');
      loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create activity');
    }
  };

  const handleDeleteActivity = async (activityId: number, activityName: string) => {
    if (!confirm(`Are you sure you want to delete "${activityName}"? This will also delete all associated metrics.`)) {
      return;
    }

    try {
      await api.deleteBAUActivity(activityId);
      setSuccess('BAU Activity deleted successfully');
      loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete activity');
    }
  };

  const startEditing = (activity: BAUActivity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditDescription(activity.description || '');
    setEditIsActive(activity.is_active);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditIsActive(true);
  };

  const handleUpdateActivity = async (activityId: number) => {
    if (!editName.trim()) {
      setError('Activity name is required');
      return;
    }

    try {
      await api.updateBAUActivity(activityId, {
        name: editName,
        description: editDescription || undefined,
        is_active: editIsActive,
      });
      setSuccess('BAU Activity updated successfully');
      cancelEditing();
      loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update activity');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">BAU Activities</h1>
          <p className="text-text-secondary mt-1">Business As Usual operational activities and metrics</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Create New Activity Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create New Activity</h2>
          <form onSubmit={handleCreateActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Activity Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="e.g., Customer Support, Incident Management"
                />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={newActivityDescription}
                  onChange={(e) => setNewActivityDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Plus size={20} />
                <span>Create Activity</span>
              </button>
            </div>
          </form>
        </div>

        {/* Activities List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Activities</h2>
          
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="mx-auto text-text-secondary/40" size={48} />
              <h3 className="mt-4 text-lg font-medium text-text-primary">No activities yet</h3>
              <p className="mt-2 text-text-secondary">Create your first BAU activity above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.map((activity) => {
                    const isEditing = editingId === activity.id;
                    
                    return (
                    <tr key={activity.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            className="input w-full"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Activity name"
                          />
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                              <ActivityIcon className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                            <div>
                              <div className="font-medium text-text-primary">{activity.name}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            className="input w-full"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                          />
                        ) : (
                          <span className="text-text-secondary">{activity.description || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select
                            className="input w-32"
                            value={editIsActive ? 'active' : 'inactive'}
                            onChange={(e) => setEditIsActive(e.target.value === 'active')}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.is_active 
                              ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
                              : 'bg-gray-500/10 text-text-secondary'
                          }`}>
                            {activity.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateActivity(activity.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Save changes"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/bau-activities/${activity.id}/metrics`)}
                              className="btn btn-sm btn-primary flex items-center space-x-1"
                              title="Manage metrics"
                            >
                              <Settings size={16} />
                              <span>Manage Metrics</span>
                            </button>
                            <button
                              onClick={() => startEditing(activity)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit activity"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id, activity.name)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete activity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

