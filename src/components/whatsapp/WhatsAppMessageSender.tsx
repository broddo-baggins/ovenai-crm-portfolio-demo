// @ts-nocheck
/**
 * WhatsApp Message Sender Component
 * Provides UI for sending WhatsApp messages with security and validation
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Send, MessageSquare, Phone, AlertCircle, CheckCircle, Loader2, FileText, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  components: any[];
}

interface MessageLog {
  id: string;
  phone_number: string;
  message: string;
  message_type: 'text' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  whatsapp_message_id?: string;
}

export const WhatsAppMessageSender: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLang();
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'template'>('text');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleMessage, setScheduleMessage] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Component state
  const [isSending, setIsSending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [recentMessages, setRecentMessages] = useState<MessageLog[]>([]);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load templates and recent messages on mount
  useEffect(() => {
    loadTemplates();
    loadRecentMessages();
  }, []);

  // Phone number validation
  useEffect(() => {
    if (phoneNumber.length > 0) {
      validatePhoneNumber(phoneNumber);
    } else {
      setPhoneValidation(null);
    }
  }, [phoneNumber]);

  const validatePhoneNumber = async (phone: string) => {
    setIsValidating(true);
    
    // Remove non-digits for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneValidation({
        isValid: false,
        message: 'Phone number must be at least 10 digits'
      });
    } else if (cleanPhone.length > 15) {
      setPhoneValidation({
        isValid: false,
        message: 'Phone number cannot exceed 15 digits'
      });
    } else if (!cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      // Add country code for US numbers
      setPhoneValidation({
        isValid: true,
        message: `Will send to: +1${cleanPhone}`
      });
    } else {
      setPhoneValidation({
        isValid: true,
        message: `Will send to: +${cleanPhone}`
      });
    }
    
    setIsValidating(false);
  };

  const loadTemplates = async () => {
    try {
      // Call Supabase edge function to get templates
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { action: 'get_templates' }
      });

      if (error) throw error;
      setTemplates(data?.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback templates for demo
      setTemplates([
        {
          id: 'hello_world',
          name: 'hello_world',
          category: 'UTILITY',
          status: 'APPROVED',
          components: []
        },
        {
          id: 'sample_flight_confirmation',
          name: 'sample_flight_confirmation',
          category: 'UTILITY',
          status: 'APPROVED',
          components: []
        }
      ]);
    }
  };

  const loadRecentMessages = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentMessages(data || []);
    } catch (error) {
      console.error('Error loading recent messages:', error);
    }
  };

  const sendTextMessage = async () => {
    if (!phoneNumber || !message.trim()) {
      toast.error('Please enter both phone number and message');
      return;
    }

    if (!phoneValidation?.isValid) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSending(true);

    try {
      // Clean phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

      // Send via Supabase edge function
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send_message',
          to: fullPhone,
          message: message.trim(),
          user_id: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Success notification
        toast.success('Message sent successfully!');
        
        // Create notification
        if (user?.id) {
          await notificationService.notifyWhatsAppEvent(
            user.id,
            fullPhone,
            'sent',
            { message: message.trim(), messageId: data.messageId }
          );
        }

        // Clear form
        setMessage('');
        setPhoneNumber('');
        setPhoneValidation(null);
        
        // Reload recent messages
        await loadRecentMessages();
        
        // Focus back to phone input
        setTimeout(() => {
          const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
          phoneInput?.focus();
        }, 100);
        
      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
      
      // Create error notification
      if (user?.id) {
        await notificationService.notifyWhatsAppEvent(
          user.id,
          phoneNumber,
          'failed',
          { message: message.trim(), error: error.message }
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  const sendTemplateMessage = async () => {
    if (!phoneNumber || !selectedTemplate) {
      toast.error('Please enter phone number and select a template');
      return;
    }

    if (!phoneValidation?.isValid) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSending(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send_template',
          to: fullPhone,
          template_name: selectedTemplate,
          language_code: 'en_US',
          user_id: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Template message sent successfully!');
        
        if (user?.id) {
          await notificationService.notifyWhatsAppEvent(
            user.id,
            fullPhone,
            'sent',
            { template: selectedTemplate, messageId: data.messageId }
          );
        }

        setPhoneNumber('');
        setSelectedTemplate('');
        setPhoneValidation(null);
        await loadRecentMessages();
      } else {
        throw new Error(data?.error || 'Failed to send template');
      }
    } catch (error: any) {
      console.error('Error sending template:', error);
      toast.error(`Failed to send template: ${error.message}`);
      
      if (user?.id) {
        await notificationService.notifyWhatsAppEvent(
          user.id,
          phoneNumber,
          'failed',
          { template: selectedTemplate, error: error.message }
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (messageType === 'text') {
      sendTextMessage();
    } else {
      sendTemplateMessage();
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  };

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

  return (
    <div className={cn("space-y-6", isRTL && "rtl")}>
      {/* Main Sending Interface */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <MessageSquare className="h-5 w-5 text-green-500" />
            {t('whatsapp.sendMessage', 'Send WhatsApp Message')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>{t('whatsapp.messageType', 'Message Type')}</Label>
            <Select value={messageType} onValueChange={(value: 'text' | 'template') => setMessageType(value)}>
              <SelectTrigger className={cn(isRTL && "text-right")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <MessageSquare className="h-4 w-4" />
                    {t('whatsapp.textMessage', 'Text Message')}
                  </div>
                </SelectItem>
                <SelectItem value="template">
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <FileText className="h-4 w-4" />
                    {t('whatsapp.templateMessage', 'Template Message')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Phone className="h-4 w-4" />
              {t('whatsapp.phoneNumber', 'Phone Number')}
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setPhoneNumber(formatted);
                }}
                className={cn(
                  "pr-10",
                  isRTL && "text-right pl-10 pr-4",
                  phoneValidation?.isValid === false && "border-red-500"
                )}
                disabled={isSending}
              />
              {isValidating && (
                <Loader2 className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground",
                  isRTL && "right-auto left-3"
                )} />
              )}
            </div>
            {phoneValidation && (
              <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                {phoneValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={phoneValidation.isValid ? "text-green-600" : "text-red-600"}>
                  {phoneValidation.message}
                </span>
              </div>
            )}
          </div>

          {/* Message Content */}
          {messageType === 'text' ? (
            <div className="space-y-2">
              <Label htmlFor="message">{t('whatsapp.message', 'Message')}</Label>
              <Textarea
                id="message"
                ref={textareaRef}
                placeholder={t('whatsapp.messagePlaceholder', 'Type your message here...')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={cn("min-h-[100px] resize-none", isRTL && "text-right")}
                disabled={isSending}
                maxLength={4096}
              />
              <div className={cn("flex justify-between text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                <span>{message.length}/4096 characters</span>
                <span>{Math.ceil(message.length / 160)} SMS segments</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('whatsapp.selectTemplate', 'Select Template')}</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className={cn(isRTL && "text-right")}>
                  <SelectValue placeholder={t('whatsapp.chooseTemplate', 'Choose a template...')} />
                </SelectTrigger>
                <SelectContent>
                  {approvedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.name}>
                      <div className={cn("flex items-center justify-between w-full", isRTL && "flex-row-reverse")}>
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approvedTemplates.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('whatsapp.noTemplates', 'No approved templates available. Please contact support to set up message templates.')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Schedule Option */}
          <div className={cn("flex items-center space-x-2", isRTL && "space-x-reverse")}>
            <Switch
              id="schedule"
              checked={scheduleMessage}
              onCheckedChange={setScheduleMessage}
              disabled={isSending}
            />
            <Label htmlFor="schedule" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Clock className="h-4 w-4" />
              {t('whatsapp.scheduleMessage', 'Schedule Message')}
            </Label>
          </div>

          {scheduleMessage && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">{t('whatsapp.scheduledTime', 'Scheduled Time')}</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                disabled={isSending}
              />
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={
              isSending ||
              !phoneNumber ||
              !phoneValidation?.isValid ||
              (messageType === 'text' && !message.trim()) ||
              (messageType === 'template' && !selectedTemplate) ||
              (scheduleMessage && !scheduledTime)
            }
            className={cn("w-full", isRTL && "flex-row-reverse")}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('whatsapp.sending', 'Sending...')}
              </>
            ) : (
              <>
                <Send className={cn("mr-2 h-4 w-4", isRTL && "mr-0 ml-2")} />
                {scheduleMessage 
                  ? t('whatsapp.scheduleMessage', 'Schedule Message')
                  : t('whatsapp.sendMessage', 'Send Message')
                }
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Clock className="h-5 w-5" />
              {t('whatsapp.recentMessages', 'Recent Messages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className={cn("flex items-start gap-3 p-3 border rounded-lg", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex-shrink-0")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      msg.status === 'sent' ? "bg-green-100 text-green-600" :
                      msg.status === 'delivered' ? "bg-blue-100 text-blue-600" :
                      msg.status === 'read' ? "bg-purple-100 text-purple-600" :
                      "bg-red-100 text-red-600"
                    )}>
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  <div className={cn("flex-grow min-w-0", isRTL && "text-right")}>
                    <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse justify-end")}>
                      <span className="font-medium text-sm">{msg.phone_number}</span>
                      <Badge 
                        variant={msg.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 