import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

export interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  onClose,
  position = 'top-right'
}) => {
  const { t } = useTranslation('common');
  const { isRTL, flexRowReverse, textStart, marginEnd } = useLang();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPositionStyles = () => {
    const basePosition = 'fixed z-50';
    
    if (isRTL) {
      // Flip positions for RTL
      switch (position) {
        case 'top-right':
          return `${basePosition} top-4 left-4`;
        case 'top-left':
          return `${basePosition} top-4 right-4`;
        case 'bottom-right':
          return `${basePosition} bottom-4 left-4`;
        case 'bottom-left':
          return `${basePosition} bottom-4 right-4`;
        default:
          return `${basePosition} top-4 left-4`;
      }
    } else {
      switch (position) {
        case 'top-right':
          return `${basePosition} top-4 right-4`;
        case 'top-left':
          return `${basePosition} top-4 left-4`;
        case 'bottom-right':
          return `${basePosition} bottom-4 right-4`;
        case 'bottom-left':
          return `${basePosition} bottom-4 left-4`;
        default:
          return `${basePosition} top-4 right-4`;
      }
    }
  };

  return (
    <div
      className={cn(
        "max-w-sm w-full shadow-lg rounded-lg border p-4 transition-all duration-300 ease-in-out",
        getTypeStyles(),
        getPositionStyles(),
        isRTL && "font-hebrew"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={cn("flex items-start", flexRowReverse())}>
        <div className={cn("flex-shrink-0", marginEnd("3"))}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn("flex items-center justify-between", flexRowReverse())}>
            <h4 className={cn("text-sm font-medium text-gray-900", textStart())}>
              {title}
            </h4>
            <button
              onClick={() => onClose(id)}
                             className={cn(
                 "flex-shrink-0 rounded-md p-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors",
                 isRTL ? marginEnd("2") : "ml-2"
               )}
              aria-label={t('notifications.close', 'Close notification')}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          {message && (
            <p className={cn("mt-1 text-sm text-gray-600", textStart())}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast; 