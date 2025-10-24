import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Search, Edit, Trash2, Plus, Save, X, Filter, Download, Upload, Settings, RefreshCw, Key } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getUserSettings, updateUserSettings, resetUserSettingsToDefault } from '@/services/realAdminConsoleService';
import { useTranslation } from 'react-i18next';

interface Column {
  key: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea' | 'date' | 'boolean' | 'badge' | 'json' | 'uuid';
  editable?: boolean;
  options?: string[];
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminDataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  onSave?: (id: string, updates: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCreate?: (data: any) => Promise<void>;
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  importable?: boolean;
}

export function AdminDataTable({
  title,
  data,
  columns,
  onSave,
  onDelete,
  onCreate,
  loading = false,
  searchable = true,
  filterable = true,
  exportable = true,
  importable = true,
}: AdminDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [userSettingsDialog, setUserSettingsDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [userSettings, setUserSettings] = useState<any>({});
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Filter and search data
  const filteredData = useMemo(() => {
    // First, deduplicate data based on id to prevent key warnings
    const uniqueData = data.reduce((acc, item) => {
      if (!acc.some(existing => existing.id === item.id)) {
        acc.push(item);
      }
      return acc;
    }, [] as any[]);

    return uniqueData.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Column filters
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return String(item[key]).toLowerCase().includes(value.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, filters]);

  const handleEdit = (id: string, currentData: any) => {
    setEditingId(id);
    setEditingData(currentData);
  };

  const handleSave = async (id: string) => {
    if (!onSave) return;
    
    try {
      await onSave(id, editingData);
      setEditingId(null);
      setEditingData({});
      toast({
        title: t('tables:messages.success'),
        description: t('tables:messages.record_updated_successfully'),
      });
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_update_record'),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleCreate = async () => {
    if (!onCreate) return;
    
    try {
      await onCreate(createData);
      setIsCreateDialogOpen(false);
      setCreateData({});
      toast({
        title: t('tables:messages.success'),
        description: t('tables:messages.record_created_successfully'),
      });
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_create_record'),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(id);
      toast({
        title: t('tables:messages.success'),
        description: t('tables:messages.record_deleted_successfully'),
      });
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_delete_record'),
        variant: "destructive",
      });
    }
  };

  const handleUserSettings = async (userId: string) => {
    setUserSettingsDialog({ open: true, userId });
    setUserSettingsLoading(true);
    
    try {
      const settings = await getUserSettings(userId);
      setUserSettings(settings);
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_load_user_settings'),
        variant: "destructive",
      });
    } finally {
      setUserSettingsLoading(false);
    }
  };

