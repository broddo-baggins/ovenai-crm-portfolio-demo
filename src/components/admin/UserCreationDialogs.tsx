import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Users, TestTube, Building, RefreshCw, Copy, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { systemMonitoringService } from '@/services/systemMonitoringService';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateClientUserDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (result: any) => void;
}

export function CreateClientUserDialog({ trigger, onSuccess }: CreateClientUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'STAFF',
    organization: '',
    sendInvitation: true,
    createDemoProject: true
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const scriptResult = await systemMonitoringService.executeScript('create-client-user', {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        organization: formData.organization || `${formData.name}'s Organization`,
        sendInvitation: formData.sendInvitation,
        createDemoProject: formData.createDemoProject
      });

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success('Client user created successfully!');
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          email: '',
          name: '',
          role: 'STAFF',
          organization: '',
          sendInvitation: true,
          createDemoProject: true
        });
      } else {
        toast.error('Failed to create client user');
      }
    } catch (error) {
      toast.error('Error creating client user');
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
            <UserPlus className="w-5 h-5" />
            Create Client User
          </DialogTitle>
          <DialogDescription>
            Create a new user account for a paying client with full access to their organization.
          </DialogDescription>
        </DialogHeader>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Staff Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Auto-generated from name"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sendInvitation">Send Email Invitation</Label>
                <Switch
                  id="sendInvitation"
                  checked={formData.sendInvitation}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendInvitation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="createDemoProject">Create Demo Project</Label>
                <Switch
                  id="createDemoProject"
                  checked={formData.createDemoProject}
                  onCheckedChange={(checked) => setFormData({ ...formData, createDemoProject: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Create User
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
                <Label>Execution Details:</Label>
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
                    toast.success('Output copied to clipboard');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Output
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
                      email: '',
                      name: '',
                      role: 'STAFF',
                      organization: '',
                      sendInvitation: true,
                      createDemoProject: true
                    });
                  }}
                >
                  Create Another
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreatePartnerUserDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (result: any) => void;
}

export function CreatePartnerUserDialog({ trigger, onSuccess }: CreatePartnerUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    organization: '',
    permissions: 'basic'
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const scriptResult = await systemMonitoringService.executeScript('create-partner-user', {
        email: formData.email,
        name: formData.name,
        organization: formData.organization
      });

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success('Partner user created successfully!');
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          email: '',
          name: '',
          organization: '',
          permissions: 'basic'
        });
      } else {
        toast.error('Failed to create partner user');
      }
    } catch (error) {
      toast.error('Error creating partner user');
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
            <Building className="w-5 h-5" />
            Create Partner User
          </DialogTitle>
          <DialogDescription>
            Create a user account for business partners with limited access permissions.
          </DialogDescription>
        </DialogHeader>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner-name">Full Name *</Label>
                <Input
                  id="partner-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-email">Email Address *</Label>
                <Input
                  id="partner-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@agency.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-organization">Partner Organization *</Label>
              <Input
                id="partner-organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Marketing Agency XYZ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissions">Access Level</Label>
              <Select value={formData.permissions} onValueChange={(value) => setFormData({ ...formData, permissions: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Access</SelectItem>
                  <SelectItem value="advanced">Advanced Access</SelectItem>
                  <SelectItem value="limited">Limited Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Partner users will have restricted access and cannot manage other users or system settings.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Create Partner User
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
                <Label>Execution Details:</Label>
                <Textarea
                  value={result.output}
                  readOnly
                  className="min-h-[100px] font-mono text-sm"
                />
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
                      email: '',
                      name: '',
                      organization: '',
                      permissions: 'basic'
                    });
                  }}
                >
                  Create Another
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateTestUserDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (result: any) => void;
}

