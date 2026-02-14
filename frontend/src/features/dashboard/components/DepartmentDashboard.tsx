import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';

interface DepartmentDashboardProps {
  data: any;
  onNavigateTeam: (teamId: number) => void;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean }> = ({
  label, value, icon, isPercentage
}) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
        <p className="text-3xl font-bold text-text-primary">
          {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
        </p>
      </div>
      <div className="p-2.5 bg-primary/5 rounded-lg text-primary">{icon}</div>
    </div>
  </div>
);

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ data, onNavigateTeam }) => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Department Dashboard</h1>
        <p className="text-base text-text-secondary">Overview of department performance and team health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard label="Total Teams" value={data.total_teams} icon={<Building2 size={24} />} />
        <MetricsCard label="Total Members" value={data.total_members} icon={<Users size={24} />} />
        <MetricsCard label="Avg OKR Progress" value={data.average_okr_progress} icon={<TrendingUp size={24} />} isPercentage />
        <MetricsCard label="Avg BAU Health" value={data.average_bau_health} icon={<Activity size={24} />} isPercentage />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-6 text-text-primary">Teams Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.teams?.map((team: any) => (
            <div 
              key={team.team_id} 
              className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-surface hover:bg-surface-hover/50"
              onClick={() => onNavigateTeam(team.team_id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">{team.team_name}</h3>
                <ArrowRight size={16} className="text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-text-secondary mb-1.5">
                    <span>OKR PROGRESS</span>
                    <span className="text-text-primary font-bold">{team.okr_progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border/50 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${team.okr_progress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-text-secondary mb-1.5">
                    <span>BAU HEALTH</span>
                    <span className="text-text-primary font-bold">{team.bau_health.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border/50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${team.bau_health >= 90 ? 'bg-emerald-500' : team.bau_health >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                      style={{ width: `${team.bau_health}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2 text-xs font-medium text-text-secondary/80">
                  <Users size={14} />
                  <span>{team.members_count} Members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
