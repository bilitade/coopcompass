import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { TeamDetail } from '../types';
import { Building2, Users, Mail, Shield } from 'lucide-react';

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

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="text-primary" size={24} />
            </div>
            My Team
          </h1>
          <p className="text-text-secondary mt-2">View your team information and members</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {teamData ? (
          <div className="space-y-6">
            {/* Team Info Card */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="text-primary" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{teamData.name}</h2>
                    <p className="text-text-secondary mt-1">Team ID: {teamData.id}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Created: {new Date(teamData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Users className="text-primary" size={24} />
                <h3 className="text-xl font-semibold text-text-primary">
                  Team Members ({teamData.users?.length || 0})
                </h3>
              </div>

              {teamData.users && teamData.users.length > 0 ? (
                <div className="grid gap-4">
                  {teamData.users.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-start gap-4 p-4 border border-border/50 rounded-lg hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-text-primary">{member.name}</h4>
                          {member.id === user?.id && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold">
                              You
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Mail size={16} />
                            <span className="truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Shield size={16} />
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0 text-right">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.is_active
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto text-text-secondary/40" size={48} />
                  <p className="mt-4 text-text-secondary">No team members found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-text-secondary/40" size={48} />
            <h3 className="mt-4 text-lg font-medium text-text-primary">No Team Information</h3>
            <p className="text-text-secondary mt-2">You are not assigned to any team</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

