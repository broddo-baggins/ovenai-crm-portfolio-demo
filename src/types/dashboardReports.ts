import { WidgetType } from './widgets';

export interface DashboardReport {
  id: string;
  title: string;
  createdAt: Date;
  widgets: WidgetReportData[];
  layout: 'grid' | 'linear' | 'compact';
  formatting: ReportFormatting;
  metadata: ReportMetadata;
}

export interface WidgetReportData {
  widgetId: string;
  widgetType: WidgetType;
  title: string;
  data: any;
  settings: any;
  reportConfig: WidgetReportConfig;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface WidgetReportConfig {
  includeInReport: boolean;
  reportTitle?: string;
  showLegend: boolean;
  showTooltips: boolean;
  customSize?: {
    width: number;
    height: number;
  };
  exportFormat: 'chart' | 'table' | 'summary' | 'image';
  dataRange?: {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
}

export interface ReportFormatting {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header: ReportHeader;
  footer: ReportFooter;
  styling: ReportStyling;
}

export interface ReportHeader {
  showLogo: boolean;
  showTitle: boolean;
  showDate: boolean;
  customText?: string;
  height: number;
}

export interface ReportFooter {
  showPageNumbers: boolean;
  showGeneratedBy: boolean;
  customText?: string;
  height: number;
}

export interface ReportStyling {
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
  spacing: number;
  widgetSpacing: number;
}

export interface ReportMetadata {
  totalWidgets: number;
  includedWidgets: number;
  excludedWidgets: number;
  reportSize: number; // bytes
  generationTime: number; // milliseconds
  generatedBy: string;
  dashboardVersion: string;
}

export interface ReportExportOptions {
  format: 'pdf' | 'png' | 'html' | 'excel';
  quality: 'low' | 'medium' | 'high' | 'print';
  includeData: boolean;
  includeSettings: boolean;
  watermark?: string;
  filename?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'linear' | 'compact';
  formatting: {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3';
    orientation?: 'portrait' | 'landscape';
    margins?: Partial<{
      top: number;
      right: number;
      bottom: number;
      left: number;
    }>;
    header?: Partial<ReportHeader>;
    footer?: Partial<ReportFooter>;
    styling?: Partial<ReportStyling>;
  };
  widgetDefaults: Partial<WidgetReportConfig>;
  isDefault: boolean;
  category: 'executive' | 'operational' | 'analytical' | 'custom';
}

export interface ReportPreview {
  thumbnailUrl: string;
  pageCount: number;
  estimatedSize: number;
  processingTime: number;
  status: 'generating' | 'ready' | 'error';
  errorMessage?: string;
}

// Report generation progress tracking
export interface ReportGenerationProgress {
  stage: 'initializing' | 'collecting-data' | 'rendering-widgets' | 'formatting' | 'exporting' | 'complete' | 'error';
  progress: number; // 0-100
  currentWidget?: string;
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

// Widget-specific report configurations
export interface ChartReportConfig extends WidgetReportConfig {
  exportFormat: 'chart' | 'image';
  resolution: number; // DPI for images
  backgroundColor: string;
  showDataLabels: boolean;
  chartType?: 'original' | 'simplified' | 'table';
}

export interface TableReportConfig extends WidgetReportConfig {
  exportFormat: 'table';
  maxRows?: number;
  showHeaders: boolean;
  alternateRowColors: boolean;
  fontSize: number;
  columnWidths?: number[];
}

export interface MetricReportConfig extends WidgetReportConfig {
  exportFormat: 'summary';
  showTrend: boolean;
  showComparison: boolean;
  comparisonPeriod?: 'previous-period' | 'year-over-year' | 'custom';
  highlightColor: string;
}

// Report builder state
export interface ReportBuilderState {
  selectedWidgets: Set<string>;
  reportConfig: Partial<DashboardReport>;
  currentStep: 'widgets' | 'layout' | 'formatting' | 'preview' | 'export';
  validationErrors: string[];
  isDirty: boolean;
}

// Export result
export interface ReportExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  size: number;
  format: string;
  error?: string;
  reportId: string;
} 