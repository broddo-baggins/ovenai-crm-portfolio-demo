export type WidgetType = 
  | 'lead-funnel'
  | 'total-chats'
  | 'total-leads'
  | 'reached-leads'
  | 'success-rate'
  | 'property-stats'
  | 'temperature-distribution'
  | 'lead-temperature'
  | 'hourly-activity'
  | 'message-hourly-distribution'
  | 'messages-sent'
  | 'interactions'
  | 'conversations-started'
  | 'conversations-completed'
  | 'conversations-abandoned'
  | 'mean-response-time'
  | 'avg-messages-per-customer'
  | 'effective-response-hours'
  | 'meetings-vs-messages'
  | 'conversation-abandoned-with-stage'
  | 'mean-time-to-first-reply'
  | 'average-messages-per-client'
  | 'most-efficient-response-hours'
  | 'meetings-set-percentage';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GridLayout {
  i: string; // widget id
  x: number; // grid column position
  y: number; // grid row position
  w: number; // width in grid units
  h: number; // height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // if true, widget cannot be moved or resized
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: Position; // Keep for backward compatibility
  size: Size; // Keep for backward compatibility
  enabled: boolean;
  settings: WidgetSettings;
  gridLayout: GridLayout; // New grid layout properties
  locked?: boolean; // Whether the widget is locked in position
}

export interface WidgetSettings {
  // Common settings
  refreshInterval: number;
  showLegend: boolean;
  showTooltip: boolean;
  colorScheme?: string;
  
  // Report settings
  includeInReport?: boolean;
  
  // Filter settings
  dayFilter?: string;
  hourFilter?: string;
  regionFilter?: string;
  timezone?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  projectFilter?: string[];
  userFilter?: string[];
  
  // Display settings
  displayType?: 'chart' | 'table' | 'card' | 'gauge';
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  colors?: string[];
  customTitle?: string;
  
  // Lead Funnel specific
  funnelStages?: string[];
  showPercentages?: boolean;
  showConversionRates?: boolean;
  
  // Total Chats specific
  timeRange?: 'today' | 'week' | 'month' | 'year' | 'custom';
  includeArchived?: boolean;
  
  // Property Stats specific
  currency?: string;
  showTrends?: boolean;
  
  // Property Types specific
  propertyCategories?: string[];
  sortBy?: 'count' | 'name';
  
  // Temperature Distribution specific
  temperatureLevels?: string[];
  showInactive?: boolean;
  
  // Hourly Activity specific
  activityType?: 'messages' | 'leads' | 'meetings';

  // CRM-specific widget settings
  messageType?: 'sent' | 'received' | 'all';
  interactionType?: 'clicks' | 'replies' | 'views' | 'all';
  abandonmentStage?: 'initial' | 'middle' | 'final' | 'all';
  abandonmentThreshold?: number; // hours before considering abandoned
  responseTimeUnit?: 'minutes' | 'hours' | 'days';
  responseTimeGrouping?: 'hourly' | 'daily' | 'weekly';
  
  // Calculation-specific settings
  calculationMethod?: 'average' | 'median' | 'total' | 'percentage';
  includeWeekends?: boolean;
  businessHoursOnly?: boolean;
  businessHours?: {
    start: string;
    end: string;
  };
  
  // Threshold settings
  warningThreshold?: number;
  criticalThreshold?: number;
  targetValue?: number;
} 