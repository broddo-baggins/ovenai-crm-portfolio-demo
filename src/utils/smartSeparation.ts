import { WidgetConfig } from '@/types/widgets';
import { TouchingPair, SeparationSuggestion, CollisionDetector } from './collisionDetector';

export interface SeparationResult {
  success: boolean;
  updatedWidgets: WidgetConfig[];
  affectedWidgets: string[]; // IDs of widgets that were moved
  cascadeCount: number; // Number of additional widgets moved to prevent new overlaps
  message: string;
}

export interface SeparationOptions {
  gapSize: number; // Grid units
  preventCascading: boolean;
  maxCascadeDepth: number;
  boundaryHandling: 'strict' | 'expand' | 'compress';
  conservativeMode: boolean; // New: use minimal movements
}

/**
 * Smart widget separation algorithm with minimal layout disruption
 */
export class SmartSeparation {
  
  private static readonly DEFAULT_OPTIONS: SeparationOptions = {
    gapSize: 1,
    preventCascading: false,
    maxCascadeDepth: 2, // Reduced from 3
    boundaryHandling: 'expand',
    conservativeMode: true // Default to conservative
  };

  /**
   * Separate two touching widgets with minimal movement
   */
  static separateWidgets(
    widget1: WidgetConfig, 
    widget2: WidgetConfig,
    allWidgets: WidgetConfig[],
    options: Partial<SeparationOptions> = {}
  ): SeparationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Use conservative separation calculation
    const separation = this.calculateConservativeSeparation(widget1, widget2, allWidgets, opts);
    
