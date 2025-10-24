import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  FileText,
  Zap,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  language: string;
  content: string;
}

interface SendFirstMessageButtonProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  className?: string;
  onMessageSent?: (messageId: string) => void;
}

export const SendFirstMessageButton: React.FC<SendFirstMessageButtonProps> = ({
  leadId,
  leadName,
  leadPhone,
  className,
  onMessageSent
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    formattedPhone: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      validatePhone(leadPhone);
    }
  }, [isOpen, leadPhone]);

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneValidation({
        isValid: false,
        formattedPhone: '',
        message: 'No phone number available for this lead'
      });
      return;
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneValidation({
        isValid: false,
        formattedPhone: '',
        message: 'Phone number must be at least 10 digits'
      });
    } else if (cleanPhone.length > 15) {
      setPhoneValidation({
        isValid: false,
        formattedPhone: '',
        message: 'Phone number cannot exceed 15 digits'
      });
    } else {
      // Format for WhatsApp (add country code if needed)
      const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
      setPhoneValidation({
        isValid: true,
        formattedPhone: formattedPhone,
        message: `Will send to: +${formattedPhone}`
      });
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      // For demo purposes, use predefined approved templates
      // In production, this would fetch from your WhatsApp Business API
      const demoTemplates: WhatsAppTemplate[] = [
        {
          id: 'hello_world',
          name: 'hello_world',
          category: 'UTILITY',
          status: 'APPROVED',
          language: 'en_US',
          content: 'Hello World'
        },
        {
          id: 'property_inquiry_response',
          name: 'property_inquiry_response',
          category: 'UTILITY', 
          status: 'APPROVED',
          language: 'en_US',
          content: 'Hi! Thanks for your interest in our properties. I can provide detailed information. What would you like to know?'
        },
        {
          id: 'lead_qualification',
          name: 'lead_qualification',
          category: 'MARKETING',
          status: 'APPROVED',
          language: 'en_US',
          content: 'Hi! To help you find the perfect property, could you share your budget range and preferred location?'
        }
      ];

      setTemplates(demoTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load WhatsApp templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const sendFirstMessage = async () => {
    if (!selectedTemplate || !phoneValidation?.isValid) {
      toast.error('Please select a template and ensure phone number is valid');
      return;
    }

    setIsSending(true);
    try {
      console.log('INIT Sending first WhatsApp message:', {
        leadId,
        leadName,
        phone: phoneValidation.formattedPhone,
        template: selectedTemplate
      });

      // Send template message via Supabase edge function
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send_template',
          to: phoneValidation.formattedPhone,
          template_name: selectedTemplate,
          language_code: 'en_US',
          user_id: user?.id,
          lead_id: leadId
        }
      });

      if (error) throw error;

      if (data?.success) {
        const messageId = data.messageId;
        
        // Create conversation record if it doesn't exist
        await createConversationRecord(leadId, phoneValidation.formattedPhone, messageId);
        
        // Update lead status to "contacted"
        await updateLeadStatus(leadId, 'contacted');

        toast.success('COMPLETE Lead taken successfully!', {
          description: `You are now personally handling ${leadName} - template message sent`,
          duration: 5000
        });

        onMessageSent?.(messageId);
        setIsOpen(false);
        
        // Show success details
        console.log('SUCCESS WhatsApp message sent successfully:', {
          messageId,
          leadName,
          phone: phoneValidation.formattedPhone,
          template: selectedTemplate
        });

      } else {
        throw new Error(data?.error || 'Failed to send message');
      }

    } catch (error: any) {
      console.error('ERROR Error sending first message:', error);
      toast.error('Failed to send message', {
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsSending(false);
    }
  };

  const createConversationRecord = async (leadId: string, phone: string, messageId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .upsert({
          lead_id: leadId,
          project_id: 'default-project-id', // Add required project_id
          status: 'active',
          stage: 'initial',
          started_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          metadata: {
            channel: 'whatsapp',
            initiated_by: 'agent',
            first_message_id: messageId,
            participant_phone: phone
          }
        }, {
          onConflict: 'lead_id'
        });

      if (error) {
        console.error('Error creating conversation:', error);
      } else {
        console.log('SUCCESS Conversation record created/updated');
      }
    } catch (error) {
      console.error('Failed to create conversation record:', error);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      // FIXED: Take Lead - Remove from automation and assign to human agent
      console.log(`👤 Taking lead ${leadId} for user ${user?.id} (FIXED VERSION)...`);
      
      // 1. Update lead status to indicate human takeover (use valid status)
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'qualified' as any, // Use valid status that exists in database
          first_interaction: new Date().toISOString(),
          interaction_count: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
        throw updateError;
      }

      // 2. Cancel/update any queued messages for this lead (with type casting)
      try {
        const { error: updateQueueError } = await (supabase as any)
          .from('whatsapp_message_queue')
          .update({
            queue_status: 'cancelled',
            updated_at: new Date().toISOString(),
            last_error: `Lead taken by human agent (${user?.id})`
          })
          .eq('lead_id', leadId)
          .in('queue_status', ['queued', 'pending']);

        if (updateQueueError) {
          console.warn('WARNING Could not update queue status:', updateQueueError.message);
        }
      } catch (queueError) {
        console.warn('WARNING Queue table access failed:', queueError);
        // Continue - lead takeover is more important than queue cleanup
      }

      // 3. Remove from processing queue if present (with type casting)
      try {
        const { error: removeProcessingError } = await (supabase as any)
          .from('lead_processing_queue')
          .update({
            queue_status: 'cancelled',
            updated_at: new Date().toISOString(),
            error_message: `Lead taken by human agent (${user?.id})`
          })
          .eq('lead_id', leadId)
          .in('queue_status', ['queued', 'processing']);

        if (removeProcessingError) {
          console.warn('WARNING Could not update processing queue:', removeProcessingError.message);
        }
      } catch (processingError) {
        console.warn('WARNING Processing queue table access failed:', processingError);
      }

      console.log(`SUCCESS Successfully handed lead ${leadId} to user ${user?.id}`);
      
    } catch (error) {
      console.error('Failed to update lead status:', error);
      throw error;
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className={cn("bg-green-600 hover:bg-green-700 text-white", className)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Take Lead
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Take Lead - Send First WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Take over this lead from the AI agent and initiate personal contact with {leadName} using an approved WhatsApp template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium">{leadName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phone:</span>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span className="font-mono text-sm">{leadPhone}</span>
                </div>
              </div>
              {phoneValidation && (
                <Alert variant={phoneValidation.isValid ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {phoneValidation.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select WhatsApp Template</Label>
              <p className="text-xs text-gray-500 mt-1">
                Choose an approved template to start the conversation
              </p>
            </div>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading templates...</span>
              </div>
            ) : (
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{template.name}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge 
                            variant={template.status === 'APPROVED' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {template.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Template Preview */}
            {selectedTemplateData && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Template Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-sm">{selectedTemplateData.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplateData.language}
                    </Badge>
                    <Badge 
                      variant={selectedTemplateData.status === 'APPROVED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {selectedTemplateData.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendFirstMessage}
              disabled={!selectedTemplate || !phoneValidation?.isValid || isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Take Lead & Send
                </>
              )}
            </Button>
          </div>

          {/* Demo Note */}
          <Alert>
            <PlayCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>App Review Demo:</strong> This will send a real WhatsApp message using your approved templates. 
              Make sure to use a test phone number that you control for the demo recording.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 