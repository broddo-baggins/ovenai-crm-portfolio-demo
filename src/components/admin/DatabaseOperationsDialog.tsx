import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Database, CheckCircle, AlertTriangle, Copy, TrendingUp, Monitor, HardDrive, Download } from 'lucide-react';
import { systemMonitoringService } from '@/services/systemMonitoringService';
import { toast } from 'sonner';

interface DatabaseOperationDialogProps {
  trigger: React.ReactNode;
  operation: 'backup' | 'optimize' | 'integrity' | 'performance' | 'cleanup' | 'archive';
  onSuccess?: (result: any) => void;
}

export function DatabaseOperationDialog({ trigger, operation, onSuccess }: DatabaseOperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    backupType: 'full',
    includeData: true,
    includeSchema: true,
    compressionLevel: 'high',
    retentionDays: '30',
    performanceMetrics: true,
    detailedReport: true,
    confirmAction: false,
    archiveOlderThan: '90'
  });
  const [result, setResult] = useState<any>(null);

  const getOperationConfig = () => {
    switch (operation) {
      case 'backup':
        return {
          title: 'Database Backup',
          icon: <Database className="w-5 h-5" />,
          description: 'Create a backup of the database with selected options.',
          scriptName: 'database-backup',
          confirmRequired: false
        };
      case 'optimize':
        return {
          title: 'Database Optimization',
          icon: <TrendingUp className="w-5 h-5" />,
          description: 'Optimize database performance by rebuilding indexes and updating statistics.',
          scriptName: 'database-optimize',
          confirmRequired: true
        };
      case 'integrity':
        return {
          title: 'Database Integrity Check',
          icon: <CheckCircle className="w-5 h-5" />,
          description: 'Verify database integrity and check for corruption.',
          scriptName: 'database-integrity',
          confirmRequired: false
        };
      case 'performance':
        return {
          title: 'Performance Analysis',
          icon: <Monitor className="w-5 h-5" />,
          description: 'Analyze database performance and identify bottlenecks.',
          scriptName: 'database-performance',
          confirmRequired: false
        };
      case 'cleanup':
        return {
          title: 'Database Cleanup',
          icon: <RefreshCw className="w-5 h-5" />,
          description: 'Remove orphaned data and clean up unused resources.',
          scriptName: 'database-cleanup',
          confirmRequired: true
        };
      case 'archive':
        return {
          title: 'Archive Old Data',
          icon: <HardDrive className="w-5 h-5" />,
          description: 'Archive old data to optimize database performance.',
          scriptName: 'database-archive',
          confirmRequired: true
        };
      default:
        return {
          title: 'Database Operation',
          icon: <Database className="w-5 h-5" />,
          description: 'Perform database operation.',
          scriptName: 'database-operation',
          confirmRequired: false
        };
    }
  };

  const config = getOperationConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (config.confirmRequired && !formData.confirmAction) {
      toast.error('Please confirm the operation');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const scriptParams = {
        ...formData,
        operation
      };

      const scriptResult = await systemMonitoringService.executeScript(config.scriptName, scriptParams);

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success(`${config.title} completed successfully!`);
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          backupType: 'full',
          includeData: true,
          includeSchema: true,
          compressionLevel: 'high',
          retentionDays: '30',
          performanceMetrics: true,
          detailedReport: true,
          confirmAction: false,
          archiveOlderThan: '90'
        });
      } else {
        toast.error(`${config.title} failed`);
      }
    } catch (error) {
      toast.error(`Error during ${config.title.toLowerCase()}`);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOperationSpecificFields = () => {
    switch (operation) {
      case 'backup':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backupType">Backup Type</Label>
                <Select value={formData.backupType} onValueChange={(value) => setFormData({ ...formData, backupType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="incremental">Incremental Backup</SelectItem>
                    <SelectItem value="differential">Differential Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compressionLevel">Compression Level</Label>
                <Select value={formData.compressionLevel} onValueChange={(value) => setFormData({ ...formData, compressionLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Compression</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeData">Include Data</Label>
                <Switch
                  id="includeData"
                  checked={formData.includeData}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeData: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeSchema">Include Schema</Label>
                <Switch
                  id="includeSchema"
                  checked={formData.includeSchema}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeSchema: checked })}
                />
              </div>
            </div>
          </>
        );
      case 'archive':
        return (
          <div className="space-y-2">
            <Label htmlFor="archiveOlderThan">Archive data older than</Label>
            <Select value={formData.archiveOlderThan} onValueChange={(value) => setFormData({ ...formData, archiveOlderThan: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="performanceMetrics">Include Performance Metrics</Label>
              <Switch
                id="performanceMetrics"
                checked={formData.performanceMetrics}
                onCheckedChange={(checked) => setFormData({ ...formData, performanceMetrics: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="detailedReport">Generate Detailed Report</Label>
              <Switch
                id="detailedReport"
                checked={formData.detailedReport}
                onCheckedChange={(checked) => setFormData({ ...formData, detailedReport: checked })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderOperationSpecificFields()}
            
            {config.confirmRequired && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmAction">I understand this operation</Label>
                  <Switch
                    id="confirmAction"
                    checked={formData.confirmAction}
                    onCheckedChange={(checked) => setFormData({ ...formData, confirmAction: checked })}
                  />
                </div>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This operation will modify the database. 
                    {operation === 'cleanup' && " This will permanently remove orphaned data."}
                    {operation === 'archive' && " This will move old data to archive storage."}
                    {operation === 'optimize' && " This may temporarily impact database performance."}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-2">Operation Details:</p>
              <ul className="space-y-1 text-gray-600">
                {operation === 'backup' && (
                  <>
                    <li>• Type: {formData.backupType} backup</li>
                    <li>• Compression: {formData.compressionLevel}</li>
                    <li>• Include Data: {formData.includeData ? 'Yes' : 'No'}</li>
                    <li>• Include Schema: {formData.includeSchema ? 'Yes' : 'No'}</li>
                  </>
                )}
                {operation === 'archive' && (
                  <>
                    <li>• Archive data older than {formData.archiveOlderThan} days</li>
                    <li>• Data will be moved to archive storage</li>
                  </>
                )}
                {operation === 'performance' && (
                  <>
                    <li>• Performance metrics: {formData.performanceMetrics ? 'Included' : 'Basic'}</li>
                    <li>• Report detail: {formData.detailedReport ? 'Detailed' : 'Summary'}</li>
                  </>
                )}
                <li>• Estimated duration: {operation === 'backup' ? '5-15 minutes' : '2-10 minutes'}</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (config.confirmRequired && !formData.confirmAction)}
              >
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {operation === 'backup' && 'Create Backup'}
                {operation === 'optimize' && 'Optimize Database'}
                {operation === 'integrity' && 'Check Integrity'}
                {operation === 'performance' && 'Analyze Performance'}
                {operation === 'cleanup' && 'Cleanup Database'}
                {operation === 'archive' && 'Archive Data'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  <strong>{result.success ? 'Success!' : 'Error:'}</strong> {result.message}
                </AlertDescription>
              </div>
            </Alert>

            {result.output && (
              <div className="space-y-2">
                <Label>Operation Report:</Label>
                <Textarea
                  value={result.output}
                  readOnly
                  className="min-h-[100px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.output);
                      toast.success('Report copied to clipboard');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Report
                  </Button>
                  {operation === 'backup' && result.success && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real implementation, this would trigger a download
                        toast.success('Backup download initiated');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Backup
                    </Button>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
              {result.success && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      backupType: 'full',
                      includeData: true,
                      includeSchema: true,
                      compressionLevel: 'high',
                      retentionDays: '30',
                      performanceMetrics: true,
                      detailedReport: true,
                      confirmAction: false,
                      archiveOlderThan: '90'
                    });
                  }}
                >
                  Run Again
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Health Check Dialog Component
interface HealthCheckDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (result: any) => void;
}

export function HealthCheckDialog({ trigger, onSuccess }: HealthCheckDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const scriptResult = await systemMonitoringService.executeScript('health-check', {});

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success('Health check completed successfully!');
        onSuccess?.(scriptResult);
      } else {
        toast.error('Health check failed');
      }
    } catch (error) {
      toast.error('Error during health check');
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            System Health Check
          </DialogTitle>
          <DialogDescription>
            Run a comprehensive health check on the entire system.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-2">Health Check Includes:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Database connectivity and performance</li>
                <li>• API endpoints and response times</li>
                <li>• System resources (CPU, Memory, Disk)</li>
                <li>• Background services status</li>
                <li>• Error rates and logs</li>
                <li>• Security checks</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Run Health Check
              </Button>
            </DialogFooter>
          </form>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  <strong>{result.success ? 'Health Check Passed!' : 'Issues Found:'}</strong> {result.message}
                </AlertDescription>
              </div>
            </Alert>

            {result.output && (
              <div className="space-y-2">
                <Label>Health Report:</Label>
                <Textarea
                  value={result.output}
                  readOnly
                  className="min-h-[150px] font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(result.output);
                    toast.success('Health report copied to clipboard');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Report
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                }}
              >
                Run Again
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 