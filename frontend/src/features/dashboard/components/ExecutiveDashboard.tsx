import React from 'react';
import { Building2, Users, TrendingUp, Activity, ShieldCheck, Map } from 'lucide-react';

interface ExecutiveDashboardProps {
  data: any;
  onNavigateDepartment: (deptId: number) => void;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean; subtext?: string }> = ({
  label, value, icon, isPercentage, subtext
}) => (
  <div className="card border-l-4 border-l-primary border-t-border border-r-border border-b-border">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-primary/5 rounded-lg text-primary">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="text-3xl font-bold mt-1 text-text-primary tracking-tight">
        {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
      </p>
      {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
    </div>
  </div>
);

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ data, onNavigateDepartment }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary tracking-tight">Executive Dashboard</h1>
          <p className="text-base text-text-secondary">Organizational performance and strategic overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg shadow-sm">
           <ShieldCheck className="text-primary" size={16} />
           <span className="font-bold text-xs text-text-primary">STRATEGIC VIEW 2024</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          label="Total Departments" 
          value={data.total_departments} 
          icon={<Building2 size={20} />} 
          subtext={`${data.total_teams} active teams`}
        />
        <MetricsCard 
          label="Total Workforce" 
          value={data.total_members} 
          icon={<Users size={20} />} 
          subtext="Across all locations"
        />
        <MetricsCard 
          label="OKR Progress" 
          value={data.average_okr_progress} 
          icon={<TrendingUp size={20} />} 
          isPercentage 
          subtext="Strategic objective tracking"
        />
        <MetricsCard 
          label="BAU Stability" 
          value={data.average_bau_health} 
          icon={<Activity size={20} />} 
          isPercentage 
          subtext="Operational continuity"
        />
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Map className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-text-primary">Departmental Breakdown</h2>
        </div>
        
        <div className="space-y-4">
          {data.departments?.map((dept: any) => (
            <div 
              key={dept.department_id}
              onClick={() => onNavigateDepartment(dept.department_id)}
              className="group relative bg-surface hover:bg-surface-hover/50 border border-border/50 rounded-xl p-5 transition-all hover:shadow-md cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 text-text-primary group-hover:text-primary transition-colors">{dept.department_name}</h3>
                  <p className="text-sm text-text-secondary">Director: <span className="font-semibold text-text-primary">{dept.director_name}</span></p>
                  <div className="mt-3 flex gap-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <span>{dept.teams_count} Teams</span>
                    <span>{dept.members_count} Members</span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="text-xs font-bold text-text-secondary">OKR EXECUTION</span>
                       <span className="text-sm font-bold text-text-primary">{dept.okr_progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border/50 rounded-full h-2">
                       <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${dept.okr_progress}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="text-xs font-bold text-text-secondary">OPERATIONAL HEALTH</span>
                       <span className="text-sm font-bold text-text-primary">{dept.bau_health.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${dept.bau_health >= 90 ? 'bg-emerald-500' : dept.bau_health >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${dept.bau_health}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center p-2.5 rounded-lg text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
