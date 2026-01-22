import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';

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

interface DepartmentStats {
  departmentId: number;
  totalTeams: number;
  totalMembers: number;
  averageOKRProgress: number;
  averageBAUHealth: number;
}

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<Map<number, DepartmentStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartmentsAndStats();
  }, [user]);

  const fetchDepartmentsAndStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all departments
      const allDepartments = await api.getDepartments();
      setDepartments(allDepartments);

      // Calculate stats for each department
      const statsMap = new Map<number, DepartmentStats>();
      
      for (const dept of allDepartments) {
        const deptTeams = await api.getDepartmentTeams(dept.id);
        let totalMembers = 0;
        let totalOKRProgress = 0;
        let totalBAUHealth = 0;
        let teamCount = 0;

        for (const team of deptTeams) {
          const teamResponse = await api.getTeam(team.id);
          if (teamResponse.users) {
            totalMembers += teamResponse.users.length;
          }
          // TODO: Get OKR and BAU data for team if available
          teamCount++;
        }

        statsMap.set(dept.id, {
          departmentId: dept.id,
          totalTeams: deptTeams.length,
          totalMembers: totalMembers,
          averageOKRProgress: totalOKRProgress / (teamCount || 1),
          averageBAUHealth: totalBAUHealth / (teamCount || 1),
        });
      }

      setStats(statsMap);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization</h1>
          <p className="text-lg text-text-secondary">
            View all departments and their performance metrics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Departments</p>
                <p className="text-3xl font-bold mt-2">{departments.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Teams</p>
                <p className="text-3xl font-bold mt-2">
                  {Array.from(stats.values()).reduce((sum, s) => sum + s.totalTeams, 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Members</p>
                <p className="text-3xl font-bold mt-2">
                  {Array.from(stats.values()).reduce((sum, s) => sum + s.totalMembers, 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Directors</p>
                <p className="text-3xl font-bold mt-2">
                  {departments.filter(d => d.director_id).length}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Departments</h2>

          {departments.length === 0 ? (
            <p className="text-text-secondary">No departments found.</p>
          ) : (
            <div className="space-y-4">
              {departments.map((dept) => {
                const deptStats = stats.get(dept.id);
                return (
                  <div
                    key={dept.id}
                    className="bg-surface-hover border border-border rounded-lg p-6 transition-all hover:border-primary/50 cursor-pointer group"
                    onClick={() => navigate(`/departments/${dept.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="text-primary" size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-text-primary">{dept.name}</h3>
                            {dept.director && (
                              <p className="text-sm text-text-secondary">
                                Director: {dept.director.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-text-secondary mb-4">
                          {dept.description || 'No description provided'}
                        </p>

                        {/* Department Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-surface rounded p-3">
                            <p className="text-xs text-text-secondary">Teams</p>
                            <p className="text-lg font-bold text-text-primary">
                              {deptStats?.totalTeams || 0}
                            </p>
                          </div>
                          <div className="bg-surface rounded p-3">
                            <p className="text-xs text-text-secondary">Members</p>
                            <p className="text-lg font-bold text-text-primary">
                              {deptStats?.totalMembers || 0}
                            </p>
                          </div>
                          <div className="bg-surface rounded p-3">
                            <p className="text-xs text-text-secondary">Avg OKR</p>
                            <p className="text-lg font-bold text-text-primary">
                              {deptStats?.averageOKRProgress.toFixed(0) || '0'}%
                            </p>
                          </div>
                          <div className="bg-surface rounded p-3">
                            <p className="text-xs text-text-secondary">Avg BAU</p>
                            <p className="text-lg font-bold text-text-primary">
                              {deptStats?.averageBAUHealth.toFixed(0) || '0'}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4 text-text-secondary group-hover:text-primary transition-colors">
                        <ArrowRight size={24} />
                      </div>
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

