import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Breadcrumb } from '../components/Breadcrumb';
import { Activity, TrendingUp, Users } from 'lucide-react';

interface BAUWithTeam {
  activity_id: number;
  activity_name: string;
  team_id: number;
  team_name: string;
  department_id?: number;
  department_name?: string;
  health: number;
  metrics_count: number;
  is_active: boolean;
}

export const DirectorBAUListPage: React.FC = () => {
  const { user } = useAuth();
  const [bauActivities, setBauActivities] = useState<BAUWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDirectorBAU();
  }, [user]);

  const fetchDirectorBAU = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || user.role !== 'director') {
        setError('Only directors can access this page');
        return;
      }

      // Find director's department
      const departments = await api.getDepartments();
      const directorDept = departments.find((d: any) => d.director_id === user.id);

      if (!directorDept) {
        setError('You are not assigned as a director to any department');
        return;
      }

      // Get all teams in the department
      const teams = await api.getDepartmentTeams(directorDept.id);

      // Fetch BAU activities for each team
      const allBAU: BAUWithTeam[] = [];

      for (const team of teams) {
        try {
          const teamBAU = await api.getTeamBAUActivities(team.id);

          for (const activity of teamBAU) {
            // Get activity health
            const bauHealth = await api.getBAUHealth(activity.id);

            allBAU.push({
              activity_id: activity.id,
              activity_name: activity.name,
              team_id: team.id,
              team_name: team.name,
              department_id: directorDept.id,
              department_name: directorDept.name,
              health: bauHealth.health || 0,
              metrics_count: bauHealth.metrics?.length || 0,
              is_active: activity.is_active,
            });
          }
        } catch (teamErr) {
          console.error(`Error fetching BAU for team ${team.id}:`, teamErr);
        }
      }

      setBauActivities(allBAU);
    } catch (err: any) {
      console.error('Error fetching director BAU:', err);
      setError(err.response?.data?.detail || 'Failed to load BAU activities');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 90) return 'bg-green-600';
    if (health >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (!user || user.role !== 'director') {
    return (
      <Layout>
        <Alert type="error" message="Only directors can access this page" />
      </Layout>
    );
  }

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  if (error) {
    return (
      <Layout>
        <Alert type="error" message={error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'My Department' }, { label: 'BAU Activities' }]} />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            Department BAU Activities
          </h1>
        </div>

        {/* BAU List */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {bauActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No BAU activities found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-hover border-b-2 border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Activity size={18} />
                        Activity Name
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Users size={18} />
                        Team
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Metrics</th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp size={18} />
                        Health
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bauActivities.map((activity) => (
                    <tr
                      key={activity.activity_id}
                      className="border-b border-border hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-text-primary">{activity.activity_name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{activity.team_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-text-secondary">{activity.metrics_count}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${getHealthBgColor(activity.health)}`}
                              style={{ width: `${activity.health}%` }}
                            />
                          </div>
                          <span className={`font-bold text-sm w-12 text-right ${getHealthColor(activity.health)}`}>
                            {activity.health.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {activity.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {bauActivities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total Activities</p>
              <p className="text-2xl font-bold text-text-primary">{bauActivities.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Active Activities</p>
              <p className="text-2xl font-bold text-green-600">
                {bauActivities.filter(a => a.is_active).length}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Avg Health</p>
              <p className={`text-2xl font-bold ${getHealthColor(
                bauActivities.reduce((sum, a) => sum + a.health, 0) / bauActivities.length
              )}`}>
                {(bauActivities.reduce((sum, a) => sum + a.health, 0) / bauActivities.length).toFixed(0)}%
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total Metrics</p>
              <p className="text-2xl font-bold text-text-primary">
                {bauActivities.reduce((sum, a) => sum + a.metrics_count, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

