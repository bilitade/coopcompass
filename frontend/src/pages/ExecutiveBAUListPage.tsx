import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Breadcrumb } from '../components/Breadcrumb';
import { Activity, TrendingUp, Users, Building2 } from 'lucide-react';

interface BAUWithContext {
  activity_id: number;
  activity_name: string;
  team_id: number;
  team_name: string;
  department_id: number;
  department_name: string;
  health: number;
  execution: number;
  metrics_count: number;
  is_active: boolean;
}

export const ExecutiveBAUListPage: React.FC = () => {
  const { user } = useAuth();
  const [bauActivities, setBauActivities] = useState<BAUWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchExecutiveBAU();
  }, [user]);

  const fetchExecutiveBAU = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
        setError('Only executives and admins can access this page');
        return;
      }

      // Get all departments
      const allDepartments = await api.getDepartments();
      setDepartments(allDepartments);

      const allBAU: BAUWithContext[] = [];

      // Fetch BAU from all departments
      for (const dept of allDepartments) {
        try {
          const teams = await api.getDepartmentTeams(dept.id);

          for (const team of teams) {
            try {
              const teamBAU = await api.getTeamBAUActivities(team.id);

              for (const activity of teamBAU) {
                // Get activity health and execution
                const bauHealth = await api.getBAUHealth(activity.id);
                const bauExecution = await api.getBAUExecution(activity.id);

                allBAU.push({
                  activity_id: activity.id,
                  activity_name: activity.name,
                  team_id: team.id,
                  team_name: team.name,
                  department_id: dept.id,
                  department_name: dept.name,
                  health: bauHealth.health || 0,
                  execution: bauExecution || 0,
                  metrics_count: bauHealth.metrics?.length || 0,
                  is_active: activity.is_active,
                });
              }
            } catch (teamErr) {
              console.error(`Error fetching BAU for team ${team.id}:`, teamErr);
            }
          }
        } catch (deptErr) {
          console.error(`Error fetching teams for dept ${dept.id}:`, deptErr);
        }
      }

      setBauActivities(allBAU);
    } catch (err: any) {
      console.error('Error fetching executive BAU:', err);
      setError(err.response?.data?.detail || 'Failed to load BAU activities');
    } finally {
      setLoading(false);
    }
  };

  // Filter BAU
  const filteredBAU = selectedDepartment === 'All'
    ? bauActivities
    : bauActivities.filter(activity => activity.department_name === selectedDepartment);

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

  if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
    return (
      <Layout>
        <Alert type="error" message="Only executives and admins can access this page" />
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
        <Breadcrumb items={[{ label: 'Organization' }, { label: 'BAU Activities' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            Organization BAU Activities
          </h1>
        </div>

        {/* Filters */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-surface text-text-primary min-w-[200px]"
          >
            <option value="All">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* BAU List */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {filteredBAU.length === 0 ? (
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
                        <Building2 size={18} />
                        Department
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
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center justify-center gap-2">
                        <Activity size={18} />
                        Execution
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBAU.map((activity) => (
                    <tr
                      key={activity.activity_id}
                      className="border-b border-border hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-text-primary">{activity.activity_name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{activity.department_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-text-secondary" />
                          <span className="text-text-primary">{activity.team_name}</span>
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
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${getHealthBgColor(activity.execution)}`}
                              style={{ width: `${activity.execution}%` }}
                            />
                          </div>
                          <span className={`font-bold text-sm w-12 text-right ${getHealthColor(activity.execution)}`}>
                            {activity.execution.toFixed(0)}%
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
        {filteredBAU.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total Activities</p>
              <p className="text-2xl font-bold text-text-primary">{filteredBAU.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Departments</p>
              <p className="text-2xl font-bold text-primary">
                {new Set(filteredBAU.map(a => a.department_name)).size}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Active Activities</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredBAU.filter(a => a.is_active).length}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Avg Health</p>
              <p className={`text-2xl font-bold ${getHealthColor(
                filteredBAU.reduce((sum, a) => sum + a.health, 0) / filteredBAU.length
              )}`}>
                {(filteredBAU.reduce((sum, a) => sum + a.health, 0) / filteredBAU.length).toFixed(0)}%
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total Metrics</p>
              <p className="text-2xl font-bold text-text-primary">
                {filteredBAU.reduce((sum, a) => sum + a.metrics_count, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

