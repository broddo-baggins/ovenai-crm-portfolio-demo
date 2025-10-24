import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Save, RotateCcw, Download, Upload } from 'lucide-react';

interface DashboardSettingsType {
  dashboardName: string;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultWidgetSize: 'small' | 'medium' | 'large';
  gridSpacing: number;
  theme: 'light' | 'dark' | 'auto';
  showWidgetBorders: boolean;
  enableAnimations: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  maxWidgets: number;
}

interface DashboardSettingsProps {
  isOpen: boolean;
  settings: DashboardSettingsType;
  onSave: (settings: DashboardSettingsType) => void;
  onClose: () => void;
  onExportLayout: () => void;
  onImportLayout: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const defaultDashboardSettings: DashboardSettingsType = {
      dashboardName: 'OvenAI Analytics',
  autoSave: true,
  autoSaveInterval: 30,
  defaultWidgetSize: 'medium',
  gridSpacing: 8,
  theme: 'light',
  showWidgetBorders: true,
  enableAnimations: true,
  compactMode: false,
  showTooltips: true,
  maxWidgets: 20
};

const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
  onExportLayout,
  onImportLayout
}) => {
  const [localSettings, setLocalSettings] = useState<DashboardSettingsType>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  // Track changes
  useEffect(() => {
    const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(hasChanged);
  }, [localSettings, settings]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all dashboard settings to default values?'
    );
    if (confirmReset) {
      setLocalSettings(defaultDashboardSettings);
    }
  };

  const updateSetting = (key: keyof DashboardSettingsType, value: unknown) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Settings Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Dashboard Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure global dashboard preferences and behavior
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">General</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dashboardName" className="text-right">
                Dashboard Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="dashboardName"
                  value={localSettings.dashboardName}
                  onChange={(e) => updateSetting('dashboardName', e.target.value)}
                  placeholder="Enter dashboard name"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="theme" className="text-right">
                Theme
              </Label>
              <div className="col-span-3">
                <Select
                  value={localSettings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxWidgets" className="text-right">
                Max Widgets
              </Label>
              <div className="col-span-3">
                <Input
                  id="maxWidgets"
                  type="number"
                  min={1}
                  max={50}
                  value={localSettings.maxWidgets}
                  onChange={(e) => updateSetting('maxWidgets', parseInt(e.target.value) || 20)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Layout Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Layout</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultWidgetSize" className="text-right">
                Default Widget Size
              </Label>
              <div className="col-span-3">
                <Select
                  value={localSettings.defaultWidgetSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => updateSetting('defaultWidgetSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (2x2)</SelectItem>
                    <SelectItem value="medium">Medium (3x3)</SelectItem>
                    <SelectItem value="large">Large (4x4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gridSpacing" className="text-right">
                Grid Spacing
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="gridSpacing"
                  type="number"
                  min={4}
                  max={32}
                  value={localSettings.gridSpacing}
                  onChange={(e) => updateSetting('gridSpacing', parseInt(e.target.value) || 8)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pixels</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="compactMode" className="text-right">
                Compact Mode
              </Label>
              <div className="col-span-3">
                <Switch
                  id="compactMode"
                  checked={localSettings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showWidgetBorders" className="text-right">
                Show Widget Borders
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showWidgetBorders"
                  checked={localSettings.showWidgetBorders}
                  onCheckedChange={(checked) => updateSetting('showWidgetBorders', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Behavior Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Behavior</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="autoSave" className="text-right">
                Auto Save
              </Label>
              <div className="col-span-3">
                <Switch
                  id="autoSave"
                  checked={localSettings.autoSave}
                  onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                />
              </div>
            </div>

            {localSettings.autoSave && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="autoSaveInterval" className="text-right">
                  Auto Save Interval
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="autoSaveInterval"
                    type="number"
                    min={5}
                    max={300}
                    value={localSettings.autoSaveInterval}
                    onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 30)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enableAnimations" className="text-right">
                Enable Animations
              </Label>
              <div className="col-span-3">
                <Switch
                  id="enableAnimations"
                  checked={localSettings.enableAnimations}
                  onCheckedChange={(checked) => updateSetting('enableAnimations', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showTooltips" className="text-right">
                Show Tooltips
              </Label>
              <div className="col-span-3">
                <Switch
                  id="showTooltips"
                  checked={localSettings.showTooltips}
                  onCheckedChange={(checked) => updateSetting('showTooltips', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Import/Export */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Import/Export</h4>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onExportLayout}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Layout
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportLayout}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-dashboard-layout"
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild
                >
                  <label htmlFor="import-dashboard-layout" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Import Layout
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 flex items-center gap-2 ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings; 