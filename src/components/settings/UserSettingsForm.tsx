/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  RotateCcw, 
  Settings, 
  Bell, 
  Target, 
  Calendar, 
  Palette,
  Monitor,
  Globe,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { userPreferencesService } from '@/services/userPreferencesService';
import { toast } from 'sonner';

interface AppPreferences {
  interface_settings: {
    language: string;
    rtl: boolean;
    theme: string;
    color_scheme: string;
  };
  data_preferences: {
    currency: string;
    date_format: string;
    time_format: string;
    timezone: string;
  };
  ui_preferences: {
    sidebar_collapsed: boolean;
    density: string;
    animations: boolean;
  };
}

interface DashboardSettings {
  layout_preferences: {
    view_mode: string;
    cards_per_row: number;
    show_welcome_tour: boolean;
  };
  widget_settings: {
    enabled_widgets: string[];
    widget_positions: Record<string, any>;
  };
}

interface NotificationSettings {
  email_notifications: {
    enabled: boolean;
    frequency: string;
    types: string[];
  };
  push_notifications: {
    enabled: boolean;
    types: string[];
  };
  whatsapp_notifications: {
    enabled: boolean;
    types: string[];
  };
}

interface PerformanceTargets {
  monthly_targets: {
    leads: number;
    conversations: number;
    conversions: number;
    revenue: number;
  };
  kpi_settings: {
    primary_metrics: string[];
    secondary_metrics: string[];
  };
}

interface QueueSettings {
  work_days_enabled: boolean;
  work_days: number[];
  business_hours_start: string;
  business_hours_end: string;
  business_timezone: string;
  target_leads_per_month: number;
  target_leads_per_work_day: number;
  auto_queue_preparation: boolean;
  auto_start_processing: boolean;
}

