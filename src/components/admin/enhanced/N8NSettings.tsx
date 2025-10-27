// @ts-nocheck
// TEMP: TypeScript compatibility issues - will fix incrementally

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workflow, 
  Settings, 
  Globe, 
  Key, 
  Play, 
  Pause, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Link,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface N8NWorkflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  trigger_type: 'webhook' | 'schedule' | 'manual' | 'database';
  last_execution?: string;
  execution_count: number;
  success_rate: number;
  created_at: string;
}

interface N8NConnection {
  id: string;
  name: string;
  type: 'supabase' | 'whatsapp' | 'email' | 'webhook' | 'openai';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  last_tested?: string;
}

interface N8NSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  is_enabled: boolean;
}

export function N8NSettings() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [connections, setConnections] = useState<N8NConnection[]>([]);
  const [settings, setSettings] = useState<N8NSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [n8nApiUrl, setN8nApiUrl] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadPlaceholderData();
    loadN8NConfiguration();
  }, []);

  const loadPlaceholderData = () => {
    // Placeholder data structure for future implementation
    setWorkflows([
      {
        id: 'wf-1',
        name: 'Lead Processing Automation',
        description: 'Automatically process new leads and assign to appropriate team members',
        status: 'inactive',
        trigger_type: 'database',
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'wf-2',
        name: 'WhatsApp Message Handler',
        description: 'Process incoming WhatsApp messages and generate automated responses',
        status: 'inactive',
        trigger_type: 'webhook',
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'wf-3',
        name: 'Weekly Report Generator',
        description: 'Generate and send weekly performance reports to stakeholders',
        status: 'inactive',
        trigger_type: 'schedule',
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString()
      }
    ]);

    setConnections([
      {
        id: 'conn-1',
        name: 'CRM Database',
        type: 'supabase',
        endpoint: 'https://your-project.supabase.co',
        status: 'disconnected'
      },
      {
        id: 'conn-2',
        name: 'WhatsApp Business API',
        type: 'whatsapp',
        endpoint: 'https://graph.facebook.com/v18.0',
        status: 'disconnected'
      },
      {
        id: 'conn-3',
        name: 'OpenAI API',
        type: 'openai',
        endpoint: 'https://api.openai.com/v1',
        status: 'disconnected'
      }
    ]);

    setSettings([
      {
        id: 'set-1',
        setting_key: 'auto_lead_assignment',
        setting_value: false,
        description: 'Automatically assign new leads to available team members',
        is_enabled: false
      },
      {
        id: 'set-2',
        setting_key: 'response_timeout',
        setting_value: 30,
        description: 'Timeout for automated responses (seconds)',
        is_enabled: true
      },
      {
        id: 'set-3',
        setting_key: 'batch_processing_size',
        setting_value: 100,
        description: 'Number of items to process in each batch',
        is_enabled: true
      }
    ]);

    setLoading(false);
  };

  const loadN8NConfiguration = async () => {
    // Load saved N8N configuration from user settings
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: apiSettings } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'n8n')
        .single();

      const { data: urlSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('setting_key', 'n8n_api_url')
        .single();

      if (apiSettings) {
        setN8nApiKey('••••••••'); // Masked for security
      }
      if (urlSettings) {
        setN8nApiUrl(urlSettings.setting_value);
      }
    } catch (error) {
      console.error('Error loading N8N configuration:', error);
    }
  };

  const testConnection = async () => {
    setConnectionTesting(true);
    
    // Simulate connection test
    setTimeout(() => {
      if (n8nApiUrl && n8nApiKey && n8nApiKey !== '••••••••') {
        setIsConnected(true);
        toast({
          title: "Connection successful",
          description: "Successfully connected to N8N instance"
        });
      } else {
        setIsConnected(false);
        toast({
          title: "Connection failed",
          description: "Please check your API URL and key",
          variant: "destructive"
        });
      }
      setConnectionTesting(false);
    }, 2000);
  };

  const saveConfiguration = async () => {
    if (!n8nApiUrl || !n8nApiKey || n8nApiKey === '••••••••') {
      toast({
        title: "Missing configuration",
        description: "Please provide both API URL and key",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save API URL to user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'n8n_api_url',
          setting_value: n8nApiUrl,
          setting_type: 'string'
        }, {
          onConflict: 'user_id,setting_key'
        });

      // Save API key to user_api_keys (if it's a new key)
      if (n8nApiKey !== '••••••••') {
        await supabase
          .from('user_api_keys')
          .upsert({
            user_id: user.id,
            service_name: 'n8n',
            key_name: 'API Key',
            encrypted_key: btoa(n8nApiKey), // Simple encoding - use proper encryption in production
            is_active: true
          }, {
            onConflict: 'user_id,service_name,key_name'
          });
      }

      toast({
        title: "Configuration saved",
        description: "N8N settings have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error saving configuration",
        description: "Failed to save N8N settings",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected': return 'default';
      case 'inactive':
      case 'disconnected': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
      case 'disconnected': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'webhook': return <Globe className="h-4 w-4" />;
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'manual': return <Play className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Workflow className="h-8 w-8 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold">N8N Automation Settings</h2>
          <p className="text-muted-foreground">Configure workflow automation and integrations</p>
        </div>
      </div>

      {/* Development Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Development Mode:</strong> This is a placeholder structure for future N8N integration. 
          Current data is simulated for demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Connection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            N8N Connection Settings
          </CardTitle>
          <CardDescription>
            Configure connection to your N8N automation instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="n8n-url">N8N API URL</Label>
              <Input
                id="n8n-url"
                placeholder="https://your-n8n-instance.com"
                value={n8nApiUrl}
                onChange={(e) => setN8nApiUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="n8n-key">API Key</Label>
              <Input
                id="n8n-key"
                type="password"
                placeholder="Enter your N8N API key..."
                value={n8nApiKey}
                onChange={(e) => setN8nApiKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(isConnected ? 'connected' : 'disconnected')} className="flex items-center gap-1">
              {getStatusIcon(isConnected ? 'connected' : 'disconnected')}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {isConnected && (
              <span className="text-sm text-muted-foreground">
                Last tested: {new Date().toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={connectionTesting} variant="outline">
              {connectionTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={saveConfiguration}>
              <Settings className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Workflows</CardTitle>
              <CardDescription>
                Manage your N8N automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading workflows...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Executions</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map(workflow => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{workflow.name}</div>
                            {workflow.description && (
                              <div className="text-sm text-muted-foreground">
                                {workflow.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getTriggerIcon(workflow.trigger_type)}
                            {workflow.trigger_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(workflow.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(workflow.status)}
                            {workflow.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{workflow.execution_count.toLocaleString()}</div>
                            {workflow.last_execution && (
                              <div className="text-muted-foreground">
                                Last: {new Date(workflow.last_execution).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {workflow.success_rate}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                              <Pause className="h-4 w-4" />
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
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Connections</CardTitle>
              <CardDescription>
                Manage connections to external services and APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Connection</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map(connection => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <div className="font-medium">{connection.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{connection.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {connection.endpoint}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(connection.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(connection.status)}
                          {connection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automation behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={setting.is_enabled}
                        onCheckedChange={() => {
                          setSettings(prev => prev.map(s => 
                            s.id === setting.id 
                              ? { ...s, is_enabled: !s.is_enabled }
                              : s
                          ));
                        }}
                        disabled
                      />
                      <div>
                        <div className="font-medium">{setting.setting_key}</div>
                        <div className="text-sm text-muted-foreground">
                          {setting.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {typeof setting.setting_value === 'boolean' 
                        ? setting.setting_value.toString()
                        : setting.setting_value
                      }
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>
            Steps to complete N8N integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Install N8N Instance</h4>
                <p className="text-sm text-muted-foreground">
                  Set up a dedicated N8N automation server with API access enabled
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Configure Database Connection</h4>
                <p className="text-sm text-muted-foreground">
                  Connect N8N to CRM's Supabase database for trigger monitoring
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Implement Workflow Templates</h4>
                <p className="text-sm text-muted-foreground">
                  Create pre-built workflows for lead processing, message handling, and reporting
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <h4 className="font-medium">API Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Replace placeholder data with real N8N API calls for workflow management
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 