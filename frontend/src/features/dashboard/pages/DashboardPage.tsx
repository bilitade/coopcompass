import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Building2, Users, TrendingUp, Activity, BarChart3, Shield } from 'lucide-react';

// Role indicator component
const RoleIndicator: React.FC<{ role: string }> = ({ role }) => {
  const roleColors: { [key: string]: { bg: string; text: string; icon: string } } = {
    lead: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: 'Team Lead' },
    director: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: 'Director' },
    executive: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: 'Executive' },
    admin: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: 'Administrator' },
  };

  const config = roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'User' };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}>
      <Shield size={16} />
      <span className="text-sm font-semibold capitalize">{config.icon}</span>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('User not authenticated');
        return;
      }

      let data;

      // Load based on user role
      if (user.role === 'executive' || user.role === 'admin') {
        // Load organization dashboard (both executive and admin can view)
        data = await api.getOrganizationDashboard();
      } else if (user.role === 'director') {
        // Load director's department
        const departments = await api.getDepartments();
        const directorDept = departments.find((d: any) => d.director_id === user.id);
        
        if (!directorDept) {
          setError('You are not assigned as a director to any department.');
          return;
        }

        data = await api.getDepartmentDashboard(directorDept.id);
        data.isDepartmentView = true;
        data.departmentId = directorDept.id;
      } else if (user.role === 'member' || user.role === 'lead') {
        // Load team dashboard
        if (!user.team_id) {
          setError('You need to be assigned to a team to view the dashboard');
          return;
        }

        data = await api.getDashboard(user.team_id);
        // Add flags to identify which type of data this is
        (data as any).isTeamView = true;
        (data as any).teamId = user.team_id;
      } else {
        setError('Unknown user role');
        return;
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  if (!dashboardData) {
    return (
      <Layout>
        <Alert type="info" message="No dashboard data available" />
      </Layout>
    );
  }

  // EXECUTIVE/ADMIN VIEW - Organization Dashboard
  if ((user?.role === 'executive' || user?.role === 'admin') && !dashboardData.isDepartmentView) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">{user?.role === 'admin' ? 'Admin Dashboard' : 'Executive Dashboard'}</h1>
              <RoleIndicator role={user?.role || 'executive'} />
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Departments</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_departments}</p>
                </div>
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Teams</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_teams}</p>
                </div>
                <BarChart3 className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Members</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_members}</p>
                </div>
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Directors</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_directors}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>

          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Average OKR Progress</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.average_okr_progress.toFixed(1)}%</p>
                  <p className="text-xs text-text-secondary mt-2">Across all teams</p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Average BAU Health</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.average_bau_health.toFixed(1)}%</p>
                  <p className="text-xs text-text-secondary mt-2">Across all teams</p>
                </div>
                <Activity className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Average BAU Execution (OCE)</p>
                  <p className="text-3xl font-bold mt-2">{(dashboardData.average_bau_execution || 0).toFixed(1)}%</p>
                  <p className="text-xs text-text-secondary mt-2">Across all teams</p>
                </div>
                <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Departments Grid */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">All Departments</h2>

            {dashboardData.departments && dashboardData.departments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.departments.map((dept: any) => (
                  <div
                    key={dept.department_id}
                    onClick={() => navigate(`/dashboard/department/${dept.department_id}`)}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{dept.department_name}</h3>
                        {dept.director_name && (
                          <p className="text-sm text-text-secondary">
                            Director: <span className="font-semibold">{dept.director_name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-text-secondary">
                          <span className="font-semibold">{dept.teams_count}</span> teams
                        </p>
                        <p className="text-text-secondary">
                          <span className="font-semibold">{dept.members_count}</span> members
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="text-text-secondary">OKR Progress</span>
                          <span className="font-semibold">{dept.okr_progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${dept.okr_progress}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="text-text-secondary">BAU Health</span>
                          <span className="font-semibold">{dept.bau_health.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              dept.bau_health >= 90
                                ? 'bg-green-600'
                                : dept.bau_health >= 70
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${dept.bau_health}%` }}
                          />
                        </div>
                      </div>
                      {dept.bau_execution !== undefined && (
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-text-secondary">BAU Execution (OCE)</span>
                            <span className="font-semibold">{dept.bau_execution.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${dept.bau_execution}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No departments created yet</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // DIRECTOR VIEW - Department Dashboard
  if ((user?.role === 'director' || dashboardData.isDepartmentView) && dashboardData.isDepartmentView) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">Department Dashboard</h1>
              <RoleIndicator role="director" />
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Teams</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_teams}</p>
                </div>
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Members</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.total_members}</p>
                </div>
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg OKR Progress</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.average_okr_progress.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg BAU Health</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.average_bau_health.toFixed(1)}%</p>
                </div>
                <Activity className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Avg BAU Execution (OCE)</p>
                  <p className="text-3xl font-bold mt-2">{(dashboardData.average_bau_execution || 0).toFixed(1)}%</p>
                </div>
                <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Your Teams</h2>

            {dashboardData.teams && dashboardData.teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.teams.map((team: any) => (
                  <div
                    key={team.team_id}
                    onClick={() => navigate(`/dashboard/team/${team.team_id}`)}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold mb-3">{team.team_name}</h3>
                    
                    <div className="space-y-3 text-sm">
                      <p className="text-text-secondary">
                        <span className="font-semibold">{team.members_count}</span> members
                      </p>

                      {/* OKR Progress */}
                      <div>
                        <div className="flex justify-between mb-1 text-text-secondary">
                          <span>OKR Progress</span>
                          <span className="font-semibold">{team.okr_progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${team.okr_progress}%` }}
                          />
                        </div>
                      </div>

                      {/* BAU Health */}
                      <div>
                        <div className="flex justify-between mb-1 text-text-secondary">
                          <span>BAU Health</span>
                          <span className="font-semibold">{team.bau_health.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              team.bau_health >= 90
                                ? 'bg-green-600'
                                : team.bau_health >= 70
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${team.bau_health}%` }}
                          />
                        </div>
                      </div>

                      {/* BAU Execution */}
                      {team.bau_execution !== undefined && (
                        <div>
                          <div className="flex justify-between mb-1 text-text-secondary">
                            <span>BAU Execution (OCE)</span>
                            <span className="font-semibold">{team.bau_execution.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${team.bau_execution}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="mt-4 w-full px-3 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No teams in your department</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // TEAM MEMBER VIEW - Team Dashboard
  if ((user?.role === 'member' || user?.role === 'lead') && dashboardData.isTeamView) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">Team Dashboard</h1>
              {user?.role === 'lead' && <RoleIndicator role="lead" />}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">OKR Progress</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.okr_progress.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">BAU Health</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.bau_health.toFixed(1)}%</p>
                </div>
                <Activity className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">BAU Execution (OCE)</p>
                  <p className="text-3xl font-bold mt-2">{(dashboardData.bau_execution || 0).toFixed(1)}%</p>
                </div>
                <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* OKRs Section */}
          {dashboardData.okrs && dashboardData.okrs.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Objectives & Key Results</h2>
              <div className="space-y-6">
                {dashboardData.okrs.map((okr: any) => (
                  <div key={okr.okr_id} className="border border-border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">{okr.objective}</h3>
                      <p className="text-sm text-text-secondary mb-3">{okr.quarter}</p>
                      
                      {/* OKR Progress Bar */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${okr.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold whitespace-nowrap">
                          {okr.progress.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="space-y-3 mt-4">
                      {okr.key_results.map((kr: any) => (
                        <div key={kr.kr_id} className="bg-surface-hover p-3 rounded">
                          <p className="text-sm text-text-secondary mb-2">{kr.description}</p>
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span>
                              {kr.current_value} / {kr.target_value}
                            </span>
                            <span className="font-semibold">{kr.progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${kr.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BAU Activities Section */}
          {dashboardData.bau_activities && dashboardData.bau_activities.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Business as Usual Activities</h2>
              <div className="space-y-4">
                {dashboardData.bau_activities.map((activity: any) => (
                  <div key={activity.activity_id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{activity.activity_name}</h3>
                      <span className={`font-semibold ${
                        activity.health >= 90
                          ? 'text-green-600'
                          : activity.health >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {activity.health.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          activity.health >= 90
                            ? 'bg-green-600'
                            : activity.health >= 70
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${activity.health}%` }}
                      />
                    </div>

                    {/* Metrics */}
                    {activity.metrics && activity.metrics.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {activity.metrics.map((metric: any) => (
                          <div key={metric.id} className="flex justify-between text-sm text-text-secondary">
                            <span>{metric.name}</span>
                            <span className="font-semibold">
                              {metric.current_value} / {metric.target_value} {metric.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Week Priorities */}
          {dashboardData.current_week_priorities && dashboardData.current_week_priorities.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">This Week's Priorities</h2>
              <div className="space-y-3">
                {dashboardData.current_week_priorities.map((priority: any) => (
                  <div
                    key={priority.priority_id}
                    className="border border-border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                          P{priority.priority}
                        </span>
                        <p className="font-semibold">{priority.work_item_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${priority.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {priority.progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Alert type="error" message="Unable to determine dashboard view" />
    </Layout>
  );
};
