import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { OKRDetail, KeyResult } from '../types';
import { Plus, Target } from 'lucide-react';

export const OKRPage: React.FC = () => {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKRDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showOKRModal, setShowOKRModal] = useState(false);
  const [showKRModal, setShowKRModal] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKRDetail | null>(null);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  
  const [okrForm, setOkrForm] = useState({ quarter: '', objective: '' });
  const [krForm, setKrForm] = useState({ description: '', target_value: '', unit: '' });

  // Quarter and Year filtering
  const [selectedQuarter, setSelectedQuarter] = useState<'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('All');
  const [selectedYear, setSelectedYear] = useState<'All' | string>('All');
  const [currentOKRIndex, setCurrentOKRIndex] = useState(0);

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

  const viewOKRDetail = (okrId: number) => {
    // Find the OKR and switch to its quarter and year view
    const okr = okrs.find(o => o.id === okrId);
    if (okr) {
      const [quarter, year] = okr.quarter.split(' ') as [typeof selectedQuarter, string];
      setSelectedQuarter(quarter);
      setSelectedYear(year);
      // Find index in filtered OKRs
      const filtered = okrs.filter(o => {
        const [oQuarter, oYear] = o.quarter.split(' ');
        return (selectedQuarter === 'All' || oQuarter === quarter) &&
               (year === 'All' || oYear === year);
      });
      const index = filtered.findIndex(o => o.id === okrId);
      setCurrentOKRIndex(index >= 0 ? index : 0);
    }
  };

  const handleCreateOKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.team_id) return;

    try {
      if (editingOKR) {
        // Edit mode
        await api.updateOKR(editingOKR.id, okrForm);
        setSuccess('OKR updated successfully');
      } else {
        // Create mode
        await api.createOKR(user.team_id, okrForm);
        setSuccess('OKR created successfully');
      }
      setShowOKRModal(false);
      setEditingOKR(null);
      setOkrForm({ quarter: '', objective: '' });
      loadOKRs();
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingOKR ? 'Failed to update OKR' : 'Failed to create OKR'));
    }
  };

  const handleCreateKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOKR) return;

    try {
      if (editingKR) {
        // Edit mode
        await api.updateKeyResult(editingKR.id, {
          description: krForm.description,
          target_value: parseFloat(krForm.target_value),
          unit: krForm.unit || undefined,
        });
        setSuccess('Key Result updated successfully');
      } else {
        // Create mode
        await api.createKeyResult(currentOKR.id, {
          ...krForm,
          target_value: parseFloat(krForm.target_value),
        });
        setSuccess('Key Result added successfully');
      }
      setShowKRModal(false);
      setEditingKR(null);
      setKrForm({ description: '', target_value: '', unit: '' });
      loadOKRs(); // Reload all OKRs to refresh the current view
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingKR ? 'Failed to update Key Result' : 'Failed to add Key Result'));
    }
  };

  const handleEditOKR = (okr: OKRDetail) => {
    setEditingOKR(okr);
    setOkrForm({ quarter: okr.quarter, objective: okr.objective });
    setShowOKRModal(true);
  };

  const handleDeleteOKR = async (okrId: number) => {
    if (!confirm('Are you sure you want to delete this OKR? This will permanently delete the OKR and all its key results. This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteOKR(okrId);
      setSuccess('OKR deleted successfully');
      loadOKRs();
      // Reset to first OKR if current one was deleted
      if (currentOKR && currentOKR.id === okrId) {
        setCurrentOKRIndex(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete OKR');
    }
  };


  const handleEditKR = (kr: KeyResult) => {
    setEditingKR(kr);
    setKrForm({
      description: kr.description,
      target_value: kr.target_value.toString(),
      unit: kr.unit || ''
    });
    setShowKRModal(true);
  };

  const handleDeleteKR = async (krId: number) => {
    if (!confirm('Are you sure you want to delete this key result? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteKeyResult(krId);
      setSuccess('Key result deleted successfully');
      loadOKRs(); // Reload to refresh the view
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete key result');
    }
  };

  const getCurrentYear = (): string => {
    return new Date().getFullYear().toString();
  };

  const handleArchiveOKR = async (okrId: number) => {
    try {
      await api.updateOKR(okrId, { is_active: false });
      setSuccess('OKR archived successfully');
      loadOKRs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to archive OKR');
    }
  };

  // Generate year range from 2024 to 2040
  const availableYears = Array.from({ length: 2040 - 2024 + 1 }, (_, i) => (2024 + i).toString());

  // Filter OKRs by year and quarter
  const filteredOKRs = okrs.filter(okr => {
    const [quarter, year] = okr.quarter.split(' ');

    // Year filter
    if (selectedYear !== 'All' && year !== selectedYear) return false;

    // Quarter filter
    if (selectedQuarter === 'All') return true;
    return quarter === selectedQuarter;
  });

  // Get current OKR to display (first one or selected index)
  const currentOKR = filteredOKRs.length > 0 ? filteredOKRs[Math.min(currentOKRIndex, filteredOKRs.length - 1)] : null;

  // Handle quarter change
  const handleQuarterChange = (quarter: 'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setSelectedQuarter(quarter);
    setCurrentOKRIndex(0); // Reset to first OKR when changing quarters
  };

  // Handle year change
  const handleYearChange = (year: 'All' | string) => {
    setSelectedYear(year);
    setCurrentOKRIndex(0); // Reset to first OKR when changing years
  };

  // Handle OKR navigation
  const handleNextOKR = () => {
    if (filteredOKRs.length > 1) {
      setCurrentOKRIndex((prev) => (prev + 1) % filteredOKRs.length);
    }
  };

  const handlePrevOKR = () => {
    if (filteredOKRs.length > 1) {
      setCurrentOKRIndex((prev) => (prev - 1 + filteredOKRs.length) % filteredOKRs.length);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">OKRs</h1>
            <p className="text-text-secondary mt-1">Objectives and Key Results</p>
          </div>
          <button
            onClick={() => {
              const defaultYear = selectedYear !== 'All' ? selectedYear : getCurrentYear();
              const defaultQuarter = selectedQuarter !== 'All' ? selectedQuarter : 'Q1';
              setOkrForm({ quarter: `${defaultQuarter} ${defaultYear}`, objective: '' });
              setShowOKRModal(true);
            }}
            className="btn btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus size={20} />
            <span>New OKR</span>
          </button>
        </div>

        {/* Year and Quarter Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value as 'All' | string)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary bg-surface"
            >
              <option value="All">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">Quarter:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => handleQuarterChange(e.target.value as 'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4')}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary bg-surface"
            >
              <option value="All">All Quarters</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>

          {(selectedQuarter !== 'All' || selectedYear !== 'All') && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                {filteredOKRs.length} OKR{filteredOKRs.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* OKR Display */}
        {selectedQuarter === 'All' ? (
          /* All OKRs List View */
          <div className="space-y-4">
            {filteredOKRs.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto text-text-secondary/40 dark:text-text-secondary/30" size={48} />
                <h3 className="mt-4 text-lg font-medium text-text-primary">No OKRs found</h3>
                <p className="mt-2 text-text-secondary">Create your first OKR to get started</p>
              </div>
            ) : (
              filteredOKRs.map((okr) => (
                <div key={okr.id} className="bg-surface border border-border rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Target className="text-primary" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">{okr.objective}</h3>
                        </div>
                        <p className="text-sm text-text-secondary">{okr.quarter}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-16">
                    <button
                      onClick={() => viewOKRDetail(okr.id)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Single OKR Detail View */
          <div className="space-y-6">
            {filteredOKRs.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto text-text-secondary/40 dark:text-text-secondary/30" size={48} />
                <h3 className="mt-4 text-lg font-medium text-text-primary">No OKRs for {selectedQuarter}</h3>
                <p className="mt-2 text-text-secondary">Create an OKR for this quarter to get started</p>
              </div>
            ) : (
              currentOKR && (
                <>
                  {/* OKR Navigation */}
                  {filteredOKRs.length > 1 && (
                    <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-lg">
                      <button
                        onClick={handlePrevOKR}
                        className="btn btn-secondary btn-sm"
                        disabled={filteredOKRs.length <= 1}
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-text-secondary">
                        {currentOKRIndex + 1} of {filteredOKRs.length} OKRs
                      </span>
                      <button
                        onClick={handleNextOKR}
                        className="btn btn-secondary btn-sm"
                        disabled={filteredOKRs.length <= 1}
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {/* OKR Detail */}
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Target className="text-primary" size={32} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">{currentOKR.objective}</h2>
                            <div className="flex items-center gap-3">
                              <span className="text-base text-text-secondary">{currentOKR.quarter}</span>
                            </div>
                          </div>
                        </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => currentOKR && handleEditOKR(currentOKR)}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          Edit OKR
                        </button>
                        {currentOKR?.is_active ? (
                          <button
                            onClick={() => currentOKR && handleDeleteOKR(currentOKR.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            Delete OKR
                          </button>
                        ) : (
                          <button
                            onClick={() => currentOKR && handleArchiveOKR(currentOKR.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            Unarchive OKR
                          </button>
                        )}
                        <button
                          onClick={() => setShowKRModal(true)}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add Key Result
                        </button>
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text-primary">Key Results</h3>
                      {currentOKR.key_results && currentOKR.key_results.length === 0 ? (
                        <div className="text-center py-8 bg-surface-highlight rounded-lg">
                          <Target className="mx-auto text-gray-400" size={32} />
                          <p className="mt-2 text-text-secondary">No key results yet</p>
                          <p className="text-sm text-text-secondary">Add your first key result to track progress</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {currentOKR.key_results?.map((kr) => (
                            <div key={kr.id} className="border border-border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <p className="text-text-primary font-medium flex-1">{kr.description}</p>
                                <div className="flex items-center gap-2">
                                  <div className="text-right mr-4">
                                    <div className="text-lg font-bold text-primary">
                                      {Math.round((parseFloat(kr.current_value) / parseFloat(kr.target_value)) * 100)}%
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleEditKR(kr)}
                                    className="p-1 text-text-secondary hover:text-primary transition-colors"
                                    title="Edit key result"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKR(kr.id)}
                                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                    title="Delete key result"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm text-text-secondary mb-3">
                                <span>Current: {kr.current_value} {kr.unit}</span>
                                <span>Target: {kr.target_value} {kr.unit}</span>
                              </div>
                              <div className="w-full bg-border rounded-full h-3">
                                <div
                                  className="bg-primary h-3 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min((parseFloat(kr.current_value) / parseFloat(kr.target_value)) * 100, 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}


        {/* Create/Edit OKR Modal */}
        <Modal
          isOpen={showOKRModal}
          onClose={() => {
            setShowOKRModal(false);
            setEditingOKR(null);
            setOkrForm({ quarter: '', objective: '' });
          }}
          title={editingOKR ? "Edit OKR" : "Create New OKR"}
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
              <button
                type="button"
                onClick={() => {
                  setShowOKRModal(false);
                  setEditingOKR(null);
                  setOkrForm({ quarter: '', objective: '' });
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                {editingOKR ? 'Update OKR' : 'Create OKR'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Add/Edit Key Result Modal */}
        <Modal
          isOpen={showKRModal}
          onClose={() => {
            setShowKRModal(false);
            setEditingKR(null);
            setKrForm({ description: '', target_value: '', unit: '' });
          }}
          title={editingKR ? "Edit Key Result" : "Add Key Result"}
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
              <button
                type="button"
                onClick={() => {
                  setShowKRModal(false);
                  setEditingKR(null);
                  setKrForm({ description: '', target_value: '', unit: '' });
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                {editingKR ? 'Update Key Result' : 'Add Key Result'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

