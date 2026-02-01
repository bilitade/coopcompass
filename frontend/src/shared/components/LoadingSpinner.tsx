import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 size={size} className="animate-spin text-primary" />
    </div>
  );
};

