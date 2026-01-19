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
  Circle,
  AlertCircle,
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

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'In Progress':
        return <Clock className="text-blue-600" size={20} />;
      case 'Blocked':
        return <AlertCircle className="text-red-600" size={20} />;
      default:
        return <Circle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-green-50 border-green-200';
      case 'In Progress':
        return 'bg-blue-50 border-blue-200';
      case 'Blocked':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">All team tasks and progress</p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus size={20} />
            <span>New Task</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
            <div className="text-3xl font-bold text-gray-900">{taskStats.total}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">{taskStats.done}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-blue-600">{taskStats.inProgress}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Blocked</div>
            <div className="text-3xl font-bold text-red-600">{taskStats.blocked}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="font-semibold text-gray-900">Overall Progress</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{donePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${donePercentage}%` }}
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Tasks</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 card">
              <CheckCircle className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {filterStatus === 'All' ? 'No tasks yet' : `No ${filterStatus.toLowerCase()} tasks`}
              </h3>
              <p className="mt-2 text-gray-600">
                {filterStatus === 'All'
                  ? 'Create tasks from work items to get started'
                  : 'Keep up the great work!'}
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`card border-l-4 ${getStatusColor(task.status)}`}
              >
                <div className="flex items-start space-x-4">
                  {getStatusIcon(task.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium line-clamp-2">{task.description}</p>
                    {task.work_item && (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Work Item:</span> {task.work_item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            task.work_item.source_type === 'OKR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {task.work_item.source_type}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {task.effort_hours && (
                        <span className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{task.effort_hours}h</span>
                        </span>
                      )}
                      {task.status && (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          task.status === 'Done' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
            ))
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

