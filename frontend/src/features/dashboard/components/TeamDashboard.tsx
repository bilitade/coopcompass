import React from 'react';
import { TrendingUp, Activity, Calendar, Star } from 'lucide-react';
import type { Dashboard } from '../../../shared/types';

interface TeamDashboardProps {
  data: Dashboard;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean; colorClass?: string }> = ({
  label, value, icon, isPercentage, colorClass = "text-primary"
}) => (
  <div className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:border-primary/50 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-3xl font-bold mt-2">
          {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
        </p>
      </div>
      <div className={colorClass}>{icon}</div>
    </div>
  </div>
);

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Dashboard</h1>
        <p className="text-lg text-text-secondary">Overview of team performance and progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsCard
          label="OKR Progress"
          value={data.okr_progress}
          icon={<TrendingUp className="w-12 h-12" />}
          isPercentage
        />
        <MetricsCard
          label="BAU Health"
          value={data.bau_health}
          icon={<Activity className="w-12 h-12" />}
          isPercentage
          colorClass="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Weekly Focus */}
      {data.weekly_plan && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="text-primary w-6 h-6" />
            <h2 className="text-xl font-bold">Weekly Focus</h2>
          </div>
          <p className="text-lg text-text-primary italic">
            "{data.weekly_plan.week_focus}"
          </p>
        </div>
      )}

      {/* This Week's Priorities */}
      {data.current_week_priorities && data.current_week_priorities.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">This Week's Priorities</h2>
            <div className="flex gap-2 text-sm">
               <span className="flex items-center gap-1"><Star size={14} className="text-red-500" /> P1 (Critical)</span>
               <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> P2 (Important)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(pLevel => {
              const items = data.current_week_priorities.filter(p => p.priority === pLevel);
              return (
                <div key={pLevel} className="space-y-3">
                  <h3 className="text-sm font-bold uppercase text-text-secondary flex items-center gap-2">
                    Priority P{pLevel}
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-xs text-text-secondary italic">No items</p>
                  ) : (
                    items.map(priority => (
                      <div key={priority.priority_id} className="bg-surface-hover border border-border rounded-lg p-3">
                        <p className="font-semibold text-sm line-clamp-2">{priority.work_item_name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex-1 bg-border rounded-full h-1.5 mr-2">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${priority.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold">{priority.progress.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OKRs Details */}
      {data.okrs && data.okrs.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Objectives & Key Results</h2>
          <div className="space-y-6">
            {data.okrs.map((okr: any) => (
              <div key={okr.okr_id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{okr.objective}</h3>
                    <p className="text-xs text-text-secondary">{okr.okr_level} • {okr.quarter}</p>
                  </div>
                  <span className="text-xl font-bold text-primary">{okr.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 mb-6">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${okr.progress}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {okr.key_results?.map((kr: any) => (
                    <div key={kr.kr_id} className="bg-surface-hover p-3 rounded-md text-sm border border-border/50">
                      <p className="text-text-secondary mb-1 line-clamp-1">{kr.description}</p>
                      <div className="flex justify-between font-medium">
                         <span>{kr.current_value} / {kr.target_value}</span>
                         <span>{kr.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BAU Health */}
      {data.bau_activities && data.bau_activities.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Business as Usual (BAU)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.bau_activities.map((activity: any) => (
              <div key={activity.activity_id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{activity.activity_name}</h3>
                  <span className={`text-sm font-bold ${activity.health >= 90 ? 'text-green-600' : activity.health >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {activity.health.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${activity.health >= 90 ? 'bg-green-600' : activity.health >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`} 
                    style={{ width: `${activity.health}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
