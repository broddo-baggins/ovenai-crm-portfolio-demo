import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // TODO: Use for better layout
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { WidgetType, WidgetSettings as WidgetSettingsType } from '@/types/widgets';

interface WidgetSettingsProps {
  type: WidgetType;
  settings: WidgetSettingsType;
  onChange?: (settings: WidgetSettingsType) => void;
  onClose?: () => void;
}

const WidgetSettings: React.FC<WidgetSettingsProps> = ({
  type,
  settings,
  onChange,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<WidgetSettingsType>(settings);

  // TODO: Add Save/Cancel/Reset buttons to connect these handlers
  // const [hasChanges, setHasChanges] = useState(false);
  
  // Track changes (currently unused until action buttons are added)
  // useEffect(() => {
  //   const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
  //   setHasChanges(hasChanged);
  // }, [localSettings, settings]);

  // TODO: Connect these handlers to action buttons
  // const handleSave = () => {
  //   onSave(localSettings);
  // };

  // const handleCancel = () => {
  //   setLocalSettings(settings);
  //   onClose();
  // };

  // const handleReset = () => {
  //   const defaultSettings: WidgetSettingsType = {
  //     refreshInterval: 30,
  //     showLegend: true,
  //     showTooltip: true,
  //     timeRange: 'week',
  //     displayType: 'chart',
  //     chartType: 'line',
  //     showPercentages: true,
  //     includeArchived: false,
  //     currency: 'USD',
  //     showTrends: true,
  //     calculationMethod: 'average',
  //     includeWeekends: true,
  //     businessHoursOnly: false,
  //     businessHours: {
  //       start: '09:00',
  //       end: '17:00'
  //     }
  //   };
  //   setLocalSettings(defaultSettings);
  // };

  const updateSetting = (key: keyof WidgetSettingsType, value: unknown) => {
    const newSettings = {
      ...localSettings,
      [key]: value
    };
    setLocalSettings(newSettings);
    onChange?.(newSettings);
  };

  // Get widget-specific settings based on type
  const getWidgetSpecificSettings = () => {
    switch (type) {
      case 'lead-funnel':
      case 'meetings-set-percentage':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Funnel Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showPercentages" className="text-right">
                Show Percentages
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showPercentages"
                  checked={localSettings.showPercentages || false}
                  onCheckedChange={(checked) => updateSetting('showPercentages', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="funnelStages" className="text-right">
                Funnel Stages
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="funnelStages"
                  placeholder="Enter stages separated by commas (e.g., Lead, Qualified, Meeting, Closed)"
                  value={localSettings.funnelStages?.join(', ') || 'Lead, Qualified, Meeting, Closed'}
                  onChange={(e) => updateSetting('funnelStages', e.target.value.split(',').map(s => s.trim()))}
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showConversionRates" className="text-right">
                Show Conversion Rates
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showConversionRates"
                  checked={localSettings.showConversionRates || true}
                  onCheckedChange={(checked) => updateSetting('showConversionRates', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'temperature-distribution':
      case 'lead-temperature':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Temperature Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showInactive" className="text-right">
                Show Inactive
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showInactive"
                  checked={localSettings.showInactive || false}
                  onCheckedChange={(checked) => updateSetting('showInactive', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperatureLevels" className="text-right">
                Temperature Levels
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="temperatureLevels"
                  placeholder="Enter levels separated by commas (e.g., Cold, Warm, Hot, Burning)"
                  value={localSettings.temperatureLevels?.join(', ') || ''}
                  onChange={(e) => updateSetting('temperatureLevels', e.target.value.split(',').map(s => s.trim()))}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>
        );

      case 'hourly-activity':
      case 'message-hourly-distribution':
      case 'most-efficient-response-hours':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Time-based Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessHoursOnly" className="text-right">
                Business Hours Only
              </Label>
              <div className="col-span-3">
                <Switch
                  id="businessHoursOnly"
                  checked={localSettings.businessHoursOnly || false}
                  onCheckedChange={(checked) => updateSetting('businessHoursOnly', checked)}
                />
              </div>
            </div>

            {localSettings.businessHoursOnly && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="businessStart" className="text-right">
                    Start Time
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="businessStart"
                      type="time"
                      value={localSettings.businessHours?.start || '09:00'}
                      onChange={(e) => updateSetting('businessHours', {
                        ...localSettings.businessHours,
                        start: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="businessEnd" className="text-right">
                    End Time
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="businessEnd"
                      type="time"
                      value={localSettings.businessHours?.end || '17:00'}
                      onChange={(e) => updateSetting('businessHours', {
                        ...localSettings.businessHours,
                        end: e.target.value
                      })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="includeWeekends" className="text-right">
                Include Weekends
              </Label>
              <div className="col-span-3">
                <Switch
                  id="includeWeekends"
                  checked={localSettings.includeWeekends || false}
                  onCheckedChange={(checked) => updateSetting('includeWeekends', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'mean-response-time':
      case 'mean-time-to-first-reply':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Response Time Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responseTimeUnit" className="text-right">
                Time Unit
              </Label>
              <div className="col-span-3">
                <Select
                  value={localSettings.responseTimeUnit || 'minutes'}
                  onValueChange={(value: 'minutes' | 'hours' | 'days') => updateSetting('responseTimeUnit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warningThreshold" className="text-right">
                Warning Threshold
              </Label>
              <div className="col-span-3">
                <Input
                  id="warningThreshold"
                  type="number"
                  min={1}
                  value={localSettings.warningThreshold || ''}
                  onChange={(e) => updateSetting('warningThreshold', parseInt(e.target.value) || undefined)}
                  placeholder="Enter warning threshold"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="criticalThreshold" className="text-right">
                Critical Threshold
              </Label>
              <div className="col-span-3">
                <Input
                  id="criticalThreshold"
                  type="number"
                  min={1}
                  value={localSettings.criticalThreshold || ''}
                  onChange={(e) => updateSetting('criticalThreshold', parseInt(e.target.value) || undefined)}
                  placeholder="Enter critical threshold"
                />
              </div>
            </div>
          </div>
        );

      case 'property-stats':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Property Settings</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <div className="col-span-3">
                <Select
                  value={localSettings.currency || 'USD'}
                  onValueChange={(value) => updateSetting('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showTrends" className="text-right">
                Show Trends
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showTrends"
                  checked={localSettings.showTrends || false}
                  onCheckedChange={(checked) => updateSetting('showTrends', checked)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Common Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">General Settings</h4>
        
        {/* Custom Title */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customTitle" className="text-right">
            Custom Title
          </Label>
          <div className="col-span-3">
            <Input
              id="customTitle"
              value={localSettings.customTitle || ''}
              onChange={(e) => updateSetting('customTitle', e.target.value)}
              placeholder="Enter custom widget title"
            />
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="refreshInterval" className="text-right">
            Refresh Interval
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id="refreshInterval"
              type="number"
              min={5}
              max={3600}
              value={localSettings.refreshInterval}
              onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 30)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">seconds</span>
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="timeRange" className="text-right">
            Time Range
          </Label>
          <div className="col-span-3">
            <Select
              value={localSettings.timeRange || 'week'}
              onValueChange={(value: 'today' | 'week' | 'month' | 'year' | 'custom') => updateSetting('timeRange', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last 365 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Display Type */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="displayType" className="text-right">
            Display Type
          </Label>
          <div className="col-span-3">
            <Select
              value={localSettings.displayType || 'chart'}
              onValueChange={(value: 'chart' | 'table' | 'card' | 'gauge') => updateSetting('displayType', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="gauge">Gauge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Type (if display type is chart) */}
        {localSettings.displayType === 'chart' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chartType" className="text-right">
              Chart Type
            </Label>
            <div className="col-span-3">
              <Select
                value={localSettings.chartType || 'line'}
                onValueChange={(value: 'line' | 'bar' | 'pie' | 'area') => updateSetting('chartType', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Show Legend */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="showLegend" className="text-right">
            Show Legend
          </Label>
          <div className="col-span-3">
            <Switch
              id="showLegend"
              checked={localSettings.showLegend}
              onCheckedChange={(checked) => updateSetting('showLegend', checked)}
            />
          </div>
        </div>

        {/* Show Tooltip */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="showTooltip" className="text-right">
            Show Tooltip
          </Label>
          <div className="col-span-3">
            <Switch
              id="showTooltip"
              checked={localSettings.showTooltip}
              onCheckedChange={(checked) => updateSetting('showTooltip', checked)}
            />
          </div>
        </div>
      </div>

      {/* Widget-specific Settings */}
      {getWidgetSpecificSettings() && (
        <>
          <Separator />
          {getWidgetSpecificSettings()}
        </>
      )}
    </div>
  );
};

export default WidgetSettings; 