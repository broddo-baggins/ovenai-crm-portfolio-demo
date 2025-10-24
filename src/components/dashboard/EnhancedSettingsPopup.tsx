import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Save, RotateCcw } from 'lucide-react';
import { WidgetType, WidgetSettings as WidgetSettingsType, GridLayout } from '@/types/widgets';
import WidgetSettings from './WidgetSettings';

interface EnhancedSettingsPopupProps {
  isOpen: boolean;
  widgetType: WidgetType;
  widgetTitle: string;
  settings: WidgetSettingsType;
  gridLayout: GridLayout;
  onSave: (settings: WidgetSettingsType, gridLayout: GridLayout) => void;
  onClose: () => void;
}

const EnhancedSettingsPopup: React.FC<EnhancedSettingsPopupProps> = ({
  isOpen,
  widgetType,
  widgetTitle,
  settings,
  gridLayout,
  onSave,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<WidgetSettingsType>(settings);
  const [localLayout, setLocalLayout] = useState<GridLayout>(gridLayout);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalSettings(settings);
    setLocalLayout(gridLayout);
    setHasChanges(false);
  }, [settings, gridLayout, isOpen]);

  // Track changes in both settings and layout
  useEffect(() => {
    const settingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
    const layoutChanged = JSON.stringify(localLayout) !== JSON.stringify(gridLayout);
    setHasChanges(settingsChanged || layoutChanged);
  }, [localSettings, localLayout, settings, gridLayout]);

  // Listen for external layout changes (e.g., resize)
  useEffect(() => {
    if (JSON.stringify(localLayout) !== JSON.stringify(gridLayout)) {
      setLocalLayout(gridLayout);
    }
  }, [gridLayout]);

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
    onSave(localSettings, localLayout);
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
    setLocalLayout(gridLayout);
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
      'Are you sure you want to reset all settings to default values?'
    );
    if (confirmReset) {
      const defaultSettings: WidgetSettingsType = {
        refreshInterval: 30,
        showLegend: true,
        showTooltip: true,
        timeRange: 'week',
        displayType: 'chart',
        chartType: 'line',
        showPercentages: true,
        includeArchived: false,
        currency: 'USD',
        showTrends: true,
        calculationMethod: 'average',
        includeWeekends: true,
        businessHoursOnly: false,
        businessHours: {
          start: '09:00',
          end: '17:00'
        }
      };
      setLocalSettings(defaultSettings);
      setLocalLayout(gridLayout);
    }
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
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Widget Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure settings for <span className="font-medium">{widgetTitle}</span>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <WidgetSettings
            type={widgetType}
            settings={localSettings}
            onChange={setLocalSettings}
            onClose={() => {}} // We handle closing at this level
          />
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

export default EnhancedSettingsPopup; 