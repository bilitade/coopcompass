import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Target, Users, Building2 } from 'lucide-react';

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
        <div className="card p-0 overflow-hidden">
          {filteredOKRs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No OKRs found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-hover/50 text-xs uppercase text-text-secondary font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 first:pl-6">Objective</th>
                    <th className="py-3 px-4">Quarter</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4 text-center">KRs</th>
                    <th className="py-3 px-4 w-48">Progress</th>
                    <th className="py-3 px-4 text-center last:pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredOKRs.map((okr) => (
                    <tr
                      key={okr.okr_id}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      <td className="py-3 px-4 first:pl-6">
                        <p className="font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-2" title={okr.objective}>
                          {okr.objective}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface border border-border text-text-secondary">
                          {okr.quarter}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Building2 size={14} />
                          <span className="font-medium text-text-primary">{okr.department_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Users size={14} />
                          <span className="text-text-primary">{okr.team_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-text-secondary bg-surface-hover px-2 py-0.5 rounded-full">{okr.key_results_count}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-border/50 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${okr.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-text-primary w-8 text-right">
                            {okr.progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center last:pr-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          okr.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total OKRs</p>
              <p className="text-2xl font-bold text-text-primary">{filteredOKRs.length}</p>
            </div>
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Departments</p>
              <p className="text-2xl font-bold text-primary">
                {new Set(filteredOKRs.map(o => o.department_name)).size}
              </p>
            </div>
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Active OKRs</p>
              <p className="text-2xl font-bold text-emerald-600">
                {filteredOKRs.filter(o => o.is_active).length}
              </p>
            </div>
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Avg Progress</p>
              <p className="text-2xl font-bold text-primary">
                {(filteredOKRs.reduce((sum, o) => sum + o.progress, 0) / filteredOKRs.length).toFixed(0)}%
              </p>
            </div>
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total KRs</p>
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

