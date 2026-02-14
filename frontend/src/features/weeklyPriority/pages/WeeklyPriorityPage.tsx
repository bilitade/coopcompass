import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { useAuth } from '../../../app/context/AuthContext';
import { WeeklyPriority } from '../components/WeeklyPriority';
import { api } from '../../../shared/services/api';
import { Target, Calendar, FileText, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import type { MonthlyHeadsUp, WeeklyPriorityPlan } from '../../../shared/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

export const WeeklyPriorityPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [headsup, setHeadsup] = useState<MonthlyHeadsUp | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPriorityPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Update month when week changes if week doesn't belong to current month
  useEffect(() => {
    const weekMonth = getMonthFromWeek(selectedWeek);
    if (weekMonth && weekMonth !== selectedMonth) {
      setSelectedMonth(weekMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  useEffect(() => {
    if (user?.team_id) {
      loadData();
    }
  }, [user?.team_id, selectedMonth, selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      setIsCreating(false);
      
      // Load monthly headsup
      const headsupData = await api.getMonthlyHeadsUp(user!.team_id!, selectedMonth).catch((err: any) => {
        if (err.response?.status === 404) return null;
        throw err;
      });
      
      setHeadsup(headsupData);
      
      // If headsup exists, load weekly plan
      if (headsupData) {
        const planData = await api.getWeeklyPriorityPlan(headsupData.id, selectedWeek).catch((err: any) => {
          if (err.response?.status === 404) return null;
          throw err;
        });
        setWeeklyPlan(planData);
      } else {
        setWeeklyPlan(null);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setHeadsup(null);
      setWeeklyPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSaved = (savedPlan: WeeklyPriorityPlan) => {
    setWeeklyPlan(savedPlan);
    setIsCreating(false);
  };

  if (!user?.team_id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-text-primary">Team Assignment Required</h1>
            <p className="text-text-secondary">You must be assigned to a team to access weekly planning.</p>
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

  // Show message if monthly headsup doesn't exist
  if (!headsup) {
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

          <div className="card border-2 border-dashed border-border bg-surface/50">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="text-amber-600 dark:text-amber-400" size={48} />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-text-primary">Monthly Headsup Required</h2>
                <p className="text-text-secondary">
                  You must first create a <span className="font-semibold text-primary">Monthly Heads-Up</span> for{' '}
                  <span className="font-semibold">{formatMonth(selectedMonth)}</span> before you can plan weekly priorities.
                </p>
              </div>

              <Link 
                to="/monthly-headsup"
                className="btn btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
              >
                <FileText size={20} />
                <span>Go to Monthly Heads-Up</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show empty state if weekly plan doesn't exist
  if (!weeklyPlan && !isCreating) {
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

          <div className="card border-2 border-dashed border-border bg-surface/50">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Target className="text-primary" size={48} />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-text-primary">No Weekly Priority for {formatWeek(selectedWeek)}</h2>
                <p className="text-text-secondary">
                  Create a weekly priority plan to focus on specific work items from your monthly heads-up for this week.
                </p>
              </div>

              <button
                onClick={() => setIsCreating(true)}
                className="btn btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
              >
                <Plus size={20} />
                <span>Create Weekly Priority</span>
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
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Weekly Priorities</h1>
            <p className="text-text-secondary mt-1 font-medium">
              {weeklyPlan ? 'Manage your weekly priorities' : 'Create your weekly priorities'}
            </p>
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

        <WeeklyPriority 
          headsup={headsup} 
          week={selectedWeek}
          onSaved={handlePlanSaved}
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

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthFromWeek(week: string): string | null {
  // Format: YYYY-W## (e.g., 2024-W15)
  try {
    const [year, weekNum] = week.split('-W');
    if (!year || !weekNum) return null;
    
    const weekNumber = parseInt(weekNum);
    if (isNaN(weekNumber)) return null;
    
    // Calculate the date of the Monday of that week
    const jan4 = new Date(parseInt(year), 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const daysToMonday = (8 - jan4Day) % 7;
    const firstMonday = new Date(parseInt(year), 0, 4 + daysToMonday);
    const weekDate = new Date(firstMonday);
    weekDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    
    // Get the Monday of the selected week
    const startOfWeek = new Date(weekDate);
    startOfWeek.setDate(weekDate.getDate() - (weekDate.getDay() || 7) + 1);
    
    // Return month in YYYY-MM format
    const month = String(startOfWeek.getMonth() + 1).padStart(2, '0');
    return `${startOfWeek.getFullYear()}-${month}`;
  } catch {
    return null;
  }
}

function formatWeek(week: string): string {
  // Format: YYYY-W## (e.g., 2024-W15)
  const [year, weekNum] = week.split('-W');
  const weekNumber = parseInt(weekNum);
  
  // Calculate the date of the Monday of that week
  const jan4 = new Date(parseInt(year), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const daysToMonday = (8 - jan4Day) % 7;
  const firstMonday = new Date(parseInt(year), 0, 4 + daysToMonday);
  const weekDate = new Date(firstMonday);
  weekDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  const startOfWeek = new Date(weekDate);
  startOfWeek.setDate(weekDate.getDate() - (weekDate.getDay() || 7) + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const yearStr = startOfWeek.getFullYear();
  
  return `${startMonth} - ${endMonth}, ${yearStr}`;
}
