import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { OKRPage } from './pages/OKRPage';
import { BAUPage } from './pages/BAUPage';
import { WorkItemsPage } from './pages/WorkItemsPage';
import { TasksPage } from './pages/TasksPage';
import { PriorityPage } from './pages/PriorityPage';
import { TeamPage } from './pages/TeamPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
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

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
