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
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: <CheckCircle size={20} className="text-green-600" />,
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: <XCircle size={20} className="text-red-600" />,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: <AlertCircle size={20} className="text-yellow-600" />,
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: <Info size={20} className="text-blue-600" />,
    },
  };

  const { bgColor, borderColor, textColor, icon } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 flex items-start space-x-3`}>
      {icon}
      <div className="flex-1">
        <p className={`${textColor} text-sm font-medium`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className={`${textColor} hover:opacity-70`}>
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};

