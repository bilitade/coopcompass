import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Trash2, Edit2, Plus, Building2, User } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  description?: string | null;
  director_id?: number | null;
  director?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const ManageDepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    director_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authorization - only executives and admins can manage departments
      if (user?.role !== 'executive' && user?.role !== 'admin') {
        setError('Only executives and admins can manage departments');
        return;
      }

      const [deptData, userData] = await Promise.all([
        api.getDepartments(),
        api.getUsers?.() || Promise.resolve([]),
      ]);

      setDepartments(deptData);
      setUsers(userData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ name: '', description: '', director_id: '' });
  };

  const handleEdit = (dept: Department) => {
    setShowAddForm(true);
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      director_id: dept.director_id?.toString() || '',
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', director_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.name.trim()) {
        setError('Department name is required');
        return;
      }

      const data = {
        name: formData.name,
        description: formData.description || undefined,
        director_id: formData.director_id ? parseInt(formData.director_id) : undefined,
      };

      if (editingId) {
        // Update
        await api.updateDepartment(editingId, data);
        setSuccessMessage('Department updated successfully');
      } else {
        // Create
        await api.createDepartment(data);
        setSuccessMessage('Department created successfully');
      }

      handleCancel();
      await fetchData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving department:', err);
      setError(err.response?.data?.detail || 'Failed to save department');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      setError(null);
      await api.deleteDepartment(id);
      setSuccessMessage('Department deleted successfully');
      await fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.detail || 'Failed to delete department');
    }
  };

  if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
    return (
      <Layout>
        <Alert type="error" message="You don't have permission to manage departments" />
      </Layout>
    );
  }

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Departments</h1>
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Add Department
          </button>
        </div>

        {/* Messages */}
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Department' : 'Add New Department'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:border-primary"
                  placeholder="e.g., Engineering, Product, Marketing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Department description..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Director
                </label>
                <select
                  value={formData.director_id}
                  onChange={(e) => setFormData({ ...formData, director_id: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Select a director...</option>
                  {users
                    .filter((u) => u.role === 'director')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Departments Table */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">All Departments ({departments.length})</h2>

          {departments.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No departments yet. Create one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Director</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="text-primary" />
                          <span className="font-semibold text-text-primary">{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {dept.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {dept.director ? (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            <div>
                              <p className="font-semibold text-text-primary">{dept.director.name}</p>
                              <p className="text-xs text-text-secondary">{dept.director.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {new Date(dept.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(dept)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