const UserSettingsForm: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL, flexRowReverse, textStart } = useLang();

  // State for each settings category
  const [appPreferences, setAppPreferences] = useState<AppPreferences | null>(null);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [performanceTargets, setPerformanceTargets] = useState<PerformanceTargets | null>(null);
  const [queueSettings, setQueueSettings] = useState<QueueSettings | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('app');
  const [hasChanges, setHasChanges] = useState(false);

  // Load all settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        appPrefs,
        dashboardPrefs,
        notificationPrefs,
        performancePrefs,
        queuePrefs
      ] = await Promise.all([
        userPreferencesService.getAppPreferences(),
        userPreferencesService.getDashboardSettings(),
        userPreferencesService.getNotificationSettings(),
        userPreferencesService.getPerformanceTargets(),
        userPreferencesService.getQueueManagementSettings()
      ]);

      setAppPreferences(appPrefs);
      setDashboardSettings(dashboardPrefs);
      setNotificationSettings(notificationPrefs);
      setPerformanceTargets(performancePrefs);
      setQueueSettings(queuePrefs);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save all settings
  const saveSettings = useCallback(async () => {
    try {
      setSaving(true);
      
      const savePromises = [];
      
      if (appPreferences) {
        savePromises.push(userPreferencesService.saveAppPreferences(appPreferences));
      }
      
      if (dashboardSettings) {
        savePromises.push(userPreferencesService.saveDashboardSettings(dashboardSettings));
      }
      
      if (notificationSettings) {
        savePromises.push(userPreferencesService.saveNotificationSettings(notificationSettings));
      }
      
      if (performanceTargets) {
        savePromises.push(userPreferencesService.savePerformanceTargets(performanceTargets));
      }
      
      if (queueSettings) {
        savePromises.push(userPreferencesService.saveQueueManagementSettings(queueSettings));
      }

      await Promise.all(savePromises);
      
      setHasChanges(false);
      toast.success('Settings saved successfully');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [appPreferences, dashboardSettings, notificationSettings, performanceTargets, queueSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Mark as changed when settings update
  useEffect(() => {
    setHasChanges(true);
  }, [appPreferences, dashboardSettings, notificationSettings, performanceTargets, queueSettings]);

  // Update functions for each setting type
  const updateAppPreferences = (updates: Partial<AppPreferences>) => {
    setAppPreferences(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateDashboardSettings = (updates: Partial<DashboardSettings>) => {
    setDashboardSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  const updatePerformanceTargets = (updates: Partial<PerformanceTargets>) => {
    setPerformanceTargets(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateQueueSettings = (updates: Partial<QueueSettings>) => {
    setQueueSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'font-rubik' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${flexRowReverse}`}>
        <div className={textStart()}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('User Settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('Configure your preferences and system settings')}
          </p>
        </div>
        
        <div className={`flex gap-2 ${flexRowReverse}`}>
          <Button
            onClick={loadSettings}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('Reset')}
          </Button>
          
          <Button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasChanges && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('You have unsaved changes. Don\'t forget to save your settings.')}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('App')}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {t('Dashboard')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('Notifications')}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('Targets')}
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('Queue')}
          </TabsTrigger>
        </TabsList>

        {/* App Preferences Tab */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('Interface Settings')}
              </CardTitle>
              <CardDescription>
                {t('Language, theme, and display preferences')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('Language')}</Label>
                  <Select 
                    value={appPreferences?.interface_settings.language || 'en'}
                    onValueChange={(value) => updateAppPreferences({
                      interface_settings: { 
                        ...(appPreferences?.interface_settings || {}), 
                        language: value,
                        rtl: value === 'he' || value === 'ar'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="he">עברית (Hebrew)</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">{t('Theme')}</Label>
                  <Select 
                    value={appPreferences?.interface_settings.theme || 'system'}
                    onValueChange={(value) => updateAppPreferences({
                      interface_settings: { ...appPreferences?.interface_settings!, theme: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('Light')}</SelectItem>
                      <SelectItem value="dark">{t('Dark')}</SelectItem>
                      <SelectItem value="system">{t('System')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('Timezone')}</Label>
                  <Select 
                    value={appPreferences?.data_preferences.timezone || 'UTC'}
                    onValueChange={(value) => updateAppPreferences({
                      data_preferences: { ...appPreferences?.data_preferences!, timezone: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Jerusalem">Asia/Jerusalem</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">{t('Currency')}</Label>
                  <Select 
                    value={appPreferences?.data_preferences.currency || 'USD'}
                    onValueChange={(value) => updateAppPreferences({
                      data_preferences: { ...appPreferences?.data_preferences!, currency: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="ILS">ILS (₪)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">{t('UI Preferences')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-center justify-between ${flexRowReverse}`}>
                    <Label htmlFor="animations">{t('Enable Animations')}</Label>
                    <Switch
                      id="animations"
                      checked={appPreferences?.ui_preferences.animations || false}
                      onCheckedChange={(checked) => updateAppPreferences({
                        ui_preferences: { ...appPreferences?.ui_preferences!, animations: checked }
                      })}
                    />
                  </div>

                  <div className={`flex items-center justify-between ${flexRowReverse}`}>
                    <Label htmlFor="sidebar">{t('Collapsed Sidebar')}</Label>
                    <Switch
                      id="sidebar"
                      checked={appPreferences?.ui_preferences.sidebar_collapsed || false}
                      onCheckedChange={(checked) => updateAppPreferences({
                        ui_preferences: { ...appPreferences?.ui_preferences!, sidebar_collapsed: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Settings Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {t('Dashboard Layout')}
              </CardTitle>
              <CardDescription>
                {t('Customize your dashboard layout and widgets')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="view-mode">{t('View Mode')}</Label>
                  <Select 
                    value={dashboardSettings?.layout_preferences.view_mode || 'enhanced'}
                    onValueChange={(value) => updateDashboardSettings({
                      layout_preferences: { ...dashboardSettings?.layout_preferences!, view_mode: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">{t('Compact')}</SelectItem>
                      <SelectItem value="enhanced">{t('Enhanced')}</SelectItem>
                      <SelectItem value="detailed">{t('Detailed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cards-per-row">{t('Cards Per Row')}</Label>
                  <Select 
                    value={dashboardSettings?.layout_preferences.cards_per_row?.toString() || '3'}
                    onValueChange={(value) => updateDashboardSettings({
                      layout_preferences: { ...dashboardSettings?.layout_preferences!, cards_per_row: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={`flex items-center justify-between ${flexRowReverse}`}>
                <Label htmlFor="welcome-tour">{t('Show Welcome Tour')}</Label>
                <Switch
                  id="welcome-tour"
                  checked={dashboardSettings?.layout_preferences.show_welcome_tour || false}
                  onCheckedChange={(checked) => updateDashboardSettings({
                    layout_preferences: { ...dashboardSettings?.layout_preferences!, show_welcome_tour: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('Notification Preferences')}
              </CardTitle>
              <CardDescription>
                {t('Configure how and when you receive notifications')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between ${flexRowReverse}`}>
                  <div>
                    <h4 className="font-medium">{t('Email Notifications')}</h4>
                    <p className="text-sm text-gray-500">{t('Receive updates via email')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email_notifications.enabled || false}
                    onCheckedChange={(checked) => updateNotificationSettings({
                      email_notifications: { ...notificationSettings?.email_notifications!, enabled: checked }
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* WhatsApp Notifications */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between ${flexRowReverse}`}>
                  <div>
                    <h4 className="font-medium">{t('WhatsApp Notifications')}</h4>
                    <p className="text-sm text-gray-500">{t('Receive updates via WhatsApp')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.whatsapp_notifications.enabled || false}
                    onCheckedChange={(checked) => updateNotificationSettings({
                      whatsapp_notifications: { ...notificationSettings?.whatsapp_notifications!, enabled: checked }
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Push Notifications */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between ${flexRowReverse}`}>
                  <div>
                    <h4 className="font-medium">{t('Push Notifications')}</h4>
                    <p className="text-sm text-gray-500">{t('Receive browser notifications')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.push_notifications.enabled || false}
                    onCheckedChange={(checked) => updateNotificationSettings({
                      push_notifications: { ...notificationSettings?.push_notifications!, enabled: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Targets Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('Monthly Targets')}
              </CardTitle>
              <CardDescription>
                {t('Set your performance goals and KPI targets')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leads-target">{t('Leads Target')}</Label>
                  <Input
                    id="leads-target"
                    type="number"
                    value={performanceTargets?.monthly_targets.leads || 0}
                    onChange={(e) => updatePerformanceTargets({
                      monthly_targets: { 
                        ...performanceTargets?.monthly_targets!, 
                        leads: parseInt(e.target.value) || 0 
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversations-target">{t('Conversations Target')}</Label>
                  <Input
                    id="conversations-target"
                    type="number"
                    value={performanceTargets?.monthly_targets.conversations || 0}
                    onChange={(e) => updatePerformanceTargets({
                      monthly_targets: { 
                        ...performanceTargets?.monthly_targets!, 
                        conversations: parseInt(e.target.value) || 0 
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversions-target">{t('Conversions Target')}</Label>
                  <Input
                    id="conversions-target"
                    type="number"
                    value={performanceTargets?.monthly_targets.conversions || 0}
                    onChange={(e) => updatePerformanceTargets({
                      monthly_targets: { 
                        ...performanceTargets?.monthly_targets!, 
                        conversions: parseInt(e.target.value) || 0 
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue-target">{t('Revenue Target')}</Label>
                  <Input
                    id="revenue-target"
                    type="number"
                    value={performanceTargets?.monthly_targets.revenue || 0}
                    onChange={(e) => updatePerformanceTargets({
                      monthly_targets: { 
                        ...performanceTargets?.monthly_targets!, 
                        revenue: parseInt(e.target.value) || 0 
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Settings Tab */}
        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('Queue Management')}
              </CardTitle>
              <CardDescription>
                {t('Configure lead processing queue and business hours')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Hours */}
              <div className="space-y-4">
                <h4 className="font-medium">{t('Business Hours')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">{t('Start Time')}</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={queueSettings?.business_hours_start || '09:00'}
                      onChange={(e) => updateQueueSettings({
                        business_hours_start: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">{t('End Time')}</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={queueSettings?.business_hours_end || '17:00'}
                      onChange={(e) => updateQueueSettings({
                        business_hours_end: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t('Timezone')}</Label>
                    <Select 
                      value={queueSettings?.business_timezone || 'UTC'}
                      onValueChange={(value) => updateQueueSettings({
                        business_timezone: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Jerusalem">Asia/Jerusalem</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Processing Targets */}
              <div className="space-y-4">
                <h4 className="font-medium">{t('Processing Targets')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly-target">{t('Monthly Target')}</Label>
                    <Input
                      id="monthly-target"
                      type="number"
                      value={queueSettings?.target_leads_per_month || 1000}
                      onChange={(e) => updateQueueSettings({
                        target_leads_per_month: parseInt(e.target.value) || 1000
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily-target">{t('Daily Target')}</Label>
                    <Input
                      id="daily-target"
                      type="number"
                      value={queueSettings?.target_leads_per_work_day || 45}
                      onChange={(e) => updateQueueSettings({
                        target_leads_per_work_day: parseInt(e.target.value) || 45
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Automation Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">{t('Automation')}</h4>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${flexRowReverse}`}>
                    <Label htmlFor="auto-queue">{t('Auto Queue Preparation')}</Label>
                    <Switch
                      id="auto-queue"
                      checked={queueSettings?.auto_queue_preparation || false}
                      onCheckedChange={(checked) => updateQueueSettings({
                        auto_queue_preparation: checked
                      })}
                    />
                  </div>

                  <div className={`flex items-center justify-between ${flexRowReverse}`}>
                    <Label htmlFor="auto-start">{t('Auto Start Processing')}</Label>
                    <Switch
                      id="auto-start"
                      checked={queueSettings?.auto_start_processing || false}
                      onCheckedChange={(checked) => updateQueueSettings({
                        auto_start_processing: checked
                      })}
                    />
                  </div>

                  <div className={`flex items-center justify-between ${flexRowReverse}`}>
                    <Label htmlFor="work-days">{t('Work Days Enabled')}</Label>
                    <Switch
                      id="work-days"
                      checked={queueSettings?.work_days_enabled || false}
                      onCheckedChange={(checked) => updateQueueSettings({
                        work_days_enabled: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Status */}
      <div className={`flex items-center justify-center ${flexRowReverse}`}>
        {!hasChanges && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{t('All settings saved')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettingsForm; 