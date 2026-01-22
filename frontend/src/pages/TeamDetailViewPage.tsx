import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { ArrowLeft, Users, TrendingUp, Activity, Target } from 'lucide-react';

export const TeamDetailViewPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!teamId) {
        setError('Team ID not provided');
        return;
      }

      // Get team info
      const teamData = await api.getTeam(parseInt(teamId));
      setTeam(teamData);

      // Get team dashboard
      const dashboard = await api.getDashboard(parseInt(teamId));
      setDashboardData(dashboard);
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError(err.response?.data?.detail || 'Failed to load team data');
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

  if (!team || !dashboardData) {
    return (
      <Layout>
        <Alert type="error" message="Team not found" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
            <p className="text-lg text-text-secondary">
              Team ID: <span className="font-semibold">#{team.id}</span>
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Team Members */}
        {team.users && team.users.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Team Members ({team.users.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.users.map((user: any) => (
                <div key={user.id} className="border border-border rounded-lg p-4">
                  <p className="font-semibold text-text-primary">{user.name}</p>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                  <p className="text-xs bg-primary/10 text-primary rounded px-2 py-1 mt-2 inline-block">
                    {user.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OKRs Section */}
        {dashboardData.okrs && dashboardData.okrs.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Objectives & Key Results
            </h2>
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
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Business as Usual Activities
            </h2>
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
};

