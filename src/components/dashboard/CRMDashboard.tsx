import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useDashboard } from '@/context/DashboardContext';
import GridDashboard from './GridDashboard';
import WidgetLibrary from './WidgetLibrary';
import { trackEvent, trackUserAction, trackEngagement } from '@/utils/combined-analytics';

const CRMDashboard: React.FC = () => {
  const {
    widgets,
    addWidget,
    updateWidget,
    removeWidget,
    loadLayout,
    organizeWidgets,
    hasUnsavedChanges
  } = useDashboard();

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  // Load saved layout on component mount - only run once
  useEffect(() => {
    loadLayout();
    
    // Track dashboard view
    trackEvent('dashboard_view', 'navigation', 'crm_dashboard');
    trackEngagement('dashboard_loaded', { 
      dashboard_type: 'crm',
      widget_count: widgets.length 
    });
  }, []); // Empty dependency array - only run on mount

  // Track widget changes
  useEffect(() => {
    if (widgets.length > 0) {
      trackEngagement('dashboard_widgets_updated', { 
        widget_count: widgets.length,
        widget_types: widgets.map(w => w.type)
      });
    }
  }, [widgets.length]);

  const handleAddWidget = (type: any) => {
    console.log('CRMDashboard: handleAddWidget called with type:', type);
    try {
      addWidget(type);
      
      // Track widget addition
      trackEvent('widget_added', 'dashboard', type.toString());
      trackUserAction('widget_add', { 
        widget_type: type,
        total_widgets: widgets.length + 1 
      });
      
      toast.success("Widget added to dashboard!");
    } catch (error) {
      console.error('Error in handleAddWidget:', error);
      
      // Track widget addition error
      trackEvent('widget_add_error', 'dashboard', type.toString(), 1, {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error("Failed to add widget to dashboard!");
    }
  };

  const handleRemoveWidget = (id: string) => {
    const widgetToRemove = widgets.find(w => w.id === id);
    
    removeWidget(id);
    
    // Track widget removal
    trackEvent('widget_removed', 'dashboard', widgetToRemove?.type || 'unknown');
    trackUserAction('widget_remove', { 
      widget_id: id,
      widget_type: widgetToRemove?.type,
      total_widgets: widgets.length - 1 
    });
    
    toast.success("Widget removed from dashboard!");
  };

  const handleOrganizeWidgets = () => {
    organizeWidgets();
    
    // Track widget organization
    trackEvent('widgets_organized', 'dashboard', 'fifo_order');
    trackUserAction('dashboard_organize', { 
      organization_type: 'fifo',
      widget_count: widgets.length 
    });
    
    toast.success("Widgets organized in FIFO order!");
  };

  const handleShowWidgetLibrary = () => {
    setShowWidgetLibrary(true);
    
    // Track widget library opening
    trackEvent('widget_library_opened', 'dashboard', 'widget_add_flow');
    trackUserAction('widget_library_open', { current_widget_count: widgets.length });
  };

  const handleCloseWidgetLibrary = () => {
    setShowWidgetLibrary(false);
    
    // Track widget library closing
    trackEvent('widget_library_closed', 'dashboard', 'widget_add_flow');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Simplified Header */}
        <div className="mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor your customer relationship metrics and performance</p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <GridDashboard
          widgets={widgets}
          onUpdateWidget={updateWidget}
          onRemoveWidget={handleRemoveWidget}
          onOrganizeWidgets={handleOrganizeWidgets}
          onAddWidget={handleShowWidgetLibrary}
          hasUnsavedChangesFromContext={hasUnsavedChanges}
        />

        {/* Widget Library Modal */}
        {showWidgetLibrary && (
          <WidgetLibrary
            onAddWidget={handleAddWidget}
            onClose={handleCloseWidgetLibrary}
          />
        )}
      </div>
    </div>
  );
};

export default CRMDashboard; 