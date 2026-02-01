import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { Target, TrendingUp, Calendar, Users } from 'lucide-react';

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
            // Get dashboard to calculate progress
            const dashboard = await api.getDashboard(team.id);
            const okrProgress = dashboard.okrs.find((o: any) => o.okr_id === okr.id);
            
            allOKRs.push({
              okr_id: okr.id,
              objective: okr.objective,
              quarter: okr.quarter,
              team_id: team.id,
              team_name: team.name,
              department_id: directorDept.id,
              department_name: directorDept.name,
              progress: okrProgress?.progress || 0,
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
                          <Users size={16} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{okr.team_name}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-1">Total OKRs</p>
              <p className="text-2xl font-bold text-text-primary">{filteredOKRs.length}</p>
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
              <p className="text-sm text-text-secondary mb-1">Total Key Results</p>
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

