import React from 'react';
import { Building2, Users, TrendingUp, Activity, ShieldCheck, Map } from 'lucide-react';

interface ExecutiveDashboardProps {
  data: any;
  onNavigateDepartment: (deptId: number) => void;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean; subtext?: string }> = ({
  label, value, icon, isPercentage, subtext
}) => (
  <div className="bg-surface border border-border rounded-xl p-6 shadow-sm border-t-4 border-t-primary">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="text-4xl font-extrabold mt-1 tracking-tight">
        {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
      </p>
      {subtext && <p className="text-xs text-text-secondary mt-2">{subtext}</p>}
    </div>
  </div>
);

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ data, onNavigateDepartment }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Executive Dashboard</h1>
          <p className="text-lg text-text-secondary">Organizational performance and strategic overview</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-surface border border-border rounded-xl shadow-sm">
           <ShieldCheck className="text-primary" />
           <span className="font-bold text-sm">STRATEGIC VIEW 2024</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          label="Total Departments" 
          value={data.total_departments} 
          icon={<Building2 size={24} />} 
          subtext={`${data.total_teams} active teams`}
        />
        <MetricsCard 
          label="Total Workforce" 
          value={data.total_members} 
          icon={<Users size={24} />} 
          subtext="Across all locations"
        />
        <MetricsCard 
          label="OKR Progress" 
          value={data.average_okr_progress} 
          icon={<TrendingUp size={24} />} 
          isPercentage 
          subtext="Strategic objective tracking"
        />
        <MetricsCard 
          label="BAU Stability" 
          value={data.average_bau_health} 
          icon={<Activity size={24} />} 
          isPercentage 
          subtext="Operational continuity"
        />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <Map className="text-primary" size={28} />
          <h2 className="text-2xl font-bold">Departmental Breakdown</h2>
        </div>
        
        <div className="space-y-6">
          {data.departments?.map((dept: any) => (
            <div 
              key={dept.department_id}
              onClick={() => onNavigateDepartment(dept.department_id)}
              className="group relative bg-surface-hover border border-border rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold mb-1 group-hover:text-primary transition-colors">{dept.department_name}</h3>
                  <p className="text-sm text-text-secondary">Director: <span className="font-bold">{dept.director_name}</span></p>
                  <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <span>{dept.teams_count} Teams</span>
                    <span>{dept.members_count} Members</span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-text-secondary">OKR EXECUTION</span>
                       <span className="text-sm font-black">{dept.okr_progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full shadow-inner" style={{ width: `${dept.okr_progress}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-text-secondary">OPERATIONAL HEALTH</span>
                       <span className="text-sm font-black">{dept.bau_health.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full shadow-inner ${dept.bau_health >= 90 ? 'bg-green-600' : dept.bau_health >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`} 
                        style={{ width: `${dept.bau_health}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center p-3 bg-surface border border-border rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
