import { useState, useEffect } from 'react';
import { WidgetType } from '@/types/widgets';

interface ContentMetrics {
  hasOverflow: boolean;
  suggestedSize: { w: number; h: number };
  minSizeForContent: { w: number; h: number };
  optimalSizeForContent: { w: number; h: number };
  reason: string;
  efficiency: number; // 0-100 score of how well current size fits content
}

interface WidgetContentAnalysis {
  dataPoints: number;
  complexity: 'simple' | 'medium' | 'complex';
  visualType: 'chart' | 'table' | 'metric' | 'list';
  hasLegend: boolean;
  hasLabels: boolean;
  estimatedTextHeight: number;
}

export const useWidgetContentSize = (
  widgetType: WidgetType, 
  data: any,
  currentSize: { w: number; h: number },
  settings: any = {}
) => {
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics>({
    hasOverflow: false,
    suggestedSize: currentSize,
    minSizeForContent: { w: 2, h: 2 },
    optimalSizeForContent: { w: 4, h: 4 },
    reason: 'Default sizing',
    efficiency: 100
  });

  useEffect(() => {
    const metrics = analyzeWidgetContent(widgetType, data, currentSize, settings);
    setContentMetrics(metrics);
  }, [widgetType, data, currentSize, settings]);

  return contentMetrics;
};

function analyzeWidgetContent(
  widgetType: WidgetType,
  data: any,
  currentSize: { w: number; h: number },
  settings: any
): ContentMetrics {
  const analysis = getContentAnalysis(widgetType, data, settings);
  const sizeRecommendations = calculateOptimalSize(widgetType, analysis);
  
  // Calculate efficiency of current size
  const efficiency = calculateSizeEfficiency(currentSize, sizeRecommendations.optimal);
  
  // Determine if current size is causing overflow
  const hasOverflow = currentSize.w < sizeRecommendations.minimum.w || 
                     currentSize.h < sizeRecommendations.minimum.h;
  
  // Generate suggestion based on content analysis
  let suggestedSize = currentSize;
  let reason = 'Current size is optimal';
  
  if (hasOverflow) {
    suggestedSize = sizeRecommendations.minimum;
    reason = 'Content is overflowing, increase size for better readability';
  } else if (efficiency < 70) {
    suggestedSize = sizeRecommendations.optimal;
    reason = 'Content could be displayed more efficiently with different dimensions';
  } else if (currentSize.w * currentSize.h > sizeRecommendations.optimal.w * sizeRecommendations.optimal.h * 1.5) {
    suggestedSize = sizeRecommendations.optimal;
    reason = 'Current size is larger than needed, consider reducing for better layout';
  }

  return {
    hasOverflow,
    suggestedSize,
    minSizeForContent: sizeRecommendations.minimum,
    optimalSizeForContent: sizeRecommendations.optimal,
    reason,
    efficiency
  };
}

function getContentAnalysis(widgetType: WidgetType, data: any, settings: any): WidgetContentAnalysis {
  // Analyze data complexity and content requirements
  const dataPoints = data?.length || data?.data?.length || 1;
  const hasLegend = settings?.showLegend !== false;
  const hasLabels = settings?.showLabels !== false;
  
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  let visualType: 'chart' | 'table' | 'metric' | 'list' = 'metric';
  
  // Determine complexity based on widget type and data
  switch (widgetType) {
    case 'lead-funnel':
    case 'meetings-set-percentage':
      complexity = dataPoints > 5 ? 'complex' : 'medium';
      visualType = 'chart';
      break;
    
    case 'temperature-distribution':
    case 'hourly-activity':
    case 'message-hourly-distribution':
      complexity = dataPoints > 24 ? 'complex' : dataPoints > 12 ? 'medium' : 'simple';
      visualType = 'chart';
      break;
    
    case 'property-stats':
    case 'conversation-abandoned-with-stage':
      complexity = dataPoints > 10 ? 'complex' : 'medium';
      visualType = 'table';
      break;
    
    case 'lead-temperature':
      complexity = 'medium';
      visualType = 'chart';
      break;
    
    case 'total-leads':
    case 'reached-leads':
    case 'total-chats':
    case 'conversations-completed':
      complexity = 'simple';
      visualType = 'metric';
      break;
    
    default:
      complexity = 'simple';
      visualType = 'metric';
  }
  
  // Estimate text height based on content
  const baseTextHeight = 20; // pixels
  const titleHeight = 40;
  const legendHeight = hasLegend ? 30 : 0;
  const labelsHeight = hasLabels && visualType === 'chart' ? 25 : 0;
  
  const estimatedTextHeight = titleHeight + legendHeight + labelsHeight + 
    (complexity === 'complex' ? baseTextHeight * 3 : 
     complexity === 'medium' ? baseTextHeight * 2 : baseTextHeight);

  return {
    dataPoints,
    complexity,
    visualType,
    hasLegend,
    hasLabels,
    estimatedTextHeight
  };
}

