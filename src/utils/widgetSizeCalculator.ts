import { WidgetType, WidgetConfig } from '@/types/widgets';

export interface SizeCalculation {
  minimal: { w: number; h: number };
  optimal: { w: number; h: number };
  contentOptimized: { w: number; h: number };
  reason: string;
}

export interface ResizeMode {
  mode: 'minimal' | 'optimal' | 'content-optimized';
  description: string;
}

/**
 * Enhanced widget size calculator with content-aware sizing
 */
export class WidgetSizeCalculator {
  
  /**
   * Get all possible resize modes in cycle order
   */
  static getResizeModes(): ResizeMode[] {
    return [
      { mode: 'minimal', description: 'Smallest possible size' },
      { mode: 'optimal', description: 'Recommended size for widget type' },
      { mode: 'content-optimized', description: 'Size optimized for current content' }
    ];
  }

  /**
   * Calculate size recommendations for a widget
   */
  static calculateSizes(widget: WidgetConfig, data?: any): SizeCalculation {
    const baseSizes = this.getBaseSizes(widget.type);
    const contentOptimized = this.calculateContentOptimizedSize(widget, data);
    
    return {
      minimal: baseSizes.minimal,
      optimal: baseSizes.optimal,
      contentOptimized,
      reason: this.getSizingReason(widget.type, contentOptimized)
    };
  }

