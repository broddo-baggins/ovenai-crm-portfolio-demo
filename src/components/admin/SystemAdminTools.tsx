import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Terminal, 
  Zap, 
  Settings, 
  Eye, 
  RefreshCw, 
  Download, 
  Upload,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Code,
  Key,
  Monitor,
  Server
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemAdminToolsProps {
  trigger?: React.ReactNode;
}

export function DatabaseConsoleDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    setLoading(true);
    try {
      // For safety, only allow SELECT queries in production
      const cleanQuery = sqlQuery.trim().toLowerCase();
      if (!cleanQuery.startsWith('select')) {
        toast.error('Only SELECT queries are allowed for security');
        return;
      }

      // TODO: Implement execute_sql RPC function in Supabase
      // For now, simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQueryResult({ 
        message: 'Query execution simulated', 
        note: 'Real execution requires implementing execute_sql RPC function in Supabase',
        query: sqlQuery
      });
      toast.success('Query simulation completed');
    } catch (error) {
      toast.error('Query execution failed');
      setQueryResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start">
      <Database className="w-4 h-4 mr-2" />
      Database Console Access
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Console
          </DialogTitle>
          <DialogDescription>
            Execute database queries and view results. Only SELECT queries are allowed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Safety Notice:</strong> Only SELECT queries are permitted. 
              Write, update, and delete operations are restricted for security.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="sql-query">SQL Query</Label>
            <Textarea
              id="sql-query"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM clients LIMIT 10;"
              className="h-32"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Query
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setSqlQuery('')}>
              Clear
            </Button>
          </div>

          {queryResult && (
            <div>
              <Label>Query Result</Label>
              <Card>
                <CardContent className="p-4">
                  {queryResult.error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {queryResult.error}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-64">
                      {JSON.stringify(queryResult, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function N8NWorkflowDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [workflows, setWorkflows] = useState([
    { id: 'wf-001', name: 'Lead Processing Pipeline', status: 'active', lastRun: '2 minutes ago' },
    { id: 'wf-002', name: 'WhatsApp Message Router', status: 'active', lastRun: '5 minutes ago' },
    { id: 'wf-003', name: 'Daily Analytics Report', status: 'paused', lastRun: '1 hour ago' }
  ]);

  const triggerWorkflow = async (workflowId: string) => {
    try {
      // In production, this would call the actual N8N API
      toast.success(`Workflow ${workflowId} triggered successfully`);
    } catch (error) {
      toast.error('Failed to trigger workflow');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start">
      <Zap className="w-4 h-4 mr-2" />
      N8N Workflow Management
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            N8N Workflow Management
          </DialogTitle>
          <DialogDescription>
            Monitor and manage automated workflows
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{workflow.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last run: {workflow.lastRun}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => triggerWorkflow(workflow.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EnvironmentConfigDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [envVars, setEnvVars] = useState([
    { key: 'VITE_SUPABASE_URL', value: 'https://your-project.supabase.co', masked: false },
    { key: 'VITE_SUPABASE_ANON_KEY', value: '***masked***', masked: true },
    { key: 'VITE_APP_URL', value: 'http://localhost:3000', masked: false },
    { key: 'VITE_ENVIRONMENT', value: 'development', masked: false }
  ]);

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start">
      <Settings className="w-4 h-4 mr-2" />
      Environment Config
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Configuration
          </DialogTitle>
          <DialogDescription>
            View and manage environment variables and system configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Sensitive values are masked for security. Changes require system restart.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {envVars.map((envVar, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{envVar.key}</Label>
                  <p className="text-sm text-muted-foreground">{envVar.value}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SystemAdminTools({ trigger }: SystemAdminToolsProps) {
  const [open, setOpen] = useState(false);
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    responseTime: '145ms',
    dbConnections: '27/100',
    queueStatus: 'Processing',
    lastBackup: '2 hours ago'
  });

  const defaultTrigger = (
    <Button>
      <Monitor className="w-4 h-4 mr-2" />
      System Admin Tools
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            System Administration Tools
          </DialogTitle>
          <DialogDescription>
            Comprehensive system management and monitoring tools
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-lg font-bold">{systemStats.uptime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Response Time</p>
                      <p className="text-lg font-bold">{systemStats.responseTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">DB Connections</p>
                      <p className="text-lg font-bold">{systemStats.dbConnections}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All systems operational. Last backup: {systemStats.lastBackup}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatabaseConsoleDialog />
              
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="w-4 h-4 mr-2" />
                Manual Backup
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Query Builder
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <N8NWorkflowDialog />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <EnvironmentConfigDialog />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 