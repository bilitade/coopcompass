import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Activity,
  ClipboardList,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, toggleCollapse }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'OKRs', path: '/okrs', icon: <Target size={20} /> },
    { label: 'BAU', path: '/bau', icon: <Activity size={20} /> },
    { label: 'Monthly Headsup', path: '/work-items', icon: <ClipboardList size={20} /> },
    { label: 'Weekly Priority', path: '/weekly-priority', icon: <Calendar size={20} /> },
    { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> }
  ];

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
        className={`fixed md:relative top-0 left-0 h-full border-r border-border transition-[width] duration-300 ease-in-out z-40 overflow-y-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex-1 py-4 space-y-1.5">
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

