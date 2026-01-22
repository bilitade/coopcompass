import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DepartmentDetailViewPage } from './pages/DepartmentDetailViewPage';
import { TeamDetailViewPage } from './pages/TeamDetailViewPage';
import { ManageDepartmentsPage } from './pages/ManageDepartmentsPage';
import { ManageTeamsPage } from './pages/ManageTeamsPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { OKRPage } from './pages/OKRPage';
import { BAUPage } from './pages/BAUPage';
import { WorkItemsPage } from './pages/WorkItemsPage';
import { TasksPage } from './pages/TasksPage';
import { PriorityPage } from './pages/PriorityPage';
import { TeamPage } from './pages/TeamPage';
import { UserPage } from './pages/UserPage';
import { DirectorOKRListPage } from './pages/DirectorOKRListPage';
import { DirectorBAUListPage } from './pages/DirectorBAUListPage';
import { ExecutiveOKRListPage } from './pages/ExecutiveOKRListPage';
import { ExecutiveBAUListPage } from './pages/ExecutiveBAUListPage';

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return <Navigate to={isAuthenticated ? '/dashboard' : '/landing'} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
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
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
