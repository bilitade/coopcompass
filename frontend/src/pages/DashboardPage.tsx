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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.team_name ? `${user.team_name} Dashboard` : 'Team Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">Real-time performance metrics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="OKR Progress"
            value={`${dashboard.okr_progress.toFixed(1)}%`}
            icon={<Target className="text-primary-600" size={24} />}
            color="primary"
            progress={dashboard.okr_progress}
          />
          <MetricCard
            title="BAU Health"
            value={`${dashboard.bau_health.toFixed(1)}%`}
            icon={<Activity className="text-green-600" size={24} />}
            color="green"
            progress={dashboard.bau_health}
          />
        </div>

        {/* OKR Details */}
        {dashboard.okrs.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">OKR Progress</h2>
            <div className="space-y-4">
              {dashboard.okrs.map((okr) => (
                <div key={okr.okr_id} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{okr.objective}</h3>
                      <p className="text-sm text-gray-500">{okr.quarter}</p>
                    </div>
                    <span className="text-lg font-semibold text-primary-600">
                      {okr.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {okr.key_results.map((kr) => (
                      <div key={kr.kr_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{kr.description}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {kr.progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Current: {kr.current_value}</span>
                          <span>•</span>
                          <span>Target: {kr.target_value}</span>
                        </div>
                        <ProgressBar value={kr.progress} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BAU Details */}
        {dashboard.bau_activities.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">BAU Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.bau_activities.map((bau) => (
                <div key={bau.activity_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">{bau.activity_name}</h3>
                    <span className={`text-lg font-semibold ${getHealthColor(bau.health)}`}>
                      {bau.health.toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {bau.metrics.map((metric) => (
                      <div key={metric.id} className="text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>{metric.name}</span>
                          <span>{metric.current_value} / {metric.target_value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ProgressBar value={bau.health} color={getHealthColorClass(bau.health)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Week Priorities */}
        {dashboard.current_week_priorities.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week's Priorities</h2>
            <div className="space-y-3">
              {dashboard.current_week_priorities
                .sort((a, b) => a.priority - b.priority)
                .map((priority) => (
                  <div key={priority.priority_id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">P{priority.priority}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{priority.work_item_name}</h4>
                      <ProgressBar value={priority.progress} />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">
                        {priority.progress.toFixed(0)}%
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

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'green';
  progress: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, progress }) => {
  const colorClasses = {
    primary: 'from-primary-50 to-primary-100',
    green: 'from-green-50 to-green-100',
  };

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
      <ProgressBar value={progress} />
    </div>
  );
};

interface ProgressBarProps {
  value: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color }) => {
  const getColor = () => {
    if (color) return color;
    if (value >= 75) return 'bg-green-600';
    if (value >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div
        className={`${getColor()} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
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

