import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

export interface LeadFormData {
  name: string;
  phone: string;
  notes?: string;
  status: 'new_lead' | 'contacted' | 'qualified' | 'converted' | 'lost';
  state: 'new_lead' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface LeadFormProps {
  onSubmit?: (data: LeadFormData) => void | Promise<void>;
  initialData?: Partial<LeadFormData>;
  className?: string;
}

export function LeadForm({ onSubmit, initialData, className }: LeadFormProps) {
  const { t } = useTranslation('forms');
  const { isRTL, textStart, flexRowReverse } = useLang();
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    notes: '',
    status: 'new_lead',
    state: 'new_lead',
    priority: 'medium',
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired', 'Name is required');
    } else if (formData.name.length < 2) {
      newErrors.name = t('validation.nameMinLength', 'Name must be at least 2 characters');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired', 'Phone is required');
    } else {
      // Remove all non-digit characters for validation
      const cleaned = formData.phone.replace(/\D/g, '');
      
      // Check if it's a valid phone number format  
      const phoneRegex = /^[+]?[\d\s\-()]{8,15}$/;
      
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = t('validation.phoneInvalid', 'Please enter a valid phone number');
      } else if (cleaned.length < 8) {
        newErrors.phone = t('validation.phoneMinLength', 'Phone number must be at least 8 digits');
      }
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = t('validation.notesMaxLength', 'Notes cannot exceed 1000 characters');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSubmitted(true);
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          setSubmitted(false);
          if (!initialData) {
            // Reset form if no initial data (new form)
            setFormData({
              name: '',
              phone: '',
              notes: '',
              status: 'new_lead',
              state: 'new_lead',
              priority: 'medium',
            });
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className={cn("text-center space-y-2", isRTL && "font-hebrew")}>
            <div className="text-green-500 text-4xl">✓</div>
            <h3 className={cn("text-lg font-semibold", textStart())}>
              {t('success.title', 'Form submitted successfully!')}
            </h3>
            <p className={cn("text-muted-foreground", textStart())}>
              {t('success.description', 'A representative will contact you soon')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", isRTL && "font-hebrew")} dir={isRTL ? "rtl" : "ltr"}>
      <Card className={className}>
        <CardHeader>
          <CardTitle className={textStart()}>{t('title', 'Lead Form')}</CardTitle>
          <CardDescription className={textStart()}>
            {t('description', 'Please fill out the following details and we\'ll get back to you soon')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" role="form">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className={cn("flex items-center gap-1", flexRowReverse())}>
                <span className={textStart()}>{t('fields.name', 'Full Name')}</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('placeholders.name', 'Enter your full name')}
                className={cn(errors.name && 'border-red-500')}
                disabled={isSubmitting}
                required
                dir={isRTL ? "rtl" : "ltr"}
              />
              {errors.name && (
                <p className={cn("text-sm text-red-500", textStart())}>{errors.name}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className={cn("flex items-center gap-1", flexRowReverse())}>
                <span className={textStart()}>{t('fields.phone', 'Phone Number')}</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('placeholders.phone', 'Enter your phone number')}
                className={cn(errors.phone && 'border-red-500')}
                disabled={isSubmitting}
                required
                dir="ltr" // Phone numbers should be LTR
              />
              {errors.phone && (
                <p className={cn("text-sm text-red-500", textStart())}>{errors.phone}</p>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="status" id="status-label" className={textStart()}>
                {t('fields.status', 'Lead Status')}
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className={cn(isRTL && "text-right")} aria-labelledby="status-label">
                  <SelectValue placeholder={t('placeholders.status', 'Select status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">{t('status.newLead', 'New Lead')}</SelectItem>
                  <SelectItem value="contacted">{t('status.contacted', 'Contacted')}</SelectItem>
                  <SelectItem value="qualified">{t('status.qualified', 'Qualified')}</SelectItem>
                  <SelectItem value="converted">{t('status.converted', 'Converted')}</SelectItem>
                  <SelectItem value="lost">{t('status.lost', 'Lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Field */}
            <div className="space-y-2">
              <Label htmlFor="priority" id="priority-label" className={textStart()}>
                {t('fields.priority', 'Priority')}
              </Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="priority" className={cn(isRTL && "text-right")} aria-labelledby="priority-label">
                  <SelectValue placeholder={t('placeholders.priority', 'Select priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('priority.low', 'Low')}</SelectItem>
                  <SelectItem value="medium">{t('priority.medium', 'Medium')}</SelectItem>
                  <SelectItem value="high">{t('priority.high', 'High')}</SelectItem>
                  <SelectItem value="urgent">{t('priority.urgent', 'Urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <Label htmlFor="notes" className={textStart()}>
                {t('fields.notes', 'Notes')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('placeholders.notes', 'Enter any additional notes or comments')}
                className={cn(errors.notes && 'border-red-500')}
                disabled={isSubmitting}
                rows={4}
                dir={isRTL ? "rtl" : "ltr"}
              />
              <div className={cn("text-xs text-gray-500", textStart())}>
                {formData.notes?.length || 0}/1000 characters
              </div>
              {errors.notes && (
                <p className={cn("text-sm text-red-500", textStart())}>{errors.notes}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className={cn("flex gap-2 pt-4", isRTL && "flex-row-reverse")}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting 
                  ? t('buttons.submitting', 'Submitting...') 
                  : t('buttons.submit', 'Save Lead')
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setFormData({
                    name: '',
                    phone: '',
                    notes: '',
                    status: 'new_lead',
                    state: 'new_lead',
                    priority: 'medium',
                  });
                  setErrors({});
                }}
              >
                {t('buttons.reset', 'Reset')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 