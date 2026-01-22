import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Trash2, Edit2, Plus, Users as UsersIcon, Building2 } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  department_id?: number | null;
  department?: {
    id: number;
    name: string;
  };
  users?: any[];
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
}

export const ManageTeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authorization - only executives and directors can manage teams
      if (!['executive', 'director', 'admin'].includes(user?.role || '')) {
        setError('You do not have permission to manage teams');
        return;
      }

      const [teamData, deptData] = await Promise.all([
        api.getTeams(),
        api.getDepartments(),
      ]);

      setTeams(teamData);
      setDepartments(deptData);
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
    setFormData({ name: '', department_id: '' });
  };

  const handleEdit = (team: Team) => {
    setShowAddForm(true);
    setEditingId(team.id);
    setFormData({
      name: team.name,
      department_id: team.department_id?.toString() || '',
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', department_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.name.trim()) {
        setError('Team name is required');
        return;
      }

      const data = {
        name: formData.name,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
      };

      if (editingId) {
        // Update
        await api.updateTeam(editingId, data);
        setSuccessMessage('Team updated successfully');
      } else {
        // Create
        await api.createTeam(data);
        setSuccessMessage('Team created successfully');
      }

      handleCancel();
      await fetchData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving team:', err);
      setError(err.response?.data?.detail || 'Failed to save team');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      setError(null);
      await api.deleteTeam?.(id);
      setSuccessMessage('Team deleted successfully');
      await fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.detail || 'Failed to delete team');
    }
  };

  if (!user || !['executive', 'director', 'admin'].includes(user.role)) {
    return (
      <Layout>
        <Alert type="error" message="You don't have permission to manage teams" />
      </Layout>
    );
  }

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  // Filter teams based on role
  const visibleTeams = user.role === 'director' 
    ? teams.filter((t) => {
        const directorDept = departments.find((d) => d.id === t.department_id);
        return directorDept && (directorDept as any).director_id === user.id;
      })
    : teams;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Teams</h1>
            <p className="text-lg text-text-secondary">Create, update, and delete teams</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Add Team
          </button>
        </div>

        {/* Messages */}
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Team' : 'Add New Team'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:border-primary"
                  placeholder="e.g., Frontend Team, Backend Team"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
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

        {/* Teams Table */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">All Teams ({visibleTeams.length})</h2>

          {visibleTeams.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No teams yet. Create one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Members</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => (
                    <tr key={team.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UsersIcon size={18} className="text-primary" />
                          <span className="font-semibold text-text-primary">{team.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {team.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-primary" />
                            <span className="text-text-primary">{team.department.name}</span>
                          </div>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                          {team.users?.length || 0} members
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(team)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(team.id)}
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

