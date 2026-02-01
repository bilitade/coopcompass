import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { ArrowLeft, Users, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import type { OKRDetail, BAUActivityDetail } from '../../../shared/types';

interface Team {
  id: number;
  name: string;
  department_id?: number | null;
  created_at: string;
  updated_at: string;
  users?: any[];
}

interface TeamOKRAnalytics {
  okrs: OKRDetail[];
  overallProgress: number;
}

interface TeamBAUAnalytics {
  activities: (BAUActivityDetail & { execution?: number })[];
  overallHealth: number;
}

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [okrAnalytics, setOKRAnalytics] = useState<TeamOKRAnalytics>({
    okrs: [],
    overallProgress: 0,
  });
  const [bauAnalytics, setBAUAnalytics] = useState<TeamBAUAnalytics>({
    activities: [],
    overallHealth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [id, user]);

  const calculateProgress = (currentValue: string, targetValue: string): number => {
    const current = parseFloat(currentValue) || 0;
    const target = parseFloat(targetValue) || 1;
    return Math.min((current / target) * 100, 100);
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Team ID not provided');
        return;
      }

      // Get team details
      const teamData = await api.getTeam(parseInt(id));
      setTeam(teamData as any);

      // Get OKRs
      const okrs = await api.getTeamOKRs(parseInt(id));
      let totalOKRProgress = 0;
      let okrCount = 0;

      okrs.forEach((okr) => {
        const krProgress =
          okr.key_results.reduce((sum, kr) => {
            const progress = calculateProgress(kr.current_value, kr.target_value);
            return sum + progress;
          }, 0) / (okr.key_results.length || 1);
        totalOKRProgress += krProgress;
        okrCount++;
      });

      setOKRAnalytics({
        okrs,
        overallProgress: okrCount > 0 ? totalOKRProgress / okrCount : 0,
      });

      // Get BAU Activities
      const bauActivities = await api.getTeamBAUActivities(parseInt(id));
      let totalBAUHealth = 0;
      let bauCount = 0;

      // Fetch execution for each activity
      const activitiesWithExecution = await Promise.all(
        bauActivities.map(async (activity: any) => {
          let execution = 0;
          try {
            execution = await api.getBAUExecution(activity.id);
          } catch (err) {
            console.error(`Failed to fetch execution for activity ${activity.id}:`, err);
          }

          if (activity.metrics && activity.metrics.length > 0) {
            const metricWeights = activity.metrics.reduce((sum: number, m: any) => sum + parseFloat(m.weight || '1'), 0) || 1;
            const activityHealth =
              activity.metrics.reduce((sum: number, metric: any) => {
                const progress = calculateProgress(metric.current_value, metric.target_value);
                const weight = parseFloat(metric.weight || '1');
                return sum + progress * (weight / metricWeights);
              }, 0);
            totalBAUHealth += activityHealth;
            bauCount++;
          }

          return { ...activity, execution };
        })
      );

      setBAUAnalytics({
        activities: activitiesWithExecution as any,
        overallHealth: bauCount > 0 ? totalBAUHealth / bauCount : 0,
      });
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  if (error || !team) {
    return (
      <Layout>
        <Alert type="error" message={error || 'Team not found'} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="text-primary" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <p className="text-text-secondary mt-1">
                {team.users?.length || 0} member{team.users?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Team Members</p>
                <p className="text-3xl font-bold mt-2">{team.users?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Overall OKR Progress</p>
                <p className="text-3xl font-bold mt-2">{okrAnalytics.overallProgress.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Overall BAU Health</p>
                <p className="text-3xl font-bold mt-2">{bauAnalytics.overallHealth.toFixed(1)}%</p>
              </div>
              <Activity className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Overall BAU Execution (OCE)</p>
                <p className="text-3xl font-bold mt-2">
                  {bauAnalytics.activities.length > 0
                    ? (
                        bauAnalytics.activities.reduce((sum, a) => sum + (a.execution || 0), 0) /
                        bauAnalytics.activities.length
                      ).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Team Members */}
        {team.users && team.users.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.users.map((member) => (
                <div key={member.id} className="flex items-start gap-4 p-4 bg-surface-hover rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary">{member.name}</h4>
                    <p className="text-sm text-text-secondary">{member.email}</p>
                    <p className="text-xs text-text-secondary mt-1 capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OKRs Section */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            OKRs ({okrAnalytics.okrs.length})
          </h2>

          {okrAnalytics.okrs.length === 0 ? (
            <p className="text-text-secondary">No OKRs created yet</p>
          ) : (
            <div className="space-y-6">
              {okrAnalytics.okrs.map((okr) => {
                const krProgress =
                  okr.key_results.reduce((sum, kr) => {
                    return sum + calculateProgress(kr.current_value, kr.target_value);
                  }, 0) / (okr.key_results.length || 1);

                return (
                  <div key={okr.id} className="border border-border rounded-lg p-4">
                    {/* OKR Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-text-primary text-lg">{okr.objective}</h3>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {okr.quarter}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(krProgress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-primary">{krProgress.toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="space-y-3 mt-4">
                      {okr.key_results.map((kr) => {
                        const progress = calculateProgress(kr.current_value, kr.target_value);
                        return (
                          <div key={kr.id} className="flex items-center gap-4 p-3 bg-surface-hover rounded">
                            <CheckCircle2
                              size={20}
                              className={progress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-text-secondary'}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">{kr.description}</p>
                              <p className="text-xs text-text-secondary mt-1">
                                {kr.current_value} / {kr.target_value} {kr.unit}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-16 h-1.5 bg-border rounded-full">
                                <div
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <p className="text-sm font-semibold text-text-primary text-right mt-1">
                                {progress.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BAU Activities Section */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="text-green-600 dark:text-green-400" size={24} />
            BAU Activities ({bauAnalytics.activities.length})
          </h2>

          {bauAnalytics.activities.length === 0 ? (
            <p className="text-text-secondary">No BAU activities created yet</p>
          ) : (
            <div className="space-y-6">
              {bauAnalytics.activities.map((activity) => {
                const metricWeights = activity.metrics.reduce((sum, m) => sum + parseFloat(m.weight || '1'), 0) || 1;
                const activityHealth =
                  activity.metrics.reduce((sum, metric) => {
                    const progress = calculateProgress(metric.current_value, metric.target_value);
                    const weight = parseFloat(metric.weight || '1');
                    return sum + progress * (weight / metricWeights);
                  }, 0);

                const getHealthColor = (health: number) => {
                  if (health >= 75) return 'bg-green-600 dark:bg-green-500';
                  if (health >= 50) return 'bg-yellow-600 dark:bg-yellow-500';
                  return 'bg-red-600 dark:bg-red-500';
                };

                return (
                  <div key={activity.id} className="border border-border rounded-lg p-4">
                    {/* Activity Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary text-lg">{activity.name}</h3>
                        {activity.description && (
                          <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
                        )}
                        
                        {/* BAU Health */}
                        <div className="mt-3">
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-text-secondary">BAU Health</span>
                            <span className="font-semibold">{activityHealth.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(activityHealth)}`}
                              style={{ width: `${Math.min(activityHealth, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* BAU Execution */}
                        <div className="mt-3">
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-text-secondary">BAU Execution (OCE)</span>
                            <span className="font-semibold">{(activity.execution || 0).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(activity.execution || 0)}`}
                              style={{ width: `${Math.min(activity.execution || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-3 mt-4">
                      {activity.metrics.map((metric) => {
                        const progress = calculateProgress(metric.current_value, metric.target_value);
                        return (
                          <div key={metric.id} className="flex items-center gap-4 p-3 bg-surface-hover rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">{metric.name}</p>
                              <p className="text-xs text-text-secondary mt-1">
                                {metric.current_value} / {metric.target_value} {metric.unit}
                              </p>
                              {metric.weight && (
                                <p className="text-xs text-text-secondary">
                                  Weight: {parseFloat(metric.weight).toFixed(1)}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-16 h-1.5 bg-border rounded-full">
                                <div
                                  className="bg-green-600 dark:bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <p className="text-sm font-semibold text-text-primary text-right mt-1">
                                {progress.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

