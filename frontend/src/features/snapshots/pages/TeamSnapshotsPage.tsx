import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';
import type { WeeklySnapshot, SnapshotTrend } from '../../../shared/types';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { Plus, FileText, Trash2 } from 'lucide-react';

export const TeamSnapshotsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [trends, setTrends] = useState<SnapshotTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState<WeeklySnapshot | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSnapshots();
      fetchTrends();
    }
  }, [id]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTeamSnapshots(parseInt(id!));
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
      const data = await api.getSnapshotTrends(parseInt(id!), undefined, 4);
      // Sort by week descending (latest first) and take first 4
      const sortedTrends = [...data]
        .sort((a, b) => b.week.localeCompare(a.week))
        .slice(0, 4)
        .reverse(); // Reverse to show oldest to newest (left to right)
      setTrends(sortedTrends);
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

  const handleDeleteClick = (snapshot: WeeklySnapshot, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    setSnapshotToDelete(snapshot);
  };

  const handleDeleteConfirm = async () => {
    if (!snapshotToDelete) return;
    
    try {
      setDeleting(true);
      await api.deleteSnapshot(snapshotToDelete.id);
      setSnapshotToDelete(null);
      fetchSnapshots();
      fetchTrends();
    } catch (err: any) {
      setError('Failed to delete snapshot');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setSnapshotToDelete(null);
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

        {/* Trends Chart */}
        {trends.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Performance Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OKR Score Chart */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-4">OKR Score (Latest 4 Weeks)</h3>
                <div className="relative" style={{ height: '256px' }}>
                  {/* Y-axis labels - positioned to align with chart grid */}
                  {/* Chart area is 216px, 0% at baseline (border), 100% at top */}
                  <div className="absolute left-0 w-8" style={{ height: '216px', top: '0px' }}>
                    <div className="relative h-full">
                      {/* Labels positioned to match bar heights exactly */}
                      <span className="absolute text-xs text-text-secondary" style={{ top: '0px', right: '4px' }}>100%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '54px', right: '4px' }}>75%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '108px', right: '4px' }}>50%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '162px', right: '4px' }}>25%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ bottom: '0px', right: '4px' }}>0%</span>
                    </div>
                  </div>
                  {/* Chart area - bars align to bottom at baseline (border) */}
                  <div className="ml-10 flex items-end justify-center space-x-2 border-b border-border" style={{ height: '216px', alignItems: 'flex-end' }}>
                    {trends.map((trend, idx) => {
                      // OKR score comes as 0.0-1.0 from backend, convert to percentage
                      const okrScore = trend.okr_score !== null && trend.okr_score !== undefined 
                        ? (typeof trend.okr_score === 'number' ? trend.okr_score : parseFloat(String(trend.okr_score)))
                        : null;
                      const okrValue = okrScore !== null ? okrScore * 100 : 0;
                      // Calculate bar height in pixels (chart area is 216px)
                      const chartAreaHeight = 216;
                      const barHeightPx = (okrValue / 100) * chartAreaHeight;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '100%' }}>
                          {/* Value label above bar - always visible */}
                          <div className="mb-1 text-xs font-medium text-text-primary whitespace-nowrap">
                            {okrValue > 0 ? `${okrValue.toFixed(1)}%` : 'N/A'}
                          </div>
                          {/* Bar - aligned to bottom */}
                          <div
                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative"
                            style={{
                              height: `${barHeightPx}px`,
                              minHeight: okrValue > 0 ? '4px' : '0px',
                              maxHeight: `${chartAreaHeight}px`,
                              alignSelf: 'flex-end'
                            }}
                            title={`Week ${trend.week}: ${okrValue > 0 ? `${okrValue.toFixed(1)}%` : 'N/A'}`}
                          >
                            {/* Value inside bar if there's space */}
                            {okrValue > 15 && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                {okrValue.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* X-axis labels - positioned below chart area */}
                  <div className="ml-10 flex justify-center space-x-2 mt-2">
                    {trends.map((trend, idx) => (
                      <div key={idx} className="flex-1 flex justify-center">
                        <span className="text-xs text-text-secondary text-center">
                          W{trend.week.split('-W')[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* BAU Health Chart */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-4">BAU Health (Latest 4 Weeks)</h3>
                <div className="relative" style={{ height: '256px' }}>
                  {/* Y-axis labels - positioned to align with chart grid */}
                  {/* Chart area is 216px, 0% at baseline (border), 100% at top */}
                  <div className="absolute left-0 w-8" style={{ height: '216px', top: '0px' }}>
                    <div className="relative h-full">
                      {/* Labels positioned to match bar heights exactly */}
                      <span className="absolute text-xs text-text-secondary" style={{ top: '0px', right: '4px' }}>100%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '54px', right: '4px' }}>75%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '108px', right: '4px' }}>50%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ top: '162px', right: '4px' }}>25%</span>
                      <span className="absolute text-xs text-text-secondary" style={{ bottom: '0px', right: '4px' }}>0%</span>
                    </div>
                  </div>
                  {/* Chart area - bars align to bottom at baseline (border) */}
                  <div className="ml-10 flex items-end justify-center space-x-2 border-b border-border" style={{ height: '216px', alignItems: 'flex-end' }}>
                    {trends.map((trend, idx) => {
                      // BAU health is already 0-100 percentage from backend
                      const bauHealth = trend.bau_health !== null && trend.bau_health !== undefined
                        ? (typeof trend.bau_health === 'number' ? trend.bau_health : parseFloat(String(trend.bau_health)))
                        : null;
                      const bauValue = bauHealth !== null ? bauHealth : 0;
                      // Calculate bar height in pixels (chart area is 216px)
                      const chartAreaHeight = 216;
                      const barHeightPx = (bauValue / 100) * chartAreaHeight;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '100%' }}>
                          {/* Value label above bar - always visible */}
                          <div className="mb-1 text-xs font-medium text-text-primary whitespace-nowrap">
                            {bauValue > 0 ? `${bauValue.toFixed(1)}%` : 'N/A'}
                          </div>
                          {/* Bar - aligned to bottom */}
                          <div
                            className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors relative"
                            style={{
                              height: `${barHeightPx}px`,
                              minHeight: bauValue > 0 ? '4px' : '0px',
                              maxHeight: `${chartAreaHeight}px`,
                              alignSelf: 'flex-end'
                            }}
                            title={`Week ${trend.week}: ${bauValue > 0 ? `${bauValue.toFixed(1)}%` : 'N/A'}`}
                          >
                            {/* Value inside bar if there's space */}
                            {bauValue > 15 && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                {bauValue.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* X-axis labels - positioned below chart area */}
                  <div className="ml-10 flex justify-center space-x-2 mt-2">
                    {trends.map((trend, idx) => (
                      <div key={idx} className="flex-1 flex justify-center">
                        <span className="text-xs text-text-secondary text-center">
                          W{trend.week.split('-W')[1]}
                        </span>
                      </div>
                    ))}
                  </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Details
                    </th>
                    {(user?.role === 'lead' || user?.role === 'admin') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {snapshots.map((snapshot) => (
                    <tr 
                      key={snapshot.id}
                      className="hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => navigate(`/teams/${id}/snapshots/${snapshot.week}`)}
                    >
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
                        {snapshot.work_items_count_completed} / {snapshot.work_items_count_planned}
                        {snapshot.work_items_completion_rate !== null && snapshot.work_items_completion_rate !== undefined && (
                          <span className="ml-2 text-xs">
                            ({typeof snapshot.work_items_completion_rate === 'number' 
                              ? snapshot.work_items_completion_rate.toFixed(1) 
                              : parseFloat(String(snapshot.work_items_completion_rate)).toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {snapshot.tasks_count_completed} / {snapshot.tasks_count_planned}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teams/${id}/snapshots/${snapshot.week}`);
                          }}
                          className="btn btn-secondary text-sm px-3 py-1"
                        >
                          <FileText size={16} className="mr-1" />
                          View Details
                        </button>
                      </td>
                      {(user?.role === 'lead' || user?.role === 'admin') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => handleDeleteClick(snapshot, e)}
                            className="btn btn-danger text-sm px-3 py-1"
                            title="Delete snapshot"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {snapshotToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Delete Snapshot</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete the snapshot for week <strong>{snapshotToDelete.week}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="btn btn-danger"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

