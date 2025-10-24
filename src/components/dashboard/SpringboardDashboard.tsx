import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { WidgetConfig } from '@/types/widgets';
import { toast } from "sonner";
import GridWidget from './GridWidget';
import { useLang } from '@/hooks/useLang';
// import logger from '@/services/base/logger'; // Unused import
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, Lock, Settings2 } from 'lucide-react';
import './SpringboardDashboard.css';

interface SpringboardDashboardProps {
  widgets: WidgetConfig[];
  onUpdateWidget: (config: WidgetConfig) => void;
  onRemoveWidget: (id: string) => void;
  onOrganizeWidgets?: () => void;
  onAddWidget: () => void;
  hasUnsavedChangesFromContext: boolean;
}

const SpringboardDashboard: React.FC<SpringboardDashboardProps> = ({
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  onOrganizeWidgets,
  onAddWidget,
  hasUnsavedChangesFromContext: _hasUnsavedChangesFromContext
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [_isDragging, _setIsDragging] = useState(false);
  const [_draggedWidget, _setDraggedWidget] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useLang();

  // Handle scroll position for iOS-like behavior
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Sort widgets by position for mobile layout
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const aPos = a.gridLayout?.y || 0;
      const bPos = b.gridLayout?.y || 0;
      return aPos - bPos;
    });
  }, [widgets]);

  // Handle widget reordering
  const handleWidgetMove = useCallback((widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedWidgets.findIndex(w => w.id === widgetId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedWidgets.length) return;

    const reorderedWidgets = [...sortedWidgets];
    [reorderedWidgets[currentIndex], reorderedWidgets[newIndex]] = 
    [reorderedWidgets[newIndex], reorderedWidgets[currentIndex]];

    // Update grid positions
    reorderedWidgets.forEach((widget, index) => {
      const updatedWidget = {
        ...widget,
        gridLayout: {
          ...widget.gridLayout,
          y: index,
          x: 0, // Always full width on mobile
          w: 1,  // Single column
          h: getWidgetHeight(widget.type)
        }
      };
      onUpdateWidget(updatedWidget);
    });

    toast.success("Widget moved successfully");
  }, [sortedWidgets, onUpdateWidget]);

  // Get optimal height for widget type and CSS class
  const getWidgetHeight = (widgetType: string): number => {
    const heightMap: Record<string, number> = {
      'lead-funnel': 4,
      'temperature-distribution': 3,
      'hourly-activity': 3,
      'property-stats': 3,
      'meetings-vs-messages': 3,
      'lead-temperature': 4,
      'message-hourly-distribution': 3,
      'meetings-set-percentage': 4,
      'conversation-abandoned-with-stage': 3,
      'most-efficient-response-hours': 3,
      'mean-response-time': 2,
      'avg-messages-per-customer': 2,
      'conversations-completed': 2,
      'conversations-abandoned': 2,
      'conversations-started': 2,
      'total-chats': 2,
      'total-leads': 2,
      'reached-leads': 2,
      'messages-sent': 2,
      'interactions': 2,
      'mean-time-to-first-reply': 2,
      'average-messages-per-client': 2
    };
    return heightMap[widgetType] || 2;
  };

  // Get widget type class for styling
  const getWidgetTypeClass = (widgetType: string): string => {
    // Chart widgets per spec
    const chartWidgets = [
      'lead-funnel', 'temperature-distribution', 'hourly-activity', 
      'lead-temperature', 'message-hourly-distribution', 'meetings-vs-messages',
      'conversation-abandoned-with-stage', 'most-efficient-response-hours',
      'meetings-set-percentage'
    ];
    
    // KPI/metric widgets per spec
    const kpiWidgets = [
      'total-chats', 'total-leads', 'reached-leads', 'messages-sent',
      'interactions', 'conversations-completed', 'conversations-abandoned',
      'conversations-started', 'mean-response-time', 'avg-messages-per-customer',
      'mean-time-to-first-reply', 'average-messages-per-client'
    ];

    if (chartWidgets.includes(widgetType)) {
      return 'widget-chart';
    } else if (kpiWidgets.includes(widgetType)) {
      return 'widget-kpi';
    }
    
    return 'widget-default';
  };

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Haptic feedback simulation
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }, [isEditMode]);

  return (
    <div className={`springboard-dashboard ${isEditMode ? 'edit-mode' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <div className="springboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="header-actions">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className="edit-toggle"
            >
              {isEditMode ? <Lock className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              {isEditMode ? 'Done' : 'Edit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div 
        ref={scrollContainerRef}
        className="springboard-content"
        style={{
          paddingTop: `${Math.max(0, scrollPosition * 0.5)}px`, // Parallax effect
        }}
      >
        {/* Widget Grid */}
        <div className="springboard-grid">
          {sortedWidgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`springboard-widget ${getWidgetTypeClass(widget.type)} ${isEditMode ? 'editable' : ''} ${_draggedWidget === widget.id ? 'dragging' : ''}`}
              style={{
                animationDelay: `${index * 0.05}s`, // Staggered animation
              }}
            >
              {/* Edit Mode Controls */}
              {isEditMode && (
                <div className="widget-controls">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWidgetMove(widget.id, 'up')}
                    disabled={index === 0}
                    className="control-btn"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWidgetMove(widget.id, 'down')}
                    disabled={index === sortedWidgets.length - 1}
                    className="control-btn"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveWidget(widget.id)}
                    className="control-btn remove-btn"
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Widget Content */}
              <div className="widget-content">
                <GridWidget
                  config={widget}
                  onUpdate={onUpdateWidget}
                  onRemove={onRemoveWidget}
                  isGlobalLocked={!isEditMode}
                />
              </div>
            </div>
          ))}

          {/* Add Widget Button */}
          <div className="springboard-widget add-widget-tile">
            <Button
              variant="outline"
              size="lg"
              onClick={onAddWidget}
              className="add-widget-btn"
            >
              <Plus className="h-6 w-6 mr-2" />
              Add Widget
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (iOS-like) */}
      {isEditMode && (
        <div className="springboard-bottom-bar">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOrganizeWidgets}
            className="bottom-action"
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Organize
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddWidget}
            className="bottom-action"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Widget
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpringboardDashboard; 