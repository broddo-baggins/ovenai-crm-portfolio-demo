import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  Phone,
  Key,
  Shield,
  Zap,
  Copy,
  ExternalLink
} from 'lucide-react';
import { env } from '@/config/env';
import { toast } from 'sonner';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  solution?: string;
  details?: any;
}

interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  businessId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
}

export const WhatsAppDiagnosticTool: React.FC = () => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [credentials, setCredentials] = useState<WhatsAppCredentials>({
    accessToken: '',
    phoneNumberId: '',
    businessId: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    webhookVerifyToken: ''
  });

  useEffect(() => {
    // Load current credentials
    setCredentials({
      accessToken: env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessId: env.WHATSAPP_BUSINESS_ID || '',
      businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      appId: env.WHATSAPP_APP_ID || '',
      appSecret: env.WHATSAPP_APP_SECRET || '',
      webhookVerifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ''
    });
  }, []);

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Environment Variables Check
    
    if (!credentials.accessToken || credentials.accessToken.includes('test_')) {
      diagnostics.push({
        category: 'Configuration',
        test: 'WhatsApp Access Token',
        status: 'error',
        message: 'Missing or invalid WhatsApp Access Token',
        solution: 'Get a real access token from Meta Business Manager → WhatsApp → API Setup'
      });
    } else {
      diagnostics.push({
        category: 'Configuration',
        test: 'WhatsApp Access Token',
        status: 'success',
        message: `Access token configured (${credentials.accessToken.length} characters)`
      });
    }

    if (!credentials.phoneNumberId || credentials.phoneNumberId.includes('test_')) {
      diagnostics.push({
        category: 'Configuration',
        test: 'Phone Number ID',
        status: 'error',
        message: 'Missing or invalid Phone Number ID',
        solution: 'Get your Phone Number ID from Meta Business Manager → WhatsApp → API Setup'
      });
    } else {
      diagnostics.push({
        category: 'Configuration',
        test: 'Phone Number ID',
        status: 'success',
        message: `Phone Number ID configured: ${credentials.phoneNumberId}`
      });
    }

    if (!credentials.businessId || credentials.businessId.includes('test_')) {
      diagnostics.push({
        category: 'Configuration',
        test: 'Business ID',
        status: 'warning',
        message: 'Missing Business ID',
        solution: 'Add your WhatsApp Business ID for full functionality'
      });
    } else {
      diagnostics.push({
        category: 'Configuration',
        test: 'Business ID',
        status: 'success',
        message: `Business ID configured: ${credentials.businessId}`
      });
    }

    // 2. Phone Number Approval Status
    
    if (credentials.accessToken && credentials.phoneNumberId && 
        !credentials.accessToken.includes('test_') && 
        !credentials.phoneNumberId.includes('test_')) {
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const isApproved = data.status === 'APPROVED' || data.quality_rating === 'GREEN';
          
          diagnostics.push({
            category: 'Phone Number',
            test: 'Approval Status',
            status: isApproved ? 'success' : 'warning',
            message: isApproved ? 'Phone number is approved' : 'Phone number may need approval',
            solution: isApproved ? undefined : 'Submit your phone number for approval in Meta Business Manager',
            details: data
          });
        } else {
          diagnostics.push({
            category: 'Phone Number',
            test: 'Approval Status',
            status: 'error',
            message: 'Cannot check phone number status',
            solution: 'Verify your access token and phone number ID'
          });
        }
      } catch (error) {
        diagnostics.push({
          category: 'Phone Number',
          test: 'Approval Status',
          status: 'error',
          message: 'Failed to check phone number status',
          solution: 'Check your network connection and credentials'
        });
      }
    } else {
      diagnostics.push({
        category: 'Phone Number',
        test: 'Approval Status',
        status: 'error',
        message: 'Cannot check approval - missing credentials',
        solution: 'Configure valid WhatsApp credentials first'
      });
    }

    // 3. Message Template Status
    console.log('NOTE Checking message templates...');
    
    if (credentials.accessToken && credentials.businessAccountId && 
        !credentials.accessToken.includes('test_')) {
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${credentials.businessAccountId}/message_templates`, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const approvedTemplates = data.data?.filter((t: any) => t.status === 'APPROVED') || [];
          
          diagnostics.push({
            category: 'Templates',
            test: 'Message Templates',
            status: approvedTemplates.length > 0 ? 'success' : 'warning',
            message: `${approvedTemplates.length} approved templates found`,
            solution: approvedTemplates.length === 0 ? 'Create and get approval for message templates' : undefined
          });
        } else {
          diagnostics.push({
            category: 'Templates',
            test: 'Message Templates',
            status: 'warning',
            message: 'Cannot check templates',
            solution: 'Verify your business account ID and permissions'
          });
        }
      } catch (error) {
        diagnostics.push({
          category: 'Templates',
          test: 'Message Templates',
          status: 'warning',
          message: 'Failed to check templates',
          solution: 'Check your network connection and business account ID'
        });
      }
    }

    // 4. Webhook Configuration
    console.log('LINK Checking webhook configuration...');
    
    if (credentials.webhookVerifyToken) {
      diagnostics.push({
        category: 'Webhook',
        test: 'Verify Token',
        status: 'success',
        message: 'Webhook verify token configured'
      });
    } else {
      diagnostics.push({
        category: 'Webhook',
        test: 'Verify Token',
        status: 'warning',
        message: 'Missing webhook verify token',
        solution: 'Add VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN to your .env.local'
      });
    }

    // 5. Test Phone Number Validation
    if (testPhoneNumber) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      const isValidFormat = phoneRegex.test(testPhoneNumber);
      
      diagnostics.push({
        category: 'Test Phone',
        test: 'Phone Format',
        status: isValidFormat ? 'success' : 'error',
        message: isValidFormat ? 'Phone number format is valid' : 'Invalid phone number format',
        solution: isValidFormat ? undefined : 'Use international format: +1234567890'
      });

      // Check if it's a test number
      const testNumbers = ['+1234567890', '+0000000000', '+1111111111'];
      if (testNumbers.includes(testPhoneNumber)) {
        diagnostics.push({
          category: 'Test Phone',
          test: 'Phone Approval',
          status: 'error',
          message: 'Test phone number detected',
          solution: 'Use a real phone number. WhatsApp blocks test numbers.'
        });
      }
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  const sendTestMessage = async () => {
    if (!testPhoneNumber) {
      toast.error('Please enter a phone number to test');
      return;
    }

    if (!credentials.accessToken || !credentials.phoneNumberId) {
      toast.error('WhatsApp credentials are not configured');
      return;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: testPhoneNumber.replace('+', ''),
          type: 'text',
          text: {
            body: 'Hello! This is a test message from OvenAI. If you receive this, your WhatsApp integration is working! COMPLETE'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Test message sent successfully!');
        console.log('Message sent:', data);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to send test message: ${errorData.error?.message || 'Unknown error'}`);
        console.error('Message failed:', errorData);
      }
    } catch (error) {
      toast.error('Network error sending test message');
      console.error('Test message error:', error);
    }
  };

  const copyEnvTemplate = () => {
    const envTemplate = `# WhatsApp Business API Configuration
# Get these values from Meta Business Manager → WhatsApp → API Setup

# KEY Required for sending messages
VITE_WHATSAPP_ACCESS_TOKEN=your_actual_access_token_here
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# 🏢 Business Information
VITE_WHATSAPP_BUSINESS_ID=your_business_id_here
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# MOBILE App Information
VITE_WHATSAPP_APP_ID=your_app_id_here
VITE_WHATSAPP_APP_SECRET=your_app_secret_here

# LINK Webhook Configuration
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
VITE_WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook

# TARGET Meta Business Configuration
VITE_META_APP_ID=your_meta_app_id_here
VITE_META_BUSINESS_ID=your_meta_business_id_here`;

    navigator.clipboard.writeText(envTemplate);
    toast.success('Environment template copied to clipboard!');
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Send Button Diagnostic Tool
          </CardTitle>
          <CardDescription>
            Diagnose and fix WhatsApp send message button issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnostics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="test">Test Message</TabsTrigger>
            </TabsList>
            
            <TabsContent value="diagnostics" className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={runComprehensiveDiagnostics} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Run Full Diagnostics
                    </>
                  )}
                </Button>
              </div>

              {results.length > 0 && (
                <div className="space-y-3">
                  {['Configuration', 'Phone Number', 'Templates', 'Webhook', 'Test Phone'].map(category => {
                    const categoryResults = results.filter(r => r.category === category);
                    if (categoryResults.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                        {categoryResults.map((result, index) => (
                          <Alert key={index} className="p-3">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(result.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTitle className="text-sm">{result.test}</AlertTitle>
                                  {getStatusBadge(result.status)}
                                </div>
                                <AlertDescription className="text-xs">
                                  {result.message}
                                  {result.solution && (
                                    <div className="mt-1 text-blue-600 font-medium">
                                      IDEA Solution: {result.solution}
                                    </div>
                                  )}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>WhatsApp Business API Setup Guide</AlertTitle>
                <AlertDescription>
                  Follow these steps to configure WhatsApp Business API properly
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Step 1: Get WhatsApp Business API Access</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Business Manager</a></li>
                    <li>Add your WhatsApp Business Account</li>
                    <li>Complete the verification process</li>
                    <li>Request API access (this can take several days)</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Step 2: Configure Your App</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Create a new app in Meta Developers</li>
                    <li>Add WhatsApp Business API to your app</li>
                    <li>Get your App ID, App Secret, and Access Token</li>
                    <li>Configure webhook URL and verify token</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Step 3: Environment Configuration</h4>
                  <Button onClick={copyEnvTemplate} className="mb-2">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Environment Template
                  </Button>
                  <p className="text-sm text-gray-600">
                    Copy the template above and update your .env.local file with your actual WhatsApp credentials.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Step 4: Phone Number Approval</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your phone number must be approved by Meta</li>
                    <li>You can only send messages to approved numbers initially</li>
                    <li>Add test numbers in Meta Business Manager</li>
                    <li>Submit for production approval once tested</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="test-phone">Test Phone Number</Label>
                  <Input
                    id="test-phone"
                    placeholder="+1234567890"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use a real phone number that you have added to your WhatsApp Business account
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={sendTestMessage} 
                    disabled={!testPhoneNumber || !credentials.accessToken}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Send Test Message
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://business.facebook.com/wa/manage/phone-numbers/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Phone Numbers
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                    <li>Test numbers must be added to your WhatsApp Business account</li>
                    <li>Messages to unapproved numbers will fail</li>
                    <li>Check your phone number approval status in Meta Business Manager</li>
                    <li>For production use, submit your app for review</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppDiagnosticTool; 