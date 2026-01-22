import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { UnifiedDashboard } from '../components/UnifiedDashboard';

export const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'executive') {
      setLoading(false);
    } else {
      setError('Only executives can access this page');
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== 'executive') {
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

  const handleNavigate = (type: string, id: number) => {
    if (type === 'department') {
      window.location.href = `/departments/${id}`;
    }
  };

  return (
    <Layout>
      <UnifiedDashboard 
        variant="organization"
        onNavigate={handleNavigate}
      />
    </Layout>
  );
};

