import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { WorkItem, WorkItemDetail, Task, OKR, BAUActivity } from '../types';
import { Plus, ClipboardList, CheckCircle, Circle, AlertCircle, Clock, Calendar } from 'lucide-react';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getSourceName = (item: WorkItem, okrs: OKR[], keyResults: any[], bauActivities: BAUActivity[]): string => {
  if (item.source_type === 'OKR') {
    const kr = keyResults.find(k => k.id === item.source_id);
    if (kr) {
      return kr.description;
    }
  } else {
    const bau = bauActivities.find(b => b.id === item.source_id);
    if (bau) {
      return bau.name;
    }
  }
  return 'Unknown';
};

const getSourceOKRQuarter = (item: WorkItem, keyResults: any[]): string | null => {
  if (item.source_type === 'OKR') {
    const kr = keyResults.find(k => k.id === item.source_id);
    if (kr) {
      return kr.okr_quarter;
    }
  }
  return null;
};

export const WorkItemsPage: React.FC = () => {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItemDetail | null>(null);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [keyResults, setKeyResults] = useState<any[]>([]);
  const [bauActivities, setBauActivities] = useState<BAUActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showWorkItemModal, setShowWorkItemModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  const [workItemForm, setWorkItemForm] = useState({
    name: '',
    description: '',
    source_type: 'OKR' as 'OKR' | 'BAU',
    source_id: '',
    month: '',
  });
  
  const [taskForm, setTaskForm] = useState({
    description: '',
    assignee_id: '',
    effort_hours: '',
  });

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  const loadData = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      setLoading(false);
      return;
    }

    try {
      const [workItemsData, okrsData, bauData] = await Promise.all([
        api.getWorkItems({ team_id: user.team_id, month: selectedMonth }),
        api.getTeamOKRs(user.team_id),
        api.getTeamBAUActivities(user.team_id),
      ]);
      
      setWorkItems(workItemsData);
      setOkrs(okrsData);
      setBauActivities(bauData);

      // Flatten key results from all OKRs
      const allKeyResults: any[] = [];
      for (const okr of okrsData) {
        const okrDetail = await api.getOKR(okr.id);
        if (okrDetail.key_results) {
          okrDetail.key_results.forEach((kr: any) => {
            allKeyResults.push({
              ...kr,
              okr_objective: okr.objective,
              okr_quarter: okr.quarter,
            });
          });
        }
      }
      setKeyResults(allKeyResults);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkItemDetail = async (workItemId: number) => {
    try {
      const data = await api.getWorkItem(workItemId);
      setSelectedWorkItem(data);
    } catch (err: any) {
      setError('Failed to load work item details');
    }
  };

  const handleCreateWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.team_id) return;

    try {
      await api.createWorkItem({
        ...workItemForm,
        source_id: parseInt(workItemForm.source_id),
      });
      setSuccess('Work item created successfully');
      setShowWorkItemModal(false);
      setWorkItemForm({
        name: '',
        description: '',
        source_type: 'OKR',
        source_id: '',
        month: getCurrentMonth(),
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create work item');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkItem) return;

    try {
      await api.createTask(selectedWorkItem.id, {
        description: taskForm.description,
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
        effort_hours: taskForm.effort_hours ? parseInt(taskForm.effort_hours) : null,
      });
      setSuccess('Task created successfully');
      setShowTaskModal(false);
      setTaskForm({ description: '', assignee_id: '', effort_hours: '' });
      loadWorkItemDetail(selectedWorkItem.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: Task['status']) => {
    try {
      await api.updateTask(taskId, { status });
      setSuccess('Task updated successfully');
      if (selectedWorkItem) {
        loadWorkItemDetail(selectedWorkItem.id);
      }
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

  const calculateProgress = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const doneCount = tasks.filter(t => t.status === 'Done').length;
    return (doneCount / tasks.length) * 100;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Headsup</h1>
            <p className="text-gray-600 mt-1">Plan monthly work items from OKRs and BAU</p>
          </div>
          <button
            onClick={() => {
              setWorkItemForm({
                ...workItemForm,
                month: selectedMonth,
              });
              setShowWorkItemModal(true);
            }}
            className="btn btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus size={20} />
            <span>New Work Item</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Month Selector */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <Calendar size={20} className="text-blue-600" />
            <label className="font-medium text-gray-900">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">
              {getMonthName(selectedMonth)}
            </span>
          </div>
        </div>

        {/* Work Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workItems.map((item) => (
            <div
              key={item.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => loadWorkItemDetail(item.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.source_type === 'OKR' ? 'bg-primary-100' : 'bg-green-100'
                  }`}>
                    <ClipboardList className={item.source_type === 'OKR' ? 'text-primary-600' : 'text-green-600'} size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.month}</p>
                    
                    {/* Source Information */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.source_type === 'OKR' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.source_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">
                          {item.source_type === 'OKR' ? 'Key Result:' : 'BAU Activity:'}
                        </span>{' '}
                        {getSourceName(item, okrs, keyResults, bauActivities)}
                      </p>
                      {item.source_type === 'OKR' && getSourceOKRQuarter(item, keyResults) && (
                        <p className="text-xs text-gray-500">
                          {getSourceOKRQuarter(item, keyResults)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {workItems.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No work items yet</h3>
            <p className="mt-2 text-gray-600">Create work items from your OKRs or BAU activities</p>
          </div>
        )}

        {/* Work Item Detail Modal */}
        {selectedWorkItem && (
          <Modal
            isOpen={!!selectedWorkItem}
            onClose={() => setSelectedWorkItem(null)}
            title={selectedWorkItem.name}
            size="lg"
          >
            <div className="space-y-4">
              {selectedWorkItem.description && (
                <p className="text-gray-600">{selectedWorkItem.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Month: {selectedWorkItem.month}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedWorkItem.source_type === 'OKR' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
                }`}>
                  {selectedWorkItem.source_type}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Tasks</h3>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </div>

              {selectedWorkItem.tasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{calculateProgress(selectedWorkItem.tasks).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(selectedWorkItem.tasks)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {selectedWorkItem.tasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks yet</p>
                ) : (
                  selectedWorkItem.tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <p className="text-gray-900">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            {task.effort_hours && <span>{task.effort_hours}h</span>}
                            {task.assignee_id && <span>Assigned</span>}
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
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
            </div>
          </Modal>
        )}

        {/* Create Work Item Modal */}
        <Modal
          isOpen={showWorkItemModal}
          onClose={() => setShowWorkItemModal(false)}
          title="Create Work Item"
        >
          <form onSubmit={handleCreateWorkItem} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                required
                className="input"
                value={workItemForm.name}
                onChange={(e) => setWorkItemForm({ ...workItemForm, name: e.target.value })}
                placeholder="Work item name"
              />
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input"
                rows={3}
                value={workItemForm.description}
                onChange={(e) => setWorkItemForm({ ...workItemForm, description: e.target.value })}
                placeholder="Describe the work..."
              />
            </div>

            <div>
              <label className="label">Source Type</label>
              <select
                className="input"
                value={workItemForm.source_type}
                onChange={(e) => setWorkItemForm({ ...workItemForm, source_type: e.target.value as any, source_id: '' })}
              >
                <option value="OKR">OKR</option>
                <option value="BAU">BAU</option>
              </select>
            </div>

            <div>
              <label className="label">
                {workItemForm.source_type === 'OKR' ? 'Select Key Result' : 'Select BAU Activity'}
              </label>
              <select
                required
                className="input"
                value={workItemForm.source_id}
                onChange={(e) => setWorkItemForm({ ...workItemForm, source_id: e.target.value })}
              >
                <option value="">Select...</option>
                {workItemForm.source_type === 'OKR' ? (
                  keyResults.map((kr) => (
                    <option key={kr.id} value={kr.id}>
                      {kr.description} ({kr.okr_quarter} - {kr.okr_objective})
                    </option>
                  ))
                ) : (
                  bauActivities.map((bau) => (
                    <option key={bau.id} value={bau.id}>
                      {bau.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="label">Month (YYYY-MM)</label>
              <input
                type="month"
                required
                className="input"
                value={workItemForm.month}
                onChange={(e) => setWorkItemForm({ ...workItemForm, month: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowWorkItemModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Create Work Item
              </button>
            </div>
          </form>
        </Modal>

        {/* Create Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          title="Add Task"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="label">Task Description</label>
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
              <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Add Task
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

