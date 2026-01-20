import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User, UserCreate } from '../types';
import { Plus, Edit2, Trash2, Users, Mail, Shield, X } from 'lucide-react';

export const UserPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'member' as 'member' | 'lead' | 'executive',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role as 'member' | 'lead' | 'executive',
        password: '',
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        role: 'member',
        password: '',
      });
    }
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.role) {
      setError('All fields are required');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      setError('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        await api.updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        });
        setSuccess('User updated successfully');
      } else {
        // Create user
        await api.createUser({
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          password: userForm.password,
        });
        setSuccess('User created successfully');
      }
      setShowUserModal(false);
      setUserForm({
        name: '',
        email: '',
        role: 'member',
        password: '',
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUserForDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserForDelete) return;

    try {
      await api.deleteUser(selectedUserForDelete.id);
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUserForDelete(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
      setShowDeleteModal(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'executive':
        return 'bg-purple-500/10 text-purple-600';
      case 'lead':
        return 'bg-blue-500/10 text-blue-600';
      case 'member':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Users</h1>
            <p className="text-text-secondary mt-1">Manage system users and their roles</p>
          </div>
          <button
            onClick={() => handleOpenUserModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={20} />
            New User
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-text-secondary/50 mb-4" />
            <p className="text-text-secondary mb-4">No users yet. Create your first user to get started.</p>
            <button
              onClick={() => handleOpenUserModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus size={20} />
              Create User
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-hover border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Team</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                          <div className="flex items-center gap-1">
                            <Shield size={14} />
                            {user.role}
                          </div>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.is_active ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {user.team_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 text-text-secondary hover:text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                            title="Delete user"
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
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
          setUserForm({
            name: '',
            email: '',
            role: 'member',
            password: '',
          });
        }}
        title={editingUser ? 'Edit User' : 'Create New User'}
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Name
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Role
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'member' | 'lead' | 'executive' })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUserModal(false);
                setEditingUser(null);
                setUserForm({
                  name: '',
                  email: '',
                  role: 'member',
                  password: '',
                });
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUserForDelete(null);
        }}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete the user <strong>{selectedUserForDelete?.name}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUserForDelete(null);
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

