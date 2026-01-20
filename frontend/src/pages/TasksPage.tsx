import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Task, WorkItem } from '../types';
import {
  Plus,
  CheckCircle,
  Clock,
  Filter,
  TrendingUp,
} from 'lucide-react';

interface TaskWithWorkItem extends Task {
  work_item?: WorkItem;
}

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithWorkItem[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<'All' | Task['status']>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'assignee'>('recent');

  const [taskForm, setTaskForm] = useState({
    description: '',
    work_item_id: '',
    assignee_id: '',
    effort_hours: '',
  });

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
      const [tasksData, workItemsData] = await Promise.all([
        api.getTeamTasks(user.team_id),
        api.getWorkItems({ team_id: user.team_id }),
      ]);
      setTasks(tasksData);
      setWorkItems(workItemsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskForm.work_item_id) {
      setError('Please select a work item');
      return;
    }

    try {
      await api.createTask(parseInt(taskForm.work_item_id), {
        description: taskForm.description,
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
        effort_hours: taskForm.effort_hours ? parseInt(taskForm.effort_hours) : null,
      });
      setSuccess('Task created successfully');
      setShowTaskModal(false);
      setTaskForm({
        description: '',
        work_item_id: '',
        assignee_id: '',
        effort_hours: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: Task['status']) => {
    try {
      await api.updateTask(taskId, { status });
      setSuccess('Task updated successfully');
      loadData();
    } catch (err: any) {
      setError('Failed to update task');
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
      <div className="space-y-3">
        {/* Header - Compact */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
            {/* Clear Stats Inline */}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>Total: <span className="font-semibold text-text-primary">{taskStats.total}</span></span>
              <span>Done: <span className="font-semibold text-green-600">{taskStats.done}</span></span>
              <span>In Progress: <span className="font-semibold text-blue-600">{taskStats.inProgress}</span></span>
              <span>Blocked: <span className="font-semibold text-red-600">{taskStats.blocked}</span></span>
            </div>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn btn-primary flex items-center space-x-1 px-3 py-1.5 text-sm"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Compact Progress Bar */}
        <div className="flex items-center gap-3">
          <TrendingUp className="text-green-600" size={16} />
          <span className="text-sm font-medium text-text-primary">Progress</span>
          <div className="flex-1 bg-border rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${donePercentage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-text-primary min-w-[3rem]">{donePercentage.toFixed(0)}%</span>
        </div>

        {/* Compact Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-secondary" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Tasks</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="recent">Recent</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Ultra-Compact Tasks Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-text-secondary" size={32} />
              <h3 className="mt-2 text-sm font-medium text-text-primary">
                {filterStatus === 'All' ? 'No tasks yet' : `No ${filterStatus.toLowerCase()} tasks`}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                {filterStatus === 'All'
                  ? 'Create tasks from work items to get started'
                  : 'Keep up the great work!'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-24">
                        Status
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-64">
                        Description
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-40">
                        Work Item
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-16">
                        Effort
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                        Created
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-28">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-surface h-10">
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                            task.status === 'Done' ? 'bg-green-500/10 text-green-600 dark:text-green-300' :
                            task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' :
                            task.status === 'Blocked' ? 'bg-red-500/10 text-red-600 dark:text-red-300' :
                            'bg-surface-hover text-text-primary'
                          }`}>
                            {task.status === 'In Progress' ? 'In Progress' : task.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="text-sm text-text-primary max-w-64 truncate" title={task.description}>
                            {task.description}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          {task.work_item ? (
                            <div>
                              <div className="text-sm text-text-primary font-medium truncate" title={task.work_item.name}>
                                {task.work_item.name}
                              </div>
                              <span className={`inline-block mt-0.5 px-1 py-0.5 text-xs font-medium rounded ${
                                task.work_item.source_type === 'OKR' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600 dark:text-green-300'
                              }`}>
                                {task.work_item.source_type}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {task.effort_hours ? (
                            <div className="flex items-center text-sm text-text-primary">
                              <Clock size={10} className="mr-1" />
                              {task.effort_hours}h
                            </div>
                          ) : (
                            <span className="text-xs text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-text-secondary">
                          {new Date(task.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                            className="px-1.5 py-0.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ultra-Compact Pagination */}
              <div className="px-2 py-1.5 border-t border-border bg-surface">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-1.5 py-0.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
                        className="px-1.5 py-0.5 border border-border rounded text-xs text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className={`px-1.5 py-0.5 border rounded text-xs min-w-[22px] ${
                                pageNum === currentPage
                                  ? 'bg-primary text-white border-primary'
                                  : 'border-border text-text-primary hover:bg-surface'
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
                              className="px-1.5 py-0.5 border border-border rounded text-xs text-text-primary hover:bg-surface"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-1.5 py-0.5 border border-border rounded text-xs text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Create Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          title="Create New Task"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="label">Select Work Item *</label>
              <select
                required
                className="input"
                value={taskForm.work_item_id}
                onChange={(e) => setTaskForm({ ...taskForm, work_item_id: e.target.value })}
              >
                <option value="">Choose a work item...</option>
                {workItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.source_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Task Description *</label>
              <textarea
                required
                className="input"
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>

            <div>
              <label className="label">Effort (hours)</label>
              <input
                type="number"
                className="input"
                value={taskForm.effort_hours}
                onChange={(e) => setTaskForm({ ...taskForm, effort_hours: e.target.value })}
                placeholder="Estimated hours"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Create Task
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

