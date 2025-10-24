import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Brain, 
  Database, 
  RefreshCw, 
  Search,
  Copy,
  Download,
  Eye,
  Settings,
  Zap,
  MessageSquare,
  Building2,
  FolderOpen,
  Code,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SystemPromptData {
  id: string;
  name: string;
  description: string | null;
  type: 'client' | 'project';
  client_id?: string;
  created_at: string;
  updated_at: string | null;
  parsed_data?: any;
}

interface SystemPromptViewerProps {
  className?: string;
}

export function SystemPromptViewer({ className }: SystemPromptViewerProps) {
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPromptData | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSystemPrompts();
  }, []);

  const loadSystemPrompts = async () => {
    try {
      setLoading(true);
      
      // Load clients with descriptions using raw queries to avoid type complexity
      const { data: clientsData, error: clientsError }: { data: any[] | null; error: any } = await supabase
        .from('clients')
        .select('*');

      // Load projects with descriptions
      const { data: projectsData, error: projectsError }: { data: any[] | null; error: any } = await supabase
        .from('projects')
        .select('*');

      // Filter data with descriptions on the client side
      const filteredClientsData = (clientsData || []).filter((client: any) => 
        client.description && client.description.trim() !== ''
      );
      
      const filteredProjectsData = (projectsData || []).filter((project: any) => 
        project.description && project.description.trim() !== ''
      );

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
        toast({
          title: "Error Loading Clients",
          description: clientsError.message,
          variant: "destructive"
        });
      }

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        toast({
          title: "Error Loading Projects", 
          description: projectsError.message,
          variant: "destructive"
        });
      }

      // Combine and format data
      const combinedData: SystemPromptData[] = [
        ...filteredClientsData.map((client: any) => ({
          id: client.id,
          name: client.name,
          description: client.description || null,
          type: 'client' as const,
          created_at: client.created_at,
          updated_at: client.updated_at || null,
          parsed_data: tryParseJSON(client.description)
        })),
        ...filteredProjectsData.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || null,
          type: 'project' as const,
          client_id: project.client_id,
          created_at: project.created_at,
          updated_at: project.updated_at || null,
          parsed_data: tryParseJSON(project.description)
        }))
      ];

      setSystemPrompts(combinedData);
      
      toast({
        title: "System Prompts Loaded",
        description: `Found ${combinedData.length} system prompts (${filteredClientsData.length} clients, ${filteredProjectsData.length} projects)`
      });

    } catch (error) {
      console.error('Error loading system prompts:', error);
      toast({
        title: "Error Loading System Prompts",
        description: "Failed to load system prompt data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const tryParseJSON = (text: string | null): any => {
    if (!text) return null;
    
    try {
      // Try to parse as JSON
      return JSON.parse(text);
    } catch {
      // If not JSON, try to extract structured data
      const sections = extractSections(text);
      return sections.length > 0 ? sections : null;
    }
  };

  const extractSections = (text: string): any[] => {
    if (!text) return [];
    
    const sections = [];
    
    // Look for common section patterns
    const patterns = [
      /(?:^|\n)#{1,3}\s*([^\n]+)/g,  // Markdown headers
      /(?:^|\n)(\d+\.\s+[^\n]+)/g,   // Numbered lists  
      /(?:^|\n)([A-Z][^.]+:)/g,     // Key: Value patterns
      /(?:^|\n)(-\s+[^\n]+)/g        // Bullet points
    ];
    
    patterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        sections.push({
          type: ['headers', 'numbered', 'keyvalue', 'bullets'][index],
          items: matches.map(match => match[1]?.trim()).filter(Boolean)
        });
      }
    });
    
    return sections;
  };

  const filteredPrompts = systemPrompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "System prompt content copied successfully"
    });
  };

  const exportPrompt = (prompt: SystemPromptData) => {
    const exportData = {
      name: prompt.name,
      type: prompt.type,
      description: prompt.description,
      parsed_data: prompt.parsed_data,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-prompt-${prompt.type}-${prompt.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPromptContent = (prompt: SystemPromptData) => {
    if (!prompt.description) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>No description content available</AlertDescription>
        </Alert>
      );
    }

    if (showRawData) {
      return (
        <div className="space-y-4">
          <Label>Raw Content</Label>
          <Textarea
            value={prompt.description}
            readOnly
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      );
    }

    // Show parsed data if available
    if (prompt.parsed_data) {
      if (Array.isArray(prompt.parsed_data)) {
        return (
          <div className="space-y-4">
            {prompt.parsed_data.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{section.type} Section</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {section.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      } else {
        return (
          <div className="space-y-4">
            <Label>Parsed JSON Data</Label>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(prompt.parsed_data, null, 2)}
            </pre>
          </div>
        );
      }
    }

    // Show formatted text
    return (
      <div className="space-y-4">
        <Label>System Prompt Content</Label>
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm whitespace-pre-wrap">{prompt.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            System Prompt Presentation
          </h2>
          <p className="text-muted-foreground">
            View and analyze system prompts from client and project descriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {systemPrompts.length} Prompts
          </Badge>
          <Button variant="outline" size="sm" onClick={loadSystemPrompts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Prompts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemPrompts.filter(p => p.type === 'client').length}
            </div>
            <p className="text-xs text-muted-foreground">
              System prompts from client descriptions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Prompts</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemPrompts.filter(p => p.type === 'project').length}
            </div>
            <p className="text-xs text-muted-foreground">
              System prompts from project descriptions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parsed Data</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemPrompts.filter(p => p.parsed_data).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prompts with structured data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search system prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompts List */}
        <Card>
          <CardHeader>
            <CardTitle>System Prompts</CardTitle>
            <CardDescription>
              Click on a prompt to view its content and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>No system prompts found</p>
                  </div>
                ) : (
                  filteredPrompts.map((prompt) => (
                    <Card 
                      key={`${prompt.type}-${prompt.id}`}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedPrompt?.id === prompt.id && selectedPrompt?.type === prompt.type 
                          ? 'border-primary bg-muted/30' 
                          : ''
                      }`}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {prompt.type === 'client' ? (
                                <Building2 className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FolderOpen className="h-4 w-4 text-green-500" />
                              )}
                              <h4 className="font-medium text-sm">{prompt.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {prompt.description?.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={prompt.type === 'client' ? 'default' : 'secondary'} className="text-xs">
                              {prompt.type}
                            </Badge>
                            {prompt.parsed_data && (
                              <Badge variant="outline" className="text-xs">
                                <Code className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Prompt Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedPrompt ? `${selectedPrompt.name} Details` : 'Select a Prompt'}
                </CardTitle>
                <CardDescription>
                  {selectedPrompt 
                    ? `${selectedPrompt.type} system prompt content and analysis`
                    : 'Choose a system prompt to view its content'
                  }
                </CardDescription>
              </div>
              {selectedPrompt && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showRawData ? 'Parsed' : 'Raw'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedPrompt.description || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPrompt(selectedPrompt)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {selectedPrompt ? (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <p className="text-sm font-medium capitalize">{selectedPrompt.type}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Created</Label>
                      <p className="text-sm">{new Date(selectedPrompt.created_at).toLocaleDateString()}</p>
                    </div>
                                         <div>
                       <Label className="text-xs">Updated</Label>
                       <p className="text-sm">
                         {selectedPrompt.updated_at 
                           ? new Date(selectedPrompt.updated_at).toLocaleDateString()
                           : 'N/A'
                         }
                       </p>
                     </div>
                    <div>
                      <Label className="text-xs">Has Parsed Data</Label>
                      <p className="text-sm flex items-center gap-1">
                        {selectedPrompt.parsed_data ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Yes
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            No
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Content */}
                  {renderPromptContent(selectedPrompt)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a system prompt to view its content</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 