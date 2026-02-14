import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';

interface DepartmentDashboardProps {
  data: any;
  onNavigateTeam: (teamId: number) => void;
}

const MetricsCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; isPercentage?: boolean }> = ({
  label, value, icon, isPercentage
}) => (
  <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-3xl font-bold mt-2">
          {typeof value === 'number' && isPercentage ? `${value.toFixed(1)}%` : value}
        </p>
      </div>
      <div className="text-primary">{icon}</div>
    </div>
  </div>
);

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ data, onNavigateTeam }) => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Department Dashboard</h1>
        <p className="text-lg text-text-secondary">Overview of department performance and team health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard label="Total Teams" value={data.total_teams} icon={<Building2 size={32} />} />
        <MetricsCard label="Total Members" value={data.total_members} icon={<Users size={32} />} />
        <MetricsCard label="Avg OKR Progress" value={data.average_okr_progress} icon={<TrendingUp size={32} />} isPercentage />
        <MetricsCard label="Avg BAU Health" value={data.average_bau_health} icon={<Activity size={32} />} isPercentage />
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Teams Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.teams?.map((team: any) => (
            <div 
              key={team.team_id} 
              className="group border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-surface"
              onClick={() => onNavigateTeam(team.team_id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{team.team_name}</h3>
                <ArrowRight size={18} className="text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>OKR PROGRESS</span>
                    <span className="font-bold text-text-primary">{team.okr_progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${team.okr_progress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>BAU HEALTH</span>
                    <span className="font-bold text-text-primary">{team.bau_health.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${team.bau_health >= 90 ? 'bg-green-600' : team.bau_health >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`} 
                      style={{ width: `${team.bau_health}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs text-text-secondary">
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
