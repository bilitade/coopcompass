import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Target, TrendingUp, Calendar, Users, Building2 } from 'lucide-react';

interface OKRWithContext {
  okr_id: number;
  objective: string;
  quarter: string;
  team_id: number;
  team_name: string;
  department_id: number;
  department_name: string;
  progress: number;
  key_results_count: number;
  is_active: boolean;
}

export const ExecutiveOKRListPage: React.FC = () => {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKRWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchExecutiveOKRs();
  }, [user]);

  const fetchExecutiveOKRs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
        setError('Only executives and admins can access this page');
        return;
      }

      // Get all departments
      const allDepartments = await api.getDepartments();
      setDepartments(allDepartments);

      const allOKRs: OKRWithContext[] = [];

      // Fetch OKRs from all departments
      for (const dept of allDepartments) {
        try {
          const teams = await api.getDepartmentTeams(dept.id);

          for (const team of teams) {
            try {
              const teamOKRs = await api.getTeamOKRs(team.id);

              for (const okr of teamOKRs) {
                allOKRs.push({
                  okr_id: okr.id,
                  objective: okr.objective,
                  quarter: okr.quarter || 'Q1',
                  team_id: team.id,
                  team_name: team.name,
                  department_id: dept.id,
                  department_name: dept.name,
                  progress: (okr.objective_score || 0) * 100,
                  key_results_count: okr.key_results?.length || 0,
                  is_active: okr.is_active,
                });
              }
            } catch (teamErr) {
              console.error(`Error fetching OKRs for team ${team.id}:`, teamErr);
            }
          }
        } catch (deptErr) {
          console.error(`Error fetching teams for dept ${dept.id}:`, deptErr);
        }
      }

      setOkrs(allOKRs);
    } catch (err: any) {
      console.error('Error fetching executive OKRs:', err);
      setError(err.response?.data?.detail || 'Failed to load OKRs');
    } finally {
      setLoading(false);
    }
  };

  // Get unique quarters
  const quarters = ['All', ...new Set(okrs.map(okr => okr.quarter))];

  // Filter OKRs
  const filteredOKRs = okrs.filter(okr => {
    const matchesQuarter = selectedQuarter === 'All' || okr.quarter === selectedQuarter;
    const matchesDept = selectedDepartment === 'All' || okr.department_name === selectedDepartment;
    return matchesQuarter && matchesDept;
  });

  if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
    return (
      <Layout>
        <Alert type="error" message="Only executives and admins can access this page" />
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
        <Breadcrumb items={[{ label: 'Organization' }, { label: 'OKRs' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Organization OKRs
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Quarter
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-surface text-text-primary min-w-[150px]"
            >
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q === 'All' ? 'All Quarters' : q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-surface text-text-primary min-w-[200px]"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OKR List */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {filteredOKRs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No OKRs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-hover border-b-2 border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Target size={18} />
                        Objective
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        Quarter
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Building2 size={18} />
                        Department
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Users size={18} />
                        Team
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">KRs</th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp size={18} />
                        Progress
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOKRs.map((okr) => (
                    <tr
                      key={okr.okr_id}
                      className="border-b border-border hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-text-primary">{okr.objective}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          <Calendar size={14} />
                          {okr.quarter}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{okr.department_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-text-secondary" />
                          <span className="text-text-primary">{okr.team_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-text-secondary">{okr.key_results_count}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all"
                              style={{ width: `${okr.progress}%` }}
                            />
                          </div>
                          <span className="font-bold text-blue-600 text-sm w-12 text-right">
                            {okr.progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          okr.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {okr.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredOKRs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total OKRs</p>
              <p className="text-2xl font-bold text-text-primary">{filteredOKRs.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Departments</p>
              <p className="text-2xl font-bold text-primary">
                {new Set(filteredOKRs.map(o => o.department_name)).size}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Active OKRs</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredOKRs.filter(o => o.is_active).length}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Avg Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {(filteredOKRs.reduce((sum, o) => sum + o.progress, 0) / filteredOKRs.length).toFixed(0)}%
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total KRs</p>
              <p className="text-2xl font-bold text-text-primary">
                {filteredOKRs.reduce((sum, o) => sum + o.key_results_count, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

