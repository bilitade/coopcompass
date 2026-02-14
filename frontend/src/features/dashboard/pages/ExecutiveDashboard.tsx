import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { ExecutiveDashboard as ExecutiveDashboardComponent } from '../components/ExecutiveDashboard';

export const ExecutiveDashboard: React.FC = () => {
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

      if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
        setError('Only executives can access this page');
        return;
      }

      // Fetch organization dashboard data
      const data = await api.getOrganizationDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching executive dashboard:', err);
      setError(err.response?.data?.detail || 'Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'executive' && user.role !== 'admin')) {
    return (
      <Layout>
        <Alert type="error" message="This page is only accessible to executives." />
      </Layout>
    );
  }

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  if (error) {
    return (
      <Layout>
        <Alert type="error" message={error} />
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <Alert type="error" message="Dashboard data not available" />
      </Layout>
    );
  }

  return (
    <Layout>
      <ExecutiveDashboardComponent 
        data={dashboardData} 
        onNavigateDepartment={(id) => navigate(`/departments/${id}`)} 
      />
    </Layout>
  );
};

