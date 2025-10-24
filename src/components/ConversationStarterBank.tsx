// @ts-nocheck
// TODO: This component needs database schema updates - conversation_starters table doesn't exist
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  TestTube,
  Eye,
  EyeOff,
  Copy,
  BarChart3,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConversationStarter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  description?: string;
  category: 'general' | 'introduction' | 'follow_up' | 'value_proposition' | 'objection_handling' | 'closing';
  is_active: boolean;
  is_tested: boolean;
  test_results: Record<string, unknown> | null;
  usage_count: number;
  success_rate: number;
  last_used_at?: string;
  meta_approval_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  meta_submitted_at?: string;
  meta_approved_at?: string;
  meta_rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface ConversationStarterTemplate {
  id: string;
  name: string;
  content: string;
  description?: string;
  category: string;
  industry?: string;
  use_case?: string;
  variables: string[];
  is_public: boolean;
}

interface ConversationStarterBankProps {
  projectId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ConversationStarterBank: React.FC<ConversationStarterBankProps> = ({
  projectId,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [templates, setTemplates] = useState<ConversationStarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingStarter, setEditingStarter] = useState<ConversationStarter | null>(null);
  const [newStarter, setNewStarter] = useState({
    title: '',
    content: '',
    description: '',
    category: 'general' as const
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'introduction', label: 'Introduction' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'value_proposition', label: 'Value Proposition' },
    { value: 'objection_handling', label: 'Objection Handling' },
    { value: 'closing', label: 'Closing' }
  ];

  useEffect(() => {
    fetchConversationStarters();
    fetchTemplates();
   
  }, [projectId]);

  const fetchConversationStarters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStarters(data || []);
    } catch (error) {
      console.error('Error fetching conversation starters:', error);
      toast.error('Failed to load conversation starters');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_starter_templates')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createConversationStarter = async () => {
    if (!newStarter.title.trim() || !newStarter.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .insert({
          project_id: projectId,
          title: newStarter.title,
          content: newStarter.content,
          description: newStarter.description,
          category: newStarter.category
        })
        .select()
        .single();

      if (error) throw error;

      setStarters(prev => [data, ...prev]);
      setNewStarter({ title: '', content: '', description: '', category: 'general' });
      setIsCreateDialogOpen(false);
      toast.success('Conversation starter created successfully');
    } catch (error: unknown) {
      console.error('Error creating conversation starter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Maximum of 10')) {
        toast.error('Maximum of 10 active conversation starters allowed per project');
      } else {
        toast.error('Failed to create conversation starter');
      }
    }
  };

  const updateConversationStarter = async (id: string, updates: Partial<ConversationStarter>) => {
    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStarters(prev => prev.map(starter => 
        starter.id === id ? { ...starter, ...data } : starter
      ));
      
      toast.success('Conversation starter updated successfully');
    } catch (error) {
      console.error('Error updating conversation starter:', error);
      toast.error('Failed to update conversation starter');
    }
  };

  const deleteConversationStarter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversation_starters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStarters(prev => prev.filter(starter => starter.id !== id));
      toast.success('Conversation starter deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation starter:', error);
      toast.error('Failed to delete conversation starter');
    }
  };

  const duplicateConversationStarter = async (starter: ConversationStarter) => {
    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .insert({
          project_id: projectId,
          title: `${starter.title} (Copy)`,
          content: starter.content,
          description: starter.description,
          category: starter.category
        })
        .select()
        .single();

      if (error) throw error;

      setStarters(prev => [data, ...prev]);
      toast.success('Conversation starter duplicated successfully');
    } catch (error: any) {
      console.error('Error duplicating conversation starter:', error);
      if (error.message.includes('Maximum of 10')) {
        toast.error('Maximum of 10 active conversation starters allowed per project');
      } else {
        toast.error('Failed to duplicate conversation starter');
      }
    }
  };

  const createFromTemplate = async (template: ConversationStarterTemplate) => {
    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .insert({
          project_id: projectId,
          title: template.name,
          content: template.content,
          description: template.description,
          category: template.category as any
        })
        .select()
        .single();

      if (error) throw error;

      setStarters(prev => [data, ...prev]);
      setIsTemplateDialogOpen(false);
      toast.success('Conversation starter created from template');
    } catch (error: any) {
      console.error('Error creating from template:', error);
      if (error.message.includes('Maximum of 10')) {
        toast.error('Maximum of 10 active conversation starters allowed per project');
      } else {
        toast.error('Failed to create conversation starter');
      }
    }
  };

  const submitToMeta = async (id: string) => {
    try {
      await updateConversationStarter(id, {
        meta_approval_status: 'under_review',
        meta_submitted_at: new Date().toISOString()
      });
      toast.success('Submitted to Meta for approval (3-7 days processing time)');
    } catch (error) {
      console.error('Failed to submit to Meta:', error);
      toast.error('Failed to submit to Meta');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredStarters = starters.filter(starter => {
    const categoryMatch = selectedCategory === 'all' || starter.category === selectedCategory;
    const activeMatch = showInactive || starter.is_active;
    return categoryMatch && activeMatch;
  });

  const activeStartersCount = starters.filter(s => s.is_active).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation Starter Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation Starter Bank
                <Badge variant="outline">{activeStartersCount}/10</Badge>
              </div>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label htmlFor="show-inactive">Show inactive</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      From Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Choose Template</DialogTitle>
                      <DialogDescription>
                        Select a pre-built template to create a new conversation starter
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 max-h-96 overflow-y-auto">
                      {templates.map(template => (
                        <Card key={template.id} className="cursor-pointer hover:bg-gray-50" 
                              onClick={() => createFromTemplate(template)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{template.name}</h4>
                              <Badge variant="outline">{template.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                            <p className="text-sm bg-gray-100 p-2 rounded">{template.content}</p>
                            {template.variables.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Variables: </span>
                                {template.variables.map(variable => (
                                  <Badge key={variable} variant="secondary" className="mr-1 text-xs">
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={activeStartersCount >= 10}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Starter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Conversation Starter</DialogTitle>
                      <DialogDescription>
                        Add a new conversation starter to your bank. You can have up to 10 active starters.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newStarter.title}
                          onChange={(e) => setNewStarter(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter a descriptive title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={newStarter.category} onValueChange={(value: any) => setNewStarter(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.slice(1).map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="content">Message Content</Label>
                        <Textarea
                          id="content"
                          value={newStarter.content}
                          onChange={(e) => setNewStarter(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Enter your conversation starter message"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={newStarter.description}
                          onChange={(e) => setNewStarter(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe when to use this starter"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createConversationStarter}>
                        Create Starter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Conversation Starters List */}
            <div className="space-y-3">
              {filteredStarters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation starters found</p>
                  <p className="text-sm">Create your first conversation starter to get started</p>
                </div>
              ) : (
                filteredStarters.map(starter => (
                  <Card key={starter.id} className={`${!starter.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{starter.title}</h4>
                            <Badge variant="outline">{starter.category}</Badge>
                            {getStatusBadge(starter.meta_approval_status)}
                          </div>
                          {starter.description && (
                            <p className="text-sm text-gray-600 mb-2">{starter.description}</p>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingStarter(starter)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateConversationStarter(starter)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateConversationStarter(starter.id, { is_active: !starter.is_active })}
                            >
                              {starter.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            {starter.meta_approval_status === 'pending' && (
                              <DropdownMenuItem onClick={() => submitToMeta(starter.id)}>
                                <TestTube className="h-4 w-4 mr-2" />
                                Submit to Meta
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteConversationStarter(starter.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="bg-gray-50 p-3 rounded text-sm mb-3">
                        {starter.content}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Used {starter.usage_count} times
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {starter.success_rate.toFixed(1)}% success rate
                          </div>
                          {starter.last_used_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last used {new Date(starter.last_used_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(starter.meta_approval_status)}
                          <span className="text-xs">Meta Status</span>
                        </div>
                      </div>

                      {starter.meta_rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {starter.meta_rejection_reason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Meta Approval Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Meta Approval Process:</strong> Conversation starters need Meta approval before use in WhatsApp campaigns. 
                  This process typically takes 3-7 days. You can test starters locally before submitting.
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Edit Dialog */}
      {editingStarter && (
        <Dialog open={!!editingStarter} onOpenChange={() => setEditingStarter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Conversation Starter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingStarter.title}
                  onChange={(e) => setEditingStarter(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={editingStarter.category} 
                  onValueChange={(value: any) => setEditingStarter(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Message Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingStarter.content}
                  onChange={(e) => setEditingStarter(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingStarter.description || ''}
                  onChange={(e) => setEditingStarter(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStarter(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (editingStarter) {
                  updateConversationStarter(editingStarter.id, {
                    title: editingStarter.title,
                    content: editingStarter.content,
                    description: editingStarter.description,
                    category: editingStarter.category
                  });
                  setEditingStarter(null);
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ConversationStarterBank; 