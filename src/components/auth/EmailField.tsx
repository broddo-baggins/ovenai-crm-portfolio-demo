import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FORM_LABELS } from '@/constants/messages';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';

interface EmailFieldProps {
  email: string;
  setEmail: (email: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const EmailField: React.FC<EmailFieldProps> = ({ email, setEmail, disabled, required }) => {
  const { t } = useTranslation('common');
  const { isRTL, textStart } = useLang();

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className={textStart()}>{t('auth.email')}</Label>
      <Input
        id="email"
        type="email"
        placeholder={isRTL ? 'name@example.com' : FORM_LABELS.EMAIL_PLACEHOLDER}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="email-input"
      />
    </div>
  );
};

export default EmailField;
