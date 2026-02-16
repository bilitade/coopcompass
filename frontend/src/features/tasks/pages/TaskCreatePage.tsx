import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { tasksApi } from '../services/tasksApi';
import { api } from '../../../shared/services/api';
import type { WorkItem, User } from '../../../shared/types';
import { ArrowLeft, Save } from 'lucide-react';

export const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    work_item_id: '',
    assignee_id: '',
    effort_hours: '',
  });

  useEffect(() => {
    if (user?.team_id) {
      loadData();
    }
  }, [user?.team_id]);

  const loadData = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      return;
    }

    try {
      const [workItemsData, membersData] = await Promise.all([
        tasksApi.getPrioritizedWorkItems(user.team_id),
        api.getTeamUsers(user.team_id),
      ]);
      setWorkItems(workItemsData as any);
      setTeamMembers(membersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskForm.work_item_id) {
      setError('Please select a work item');
      return;
    }

    if (!taskForm.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await tasksApi.createTask(parseInt(taskForm.work_item_id), {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
        effort_hours: taskForm.effort_hours ? parseInt(taskForm.effort_hours) : null,
      });
      setSuccess('Task created successfully');
      setTimeout(() => {
        navigate('/tasks');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create New Task</h1>
            <p className="text-sm text-text-secondary mt-0.5">Add a new task to a prioritized work item</p>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Create Form */}
        <form onSubmit={handleCreateTask} className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="label">Select Prioritized Work Item *</label>
            <select
              required
              className="input"
              value={taskForm.work_item_id}
              onChange={(e) => setTaskForm({ ...taskForm, work_item_id: e.target.value })}
            >
              <option value="">Choose an active priority...</option>
              {workItems.map((item: any) => (
                <option key={item.id} value={item.id}>
                  P{item.priority}: {item.title} ({item.source_type})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-secondary italic">Only P1-P3 items for the current week are available.</p>
          </div>

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
              <span>{saving ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