export function CreateTestUserDialog({ trigger, onSuccess }: CreateTestUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    temporary: true,
    expires: '7',
    autoGenerate: true
  });
  const [result, setResult] = useState<any>(null);

  const generateTestEmail = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `test.user.${timestamp}.${randomNum}@example.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const email = formData.autoGenerate ? generateTestEmail() : formData.email;
      
      const scriptResult = await systemMonitoringService.executeScript('create-test-user', {
        email,
        temporary: formData.temporary,
        expires: `${formData.expires}d`
      });

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success('Test user created successfully!');
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          email: '',
          temporary: true,
          expires: '7',
          autoGenerate: true
        });
      } else {
        toast.error('Failed to create test user');
      }
    } catch (error) {
      toast.error('Error creating test user');
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
            <TestTube className="w-5 h-5" />
            Create Test User
          </DialogTitle>
          <DialogDescription>
            Create a temporary user account for development and testing purposes.
          </DialogDescription>
        </DialogHeader>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoGenerate">Auto-generate email</Label>
                <Switch
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                />
              </div>
              
              {!formData.autoGenerate && (
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email Address *</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="test@example.com"
                    required={!formData.autoGenerate}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires">Expires After (days)</Label>
                <Select value={formData.expires} onValueChange={(value) => setFormData({ ...formData, expires: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="temporary">Temporary Account</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="temporary"
                    checked={formData.temporary}
                    onCheckedChange={(checked) => setFormData({ ...formData, temporary: checked })}
                  />
                  <Badge variant={formData.temporary ? "default" : "secondary"}>
                    {formData.temporary ? "Temporary" : "Permanent"}
                  </Badge>
                </div>
              </div>
            </div>

            <Alert>
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                Test users are automatically flagged for cleanup and have limited permissions.
                {formData.autoGenerate && " Email will be auto-generated with timestamp."}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Create Test User
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
                <Label>Test User Details:</Label>
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
                    toast.success('Details copied to clipboard');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Details
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
                      email: '',
                      temporary: true,
                      expires: '7',
                      autoGenerate: true
                    });
                  }}
                >
                  Create Another
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreateAdminUserDialog({ trigger, onSuccess }: CreateTestUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    confirmAction: false,
    sendCredentials: true,
    permissions: 'full_admin' as 'full_admin' | 'limited_admin'
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const scriptResult = await systemMonitoringService.executeScript('create-admin-user', {
        email: formData.email,
        name: formData.name,
        permissions: formData.permissions,
        sendCredentials: formData.sendCredentials
      });

      setResult(scriptResult);
      
      if (scriptResult.success) {
        toast.success('Admin user created successfully!');
        onSuccess?.(scriptResult);
        
        // Reset form
        setFormData({
          email: '',
          name: '',
          confirmAction: false,
          sendCredentials: true,
          permissions: 'full_admin'
        });
      } else {
        toast.error('Failed to create admin user');
      }
    } catch (error) {
      toast.error('Error creating admin user');
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
            <Shield className="w-5 h-5 text-red-500" />
            Create Administrator User
          </DialogTitle>
          <DialogDescription>
            Create a new system administrator with elevated privileges. Use with extreme caution.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <strong>Security Warning:</strong> Admin users have full system access including 
            user management, database operations, and configuration changes.
          </AlertDescription>
        </Alert>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name *</Label>
                <Input
                  id="admin-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="System Administrator"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-permissions">Admin Level</Label>
              <Select value={formData.permissions} onValueChange={(value: 'full_admin' | 'limited_admin') => setFormData({ ...formData, permissions: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_admin">Full Administrator (All permissions)</SelectItem>
                  <SelectItem value="limited_admin">Limited Administrator (Read-only operations)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sendCredentials">Send Login Credentials</Label>
                <Switch
                  id="sendCredentials"
                  checked={formData.sendCredentials}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendCredentials: checked })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmAdminAction"
                  checked={formData.confirmAction}
                  onCheckedChange={(checked) => setFormData({ ...formData, confirmAction: !!checked })}
                />
                <Label 
                  htmlFor="confirmAdminAction" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand this grants full administrative access *
                </Label>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-2">Admin Capabilities:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Full access to System Administration Console</li>
                <li>• Create, modify, and delete users</li>
                <li>• Database operations and monitoring</li>
                <li>• Execute administrative scripts</li>
                <li>• View system logs and analytics</li>
                <li>• Modify system configuration</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.confirmAction}
                variant="destructive"
              >
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Create Admin User
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
                  <strong>{result.success ? 'Admin Created!' : 'Error:'}</strong> {result.message}
                </AlertDescription>
              </div>
            </Alert>

            {result.output && (
              <div className="space-y-2">
                <Label>Admin Creation Details:</Label>
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
                    toast.success('Details copied to clipboard');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Details
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
                      email: '',
                      name: '',
                      confirmAction: false,
                      sendCredentials: true,
                      permissions: 'full_admin'
                    });
                  }}
                >
                  Create Another Admin
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 