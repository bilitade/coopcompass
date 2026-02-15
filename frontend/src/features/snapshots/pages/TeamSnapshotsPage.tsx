import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';
import type { WeeklySnapshot, SnapshotTrend } from '../../../shared/types';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { Plus } from 'lucide-react';

export const TeamSnapshotsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [trends, setTrends] = useState<SnapshotTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchSnapshots();
      fetchTrends();
    }
  }, [id, quarter]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTeamSnapshots(parseInt(id!), quarter || undefined);
      setSnapshots(data.snapshots);
    } catch (err: any) {
      console.error('Error fetching snapshots:', err);
      setError('Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const data = await api.getSnapshotTrends(parseInt(id!), quarter || undefined, 20);
      setTrends(data);
    } catch (err: any) {
      console.error('Error fetching trends:', err);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      await api.createSnapshot(parseInt(id!));
      fetchSnapshots();
      fetchTrends();
    } catch (err: any) {
      setError('Failed to create snapshot');
    }
  };

  const formatScore = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'N/A';
    const numValue = typeof score === 'number' ? score : parseFloat(String(score));
    if (isNaN(numValue)) return 'N/A';
    return (numValue * 100).toFixed(1) + '%';
  };

  const formatHealth = (health: number | null | undefined): string => {
    if (health === null || health === undefined) return 'N/A';
    const numValue = typeof health === 'number' ? health : parseFloat(String(health));
    if (isNaN(numValue)) return 'N/A';
    return numValue.toFixed(1) + '%';
  };

  const getStatusColor = (score: number | null | undefined, type: 'okr' | 'bau'): string => {
    if (score === null || score === undefined) return 'gray';
    const numValue = typeof score === 'number' ? score : parseFloat(String(score));
    if (isNaN(numValue)) return 'gray';
    if (type === 'okr') {
      if (numValue >= 0.7) return 'green';
      if (numValue >= 0.4) return 'yellow';
      return 'red';
    } else {
      if (numValue >= 95) return 'green';
      if (numValue >= 90) return 'green';
      if (numValue >= 85) return 'yellow';
      if (numValue >= 80) return 'yellow';
      return 'red';
    }
  };

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Performance Snapshots</h1>
            <p className="text-text-secondary mt-0.5">Historical tracking of team performance metrics</p>
          </div>
          {(user?.role === 'lead' || user?.role === 'admin') && (
            <button
              onClick={handleCreateSnapshot}
              className="btn btn-primary flex items-center space-x-2 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Create Snapshot</span>
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Filter */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Filter by Quarter (optional)
          </label>
          <input
            type="text"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="e.g., Q1 2026"
            className="w-full md:w-64 px-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Trends Chart */}
        {trends.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Performance Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">OKR Score</h3>
                <div className="h-48 flex items-end space-x-1">
                  {trends.map((trend, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{
                          height: trend.okr_score ? `${trend.okr_score * 100}%` : '0%',
                          minHeight: trend.okr_score ? '4px' : '0px'
                        }}
                        title={`Week ${trend.week}: ${formatScore(trend.okr_score)}`}
                      />
                      <span className="text-xs text-text-secondary mt-1 transform -rotate-45 origin-top-left">
                        {trend.week.split('-W')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">BAU Health</h3>
                <div className="h-48 flex items-end space-x-1">
                  {trends.map((trend, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-green-500 rounded-t"
                        style={{
                          height: trend.bau_health ? `${trend.bau_health}%` : '0%',
                          minHeight: trend.bau_health ? '4px' : '0px'
                        }}
                        title={`Week ${trend.week}: ${formatHealth(trend.bau_health)}`}
                      />
                      <span className="text-xs text-text-secondary mt-1 transform -rotate-45 origin-top-left">
                        {trend.week.split('-W')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Snapshots Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Weekly Snapshots</h2>
          </div>
          {snapshots.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No snapshots found. Create a snapshot to start tracking performance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      OKR Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      BAU Health
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Work Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Team Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {snapshots.map((snapshot) => (
                    <tr key={snapshot.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {snapshot.week}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            getStatusColor(snapshot.okr_objective_score, 'okr') === 'green'
                              ? 'bg-green-100 text-green-800'
                              : getStatusColor(snapshot.okr_objective_score, 'okr') === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {formatScore(snapshot.okr_objective_score)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            getStatusColor(snapshot.bau_overall_health, 'bau') === 'green'
                              ? 'bg-green-100 text-green-800'
                              : getStatusColor(snapshot.bau_overall_health, 'bau') === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {formatHealth(snapshot.bau_overall_health)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {snapshot.work_items_completed} / {snapshot.work_items_planned}
                        {snapshot.work_items_completion_rate !== null && snapshot.work_items_completion_rate !== undefined && (
                          <span className="ml-2 text-xs">
                            ({typeof snapshot.work_items_completion_rate === 'number' 
                              ? snapshot.work_items_completion_rate.toFixed(1) 
                              : parseFloat(String(snapshot.work_items_completion_rate)).toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {snapshot.tasks_completed} / {snapshot.tasks_planned}
                        {snapshot.tasks_completion_rate !== null && snapshot.tasks_completion_rate !== undefined && (
                          <span className="ml-2 text-xs">
                            ({typeof snapshot.tasks_completion_rate === 'number' 
                              ? snapshot.tasks_completion_rate.toFixed(1) 
                              : parseFloat(String(snapshot.tasks_completion_rate)).toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {snapshot.team_size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(snapshot.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

