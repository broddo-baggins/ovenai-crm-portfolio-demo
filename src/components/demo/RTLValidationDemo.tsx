// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';
import { LeadForm } from '@/components/forms/LeadForm';
import { HeatIndicator } from '@/components/dashboard/HeatIndicator';

interface ValidationData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function RTLValidationDemo() {
  const { isRTL, toggleRTL } = useRTL();
  const { t } = useTranslation(['forms', 'common']);
  const { textStart, flexRowReverse } = useLang();
  
  const [formData, setFormData] = useState<ValidationData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ValidationData>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<ValidationData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired', 'Name is required');
    } else if (formData.name.length < 2) {
      newErrors.name = t('validation.nameMinLength', 'Name must be at least 2 characters');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid', 'Please enter a valid email address');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired', 'Phone is required');
    } else if (formData.phone.length < 8) {
      newErrors.phone = t('validation.phoneMinLength', 'Phone number must be at least 8 characters');
    }
    
    if (formData.message.length > 500) {
      newErrors.message = t('validation.messageMaxLength', 'Message must be less than 500 characters');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    }
  };

  const handleInputChange = (field: keyof ValidationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={cn("container mx-auto p-6 space-y-6", isRTL && "rtl")}>
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div>
          <h1 className={cn("text-3xl font-bold", textStart())}>
            {t('demo.title', 'RTL Validation Demo')}
          </h1>
          <p className={cn("text-muted-foreground mt-2", textStart())}>
            {t('demo.description', 'Demonstrating forms with RTL support and validation')}
          </p>
        </div>
        <Button onClick={toggleRTL} variant="outline">
          {isRTL ? t('demo.switchToLTR', 'Switch to LTR') : t('demo.switchToRTL', 'Switch to RTL (עברית)')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Validation Demo */}
        <Card>
          <CardHeader>
            <CardTitle className={textStart()}>
              {t('demo.validationFormTitle', 'Validation Demo Form')}
            </CardTitle>
            <CardDescription className={textStart()}>
              {t('demo.validationFormDescription', 'Form with real-time validation')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium flex items-center gap-1", flexRowReverse())}>
                  <span className={textStart()}>{t('fields.name', 'Full Name')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('placeholders.name', 'Enter your full name')}
                  className={errors.name ? 'border-red-500' : ''}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {errors.name && (
                  <p className={cn("text-sm text-red-500", textStart())}>{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className={cn("text-sm font-medium flex items-center gap-1", flexRowReverse())}>
                  <span className={textStart()}>{t('fields.email', 'Email Address')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('placeholders.email', 'Enter your email address')}
                  className={errors.email ? 'border-red-500' : ''}
                  dir="ltr"
                />
                {errors.email && (
                  <p className={cn("text-sm text-red-500", textStart())}>{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className={cn("text-sm font-medium flex items-center gap-1", flexRowReverse())}>
                  <span className={textStart()}>{t('fields.phone', 'Phone Number')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('placeholders.phone', 'Enter your phone number')}
                  className={errors.phone ? 'border-red-500' : ''}
                  dir="ltr"
                />
                {errors.phone && (
                  <p className={cn("text-sm text-red-500", textStart())}>{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className={cn("text-sm font-medium", textStart())}>
                  {t('fields.message', 'Message (Optional)')}
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder={t('placeholders.message', 'Enter additional message')}
                  className={errors.message ? 'border-red-500' : ''}
                  rows={3}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {errors.message && (
                  <p className={cn("text-sm text-red-500", textStart())}>{errors.message}</p>
                )}
                <p className={cn("text-xs text-muted-foreground", textStart())}>
                  {formData.message.length}/500 {t('common:characters', 'characters')}
                </p>
              </div>

              <Button type="submit" className="w-full">
                {submitted ? (
                  <>✓ {t('buttons.submitted', 'Submitted Successfully!')}</>
                ) : (
                  t('buttons.submit', 'Submit Form')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* RTL Features Demo */}
        <Card>
          <CardHeader>
            <CardTitle className={textStart()}>
              {t('demo.featuresTitle', 'RTL Features')}
            </CardTitle>
            <CardDescription className={textStart()}>
              {t('demo.featuresDescription', 'Demonstrating RTL layout capabilities')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className={cn("font-medium", textStart())}>
                {t('demo.directionTitle', 'Text Direction Demo')}
              </h4>
              <div className="p-3 bg-muted rounded-md">
                <p className={cn("text-sm", textStart())}>
                  {t('demo.directionText', 'This is sample text demonstrating the natural flow of text in the selected language direction.')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className={cn("font-medium", textStart())}>
                {t('demo.badgesTitle', 'Badges & Status')}
              </h4>
              <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                <Badge variant="default">{t('demo.badges.active', 'Active')}</Badge>
                <Badge variant="secondary">{t('demo.badges.pending', 'Pending')}</Badge>
                <Badge variant="destructive">{t('demo.badges.error', 'Error')}</Badge>
                <Badge variant="outline">{t('demo.badges.draft', 'Draft')}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className={cn("font-medium", textStart())}>
                {t('demo.heatTitle', 'Heat Indicator')}
              </h4>
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <HeatIndicator value={25} />
                <span className={cn("text-sm", textStart())}>
                  {t('demo.heatDescription', 'Temperature: Cold')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Form Demo */}
      <Card>
        <CardHeader>
          <CardTitle className={textStart()}>
            {t('demo.leadFormTitle', 'Full Lead Form')}
          </CardTitle>
          <CardDescription className={textStart()}>
            {t('demo.leadFormDescription', 'Complete lead form with RTL support')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm />
        </CardContent>
      </Card>
    </div>
  );
} 