import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { DepartmentDashboard } from '../components/DepartmentDashboard';

export const DirectorDashboard: React.FC = () => {
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

      if (!user || user.role !== 'director') {
        setError('Only directors can access this dashboard');
        return;
      }

      // Get director's department
      const departments = await api.getDepartments();
      const directorDept = departments.find((d: any) => d.director_id === user.id);
      
      if (!directorDept) {
        setError('You are not assigned as a director to any department.');
        return;
      }

      // Fetch department dashboard data
      const data = await api.getDepartmentDashboard(directorDept.id);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching director dashboard:', err);
      if (err.response?.status === 403) {
        setError('You are not authorized to view this dashboard. Only directors can access this page.');
      } else if (err.response?.status === 404) {
        setError('You are not assigned as a director to any department.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load director dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'director') {
    return (
      <Layout>
        <Alert type="error" message="This page is only accessible to directors." />
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
      <DepartmentDashboard 
        data={dashboardData} 
        onNavigateTeam={(id) => navigate(`/teams/${id}`)} 
      />
    </Layout>
  );
};

