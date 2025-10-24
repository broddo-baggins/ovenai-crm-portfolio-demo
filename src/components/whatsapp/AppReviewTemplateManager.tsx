import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  FileText,
  Check,
  Clock,
  X,
  Send,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  content: string;
  variables: string[];
  createdAt: string;
  usageCount: number;
  lastUsed?: string;
}

interface AppReviewTemplateManagerProps {
  className?: string;
}

export const AppReviewTemplateManager: React.FC<AppReviewTemplateManagerProps> = ({ className }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY' as const,
    language: 'en_US',
    content: ''
  });

  // Load demo templates for app review
  useEffect(() => {
    const demoTemplates: WhatsAppTemplate[] = [
      {
        id: 'hello_world',
        name: 'hello_world',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        content: 'Hello World',
        variables: [],
        createdAt: '2024-01-15T10:00:00Z',
        usageCount: 145,
        lastUsed: '2024-01-20T14:30:00Z'
      },
      {
        id: 'property_inquiry_response',
        name: 'property_inquiry_response',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        content: 'Hi {{1}}! Thanks for your interest in our {{2}} property. I can provide detailed information including pricing, floor plans, and availability. What specific details would you like to know?',
        variables: ['customer_name', 'property_type'],
        createdAt: '2024-01-16T14:30:00Z',
        usageCount: 89,
        lastUsed: '2024-01-19T16:45:00Z'
      },
      {
        id: 'viewing_confirmation',
        name: 'viewing_confirmation',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        content: 'Your property viewing has been confirmed for {{1}} at {{2}}. Address: {{3}}. Please bring a valid ID. Looking forward to meeting you!',
        variables: ['date', 'time', 'address'],
        createdAt: '2024-01-17T09:15:00Z',
        usageCount: 67,
        lastUsed: '2024-01-18T11:20:00Z'
      },
      {
        id: 'lead_qualification_followup',
        name: 'lead_qualification_followup',
        category: 'MARKETING',
        language: 'en_US',
        status: 'PENDING',
        content: 'Hi! To help you find the perfect property, could you share your budget range and preferred location? This will help me recommend the best options for you.',
        variables: [],
        createdAt: '2024-01-18T16:45:00Z',
        usageCount: 0
      },
      {
        id: 'price_update_notification',
        name: 'price_update_notification',
        category: 'MARKETING',
        language: 'en_US',
        status: 'REJECTED',
        content: 'Great news! The price for {{1}} has been reduced by {{2}}%. Contact us now for more details!',
        variables: ['property_name', 'discount_percentage'],
        createdAt: '2024-01-19T12:00:00Z',
        usageCount: 0
      }
    ];
    setTemplates(demoTemplates);
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract variables from template content
      const variables = extractVariables(newTemplate.content);
      
      const template: WhatsAppTemplate = {
        id: `temp_${Date.now()}`,
        name: newTemplate.name,
        category: newTemplate.category,
        language: newTemplate.language,
        status: 'PENDING',
        content: newTemplate.content,
        variables,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      // Simulate API call to create template
      console.log('Creating WhatsApp template:', template);
      
      // In a real app, this would call the Meta API:
      // await createWhatsAppTemplate(template);
      
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({ name: '', category: 'UTILITY', language: 'en_US', content: '' });
      setIsCreating(false);
      
      toast.success('Template created successfully!', {
        description: 'Template is pending approval from Meta'
      });

    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToMeta = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setIsSubmitting(true);
    try {
      // Simulate Meta API submission
      console.log('Submitting template to Meta for approval:', template);
      
      // In a real app, this would call:
      // await submitTemplateToMeta(template);
      
      // Simulate approval process
      setTimeout(() => {
        setTemplates(prev => prev.map(t => 
          t.id === templateId 
            ? { ...t, status: 'APPROVED' as const }
            : t
        ));
        toast.success('Template approved by Meta!');
      }, 2000);

      toast.info('Template submitted to Meta for review');
      
    } catch (error) {
      console.error('Error submitting to Meta:', error);
      toast.error('Failed to submit template to Meta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const getStatusIcon = (status: WhatsAppTemplate['status']) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: WhatsAppTemplate['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
  const pendingTemplates = templates.filter(t => t.status === 'PENDING');
  const rejectedTemplates = templates.filter(t => t.status === 'REJECTED');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Template Manager</h2>
          <p className="text-gray-600 mt-1">
            Create and manage WhatsApp Business message templates for your campaigns
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New WhatsApp Template</DialogTitle>
              <DialogDescription>
                Create a new message template for WhatsApp Business API
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., welcome_message"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={newTemplate.category} 
                    onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-language">Language</Label>
                <Select 
                  value={newTemplate.language} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="en_GB">English (UK)</SelectItem>
                    <SelectItem value="he_IL">Hebrew</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  placeholder="Enter your message template... Use {{1}}, {{2}} for variables"
                  rows={4}
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{1}}, {{2}}, etc. for dynamic variables`}
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={isSubmitting || !newTemplate.name || !newTemplate.content}
                >
                  {isSubmitting ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{approvedTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{rejectedTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <Tabs defaultValue="approved" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Rejected ({rejectedTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-4">
          {approvedTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No approved templates</h3>
                <p className="text-gray-600">Create and submit templates for approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvedTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(template.status)}
                          <Badge className={cn("text-xs", getStatusColor(template.status))}>
                            {template.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm">{template.content}</p>
                        </div>
                        
                        {template.variables.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Variables:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {`{{${variable}}}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Used {template.usageCount} times</span>
                          <span>
                            Created {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            <Send className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending templates</h3>
                <p className="text-gray-600">Templates submitted for approval will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingTemplates.map((template) => (
                <Card key={template.id} className="border-yellow-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(template.status)}
                        <Badge className={cn("text-xs", getStatusColor(template.status))}>
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm">{template.content}</p>
                      </div>
                      
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          This template is awaiting approval from Meta. You can submit it for review.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSubmitToMeta(template.id)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Submit to Meta
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected templates</h3>
                <p className="text-gray-600">Keep your templates compliant to avoid rejection</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rejectedTemplates.map((template) => (
                <Card key={template.id} className="border-red-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(template.status)}
                        <Badge className={cn("text-xs", getStatusColor(template.status))}>
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm">{template.content}</p>
                      </div>
                      
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          This template was rejected by Meta. Review the content and resubmit.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit & Resubmit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* App Review Notice */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          <strong>Meta App Review Demo:</strong> This template manager demonstrates the complete WhatsApp Business 
          template creation and management workflow required for the whatsapp_business_management permission.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 