// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Save, 
  Plus, 
  Edit2, 
  Eye, 
  Trash2, 
  Shield, 
  Crown,
  History,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  client: {
    name: string;
  };
}

interface SystemPrompt {
  id: string;
  project_id: string;
  prompt_name: string;
  prompt_content: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  user?: {
    email: string;
    full_name?: string;
  };
}

export function SystemPromptEditor() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    prompt_name: '',
    prompt_content: ''
  });
  const [previewPrompt, setPreviewPrompt] = useState<SystemPrompt | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    checkUserAccess();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.email === 'vladtzadik@gmail.com') {
      loadProjects();
      loadSystemPrompts();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectPrompts();
    }
  }, [selectedProjectId]);

  const checkUserAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Access denied",
        description: "Please log in to access this feature",
        variant: "destructive"
      });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setCurrentUser(profile);
    setLoading(false);
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        clients(name)
      `)
      .eq('status', 'active')
      .order('name');

    if (error) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setProjects(data?.map(p => ({
      ...p,
      client: p.clients || { name: 'Unknown' }
    })) || []);
  };

  const loadSystemPrompts = async () => {
    const { data, error } = await supabase
      .from('project_system_prompts')
      .select(`
        *,
        projects(id, name, description, status, clients(name)),
        profiles:created_by(email, full_name)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading system prompts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setPrompts(data?.map(p => ({
      ...p,
      project: p.projects ? {
        ...p.projects,
        client: p.projects.clients || { name: 'Unknown' }
      } : undefined,
      user: p.profiles
    })) || []);
  };

  const loadProjectPrompts = async () => {
    const { data, error } = await supabase
      .from('project_system_prompts')
      .select(`
        *,
        profiles:created_by(email, full_name)
      `)
      .eq('project_id', selectedProjectId)
      .order('version', { ascending: false });

    if (error) {
      toast({
        title: "Error loading project prompts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const projectPrompts = data?.map(p => ({
      ...p,
      user: p.profiles
    })) || [];

    setPrompts(prev => [
      ...prev.filter(p => p.project_id !== selectedProjectId),
      ...projectPrompts
    ]);
  };

  const createPrompt = async () => {
    if (!selectedProjectId || !newPrompt.prompt_name.trim() || !newPrompt.prompt_content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please select a project and fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Get next version number
    const existingPrompts = prompts.filter(p => p.project_id === selectedProjectId);
    const nextVersion = existingPrompts.length > 0 
      ? Math.max(...existingPrompts.map(p => p.version)) + 1 
      : 1;

    const { data, error } = await supabase
      .from('project_system_prompts')
      .insert({
        project_id: selectedProjectId,
        prompt_name: newPrompt.prompt_name,
        prompt_content: newPrompt.prompt_content,
        version: nextVersion,
        is_active: true,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating prompt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Deactivate other prompts for this project
    await supabase
      .from('project_system_prompts')
      .update({ is_active: false })
      .eq('project_id', selectedProjectId)
      .neq('id', data.id);

    toast({
      title: "System prompt created",
      description: `Version ${nextVersion} has been created and activated`
    });

    setNewPrompt({ prompt_name: '', prompt_content: '' });
    setShowNewForm(false);
    loadSystemPrompts();
  };

  const updatePrompt = async () => {
    if (!editingPrompt) return;

    const { error } = await supabase
      .from('project_system_prompts')
      .update({
        prompt_name: editingPrompt.prompt_name,
        prompt_content: editingPrompt.prompt_content
      })
      .eq('id', editingPrompt.id);

    if (error) {
      toast({
        title: "Error updating prompt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "System prompt updated",
      description: "Changes have been saved successfully"
    });

    setEditingPrompt(null);
    loadSystemPrompts();
  };

  const activatePrompt = async (promptId: string, projectId: string) => {
    // Deactivate all prompts for this project
    await supabase
      .from('project_system_prompts')
      .update({ is_active: false })
      .eq('project_id', projectId);

    // Activate the selected prompt
    const { error } = await supabase
      .from('project_system_prompts')
      .update({ is_active: true })
      .eq('id', promptId);

    if (error) {
      toast({
        title: "Error activating prompt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Prompt activated",
      description: "This version is now active for the project"
    });

    loadSystemPrompts();
  };

  const deletePrompt = async (promptId: string) => {
    const { error } = await supabase
      .from('project_system_prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "System prompt deleted",
      description: "Prompt has been removed successfully"
    });

    loadSystemPrompts();
  };

  const duplicatePrompt = async (prompt: SystemPrompt) => {
    const nextVersion = Math.max(...prompts.filter(p => p.project_id === prompt.project_id).map(p => p.version)) + 1;

    const { error } = await supabase
      .from('project_system_prompts')
      .insert({
        project_id: prompt.project_id,
        prompt_name: `${prompt.prompt_name} (Copy)`,
        prompt_content: prompt.prompt_content,
        version: nextVersion,
        is_active: false,
        created_by: currentUser.id
      });

    if (error) {
      toast({
        title: "Error duplicating prompt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Prompt duplicated",
      description: `Version ${nextVersion} created as copy`
    });

    loadSystemPrompts();
  };

  const exportPrompt = (prompt: SystemPrompt) => {
    const exportData = {
      project: prompt.project?.name,
      prompt_name: prompt.prompt_name,
      prompt_content: prompt.prompt_content,
      version: prompt.version,
      created_at: prompt.created_at,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-prompt-${prompt.project?.name}-v${prompt.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check if user is CEO
  if (currentUser && currentUser.email !== 'vladtzadik@gmail.com') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold">System Prompt Editor</h2>
            <p className="text-muted-foreground">CEO-only access required</p>
          </div>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This feature is restricted to CEO access only. Contact Vlad if you need system prompt changes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const projectPrompts = prompts.filter(p => !selectedProjectId || p.project_id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              System Prompt Editor
              <Crown className="h-5 w-5 text-yellow-500" />
            </h2>
            <p className="text-muted-foreground">Manage AI system prompts per project</p>
          </div>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {/* Project filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} ({project.client.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Create new prompt form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create System Prompt</CardTitle>
            <CardDescription>Add a new system prompt for a project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prompt-project">Project *</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prompt-name">Prompt Name *</Label>
                <Input
                  id="prompt-name"
                  placeholder="e.g., Lead Qualification Assistant"
                  value={newPrompt.prompt_name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prompt-content">System Prompt Content *</Label>
              <Textarea
                id="prompt-content"
                placeholder="Enter the system prompt instructions..."
                className="min-h-[200px] font-mono"
                value={newPrompt.prompt_content}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt_content: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                This will be used as the system prompt for AI interactions in this project.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={createPrompt}>
                <Save className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts table */}
      <Card>
        <CardHeader>
          <CardTitle>
            System Prompts ({projectPrompts.length})
            {selectedProjectId && (
              <Badge variant="outline" className="ml-2">
                {projects.find(p => p.id === selectedProjectId)?.name}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage AI system prompts with version control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectPrompts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No system prompts found. Create your first prompt above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Prompt Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectPrompts.map(prompt => (
                  <TableRow key={prompt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prompt.project?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {prompt.project?.client.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{prompt.prompt_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{prompt.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                        {prompt.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {prompt.user?.full_name || prompt.user?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setPreviewPrompt(prompt)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{prompt.prompt_name} (v{prompt.version})</DialogTitle>
                              <DialogDescription>
                                {prompt.project?.name} - {prompt.project?.client.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>System Prompt Content:</Label>
                                <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm whitespace-pre-wrap">
                                  {prompt.prompt_content}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingPrompt(prompt)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {!prompt.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => activatePrompt(prompt.id, prompt.project_id)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => duplicatePrompt(prompt)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => exportPrompt(prompt)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => deletePrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit prompt dialog */}
      {editingPrompt && (
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit System Prompt</DialogTitle>
              <DialogDescription>
                {editingPrompt.project?.name} - Version {editingPrompt.version}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Prompt Name</Label>
                <Input
                  id="edit-name"
                  value={editingPrompt.prompt_name}
                  onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, prompt_name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">System Prompt Content</Label>
                <Textarea
                  id="edit-content"
                  className="min-h-[300px] font-mono"
                  value={editingPrompt.prompt_content}
                  onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, prompt_content: e.target.value } : null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updatePrompt}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 