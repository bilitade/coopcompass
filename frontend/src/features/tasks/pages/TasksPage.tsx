import React, { useEffect, useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { tasksApi } from '../services/tasksApi';
import type { Task, TaskWithWorkItem } from '../types';
import {
  Plus,
  CheckCircle,
  Clock,
  Filter,
  TrendingUp,
  Edit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<'All' | Task['status']>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'assignee'>('recent');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      setLoading(false);
      return;
    }

    try {
      const tasksData = await tasksApi.getTeamTasks(user.team_id);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };


  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'All') return true;
    return task.status === filterStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'recent') {
      return (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);
    }
    if (sortBy === 'priority') {
      const statusOrder = { 'In Progress': 0, 'Not Started': 1, Blocked: 2, Done: 3 };
      return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    }
    return 0;
  });

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'Done').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    blocked: tasks.filter((t) => t.status === 'Blocked').length,
  };

  const donePercentage = taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0;

  // Pagination logic
  const totalPages = Math.ceil(sortedTasks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Tasks</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage and track your team's tasks</p>
          </div>
          <button
            onClick={() => navigate('/tasks/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Total</p>
            <p className="text-2xl font-bold text-text-primary">{taskStats.total}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Done</p>
            <p className="text-2xl font-bold text-emerald-500">{taskStats.done}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-500">{taskStats.inProgress}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Blocked</p>
            <p className="text-2xl font-bold text-red-500">{taskStats.blocked}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-primary" size={18} />
            <span className="text-sm font-semibold text-text-primary">Overall Progress</span>
            <div className="flex-1 bg-border/30 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${donePercentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-primary min-w-[3.5rem]">{donePercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-secondary" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="input text-sm h-9 w-40"
              >
                <option value="All">All Tasks</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input text-sm h-9 w-32"
              >
                <option value="recent">Recent</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto text-text-secondary/40" size={48} />
              <h3 className="mt-4 text-lg font-medium text-text-primary">
                {filterStatus === 'All' ? 'No tasks yet' : `No ${filterStatus.toLowerCase()} tasks`}
              </h3>
              <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
                {filterStatus === 'All'
                  ? 'Only prioritized work items (P1-P3) can have tasks. Mark items as priority in the Planning page.'
                  : 'Keep up the great work!'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Work Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Effort
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-surface-hover/30 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-text-primary max-w-md line-clamp-2" title={task.title}>
                            {task.title}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {task.work_item ? (
                            <div className="space-y-1">
                              <div className="text-sm text-text-primary font-medium line-clamp-1" title={task.work_item.title}>
                                {task.work_item.title}
                              </div>
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${
                                task.work_item.source_type === 'OKR' 
                                  ? 'bg-primary/10 text-primary border-primary/20' 
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                {task.work_item.source_type}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-text-primary">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {task.effort_hours ? (
                            <div className="flex items-center gap-1.5 text-sm text-text-primary">
                              <Clock size={14} className="text-text-secondary" />
                              <span className="font-medium">{task.effort_hours}h</span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                            task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            task.status === 'Blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-surface-hover text-text-secondary border-border/50'
                          }`}>
                            {task.status === 'In Progress' ? 'In Progress' : task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/tasks/${task.id}/edit`)}
                            className="btn btn-ghost p-2 hover:bg-primary/10 text-primary"
                            title="Edit Task"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - KEPT EXACTLY AS IS */}
              <div className="px-4 py-3 border-t border-border bg-surface-hover/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="input text-xs h-8 w-20"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-xs text-text-secondary">
                      {startIndex + 1}-{Math.min(endIndex, sortedTasks.length)} / {sortedTasks.length}
                    </span>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-1.5 py-0.5 border border-border rounded text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ‹
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-1.5 py-0.5 border rounded text-xs min-w-[22px] transition-colors ${
                                pageNum === currentPage
                                  ? 'bg-primary text-white border-primary'
                                  : 'border-border text-text-primary hover:bg-surface-hover'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-0.5 text-xs text-text-secondary">…</span>
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="px-1.5 py-0.5 border border-border rounded text-xs text-text-primary hover:bg-surface-hover transition-colors"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-1.5 py-0.5 border border-border rounded text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
