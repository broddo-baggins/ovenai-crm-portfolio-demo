import { WidgetConfig } from '@/types/widgets';

export interface TouchingPair {
  widget1: WidgetConfig;
  widget2: WidgetConfig;
  separationSuggestion: SeparationSuggestion;
  separationType: 'horizontal' | 'vertical';
  urgency: 'low' | 'medium' | 'high';
}

export interface SeparationSuggestion {
  direction: 'horizontal' | 'vertical';
  moveWidget: 'first' | 'second' | 'both';
  distance: number; // Grid units to move
  newPositions: {
    widget1: { x: number; y: number };
    widget2: { x: number; y: number };
  };
}

export interface OverlapAnalysis {
  overlappingPairs: Array<{
    widget1: WidgetConfig;
    widget2: WidgetConfig;
    overlapArea: number;
    severity: 'minor' | 'moderate' | 'severe';
  }>;
  touchingPairs: TouchingPair[];
  totalIssues: number;
  recommendation: string;
}

export interface CollisionDetectorOptions {
  minSpacingThreshold?: number; // Minimum grid units to consider as "proper spacing"
  ignoreDiagonalTouching?: boolean; // Whether to ignore widgets touching at corners
  considerVisualSpacing?: boolean; // Whether to account for visual margins
}

/**
 * Enhanced collision detector for widget spacing analysis
 */
export class CollisionDetector {
  private static readonly DEFAULT_MIN_SPACING = 1; // Default minimum spacing in grid units
  private static readonly VISUAL_MARGIN_ADJUSTMENT = 0.5; // Approximate visual margin in grid units
  
  /**
   * Analyze all collision and spacing issues on the dashboard
   */
  static analyzeLayout(
    widgets: WidgetConfig[],
    options: CollisionDetectorOptions = {}
  ): OverlapAnalysis {
    const overlappingPairs = this.detectOverlappingWidgets(widgets);
    const touchingPairs = this.detectTouchingWidgets(widgets, options);
    
    const totalIssues = overlappingPairs.length + touchingPairs.length;
    let recommendation = 'Layout looks good with proper spacing';
    
    if (overlappingPairs.length > 0) {
      recommendation = 'Some widgets are overlapping and need immediate attention';
    } else if (touchingPairs.length > 3) {
      recommendation = 'Many widgets are touching - consider adding breathing room';
    } else if (touchingPairs.length > 0) {
      recommendation = 'Some widgets could benefit from additional spacing';
    }
    
    return {
      overlappingPairs,
      touchingPairs,
      totalIssues,
      recommendation
    };
  }

