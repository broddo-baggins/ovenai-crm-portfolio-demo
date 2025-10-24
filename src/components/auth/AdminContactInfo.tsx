
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminContactInfoProps {
  variant?: 'inline' | 'button';
}

const AdminContactInfo: React.FC<AdminContactInfoProps> = ({ variant = 'button' }) => {
  const contactAdmin = () => {
    // Display contact information - using a generic email
    window.open('mailto:support@leadreviver.com?subject=Access%20Request', '_blank');
  };

  const renderButton = () => {
    if (variant === 'button') {
      return (
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-1" onClick={contactAdmin}>
          <AlertCircle size={16} />
          Contact Administrator
        </Button>
      );
    }
    
    return (
      <span className="cursor-pointer text-blue-600 hover:underline flex items-center gap-1" onClick={contactAdmin}>
        <AlertCircle size={14} />
        Need access? Contact administrator
      </span>
    );
  };

  return (
    <div className="w-full">
      {renderButton()}
      <Card className="mt-2 bg-slate-50 border-slate-200">
        <CardContent className="p-3 text-sm">
          <p className="text-slate-700">
            If you need access to this system, please contact your system administrator.
            Access is managed by your organization's admin team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactInfo;
