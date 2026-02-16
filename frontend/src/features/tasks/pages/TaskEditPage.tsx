import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { tasksApi } from '../services/tasksApi';
import { api } from '../../../shared/services/api';
import type { Task, TaskUpdate } from '../types';
import type { User } from '../../../shared/types';
import { ArrowLeft, Save } from 'lucide-react';

export const TaskEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  
  const [task, setTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Not Started' as Task['status'],
    assignee_id: '',
    effort_hours: '',
  });

  useEffect(() => {
    if (id && user?.team_id) {
      loadTask();
      loadTeamMembers();
    }
  }, [id, user?.team_id]);

  const loadTask = async () => {
    if (!id) return;

    try {
      const taskData = await tasksApi.getTask(parseInt(id));
      setTask(taskData);
      setTaskForm({
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status,
        assignee_id: taskData.assignee_id?.toString() || '',
        effort_hours: taskData.effort_hours?.toString() || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!user?.team_id) return;

    try {
      const members = await api.getTeamUsers(user.team_id);
      setTeamMembers(members);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !task) return;

    if (!taskForm.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: TaskUpdate = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: taskForm.status,
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
        effort_hours: taskForm.effort_hours ? parseInt(taskForm.effort_hours) : null,
      };

      await tasksApi.updateTask(parseInt(id), updateData);
      setSuccess('Task updated successfully');
      setTimeout(() => {
        navigate('/tasks');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  if (!task) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" message="Task not found" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-ghost p-2"
            title="Back to Tasks"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Edit Task</h1>
            <p className="text-sm text-text-secondary mt-0.5">Update task details</p>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Edit Form */}
        <form onSubmit={handleUpdateTask} className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="label">Task Title *</label>
            <input
              type="text"
              required
              className="input"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Enter task title"
              maxLength={255}
            />
          </div>

          <div>
            <label className="label">Task Description *</label>
            <textarea
              required
              className="input"
              rows={4}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="What needs to be done?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Status *</label>
              <select
                required
                className="input"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="label">Assign To</label>
              <select
                className="input"
                value={taskForm.assignee_id}
                onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Estimated Effort (hours)</label>
            <input
              type="number"
              min="1"
              className="input"
              value={taskForm.effort_hours}
              onChange={(e) => setTaskForm({ ...taskForm, effort_hours: e.target.value })}
              placeholder="Estimated hours"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={saving}
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

