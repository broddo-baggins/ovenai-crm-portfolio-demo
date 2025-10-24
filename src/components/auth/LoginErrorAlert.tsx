
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AdminContactInfo from './AdminContactInfo';

interface LoginErrorAlertProps {
  error: string;
}

const LoginErrorAlert: React.FC<LoginErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  
  // Check if this is a backend unavailable error
  const isBackendError = error.includes('Backend unavailable') || 
                          error.includes('Authentication server is currently unavailable');
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        {error}
        {isBackendError && (
          <div className="mt-2">
            <AdminContactInfo variant="inline" />
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default LoginErrorAlert;
