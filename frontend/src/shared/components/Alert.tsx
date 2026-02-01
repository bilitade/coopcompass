import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const config = {
    success: {
      bgColor: 'bg-green-500/10 dark:bg-green-500/20',
      borderColor: 'border-green-500/30 dark:border-green-500/40',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle size={20} />,
    },
    error: {
      bgColor: 'bg-red-500/10 dark:bg-red-500/20',
      borderColor: 'border-red-500/30 dark:border-red-500/40',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: <XCircle size={20} />,
    },
    warning: {
      bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      borderColor: 'border-yellow-500/30 dark:border-yellow-500/40',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: <AlertCircle size={20} />,
    },
    info: {
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      borderColor: 'border-blue-500/30 dark:border-blue-500/40',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: <Info size={20} />,
    },
  };

  const { bgColor, borderColor, textColor, iconColor, icon } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 flex items-start space-x-3`}>
      <div className={iconColor}>{icon}</div>
      <div className="flex-1">
        <p className={`${textColor} text-sm font-medium`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className={`${textColor} hover:opacity-70 transition-opacity flex-shrink-0`}>
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};