  /**
   * Detect widgets that are directly touching (no gap)
   */
  static detectTouchingWidgets(
    widgets: WidgetConfig[],
    options: CollisionDetectorOptions = {}
  ): TouchingPair[] {
    const pairs: TouchingPair[] = [];
    
    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        const widget1 = widgets[i];
        const widget2 = widgets[j];
        
        if (this.areWidgetsTouching(widget1, widget2, options)) {
          const separationType = this.getBestSeparationDirection(widget1, widget2, widgets);
          const separationSuggestion = this.calculateSeparation(widget1, widget2, separationType, widgets);
          const urgency = this.calculateUrgency(widget1, widget2);
          
          pairs.push({
            widget1,
            widget2,
            separationSuggestion,
            separationType,
            urgency
          });
        }
      }
    }
    
    // Sort by urgency (high to low)
    return pairs.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  /**
   * Detect widgets that are overlapping
   */
  static detectOverlappingWidgets(widgets: WidgetConfig[]) {
    const pairs: Array<{
      widget1: WidgetConfig;
      widget2: WidgetConfig;
      overlapArea: number;
      severity: 'minor' | 'moderate' | 'severe';
    }> = [];
    
    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        const widget1 = widgets[i];
        const widget2 = widgets[j];
        
        const overlapArea = this.calculateOverlapArea(widget1, widget2);
        if (overlapArea > 0) {
          const severity = this.calculateOverlapSeverity(widget1, widget2, overlapArea);
          pairs.push({
            widget1,
            widget2,
            overlapArea,
            severity
          });
        }
      }
    }
    
    return pairs;
  }

  /**
   * Check if two widgets are directly touching (adjacent with no gap)
   */
  static areWidgetsTouching(
    widget1: WidgetConfig, 
    widget2: WidgetConfig,
    options: CollisionDetectorOptions = {}
  ): boolean {
    const { 
      minSpacingThreshold = 0,
      ignoreDiagonalTouching = true,
      considerVisualSpacing = true 
    } = options;
    
    const w1 = widget1.gridLayout;
    const w2 = widget2.gridLayout;
    
    const w1Right = w1.x + w1.w;
    const w1Bottom = w1.y + w1.h;
    const w2Right = w2.x + w2.w;
    const w2Bottom = w2.y + w2.h;

    // Check if widgets are aligned (share some overlap in one dimension)
    const horizontallyAligned = !(w1Bottom <= w2.y || w2Bottom <= w1.y);
    const verticallyAligned = !(w1Right <= w2.x || w2Right <= w1.x);

    // Adjust for visual spacing if enabled
    const effectiveMinSpacing = considerVisualSpacing 
      ? Math.max(0, minSpacingThreshold - this.VISUAL_MARGIN_ADJUSTMENT)
      : minSpacingThreshold;

    // Check horizontal touching with threshold
    const touchingHorizontally = horizontallyAligned && 
      ((w1Right >= w2.x - effectiveMinSpacing && w1Right <= w2.x + effectiveMinSpacing) ||
       (w2Right >= w1.x - effectiveMinSpacing && w2Right <= w1.x + effectiveMinSpacing));
    
    // Check vertical touching with threshold
    const touchingVertically = verticallyAligned &&
      ((w1Bottom >= w2.y - effectiveMinSpacing && w1Bottom <= w2.y + effectiveMinSpacing) ||
       (w2Bottom >= w1.y - effectiveMinSpacing && w2Bottom <= w1.y + effectiveMinSpacing));

    // Check diagonal touching (corners)
    const touchingDiagonally = !ignoreDiagonalTouching && (
      (Math.abs(w1Right - w2.x) <= effectiveMinSpacing && Math.abs(w1Bottom - w2.y) <= effectiveMinSpacing) ||
      (Math.abs(w1Right - w2.x) <= effectiveMinSpacing && Math.abs(w2Bottom - w1.y) <= effectiveMinSpacing) ||
      (Math.abs(w2Right - w1.x) <= effectiveMinSpacing && Math.abs(w1Bottom - w2.y) <= effectiveMinSpacing) ||
      (Math.abs(w2Right - w1.x) <= effectiveMinSpacing && Math.abs(w2Bottom - w1.y) <= effectiveMinSpacing)
    );
    
    return touchingHorizontally || touchingVertically || touchingDiagonally;
  }

  /**
   * Calculate overlap area between two widgets
   */
  static calculateOverlapArea(widget1: WidgetConfig, widget2: WidgetConfig): number {
    const w1 = widget1.gridLayout;
    const w2 = widget2.gridLayout;
    
    const left = Math.max(w1.x, w2.x);
    const right = Math.min(w1.x + w1.w, w2.x + w2.w);
    const top = Math.max(w1.y, w2.y);
    const bottom = Math.min(w1.y + w1.h, w2.y + w2.h);
    
    if (left >= right || top >= bottom) {
      return 0; // No overlap
    }
    
    return (right - left) * (bottom - top);
  }

  /**
   * Determine the best direction to separate two touching widgets
   */
  static getBestSeparationDirection(
    widget1: WidgetConfig, 
    widget2: WidgetConfig, 
    allWidgets: WidgetConfig[]
  ): 'horizontal' | 'vertical' {
    const horizontalSpace = this.getAvailableHorizontalSpace(widget1, widget2, allWidgets);
    const verticalSpace = this.getAvailableVerticalSpace(widget1, widget2, allWidgets);
    
    // Prefer horizontal separation if there's enough space
    if (horizontalSpace >= 1 && (horizontalSpace >= verticalSpace || verticalSpace < 1)) {
      return 'horizontal';
    }
    
    return 'vertical';
  }

  /**
   * Calculate separation suggestion for two touching widgets
   */
  static calculateSeparation(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    direction: 'horizontal' | 'vertical',
    _allWidgets: WidgetConfig[]
  ): SeparationSuggestion {
    const GAP_SIZE = 1; // Standard gap in grid units
    
    if (direction === 'horizontal') {
      // Determine which widget to move
      const leftWidget = widget1.gridLayout.x < widget2.gridLayout.x ? widget1 : widget2;
      const rightWidget = leftWidget === widget1 ? widget2 : widget1;
      
      const newRightPosition = {
        x: leftWidget.gridLayout.x + leftWidget.gridLayout.w + GAP_SIZE,
        y: rightWidget.gridLayout.y
      };
      
      return {
        direction: 'horizontal',
        moveWidget: rightWidget === widget1 ? 'first' : 'second',
        distance: GAP_SIZE,
        newPositions: {
          widget1: widget1 === rightWidget ? newRightPosition : { x: widget1.gridLayout.x, y: widget1.gridLayout.y },
          widget2: widget2 === rightWidget ? newRightPosition : { x: widget2.gridLayout.x, y: widget2.gridLayout.y }
        }
      };
    } else {
      // Vertical separation
      const topWidget = widget1.gridLayout.y < widget2.gridLayout.y ? widget1 : widget2;
      const bottomWidget = topWidget === widget1 ? widget2 : widget1;
      
      const newBottomPosition = {
        x: bottomWidget.gridLayout.x,
        y: topWidget.gridLayout.y + topWidget.gridLayout.h + GAP_SIZE
      };
      
      return {
        direction: 'vertical',
        moveWidget: bottomWidget === widget1 ? 'first' : 'second',
        distance: GAP_SIZE,
        newPositions: {
          widget1: widget1 === bottomWidget ? newBottomPosition : { x: widget1.gridLayout.x, y: widget1.gridLayout.y },
          widget2: widget2 === bottomWidget ? newBottomPosition : { x: widget2.gridLayout.x, y: widget2.gridLayout.y }
        }
      };
    }
  }

  /**
   * Calculate urgency of separation based on widget types and positioning
   */
  private static calculateUrgency(widget1: WidgetConfig, widget2: WidgetConfig): 'low' | 'medium' | 'high' {
    // High urgency for large widgets touching
    const widget1Area = widget1.gridLayout.w * widget1.gridLayout.h;
    const widget2Area = widget2.gridLayout.w * widget2.gridLayout.h;
    
    if (widget1Area > 12 || widget2Area > 12) {
      return 'high';
    }
    
    // Medium urgency for medium-sized widgets
    if (widget1Area > 6 || widget2Area > 6) {
      return 'medium';
    }
    
    // Low urgency for small widgets
    return 'low';
  }

  /**
   * Calculate available horizontal space for separation
   */
  private static getAvailableHorizontalSpace(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    allWidgets: WidgetConfig[]
  ): number {
    const leftWidget = widget1.gridLayout.x < widget2.gridLayout.x ? widget1 : widget2;
    const rightWidget = leftWidget === widget1 ? widget2 : widget1;
    
    // Check for obstacles to the right of the right widget
    const rightEdge = rightWidget.gridLayout.x + rightWidget.gridLayout.w;
    const maxX = 24; // Grid columns
    
    let availableSpace = maxX - rightEdge;
    
    // Check for other widgets that might block horizontal movement
    for (const widget of allWidgets) {
      if (widget.id === widget1.id || widget.id === widget2.id) continue;
      
      if (widget.gridLayout.x > rightEdge && widget.gridLayout.x < maxX) {
        availableSpace = Math.min(availableSpace, widget.gridLayout.x - rightEdge);
      }
    }
    
    return Math.max(0, availableSpace);
  }

  /**
   * Calculate available vertical space for separation
   */
  private static getAvailableVerticalSpace(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    allWidgets: WidgetConfig[]
  ): number {
    const topWidget = widget1.gridLayout.y < widget2.gridLayout.y ? widget1 : widget2;
    const bottomWidget = topWidget === widget1 ? widget2 : widget1;
    
    // Estimate available vertical space (assume infinite grid height)
    const bottomEdge = bottomWidget.gridLayout.y + bottomWidget.gridLayout.h;
    let availableSpace = 10; // Default assumption
    
    // Check for other widgets below that might block vertical movement
    for (const widget of allWidgets) {
      if (widget.id === widget1.id || widget.id === widget2.id) continue;
      
      if (widget.gridLayout.y > bottomEdge) {
        availableSpace = Math.min(availableSpace, widget.gridLayout.y - bottomEdge);
      }
    }
    
    return Math.max(0, availableSpace);
  }

  /**
   * Calculate overlap severity
   */
  private static calculateOverlapSeverity(
    widget1: WidgetConfig,
    widget2: WidgetConfig,
    overlapArea: number
  ): 'minor' | 'moderate' | 'severe' {
    const widget1Area = widget1.gridLayout.w * widget1.gridLayout.h;
    const widget2Area = widget2.gridLayout.w * widget2.gridLayout.h;
    const smallerArea = Math.min(widget1Area, widget2Area);
    
    const overlapPercentage = (overlapArea / smallerArea) * 100;
    
    if (overlapPercentage > 50) return 'severe';
    if (overlapPercentage > 20) return 'moderate';
    return 'minor';
  }

  /**
   * Get widgets that would be affected by moving a specific widget
   */
  static getAffectedWidgets(
    targetWidget: WidgetConfig,
    newPosition: { x: number; y: number },
    allWidgets: WidgetConfig[]
  ): WidgetConfig[] {
    const affected: WidgetConfig[] = [];
    
    for (const widget of allWidgets) {
      if (widget.id === targetWidget.id) continue;
      
      // Check if the widget would overlap with the moved target widget
      const wouldOverlap = !(
        newPosition.x + targetWidget.gridLayout.w <= widget.gridLayout.x ||
        widget.gridLayout.x + widget.gridLayout.w <= newPosition.x ||
        newPosition.y + targetWidget.gridLayout.h <= widget.gridLayout.y ||
        widget.gridLayout.y + widget.gridLayout.h <= newPosition.y
      );
      
      if (wouldOverlap) {
        affected.push(widget);
      }
    }
    
    return affected;
  }
} 