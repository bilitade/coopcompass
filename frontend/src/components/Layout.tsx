import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
};