  /**
   * Get the next resize mode in the cycle
   */
  static getNextResizeMode(currentMode: ResizeMode['mode']): ResizeMode['mode'] {
    const modes = this.getResizeModes();
    const currentIndex = modes.findIndex(m => m.mode === currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return modes[nextIndex].mode;
  }

  /**
   * Get target size for a specific resize mode
   */
  static getTargetSize(
    widget: WidgetConfig, 
    mode: ResizeMode['mode'], 
    data?: any
  ): { w: number; h: number } {
    const sizes = this.calculateSizes(widget, data);
    
    switch (mode) {
      case 'minimal':
        return sizes.minimal;
      case 'optimal':
        return sizes.optimal;
      case 'content-optimized':
        return sizes.contentOptimized;
      default:
        return sizes.optimal;
    }
  }

  /**
   * Calculate content-optimized size based on data and settings
   */
  private static calculateContentOptimizedSize(
    widget: WidgetConfig, 
    data?: any
  ): { w: number; h: number } {
    const baseSizes = this.getBaseSizes(widget.type);
    const dataComplexity = this.analyzeDataComplexity(widget.type, data);
    const settingsComplexity = this.analyzeSettingsComplexity(widget.settings);
    
    const adjustedSize = { ...baseSizes.optimal };
    
    // Adjust based on data complexity
    if (dataComplexity.points > 20) {
      adjustedSize.w = Math.min(adjustedSize.w + 1, 12);
    }
    if (dataComplexity.categories > 5) {
      adjustedSize.h = Math.min(adjustedSize.h + 1, 8);
    }
    
    // Adjust based on settings
    if (settingsComplexity.hasLegend) {
      adjustedSize.h = Math.min(adjustedSize.h + 1, 8);
    }
    if (settingsComplexity.hasCustomTitle && widget.settings.customTitle?.length > 20) {
      adjustedSize.h = Math.min(adjustedSize.h + 1, 8);
    }
    
    // Ensure minimum constraints
    adjustedSize.w = Math.max(adjustedSize.w, baseSizes.minimal.w);
    adjustedSize.h = Math.max(adjustedSize.h, baseSizes.minimal.h);
    
    return adjustedSize;
  }

  /**
   * Get base sizes for widget types
   */
  private static getBaseSizes(widgetType: WidgetType): { minimal: { w: number; h: number }, optimal: { w: number; h: number } } {
    const sizeMap: Record<string, { minimal: { w: number; h: number }, optimal: { w: number; h: number } }> = {
      // Funnel and percentage widgets need more vertical space
      'lead-funnel': { minimal: { w: 3, h: 4 }, optimal: { w: 6, h: 7 } },
      'meetings-set-percentage': { minimal: { w: 3, h: 4 }, optimal: { w: 6, h: 7 } },
      
      // Distribution charts need more horizontal space
      'temperature-distribution': { minimal: { w: 4, h: 3 }, optimal: { w: 8, h: 5 } },
      'hourly-activity': { minimal: { w: 4, h: 3 }, optimal: { w: 8, h: 4 } },
      'message-hourly-distribution': { minimal: { w: 4, h: 3 }, optimal: { w: 8, h: 4 } },
      
      // Stats and analytics widgets
      'property-stats': { minimal: { w: 3, h: 3 }, optimal: { w: 6, h: 4 } },
      'conversation-abandoned-with-stage': { minimal: { w: 3, h: 3 }, optimal: { w: 6, h: 5 } },
      'most-efficient-response-hours': { minimal: { w: 3, h: 3 }, optimal: { w: 6, h: 4 } },
      'meetings-vs-messages': { minimal: { w: 3, h: 3 }, optimal: { w: 6, h: 4 } },
      
      // Temperature analysis (medium complexity)
      'lead-temperature': { minimal: { w: 4, h: 3 }, optimal: { w: 7, h: 5 } },
      
      // Simple metric widgets
      'total-leads': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'reached-leads': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'total-chats': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'conversations-completed': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'conversations-started': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'messages-sent': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      'interactions': { minimal: { w: 2, h: 2 }, optimal: { w: 3, h: 3 } },
      
      // Time-based analytics
      'mean-time-to-first-reply': { minimal: { w: 3, h: 2 }, optimal: { w: 4, h: 3 } },
      'mean-response-time': { minimal: { w: 3, h: 2 }, optimal: { w: 4, h: 3 } },
      'average-messages-per-client': { minimal: { w: 3, h: 2 }, optimal: { w: 4, h: 3 } },
      'avg-messages-per-customer': { minimal: { w: 3, h: 2 }, optimal: { w: 4, h: 3 } },
      
      // Legacy widgets (smaller optimal sizes)
      'conversations-abandoned': { minimal: { w: 2, h: 2 }, optimal: { w: 4, h: 3 } }
    };

    return sizeMap[widgetType] || { minimal: { w: 2, h: 2 }, optimal: { w: 4, h: 3 } };
  }

  /**
   * Analyze data complexity for content-based sizing
   */
  private static analyzeDataComplexity(widgetType: WidgetType, data?: any) {
    const points = data?.length || data?.data?.length || 1;
    const categories = data?.categories?.length || 
                      (Array.isArray(data) ? new Set(data.map((item: any) => item.category)).size : 1);
    
    return {
      points,
      categories,
      complexity: points > 20 ? 'high' : points > 10 ? 'medium' : 'low'
    };
  }

  /**
   * Analyze widget settings complexity
   */
  private static analyzeSettingsComplexity(settings: any) {
    return {
      hasLegend: settings?.showLegend !== false,
      hasCustomTitle: !!settings?.customTitle,
      hasTooltips: settings?.showTooltips !== false,
      customTimeRange: !!settings?.timeRange && settings.timeRange !== 'week'
    };
  }

  /**
   * Get reasoning for size recommendation
   */
  private static getSizingReason(widgetType: WidgetType, contentSize: { w: number; h: number }): string {
    const base = this.getBaseSizes(widgetType);
    
    if (contentSize.w > base.optimal.w || contentSize.h > base.optimal.h) {
      return 'Increased size recommended due to content complexity';
    } else if (contentSize.w < base.optimal.w || contentSize.h < base.optimal.h) {
      return 'Reduced size sufficient for current content';
    } else {
      return 'Optimal size matches content requirements';
    }
  }

  /**
   * Batch resize widgets to a specific mode
   */
  static batchResizeWidgets(
    widgets: WidgetConfig[], 
    mode: ResizeMode['mode'],
    dataMap?: Record<string, any>
  ): { resizedWidgets: WidgetConfig[], changeCount: number } {
    let changeCount = 0;
    const resizedWidgets: WidgetConfig[] = [];

    widgets.forEach(widget => {
      const targetSize = this.getTargetSize(widget, mode, dataMap?.[widget.id]);
      
      if (widget.gridLayout.w !== targetSize.w || widget.gridLayout.h !== targetSize.h) {
        resizedWidgets.push({
          ...widget,
          gridLayout: {
            ...widget.gridLayout,
            w: targetSize.w,
            h: targetSize.h
          }
        });
        changeCount++;
      }
    });

    return { resizedWidgets, changeCount };
  }

  /**
   * Get efficiency score for current widget size
   */
  static calculateSizeEfficiency(
    widget: WidgetConfig,
    data?: any
  ): { score: number, recommendation: string } {
    const sizes = this.calculateSizes(widget, data);
    const current = { w: widget.gridLayout.w, h: widget.gridLayout.h };
    
    const currentArea = current.w * current.h;
    const optimalArea = sizes.contentOptimized.w * sizes.contentOptimized.h;
    
    // Calculate area efficiency
    const areaDiff = Math.abs(currentArea - optimalArea);
    const maxArea = Math.max(currentArea, optimalArea);
    const areaEfficiency = Math.max(0, 100 - (areaDiff / maxArea * 100));
    
    // Calculate aspect ratio efficiency
    const currentRatio = current.w / current.h;
    const optimalRatio = sizes.contentOptimized.w / sizes.contentOptimized.h;
    const ratioEfficiency = 100 - Math.abs(currentRatio - optimalRatio) / Math.max(currentRatio, optimalRatio) * 100;
    
    const score = Math.round(areaEfficiency * 0.7 + ratioEfficiency * 0.3);
    
    let recommendation = 'Current size is optimal';
    if (score < 50) {
      recommendation = 'Consider significant resize for better layout';
    } else if (score < 70) {
      recommendation = 'Minor size adjustment recommended';
    } else if (score < 90) {
      recommendation = 'Current size is good with room for improvement';
    }
    
    return { score, recommendation };
  }
} 