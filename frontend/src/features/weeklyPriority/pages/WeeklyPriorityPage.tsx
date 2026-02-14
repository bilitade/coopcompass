import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { useAuth } from '../../../app/context/AuthContext';
import { WeeklyPriority } from '../components/WeeklyPriority';
import { api } from '../../../shared/services/api';
import { Target, Calendar, LayoutDashboard } from 'lucide-react';
import type { MonthlyHeadsUp } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

export const WeeklyPriorityPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      setHeadsup(null);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.team_id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-vh-60">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Team Required</h1>
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
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Weekly Priorities</h1>
            <p className="text-text-secondary mt-1 font-medium">Prioritize your monthly work items for this week.</p>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="card flex items-center space-x-2 px-3 py-1.5 bg-surface border border-border sm:flex hidden">
                <Calendar size={16} className="text-primary" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-semibold"
                />
             </div>
             <div className="card flex items-center space-x-2 px-3 py-1.5 bg-surface border border-border">
                <Target size={16} className="text-primary" />
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-semibold"
                />
             </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : headsup ? (
        <WeeklyPriority 
          headsup={headsup} 
          week={selectedWeek} 
        />
        ) : (
          <div className="card text-center py-20 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <LayoutDashboard size={40} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-text-primary">Month Not Initialized</h2>
              <p className="text-text-secondary mt-2">
                You must first define the <span className="font-bold text-primary italic">Monthly Heads-Up</span> for {selectedMonth} before you can plan specific weeks.
              </p>
            </div>
            <Link 
              to="/monthly-headsup"
              className="btn btn-primary px-8 inline-block"
            >
              Go to Monthly Heads-Up
            </Link>
          </div>
        )}
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

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = getWeekNumber(now);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