  const handleUpdateUserSettings = async (table: string, updates: any) => {
    if (!userSettingsDialog.userId) return;

    try {
      await updateUserSettings(userSettingsDialog.userId, table as any, updates);
      
      // Refresh settings
      const settings = await getUserSettings(userSettingsDialog.userId);
      setUserSettings(settings);
      
      toast({
        title: t('tables:messages.success'),
        description: t('tables:messages.user_settings_updated_successfully'),
      });
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_update_user_settings'),
        variant: "destructive",
      });
    }
  };

  const handleResetUserSettings = async () => {
    if (!userSettingsDialog.userId) return;

    try {
      await resetUserSettingsToDefault(userSettingsDialog.userId);
      
      // Refresh settings
      const settings = await getUserSettings(userSettingsDialog.userId);
      setUserSettings(settings);
      
      toast({
        title: t('tables:messages.success'),
        description: t('tables:messages.user_settings_reset_to_default'),
      });
    } catch (error) {
      toast({
        title: t('tables:messages.error'),
        description: t('tables:messages.failed_to_reset_user_settings'),
        variant: "destructive",
      });
    }
  };

  const renderCell = (column: Column, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'badge':
        return (
          <Badge variant={value === 'active' ? 'default' : 'secondary'}>
            {value}
          </Badge>
        );
      case 'boolean':
        return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'json':
        return (
          <details>
            <summary className="cursor-pointer">View JSON</summary>
            <pre className="text-xs mt-2 p-2 bg-muted rounded">
              {JSON.stringify(value, null, 2)}
            </pre>
          </details>
        );
      case 'uuid':
        return <code className="text-xs">{String(value).substring(0, 8)}...</code>;
      default:
        return String(value || '');
    }
  };

  const renderEditCell = (column: Column, value: any) => {
    if (!column.editable) return renderCell(column, value, {});

    switch (column.type) {
      case 'select':
        return (
          <Select
            value={editingData[column.key] || ''}
            onValueChange={(val) => setEditingData({...editingData, [column.key]: val})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={editingData[column.key] || ''}
            onChange={(e) => setEditingData({...editingData, [column.key]: e.target.value})}
            className="min-h-[100px]"
          />
        );
      case 'boolean':
        return (
          <Select
            value={editingData[column.key] ? 'true' : 'false'}
            onValueChange={(val) => setEditingData({...editingData, [column.key]: val === 'true'})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={editingData[column.key] || ''}
            onChange={(e) => setEditingData({...editingData, [column.key]: e.target.value})}
            type={column.type === 'email' ? 'email' : 'text'}
          />
        );
    }
  };

  const renderCreateField = (column: Column) => {
    switch (column.type) {
      case 'select':
        return (
          <Select
            value={createData[column.key] || ''}
            onValueChange={(val) => setCreateData({...createData, [column.key]: val})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={createData[column.key] || ''}
            onChange={(e) => setCreateData({...createData, [column.key]: e.target.value})}
            className="min-h-[100px]"
          />
        );
      default:
        return (
          <Input
            value={createData[column.key] || ''}
            onChange={(e) => setCreateData({...createData, [column.key]: e.target.value})}
            type={column.type === 'email' ? 'email' : 'text'}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {importable && (
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                {t('tables:general.import')}
              </Button>
            )}
            {exportable && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                {t('tables:general.export')}
              </Button>
            )}
            {onCreate && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    {t('tables:general.add_new')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('tables:dialogs.create_new')} {title.slice(0, -1)}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    {columns.filter(col => col.editable).map(column => (
                      <div key={column.key} className="grid gap-2">
                        <Label>{column.label}</Label>
                        {column.type === 'select' ? (
                          <Select
                            value={createData[column.key] || ''}
                            onValueChange={(val) => setCreateData({...createData, [column.key]: val})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {column.options?.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : column.type === 'textarea' ? (
                          <Textarea
                            value={createData[column.key] || ''}
                            onChange={(e) => setCreateData({...createData, [column.key]: e.target.value})}
                            className="min-h-[100px]"
                          />
                        ) : (
                          <Input
                            value={createData[column.key] || ''}
                            onChange={(e) => setCreateData({...createData, [column.key]: e.target.value})}
                            type={column.type === 'email' ? 'email' : 'text'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      {t('tables:dialogs.cancel')}
                    </Button>
                    <Button onClick={handleCreate}>
                      {t('tables:dialogs.create')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {(searchable || filterable) && (
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('tables:general.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                {t('tables:general.filter')}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="w-[100px]">{t('tables:general.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={row.id || `row-${index}`}>
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {editingId === row.id ? (
                        renderEditCell(column, row[column.key])
                      ) : (
                        renderCell(column, row[column.key], row)
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingId === row.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSave(row.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(row.id, row)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {title === 'Users' && (
                            <Button size="sm" variant="outline" onClick={() => handleUserSettings(row.id)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('tables:dialogs.delete_record')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('tables:dialogs.are_you_sure_delete_record')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('tables:dialogs.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(row.id)}>
                                    {t('tables:dialogs.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {t('tables:general.showing')} {filteredData.length} {t('tables:general.of')} {data.length} {t('tables:general.records')}
          </div>
        </div>
      </CardContent>

      {/* User Settings Dialog */}
      {title === 'Users' && (
        <Dialog open={userSettingsDialog.open} onOpenChange={(open) => setUserSettingsDialog({ open, userId: null })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('tables:settings.user_settings_management')}
              </DialogTitle>
            </DialogHeader>
            
            {userSettingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('tables:settings.user_settings')}</h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('tables:dialogs.reset_to_default')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('tables:dialogs.reset_user_settings')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('tables:dialogs.are_you_sure_reset_user_settings')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('tables:dialogs.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetUserSettings}>
                          {t('tables:dialogs.reset_to_default')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Tabs defaultValue="api-credentials" className="w-full">
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="api-credentials">{t('tables:settings.api')}</TabsTrigger>
                    <TabsTrigger value="app-preferences">{t('tables:settings.app_preferences')}</TabsTrigger>
                    <TabsTrigger value="dashboard">{t('tables:settings.dashboard')}</TabsTrigger>
                    <TabsTrigger value="notifications">{t('tables:settings.notifications')}</TabsTrigger>
                    <TabsTrigger value="performance">{t('tables:settings.performance')}</TabsTrigger>
                    <TabsTrigger value="queue">{t('tables:settings.queue')}</TabsTrigger>
                    <TabsTrigger value="session">{t('tables:settings.session')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="api-credentials" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          {t('tables:settings.api_credentials')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userSettings.api_credentials?.length > 0 ? (
                          <div className="space-y-4">
                            {userSettings.api_credentials.map((credential: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label>{t('tables:settings.service_name')}</Label>
                                    <Input value={credential.service_name || ''} readOnly />
                                  </div>
                                  <div>
                                    <Label>{t('tables:settings.key_name')}</Label>
                                    <Input value={credential.key_name || ''} readOnly />
                                  </div>
                                  <div>
                                    <Label>{t('tables:settings.status')}</Label>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={credential.is_active}
                                        onCheckedChange={(checked) => 
                                          handleUpdateUserSettings('user_api_credentials', {
                                            id: credential.id,
                                            is_active: checked
                                          })
                                        }
                                      />
                                      <span className="text-sm">{credential.is_active ? t('tables:settings.active') : t('tables:settings.inactive')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">{t('tables:settings.no_api_credentials_configured')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="app-preferences" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.app_preferences')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>{t('tables:settings.theme')}</Label>
                            <Select
                              value={userSettings.app_preferences?.theme || 'system'}
                              onValueChange={(value) => 
                                handleUpdateUserSettings('user_app_preferences', { theme: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">{t('tables:settings.light')}</SelectItem>
                                <SelectItem value="dark">{t('tables:settings.dark')}</SelectItem>
                                <SelectItem value="system">{t('tables:settings.system')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>{t('tables:settings.language')}</Label>
                            <Select
                              value={userSettings.app_preferences?.language || 'en'}
                              onValueChange={(value) => 
                                handleUpdateUserSettings('user_app_preferences', { language: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">{t('tables:settings.english')}</SelectItem>
                                <SelectItem value="he">{t('tables:settings.hebrew')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dashboard" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.dashboard_settings')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-refresh">{t('tables:settings.auto_refresh')}</Label>
                            <Switch
                              id="auto-refresh"
                              checked={userSettings.dashboard_settings?.auto_refresh_enabled || false}
                              onCheckedChange={(checked) => 
                                handleUpdateUserSettings('user_dashboard_settings', { auto_refresh_enabled: checked })
                              }
                            />
                          </div>
                          <div>
                            <Label>{t('tables:settings.refresh_interval')}</Label>
                            <Input
                              type="number"
                              value={userSettings.dashboard_settings?.refresh_interval || 30}
                              onChange={(e) => 
                                handleUpdateUserSettings('user_dashboard_settings', { refresh_interval: parseInt(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.notification_settings')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications">{t('tables:settings.email_notifications')}</Label>
                            <Switch
                              id="email-notifications"
                              checked={userSettings.notification_settings?.email_enabled || false}
                              onCheckedChange={(checked) => 
                                handleUpdateUserSettings('user_notification_settings', { email_enabled: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications">{t('tables:settings.push_notifications')}</Label>
                            <Switch
                              id="push-notifications"
                              checked={userSettings.notification_settings?.push_enabled || false}
                              onCheckedChange={(checked) => 
                                handleUpdateUserSettings('user_notification_settings', { push_enabled: checked })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.performance_targets')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>{t('tables:settings.daily_lead_target')}</Label>
                            <Input
                              type="number"
                              value={userSettings.performance_targets?.daily_lead_target || 10}
                              onChange={(e) => 
                                handleUpdateUserSettings('user_performance_targets', { daily_lead_target: parseInt(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label>{t('tables:settings.weekly_lead_target')}</Label>
                            <Input
                              type="number"
                              value={userSettings.performance_targets?.weekly_lead_target || 70}
                              onChange={(e) => 
                                handleUpdateUserSettings('user_performance_targets', { weekly_lead_target: parseInt(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="queue" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.queue_settings')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('tables:settings.max_queue_size')}</Label>
                            <Input
                              type="number"
                              value={userSettings.queue_settings?.max_queue_size || 100}
                              onChange={(e) => 
                                handleUpdateUserSettings('user_queue_settings', { max_queue_size: parseInt(e.target.value) })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-process">{t('tables:settings.auto_process_queue')}</Label>
                            <Switch
                              id="auto-process"
                              checked={userSettings.queue_settings?.auto_process_enabled || false}
                              onCheckedChange={(checked) => 
                                handleUpdateUserSettings('user_queue_settings', { auto_process_enabled: checked })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="session" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('tables:settings.session_state')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('tables:settings.session_data')}</Label>
                            <Textarea
                              value={JSON.stringify(userSettings.session_state || {}, null, 2)}
                              readOnly
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
} 