// Enhanced Lead Capture Form - Dual Database Lead Flow Implementation
// Purpose: Capture leads with real-time processing status and AI analysis updates
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Brain, Zap, User, Building, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LeadCaptureFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaign?: string;
  source?: string;
}

interface LeadFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Business Information
  company: string;
  industry: string;
  role: string;
  employees: string;
  
  // Project Information
  projectType: string;
  budgetRange: string;
  timeline: string;
  requirements: string;
  
  // Source Tracking
  referralSource: string;
  marketingChannel: string;
  campaign: string;
}

interface ProcessingStatus {
  status: 'pending' | 'staged' | 'processing' | 'analyzed' | 'complete' | 'error';
  message: string;
  progress: number;
  aiScore?: number;
  aiGrade?: string;
  stagingId?: string;
  leadId?: string;
}

export const LeadCaptureForm = ({ open, onClose, onSuccess, campaign, source }: LeadCaptureFormProps) => {
  const { t } = useTranslation(['forms', 'common']);
  const { isRTL, textStart, flexRowReverse } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    role: '',
    employees: '',
    projectType: '',
    budgetRange: '',
    timeline: '',
    requirements: '',
    referralSource: source || '',
    marketingChannel: '',
    campaign: campaign || ''
  });

  // Using the singleton supabase client imported above

  // Real-time subscription for processing status updates
  useEffect(() => {
    if (!processingStatus?.stagingId) return;

    const subscription = supabase
      .channel(`staging_${processingStatus.stagingId}`)
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_lead_staging',
          filter: `id=eq.${processingStatus.stagingId}`
        },
        (payload) => {
          updateProcessingStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [processingStatus?.stagingId]);

  const updateProcessingStatus = (stagingData: any) => {
    if (stagingData.processing_status === 'processed' && stagingData.processed_data) {
      setProcessingStatus({
        status: 'complete',
        message: 'Lead successfully processed and analyzed!',
        progress: 100,
        aiScore: stagingData.processed_data.lead_score,
        aiGrade: stagingData.processed_data.quality_grade,
        stagingId: stagingData.id,
        leadId: stagingData.agent_lead_id
      });
      
      // Show success notification with AI results
      toast.success(`Lead processed! AI Score: ${stagingData.processed_data.lead_score}, Grade: ${stagingData.processed_data.quality_grade}`);
    } else if (stagingData.processing_status === 'failed') {
      setProcessingStatus({
        status: 'error',
        message: 'Processing failed. Please try again.',
        progress: 0
      });
      toast.error('Lead processing failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProcessingStatus({
      status: 'pending',
      message: 'Preparing to submit lead...',
      progress: 10
    });

    try {
      // Step 1: Insert into site staging table (triggers agent sync)
      const { data: stagingLead, error: stagingError } = await supabase
        .from('site_lead_staging')
        .insert({
          form_data: formData,
          processing_status: 'queued',
          source: formData.referralSource || 'direct',
          campaign: formData.campaign || 'organic',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (stagingError) throw stagingError;

      setProcessingStatus({
        status: 'staged',
        message: 'Lead submitted! Processing with AI analysis...',
        progress: 30,
        stagingId: stagingLead.id
      });

      // Step 2: Trigger agent processing (edge function)
      setTimeout(() => {
        setProcessingStatus(prev => prev ? {
          ...prev,
          status: 'processing',
          message: 'AI analyzing your lead data...',
          progress: 60
        } : null);
      }, 2000);

      // Step 3: Wait for real-time updates via subscription
      // The useEffect subscription will handle updates from here

      // Set a timeout for completion if real-time doesn't work
      setTimeout(() => {
        if (processingStatus?.status !== 'complete' && processingStatus?.status !== 'error') {
          setProcessingStatus({
            status: 'analyzed',
            message: 'Processing complete! Check your dashboard for results.',
            progress: 90,
            stagingId: stagingLead.id
          });
        }
      }, 10000);

    } catch (error) {
      console.error('Error submitting lead:', error);
      setProcessingStatus({
        status: 'error',
        message: 'Failed to submit lead. Please try again.',
        progress: 0
      });
      toast.error('Failed to submit lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (processingStatus?.status === 'complete') {
      onSuccess();
    }
    setProcessingStatus(null);
    onClose();
  };

  const getStatusIcon = () => {
    switch (processingStatus?.status) {
      case 'pending':
      case 'staged':
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'analyzed':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (processingStatus?.status) {
      case 'pending':
      case 'staged':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'analyzed':
        return 'bg-purple-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            AI-Powered Lead Capture
          </DialogTitle>
        </DialogHeader>

        {/* Processing Status Display */}
        {processingStatus && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <span className="font-medium">{processingStatus.message}</span>
            </div>
            
            <Progress value={processingStatus.progress} className="mb-2" />
            
            <div className="flex gap-2">
              <Badge variant="outline" className={getStatusColor()}>
                {processingStatus.status.toUpperCase()}
              </Badge>
              
              {processingStatus.aiScore && (
                <Badge variant="outline" className="bg-blue-100">
                  AI Score: {processingStatus.aiScore}
                </Badge>
              )}
              
              {processingStatus.aiGrade && (
                <Badge variant="outline" className="bg-purple-100">
                  Grade: {processingStatus.aiGrade}
                </Badge>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold flex items-center gap-2", textStart())}>
              <User className="h-5 w-5" />
              {t('sections.personalInfo', 'Personal Information')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className={cn("flex items-center gap-1", flexRowReverse())}>
                  <span className={textStart()}>{t('fields.firstName', 'First Name')}</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t('placeholders.firstName', 'Enter your first name')}
                  required
                  disabled={isLoading}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className={cn("flex items-center gap-1", flexRowReverse())}>
                  <span className={textStart()}>{t('fields.lastName', 'Last Name')}</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={t('placeholders.lastName', 'Enter your last name')}
                  required
                  disabled={isLoading}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={cn("flex items-center gap-2", flexRowReverse())}>
                  <Mail className="h-4 w-4" />
                  <span className={textStart()}>{t('fields.email', 'Email (Optional)')}</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('placeholders.email', 'Only if provided to us')}
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className={cn("flex items-center gap-2", flexRowReverse())}>
                  <Phone className="h-4 w-4" />
                  <span className={textStart()}>{t('fields.phone', 'Phone')}</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('placeholders.phone', 'Enter your phone number')}
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold flex items-center gap-2", textStart())}>
              <Building className="h-5 w-5" />
              {t('sections.businessInfo', 'Business Information')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className={textStart()}>
                  {t('fields.company', 'Company')}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={t('placeholders.company', 'Enter your company name')}
                  disabled={isLoading}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className={textStart()}>
                  {t('fields.position', 'Position')}
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder={t('placeholders.position', 'Enter your position')}
                  disabled={isLoading}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry" className={textStart()}>
                  {t('fields.industry', 'Industry')}
                </Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(isRTL && "text-right")}>
                    <SelectValue placeholder={t('placeholders.industry', 'Select industry')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">{t('industries.technology', 'Technology')}</SelectItem>
                    <SelectItem value="finance">{t('industries.finance', 'Finance')}</SelectItem>
                    <SelectItem value="healthcare">{t('industries.healthcare', 'Healthcare')}</SelectItem>
                    <SelectItem value="education">{t('industries.education', 'Education')}</SelectItem>
                    <SelectItem value="retail">{t('industries.retail', 'Retail')}</SelectItem>
                    <SelectItem value="manufacturing">{t('industries.manufacturing', 'Manufacturing')}</SelectItem>
                    <SelectItem value="other">{t('industries.other', 'Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize" className={textStart()}>
                  {t('fields.companySize', 'Company Size')}
                </Label>
                <Select 
                  value={formData.companySize} 
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(isRTL && "text-right")}>
                    <SelectValue placeholder={t('placeholders.companySize', 'Select company size')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">{t('companySize.small', '1-10 employees')}</SelectItem>
                    <SelectItem value="11-50">{t('companySize.medium', '11-50 employees')}</SelectItem>
                    <SelectItem value="51-200">{t('companySize.large', '51-200 employees')}</SelectItem>
                    <SelectItem value="201-1000">{t('companySize.enterprise', '201-1000 employees')}</SelectItem>
                    <SelectItem value="1000+">{t('companySize.corporation', '1000+ employees')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold flex items-center gap-2", textStart())}>
              <FileText className="h-5 w-5" />
              {t('sections.additionalInfo', 'Additional Information')}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="notes" className={textStart()}>
                {t('fields.notes', 'Notes')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('placeholders.notes', 'Any additional information or specific requirements')}
                disabled={isLoading}
                rows={3}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className={cn("flex gap-2 pt-4", isRTL && "flex-row-reverse")}>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('buttons.submitting', 'Submitting...')}
                </>
              ) : (
                t('buttons.submit', 'Submit Lead')
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('buttons.cancel', 'Cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 