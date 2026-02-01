import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, BarChart3, Moon, Sun, Compass } from 'lucide-react';
import { useTheme } from '../../../app/context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Compass className="text-primary-foreground" size={18} />
              </div>
              <span className="text-xl font-bold text-primary">Compass</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link
                to="/login"
                className="hidden sm:block px-3 sm:px-4 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm sm:text-base"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Navigate Your
              <span className="text-primary"> Performance</span>
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto px-2">
              Compass is the Cooperative Bank of Oromia's strategic performance management system for tracking objectives, managing operations, and aligning teams.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/register"
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg"
            >
              <span>Start Free</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center px-8 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Line */}
          <p className="text-text-secondary text-sm pt-6">
            Strategic performance management platform
          </p>
        </div>
      </section>

      {/* Features Grid - Minimal */}
      <section className="border-t border-border py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Compass className="text-primary" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Strategic Goals</h3>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
                Set and track OKRs that align your organization's vision with execution
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="text-primary" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Operations</h3>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
                Monitor BAU activities with real-time metrics and performance indicators
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Insights</h3>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
                Get actionable analytics to drive informed decisions and stay agile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-text-secondary text-sm gap-4">
          <p>&copy; 2026 Cooperative Bank of Oromia. All rights reserved.</p>
          <p>Compass - Strategic Performance Management System</p>
        </div>
      </footer>
    </div>
  );
};