    try {
      const result = this.applySeparation(widget1, widget2, separation, allWidgets, opts);
      return {
        ...result,
        message: result.success 
          ? `Separated widgets with minimal movement (${result.cascadeCount} adjustments)`
          : 'Failed to separate widgets without causing overlaps'
      };
    } catch (error) {
      return {
        success: false,
        updatedWidgets: [],
        affectedWidgets: [],
        cascadeCount: 0,
        message: `Separation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Conservative separation calculation - minimal movement approach
   */
  private static calculateConservativeSeparation(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    allWidgets: WidgetConfig[],
    options: SeparationOptions
  ): SeparationSuggestion {
    const w1 = widget1.gridLayout;
    const w2 = widget2.gridLayout;
    
    // Determine touching relationship
    const w1Right = w1.x + w1.w;
    const w1Bottom = w1.y + w1.h;
    const w2Right = w2.x + w2.w;
    const w2Bottom = w2.y + w2.h;

    // Check which type of touching
    const touchingHorizontally = (w1Right === w2.x || w2Right === w1.x);
    const touchingVertically = (w1Bottom === w2.y || w2Bottom === w1.y);

    if (touchingHorizontally) {
      // Horizontal separation - move the rightmost widget slightly
      const leftWidget = w1.x < w2.x ? widget1 : widget2;
      const rightWidget = leftWidget === widget1 ? widget2 : widget1;
      
      const newPosition = {
        x: leftWidget.gridLayout.x + leftWidget.gridLayout.w + options.gapSize,
        y: rightWidget.gridLayout.y
      };

      return {
        direction: 'horizontal',
        moveWidget: rightWidget === widget1 ? 'first' : 'second',
        distance: options.gapSize,
        newPositions: {
          widget1: widget1 === rightWidget ? newPosition : { x: w1.x, y: w1.y },
          widget2: widget2 === rightWidget ? newPosition : { x: w2.x, y: w2.y }
        }
      };
    } else if (touchingVertically) {
      // Vertical separation - move the bottom widget slightly
      const topWidget = w1.y < w2.y ? widget1 : widget2;
      const bottomWidget = topWidget === widget1 ? widget2 : widget1;
      
      const newPosition = {
        x: bottomWidget.gridLayout.x,
        y: topWidget.gridLayout.y + topWidget.gridLayout.h + options.gapSize
      };

      return {
        direction: 'vertical',
        moveWidget: bottomWidget === widget1 ? 'first' : 'second',
        distance: options.gapSize,
        newPositions: {
          widget1: widget1 === bottomWidget ? newPosition : { x: w1.x, y: w1.y },
          widget2: widget2 === bottomWidget ? newPosition : { x: w2.x, y: w2.y }
        }
      };
    }

    // Fallback to horizontal if unclear
    return this.calculateConservativeSeparation(widget1, widget2, allWidgets, { ...options, gapSize: 1 });
  }

  /**
   * Separate all touching widget pairs with intelligent batching
   */
  static separateAllTouchingWidgets(
    widgets: WidgetConfig[],
    options: Partial<SeparationOptions> = {}
  ): SeparationResult {
    const opts = { 
      ...this.DEFAULT_OPTIONS, 
      ...options,
      conservativeMode: true, // Force conservative mode for batch operations
      gapSize: Math.max(options.gapSize || 1, 1), // Minimum gap of 1
      preventCascading: true // Prevent cascading for batch to avoid chaos
    };
    
    const updatedWidgets: WidgetConfig[] = [...widgets];
    const totalAffectedWidgets: string[] = [];
    let totalCascades = 0;
    let separatedPairs = 0;

    // Get all touching pairs
    const analysis = CollisionDetector.analyzeLayout(widgets);
    const touchingPairs = analysis.touchingPairs;

    if (touchingPairs.length === 0) {
      return {
        success: true,
        updatedWidgets: widgets,
        affectedWidgets: [],
        cascadeCount: 0,
        message: 'No touching widgets found'
      };
    }

    // Group touching pairs by priority and process intelligently
    const groupedPairs = this.groupTouchingPairs(touchingPairs);
    
    // Process high-priority pairs first with conservative movements
    for (const group of groupedPairs) {
      for (const pair of group) {
        const currentWidget1 = updatedWidgets.find(w => w.id === pair.widget1.id);
        const currentWidget2 = updatedWidgets.find(w => w.id === pair.widget2.id);
        
        if (!currentWidget1 || !currentWidget2) continue;

        // Check if they're still touching after previous separations
        if (!CollisionDetector.areWidgetsTouching(currentWidget1, currentWidget2, { minSpacingThreshold: 0 })) {
          continue; // Already separated by a previous operation
        }

        // Use very conservative separation for batch operations
        const separationResult = this.applySingleSeparation(
          currentWidget1, 
          currentWidget2, 
          updatedWidgets, 
          opts
        );

        if (separationResult.success) {
          // Update only the affected widgets in our working array
          separationResult.updatedWidgets.forEach(updatedWidget => {
            const index = updatedWidgets.findIndex(w => w.id === updatedWidget.id);
            if (index !== -1) {
              updatedWidgets[index] = updatedWidget;
            }
          });
          
          totalAffectedWidgets.push(...separationResult.affectedWidgets);
          totalCascades += separationResult.cascadeCount;
          separatedPairs++;
        }
      }
    }

    return {
      success: separatedPairs > 0,
      updatedWidgets,
      affectedWidgets: [...new Set(totalAffectedWidgets)], // Remove duplicates
      cascadeCount: totalCascades,
      message: `Added breathing room to ${separatedPairs}/${touchingPairs.length} widget pairs`
    };
  }

  /**
   * Group touching pairs by urgency and spatial proximity
   */
  private static groupTouchingPairs(pairs: TouchingPair[]): TouchingPair[][] {
    // Sort by urgency first
    const sortedPairs = [...pairs].sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

    // Group into batches to avoid conflicts
    const groups: TouchingPair[][] = [];
    const processed = new Set<string>();

    for (const pair of sortedPairs) {
      const widget1Id = pair.widget1.id;
      const widget2Id = pair.widget2.id;

      // If neither widget has been processed, add to current group
      if (!processed.has(widget1Id) && !processed.has(widget2Id)) {
        // Find or create a group for this pair
        let targetGroup = groups.find(group => 
          !group.some(p => 
            p.widget1.id === widget1Id || p.widget1.id === widget2Id ||
            p.widget2.id === widget1Id || p.widget2.id === widget2Id
          )
        );

        if (!targetGroup) {
          targetGroup = [];
          groups.push(targetGroup);
        }

        targetGroup.push(pair);
        processed.add(widget1Id);
        processed.add(widget2Id);
      }
    }

    return groups;
  }

  /**
   * Apply a single conservative separation
   */
  private static applySingleSeparation(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    allWidgets: WidgetConfig[],
    options: SeparationOptions
  ): SeparationResult {
    const separation = this.calculateConservativeSeparation(widget1, widget2, allWidgets, options);
    const updatedWidgets = [...allWidgets];
    const affectedWidgets: string[] = [];

    // Apply the minimal separation
    const widgetToMove = separation.moveWidget === 'first' ? widget1 : widget2;
    const newPosition = separation.moveWidget === 'first' 
      ? separation.newPositions.widget1 
      : separation.newPositions.widget2;

    // Update the moving widget
    const movingWidgetIndex = updatedWidgets.findIndex(w => w.id === widgetToMove.id);
    if (movingWidgetIndex === -1) {
      return {
        success: false,
        updatedWidgets: allWidgets,
        affectedWidgets: [],
        cascadeCount: 0,
        message: 'Widget to move not found'
      };
    }

    // Check if the new position would cause boundary issues
    const MAX_GRID_WIDTH = 24;
    const newRight = newPosition.x + widgetToMove.gridLayout.w;
    
    if (newRight > MAX_GRID_WIDTH && options.boundaryHandling === 'strict') {
      return {
        success: false,
        updatedWidgets: allWidgets,
        affectedWidgets: [],
        cascadeCount: 0,
        message: 'Would exceed grid boundaries'
      };
    }

    // Apply the movement
    updatedWidgets[movingWidgetIndex] = {
      ...widgetToMove,
      gridLayout: {
        ...widgetToMove.gridLayout,
        x: newPosition.x,
        y: newPosition.y
      }
    };
    affectedWidgets.push(widgetToMove.id);

    return {
      success: true,
      updatedWidgets,
      affectedWidgets,
      cascadeCount: 0, // No cascading for conservative mode
      message: 'Minimal separation applied'
    };
  }

  /**
   * Apply separation between two widgets (original method, simplified)
   */
  private static applySeparation(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    separation: SeparationSuggestion,
    allWidgets: WidgetConfig[],
    options: SeparationOptions
  ): SeparationResult {
    // For conservative mode, use the single separation approach
    if (options.conservativeMode) {
      return this.applySingleSeparation(widget1, widget2, allWidgets, options);
    }

    // Original logic for non-conservative mode (kept for compatibility)
    const updatedWidgets = [...allWidgets];
    const affectedWidgets: string[] = [];
    let cascadeCount = 0;

    // Apply the separation
    const widgetToMove = separation.moveWidget === 'first' ? widget1 : widget2;
    const newPosition = separation.moveWidget === 'first' 
      ? separation.newPositions.widget1 
      : separation.newPositions.widget2;

    // Update the moving widget
    const movingWidgetIndex = updatedWidgets.findIndex(w => w.id === widgetToMove.id);
    if (movingWidgetIndex === -1) {
      throw new Error('Widget to move not found');
    }

    updatedWidgets[movingWidgetIndex] = {
      ...widgetToMove,
      gridLayout: {
        ...widgetToMove.gridLayout,
        x: newPosition.x,
        y: newPosition.y
      }
    };
    affectedWidgets.push(widgetToMove.id);

    // Handle boundary constraints
    const constraintResult = this.handleBoundaryConstraints(
      updatedWidgets[movingWidgetIndex], 
      updatedWidgets, 
      options
    );
    
    if (!constraintResult.success) {
      throw new Error('Boundary constraint violation');
    }

    updatedWidgets[movingWidgetIndex] = constraintResult.adjustedWidget;
    if (constraintResult.wasMoved) {
      cascadeCount++;
    }

    // Handle cascading overlaps if needed (disabled in conservative mode)
    if (!options.preventCascading && !options.conservativeMode) {
      const cascadeResult = this.handleCascadingOverlaps(
        updatedWidgets[movingWidgetIndex],
        updatedWidgets,
        options,
        0
      );
      
      cascadeResult.updatedWidgets.forEach((widget, index) => {
        updatedWidgets[index] = widget;
      });
      
      affectedWidgets.push(...cascadeResult.affectedWidgets);
      cascadeCount += cascadeResult.cascadeCount;
    }

    // Final validation - ensure no new overlaps were created
    const finalValidation = this.validateNoOverlaps(updatedWidgets);
    
    return {
      success: finalValidation.isValid,
      updatedWidgets: finalValidation.isValid ? updatedWidgets : allWidgets,
      affectedWidgets,
      cascadeCount,
      message: finalValidation.isValid ? 'Separation successful' : finalValidation.reason
    };
  }

  /**
   * Handle boundary constraints (grid limits)
   */
  private static handleBoundaryConstraints(
    widget: WidgetConfig,
    allWidgets: WidgetConfig[],
    options: SeparationOptions
  ): { success: boolean; adjustedWidget: WidgetConfig; wasMoved: boolean } {
    const MAX_GRID_WIDTH = 24; // Standard grid width
    const widgetRight = widget.gridLayout.x + widget.gridLayout.w;
    
    if (widgetRight <= MAX_GRID_WIDTH) {
      return { success: true, adjustedWidget: widget, wasMoved: false };
    }

    // Widget exceeds boundary
    switch (options.boundaryHandling) {
      case 'strict':
        return { success: false, adjustedWidget: widget, wasMoved: false };
      
      case 'compress': {
        // Shrink widget to fit
        const newWidth = Math.max(widget.gridLayout.minW || 2, MAX_GRID_WIDTH - widget.gridLayout.x);
        return {
          success: true,
          adjustedWidget: {
            ...widget,
            gridLayout: { ...widget.gridLayout, w: newWidth }
          },
          wasMoved: true
        };
      }
      
      case 'expand':
      default:
        // Allow expansion beyond grid (dashboard will handle scrolling)
        return { success: true, adjustedWidget: widget, wasMoved: false };
    }
  }

  /**
   * Handle cascading overlaps by moving affected widgets
   */
  private static handleCascadingOverlaps(
    movedWidget: WidgetConfig,
    allWidgets: WidgetConfig[],
    options: SeparationOptions,
    depth: number
  ): { updatedWidgets: WidgetConfig[]; affectedWidgets: string[]; cascadeCount: number } {
    if (depth >= options.maxCascadeDepth) {
      return { updatedWidgets: allWidgets, affectedWidgets: [], cascadeCount: 0 };
    }

    const updatedWidgets = [...allWidgets];
    const affectedWidgets: string[] = [];
    let cascadeCount = 0;

    // Find widgets that now overlap with the moved widget
    const overlappingWidgets = CollisionDetector.getAffectedWidgets(
      movedWidget,
      { x: movedWidget.gridLayout.x, y: movedWidget.gridLayout.y },
      allWidgets
    );

    for (const overlappingWidget of overlappingWidgets) {
      // Calculate new position for overlapping widget
      const pushDirection = this.calculatePushDirection(movedWidget, overlappingWidget);
      const newPosition = this.calculatePushPosition(
        movedWidget, 
        overlappingWidget, 
        pushDirection, 
        options.gapSize
      );

      // Update the overlapping widget
      const widgetIndex = updatedWidgets.findIndex(w => w.id === overlappingWidget.id);
      if (widgetIndex !== -1) {
        updatedWidgets[widgetIndex] = {
          ...overlappingWidget,
          gridLayout: {
            ...overlappingWidget.gridLayout,
            x: newPosition.x,
            y: newPosition.y
          }
        };
        affectedWidgets.push(overlappingWidget.id);
        cascadeCount++;

        // Recursively handle new overlaps
        const recurseResult = this.handleCascadingOverlaps(
          updatedWidgets[widgetIndex],
          updatedWidgets,
          options,
          depth + 1
        );
        
        recurseResult.updatedWidgets.forEach((widget, index) => {
          updatedWidgets[index] = widget;
        });
        
        affectedWidgets.push(...recurseResult.affectedWidgets);
        cascadeCount += recurseResult.cascadeCount;
      }
    }

    return { updatedWidgets, affectedWidgets, cascadeCount };
  }

  /**
   * Calculate the direction to push an overlapping widget
   */
  private static calculatePushDirection(
    pusher: WidgetConfig, 
    target: WidgetConfig
  ): 'right' | 'down' | 'left' | 'up' {
    const pusherCenter = {
      x: pusher.gridLayout.x + pusher.gridLayout.w / 2,
      y: pusher.gridLayout.y + pusher.gridLayout.h / 2
    };
    
    const targetCenter = {
      x: target.gridLayout.x + target.gridLayout.w / 2,
      y: target.gridLayout.y + target.gridLayout.h / 2
    };

    const dx = targetCenter.x - pusherCenter.x;
    const dy = targetCenter.y - pusherCenter.y;

    // Determine primary direction based on larger displacement
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Calculate new position when pushing a widget
   */
  private static calculatePushPosition(
    pusher: WidgetConfig,
    target: WidgetConfig,
    direction: 'right' | 'down' | 'left' | 'up',
    gapSize: number
  ): { x: number; y: number } {
    switch (direction) {
      case 'right':
        return {
          x: pusher.gridLayout.x + pusher.gridLayout.w + gapSize,
          y: target.gridLayout.y
        };
      case 'left':
        return {
          x: pusher.gridLayout.x - target.gridLayout.w - gapSize,
          y: target.gridLayout.y
        };
      case 'down':
        return {
          x: target.gridLayout.x,
          y: pusher.gridLayout.y + pusher.gridLayout.h + gapSize
        };
      case 'up':
        return {
          x: target.gridLayout.x,
          y: pusher.gridLayout.y - target.gridLayout.h - gapSize
        };
    }
  }

  /**
   * Validate that no overlaps exist in the layout
   */
  private static validateNoOverlaps(widgets: WidgetConfig[]): { isValid: boolean; reason: string } {
    const overlaps = CollisionDetector.detectOverlappingWidgets(widgets);
    
    if (overlaps.length === 0) {
      return { isValid: true, reason: 'No overlaps detected' };
    }

    return { 
      isValid: false, 
      reason: `${overlaps.length} overlapping widget pairs detected after separation` 
    };
  }

  /**
   * Get optimal separation configuration for a layout
   */
  static getOptimalSeparationOptions(widgets: WidgetConfig[]): SeparationOptions {
    // Analyze layout to inform configuration decisions
    CollisionDetector.analyzeLayout(widgets);
    const widgetDensity = widgets.length / 24; // Assuming 24-column grid
    
    // Adjust options based on layout density and complexity
    return {
      gapSize: 1, // Always use minimal gap for conservative approach
      preventCascading: true, // Always prevent cascading for batch operations
      maxCascadeDepth: 1, // Minimal cascade depth
      boundaryHandling: widgetDensity > 0.7 ? 'compress' : 'expand',
      conservativeMode: true // Always use conservative mode for better UX
    };
  }
} 