function calculateOptimalSize(widgetType: WidgetType, analysis: WidgetContentAnalysis) {
  // Base sizes for different widget types
  const baseSizes = {
    'lead-funnel': { minimum: { w: 4, h: 5 }, optimal: { w: 6, h: 7 } },
    'meetings-set-percentage': { minimum: { w: 4, h: 5 }, optimal: { w: 6, h: 7 } },
    'temperature-distribution': { minimum: { w: 6, h: 4 }, optimal: { w: 8, h: 5 } },
    'hourly-activity': { minimum: { w: 6, h: 3 }, optimal: { w: 8, h: 4 } },
    'message-hourly-distribution': { minimum: { w: 6, h: 3 }, optimal: { w: 8, h: 4 } },
    'property-stats': { minimum: { w: 4, h: 3 }, optimal: { w: 6, h: 4 } },
    'conversation-abandoned-with-stage': { minimum: { w: 4, h: 4 }, optimal: { w: 6, h: 5 } },
    'most-efficient-response-hours': { minimum: { w: 4, h: 3 }, optimal: { w: 6, h: 4 } },
    'lead-temperature': { minimum: { w: 5, h: 4 }, optimal: { w: 7, h: 5 } },
    'meetings-vs-messages': { minimum: { w: 4, h: 3 }, optimal: { w: 6, h: 4 } }
  };
  
  // Default sizes for unlisted widget types
  const defaultSizes = {
    minimum: { w: 2, h: 2 },
    optimal: { w: 4, h: 3 }
  };
  
  const baseSize = baseSizes[widgetType as keyof typeof baseSizes] || defaultSizes;
  
  // Adjust based on complexity and content analysis
  const adjustedMinimum = { ...baseSize.minimum };
  const adjustedOptimal = { ...baseSize.optimal };
  
  // Complexity adjustments
  if (analysis.complexity === 'complex') {
    adjustedOptimal.w = Math.min(adjustedOptimal.w + 2, 12);
    adjustedOptimal.h = Math.min(adjustedOptimal.h + 1, 8);
  } else if (analysis.complexity === 'simple' && analysis.visualType === 'metric') {
    adjustedOptimal.w = Math.max(adjustedOptimal.w - 1, 2);
    adjustedOptimal.h = Math.max(adjustedOptimal.h - 1, 2);
  }
  
  // Legend and label adjustments
  if (analysis.hasLegend && analysis.visualType === 'chart') {
    adjustedMinimum.h = Math.min(adjustedMinimum.h + 1, 8);
    adjustedOptimal.h = Math.min(adjustedOptimal.h + 1, 8);
  }
  
  // Data points adjustment for charts
  if (analysis.visualType === 'chart' && analysis.dataPoints > 20) {
    adjustedOptimal.w = Math.min(adjustedOptimal.w + 1, 12);
  }
  
  return {
    minimum: adjustedMinimum,
    optimal: adjustedOptimal
  };
}

function calculateSizeEfficiency(
  currentSize: { w: number; h: number },
  optimalSize: { w: number; h: number }
): number {
  const currentArea = currentSize.w * currentSize.h;
  const optimalArea = optimalSize.w * optimalSize.h;
  
  // Calculate how close current size is to optimal
  const areaDifference = Math.abs(currentArea - optimalArea);
  const maxArea = Math.max(currentArea, optimalArea);
  
  // Efficiency decreases as the difference from optimal increases
  const efficiency = Math.max(0, 100 - (areaDifference / maxArea * 100));
  
  // Bonus points for aspect ratio match
  const currentRatio = currentSize.w / currentSize.h;
  const optimalRatio = optimalSize.w / optimalSize.h;
  const ratioMatch = 1 - Math.abs(currentRatio - optimalRatio) / Math.max(currentRatio, optimalRatio);
  
  return Math.round(efficiency * 0.8 + ratioMatch * 20);
} 