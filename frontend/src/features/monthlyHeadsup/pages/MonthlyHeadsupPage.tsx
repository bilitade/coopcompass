import React, { useState } from 'react';
import { Layout } from '../../../shared/components/Layout';
import { useAuth } from '../../../app/context/AuthContext';
import { MonthlyHeadsup } from '../components/MonthlyHeadsup';
import { Calendar } from 'lucide-react';

export const MonthlyHeadsupPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

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

        <MonthlyHeadsup 
          teamId={user.team_id} 
          month={selectedMonth} 
          onSaved={(headsup) => console.log('Headsup saved:', headsup)}
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
