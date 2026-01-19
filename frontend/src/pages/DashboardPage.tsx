import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Dashboard as DashboardType } from '../types';
import { Target, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team to view the dashboard');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getDashboard(user.team_id);
      setDashboard(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  if (error) {
    return (
      <Layout>
        <Alert type="error" message={error} />
      </Layout>
    );
  }

  if (!dashboard) {
    return (
      <Layout>
        <Alert type="info" message="No dashboard data available" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-primary">
            {user?.team_name ? `${user.team_name} Dashboard` : 'Dashboard'}
          </h1>
          <div className="text-base text-text-secondary">
            Updated: {new Date(dashboard.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center gap-8 p-6 bg-surface-highlight rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Target className="text-primary" size={24} />
            </div>
            <div>
              <div className="text-base text-text-secondary">OKR Progress</div>
              <div className="text-2xl font-bold text-text-primary">{dashboard.okr_progress.toFixed(1)}%</div>
            </div>
          </div>

          <div className="w-px h-16 bg-border"></div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-base text-text-secondary">BAU Health</div>
              <div className="text-2xl font-bold text-text-primary">{dashboard.bau_health.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* OKR Progress */}
        {dashboard.okrs.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="text-primary" size={20} />
              OKR Progress
            </h2>
            <div className="space-y-4">
              {dashboard.okrs.map((okr) => (
                <div key={okr.okr_id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary text-base">{okr.objective}</h3>
                      <p className="text-sm text-text-secondary">{okr.quarter}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{okr.progress.toFixed(0)}%</div>
                      <div className="w-20 h-2 bg-border rounded-full mt-1">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${okr.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {okr.key_results.map((kr) => (
                      <div key={kr.kr_id} className="flex justify-between items-center">
                        <span className="text-text-secondary flex-1 mr-3 text-sm">{kr.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-text-primary font-semibold text-sm">{kr.progress.toFixed(0)}%</span>
                          <div className="w-12 h-1.5 bg-border rounded-full">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${kr.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BAU Health */}
        {dashboard.bau_activities.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="text-green-600" size={20} />
              BAU Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.bau_activities.map((bau) => (
                <div key={bau.activity_id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-text-primary text-base">{bau.activity_name}</h3>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getHealthColor(bau.health)}`}>
                        {bau.health.toFixed(0)}%
                      </div>
                      <div className="w-16 h-2 bg-border rounded-full mt-1">
                        <div
                          className={`${getHealthColorClass(bau.health)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${bau.health}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {bau.metrics.map((metric) => (
                      <div key={metric.id} className="flex justify-between text-sm text-text-secondary">
                        <span className="flex-1 mr-3">{metric.name}</span>
                        <span className="font-medium">{metric.current_value}/{metric.target_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Priorities */}
        {dashboard.current_week_priorities.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-text-primary mb-4">This Week's Priorities</h2>
            <div className="space-y-3">
              {dashboard.current_week_priorities
                .sort((a, b) => a.priority - b.priority)
                .map((priority) => (
                  <div key={priority.priority_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-highlight transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">P{priority.priority}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary text-base truncate">{priority.work_item_name}</h4>
                      <div className="w-full h-1.5 bg-border rounded-full mt-2">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${priority.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      {priority.progress.toFixed(0)}%
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


const getHealthColor = (health: number): string => {
  if (health >= 75) return 'text-green-600';
  if (health >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getHealthColorClass = (health: number): string => {
  if (health >= 75) return 'bg-green-600';
  if (health >= 50) return 'bg-yellow-600';
  return 'bg-red-600';
};


