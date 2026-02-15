import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { tasksApi } from '../services/tasksApi';
import type { TaskDetail } from '../types';
import {
  ArrowLeft,
  Edit,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [task, setTask] = useState<TaskDetail | null>(null);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    if (!id) return;

    try {
      const taskData = await tasksApi.getTask(parseInt(id));
      setTask(taskData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'In Progress':
        return <Clock className="text-blue-500" size={20} />;
      case 'Blocked':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Circle className="text-text-secondary" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Blocked':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-surface-hover text-text-secondary border-border/50';
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  if (error || !task) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" message={error || 'Task not found'} />
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-secondary mt-4"
          >
            Back to Tasks
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tasks')}
              className="btn btn-ghost p-2"
              title="Back to Tasks"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Task Details</h1>
              <p className="text-sm text-text-secondary mt-0.5">View complete task information</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Edit size={18} />
            <span>Edit Task</span>
          </button>
        </div>

        {/* Task Information Card */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary mb-2">{task.title}</h2>
              <div className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                <span className={`px-3 py-1 rounded-md text-sm font-bold border ${getStatusColor(task.status)}`}>
                  {task.status === 'In Progress' ? 'In Progress' : task.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-text-secondary" size={18} />
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Description</h3>
            </div>
            <p className="text-text-primary whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            {/* Work Item */}
            {task.work_item && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-text-secondary" size={16} />
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Work Item</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-primary">{task.work_item.title}</p>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${
                    task.work_item.source_type === 'OKR' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {task.work_item.source_type}
                  </span>
                </div>
              </div>
            )}

            {/* Assigned To */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="text-text-secondary" size={16} />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Assigned To</h3>
              </div>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {task.assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{task.assignee.name}</p>
                    <p className="text-xs text-text-secondary">{task.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Unassigned</p>
              )}
            </div>

            {/* Effort Hours */}
            {task.effort_hours && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-text-secondary" size={16} />
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Estimated Effort</h3>
                </div>
                <p className="text-sm font-medium text-text-primary">{task.effort_hours} hours</p>
              </div>
            )}

            {/* Blocked Reason */}
            {task.status === 'Blocked' && task.blocked_reason && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-500" size={16} />
                  <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Blocked Reason</h3>
                </div>
                <p className="text-sm text-text-primary">{task.blocked_reason}</p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {task.created_at && (
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Created At</p>
                <p className="text-sm text-text-primary">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
            )}
            {task.completed_at && (
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Completed At</p>
                <p className="text-sm text-text-primary">
                  {new Date(task.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-secondary flex-1"
          >
            Back to Tasks
          </button>
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            <span>Edit Task</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

