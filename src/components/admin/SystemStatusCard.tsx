import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Shield, 
  Activity, 
  Zap, 
  Server,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getSystemInfo, 
  getDatabaseInfo, 
  getSecurityStatus,
  SystemInfo,
  DatabaseInfo,
  SecurityStatus
} from '@/services/mockAdminService';

export const SystemStatusCard: React.FC = () => {
  const systemInfo = getSystemInfo();
  const dbInfo = getDatabaseInfo();
  const securityStatus = getSecurityStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'demo':
      case 'demo_mode':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'inactive':
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'demo':
      case 'demo_mode':
        return <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'inactive':
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900 dark:text-orange-200">
          <strong>Portfolio Demo Mode:</strong> This admin center uses mock data for demonstration. 
          In production, this would be connected to Supabase with Row Level Security (RLS) and active webhooks.
        </AlertDescription>
      </Alert>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>System Overview</CardTitle>
          </div>
          <CardDescription>
            Current system status and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge className={getStatusColor(systemInfo.environment)}>
                {systemInfo.environment.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-sm font-medium">{systemInfo.version}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Database</p>
            <p className="text-sm font-medium">{systemInfo.database}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Backend</p>
            <p className="text-sm font-medium">{systemInfo.backend}</p>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Database Status</CardTitle>
          </div>
          <CardDescription>
            Connection and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(dbInfo.status)}
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge className={getStatusColor(dbInfo.status)}>
              {dbInfo.status === 'demo' ? 'Demo Mode' : dbInfo.status}
            </Badge>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-1">Type</p>
            <p className="text-sm font-medium">{dbInfo.type}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Host</p>
            <p className="text-sm font-mono text-xs">{dbInfo.host}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Database</p>
            <p className="text-sm font-mono text-xs">{dbInfo.database}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Connection Pool</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{dbInfo.connections.active} / {dbInfo.connections.max}</span>
              </div>
              <Progress value={(dbInfo.connections.active / dbInfo.connections.max) * 100} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              Connection pooling: {dbInfo.performance.connectionPool}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Query Time</p>
            <p className="text-sm font-medium">{dbInfo.performance.queryTime}ms</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Status</CardTitle>
          </div>
          <CardDescription>
            Row Level Security and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Row Level Security (RLS)</span>
            </div>
            <Badge className={getStatusColor(securityStatus.rlsEnabled ? 'active' : 'inactive')}>
              {securityStatus.rlsEnabled ? 'Enabled' : 'Demo Mode - Disabled'}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">RLS Policies (Production)</p>
            {securityStatus.rlsPolicies.map((policy) => (
              <div key={policy.name} className="flex items-start justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">{policy.name}</p>
                  <p className="text-xs text-muted-foreground">{policy.table}</p>
                  <p className="text-xs text-muted-foreground mt-1">{policy.description}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "ml-2 flex-shrink-0",
                    policy.enabled ? 'border-green-500 text-green-700' : 'border-gray-400 text-gray-600'
                  )}
                >
                  {policy.enabled ? 'Active' : 'Demo'}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">API Keys</p>
            {securityStatus.apiKeys.map((key) => (
              <div key={key.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(key.lastUsed).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(key.status)}>
                  {key.status}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Webhook Security (Production)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Signature Verify</p>
                <Badge variant="outline" className={cn(securityStatus.webhookSecurity.signatureVerification ? 'border-green-500' : 'border-gray-400')}>
                  {securityStatus.webhookSecurity.signatureVerification ? 'On' : 'Demo'}
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Rate Limiting</p>
                <Badge variant="outline" className={cn(securityStatus.webhookSecurity.rateLimiting ? 'border-green-500' : 'border-gray-400')}>
                  {securityStatus.webhookSecurity.rateLimiting ? 'On' : 'Demo'}
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">IP Whitelist</p>
                <Badge variant="outline" className={cn(securityStatus.webhookSecurity.ipWhitelist ? 'border-green-500' : 'border-gray-400')}>
                  {securityStatus.webhookSecurity.ipWhitelist ? 'On' : 'Demo'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Feature Status</CardTitle>
          </div>
          <CardDescription>
            System features and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {systemInfo.features.map((feature) => (
              <div key={feature.name} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(feature.status)}
                    <p className="text-sm font-medium">{feature.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Badge className={cn("ml-3 flex-shrink-0", getStatusColor(feature.status))}>
                  {feature.status === 'demo' ? 'Demo' : feature.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatusCard;

