import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 pt-16 w-full overflow-hidden relative">
        {/* Sidebar as overlay */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
        />
        {/* Main content - takes full width */}
        <main className="flex-1 h-full overflow-y-auto transition-all duration-300 w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <div className="shrink-0 z-10 w-full relative">
         <Footer />
      </div>
    </div>
  );
};

