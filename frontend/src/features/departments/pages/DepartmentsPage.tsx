import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Building2, Users, TrendingUp, ArrowRight, Activity, BarChart3 } from 'lucide-react';

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

      // Fetch real stats from department dashboard API
      const statsMap = new Map<number, DepartmentStats>();
      
      for (const dept of allDepartments) {
        try {
          // Get department dashboard with real metrics
          const deptDashboard = await api.getDepartmentDashboard(dept.id);
          
          statsMap.set(dept.id, {
            departmentId: dept.id,
            totalTeams: deptDashboard.total_teams || 0,
            totalMembers: deptDashboard.total_members || 0,
            averageOKRProgress: deptDashboard.average_okr_progress || 0,
            averageBAUHealth: deptDashboard.average_bau_health || 0,
          });
        } catch (deptErr) {
          console.error(`Error fetching dashboard for dept ${dept.id}:`, deptErr);
          // Set defaults if dashboard fetch fails
          statsMap.set(dept.id, {
            departmentId: dept.id,
            totalTeams: 0,
            totalMembers: 0,
            averageOKRProgress: 0,
            averageBAUHealth: 0,
          });
        }
      }

      setStats(statsMap);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  // Allow executives, directors, and admins to view departments
  if (!user || !['executive', 'director', 'admin'].includes(user.role)) {
    return (
      <Layout>
        <Alert type="error" message="This page is only accessible to executives, directors, and admins." />
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
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Organization' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Overview</h1>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Departments</h2>
          </div>

          {departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No departments found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {departments.map((dept) => {
                const deptStats = stats.get(dept.id);
                return (
                  <div
                    key={dept.id}
                    className="bg-surface-hover border-2 border-border rounded-xl p-6 transition-all hover:border-primary hover:shadow-xl cursor-pointer group"
                    onClick={() => navigate(`/dashboard/department/${dept.id}`)}
                  >
                    {/* Department Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Building2 className="text-white" size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors truncate">
                          {dept.name}
                        </h3>
                        {dept.director && (
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <Users size={14} />
                            Director: <span className="font-semibold">{dept.director.name}</span>
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-6 h-6 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>

                    {/* Description */}
                    {dept.description && (
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                        {dept.description}
                      </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 size={14} className="text-primary" />
                          <p className="text-xs font-medium text-text-secondary">Teams</p>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">
                          {deptStats?.totalTeams || 0}
                        </p>
                      </div>
                      
                      <div className="bg-surface border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={14} className="text-primary" />
                          <p className="text-xs font-medium text-text-secondary">Members</p>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">
                          {deptStats?.totalMembers || 0}
                        </p>
                      </div>

                      <div className="bg-surface border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={14} className="text-blue-600" />
                          <p className="text-xs font-medium text-text-secondary">OKR Progress</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {deptStats?.averageOKRProgress.toFixed(0) || '0'}%
                        </p>
                      </div>

                      <div className="bg-surface border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={14} className="text-green-600" />
                          <p className="text-xs font-medium text-text-secondary">BAU Health</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {deptStats?.averageBAUHealth.toFixed(0) || '0'}%
                        </p>
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

