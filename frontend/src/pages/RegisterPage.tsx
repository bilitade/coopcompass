import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/Alert';
import { api } from '../services/api';
import { Compass, Moon, Sun, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member' as 'member' | 'lead' | 'executive',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      // Auto login after registration
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Compass className="text-primary-foreground" size={24} />
              </div>
              <span className="text-2xl font-bold text-primary">Compass</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Account</h1>
            <p className="text-text-secondary text-sm sm:text-base">Join your team on Compass</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && <Alert type="error" message={error} onClose={() => setError('')} />}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
                  Role
                </label>
                <select
                  id="role"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="member">Team Member</option>
                  <option value="lead">Team Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

