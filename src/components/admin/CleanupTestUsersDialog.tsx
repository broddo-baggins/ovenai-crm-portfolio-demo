import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Trash2, CheckCircle, AlertTriangle, Copy, Users } from 'lucide-react';
import { systemMonitoringService } from '@/services/systemMonitoringService';
import { toast } from 'sonner';

interface CleanupTestUsersDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (result: any) => void;
}

export function CleanupTestUsersDialog({ trigger, onSuccess }: CleanupTestUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    olderThan: '30',
    confirmAction: false,
    dryRun: true
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.confirmAction) {
      toast.error('Please confirm the cleanup action');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const scriptResult = await systemMonitoringService.executeScript('cleanup-test-users', {
        olderThan: `${formData.olderThan}d`,
        dryRun: formData.dryRun
      });

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success(formData.dryRun ? 'Cleanup analysis completed!' : 'Test users cleaned up successfully!');
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          olderThan: '30',
          confirmAction: false,
          dryRun: true
        });
      } else {
        toast.error('Failed to cleanup test users');
      }
    } catch (error) {
      toast.error('Error during cleanup process');
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
            <Trash2 className="w-5 h-5" />
            Cleanup Test Users
          </DialogTitle>
          <DialogDescription>
            Remove expired test users and temporary accounts from the system.
          </DialogDescription>
        </DialogHeader>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="olderThan">Remove users older than</Label>
              <Select value={formData.olderThan} onValueChange={(value) => setFormData({ ...formData, olderThan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dryRun">Dry Run (Preview Only)</Label>
                <Switch
                  id="dryRun"
                  checked={formData.dryRun}
                  onCheckedChange={(checked) => setFormData({ ...formData, dryRun: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="confirmAction">I understand this action</Label>
                <Switch
                  id="confirmAction"
                  checked={formData.confirmAction}
                  onCheckedChange={(checked) => setFormData({ ...formData, confirmAction: checked })}
                />
              </div>
            </div>

            <Alert className={formData.dryRun ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {formData.dryRun ? (
                  <strong>Dry Run Mode:</strong>
                ) : (
                  <strong>Warning:</strong>
                )}
                {' '}
                {formData.dryRun 
                  ? "This will show you what would be deleted without actually removing any users."
                  : "This will permanently remove test users from the system. This action cannot be undone."
                }
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-2">Target Criteria:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Email contains "test", "example", or "temp"</li>
                <li>• Account created more than {formData.olderThan} days ago</li>
                <li>• Marked as temporary accounts</li>
                <li>• No recent activity</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.confirmAction}
                variant={formData.dryRun ? "default" : "destructive"}
              >
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {formData.dryRun ? "Analyze" : "Cleanup Users"}
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
                <Label>Cleanup Report:</Label>
                <Textarea
                  value={result.output}
                  readOnly
                  className="min-h-[100px] font-mono text-sm"
                />
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
                      olderThan: '30',
                      confirmAction: false,
                      dryRun: true
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