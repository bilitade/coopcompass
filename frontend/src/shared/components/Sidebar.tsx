import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Activity,
  ClipboardList,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Role-based navigation configuration
  const getNavigationItems = () => {
    if (!user) return [];

    const { role } = user;

    // LEAD - Manages own team: OKRs, BAU, Work Items, Priorities, Tasks
    if (role === 'lead') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'My Team', path: '/my-team', icon: <Users size={20} /> },
        { label: 'OKRs', path: '/okrs', icon: <Target size={20} /> },
        { label: 'BAU Activities', path: '/bau-activities', icon: <Activity size={20} /> },
        { label: 'Work Items', path: '/work-items', icon: <ClipboardList size={20} /> },
        { label: 'Weekly Priorities', path: '/weekly-priority', icon: <Calendar size={20} /> },
        { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
      ];
    }

    // DIRECTOR - Views department teams and performance (read-only)
    if (role === 'director') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'My Department', path: '/departments', icon: <Building2 size={20} /> },
        { label: 'OKRs Overview', path: '/director/okrs', icon: <Target size={20} /> },
        { label: 'BAU Overview', path: '/director/bau', icon: <Activity size={20} /> },
      ];
    }

    // EXECUTIVE - Organization-wide view (read-only)
    if (role === 'executive') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Organization', path: '/departments', icon: <Building2 size={20} /> },
        { label: 'OKRs Overview', path: '/executive/okrs', icon: <Target size={20} /> },
        { label: 'BAU Overview', path: '/executive/bau', icon: <Activity size={20} /> },
      ];
    }

    // ADMIN - System management and full visibility
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Users', path: '/users', icon: <Users size={20} /> },
        { label: 'Departments', path: '/manage-departments', icon: <Building2 size={20} /> },
        { label: 'Teams', path: '/manage-teams', icon: <Layers size={20} /> },
        { label: 'Organization View', path: '/departments', icon: <Building2 size={20} /> },
        { label: 'OKRs Overview', path: '/executive/okrs', icon: <Target size={20} /> },
        { label: 'BAU Overview', path: '/executive/bau', icon: <Activity size={20} /> },
      ];
    }

    // MEMBER - Basic view (team dashboard and personal tasks)
    return [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'My Team', path: '/my-team', icon: <Users size={20} /> },
      { label: 'My Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
    ];
  };

  const navItems = getNavigationItems();

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-secondary/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full transition-[width] duration-300 ease-in-out z-40 overflow-y-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex-1 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 group font-medium ${
                    active
                      ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={`${active ? 'text-primary' : 'text-text-secondary group-hover:text-primary transition-colors'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <div className="hidden md:flex p-4 border-border justify-end">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

