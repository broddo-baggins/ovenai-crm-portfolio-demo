import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EnhancedAlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
  description: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertVariants = {
  default: {
    className: 'border-gray-200 bg-gray-50 text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
    icon: <Info className="h-4 w-4" />,
  },
  destructive: {
    className: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100',
    icon: <XCircle className="h-4 w-4" />,
  },
  success: {
    className: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  warning: {
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  info: {
    className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100',
    icon: <Info className="h-4 w-4" />,
  },
};

export const EnhancedAlert: React.FC<EnhancedAlertProps> = ({
  variant = 'default',
  title,
  description,
  closable = false,
  onClose,
  className,
  action,
}) => {
  const variantConfig = alertVariants[variant];

  return (
    <Alert className={cn(variantConfig.className, className)}>
      <div className="flex items-start space-x-3">
        {variantConfig.icon}
        <div className="flex-1 space-y-2">
          {title && <AlertTitle className="text-sm font-medium">{title}</AlertTitle>}
          <AlertDescription className="text-sm">
            {description}
          </AlertDescription>
          {action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="h-8"
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        {closable && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

// Alert Context for global alert management
interface AlertContextType {
  alerts: Array<{
    id: string;
    variant: EnhancedAlertProps['variant'];
    title?: string;
    description: string;
    duration?: number;
    action?: EnhancedAlertProps['action'];
  }>;
  addAlert: (alert: Omit<AlertContextType['alerts'][0], 'id'>) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = React.useState<AlertContextType['alerts']>([]);

  const addAlert = React.useCallback((alert: Omit<AlertContextType['alerts'][0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { ...alert, id }]);

    // Auto-remove after duration
    if (alert.duration !== 0) {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }, alert.duration || 5000);
    }
  }, []);

  const removeAlert = React.useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({
    alerts,
    addAlert,
    removeAlert,
  }), [alerts, addAlert, removeAlert]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
};

// Alert Container for displaying alerts
export const AlertContainer: React.FC = () => {
  const { alerts, removeAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {alerts.map(alert => (
        <EnhancedAlert
          key={alert.id}
          variant={alert.variant}
          title={alert.title}
          description={alert.description}
          closable
          onClose={() => removeAlert(alert.id)}
          action={alert.action}
          className="shadow-lg"
        />
      ))}
    </div>
  );
};

// Helper functions to replace toast usage
export const alertHelpers = {
  success: (description: string, title?: string) => ({
    variant: 'success' as const,
    title,
    description,
  }),
  error: (description: string, title?: string) => ({
    variant: 'destructive' as const,
    title: title || 'Error',
    description,
  }),
  warning: (description: string, title?: string) => ({
    variant: 'warning' as const,
    title: title || 'Warning',
    description,
  }),
  info: (description: string, title?: string) => ({
    variant: 'info' as const,
    title: title || 'Information',
    description,
  }),
}; 