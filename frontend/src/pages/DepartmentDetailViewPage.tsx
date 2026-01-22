import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { ArrowLeft, Building2, Users, TrendingUp, Activity } from 'lucide-react';

export const DepartmentDetailViewPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartmentData();
  }, [departmentId]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!departmentId) {
        setError('Department ID not provided');
        return;
      }

      // Get department info
      const dept = await api.getDepartment(parseInt(departmentId));
      setDepartment(dept);

      // Get department dashboard with all teams
      const dashboard = await api.getDepartmentDashboard(parseInt(departmentId));
      setDashboardData(dashboard);
    } catch (err: any) {
      console.error('Error fetching department:', err);
      setError(err.response?.data?.detail || 'Failed to load department data');
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

  if (!department || !dashboardData) {
    return (
      <Layout>
        <Alert type="error" message="Department not found" />
      </Layout>
    );
  }

  const handleTeamClick = (teamId: number) => {
    navigate(`/dashboard/team/${teamId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">{department.name}</h1>
            {department.director && (
              <p className="text-lg text-text-secondary">
                Director: <span className="font-semibold">{department.director.name}</span>
              </p>
            )}
            {department.description && (
              <p className="text-text-secondary mt-2">{department.description}</p>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        </div>

        {/* Teams Grid */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Department Teams</h2>

          {dashboardData.teams && dashboardData.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.teams.map((team: any) => (
                <div
                  key={team.team_id}
                  onClick={() => handleTeamClick(team.team_id)}
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
                  </div>

                  <button className="mt-4 w-full px-3 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No teams in this department</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

