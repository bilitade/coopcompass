import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User } from '../types';
import { Plus, Edit2, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const UserPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1);
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
        return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300';
      case 'lead':
        return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300';
      case 'member':
        return 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-300';
      case 'admin':
        return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-300';
      case 'director':
        return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300';
      default:
        return 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-300';
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Users</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage system users and their roles</p>
          </div>
          <button
            onClick={() => handleOpenUserModal()}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New User
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="text-center py-8 border border-border rounded-lg bg-surface">
            <Users size={40} className="mx-auto text-text-secondary/50 mb-3" />
            <p className="text-text-secondary mb-3">No users yet. Create your first user to get started.</p>
            <button
              onClick={() => handleOpenUserModal()}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <Plus size={18} />
              Create User
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-hover border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary">Team</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-text-primary">{user.name}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{user.email}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {user.is_active ? (
                          <span className="inline-block px-2 py-1 rounded bg-green-500/10 text-green-600 text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-red-500/10 text-red-600 text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {user.team_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-surface-hover rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface text-xs">
              <div className="text-text-secondary">
                {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-border rounded hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-0.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-border hover:bg-surface-hover text-text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-border rounded hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
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
        <form onSubmit={handleSubmitUser} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="Enter email address"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Role
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'member' | 'lead' | 'executive' })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
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
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete the user <strong>{selectedUserForDelete?.name}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUserForDelete(null);
              }}
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

