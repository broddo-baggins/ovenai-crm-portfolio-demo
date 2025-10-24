
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

const PasswordMatchIndicator = ({ 
  password, 
  confirmPassword 
}: PasswordMatchIndicatorProps): JSX.Element | null => {
  if (!password || !confirmPassword) {
    return null;
  }

  return (
    <div className="text-xs">
      {password === confirmPassword ? (
        <span className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Passwords match
        </span>
      ) : (
        <span className="text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Passwords don't match
        </span>
      )}
    </div>
  );
};

export default PasswordMatchIndicator;
