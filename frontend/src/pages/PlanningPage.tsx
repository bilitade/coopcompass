import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { WorkItem, WeeklyPriority } from '../types';
import { Plus, Star } from 'lucide-react';

export const PlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [priorities, setPriorities] = useState<WeeklyPriority[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityForm, setPriorityForm] = useState({
    work_item_id: '',
    priority: '1' as '1' | '2' | '3',
  });

  useEffect(() => {
    loadData();
  }, [user, selectedWeek]);

  const loadData = async () => {
    if (!user?.team_id) {
      setError('You need to be assigned to a team');
      setLoading(false);
      return;
    }

    try {
      const [workItemsData, prioritiesData] = await Promise.all([
        api.getWorkItems({ team_id: user.team_id }),
        api.getWeeklyPriorities({ week: selectedWeek, team_id: user.team_id }),
      ]);
      setWorkItems(workItemsData);
      setPriorities(prioritiesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPriority = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.setWeeklyPriority({
        work_item_id: parseInt(priorityForm.work_item_id),
        week: selectedWeek,
        priority: parseInt(priorityForm.priority) as 1 | 2 | 3,
      });
      setSuccess('Priority set successfully');
      setShowPriorityModal(false);
      setPriorityForm({ work_item_id: '', priority: '1' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set priority');
    }
  };

  const handleRemovePriority = async (priorityId: number) => {
    try {
      await api.deleteWeeklyPriority(priorityId);
      setSuccess('Priority removed successfully');
      loadData();
    } catch (err: any) {
      setError('Failed to remove priority');
    }
  };

  const getAvailableWorkItems = (): WorkItem[] => {
    const prioritizedIds = new Set(priorities.map(p => p.work_item_id));
    return workItems.filter(item => !prioritizedIds.has(item.id));
  };

  const getPrioritizedWorkItems = (priority: number): WorkItem[] => {
    const priorityIds = priorities
      .filter(p => p.priority === priority)
      .map(p => p.work_item_id);
    return workItems.filter(item => priorityIds.includes(item.id));
  };

  const getPriorityId = (workItemId: number): number | undefined => {
    return priorities.find(p => p.work_item_id === workItemId)?.id;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Planning</h1>
            <p className="text-gray-600 mt-1">Set priorities for the week</p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="input"
            />
            <button
              onClick={() => setShowPriorityModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Priority</span>
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Priority Sections */}
        <div className="space-y-6">
          {/* Priority 1 */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Star className="text-red-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Priority 1 - Critical</h2>
                <p className="text-sm text-gray-600">Must be completed this week</p>
              </div>
            </div>
            <div className="space-y-2">
              {getPrioritizedWorkItems(1).length === 0 ? (
                <p className="text-gray-500 text-sm">No items set</p>
              ) : (
                getPrioritizedWorkItems(1).map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    priority={1}
                    onRemove={() => {
                      const priorityId = getPriorityId(item.id);
                      if (priorityId) handleRemovePriority(priorityId);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Priority 2 */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="text-yellow-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Priority 2 - Important</h2>
                <p className="text-sm text-gray-600">Should be completed this week</p>
              </div>
            </div>
            <div className="space-y-2">
              {getPrioritizedWorkItems(2).length === 0 ? (
                <p className="text-gray-500 text-sm">No items set</p>
              ) : (
                getPrioritizedWorkItems(2).map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    priority={2}
                    onRemove={() => {
                      const priorityId = getPriorityId(item.id);
                      if (priorityId) handleRemovePriority(priorityId);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Priority 3 */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Priority 3 - Nice to Have</h2>
                <p className="text-sm text-gray-600">Can be started if time permits</p>
              </div>
            </div>
            <div className="space-y-2">
              {getPrioritizedWorkItems(3).length === 0 ? (
                <p className="text-gray-500 text-sm">No items set</p>
              ) : (
                getPrioritizedWorkItems(3).map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    priority={3}
                    onRemove={() => {
                      const priorityId = getPriorityId(item.id);
                      if (priorityId) handleRemovePriority(priorityId);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Set Priority Modal */}
        <Modal
          isOpen={showPriorityModal}
          onClose={() => setShowPriorityModal(false)}
          title="Set Weekly Priority"
        >
          <form onSubmit={handleSetPriority} className="space-y-4">
            <div>
              <label className="label">Select Work Item</label>
              <select
                required
                className="input"
                value={priorityForm.work_item_id}
                onChange={(e) => setPriorityForm({ ...priorityForm, work_item_id: e.target.value })}
              >
                <option value="">Choose a work item...</option>
                {getAvailableWorkItems().map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.month})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Priority Level</label>
              <select
                required
                className="input"
                value={priorityForm.priority}
                onChange={(e) => setPriorityForm({ ...priorityForm, priority: e.target.value as any })}
              >
                <option value="1">Priority 1 - Critical</option>
                <option value="2">Priority 2 - Important</option>
                <option value="3">Priority 3 - Nice to Have</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowPriorityModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Set Priority
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

interface WorkItemCardProps {
  item: WorkItem;
  priority: number;
  onRemove: () => void;
}

const WorkItemCard: React.FC<WorkItemCardProps> = ({ item, priority, onRemove }) => {
  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1:
        return 'border-l-red-500';
      case 2:
        return 'border-l-yellow-500';
      case 3:
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className={`border-l-4 ${getPriorityColor(priority)} bg-gray-50 rounded-lg p-4 flex justify-between items-center`}>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
          <span>{item.month}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            item.source_type === 'OKR' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
          }`}>
            {item.source_type}
          </span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Remove
      </button>
    </div>
  );
};

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = getWeekNumber(now);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

