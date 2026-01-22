import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { UnifiedDashboard } from '../components/UnifiedDashboard';

export const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDirectorDepartment();
  }, [user]);

  const fetchDirectorDepartment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || user.role !== 'director') {
        setError('Only directors can access this dashboard');
        return;
      }

      // Get director's department
      const deptResponse = await api.getDepartments();
      const directorDept = deptResponse.find(d => d.director_id === user?.id);
      
      if (!directorDept) {
        setError('You are not assigned as a director to any department.');
        return;
      }
      
      setDepartment(directorDept);
    } catch (err: any) {
      console.error('Error fetching director dashboard:', err);
      if (err.response?.status === 403) {
        setError('You are not authorized to view this dashboard. Only directors can access this page.');
      } else if (err.response?.status === 404) {
        setError('You are not assigned as a director to any department.');
      } else {
        setError('Failed to load director dashboard');
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

  if (!department) {
    return (
      <Layout>
        <Alert type="error" message="Department not found" />
      </Layout>
    );
  }

  const handleNavigate = (type: string, id: number) => {
    if (type === 'team') {
      window.location.href = `/teams/${id}`;
    }
  };

  return (
    <Layout>
      <UnifiedDashboard 
        variant="department" 
        departmentId={department.id}
        onNavigate={handleNavigate}
      />
    </Layout>
  );
};

