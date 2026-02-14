import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { OKRDetail } from '../../../shared/types';
import { Plus, Target, Edit, Trash2, TrendingUp } from 'lucide-react';

type StatusFilter = 'all' | 'draft' | 'active' | 'completed';

export const OKRPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKRDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [quarterFilter, setQuarterFilter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'strategic' | 'operational' | 'tactical'>('all');

  useEffect(() => {
    loadOKRs();
  }, [user]);

  const loadOKRs = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getTeamOKRs(user.team_id);
      setOkrs(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load OKRs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (okrId: number) => {
    if (!confirm('Delete this OKR? This action cannot be undone.')) return;

    try {
      await api.deleteOKR(okrId);
      setSuccess('OKR deleted successfully');
      loadOKRs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete OKR');
    }
  };

  const calculateOKRScore = (okr: OKRDetail): number => {
    if (!okr.key_results || okr.key_results.length === 0) return 0;
    
    return okr.key_results.reduce((sum, kr) => {
      const base = parseFloat(kr.base_value);
      const target = parseFloat(kr.target_value);
      const current = parseFloat(kr.current_value);
      const weight = parseFloat(kr.weight);
      
      if (target === base) return sum;
      const score = Math.max(0, Math.min(1, (current - base) / (target - base)));
      return sum + (score * weight);
    }, 0);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'strategic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'operational': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'tactical': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter OKRs
  const filteredOKRs = okrs.filter(okr => {
    if (statusFilter !== 'all' && okr.status !== statusFilter) return false;
    if (okr.year !== yearFilter) return false;
    if (quarterFilter !== 'all' && okr.quarters !== quarterFilter) return false;
    if (levelFilter !== 'all' && okr.okr_level !== levelFilter) return false;
    return true;
  });

  const years = Array.from(new Set(okrs.map(o => o.year))).sort((a, b) => b - a);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">OKRs</h1>
            <p className="text-text-secondary mt-1">Objectives and Key Results</p>
          </div>
          <button
            onClick={() => navigate('/okrs/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New OKR
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Filters */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'draft', 'active', 'completed'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-surface-highlight text-text-secondary hover:bg-primary/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="input w-full"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 block">Quarter</label>
              <select
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value as any)}
                className="input w-full"
              >
                <option value="all">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 block">Level</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="input w-full"
              >
                <option value="all">All Levels</option>
                <option value="strategic">Strategic</option>
                <option value="operational">Operational</option>
                <option value="tactical">Tactical</option>
              </select>
            </div>
          </div>
        </div>

        {/* OKR List */}
        <div className="space-y-4">
          {filteredOKRs.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-border rounded-lg">
              <Target className="mx-auto text-text-secondary/40" size={48} />
              <h3 className="mt-4 text-lg font-medium text-text-primary">No OKRs found</h3>
              <p className="mt-2 text-text-secondary">Create your first OKR to get started</p>
            </div>
          ) : (
            filteredOKRs.map((okr) => {
              const score = calculateOKRScore(okr);
              
              return (
                <div key={okr.id} className="bg-surface border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(okr.okr_level)}`}>
                          {okr.okr_level}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(okr.status)}`}>
                          {okr.status}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {okr.quarters} {okr.year}
                        </span>
                      </div>

                      {/* Objective */}
                      <h3 className="text-xl font-semibold text-text-primary mb-2">{okr.objective}</h3>
                      {okr.description && (
                        <p className="text-sm text-text-secondary mb-3">{okr.description}</p>
                      )}

                      {/* Progress Bar */}
                      {okr.key_results && okr.key_results.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-text-secondary">{okr.key_results.length} Key Results</span>
                            <span className="text-sm font-semibold">{(score * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-border rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${getScoreColor(score)}`}
                              style={{ width: `${Math.min(score * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/okrs/${okr.id}/measure`)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Measure"
                      >
                        <TrendingUp size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/okrs/${okr.id}/edit`)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(okr.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

