import React, { useEffect, useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Modal } from '../../../shared/components/Modal';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { WorkItem, OKR } from '../../../shared/types';
import { Plus, Calendar, ClipboardList } from 'lucide-react';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getSourceName = (item: WorkItem & { key_result?: any; bau_activity?: any }): string => {
  if (item.source_type === 'OKR' && item.key_result) {
    return item.key_result.description;
  } else if (item.source_type === 'BAU' && item.bau_activity) {
    return item.bau_activity.name;
  }
  return `Not linked (ID: ${item.source_id})`;
};

const getSourceOKRQuarter = (item: WorkItem & { key_result?: any }, okrs: OKR[]): string | null => {
  if (item.source_type === 'OKR' && item.key_result) {
    // Find the OKR that this key result belongs to
    const okr = okrs.find(o => 
      o.id === item.key_result?.okr_id
    );
    if (okr) {
      return `${okr.quarter}`;
    }
  }
  return null;
};

export const WorkItemsPage: React.FC = () => {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [keyResults, setKeyResults] = useState<any[]>([]);
  const [bauActivities, setBauActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showWorkItemModal, setShowWorkItemModal] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  const [workItemForm, setWorkItemForm] = useState({
    title: '',
    description: '',
    source_type: 'OKR' as 'OKR' | 'BAU',
    source_id: '',
    month: '',
    status: 'Not Started' as 'Not Started' | 'In Progress' | 'Completed',
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
      // Use the new endpoint that includes source data
      const workItemsData = await api.getWorkItemsWithSource({ team_id: user.team_id, month: selectedMonth });
      const okrsData = await api.getTeamOKRs(user.team_id);
      const bauData = await api.getTeamBAUActivities(user.team_id);
      
      setWorkItems(workItemsData);
      setOkrs(okrsData);
      setBauActivities(bauData);
      
      // Flatten key results for the form dropdown
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
        title: '',
        description: '',
        source_type: 'OKR',
        source_id: '',
        month: getCurrentMonth(),
        status: 'Not Started',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create work item');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Monthly Headsup</h1>
            <p className="text-text-secondary mt-1">Plan monthly work items from OKRs and BAU</p>
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
            <label className="font-medium text-text-primary">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-text-secondary">
              {getMonthName(selectedMonth)}
            </span>
          </div>
        </div>

        {/* Work Items List */}
        <div className="space-y-2">
          {workItems.map((item) => {
            const statusColors = {
              'Not Started': 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
              'In Progress': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
              'Completed': 'bg-green-500/10 text-green-700 dark:text-green-300',
            };
            
            return (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 border border-border rounded-lg hover:bg-surface-highlight transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Source Type Badge */}
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  item.source_type === 'OKR' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.source_type}
                </span>
                
                {/* Status Badge */}
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColors[item.status || 'Not Started']}`}>
                  {item.status || 'Not Started'}
                </span>
                
                {/* Work Item Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary truncate">{item.title}</h3>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-text-secondary">
                    <span>{item.month}</span>
                    <span>•</span>
                    <span className="truncate">
                      {item.source_type === 'OKR' ? 'Key Result:' : 'BAU Activity:'} {' '}
                      <span className="font-medium">{getSourceName(item as any)}</span>
                    </span>
                    {item.source_type === 'OKR' && getSourceOKRQuarter(item as any, okrs) && (
                      <>
                        <span>•</span>
                        <span>{getSourceOKRQuarter(item as any, okrs)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        {workItems.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto text-text-secondary/40 dark:text-text-secondary/30" size={48} />
            <h3 className="mt-4 text-lg font-medium text-text-primary">No work items yet</h3>
            <p className="mt-2 text-text-secondary">Create work items from your OKRs or BAU activities</p>
          </div>
        )}

        {/* Create Work Item Modal */}
        <Modal
          isOpen={showWorkItemModal}
          onClose={() => setShowWorkItemModal(false)}
          title="Create Work Item"
        >
          <form onSubmit={handleCreateWorkItem} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                required
                className="input"
                value={workItemForm.title}
                onChange={(e) => setWorkItemForm({ ...workItemForm, title: e.target.value })}
                placeholder="Work item title"
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
              <label className="label">Status</label>
              <select
                className="input"
                value={workItemForm.status}
                onChange={(e) => setWorkItemForm({ ...workItemForm, status: e.target.value as any })}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
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
      </div>
    </Layout>
  );
};

