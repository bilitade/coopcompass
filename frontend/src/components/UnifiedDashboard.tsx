import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './Alert';
import { Building2, Users, TrendingUp, Activity, BarChart3 } from 'lucide-react';

interface MetricsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  suffix?: string;
  isPercentage?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  label,
  value,
  icon,
  suffix = '',
  isPercentage = false,
}) => {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-3xl font-bold mt-2">
            {typeof value === 'number' && isPercentage
              ? `${value.toFixed(1)}%`
              : value}
            {suffix && !isPercentage && <span className="text-lg ml-1">{suffix}</span>}
          </p>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </div>
  );
};

interface TeamSummaryProps {
  team_id: number;
  team_name: string;
  members_count: number;
  okr_progress: number;
  bau_health: number;
}

interface DepartmentSummaryProps {
  department_id: number;
  department_name: string;
  director_name?: string;
  teams_count: number;
  members_count: number;
  okr_progress: number;
  bau_health: number;
}

interface UnifiedDashboardProps {
  variant: 'team' | 'department' | 'organization';
  teamId?: number;
  departmentId?: number;
  onNavigate?: (type: string, id: number) => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  variant,
  teamId,
  departmentId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [variant, teamId, departmentId, user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;

      if (variant === 'team' && teamId) {
        data = await api.getDashboard(teamId);
      } else if (variant === 'department' && departmentId) {
        data = await api.getDepartmentDashboard(departmentId);
      } else if (variant === 'organization') {
        data = await api.getOrganizationDashboard();
      } else {
        setError('Invalid dashboard configuration');
        return;
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.detail || `Failed to load ${variant} dashboard`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!dashboardData) {
    return <Alert type="info" message={`No ${variant} dashboard data available`} />;
  }

  // TEAM DASHBOARD
  if (variant === 'team') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team Dashboard</h1>
          <p className="text-lg text-text-secondary">
            Overview of team performance and progress
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricsCard
            label="OKR Progress"
            value={dashboardData.okr_progress}
            icon={<TrendingUp className="w-12 h-12" />}
            isPercentage
          />
          <MetricsCard
            label="BAU Health"
            value={dashboardData.bau_health}
            icon={<Activity className="w-12 h-12 text-green-600 dark:text-green-400" />}
            isPercentage
          />
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
                        <div className="flex justify-between items-center text-sm">
                          <span>
                            {kr.current_value} / {kr.target_value}
                          </span>
                          <span className="font-semibold">{kr.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
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
                    <span className="font-semibold">{activity.health.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Week Priorities */}
        {dashboardData.current_week_priorities &&
          dashboardData.current_week_priorities.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">This Week's Priorities</h2>
              <div className="space-y-3">
                {dashboardData.current_week_priorities.map((priority: any) => (
                  <div
                    key={priority.priority_id}
                    className="border border-border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{priority.work_item_name}</p>
                      <p className="text-sm text-text-secondary">
                        Priority: P{priority.priority}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${priority.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold mt-1 block">
                        {priority.progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  }

  // DEPARTMENT DASHBOARD
  if (variant === 'department') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Department Dashboard</h1>
          <p className="text-lg text-text-secondary">
            Overview of department teams and performance
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricsCard
            label="Total Teams"
            value={dashboardData.total_teams}
            icon={<Building2 className="w-12 h-12" />}
          />
          <MetricsCard
            label="Total Members"
            value={dashboardData.total_members}
            icon={<Users className="w-12 h-12" />}
          />
          <MetricsCard
            label="Avg OKR Progress"
            value={dashboardData.average_okr_progress}
            icon={<TrendingUp className="w-12 h-12" />}
            isPercentage
          />
          <MetricsCard
            label="Avg BAU Health"
            value={dashboardData.average_bau_health}
            icon={<Activity className="w-12 h-12 text-green-600 dark:text-green-400" />}
            isPercentage
          />
        </div>

        {/* Teams Section */}
        {dashboardData.teams && dashboardData.teams.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Teams Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.teams.map((team: TeamSummaryProps) => (
                <div
                  key={team.team_id}
                  className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate('team', team.team_id)}
                >
                  <h3 className="text-lg font-semibold mb-3">{team.team_name}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-text-secondary">
                      <span className="font-semibold">{team.members_count}</span> members
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-text-secondary">OKR Progress</span>
                        <span className="font-semibold">
                          {team.okr_progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${team.okr_progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-text-secondary">BAU Health</span>
                        <span className="font-semibold">
                          {team.bau_health.toFixed(1)}%
                        </span>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ORGANIZATION DASHBOARD
  if (variant === 'organization') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Executive Dashboard</h1>
          <p className="text-lg text-text-secondary">
            Overview of all departments and organizational performance
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            label="Departments"
            value={dashboardData.total_departments}
            icon={<Building2 className="w-12 h-12" />}
          />
          <MetricsCard
            label="Total Teams"
            value={dashboardData.total_teams}
            icon={<BarChart3 className="w-12 h-12" />}
          />
          <MetricsCard
            label="Total Members"
            value={dashboardData.total_members}
            icon={<Users className="w-12 h-12" />}
          />
          <MetricsCard
            label="Directors"
            value={dashboardData.total_directors}
            icon={<TrendingUp className="w-12 h-12" />}
          />
        </div>

        {/* Overall Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricsCard
            label="Average OKR Progress"
            value={dashboardData.average_okr_progress}
            icon={<TrendingUp className="w-12 h-12" />}
            isPercentage
          />
          <MetricsCard
            label="Average BAU Health"
            value={dashboardData.average_bau_health}
            icon={<Activity className="w-12 h-12 text-green-600 dark:text-green-400" />}
            isPercentage
          />
        </div>

        {/* Departments Section */}
        {dashboardData.departments && dashboardData.departments.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Organization Departments</h2>
            <div className="space-y-4">
              {dashboardData.departments.map((dept: DepartmentSummaryProps) => (
                <div
                  key={dept.department_id}
                  className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate('department', dept.department_id)}
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

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

