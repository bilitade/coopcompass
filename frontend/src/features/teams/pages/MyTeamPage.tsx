import React, { useEffect, useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { TeamDetail, User } from '../../../shared/types';
import { Building2, Users, Mail, Shield, Crown, UserCircle } from 'lucide-react';

export const MyTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamData();
  }, [user?.team_id]);

  const loadTeamData = async () => {
    if (!user?.team_id) {
      setError('You are not assigned to any team');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getTeam(user.team_id);
      setTeamData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get role display name
  const getRoleDisplay = (role: string): string => {
    const roleMap: Record<string, string> = {
      'lead': 'Team Lead',
      'director': 'Director',
      'executive': 'Executive',
      'admin': 'Administrator',
      'member': 'Member'
    };
    return roleMap[role] || role;
  };

  // Separate leads/managers from members
  const getLeads = (users: User[]): User[] => {
    return users.filter(u => u.role === 'lead' || u.role === 'director' || u.role === 'executive');
  };

  const getMembers = (users: User[]): User[] => {
    return users.filter(u => u.role === 'member');
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">My Team</h1>
          <p className="text-sm text-text-secondary mt-0.5">Team information and members</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {teamData ? (
          <div className="space-y-5">
            {/* Team Name Card */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{teamData.name}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {teamData.users?.length || 0} {teamData.users?.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>
            </div>

            {/* Manager/Lead Section */}
            {teamData.users && getLeads(teamData.users).length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-primary">
                    Team Leadership
                  </h3>
                </div>
                <div className="grid gap-3">
                  {getLeads(teamData.users).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-surface-hover/50 hover:border-border transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-primary">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-sm text-text-primary">{lead.name}</h4>
                          {lead.id === user?.id && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Shield size={12} />
                            <span className="font-semibold capitalize">{getRoleDisplay(lead.role)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail size={12} />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.is_active
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {lead.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Section */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-primary" size={20} />
                <h3 className="text-lg font-bold text-text-primary">
                  Team Members ({getMembers(teamData.users || []).length})
                </h3>
              </div>

              {teamData.users && getMembers(teamData.users).length > 0 ? (
                <div className="grid gap-3">
                  {getMembers(teamData.users).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-surface-hover/50 hover:border-border transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-sm text-text-primary">{member.name}</h4>
                          {member.id === user?.id && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <div className="flex items-center gap-1">
                            <UserCircle size={12} />
                            <span className="font-semibold">{getRoleDisplay(member.role)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail size={12} />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.is_active
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto text-text-secondary/40" size={40} />
                  <p className="mt-3 text-sm text-text-secondary">No team members found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-surface border border-border rounded-xl">
            <Building2 className="mx-auto text-text-secondary/40" size={48} />
            <h3 className="mt-4 text-lg font-medium text-text-primary">No Team Information</h3>
            <p className="text-sm text-text-secondary mt-2">You are not assigned to any team</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

