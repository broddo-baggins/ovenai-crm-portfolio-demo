
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const PasswordResetSuccess: React.FC = () => {
  return (
    <Alert className="bg-green-50 border-green-200 text-green-800">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        Password updated successfully! You'll be redirected to the login page.
      </AlertDescription>
    </Alert>
  );
};

export default PasswordResetSuccess;
