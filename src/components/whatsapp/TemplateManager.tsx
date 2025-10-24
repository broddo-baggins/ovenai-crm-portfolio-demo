import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  Check, 
  Clock, 
  X, 
  Send,
  Eye,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  content: string;
  variables: string[];
  createdAt: string;
  usageCount?: number;
}

interface TemplateManagerProps {
  onSendTemplate?: (templateId: string, variables: Record<string, string>) => void;
  onCreateTemplate?: (template: Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSendTemplate,
  onCreateTemplate
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY' as const,
    language: 'en_US',
    content: ''
  });

  // Demo templates for Meta App Review
  useEffect(() => {
    setTemplates([
      {
        id: 'temp_001',
        name: 'property_inquiry_response',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        content: 'Hi {{1}}! Thanks for your interest in our {{2}} property. I can provide detailed information including pricing, floor plans, and availability. What specific details would you like to know?',
        variables: ['customer_name', 'property_type'],
        createdAt: '2024-01-15T10:00:00Z',
        usageCount: 23
      },
      {
        id: 'temp_002',
        name: 'viewing_confirmation',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        content: 'Your property viewing has been confirmed for {{1}} at {{2}}. Address: {{3}}. Please bring a valid ID. Looking forward to meeting you!',
        variables: ['date', 'time', 'address'],
        createdAt: '2024-01-16T14:30:00Z',
        usageCount: 15
      },
      {
        id: 'temp_003',
        name: 'lead_qualification_followup',
        category: 'MARKETING',
        language: 'en_US',
        status: 'PENDING',
        content: 'Hi! To help you find the perfect property, could you share your budget range and preferred location? This will help me recommend the best options for you.',
        variables: [],
        createdAt: '2024-01-17T09:15:00Z',
        usageCount: 0
      },
      {
        id: 'temp_004',
        name: 'price_update_notification',
        category: 'MARKETING',
        language: 'en_US',
        status: 'REJECTED',
        content: 'Great news! The price for {{1}} has been reduced by {{2}}%. Contact us now for more details!',
        variables: ['property_name', 'discount_percentage'],
        createdAt: '2024-01-18T16:45:00Z',
        usageCount: 0
      }
    ]);
  }, []);

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return;

    const template: Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'usageCount'> = {
      ...newTemplate,
      status: 'PENDING',
      variables: extractVariables(newTemplate.content)
    };

    onCreateTemplate?.(template);
    
    // Add to local state for demo
    const fullTemplate: WhatsAppTemplate = {
      ...template,
      id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    
    setTemplates(prev => [...prev, fullTemplate]);
    setNewTemplate({ name: '', category: 'UTILITY', language: 'en_US', content: '' });
    setIsCreating(false);
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const handleSendTemplate = (template: WhatsAppTemplate) => {
    if (template.status !== 'APPROVED') return;
    
    // For demo purposes, create mock variables
    const mockVariables: Record<string, string> = {
      '1': 'Sarah Johnson',
      '2': 'Waterfront Luxury Condo',
      '3': '123 Marina Drive'
    };
    
    onSendTemplate?.(template.id, mockVariables);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: (t.usageCount || 0) + 1 }
        : t
    ));
  };

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
  const pendingTemplates = templates.filter(t => t.status === 'PENDING');
  const rejectedTemplates = templates.filter(t => t.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{approvedTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Total Sent</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Rejected</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{rejectedTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Message Templates
            </CardTitle>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approved">Approved ({approvedTemplates.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTemplates.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedTemplates.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="approved" className="space-y-4">
              {approvedTemplates.map((template) => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  onSend={() => handleSendTemplate(template)}
                />
              ))}
              {approvedTemplates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No approved templates yet</p>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {pendingTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {pendingTemplates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending templates</p>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="space-y-4">
              {rejectedTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {rejectedTemplates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No rejected templates</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Template Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., welcome_message"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value: "UTILITY") => setNewTemplate(prev => ({ ...prev, category: value }))}
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
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <Select
                      value={newTemplate.language}
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_US">English (US)</SelectItem>
                        <SelectItem value="he">Hebrew</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Message Content</label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your template message. Use {{1}}, {{2}}, etc. for variables."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {`{{1}}`}, {`{{2}}`}, etc. for dynamic variables
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Submit for Approval
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta App Review Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Meta App Review Demonstration</p>
              <p className="text-xs text-blue-700 mt-1">
                This component demonstrates template messaging functionality for the whatsapp_business_messaging 
                permission. It shows template creation, Meta approval tracking, and bulk messaging capabilities 
                essential for real estate lead nurturing campaigns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Template Card Component
const TemplateCard: React.FC<{
  template: WhatsAppTemplate;
  onSend?: () => void;
}> = ({ template, onSend }) => {
  return (
    <Card className="border-l-4 border-l-blue-500 w-full min-w-0">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="font-medium text-sm sm:text-base truncate flex-1">{template.name}</h4>
              {template.status && <Badge className="text-xs">{template.status}</Badge>}
              {template.category && (
                <Badge variant="outline" className="text-xs">{template.category}</Badge>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 mb-3 break-words line-clamp-2">{template.content}</p>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
              <span>Usage: {template.usageCount || 0} times</span>
              {template.variables.length > 0 && (
                <span>Variables: {template.variables.length}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto sm:ml-4">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]">
              <Eye className="h-4 w-4" />
              <span className="ml-1 sm:hidden">View</span>
            </Button>
            {template.status === 'APPROVED' && onSend && (
              <Button size="sm" onClick={onSend} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]">
                <Send className="h-4 w-4" />
                <span className="ml-1 sm:hidden">Send</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 