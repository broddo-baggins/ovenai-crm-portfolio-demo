import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, X, Settings } from 'lucide-react';
import { useAuth } from '@/context/ClientAuthContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: 'active' | 'inactive' | 'completed' | 'archived' | 'pending' | 'draft';
  processing_state: 'pending' | 'processing' | 'completed' | 'failed';
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface EnhancedProjectEditDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  userPermissions?: {
    can_edit?: boolean;
    is_admin?: boolean;
  };
}

export function EnhancedProjectEditDialog({ 
  project, 
  isOpen, 
  onClose, 
  onSave,
  userPermissions = { can_edit: true }
}: EnhancedProjectEditDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        processing_state: project.processing_state,
        settings: project.settings || {},
        metadata: project.metadata || {},
      });
    }
  }, [project]);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        updated_at: new Date().toISOString(),
      });
      toast.success('Project updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const addSettingsField = () => {
    const newKey = `setting_${Date.now()}`;
    handleSettingsChange(newKey, '');
  };

  const addMetadataField = () => {
    const newKey = `meta_${Date.now()}`;
    handleMetadataChange(newKey, '');
  };

  const removeSettingsField = (key: string) => {
    setFormData(prev => {
      const newSettings = { ...prev.settings };
      delete newSettings[key];
      return { ...prev, settings: newSettings };
    });
  };

  const removeMetadataField = (key: string) => {
    setFormData(prev => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return { ...prev, metadata: newMetadata };
    });
  };

  const canEdit = userPermissions?.can_edit !== false;

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Project: {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleFieldChange('status', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="processing_state">Processing State</Label>
                <Select 
                  value={formData.processing_state} 
                  onValueChange={(value) => handleFieldChange('processing_state', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Settings (JSON)
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSettingsField}
                  disabled={!canEdit}
                >
                  Add Setting
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(formData.settings || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newSettings = { ...formData.settings };
                      delete newSettings[key];
                      newSettings[e.target.value] = value;
                      handleFieldChange('settings', newSettings);
                    }}
                    placeholder="Setting key"
                    className="w-1/3"
                    disabled={!canEdit}
                  />
                  <Input
                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    onChange={(e) => {
                      try {
                        const parsedValue = JSON.parse(e.target.value);
                        handleSettingsChange(key, parsedValue);
                      } catch {
                        handleSettingsChange(key, e.target.value);
                      }
                    }}
                    placeholder="Setting value (JSON supported)"
                    className="w-2/3"
                    disabled={!canEdit}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSettingsField(key)}
                    disabled={!canEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {Object.keys(formData.settings || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No settings configured</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Metadata (JSON)
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addMetadataField}
                  disabled={!canEdit}
                >
                  Add Metadata
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(formData.metadata || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newMetadata = { ...formData.metadata };
                      delete newMetadata[key];
                      newMetadata[e.target.value] = value;
                      handleFieldChange('metadata', newMetadata);
                    }}
                    placeholder="Metadata key"
                    className="w-1/3"
                    disabled={!canEdit}
                  />
                  <Input
                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    onChange={(e) => {
                      try {
                        const parsedValue = JSON.parse(e.target.value);
                        handleMetadataChange(key, parsedValue);
                      } catch {
                        handleMetadataChange(key, e.target.value);
                      }
                    }}
                    placeholder="Metadata value (JSON supported)"
                    className="w-2/3"
                    disabled={!canEdit}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMetadataField(key)}
                    disabled={!canEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {Object.keys(formData.metadata || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No metadata configured</p>
              )}
            </CardContent>
          </Card>

          {/* Read-only Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Project ID</Label>
                  <p className="text-muted-foreground font-mono">{project.id}</p>
                </div>
                <div>
                  <Label>Client ID</Label>
                  <p className="text-muted-foreground font-mono">{project.client_id}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-muted-foreground">{new Date(project.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Updated</Label>
                  <p className="text-muted-foreground">{new Date(project.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !canEdit}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 