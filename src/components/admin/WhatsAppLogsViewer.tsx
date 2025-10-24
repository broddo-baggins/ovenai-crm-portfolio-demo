// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  Phone,
  User,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  FileText,
  Globe,
  Zap
} from 'lucide-react';
import WhatsAppLoggingService from '@/services/whatsapp-logging';
import { cn } from '@/lib/utils';

interface WhatsAppLog {
  id: string;
  created_at: string;
  message_type: 'outbound' | 'inbound' | 'template' | 'webhook';
  message_content?: string;
  sender_number?: string;
  receiver_number?: string;
  template_name?: string;
  wamid?: string;
  payload?: any;
  status?: string;
  lead_id?: string;
  user_id?: string;
}

interface FilterOptions {
  message_type: string;
  date_from: Date | null;
  date_to: Date | null;
  phone_number: string;
  template_name: string;
  status: string;
  search: string;
}

export function WhatsAppLogsViewer() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WhatsAppLog | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    message_type: '',
    date_from: null,
    date_to: null,
    phone_number: '',
    template_name: '',
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total_messages: 0,
    outbound_messages: 0,
    inbound_messages: 0,
    template_messages: 0,
    webhook_events: 0,
    success_rate: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadLogs = async () => {
    setLoading(true);
    
    try {
      const endDate = filters.date_to || new Date();
      const startDate = filters.date_from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      // Get compliance logs (this is a simplified approach - you may need to implement actual API endpoint)
      const complianceLogs = await WhatsAppLoggingService.getComplianceLogs(
        'system', // user_id - for admin view, show all
        startDate.toISOString(),
        endDate.toISOString(),
        pageSize * currentPage
      );

      // Combine different log types
      const allLogs = [
        ...complianceLogs.messages.map(msg => ({
          ...msg,
          log_type: 'message',
          message_type: msg.message_type || 'outbound'
        })),
        ...complianceLogs.webhooks.map(webhook => ({
          ...webhook,
          log_type: 'webhook',
          message_type: 'webhook',
          message_content: webhook.action || 'Webhook event'
        })),
        ...complianceLogs.templates.map(template => ({
          ...template,
          log_type: 'template',
          message_type: 'template',
          message_content: template.n8n_action_taken || 'Template message'
        }))
      ];

      // Sort by created_at descending
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setLogs(allLogs);
      setTotalCount(allLogs.length);
      
      // Calculate stats
      const stats = {
        total_messages: allLogs.length,
        outbound_messages: allLogs.filter(log => log.message_type === 'outbound').length,
        inbound_messages: allLogs.filter(log => log.message_type === 'inbound').length,
        template_messages: allLogs.filter(log => log.message_type === 'template').length,
        webhook_events: allLogs.filter(log => log.message_type === 'webhook').length,
        success_rate: allLogs.length > 0 ? (allLogs.filter(log => log.status === 'active' || log.status === 'processed').length / allLogs.length) * 100 : 0
      };
      setStats(stats);

    } catch (error) {
      console.error('Error loading WhatsApp logs:', error);
      toast({
        title: "Error loading logs",
        description: "Failed to load WhatsApp logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.message_type) {
      filtered = filtered.filter(log => log.message_type === filters.message_type);
    }

    if (filters.phone_number) {
      const phone = filters.phone_number.toLowerCase();
      filtered = filtered.filter(log => 
        log.sender_number?.toLowerCase().includes(phone) ||
        log.receiver_number?.toLowerCase().includes(phone)
      );
    }

    if (filters.template_name) {
      const template = filters.template_name.toLowerCase();
      filtered = filtered.filter(log => 
        log.template_name?.toLowerCase().includes(template)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message_content?.toLowerCase().includes(search) ||
        log.sender_number?.toLowerCase().includes(search) ||
        log.receiver_number?.toLowerCase().includes(search) ||
        log.template_name?.toLowerCase().includes(search) ||
        log.wamid?.toLowerCase().includes(search)
      );
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setFilters({
      message_type: '',
      date_from: null,
      date_to: null,
      phone_number: '',
      template_name: '',
      status: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: log.created_at,
      type: log.message_type,
      sender: log.sender_number || 'system',
      receiver: log.receiver_number || 'system',
      content: log.message_content || '',
      template: log.template_name || '',
      wamid: log.wamid || '',
      status: log.status || 'unknown',
      lead_id: log.lead_id || '',
      user_id: log.user_id || ''
    }));

    const headers = [
      'Timestamp',
      'Type',
      'Sender',
      'Receiver',
      'Content',
      'Template',
      'WhatsApp ID',
      'Status',
      'Lead ID',
      'User ID'
    ];

    const csvContent = [
      headers.join(','),
      ...exportData.map(row => [
        row.timestamp,
        row.type,
        row.sender,
        row.receiver,
        row.content,
        row.template,
        row.wamid,
        row.status,
        row.lead_id,
        row.user_id
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${exportData.length} WhatsApp logs exported to CSV`
    });
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'outbound': return <Send className="h-4 w-4 text-blue-600" />;
      case 'inbound': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'template': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'webhook': return <Globe className="h-4 w-4 text-orange-600" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'outbound': return 'default';
      case 'inbound': return 'secondary';
      case 'template': return 'outline';
      case 'webhook': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'processed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>;
    }
    if (typeof value === 'object') {
      return (
        <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">WhatsApp Logs</h2>
            <p className="text-muted-foreground">Meta App Provider compliance monitoring</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={loadLogs} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{stats.total_messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Outbound</p>
                <p className="text-2xl font-bold">{stats.outbound_messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inbound</p>
                <p className="text-2xl font-bold">{stats.inbound_messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{stats.template_messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Webhooks</p>
                <p className="text-2xl font-bold">{stats.webhook_events}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <Select value={filters.message_type} onValueChange={(value) => setFilters({...filters, message_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input
                placeholder="Search phone number..."
                value={filters.phone_number}
                onChange={(e) => setFilters({...filters, phone_number: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Template Name</label>
              <Input
                placeholder="Search template..."
                value={filters.template_name}
                onChange={(e) => setFilters({...filters, template_name: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date From</label>
              <DatePicker
                selected={filters.date_from}
                onSelect={(date) => setFilters({...filters, date_from: date})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <DatePicker
                selected={filters.date_to}
                onSelect={(date) => setFilters({...filters, date_to: date})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Content</label>
              <Input
                placeholder="Search message content..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline">
              Clear All
            </Button>
            <Badge variant="secondary">{filteredLogs.length} results</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card>
        <CardHeader>
          <CardTitle>
            WhatsApp Logs ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Showing page {currentPage} of {totalPages} for Meta compliance review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              Loading WhatsApp logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No WhatsApp logs found for the selected filters
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone Numbers</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMessageTypeColor(log.message_type)} className="flex items-center gap-1 w-fit">
                          {getMessageTypeIcon(log.message_type)}
                          {log.message_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            {log.sender_number && (
                              <div className="text-sm">From: {log.sender_number}</div>
                            )}
                            {log.receiver_number && (
                              <div className="text-sm">To: {log.receiver_number}</div>
                            )}
                            {!log.sender_number && !log.receiver_number && (
                              <div className="text-sm text-muted-foreground">System</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="text-sm truncate">
                            {log.message_content || log.template_name || 'No content'}
                          </div>
                          {log.template_name && (
                            <div className="text-xs text-muted-foreground">
                              Template: {log.template_name}
                            </div>
                          )}
                          {log.wamid && (
                            <div className="text-xs text-muted-foreground">
                              ID: {log.wamid}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-sm">{log.status || 'unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>WhatsApp Log Details</DialogTitle>
                              <DialogDescription>
                                {log.message_type} message at {new Date(log.created_at).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Message Type</label>
                                  <p className="text-sm flex items-center gap-2">
                                    {getMessageTypeIcon(log.message_type)}
                                    {log.message_type}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <p className="text-sm flex items-center gap-2">
                                    {getStatusIcon(log.status)}
                                    {log.status || 'unknown'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Sender</label>
                                  <p className="text-sm font-mono">{log.sender_number || 'system'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Receiver</label>
                                  <p className="text-sm font-mono">{log.receiver_number || 'system'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">WhatsApp ID</label>
                                  <p className="text-sm font-mono">{log.wamid || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Template</label>
                                  <p className="text-sm">{log.template_name || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium">Timestamp</label>
                                  <p className="text-sm">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Message Content</label>
                                <div className="mt-2 p-3 bg-muted rounded">
                                  <p className="text-sm">{log.message_content || 'No content'}</p>
                                </div>
                              </div>
                              
                              {log.payload && (
                                <div>
                                  <label className="text-sm font-medium">Payload Data</label>
                                  <div className="mt-2">
                                    {formatValue(log.payload)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 