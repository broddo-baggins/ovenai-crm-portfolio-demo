import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Clock, Users, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { simpleProjectService } from '@/services/simpleProjectService';
import { LeadProcessingService } from '@/services/leadProcessingService';
import { useLang } from '@/hooks/useLang';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QueueStatus {
  totalLeads: number;
  pendingLeads: number;
  queuedLeads: number;
  activeLeads: number;
  completedLeads: number;
  failedLeads: number;
  activeConversations: number;
  processingRate: number;
  queueHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export const QueueStatusWidget: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL, textStart, flexRowReverse } = useLang();
  
  const [status, setStatus] = useState<QueueStatus>({
    totalLeads: 0,
    pendingLeads: 0,
    queuedLeads: 0,
    activeLeads: 0,
    completedLeads: 0,
    failedLeads: 0,
    activeConversations: 0,
    processingRate: 0,
    queueHealth: 'healthy',
    lastUpdated: new Date().toISOString(),
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadQueueStatus = async () => {
    try {
      // Get leads data
      const leads = await simpleProjectService.getAllLeads();
      const conversations = await simpleProjectService.getAllConversations();
      
      if (!leads) {
        throw new Error('Failed to load leads data');
      }

      // Count leads by processing state
      const pendingLeads = leads.filter(lead => lead.processing_state === 'pending').length;
      const queuedLeads = leads.filter(lead => lead.processing_state === 'queued').length;
      const activeLeads = leads.filter(lead => lead.processing_state === 'active').length;
      const completedLeads = leads.filter(lead => lead.processing_state === 'completed').length;
      const failedLeads = leads.filter(lead => lead.processing_state === 'failed').length;
      
      // Count active conversations more accurately
      const activeConversations = conversations?.filter(conv => {
        const isActive = conv.status === 'active' || 
                        conv.status === 'in_progress' ||
                        conv.status === 'ongoing';
        
        // Check if conversation has recent activity (last 7 days)
        if (conv.updated_at) {
          const lastActivity = new Date(conv.updated_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return isActive && lastActivity > weekAgo;
        }
        
        return isActive;
      }).length || 0;
      
      // Calculate processing rate
      const totalProcessed = completedLeads + failedLeads;
      const totalInQueue = pendingLeads + queuedLeads + activeLeads;
      const processingRate = totalProcessed + totalInQueue > 0 ? 
        (totalProcessed / (totalProcessed + totalInQueue)) * 100 : 0;
      
      // Determine queue health
      let queueHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (pendingLeads > 100) {
        queueHealth = 'critical';
      } else if (pendingLeads > 50) {
        queueHealth = 'warning';
      }
      
      setStatus({
        totalLeads: leads.length,
        pendingLeads,
        queuedLeads,
        activeLeads,
        completedLeads,
        failedLeads,
        activeConversations,
        processingRate: Math.round(processingRate * 10) / 10,
        queueHealth,
        lastUpdated: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error loading queue status:', error);
      toast.error('Failed to load queue status');
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadQueueStatus();
    toast.success('Queue status refreshed');
  };

  useEffect(() => {
    loadQueueStatus();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadQueueStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (isLoading && status.totalLeads === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={cn('flex items-center gap-2', flexRowReverse())}>
            <RefreshCw className="h-5 w-5 animate-spin" />
            {t('pages.queue.loadingStatus', 'Loading Queue Status...')}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className={cn('flex items-center justify-between', flexRowReverse())}>
          <CardTitle className={cn('flex items-center gap-2', flexRowReverse())}>
            <Users className="h-5 w-5" />
            {t('pages.queue.status', 'Queue Status')}
          </CardTitle>
          <div className={cn('flex items-center gap-2', flexRowReverse())}>
            <Badge 
              variant="outline" 
              className={cn('border', getHealthColor(status.queueHealth))}
            >
              {getHealthIcon(status.queueHealth)}
              <span className={cn(isRTL ? 'mr-1' : 'ml-1')}>
                {status.queueHealth.toUpperCase()}
              </span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{status.pendingLeads}</div>
            <div className="text-sm text-blue-600 font-medium">
              {t('pages.queue.pending', 'Pending')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{status.queuedLeads}</div>
            <div className="text-sm text-orange-600 font-medium">
              {t('pages.queue.queued', 'Queued')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{status.activeConversations}</div>
            <div className="text-sm text-green-600 font-medium">
              {t('pages.queue.activeChats', 'Active Chats')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{status.completedLeads}</div>
            <div className="text-sm text-purple-600 font-medium">
              {t('pages.queue.completed', 'Completed')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Processing Progress */}
        <div className="space-y-2">
          <div className={cn('flex justify-between items-center', flexRowReverse())}>
            <span className={cn('text-sm font-medium', textStart())}>
              {t('pages.queue.processingProgress', 'Processing Progress')}
            </span>
            <span className="text-sm text-muted-foreground">
              {status.processingRate}%
            </span>
          </div>
          <Progress value={status.processingRate} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className={cn('flex justify-between', flexRowReverse())}>
            <span className={textStart()}>{t('pages.queue.totalLeads', 'Total Leads')}:</span>
            <span className="font-medium">{status.totalLeads}</span>
          </div>
          <div className={cn('flex justify-between', flexRowReverse())}>
            <span className={textStart()}>{t('pages.queue.failed', 'Failed')}:</span>
            <span className="font-medium text-red-600">{status.failedLeads}</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className={cn('text-xs text-muted-foreground', textStart())}>
          {t('pages.queue.lastUpdated', 'Last updated')}: {' '}
          {lastRefresh.toLocaleTimeString(isRTL ? 'he-IL' : 'en-US')}
        </div>
      </CardContent>
    </Card>
  );
};

export default QueueStatusWidget; 