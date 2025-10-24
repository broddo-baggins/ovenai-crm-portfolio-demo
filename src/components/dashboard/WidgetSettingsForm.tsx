import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { WidgetSettings as WidgetSettingsType, WidgetConfig } from '@/types/widgets';
import { Save, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";

interface WidgetSettingsFormProps {
  config: WidgetConfig;
  onSubmit: (updatedConfig: WidgetConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}

const WidgetSettingsForm: React.FC<WidgetSettingsFormProps> = ({
  config,
  onSubmit,
  onDelete,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<WidgetSettingsType>(() => {
    // Ensure we have a complete settings object with defaults
    const defaultSettings: WidgetSettingsType = {
      refreshInterval: 30,
      showLegend: true,
      showTooltip: true,
      timeRange: 'week',
      displayType: 'chart',
      chartType: 'line',
      showPercentages: false,
      includeArchived: false,
      currency: 'USD',
      showTrends: true,
      calculationMethod: 'average',
      includeWeekends: true,
      businessHoursOnly: false,
      businessHours: {
        start: '09:00',
        end: '17:00'
      },
      customTitle: config.title,
      showInactive: false
    };
    
    // Merge config settings with defaults to ensure all properties exist
    return { ...defaultSettings, ...config.settings };
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation(['widgets', 'common']);

  // Track changes with deep comparison
  useEffect(() => {
    const currentSettingsString = JSON.stringify(localSettings);
    const originalSettingsString = JSON.stringify({
      refreshInterval: 30,
      showLegend: true,
      showTooltip: true,
      timeRange: 'week',
      displayType: 'chart',
      chartType: 'line',
      showPercentages: false,
      includeArchived: false,
      currency: 'USD',
      showTrends: true,
      calculationMethod: 'average',
      includeWeekends: true,
      businessHoursOnly: false,
      businessHours: {
        start: '09:00',
        end: '17:00'
      },
      customTitle: config.title,
      showInactive: false,
      ...config.settings
    });
    
    const hasChanged = currentSettingsString !== originalSettingsString;
    setHasChanges(hasChanged);
    
    console.log('WidgetSettingsForm: Settings changed:', hasChanged);
    console.log('Current settings:', localSettings);
    console.log('Original settings:', config.settings);
  }, [localSettings, config.settings, config.title]);

  const updateSetting = (key: keyof WidgetSettingsType, value: unknown) => {
    console.log(`WidgetSettingsForm: Updating setting ${key} to:`, value);
    setLocalSettings(prev => {
      const updated = {
        ...prev,
        [key]: value
      };
      console.log('WidgetSettingsForm: Updated local settings:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      console.log('WidgetSettingsForm: No changes to save');
      onClose();
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('WidgetSettingsForm: Saving widget settings...');
      console.log('Widget ID:', config.id);
      console.log('Settings to save:', localSettings);
      
      // Create updated config with new settings
      const updatedConfig: WidgetConfig = {
        ...config,
        settings: { 
          ...localSettings,
          // Ensure customTitle is included in settings
          customTitle: localSettings.customTitle || config.title
        },
        // Update title if custom title is set
        title: localSettings.customTitle || config.title
      };
      
      console.log('WidgetSettingsForm: Updated config:', updatedConfig);
      
      // Call the onSubmit callback
      onSubmit(updatedConfig);
      
      // Show success message
      toast.success('Widget settings saved successfully!');
      
      // Close the settings form
      onClose();
      
    } catch (error) {
      console.error('WidgetSettingsForm: Error saving settings:', error);
      toast.error('Failed to save widget settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('WidgetSettingsForm: Cancelling changes');
    // Reset to original settings
    const defaultSettings: WidgetSettingsType = {
      refreshInterval: 30,
      showLegend: true,
      showTooltip: true,
      timeRange: 'week',
      displayType: 'chart',
      chartType: 'line',
      showPercentages: false,
      includeArchived: false,
      currency: 'USD',
      showTrends: true,
      calculationMethod: 'average',
      includeWeekends: true,
      businessHoursOnly: false,
      businessHours: {
        start: '09:00',
        end: '17:00'
      },
      customTitle: config.title,
      showInactive: false
    };
    
    setLocalSettings({ ...defaultSettings, ...config.settings });
    setHasChanges(false);
    onClose();
  };

  // Get essential settings for popover (compact view)
  const getEssentialSettings = () => {
    const commonSettings = (
      <>
        {/* Custom Title */}
        <div className="space-y-2">
          <Label htmlFor="customTitle" className="text-sm font-medium">
            {t('widgets:settings.customTitle')}
          </Label>
          <Input
            id="customTitle"
            value={localSettings.customTitle || config.title}
            onChange={(e) => updateSetting('customTitle', e.target.value)}
            placeholder={t('widgets:settings.customTitle')}
            className="h-8"
          />
        </div>

        {/* Refresh Interval */}
        <div className="space-y-2">
          <Label htmlFor="refreshInterval" className="text-sm font-medium">
            {t('widgets:settings.refreshInterval')}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="refreshInterval"
              type="number"
              min={5}
              max={3600}
              value={localSettings.refreshInterval}
              onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 30)}
              className="h-8 w-20"
            />
            <span className="text-xs text-muted-foreground">{t('widgets:settings.seconds')}</span>
          </div>
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <Label htmlFor="timeRange" className="text-sm font-medium">
            {t('widgets:settings.timeRange')}
          </Label>
          <Select
            value={localSettings.timeRange || 'week'}
            onValueChange={(value: 'today' | 'week' | 'month' | 'year' | 'custom') => updateSetting('timeRange', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={t('widgets:settings.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('widgets:settings.timeRanges.today')}</SelectItem>
              <SelectItem value="week">{t('widgets:settings.timeRanges.week')}</SelectItem>
              <SelectItem value="month">{t('widgets:settings.timeRanges.month')}</SelectItem>
              <SelectItem value="year">{t('widgets:settings.timeRanges.year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Options */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showLegend" className="text-sm font-medium">
            {t('widgets:settings.showLegend')}
          </Label>
          <Switch
            id="showLegend"
            checked={localSettings.showLegend}
            onCheckedChange={(checked) => updateSetting('showLegend', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showTooltip" className="text-sm font-medium">
            {t('widgets:settings.showTooltip')}
          </Label>
          <Switch
            id="showTooltip"
            checked={localSettings.showTooltip}
            onCheckedChange={(checked) => updateSetting('showTooltip', checked)}
          />
        </div>
      </>
    );

    // Widget-specific settings (compact versions)
    const widgetSpecific = (() => {
      switch (config.type) {
        case 'lead-funnel':
        case 'meetings-set-percentage':
          return (
            <div className="flex items-center justify-between">
              <Label htmlFor="showPercentages" className="text-sm font-medium">
                {t('widgets:settings.showPercentages')}
              </Label>
              <Switch
                id="showPercentages"
                checked={localSettings.showPercentages || false}
                onCheckedChange={(checked) => updateSetting('showPercentages', checked)}
              />
            </div>
          );

        case 'temperature-distribution':
        case 'lead-temperature':
          return (
            <div className="flex items-center justify-between">
              <Label htmlFor="showInactive" className="text-sm font-medium">
                {t('widgets:settings.showInactive')}
              </Label>
              <Switch
                id="showInactive"
                checked={localSettings.showInactive || false}
                onCheckedChange={(checked) => updateSetting('showInactive', checked)}
              />
            </div>
          );

        case 'property-stats':
          return (
            <>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  {t('widgets:settings.currency')}
                </Label>
                <Select
                  value={localSettings.currency || 'USD'}
                  onValueChange={(value) => updateSetting('currency', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t('widgets:settings.currency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showTrends" className="text-sm font-medium">
                  {t('widgets:settings.showTrends')}
                </Label>
                <Switch
                  id="showTrends"
                  checked={localSettings.showTrends || false}
                  onCheckedChange={(checked) => updateSetting('showTrends', checked)}
                />
              </div>
            </>
          );

        default:
          return null;
      }
    })();

    return (
      <div className="space-y-4">
        {commonSettings}
        {widgetSpecific && (
          <>
            <Separator />
            {widgetSpecific}
          </>
        )}
      </div>
    );
  };

  // All widgets are now removable - removed base widget restriction

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{t('widgets:settings.title')}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Settings Form */}
      {getEssentialSettings()}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          {/* Remove button - now available for all widgets */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {t('widgets:settings.remove')}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="h-8 px-3"
          >
            {t('widgets:settings.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="h-8 px-3"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Saving...' : t('widgets:settings.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsForm; 