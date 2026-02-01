import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

// Auth pages
import { LandingPage } from '../features/auth/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

// Dashboard pages
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

// Department pages
import { DepartmentsPage } from '../features/departments/pages/DepartmentsPage';
import { DepartmentDetailViewPage } from '../features/departments/pages/DepartmentDetailViewPage';
import { ManageDepartmentsPage } from '../features/departments/pages/ManageDepartmentsPage';

// Team pages
import { TeamPage } from '../features/teams/pages/TeamPage';
import { TeamDetailPage } from '../features/teams/pages/TeamDetailPage';
import { TeamDetailViewPage } from '../features/teams/pages/TeamDetailViewPage';
import { ManageTeamsPage } from '../features/teams/pages/ManageTeamsPage';
import { MyTeamPage } from '../features/teams/pages/MyTeamPage';

// OKR pages
import { OKRPage } from '../features/okrs/pages/OKRPage';
import { DirectorOKRListPage } from '../features/okrs/pages/DirectorOKRListPage';
import { ExecutiveOKRListPage } from '../features/okrs/pages/ExecutiveOKRListPage';

// BAU pages
import { BAUPage } from '../features/bau/pages/BAUPage';
import { DirectorBAUListPage } from '../features/bau/pages/DirectorBAUListPage';
import { ExecutiveBAUListPage } from '../features/bau/pages/ExecutiveBAUListPage';

// Work Items pages
import { WorkItemsPage } from '../features/workItems/pages/WorkItemsPage';
import { TasksPage } from '../features/workItems/pages/TasksPage';

// Priorities pages
import { PriorityPage } from '../features/priorities/pages/PriorityPage';

// User pages
import { UserPage } from '../features/users/pages/UserPage';

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return <Navigate to={isAuthenticated ? '/dashboard' : '/landing'} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root - redirect based on auth status */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Public Routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/department/:departmentId"
        element={
          <ProtectedRoute>
            <DepartmentDetailViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/team/:teamId"
        element={
          <ProtectedRoute>
            <TeamDetailViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-team"
        element={
          <ProtectedRoute>
            <MyTeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/director-dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive-dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/director/okrs"
        element={
          <ProtectedRoute>
            <DirectorOKRListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/director/bau"
        element={
          <ProtectedRoute>
            <DirectorBAUListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/okrs"
        element={
          <ProtectedRoute>
            <ExecutiveOKRListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/bau"
        element={
          <ProtectedRoute>
            <ExecutiveBAUListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-departments"
        element={
          <ProtectedRoute>
            <ManageDepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-teams"
        element={
          <ProtectedRoute>
            <ManageTeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/okrs"
        element={
          <ProtectedRoute>
            <OKRPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bau"
        element={
          <ProtectedRoute>
            <BAUPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:id"
        element={
          <ProtectedRoute>
            <TeamDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-items"
        element={
          <ProtectedRoute>
            <WorkItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weekly-priority"
        element={
          <ProtectedRoute>
            <PriorityPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
};

