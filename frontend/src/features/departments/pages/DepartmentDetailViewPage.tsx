import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';

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
    navigate(`/dashboard/department/${departmentId}/teams/${teamId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb 
          items={[
            { label: 'Organization', path: '/departments' },
            { label: department.name }
          ]} 
        />

        {/* Department Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-text-primary">{department.name}</h1>
              {department.director && (
                <p className="text-lg text-text-secondary flex items-center gap-2">
                  <Users size={18} />
                  Director: <span className="font-semibold">{department.director.name}</span>
                  <span className="text-sm">({department.director.email})</span>
                </p>
              )}
              {department.description && (
                <p className="text-text-secondary mt-3 text-base">{department.description}</p>
              )}
            </div>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Department Teams ({dashboardData.total_teams})
            </h2>
          </div>

          {dashboardData.teams && dashboardData.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.teams.map((team: any) => (
                <div
                  key={team.team_id}
                  onClick={() => handleTeamClick(team.team_id)}
                  className="border-2 border-border rounded-xl p-5 hover:border-primary hover:shadow-xl transition-all cursor-pointer group bg-surface-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                        {team.team_name}
                      </h3>
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <Users size={14} />
                        <span className="font-semibold">{team.members_count}</span> members
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* OKR Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="text-text-secondary flex items-center gap-1">
                        <TrendingUp size={14} />
                        OKR Progress
                      </span>
                      <span className="font-bold text-blue-600">{team.okr_progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${team.okr_progress}%` }}
                      />
                    </div>
                  </div>

                  {/* BAU Health */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="text-text-secondary flex items-center gap-1">
                        <Activity size={14} />
                        BAU Health
                      </span>
                      <span className={`font-bold ${
                        team.bau_health >= 90
                          ? 'text-green-600'
                          : team.bau_health >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {team.bau_health.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No teams in this department</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

