import React from 'react';
import { TrendingUp, Activity, Calendar, Star, CheckCircle2, AlertCircle, Clock, Target, Layers, LayoutGrid } from 'lucide-react';
import type { Dashboard } from '../../../shared/types';

interface TeamDashboardProps {
  data: Dashboard;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean; colorClass?: string }> = ({
  label, value, icon, isPercentage, colorClass = "text-primary"
}) => (
  <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-4xl font-extrabold mt-2 group-hover:scale-105 transition-transform duration-300">
          {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
        </p>
      </div>
      <div className={`${colorClass} p-3 bg-surface-hover rounded-lg group-hover:bg-primary/10 transition-colors`}>{icon}</div>
    </div>
  </div>
);

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ data }) => {
  // Helper to get OKR Level color
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'strategic': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'operational': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'tactical': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'active': return <Activity size={14} className="text-blue-500" />;
      case 'draft': return <Clock size={14} className="text-slate-400" />;
      default: return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Main Metrics */}
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Team Dashboard</h1>
        <p className="text-lg text-text-secondary mt-1">Driving strategic execution and operational excellence</p>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsCard
          label="OKR Progress"
          value={data.okr_progress}
          icon={<TrendingUp className="w-8 h-8" />}
          isPercentage
        />
        <MetricsCard
          label="BAU Health"
          value={data.bau_health}
          icon={<Activity className="w-8 h-8" />}
          isPercentage
          colorClass="text-emerald-500"
        />
      </div>

      {/* 4-Quadrant Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Top: Weekly Priorities */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Star className="text-primary w-6 h-6" /></div>
              <h2 className="text-2xl font-bold">Weekly Priorities</h2>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">P1</span>
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">P2</span>
              <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">P3</span>
            </div>
          </div>

          {/* Unified Weekly Context */}
          {data.weekly_plan && (
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">Active Weekly Focus</p>
              <p className="text-base font-bold text-text-primary leading-tight lowercase">
                {data.weekly_plan.week_focus}
              </p>
            </div>
          )}

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!data.current_week_priorities || data.current_week_priorities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-text-secondary italic">
                <Target className="w-12 h-12 mb-2 opacity-20" />
                <p>No priorities set for this week</p>
              </div>
            ) : (
              data.current_week_priorities.map((priority) => (
                <div key={priority.priority_id} className="bg-surface-hover/50 border border-border/50 rounded-xl p-4 group hover:bg-surface-hover transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm line-clamp-2">{priority.work_item_name}</p>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border ${
                      priority.priority === 1 ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                      priority.priority === 2 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                      'bg-blue-500/10 text-blue-500 border-blue-500/30'
                    }`}>P{priority.priority}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 bg-border/30 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${priority.progress}%` }} />
                    </div>
                    <span className="text-xs font-black text-primary">{priority.progress.toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Top: Current OKRs */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="text-emerald-500 w-6 h-6" /></div>
            <h2 className="text-2xl font-bold">Current Team OKRs</h2>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {!data.okrs || data.okrs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-text-secondary italic">
                <Layers className="w-12 h-12 mb-2 opacity-20" />
                <p>No active OKRs for this quarter</p>
              </div>
            ) : (
              data.okrs.map((okr: any) => (
                <div key={okr.okr_id} className="border border-border/50 rounded-xl p-5 bg-surface-hover/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[80%]">
                      <h3 className="font-extrabold text-sm line-clamp-2">{okr.objective}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelColor(okr.okr_level)}`}>
                          {okr.okr_level}
                        </span>
                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-tight">{okr.quarter}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-primary">{okr.progress.toFixed(0)}%</span>
                      {getStatusIcon(okr.status || 'active')}
                    </div>
                  </div>
                  <div className="w-full bg-border/40 rounded-full h-2 shadow-inner">
                    <div className="bg-primary h-2 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" style={{ width: `${okr.progress}%` }} />
                  </div>
                  
                  {/* KR List with Progress Bars */}
                  {okr.key_results?.map((kr: any) => (
                    <div key={kr.kr_id} className="mt-4 first:mt-6 border-t border-border/20 pt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-tight line-clamp-1">{kr.description}</p>
                        <span className="text-[11px] font-black text-text-primary">{(kr.progress || 0).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-border/20 rounded-full h-1">
                        <div className="bg-emerald-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${kr.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Left Bottom: Monthly Heads-Up */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="text-blue-500 w-6 h-6" /></div>
            <h2 className="text-2xl font-bold">Monthly Heads-Up</h2>
          </div>
          <div className="flex-1 bg-surface-hover/50 rounded-2xl p-6 border border-border/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar size={120} />
            </div>
            {data.monthly_headsup ? (
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest">{data.monthly_headsup.month}</span>
                  <span className="text-xs font-bold text-text-secondary">Core Focus</span>
                </div>
                <p className="text-xl font-medium leading-relaxed text-text-primary italic">
                  "{data.monthly_headsup.description}"
                </p>

                {/* Key Work Items list */}
                {data.monthly_headsup.work_items && data.monthly_headsup.work_items.length > 0 && (
                  <div className="mt-8 relative z-10">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-4 tracking-widest border-b border-border/30 pb-2">Top 5 Monthly Work Items</p>
                    <div className="space-y-3">
                      {data.monthly_headsup.work_items.map((wi: any) => (
                        <div key={wi.id} className="flex items-center justify-between group/wi">
                          <p className="text-sm font-bold text-text-primary line-clamp-1 group-hover/wi:text-primary transition-colors">{wi.title}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                            wi.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            wi.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {wi.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary italic">
                <Calendar className="w-12 h-12 mb-2 opacity-20" />
                <p>No monthly focus set yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Bottom: Health Metrics */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Activity className="text-amber-500 w-6 h-6" /></div>
              <h2 className="text-2xl font-bold">Health Metrics</h2>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">View all</button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {data.bau_activities && data.bau_activities.length > 0 ? (
              data.bau_activities.flatMap(activity => 
                activity.metrics?.map(metric => ({
                  ...metric,
                  activityName: activity.name
                })) || []
              ).sort((a, b) => (a.achievement || 0) - (b.achievement || 0)).slice(0, 4).map((metric, idx) => (
                <div key={`${metric.id}-${idx}`} className="flex flex-col p-4 bg-surface-hover/30 rounded-xl border border-border/50 group hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-black truncate text-text-primary mb-0.5 tracking-tight">{metric.name}</p>
                      <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase opacity-60">
                         WT: {(parseFloat(metric.weight || '0') * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                      (metric.achievement || 0) >= 90 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                      (metric.achievement || 0) >= 70 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 
                      'text-red-500 bg-red-500/10 border-red-500/20'
                    }`}>
                      {(metric.achievement || 0) >= 90 ? 'Green' : (metric.achievement || 0) >= 70 ? 'Amber' : 'Red'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] font-black text-text-secondary">
                        {metric.current_value} / {metric.target_value} {metric.unit}
                    </p>
                    <p className={`text-sm font-black ${(metric.achievement || 0) >= 90 ? 'text-emerald-500' : (metric.achievement || 0) >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                      {(metric.achievement || 0).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary italic">
                <Activity className="w-12 h-12 mb-2 opacity-20" />
                <p>No health metrics available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BAU Activities Grid */}
      <div className="bg-surface border border-border rounded-3xl p-8 shadow-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg"><LayoutGrid className="text-primary w-6 h-6" /></div>
             <h2 className="text-2xl font-black">Business as Usual (BAU)</h2>
          </div>
          <span className="text-xs font-bold text-text-secondary bg-surface-hover px-4 py-2 rounded-full border border-border/50">
            {data.bau_activities?.length || 0} Active Channels
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.bau_activities?.map((activity) => (
            <div key={activity.id} className="bg-surface-hover/30 border border-border/50 rounded-2xl p-6 hover:bg-surface-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-sm line-clamp-1">{activity.name}</h3>
                <span className={`text-lg font-black ${(activity.activity_score || 0) >= 90 ? 'text-emerald-500' : (activity.activity_score || 0) >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                  {(activity.activity_score || 0).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-border/40 rounded-full h-1.5 mb-6">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${(activity.activity_score || 0) >= 90 ? 'bg-emerald-500' : (activity.activity_score || 0) >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${activity.activity_score || 0}%` }} 
                />
              </div>
              <div className="space-y-2">
                 {(activity.metrics || []).slice(0, 2).map((m: any) => (
                   <div key={m.id} className="flex justify-between items-center text-[10px]">
                      <span className="text-text-secondary font-medium line-clamp-1">{m.name}</span>
                      <span className="font-bold">{m.current_value} / {m.target_value}</span>
                   </div>
                 ))}
                 {(activity.metrics?.length || 0) > 2 && (
                   <p className="text-[10px] text-primary font-black pt-1 cursor-pointer hover:underline">+{activity.metrics.length - 2} more metrics</p>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OKR Timeline (Gantt-style) */}
      <div className="bg-surface border border-border rounded-3xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-10">
           <div className="p-2 bg-indigo-500/10 rounded-lg"><Clock className="text-indigo-500 w-6 h-6" /></div>
           <h2 className="text-2xl font-black">OKR Strategic Timeline</h2>
        </div>
        
        <div className="relative">
          {/* Timeline Grid Background */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
            {[1, 2, 3, 4].map(q => (
              <div key={q} className={`border-l border-border/30 h-full ${q === 1 ? 'border-l-0' : ''}`}>
                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest pt-2 pl-3">Quarter {q}</div>
              </div>
            ))}
          </div>

          <div className="relative pt-10 space-y-6">
            {data.all_okrs && data.all_okrs.length > 0 ? (
              data.all_okrs.map((okr: any) => {
                const qNum = parseInt(okr.quarter?.substring(1)) || 1;
                const leftPos = `${(qNum - 1) * 25}%`;
                
                return (
                  <div key={okr.id} className="relative h-12 flex items-center group">
                     {/* Quarter Column Indicator */}
                     <div 
                        className={`absolute h-full rounded-xl border p-3 flex items-center shadow-sm group-hover:shadow-md group-hover:scale-[1.02] transition-all duration-300 cursor-default ${getLevelColor(okr.okr_level)}`}
                        style={{ 
                          left: leftPos, 
                          width: '23%',
                          zIndex: 10
                        }}
                     >
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-black truncate pr-4">{okr.objective}</p>
                           <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                              <div className="bg-white/60 h-1 rounded-full" style={{ width: `${okr.progress}%` }} />
                           </div>
                        </div>
                        <div className="flex-shrink-0">
                           {getStatusIcon(okr.status || 'active')}
                        </div>
                     </div>
                     {/* Full Year Line */}
                     <div className="absolute w-full h-px bg-border/20 -z-1" />
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary italic">
                 <p>No OKR timeline data available</p>
              </div>
            )}
          </div>
          
          {/* Period Labels Bottom */}
          <div className="grid grid-cols-4 mt-12 pt-4 border-t border-border/20 text-center">
             <div className="text-[10px] font-black text-text-secondary">JAN - MAR</div>
             <div className="text-[10px] font-black text-text-secondary">APR - JUN</div>
             <div className="text-[10px] font-black text-text-secondary">JUL - SEP</div>
             <div className="text-[10px] font-black text-text-secondary">OCT - DEC</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-10">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/40" />
              <span className="text-[10px] font-black text-text-secondary uppercase">Strategic</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40" />
              <span className="text-[10px] font-black text-text-secondary uppercase">Operational</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span className="text-[10px] font-black text-text-secondary uppercase">Tactical</span>
           </div>
        </div>
      </div>
    </div>
  );
};
