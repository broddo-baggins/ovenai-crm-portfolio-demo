/**
 * Queue Management Dashboard Component
 * Main interface for managing WhatsApp message queue with real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Play, Pause, RotateCcw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// ShadCN UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
import { 
  QueueItem,
  QueueFilters,
  QueueStatus,
  QueuePriority,
  QueueStatusSummary,
  BulkQueueOperation,
  QueueManagementProps
} from '@/types/queue';

// Services
import { businessRulesEngine } from '@/services/queue/businessRulesEngine';
import { cn } from '@/lib/utils';

// Mock data for development
const mockQueueData: QueueItem[] = [
  {
    id: '1',
    lead_id: 'lead-1',
    client_id: 'client-1',
    user_id: 'user-1',
    status: 'pending',
    priority: 'high',
    scheduled_for: new Date(Date.now() + 60000).toISOString(),
    queued_at: new Date().toISOString(),
    message_template: 'Hello {{name}}, interested in our services?',
    message_variables: { name: 'John Doe' },
    attempts: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 'lead-1',
      name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      temperature: 'hot',
      score: 85
    }
  },
  {
    id: '2',
    lead_id: 'lead-2',
    client_id: 'client-1',
    user_id: 'user-1',
    status: 'processing',
    priority: 'normal',
    scheduled_for: new Date(Date.now() + 120000).toISOString(),
    queued_at: new Date(Date.now() - 30000).toISOString(),
    message_template: 'Hi {{name}}, follow up on our conversation',
    message_variables: { name: 'Jane Smith' },
    attempts: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 'lead-2',
      name: 'Jane Smith',
      phone: '+1234567891',
      email: 'jane@example.com',
      temperature: 'warm',
      score: 70
    }
  }
];

const QueueManagementDashboard: React.FC<QueueManagementProps> = ({
  initialFilters = {},
  onSelectionChange,
  maxHeight = '600px'
}) => {
  const { t } = useTranslation();
  const [queueData, setQueueData] = useState<QueueItem[]>(mockQueueData);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueueFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('queue');

  // Queue status summary
  const statusSummary: QueueStatusSummary = {
    depth: queueData.filter(item => item.status === 'pending').length,
    processing: queueData.filter(item => item.status === 'processing').length,
    completed: queueData.filter(item => item.status === 'sent').length,
    failed: queueData.filter(item => item.status === 'failed').length,
    successRate: 92.5,
    averageProcessingTime: 2.3
  };

  // Status badge styling with proper ShadCN variants
  const getStatusBadge = (status: QueueStatus) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: t('queue.status.pending'), className: "bg-blue-100 text-blue-800 border-blue-200" },
      queued: { variant: 'outline' as const, icon: Clock, label: t('queue.status.queued'), className: "bg-orange-100 text-orange-800 border-orange-200" },
      processing: { variant: 'default' as const, icon: Play, label: t('queue.status.processing'), className: "bg-green-100 text-green-800 border-green-200" },
      sent: { variant: 'default' as const, icon: CheckCircle, label: t('queue.status.sent'), className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      failed: { variant: 'destructive' as const, icon: XCircle, label: t('queue.status.failed'), className: "bg-red-100 text-red-800 border-red-200" },
      cancelled: { variant: 'secondary' as const, icon: XCircle, label: t('queue.status.cancelled'), className: "bg-gray-100 text-gray-800 border-gray-200" }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn("flex items-center gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Priority badge styling with proper ShadCN colors
  const getPriorityBadge = (priority: QueuePriority) => {
    const priorityConfig = {
      low: { variant: 'secondary' as const, label: t('queue.priority.low'), className: "bg-gray-100 text-gray-600 border-gray-200" },
      normal: { variant: 'outline' as const, label: t('queue.priority.normal'), className: "bg-blue-100 text-blue-700 border-blue-200" },
      high: { variant: 'default' as const, label: t('queue.priority.high'), className: "bg-orange-100 text-orange-700 border-orange-200" },
      immediate: { variant: 'destructive' as const, label: t('queue.priority.immediate'), className: "bg-red-100 text-red-700 border-red-200" }
    };

    const config = priorityConfig[priority];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  // Handle item selection
  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId);
    
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: BulkQueueOperation) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update queue data based on operation
      setQueueData(prev => prev.map(item => 
        selectedItems.includes(item.id)
          ? { ...item, status: operation.action === 'cancel' ? 'cancelled' : item.status }
          : item
      ));

      setSelectedItems([]);
      console.log(`Bulk operation ${operation.action} completed for ${selectedItems.length} items`);
    } catch (err) {
      setError(`Failed to ${operation.action} selected items`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter queue data
  const filteredQueueData = queueData.filter(item => {
    if (filters.status && !filters.status.includes(item.status)) return false;
    if (filters.priority && !filters.priority.includes(item.priority)) return false;
    if (filters.leadName && !item.lead?.name?.toLowerCase().includes(filters.leadName.toLowerCase())) return false;
    if (filters.phoneNumber && !item.lead?.phone?.includes(filters.phoneNumber)) return false;
    return true;
  });

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(prev => prev.map(item => {
        // Simulate status changes
        if (item.status === 'processing' && Math.random() > 0.7) {
          return { ...item, status: 'sent' as QueueStatus, processed_at: new Date().toISOString() };
        }
        return item;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6" style={{ maxHeight }}>
      {/* Header with Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('queue.metrics.depth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusSummary.depth}</div>
            <p className="text-xs text-muted-foreground">{t('queue.metrics.pending')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('queue.metrics.processing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusSummary.processing}</div>
            <p className="text-xs text-muted-foreground">{t('queue.metrics.active')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('queue.metrics.successRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusSummary.successRate}%</div>
            <Progress value={statusSummary.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('queue.metrics.avgTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusSummary.averageProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">{t('queue.metrics.perMessage')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">{t('queue.tabs.queue')}</TabsTrigger>
          <TabsTrigger value="settings">{t('queue.tabs.settings')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('queue.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">{t('queue.filters.search')}</Label>
              <Input
                id="search"
                placeholder={t('queue.filters.searchPlaceholder')}
                value={filters.leadName || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, leadName: e.target.value }))}
              />
                </div>
                
            <div className="space-y-2">
              <Label>{t('queue.filters.status')}</Label>
              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : [value as QueueStatus] 
                }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('queue.filters.all')}</SelectItem>
                  <SelectItem value="pending">{t('queue.status.pending')}</SelectItem>
                  <SelectItem value="processing">{t('queue.status.processing')}</SelectItem>
                  <SelectItem value="sent">{t('queue.status.sent')}</SelectItem>
                  <SelectItem value="failed">{t('queue.status.failed')}</SelectItem>
                </SelectContent>
              </Select>
                </div>
                
            <div className="space-y-2">
              <Label>{t('queue.filters.priority')}</Label>
              <Select
                value={filters.priority?.[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  priority: value === 'all' ? undefined : [value as QueuePriority] 
                }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('queue.filters.all')}</SelectItem>
                  <SelectItem value="immediate">{t('queue.priority.immediate')}</SelectItem>
                  <SelectItem value="high">{t('queue.priority.high')}</SelectItem>
                  <SelectItem value="normal">{t('queue.priority.normal')}</SelectItem>
                  <SelectItem value="low">{t('queue.priority.low')}</SelectItem>
                </SelectContent>
              </Select>
                </div>
          </div>

          {/* Bulk Operations */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {t('queue.bulk.selected', { count: selectedItems.length })}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation({ action: 'cancel', itemIds: selectedItems })}
                disabled={isLoading}
              >
                {t('queue.bulk.cancel')}
              </Button>
                <Button 
                  variant="outline"
                size="sm"
                onClick={() => handleBulkOperation({ action: 'retry', itemIds: selectedItems })}
                disabled={isLoading}
                >
                {t('queue.bulk.retry')}
                </Button>
                <Button 
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation({ action: 'prioritize', itemIds: selectedItems, priority: 'high' })}
                disabled={isLoading}
                >
                {t('queue.bulk.prioritize')}
                </Button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Queue Table */}
            <Card>
              <CardHeader>
              <CardTitle>{t('queue.table.title')}</CardTitle>
              </CardHeader>
              <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          size="table"
                          checked={selectedItems.length === filteredQueueData.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems(filteredQueueData.map(item => item.id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>{t('queue.table.lead')}</TableHead>
                      <TableHead>{t('queue.table.status')}</TableHead>
                      <TableHead>{t('queue.table.priority')}</TableHead>
                      <TableHead>{t('queue.table.scheduled')}</TableHead>
                      <TableHead>{t('queue.table.message')}</TableHead>
                      <TableHead>{t('queue.table.attempts')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueueData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            size="table"
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.lead?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{item.lead?.phone}</div>
                </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell>
                          {item.scheduled_for && new Date(item.scheduled_for).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.message_template}
                        </TableCell>
                        <TableCell>{item.attempts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('queue.settings.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{t('queue.settings.businessHours')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('queue.settings.businessHoursDesc')}
                  </p>
                </div>
                <div>
                  <Label>{t('queue.settings.dailyTarget')}</Label>
                  <Input type="number" defaultValue={45} className="mt-1" />
                </div>
                <div>
                  <Label>{t('queue.settings.processingDelay')}</Label>
                  <Input type="number" defaultValue={120} className="mt-1" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('queue.settings.processingDelayDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('queue.analytics.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('queue.analytics.totalProcessed')}</Label>
                    <div className="text-2xl font-bold">1,234</div>
                  </div>
                  <div>
                    <Label>{t('queue.analytics.averageTime')}</Label>
                    <div className="text-2xl font-bold">2.3s</div>
                  </div>
                </div>
                <div>
                  <Label>{t('queue.analytics.successRate')}</Label>
                  <div className="text-2xl font-bold">92.5%</div>
                  <Progress value={92.5} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QueueManagementDashboard; 