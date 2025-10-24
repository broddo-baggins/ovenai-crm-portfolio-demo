import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/context/ProjectContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Plus,
  MessageSquare,
  Globe,
  Building,
  Copy,
  Edit3,
  Trash2,
  Send,
  Eye,
  Settings,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

interface ProjectTemplate {
  id: string;
  name: string;
  content: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  project_id: string | null; // null = global template
  project_name?: string;
  variables: string[];
  usage_count: number;
  created_at: string;
  is_global: boolean;
  created_by: string;
}

interface ProjectBasedTemplateManagerProps {
  onSendTemplate?: (templateId: string, variables: Record<string, string>) => void;
}

export const ProjectBasedTemplateManager: React.FC<ProjectBasedTemplateManagerProps> = ({
  onSendTemplate
}) => {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const { isRTL, textStart, flexRowReverse } = useLang();
  
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterScope, setFilterScope] = useState<'all' | 'project' | 'global'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'APPROVED' | 'PENDING'>('all');
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'UTILITY' as const,
    language: 'en_US',
    is_global: false,
    project_id: currentProject?.id || null
  });

  // Demo data - replace with actual API calls
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      
      // Simulate API call with demo data
      const demoTemplates: ProjectTemplate[] = [
        // Global Templates
        {
          id: 'global_001',
          name: 'welcome_new_lead',
          content: 'ברוכים הבאים ל-OvenAI! אנחנו כאן לעזור לכם למצוא את הנכס המושלם. איך נוכל לעזור לכם היום?',
          category: 'UTILITY',
          language: 'he_IL',
          status: 'APPROVED',
          project_id: null,
          is_global: true,
          variables: [],
          usage_count: 45,
          created_at: '2024-01-15T10:00:00Z',
          created_by: 'system'
        },
        {
          id: 'global_002',
          name: 'contact_information',
          content: 'הנה פרטי הקשר שלנו:\n\nסוכן: {{1}}\nטלפון: {{2}}\nאימייל: {{3}}\n\nנשמח לשמוע מכם!',
          category: 'UTILITY',
          language: 'he_IL',
          status: 'APPROVED',
          project_id: null,
          is_global: true,
          variables: ['agent_name', 'phone', 'email'],
          usage_count: 67,
          created_at: '2024-01-16T14:30:00Z',
          created_by: 'system'
        },
        
        // Project-Specific Templates
        {
          id: 'proj_001',
          name: 'luxury_tower_inquiry',
          content: 'תודה על התעניינותכם במגדל הייטק יוקרה! המיקום: {{1}}, מחיר: {{2}}, זמינות: {{3}}. נשמח לתאם צפייה. מתי נוח לכם?',
          category: 'MARKETING',
          language: 'he_IL',
          status: 'APPROVED',
          project_id: currentProject?.id || 'project_123',
          project_name: currentProject?.name || 'מגדל הייטק יוקרה',
          is_global: false,
          variables: ['location', 'price', 'availability'],
          usage_count: 23,
          created_at: '2024-01-17T09:15:00Z',
          created_by: 'user_456'
        },
        {
          id: 'proj_002',
          name: 'villa_neighborhood_update',
          content: 'עדכון חשוב על פרויקט הוילות ב{{1}}: מחירים מיוחדים לרוכשים הראשונים! חסכון של עד {{2}}%. פרטים נוספים: {{3}}',
          category: 'MARKETING',
          language: 'he_IL',
          status: 'PENDING',
          project_id: 'project_456',
          project_name: 'שכונת וילות פרמיום',
          is_global: false,
          variables: ['neighborhood', 'discount', 'details'],
          usage_count: 8,
          created_at: '2024-01-18T16:45:00Z',
          created_by: 'user_789'
        }
      ];
      
      setTemplates(demoTemplates);
      setLoading(false);
    };
    
    loadTemplates();
  }, [currentProject?.id]);

  // Filter templates based on scope and status
  const filteredTemplates = templates.filter(template => {
    // Scope filter
    if (filterScope === 'global' && !template.is_global) return false;
    if (filterScope === 'project' && template.is_global) return false;
    if (filterScope === 'project' && template.project_id !== currentProject?.id) return false;
    
    // Status filter
    if (filterStatus !== 'all' && template.status !== filterStatus) return false;
    
    return true;
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('שם התבנית והתוכן הם חובה');
      return;
    }

    const template: ProjectTemplate = {
      id: `temp_${Date.now()}`,
      name: newTemplate.name,
      content: newTemplate.content,
      category: newTemplate.category,
      language: newTemplate.language,
      status: 'PENDING',
      project_id: newTemplate.is_global ? null : (newTemplate.project_id || currentProject?.id || null),
      project_name: newTemplate.is_global ? undefined : currentProject?.name,
      is_global: newTemplate.is_global,
      variables: extractVariables(newTemplate.content),
      usage_count: 0,
      created_at: new Date().toISOString(),
      created_by: 'current_user'
    };

    setTemplates(prev => [...prev, template]);
    toast.success('תבנית נוצרה בהצלחה!');
    setIsCreateModalOpen(false);
    resetForm();
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{{(\d+)}}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const resetForm = () => {
    setNewTemplate({
      name: '',
      content: '',
      category: 'UTILITY',
      language: 'he_IL',
      is_global: false,
      project_id: currentProject?.id || null
    });
  };

  const handleSendTemplateMessage = (template: ProjectTemplate) => {
    if (template.status !== 'APPROVED') {
      toast.error('ניתן לשלוח רק תבניות מאושרות');
      return;
    }

    // Mock variables for demo
    const mockVariables: Record<string, string> = {
      '1': 'תל אביב מרכז',
      '2': '₪2,500,000',
      '3': 'זמין מיידי',
      'agent_name': 'שרה כהן',
      'phone': '054-123-4567',
      'email': 'sarah@oven-ai.com'
    };

    onSendTemplate?.(template.id, mockVariables);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usage_count: t.usage_count + 1 }
        : t
    ));
    
    toast.success(`תבנית "${template.name}" נשלחה בהצלחה!`);
  };

  const copyToProject = (template: ProjectTemplate) => {
    if (!currentProject) {
      toast.error('יש לבחור פרויקט תחילה');
      return;
    }

    const projectTemplate: ProjectTemplate = {
      ...template,
      id: `copy_${Date.now()}`,
      name: `${template.name}_${currentProject.name}`,
      project_id: currentProject.id,
      project_name: currentProject.name,
      is_global: false,
      status: 'PENDING',
      usage_count: 0,
      created_at: new Date().toISOString()
    };

    setTemplates(prev => [...prev, projectTemplate]);
    toast.success(`תבנית הועתקה לפרויקט "${currentProject.name}"`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", isRTL && "rtl")}>
      {/* Header */}
      <div className={cn("flex justify-between items-center", flexRowReverse())}>
        <div className={textStart()}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#25D366] to-[#1eb85e] bg-clip-text text-transparent">
            ניהול תבניות לפי פרויקט
          </h1>
          <p className="text-gray-600 mt-1">
            תבניות WhatsApp מותאמות לפרויקט
            {currentProject && (
              <span className="text-[#25D366] mr-2">• {currentProject.name}</span>
            )}
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              תבנית חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl">
            <DialogHeader>
              <DialogTitle>יצירת תבנית חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">שם התבנית</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="לדוגמה: ברכת_הגעה_לקוח_חדש"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">קטגוריה</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">שירותי</SelectItem>
                      <SelectItem value="MARKETING">שיווקי</SelectItem>
                      <SelectItem value="AUTHENTICATION">אימות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-content">תוכן התבנית</Label>
                <Textarea
                  id="template-content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="תוכן התבנית כאן... השתמשו ב-{{1}}, {{2}} למשתנים"
                  rows={4}
                  className="text-right"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-global"
                    checked={newTemplate.is_global}
                    onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, is_global: checked }))}
                  />
                  <Label htmlFor="is-global">תבנית גלובלית (לכל הפרויקטים)</Label>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  יצירת תבנית
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className={cn("flex gap-4 items-center", flexRowReverse())}>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">סינון:</span>
        </div>
        
        <Select value={filterScope} onValueChange={(value) => setFilterScope(value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל התבניות</SelectItem>
            <SelectItem value="project">פרויקט נוכחי</SelectItem>
            <SelectItem value="global">תבניות גלובליות</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="APPROVED">מאושר</SelectItem>
            <SelectItem value="PENDING">ממתין לאישור</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow w-full min-w-0">
            <CardHeader className="p-3 sm:p-4">
              <div className={cn("flex justify-between items-start gap-2", flexRowReverse())}>
                <div className={cn(textStart(), "flex-1 min-w-0")}>
                  <CardTitle className="text-base sm:text-lg truncate">{template.name}</CardTitle>
                  <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
                    <Badge 
                      variant={template.status === 'APPROVED' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        template.status === 'APPROVED' ? 'bg-green-500' : ''
                      )}
                    >
                      {template.status === 'APPROVED' ? 'מאושר' : 'ממתין'}
                    </Badge>
                    {template.is_global ? (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Globe className="h-2 w-2 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">גלובלי</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Building className="h-2 w-2 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">פרויקט</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {template.project_name && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">פרויקט: {template.project_name}</p>
              )}
            </CardHeader>
            
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded text-right leading-relaxed break-words">
                  {template.content.substring(0, 120)}
                  {template.content.length > 120 && '...'}
                </p>
                
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">משתנים:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>שימושים: {template.usage_count}</span>
                  <span className="truncate">{template.category}</span>
                </div>
                
                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {template.status === 'APPROVED' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSendTemplateMessage(template)}
                      className="flex-1 min-h-[44px] sm:min-h-[36px]"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      שליחה
                    </Button>
                  )}
                  
                  {template.is_global && currentProject && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToProject(template)}
                      className="flex-1 min-h-[44px] sm:min-h-[36px]"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      העתק לפרויקט
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין תבניות להצגה</h3>
          <p className="text-gray-600 mb-4">
            {filterScope === 'project' 
              ? 'אין תבניות לפרויקט הנוכחי. צרו תבנית חדשה או העתיקו מהתבניות הגלובליות'
              : 'לא נמצאו תבניות מתאימות לסינון הנוכחי'
            }
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            יצירת תבנית ראשונה
          </Button>
        </div>
      )}
    </div>
  );
}; 