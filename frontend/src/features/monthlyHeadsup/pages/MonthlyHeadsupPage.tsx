import React, { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { useAuth } from '../../../app/context/AuthContext';
import { MonthlyHeadsup } from '../components/MonthlyHeadsup';
import { api } from '../../../shared/services/api';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Calendar, FileText, Plus, ArrowRight } from 'lucide-react';
import type { MonthlyHeadsUp } from '../../../shared/types';

export const MonthlyHeadsupPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.team_id) {
      loadHeadsup();
    }
  }, [user?.team_id, selectedMonth]);

  const loadHeadsup = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlyHeadsUp(user!.team_id!, selectedMonth);
      setHeadsup(data);
      setIsCreating(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHeadsup(null);
        setIsCreating(false);
      } else {
        console.error('Error loading headsup:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHeadsupSaved = (savedHeadsup: MonthlyHeadsUp) => {
    setHeadsup(savedHeadsup);
    setIsCreating(false);
  };

  if (!user?.team_id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-text-primary">Team Assignment Required</h1>
            <p className="text-text-secondary">You must be assigned to a team to access the monthly planning.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Show empty state if no headsup exists
  if (!headsup && !isCreating) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Monthly Headsup</h1>
              <p className="text-text-secondary mt-1 font-medium">Define the core focus and work items for the month.</p>
            </div>
            
            <div className="card flex items-center space-x-3 px-4 py-2 bg-surface shadow-sm border border-border">
              <Calendar className="text-primary" size={20} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-semibold text-text-primary"
              />
            </div>
          </div>

          <div className="card border-2 border-dashed border-border bg-surface/50">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FileText className="text-primary" size={48} />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-text-primary">No Monthly Headsup for {formatMonth(selectedMonth)}</h2>
                <p className="text-text-secondary">
                  Create a monthly heads-up to define your team's focus, objectives, and key work items for this month.
                </p>
              </div>

              <button
                onClick={() => setIsCreating(true)}
                className="btn btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
              >
                <Plus size={20} />
                <span>Create Monthly Headsup</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Monthly Headsup</h1>
            <p className="text-text-secondary mt-1 font-medium">
              {headsup ? 'Manage your monthly focus and work items' : 'Create your monthly focus and work items'}
            </p>
          </div>
          
          <div className="card flex items-center space-x-3 px-4 py-2 bg-surface shadow-sm border border-border">
            <Calendar className="text-primary" size={20} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-semibold text-text-primary"
            />
          </div>
        </div>

        <MonthlyHeadsup 
          teamId={user.team_id} 
          month={selectedMonth} 
          onSaved={handleHeadsupSaved}
          isCreating={isCreating}
        />
      </div>
    </Layout>
  );
};

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
