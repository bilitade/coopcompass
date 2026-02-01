import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { ArrowLeft, Building2, Users, TrendingUp, Activity } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  description?: string | null;
  director_id?: number | null;
  created_at: string;
  updated_at: string;
  director?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface Team {
  id: number;
  name: string;
  department_id?: number | null;
  created_at: string;
  updated_at: string;
  users?: any[];
}

interface DepartmentAnalytics {
  averageOKRProgress: number;
  averageBAUHealth: number;
  teamOKRs: { teamId: number; teamName: string; progress: number }[];
  teamBAUs: { teamId: number; teamName: string; health: number }[];
}

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [analytics, setAnalytics] = useState<DepartmentAnalytics>({
    averageOKRProgress: 0,
    averageBAUHealth: 0,
    teamOKRs: [],
    teamBAUs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateBAUHealth = (activity: any): number => {
    if (!activity.metrics || activity.metrics.length === 0) return 0;
    
    const totalWeight = activity.metrics.reduce((sum: number, m: any) => sum + (parseFloat(m.weight) || 1), 0) || 1;
    const weightedSum = activity.metrics.reduce((sum: number, metric: any) => {
      const current = parseFloat(metric.current_value) || 0;
      const target = parseFloat(metric.target_value) || 1;
      const weight = parseFloat(metric.weight) || 1;
      const progress = Math.min((current / target) * 100, 100);
      return sum + progress * weight;
    }, 0);
    
    return weightedSum / totalWeight;
  };

  const calculateOKRProgress = (okr: any): number => {
    if (!okr.key_results || okr.key_results.length === 0) return 0;
    
    const krProgress =
      okr.key_results.reduce((sum: number, kr: any) => {
        const current = parseFloat(kr.current_value) || 0;
        const target = parseFloat(kr.target_value) || 1;
        return sum + Math.min((current / target) * 100, 100);
      }, 0) / okr.key_results.length;
    
    return krProgress;
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [id, user]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Department ID not provided');
        return;
      }

      // Get department details
      const allDepts = await api.getDepartments();
      const dept = allDepts.find(d => d.id === parseInt(id));

      if (!dept) {
        setError('Department not found');
        return;
      }

      setDepartment(dept);

      // Get teams in the department
      const departmentTeams = await api.getDepartmentTeams(dept.id);
      setTeams(departmentTeams);

      // Calculate analytics for each team
      const teamOKRs = [];
      const teamBAUs = [];
      let totalOKRProgress = 0;
      let totalBAUHealth = 0;

      for (const team of departmentTeams) {
        try {
          // Get OKRs for team
          const okrs = await api.getTeamOKRs(team.id);
          if (okrs.length > 0) {
            const avgOKR =
              okrs.reduce((sum, okr) => sum + calculateOKRProgress(okr), 0) / okrs.length;
            teamOKRs.push({ teamId: team.id, teamName: team.name, progress: avgOKR });
            totalOKRProgress += avgOKR;
          }

          // Get BAU activities for team
          const bauActivities = await api.getTeamBAUActivities(team.id);
          console.log(`Team ${team.id} BAU activities:`, bauActivities);
          if (bauActivities.length > 0) {
            const avgBAU =
              bauActivities.reduce((sum, activity) => sum + calculateBAUHealth(activity), 0) / bauActivities.length;
            console.log(`Team ${team.id} avg BAU health:`, avgBAU);
            teamBAUs.push({ teamId: team.id, teamName: team.name, health: avgBAU });
            totalBAUHealth += avgBAU;
          }
        } catch (err) {
          // Team might not have OKRs or BAU activities, continue
          console.warn(`Could not fetch analytics for team ${team.id}:`, err);
        }
      }

      setAnalytics({
        averageOKRProgress: teamOKRs.length > 0 ? totalOKRProgress / teamOKRs.length : 0,
        averageBAUHealth: teamBAUs.length > 0 ? totalBAUHealth / teamBAUs.length : 0,
        teamOKRs,
        teamBAUs,
      });
    } catch (err: any) {
      console.error('Error fetching department:', err);
      setError('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'executive') {
    return (
      <Layout>
        <Alert type="error" message="This page is only accessible to executives." />
      </Layout>
    );
  }

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  if (error || !department) {
    return (
      <Layout>
        <Alert type="error" message={error || 'Department not found'} />
      </Layout>
    );
  }

  const totalMembers = teams.reduce((sum, team) => sum + (team.users?.length || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/departments')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Organization
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="text-primary" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{department.name}</h1>
              <p className="text-text-secondary mt-1">
                {department.director ? `Director: ${department.director.name}` : 'No director assigned'}
              </p>
            </div>
          </div>
          <p className="text-lg text-text-secondary">
            {department.description || 'No description provided'}
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Teams</p>
                <p className="text-3xl font-bold mt-2">{teams.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Members</p>
                <p className="text-3xl font-bold mt-2">{totalMembers}</p>
              </div>
              <Users className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Avg OKR Progress</p>
                <p className="text-3xl font-bold mt-2">{analytics.averageOKRProgress.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Avg BAU Health</p>
                <p className="text-3xl font-bold mt-2">{analytics.averageBAUHealth.toFixed(1)}%</p>
              </div>
              <Activity className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Department OKRs Section */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            Team OKR Progress
          </h2>
          {analytics.teamOKRs.length > 0 ? (
            <div className="space-y-4">
              {analytics.teamOKRs.map((teamOkr) => (
                <div key={teamOkr.teamId} className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{teamOkr.teamName}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-border rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(teamOkr.progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-primary w-12 text-right">
                      {teamOkr.progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No OKR data available</p>
          )}
        </div>

        {/* Department BAU Section */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="text-green-600 dark:text-green-400" size={24} />
            Team BAU Health
          </h2>
          {analytics.teamBAUs.length > 0 ? (
            <div className="space-y-4">
              {analytics.teamBAUs.map((teamBau) => (
                <div key={teamBau.teamId} className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{teamBau.teamName}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-border rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          teamBau.health >= 75
                            ? 'bg-green-600 dark:bg-green-500'
                            : teamBau.health >= 50
                            ? 'bg-yellow-600 dark:bg-yellow-500'
                            : 'bg-red-600 dark:bg-red-500'
                        }`}
                        style={{ width: `${Math.min(teamBau.health, 100)}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold w-12 text-right">{teamBau.health.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No BAU data available</p>
          )}
        </div>

        {/* Teams Section */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Department Teams</h2>

          {teams.length === 0 ? (
            <p className="text-text-secondary">
              No teams assigned to this department yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-surface-hover border border-border rounded-lg p-4 transition-all hover:border-primary/50 cursor-pointer group"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Members: {team.users?.length || 0}
                  </p>
                  <p className="text-sm text-text-secondary mb-4">
                    Created: {new Date(team.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teams/${team.id}`);
                    }}
                    className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

