import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { OKR, OKRDetail } from '../types';
import { Plus, Target } from 'lucide-react';

export const OKRPage: React.FC = () => {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [selectedOKR, setSelectedOKR] = useState<OKRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showOKRModal, setShowOKRModal] = useState(false);
  const [showKRModal, setShowKRModal] = useState(false);
  
  const [okrForm, setOkrForm] = useState({ quarter: '', objective: '' });
  const [krForm, setKrForm] = useState({ description: '', target_value: '', unit: '' });

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

  const loadOKRDetail = async (okrId: number) => {
    try {
      const data = await api.getOKR(okrId);
      setSelectedOKR(data);
    } catch (err: any) {
      setError('Failed to load OKR details');
    }
  };

  const handleCreateOKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.team_id) return;

    try {
      await api.createOKR(user.team_id, okrForm);
      setSuccess('OKR created successfully');
      setShowOKRModal(false);
      setOkrForm({ quarter: '', objective: '' });
      loadOKRs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create OKR');
    }
  };

  const handleCreateKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOKR) return;

    try {
      await api.createKeyResult(selectedOKR.id, {
        ...krForm,
        target_value: parseFloat(krForm.target_value),
      });
      setSuccess('Key Result added successfully');
      setShowKRModal(false);
      setKrForm({ description: '', target_value: '', unit: '' });
      loadOKRDetail(selectedOKR.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add Key Result');
    }
  };

  const getCurrentQuarter = (): string => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OKRs</h1>
            <p className="text-gray-600 mt-1">Objectives and Key Results</p>
          </div>
          <button
            onClick={() => {
              setOkrForm({ quarter: getCurrentQuarter(), objective: '' });
              setShowOKRModal(true);
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New OKR</span>
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* OKR List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {okrs.map((okr) => (
            <div
              key={okr.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => loadOKRDetail(okr.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Target className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{okr.objective}</h3>
                    <p className="text-sm text-gray-500">{okr.quarter}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  okr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {okr.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {okrs.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No OKRs yet</h3>
            <p className="mt-2 text-gray-600">Get started by creating your first OKR</p>
          </div>
        )}

        {/* OKR Detail Modal */}
        {selectedOKR && (
          <Modal
            isOpen={!!selectedOKR}
            onClose={() => setSelectedOKR(null)}
            title={selectedOKR.objective}
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{selectedOKR.quarter}</span>
                <button
                  onClick={() => setShowKRModal(true)}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Key Result</span>
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Key Results</h3>
                {selectedOKR.key_results.length === 0 ? (
                  <p className="text-gray-500 text-sm">No key results yet</p>
                ) : (
                  selectedOKR.key_results.map((kr) => (
                    <div key={kr.id} className="border rounded-lg p-4">
                      <p className="text-gray-900 font-medium mb-2">{kr.description}</p>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Current: {kr.current_value} {kr.unit}</span>
                        <span>Target: {kr.target_value} {kr.unit}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((parseFloat(kr.current_value) / parseFloat(kr.target_value)) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Create OKR Modal */}
        <Modal
          isOpen={showOKRModal}
          onClose={() => setShowOKRModal(false)}
          title="Create New OKR"
        >
          <form onSubmit={handleCreateOKR} className="space-y-4">
            <div>
              <label className="label">Quarter (e.g., Q1 2026)</label>
              <input
                type="text"
                required
                className="input"
                value={okrForm.quarter}
                onChange={(e) => setOkrForm({ ...okrForm, quarter: e.target.value })}
                placeholder="Q1 2026"
              />
            </div>

            <div>
              <label className="label">Objective</label>
              <textarea
                required
                className="input"
                rows={3}
                value={okrForm.objective}
                onChange={(e) => setOkrForm({ ...okrForm, objective: e.target.value })}
                placeholder="Describe your strategic objective..."
              />
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowOKRModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Create OKR
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Key Result Modal */}
        <Modal
          isOpen={showKRModal}
          onClose={() => setShowKRModal(false)}
          title="Add Key Result"
        >
          <form onSubmit={handleCreateKR} className="space-y-4">
            <div>
              <label className="label">Description</label>
              <textarea
                required
                className="input"
                rows={2}
                value={krForm.description}
                onChange={(e) => setKrForm({ ...krForm, description: e.target.value })}
                placeholder="What do you want to achieve?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Target Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={krForm.target_value}
                  onChange={(e) => setKrForm({ ...krForm, target_value: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="label">Unit</label>
                <input
                  type="text"
                  className="input"
                  value={krForm.unit}
                  onChange={(e) => setKrForm({ ...krForm, unit: e.target.value })}
                  placeholder="e.g., users, %, $"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowKRModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Add Key Result
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

