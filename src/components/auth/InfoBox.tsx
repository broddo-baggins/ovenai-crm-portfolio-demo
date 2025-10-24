
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'success';
  showOnlyIn?: 'development' | 'production' | 'all';
}

const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  children,
  variant = 'info',
  showOnlyIn = 'all'
}) => {
  // Check if we should show this box based on environment
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENVIRONMENT === 'development';
  const shouldShow = showOnlyIn === 'all' || 
    (showOnlyIn === 'development' && isDevelopment) || 
    (showOnlyIn === 'production' && !isDevelopment);
  
  if (!shouldShow) return null;
  
  const getBgColor = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-50';
      case 'warning':
        return 'bg-amber-50';
      case 'success':
        return 'bg-green-50';
      default:
        return 'bg-slate-50';
    }
  };
  
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getTitleColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-amber-700';
      case 'success':
        return 'text-green-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-slate-700';
    }
  };
  
  return (
    <Alert className={`${getBgColor()} mb-4`}>
      <div className="flex items-start">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="ml-2">
          {title && <h4 className={`font-medium ${getTitleColor()}`}>{title}</h4>}
          <AlertDescription className="text-gray-600 mt-1">{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default InfoBox;
