import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Target, Users } from 'lucide-react';

interface OKRWithTeam {
  okr_id: number;
  objective: string;
  quarter: string;
  team_id: number;
  team_name: string;
  department_id?: number;
  department_name?: string;
  progress: number;
  key_results_count: number;
  is_active: boolean;
}

export const DirectorOKRListPage: React.FC = () => {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKRWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');

  useEffect(() => {
    fetchDirectorOKRs();
  }, [user]);

  const fetchDirectorOKRs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || user.role !== 'director') {
        setError('Only directors can access this page');
        return;
      }

      // Find director's department
      const departments = await api.getDepartments();
      const directorDept = departments.find((d: any) => d.director_id === user.id);

      if (!directorDept) {
        setError('You are not assigned as a director to any department');
        return;
      }

      // Get all teams in the department
      const teams = await api.getDepartmentTeams(directorDept.id);

      // Fetch OKRs for each team
      const allOKRs: OKRWithTeam[] = [];
      
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
              department_id: directorDept.id,
              department_name: directorDept.name,
              progress: (okr.objective_score || 0) * 100,
              key_results_count: okr.key_results?.length || 0,
              is_active: okr.is_active,
            });
          }
        } catch (teamErr) {
          console.error(`Error fetching OKRs for team ${team.id}:`, teamErr);
        }
      }

      setOkrs(allOKRs);
    } catch (err: any) {
      console.error('Error fetching director OKRs:', err);
      setError(err.response?.data?.detail || 'Failed to load OKRs');
    } finally {
      setLoading(false);
    }
  };

  // Get unique quarters
  const quarters = ['All', ...new Set(okrs.map(okr => okr.quarter))];

  // Filter OKRs
  const filteredOKRs = selectedQuarter === 'All' 
    ? okrs 
    : okrs.filter(okr => okr.quarter === selectedQuarter);

  if (!user || user.role !== 'director') {
    return (
      <Layout>
        <Alert type="error" message="Only directors can access this page" />
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
        <Breadcrumb items={[{ label: 'My Department' }, { label: 'OKRs' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Department OKRs
            </h1>
          </div>

          {/* Quarter Filter */}
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-surface text-text-primary"
          >
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q === 'All' ? 'All Quarters' : q}
              </option>
            ))}
          </select>
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
                          <Users size={14} />
                          <span className="font-medium text-text-primary">{okr.team_name}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total OKRs</p>
              <p className="text-2xl font-bold text-text-primary">{filteredOKRs.length}</p>
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
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total Key Results</p>
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

