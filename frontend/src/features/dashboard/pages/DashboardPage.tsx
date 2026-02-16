import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { TeamDashboard } from '../components/TeamDashboard';
import { DepartmentDashboard } from '../components/DepartmentDashboard';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('User not authenticated');
        return;
      }

      let data;

      // Load based on user role
      if (user.role === 'executive' || user.role === 'admin') {
        data = await api.getOrganizationDashboard();
        data.viewType = 'executive';
      } else if (user.role === 'director') {
        const departments = await api.getDepartments();
        const directorDept = departments.find((d: any) => d.director_id === user.id);
        
        if (!directorDept) {
          setError('You are not assigned as a director to any department.');
          return;
        }

        data = await api.getDepartmentDashboard(directorDept.id);
        data.viewType = 'department';
      } else if (user.role === 'member' || user.role === 'lead') {
        if (!user.team_id) {
          setError('You need to be assigned to a team to view the dashboard');
          return;
        }

        data = await api.getDashboard(user.team_id);
        data.viewType = 'team';
      } else {
        setError('Unknown user role');
        return;
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><Alert type="error" message={error} /></Layout>;
  if (!dashboardData) return <Layout><Alert type="info" message="No dashboard data available" /></Layout>;

  return (
    <Layout>
      {dashboardData.viewType === 'executive' && (
        <ExecutiveDashboard 
          data={dashboardData} 
          onNavigateDepartment={(id) => navigate(`/dashboard/department/${id}`)} 
        />
      )}
      
      {dashboardData.viewType === 'department' && (
        <DepartmentDashboard 
          data={dashboardData} 
          onNavigateTeam={(id) => navigate(`/dashboard/team/${id}`)} 
        />
      )}
      
      {dashboardData.viewType === 'team' && (
        <TeamDashboard data={dashboardData} />
      )}
    </Layout>
  );
};
