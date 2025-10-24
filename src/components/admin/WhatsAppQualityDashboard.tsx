import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageCircle,
  BarChart3,
  RefreshCw,
  Zap,
  Globe,
  Phone,
  AlertCircle,
  Star,
  Timer
} from 'lucide-react';
import WhatsAppMonitoringInit from '@/services/whatsapp-monitoring-init';
import { cn } from '@/lib/utils';

interface DashboardData {
  qualityMetrics: {
    currentMetrics: any;
    historicalMetrics: any[];
    alerts: any[];
    complianceStatus: string;
  };
  uptimeMetrics: {
    overall_uptime_percentage: number;
    whatsapp_api_uptime: number;
    webhook_uptime: number;
    business_api_uptime: number;
    average_response_time_ms: number;
    total_checks_24h: number;
    failed_checks_24h: number;
    current_status: 'all_up' | 'partial_down' | 'all_down';
    last_updated: string;
  };
  alerts: any[];
  compliance: string;
}

interface MetricCard {
  title: string;
  value: number | string;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description: string;
}

export function WhatsAppQualityDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await WhatsAppMonitoringInit.getDashboardData();
      setDashboardData(data);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Failed to load WhatsApp quality metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize monitoring
  const initializeMonitoring = async () => {
    try {
      await WhatsAppMonitoringInit.initialize();
      toast({
        title: "Monitoring initialized",
        description: "WhatsApp monitoring system is now active",
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      toast({
        title: "Error initializing monitoring",
        description: "Failed to start WhatsApp monitoring system",
        variant: "destructive"
      });
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'compliant':
      case 'healthy':
      case 'all_up':
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'degraded':
      case 'partial_down':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'violation':
      case 'down':
      case 'all_down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'compliant':
      case 'healthy':
      case 'all_up':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
      case 'degraded':
      case 'partial_down':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
      case 'violation':
      case 'down':
      case 'all_down':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Format uptime percentage
  const formatUptime = (percentage: number) => {
    if (percentage >= 99.5) return { value: percentage.toFixed(2), status: 'good' };
    if (percentage >= 95) return { value: percentage.toFixed(2), status: 'warning' };
    return { value: percentage.toFixed(2), status: 'critical' };
  };

  // Format response time
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return { value: `${ms}ms`, status: 'good' };
    if (ms < 3000) return { value: `${(ms/1000).toFixed(1)}s`, status: 'warning' };
    return { value: `${(ms/1000).toFixed(1)}s`, status: 'critical' };
  };

  // Get quality rating color
  const getQualityRatingColor = (rating: string) => {
    switch (rating) {
      case 'GREEN': return 'text-green-600 bg-green-50';
      case 'YELLOW': return 'text-yellow-600 bg-yellow-50';
      case 'RED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-gray-600">Loading WhatsApp quality metrics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            WhatsApp Quality Dashboard
          </CardTitle>
          <CardDescription>
            Monitor WhatsApp Business API performance and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Monitoring system not initialized</p>
            <Button onClick={initializeMonitoring}>
              <Zap className="h-4 w-4 mr-2" />
              Initialize Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { qualityMetrics, uptimeMetrics, alerts, compliance } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp Quality Dashboard</h2>
          <p className="text-gray-600">Meta App Provider Compliance Monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-center gap-2 p-3 rounded-lg", getStatusColor(compliance))}>
              {getStatusIcon(compliance)}
              <span className="font-medium capitalize">{compliance}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quality Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-center gap-2 p-3 rounded-lg", getQualityRatingColor(qualityMetrics.currentMetrics?.quality_rating))}>
              <Star className="h-5 w-5" />
              <span className="font-medium">{qualityMetrics.currentMetrics?.quality_rating || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Uptime Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-center gap-2 p-3 rounded-lg", getStatusColor(uptimeMetrics.current_status))}>
              {getStatusIcon(uptimeMetrics.current_status)}
              <span className="font-medium capitalize">{uptimeMetrics.current_status.replace('_', ' ')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Message Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {qualityMetrics.currentMetrics?.message_delivery_rate?.toFixed(1) || 0}%
                </span>
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <Progress value={qualityMetrics.currentMetrics?.message_delivery_rate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Messages Sent (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {qualityMetrics.currentMetrics?.messages_sent_last_24h || 0}
                </span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Last 24 hours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Webhook Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {qualityMetrics.currentMetrics?.webhook_success_rate?.toFixed(1) || 0}%
                </span>
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <Progress value={qualityMetrics.currentMetrics?.webhook_success_rate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatResponseTime(qualityMetrics.currentMetrics?.api_response_time_ms || 0).value}
                </span>
                <Timer className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Average response time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime Details */}
      <Card>
        <CardHeader>
          <CardTitle>Uptime Monitoring</CardTitle>
          <CardDescription>System availability and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WhatsApp API</span>
                <Badge variant={formatUptime(uptimeMetrics.whatsapp_api_uptime).status === 'good' ? 'default' : 'destructive'}>
                  {formatUptime(uptimeMetrics.whatsapp_api_uptime).value}%
                </Badge>
              </div>
              <Progress value={uptimeMetrics.whatsapp_api_uptime} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Webhook Endpoint</span>
                <Badge variant={formatUptime(uptimeMetrics.webhook_uptime).status === 'good' ? 'default' : 'destructive'}>
                  {formatUptime(uptimeMetrics.webhook_uptime).value}%
                </Badge>
              </div>
              <Progress value={uptimeMetrics.webhook_uptime} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Business API</span>
                <Badge variant={formatUptime(uptimeMetrics.business_api_uptime).status === 'good' ? 'default' : 'destructive'}>
                  {formatUptime(uptimeMetrics.business_api_uptime).value}%
                </Badge>
              </div>
              <Progress value={uptimeMetrics.business_api_uptime} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>Recent monitoring alerts and violations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <Alert key={index} className="border-l-4 border-l-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{alert.context?.alert_message || alert.action}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.context?.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.context?.severity || 'medium'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Compliance Status</CardTitle>
          <CardDescription>Detailed compliance metrics for Meta App Provider review</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Quality Score</span>
                  <div className="flex items-center gap-2">
                    <Progress value={qualityMetrics.currentMetrics?.quality_score || 0} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{qualityMetrics.currentMetrics?.quality_score || 0}/100</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Message Failure Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={qualityMetrics.currentMetrics?.message_failure_rate || 0} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{qualityMetrics.currentMetrics?.message_failure_rate?.toFixed(1) || 0}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Template Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{qualityMetrics.currentMetrics?.template_usage_count || 0} templates used</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">System Uptime</span>
                  <div className="flex items-center gap-2">
                    <Progress value={uptimeMetrics.overall_uptime_percentage} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{uptimeMetrics.overall_uptime_percentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="violations" className="mt-4">
              <div className="space-y-2">
                {qualityMetrics.currentMetrics?.compliance_issues?.length > 0 ? (
                  qualityMetrics.currentMetrics.compliance_issues.map((issue: string, index: number) => (
                    <Alert key={index} className="border-l-4 border-l-red-500">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No compliance violations detected</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="recommendations" className="mt-4">
              <div className="space-y-2">
                <Alert className="border-l-4 border-l-blue-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Maintain message delivery rate above 95% for optimal quality rating
                  </AlertDescription>
                </Alert>
                <Alert className="border-l-4 border-l-blue-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keep webhook response times under 5 seconds for better performance
                  </AlertDescription>
                </Alert>
                <Alert className="border-l-4 border-l-blue-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Monitor system uptime to ensure 99.9% availability target
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 