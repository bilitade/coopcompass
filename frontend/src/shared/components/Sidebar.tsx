import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Activity,
  Calendar,
  CheckSquare,
  X,
  Users,
  Building2,
  Layers,
  Sparkles,
  Clock,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Role-based navigation configuration
  const getNavigationItems = () => {
    if (!user) return [];

    const { role } = user;

    // LEAD - Manages own team: OKRs, BAU, Work Items, Priorities, Tasks
    if (role === 'lead') {
      const teamId = user.team_id;
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'My Team', path: '/my-team', icon: <Users size={20} /> },
        { label: 'OKRs', path: '/okrs', icon: <Target size={20} /> },
        { label: 'OKR Validator', path: '/okrs/validator', icon: <Sparkles size={20} /> },
        { label: 'BAU Activities', path: '/bau-activities', icon: <Activity size={20} /> },
        { label: 'Monthly Heads-Up', path: '/monthly-headsup', icon: <Calendar size={20} /> },
        { label: 'Weekly Priority', path: '/weekly-priority', icon: <Clock size={20} /> },
        { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
        ...(teamId ? [{ label: 'Snapshots', path: `/teams/${teamId}/snapshots`, icon: <BarChart3 size={20} /> }] : []),
      ];
    }

    // DIRECTOR - Views department teams and performance (read-only)
    if (role === 'director') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'My Department', path: '/departments', icon: <Building2 size={20} /> },
        { label: 'OKRs Overview', path: '/director/okrs', icon: <Target size={20} /> },
        { label: 'BAU Overview', path: '/director/bau', icon: <Activity size={20} /> },
        { label: 'OKR Validator', path: '/okrs/validator', icon: <Sparkles size={20} /> },
      ];
    }

    // EXECUTIVE - Organization-wide view (read-only)
    if (role === 'executive') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Organization', path: '/departments', icon: <Building2 size={20} /> },
        { label: 'OKRs Overview', path: '/executive/okrs', icon: <Target size={20} /> },
        { label: 'BAU Overview', path: '/executive/bau', icon: <Activity size={20} /> },
        { label: 'OKR Validator', path: '/okrs/validator', icon: <Sparkles size={20} /> },
      ];
    }

    // ADMIN - System management and full visibility
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Users', path: '/users', icon: <Users size={20} /> },
        { label: 'Departments', path: '/manage-departments', icon: <Building2 size={20} /> },
        { label: 'Teams', path: '/teams', icon: <Layers size={20} /> },
        { label: 'OKRs Overview', path: '/executive/okrs', icon: <Target size={20} /> },
        { label: 'OKR Validator', path: '/okrs/validator', icon: <Sparkles size={20} /> },
        { label: 'BAU Overview', path: '/executive/bau', icon: <Activity size={20} /> },
      ];
    }

    // MEMBER - Basic view (team dashboard and personal tasks)
    const teamId = user.team_id;
    return [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'My Team', path: '/my-team', icon: <Users size={20} /> },
      { label: 'My Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
      { label: 'OKR Validator', path: '/okrs/validator', icon: <Sparkles size={20} /> },
      ...(teamId ? [{ label: 'Snapshots', path: `/teams/${teamId}/snapshots`, icon: <BarChart3 size={20} /> }] : []),
    ];
  };

  const navItems = getNavigationItems();

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 transition-transform duration-300 ease-in-out z-40 overflow-y-auto flex flex-col border-r border-border/50 bg-surface/95 backdrop-blur-md shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <span className={`${active ? 'text-primary' : 'text-text-secondary group-hover:text-primary transition-colors'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

