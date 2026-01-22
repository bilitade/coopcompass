import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="w-full lg:w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-around items-center gap-4">
          <div className="text-sm text-text-secondary">
          &copy; 2026 Cooperative Bank of Oromia. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium text-text-secondary">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
