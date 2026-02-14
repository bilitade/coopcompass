import React, { useEffect, useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { Modal } from '../../../shared/components/Modal';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { Team, TeamDetail, User } from '../../../shared/types';
import { Plus, Edit2, Trash2, Users, Mail, UserCheck, X, Building2, Crown, Shield, Briefcase } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamDetails, setTeamDetails] = useState<Record<number, TeamDetail>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamForDelete, setSelectedTeamForDelete] = useState<Team | null>(null);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<User | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'lead'>('member');

  useEffect(() => {
    loadTeams();
    loadAvailableUsers();
  }, [user]);

  const loadTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const data = await api.getAvailableUsers();
      setAvailableUsers(data);
    } catch (err: any) {
      // Available users are not critical, so don't block loading
      console.error('Failed to load available users:', err);
    }
  };

  const handleOpenTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({ name: team.name, description: team.description || '' });
    } else {
      setEditingTeam(null);
      setTeamForm({ name: '', description: '' });
    }
    setShowTeamModal(true);
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      if (editingTeam) {
        // Update team
        await api.updateTeam(editingTeam.id, { 
          name: teamForm.name,
          description: teamForm.description || undefined
        });
        setSuccess('Team updated successfully');
      } else {
        // Create team
        await api.createTeam({ 
          name: teamForm.name,
          description: teamForm.description || undefined
        });
        setSuccess('Team created successfully');
      }
      setShowTeamModal(false);
      setTeamForm({ name: '', description: '' });
      setEditingTeam(null);
      await loadTeams();
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingTeam ? 'Failed to update team' : 'Failed to create team'));
    }
  };

  const handleShowUsers = async (team: Team) => {
    setSelectedTeam(team);
    try {
      const details = await api.getTeam(team.id);
      setTeamDetails(prev => ({ ...prev, [team.id]: details }));
      setShowUsersModal(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load team details');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserToAdd) return;

    try {
      // First add user to team
      await api.addUserToTeam(selectedTeam.id, selectedUserToAdd.id);
      
      // Then update role if needed
      if (newMemberRole === 'lead') {
        await api.updateUser(selectedUserToAdd.id, { role: 'lead' });
      }
      
      setSuccess(`User added as ${newMemberRole} successfully`);
      setShowAddMemberModal(false);
      setSelectedUserToAdd(null);
      setNewMemberRole('member');
      
      // Reload team details and available users
      const details = await api.getTeam(selectedTeam.id);
      setTeamDetails(prev => ({ ...prev, [selectedTeam.id]: details }));
      
      const availableUsersData = await api.getAvailableUsers();
      setAvailableUsers(availableUsersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTeam) return;

    try {
      await api.removeUserFromTeam(selectedTeam.id, memberId);
      setSuccess('Member removed successfully');
      
      // Reload team details and available users
      const details = await api.getTeam(selectedTeam.id);
      setTeamDetails(prev => ({ ...prev, [selectedTeam.id]: details }));
      
      const availableUsersData = await api.getAvailableUsers();
      setAvailableUsers(availableUsersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleSetTeamLead = async (userId: number) => {
    if (!selectedTeam) return;

    try {
      // Update user role to 'lead'
      await api.updateUser(userId, { role: 'lead' });
      setSuccess('Team lead assigned successfully');
      
      // Reload team details
      const details = await api.getTeam(selectedTeam.id);
      setTeamDetails(prev => ({ ...prev, [selectedTeam.id]: details }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set team lead');
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'member' | 'lead') => {
    if (!selectedTeam) return;

    try {
      await api.updateUser(userId, { role: newRole });
      setSuccess(`User role updated to ${newRole} successfully`);
      
      // Reload team details
      const details = await api.getTeam(selectedTeam.id);
      setTeamDetails(prev => ({ ...prev, [selectedTeam.id]: details }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  // Helper functions
  const getTeamLead = (users: User[] | undefined): User | null => {
    if (!users) return null;
    return users.find(u => u.role === 'lead') || null;
  };

  const getTeamMembers = (users: User[] | undefined): User[] => {
    if (!users) return [];
    return users.filter(u => u.role !== 'lead');
  };

  const handleDeleteClick = (team: Team) => {
    setSelectedTeamForDelete(team);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeamForDelete) return;

    try {
      await api.deleteTeam(selectedTeamForDelete.id);
      setSuccess('Team deleted successfully');
      setShowDeleteModal(false);
      setSelectedTeamForDelete(null);
      await loadTeams();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete team');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const teamDetailsCurrent = selectedTeam ? teamDetails[selectedTeam.id] : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Teams</h1>
            <p className="text-text-secondary mt-1">Manage your organization's teams</p>
          </div>
          <button
            onClick={() => handleOpenTeamModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={20} />
            New Team
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-text-secondary/50 mb-4" />
            <p className="text-text-secondary mb-4">No teams yet. Create your first team to get started.</p>
            <button
              onClick={() => handleOpenTeamModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus size={20} />
              Create Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-6 border border-border rounded-xl bg-surface-light hover:bg-surface-hover transition-all duration-200"
              >
                {/* Team Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">{team.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      ID: {team.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenTeamModal(team)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                      title="Edit team"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(team)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                      title="Delete team"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Team Info */}
                <div className="space-y-3 mb-4">
                  {/* Description */}
                  {team.description && (
                    <div className="text-sm text-text-secondary line-clamp-2">
                      {team.description}
                    </div>
                  )}
                  
                  {/* Department */}
                  {team.department ? (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Building2 size={16} className="text-primary" />
                      <span className="font-medium">{team.department.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Building2 size={16} className="text-text-secondary/50" />
                      <span>No department assigned</span>
                    </div>
                  )}
                  
                  {/* Team Lead */}
                  {(() => {
                    const teamLead = getTeamLead(team.users);
                    return teamLead ? (
                      <div className="flex items-center gap-2 text-sm p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <Crown size={16} className="text-amber-600" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-text-primary">{teamLead.name}</span>
                          {teamLead.position && (
                            <span className="text-text-secondary ml-2">• {teamLead.position}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-text-secondary p-2 bg-surface border border-border rounded-lg">
                        <Crown size={16} className="text-text-secondary/50" />
                        <span>No team lead assigned</span>
                      </div>
                    );
                  })()}
                  
                  {/* Member Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      <span className="font-semibold text-text-primary">
                        {team.users?.length || 0} {team.users?.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    {team.users && team.users.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Crown size={14} className="text-amber-600" />
                        <span className="text-text-secondary">
                          {team.users.filter(u => u.role === 'lead').length} lead{team.users.filter(u => u.role === 'lead').length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>Created:</span>
                    <span>{new Date(team.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* View Users Button */}
                <button
                  onClick={() => handleShowUsers(team)}
                  className="w-full px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} />
                  View Members
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Team Modal */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => {
          setShowTeamModal(false);
          setEditingTeam(null);
          setTeamForm({ name: '', description: '' });
        }}
        title={editingTeam ? 'Edit Team' : 'Create New Team'}
      >
        <form onSubmit={handleSubmitTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              placeholder="Enter team description (optional)"
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowTeamModal(false);
                setEditingTeam(null);
                setTeamForm({ name: '', description: '' });
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Team Members Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => {
          setShowUsersModal(false);
          setSelectedTeam(null);
        }}
        title={selectedTeam ? `${selectedTeam.name} - Members` : 'Team Members'}
      >
        <div className="space-y-4">
          {/* Add Member Button */}
          {availableUsers.length > 0 && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Member
            </button>
          )}

          {teamDetailsCurrent && teamDetailsCurrent.users && teamDetailsCurrent.users.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Team Lead Section */}
              {(() => {
                const teamLead = getTeamLead(teamDetailsCurrent.users);
                return teamLead ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={18} className="text-amber-600" />
                      <h3 className="text-sm font-bold text-text-primary">Team Lead</h3>
                    </div>
                    <div className="p-3 border-2 border-amber-500/30 rounded-lg bg-amber-500/5 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-text-primary">{teamLead.name}</p>
                          <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-700 text-xs rounded font-bold">
                            LEAD
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                          <Mail size={14} />
                          <span>{teamLead.email}</span>
                        </div>
                        {teamLead.position && (
                          <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                            <Briefcase size={14} />
                            <span>{teamLead.position}</span>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          {teamLead.is_active ? (
                            <span className="inline-block px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-red-500/10 text-red-600 text-xs rounded font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleChangeRole(teamLead.id, 'member')}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                          title="Remove as team lead"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(teamLead.id)}
                          className="p-2 text-text-secondary hover:text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                          title="Remove from team"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={18} className="text-text-secondary/50" />
                      <h3 className="text-sm font-bold text-text-primary">Team Lead</h3>
                    </div>
                    <div className="p-3 border border-border rounded-lg bg-surface text-center text-sm text-text-secondary">
                      No team lead assigned. Select a member below to set as lead.
                    </div>
                  </div>
                );
              })()}

              {/* Team Members Section */}
              {(() => {
                const members = getTeamMembers(teamDetailsCurrent.users);
                return members.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={18} className="text-primary" />
                      <h3 className="text-sm font-bold text-text-primary">Team Members ({members.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {members.map((teamUser) => (
                        <div
                          key={teamUser.id}
                          className="p-3 border border-border rounded-lg bg-surface-light flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-text-primary">{teamUser.name}</p>
                            <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                              <Mail size={14} />
                              <span>{teamUser.email}</span>
                            </div>
                            {teamUser.position && (
                              <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                                <Briefcase size={14} />
                                <span>{teamUser.position}</span>
                              </div>
                            )}
                            <div className="mt-2 flex gap-2">
                              <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium capitalize">
                                {teamUser.role}
                              </span>
                              {teamUser.is_active ? (
                                <span className="inline-block px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded font-medium">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 bg-red-500/10 text-red-600 text-xs rounded font-medium">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleSetTeamLead(teamUser.id)}
                              className="p-2 text-text-secondary hover:text-amber-600 hover:bg-surface-hover rounded-lg transition-colors"
                              title="Set as team lead"
                            >
                              <Crown size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(teamUser.id)}
                              className="p-2 text-text-secondary hover:text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                              title="Remove from team"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={40} className="mx-auto text-text-secondary/50 mb-2" />
              <p className="text-text-secondary">No members in this team yet</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => {
                setShowUsersModal(false);
                setSelectedTeam(null);
              }}
              className="w-full px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTeamForDelete(null);
        }}
        title="Delete Team"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete the team <strong>{selectedTeamForDelete?.name}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTeamForDelete(null);
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Team
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedUserToAdd(null);
          setNewMemberRole('member');
        }}
        title={selectedTeam ? `Add Member to ${selectedTeam.name}` : 'Add Member'}
      >
        <div className="space-y-4">
          {availableUsers.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Select a user to add
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg">
                  {availableUsers.map((availableUser) => (
                    <div
                      key={availableUser.id}
                      onClick={() => setSelectedUserToAdd(availableUser)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedUserToAdd?.id === availableUser.id
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <p className="font-medium text-text-primary">{availableUser.name}</p>
                      <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                        <Mail size={14} />
                        <span>{availableUser.email}</span>
                      </div>
                      {availableUser.position && (
                        <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                          <Briefcase size={14} />
                          <span>{availableUser.position}</span>
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium capitalize">
                          {availableUser.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedUserToAdd && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Role in Team
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMemberRole('member')}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors font-medium ${
                        newMemberRole === 'member'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users size={16} />
                        <span>Member</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMemberRole('lead')}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors font-medium ${
                        newMemberRole === 'lead'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Crown size={16} />
                        <span>Team Lead</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Users size={40} className="mx-auto text-text-secondary/50 mb-2" />
              <p className="text-text-secondary">No available users to add</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowAddMemberModal(false);
                setSelectedUserToAdd(null);
                setNewMemberRole('member');
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              disabled={!selectedUserToAdd}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add as {newMemberRole === 'lead' ? 'Team Lead' : 'Member'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

