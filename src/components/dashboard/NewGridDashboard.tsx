import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetConfig } from '@/types/widgets';
import { toast } from "sonner";
import GridWidget from './GridWidget';
import NewDashboardToolbar from './NewDashboardToolbar';
import CollisionSuggestion from './CollisionSuggestion';
import { useLang } from '@/hooks/useLang';
import logger from '@/services/base/logger';
import { WidgetSizeCalculator } from '@/utils/widgetSizeCalculator';
import { CollisionDetector, TouchingPair, OverlapAnalysis, CollisionDetectorOptions } from '@/utils/collisionDetector';
import { SmartSeparation } from '@/utils/smartSeparation';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './NewGridDashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface NewGridDashboardProps {
  widgets: WidgetConfig[];
  onUpdateWidget: (config: WidgetConfig) => void;
  onRemoveWidget: (id: string) => void;
  onOrganizeWidgets?: () => void;
  onAddWidget: () => void;
  hasUnsavedChangesFromContext: boolean;
}

const NewGridDashboard: React.FC<NewGridDashboardProps> = ({
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  onOrganizeWidgets,
  onAddWidget,
  hasUnsavedChangesFromContext
}) => {
  const [isGlobalLocked, setIsGlobalLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [recentlyInteracted, setRecentlyInteracted] = useState<Set<string>>(new Set());
  const [overlappingWidgets, setOverlappingWidgets] = useState<Set<string>>(new Set());
  const [collisionAnalysis, setCollisionAnalysis] = useState<OverlapAnalysis | null>(null);
  const [showCollisionSuggestion, setShowCollisionSuggestion] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [resizeMode, setResizeMode] = useState<'minimal' | 'optimal' | 'content-optimized'>('optimal');
  const { isRTL } = useLang();

  // Apple Widget Size Standards for responsive design
  const getAppleWidgetSize = (sizeType: 'small' | 'medium' | 'large', breakpoint: string) => {
    const sizeMap = {
      small: {
        lg: { w: 4, h: 3 }, // Large screen small widget
        md: { w: 3, h: 3 }, // Medium screen
        sm: { w: 3, h: 2 }, // Tablet
        xs: { w: 2, h: 2 }, // Large mobile
        xxs: { w: 2, h: 2 } // Small mobile
      },
      medium: {
        lg: { w: 6, h: 4 }, // Large screen medium widget
        md: { w: 5, h: 4 }, // Medium screen
        sm: { w: 4, h: 3 }, // Tablet
        xs: { w: 3, h: 3 }, // Large mobile
        xxs: { w: 2, h: 3 } // Small mobile (tall)
      },
      large: {
        lg: { w: 8, h: 6 }, // Large screen large widget
        md: { w: 6, h: 5 }, // Medium screen
        sm: { w: 6, h: 4 }, // Tablet
        xs: { w: 4, h: 4 }, // Large mobile
        xxs: { w: 4, h: 3 } // Small mobile
      }
    };
    return sizeMap[sizeType][breakpoint as keyof typeof sizeMap.small] || sizeMap[sizeType].lg;
  };

  // Detect current breakpoint
  const _getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 'lg';
    if (width >= 996) return 'md';
    if (width >= 768) return 'sm';
    if (width >= 480) return 'xs';
    return 'xxs';
  };

  // Add collision detection options with sensible defaults
  const collisionDetectorOptions: CollisionDetectorOptions = {
    minSpacingThreshold: 0.5, // Only flag widgets that are less than 0.5 grid units apart
    ignoreDiagonalTouching: true, // Ignore corner touches
    considerVisualSpacing: true // Account for visual margins
  };

  // Analyze layout for collisions and spacing issues
  const analyzeLayoutCollisions = useCallback(() => {
    const now = Date.now();
    // Throttle analysis to avoid excessive computation
    if (now - lastAnalysisTime < 500) return;
    
    const analysis = CollisionDetector.analyzeLayout(widgets, collisionDetectorOptions);
    setCollisionAnalysis(analysis);
    setLastAnalysisTime(now);
    
    // Update overlapping widgets state for visual feedback
    const overlappingIds = new Set<string>();
    analysis.overlappingPairs.forEach(pair => {
      overlappingIds.add(pair.widget1.id);
      overlappingIds.add(pair.widget2.id);
    });
    
    // Only mark widgets as overlapping if they're truly touching (not just close)
    analysis.touchingPairs.forEach(pair => {
      // Double-check with stricter criteria
      if (CollisionDetector.areWidgetsTouching(pair.widget1, pair.widget2, { minSpacingThreshold: 0 })) {
        overlappingIds.add(pair.widget1.id);
        overlappingIds.add(pair.widget2.id);
      }
    });
    setOverlappingWidgets(overlappingIds);
    
    // Show collision suggestion if there are issues and user isn't currently interacting
    if (analysis.totalIssues > 0 && !isDragging && !isResizing) {
      setShowCollisionSuggestion(true);
    }
  }, [widgets, lastAnalysisTime, isDragging, isResizing, collisionDetectorOptions]);

  // Auto-analyze layout when widgets change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(analyzeLayoutCollisions, 1000);
    return () => clearTimeout(timeoutId);
  }, [widgets, analyzeLayoutCollisions]);

  // Convert widgets to grid layout format with enhanced lock handling
  const layouts = useMemo(() => {
    const createLayoutForBreakpoint = (breakpoint: string) => {
      return widgets.map(widget => {
        if (!widget.gridLayout) {
          logger.warn('Widget missing gridLayout', 'NewGridDashboard', { widget });
          const size = getAppleWidgetSize('small', breakpoint);
          return {
            i: widget.id,
            x: 0,
            y: 0,
            w: size.w,
            h: size.h,
            minW: 1,
            minH: 1,
            maxW: breakpoint === 'xxs' ? 4 : 12,
            maxH: 8,
            static: isGlobalLocked,
            isDraggable: !isGlobalLocked,
            isResizable: !isGlobalLocked
          };
        }

        // Determine widget size category based on current dimensions
        let sizeType: 'small' | 'medium' | 'large' = 'medium';
        const area = widget.gridLayout.w * widget.gridLayout.h;
        if (area <= 6) sizeType = 'small';
        else if (area >= 20) sizeType = 'large';

        const responsiveSize = getAppleWidgetSize(sizeType, breakpoint);

        return {
          i: widget.id,
          x: widget.gridLayout.x,
          y: widget.gridLayout.y,
          w: responsiveSize.w,
          h: responsiveSize.h,
          minW: 1,
          minH: 1,
          maxW: breakpoint === 'xxs' ? 4 : (breakpoint === 'xs' ? 6 : 12),
          maxH: 8,
          static: isGlobalLocked,
          isDraggable: !isGlobalLocked,
          isResizable: !isGlobalLocked
        };
      });
    };

    return {
      lg: createLayoutForBreakpoint('lg'),
      md: createLayoutForBreakpoint('md'),
      sm: createLayoutForBreakpoint('sm'),
      xs: createLayoutForBreakpoint('xs'),
      xxs: createLayoutForBreakpoint('xxs')
    };
  }, [widgets, isGlobalLocked, getAppleWidgetSize]);

  // Free movement layout change handler - no forced compacting
  const onLayoutChange = useCallback((layout: Layout[]) => {
    if (isGlobalLocked) {
      logger.warn('Layout change blocked - dashboard is globally locked', 'NewGridDashboard');
      return;
    }
    
    logger.info('Layout change triggered in NewGridDashboard (free movement)', 'NewGridDashboard', { layoutCount: layout.length });
    const layoutMap = new Map(layout.map(item => [item.i, item]));
    const updatedWidgets: WidgetConfig[] = [];

    widgets.forEach(widget => {
      const layoutItem = layoutMap.get(widget.id);
      if (layoutItem && widget.gridLayout) {
        // Free positioning - allow exact placement like Android
        const freeLayout = {
          x: Math.round(layoutItem.x), // Still snap to grid units for consistency
          y: Math.round(layoutItem.y),
          w: Math.max(Math.round(layoutItem.w), widget.gridLayout.minW || 2),
          h: Math.max(Math.round(layoutItem.h), widget.gridLayout.minH || 2)
        };

        // Update if there's any change (triggers save state)
        if (
          widget.gridLayout.x !== freeLayout.x ||
          widget.gridLayout.y !== freeLayout.y ||
          widget.gridLayout.w !== freeLayout.w ||
          widget.gridLayout.h !== freeLayout.h
        ) {
          const updatedWidget = {
            ...widget,
            gridLayout: {
              ...widget.gridLayout,
              ...freeLayout
            }
          };
          updatedWidgets.push(updatedWidget);
        }
      }
    });

    if (updatedWidgets.length > 0) {
      logger.info('NewGridDashboard: Free movement update for widgets - save state will be triggered', 'NewGridDashboard', { widgetCount: updatedWidgets.length });
      updatedWidgets.forEach(widget => onUpdateWidget(widget));
    }
  }, [widgets, onUpdateWidget, isGlobalLocked]);

  // Enhanced drag handlers with visual feedback and collision analysis
  const onDragStart = useCallback((layout: Layout[], oldItem: Layout) => {
    logger.debug('Drag started for widget', 'NewGridDashboard', { widgetId: oldItem.i });
    if (isGlobalLocked) return;
    setIsDragging(true);
    setShowGrid(true);
    setShowCollisionSuggestion(false); // Hide suggestions during interaction
    
    // Mark widget as recently interacted
    setRecentlyInteracted(prev => new Set([...prev, oldItem.i]));
  }, [isGlobalLocked]);

  const onDragStop = useCallback((layout: Layout[], oldItem: Layout) => {
    logger.debug('Drag stopped for widget', 'NewGridDashboard', { widgetId: oldItem.i });
    setIsDragging(false);
    setShowGrid(false);
    
    // Trigger collision analysis after drag
    setTimeout(analyzeLayoutCollisions, 300);
    
    // Clear recently interacted after a delay
    setTimeout(() => {
      setRecentlyInteracted(prev => {
        const newSet = new Set(prev);
        newSet.delete(oldItem.i);
        return newSet;
      });
    }, 2000);
  }, [analyzeLayoutCollisions]);

  // Enhanced resize handlers with visual feedback
  const onResizeStart = useCallback((layout: Layout[], oldItem: Layout) => {
    logger.debug('Resize started for widget', 'NewGridDashboard', { widgetId: oldItem.i });
    if (isGlobalLocked) return;
    setIsResizing(true);
    setShowGrid(true);
    setShowCollisionSuggestion(false); // Hide suggestions during interaction
  }, [isGlobalLocked]);

  const onResizeStop = useCallback((layout: Layout[], oldItem: Layout) => {
    logger.debug('Resize stopped for widget', 'NewGridDashboard', { widgetId: oldItem.i });
    setIsResizing(false);
    setShowGrid(false);
    
    // Trigger collision analysis after resize
    setTimeout(analyzeLayoutCollisions, 300);
  }, [analyzeLayoutCollisions]);

  // Toggle global lock/unlock with enhanced feedback
  const toggleGlobalLock = useCallback(() => {
    const newLockState = !isGlobalLocked;
    setIsGlobalLocked(newLockState);
    
    if (newLockState) {
      toast.info("🔒 Dashboard locked - all widgets are now fixed in position");
      setShowCollisionSuggestion(false); // Hide suggestions when locked
    } else {
      toast.info("🔓 Dashboard unlocked - you can now move and resize widgets");
      // Re-analyze after unlocking
      setTimeout(analyzeLayoutCollisions, 100);
    }
  }, [isGlobalLocked, analyzeLayoutCollisions]);

  // Enhanced auto-resize widgets with three-stage toggle and content analysis
  const autoResizeWidgets = useCallback(() => {
    const currentMode = resizeMode;
    const nextMode = WidgetSizeCalculator.getNextResizeMode(currentMode);
    
    // Get widget data map for content analysis (placeholder for now)
    const widgetDataMap: Record<string, unknown> = {};
    // TODO: In a real implementation, this would come from widget data fetching
    
    const { resizedWidgets, changeCount } = WidgetSizeCalculator.batchResizeWidgets(
      widgets,
      nextMode,
      widgetDataMap
    );
    
    // Apply the resize changes
    resizedWidgets.forEach(widget => onUpdateWidget(widget));
    
    // Update resize mode state
    setResizeMode(nextMode);
    
    // Provide user feedback
    const modeDescriptions = {
      'minimal': 'smallest',
      'optimal': 'recommended',
      'content-optimized': 'content-optimized'
    };
    
    if (changeCount > 0) {
      toast.success(
        `📐 Resized ${changeCount} widgets to ${modeDescriptions[nextMode]} size.`,
        {
          description: `Mode: ${nextMode.replace('-', ' ')} • ${WidgetSizeCalculator.getResizeModes().find(m => m.mode === nextMode)?.description}`
        }
      );
      
      // Re-analyze layout after resize
      setTimeout(analyzeLayoutCollisions, 500);
    } else {
      toast.info(
        `All widgets are already at their ${modeDescriptions[nextMode]} size.`,
        {
          description: `Current mode: ${nextMode.replace('-', ' ')}`
        }
      );
    }
  }, [widgets, onUpdateWidget, resizeMode, analyzeLayoutCollisions]);

  // Handle separation of a specific touching pair
  const handleAcceptSeparation = useCallback((pair: TouchingPair) => {
    const options = SmartSeparation.getOptimalSeparationOptions(widgets);
    const result = SmartSeparation.separateWidgets(
      pair.widget1,
      pair.widget2,
      widgets,
      options
    );
    
    if (result.success) {
      // Apply the separation
      result.updatedWidgets.forEach(widget => {
        if (result.affectedWidgets.includes(widget.id)) {
          onUpdateWidget(widget);
        }
      });
      
      toast.success(
        `SPARKLE Separated ${pair.widget1.title} and ${pair.widget2.title}`,
        {
          description: result.message
        }
      );
      
      // Re-analyze layout
      setTimeout(analyzeLayoutCollisions, 300);
    } else {
      toast.error('Failed to separate widgets', {
        description: result.message
      });
    }
  }, [widgets, onUpdateWidget, analyzeLayoutCollisions]);

  // Handle separation of all touching widgets
  const handleSeparateAll = useCallback(() => {
    const options = SmartSeparation.getOptimalSeparationOptions(widgets);
    const result = SmartSeparation.separateAllTouchingWidgets(widgets, options);
    
    if (result.success) {
      // Apply all separations
      result.updatedWidgets.forEach(widget => {
        if (result.affectedWidgets.includes(widget.id)) {
          onUpdateWidget(widget);
        }
      });
      
      toast.success(
        `SPARKLE Separated all touching widgets`,
        {
          description: result.message
        }
      );
      
      setShowCollisionSuggestion(false); // Hide the suggestion
      setTimeout(analyzeLayoutCollisions, 500);
    } else {
      toast.error('Failed to separate all widgets', {
        description: result.message
      });
    }
  }, [widgets, onUpdateWidget, analyzeLayoutCollisions]);

  // Dismiss collision suggestions
  const handleDismissCollisionSuggestion = useCallback(() => {
    setShowCollisionSuggestion(false);
  }, []);

  // Mouse enter/leave handlers for grid visibility
  const handleMouseEnter = useCallback(() => {
    if (!isGlobalLocked && !isDragging && !isResizing) {
      setShowGrid(true);
    }
  }, [isGlobalLocked, isDragging, isResizing]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !isResizing) {
      setShowGrid(false);
    }
  }, [isDragging, isResizing]);

  const totalWidgetCount = widgets.length;

  React.useEffect(() => {
    logger.debug('NewGridDashboard: Widget positions on render', 'NewGridDashboard', { 
      widgets: widgets.map(w => ({id: w.id, x: w.gridLayout?.x, y: w.gridLayout?.y}))
    });
  }, [widgets]);

  return (
    <div className="relative min-h-[600px]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Enhanced Toolbar */}
      <NewDashboardToolbar
        isGlobalLocked={isGlobalLocked}
        onToggleGlobalLock={toggleGlobalLock}
        hasUnsavedChanges={hasUnsavedChangesFromContext}
        onOrganizeWidgets={onOrganizeWidgets || (() => {})}
        onAutoResize={autoResizeWidgets}
        onAddWidget={onAddWidget}
        totalWidgets={totalWidgetCount}
        activeWidgets={widgets.filter(w => w.enabled).length}
        isDragging={isDragging}
        isResizing={isResizing}
        resizeMode={resizeMode}
        widgets={widgets}
      />

      {/* Enhanced Grid Layout with hover-based grid visibility */}
      {/* Force LTR for grid container to fix drag-and-drop in RTL mode */}
      <div 
        ref={gridRef}
        className={`new-grid-container min-h-[600px] ${showGrid ? 'show-grid' : ''} ${isGlobalLocked ? 'locked' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        dir="ltr"
      >
        <ResponsiveGridLayout
          className={`new-grid-layout ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 24, md: 20, sm: 12, xs: 6, xxs: 4 }}
          rowHeight={50} // Optimized for mobile - Apple widget standard height
          width={1200}
          margin={[6, 6]} // Tighter margins for mobile
          containerPadding={[12, 12]}
          onLayoutChange={onLayoutChange}
          onDragStart={onDragStart}
          onDragStop={onDragStop}
          onResizeStart={onResizeStart}
          onResizeStop={onResizeStop}
          isDraggable={!isGlobalLocked}
          isResizable={!isGlobalLocked}
          useCSSTransforms={true} // Enable for better performance
          compactType={null} // Disable auto-compacting for free movement
          preventCollision={false}
          allowOverlap={true} // Allow widgets to overlap like Android
          autoSize={true}
          key={`new-grid-${isGlobalLocked}-${widgets.length}`}
          resizeHandles={['se', 'sw', 'ne', 'nw']} // All corner handles
          transformScale={1}
          isBounded={false} // Allow dragging outside bounds for better movement
        >
          {widgets.map(widget => {
            const isOverlapping = overlappingWidgets.has(widget.id);
            const isRecentlyInteracted = recentlyInteracted.has(widget.id);
            
            return (
              <div 
                key={widget.id} 
                data-grid={widget.gridLayout} 
                className={`new-grid-item ${isGlobalLocked ? 'locked' : ''} ${
                  isOverlapping ? 'overlapping peek-mode' : ''
                } ${isRecentlyInteracted ? 'recently-interacted' : ''}`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <GridWidget
                  config={widget}
                  onUpdate={onUpdateWidget}
                  onRemove={onRemoveWidget}
                  isGlobalLocked={isGlobalLocked}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      {/* Collision Detection and Separation Suggestions */}
      {collisionAnalysis && (
        <CollisionSuggestion
          analysis={collisionAnalysis}
          onAcceptSeparation={handleAcceptSeparation}
          onSeparateAll={handleSeparateAll}
          onDismiss={handleDismissCollisionSuggestion}
          isVisible={showCollisionSuggestion && !isDragging && !isResizing && !isGlobalLocked}
          compact={false}
        />
      )}
    </div>
  );
};

export default NewGridDashboard; 