import { simpleProjectService } from "./simpleProjectService";
import { userSettingsService } from "./userSettingsService";

// Advanced Report Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "sales" | "marketing" | "analytics" | "custom";
  sections: ReportSection[];
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: "chart" | "table" | "metric" | "text";
  chartType?: "bar" | "line" | "pie" | "funnel" | "area";
  dataSource: string;
  filters: ReportFilter[];
  columns?: string[];
  aggregation?: "sum" | "avg" | "count" | "max" | "min";
  groupBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export interface ReportFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "between";
  value: any;
  logicalOperator?: "and" | "or";
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  recipients: string[];
  schedule: "daily" | "weekly" | "monthly" | "custom";
  customSchedule?: string; // Cron expression
  format: "pdf" | "csv" | "xlsx" | "email";
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export interface ReportExportOptions {
  format: "pdf" | "csv" | "xlsx" | "json";
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ReportFilter[];
}

export interface ReportAnalytics {
  totalReports: number;
  reportsGenerated: number;
  mostUsedTemplate: string;
  averageGenerationTime: number;
  popularDataSources: string[];
  userEngagement: {
    dailyUsers: number;
    weeklyUsers: number;
    monthlyUsers: number;
  };
}

export class AdvancedReportingService {
  
  // =========================
  // REPORT TEMPLATES
  // =========================

  /**
   * Get all available report templates
   */
  static async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      // Load custom templates from user settings
      const customTemplates = await this.getCustomTemplates();
      
      // Combine with predefined templates
      const predefinedTemplates = this.getPredefinedTemplates();
      
      return [...predefinedTemplates, ...customTemplates];
    } catch (error) {
      console.error('Error loading report templates:', error);
      return this.getPredefinedTemplates();
    }
  }

  /**
   * Get predefined report templates
   */
  private static getPredefinedTemplates(): ReportTemplate[] {
    return [
      {
        id: "lead-performance-summary",
        name: "Lead Performance Summary",
        description: "Comprehensive lead conversion and performance analysis",
        category: "sales",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          {
            id: "lead-funnel",
            title: "Lead Conversion Funnel",
            type: "chart",
            chartType: "funnel",
            dataSource: "leads",
            filters: [],
            groupBy: "status",
            aggregation: "count"
          },
          {
            id: "temperature-distribution",
            title: "Lead Temperature Distribution",
            type: "chart",
            chartType: "pie",
            dataSource: "leads",
            filters: [],
            groupBy: "temperature",
            aggregation: "count"
          },
          {
            id: "conversion-metrics",
            title: "Key Conversion Metrics",
            type: "metric",
            dataSource: "leads",
            filters: []
          }
        ]
      },
      {
        id: "communication-analytics",
        name: "Communication Analytics",
        description: "WhatsApp message patterns and engagement analysis",
        category: "marketing",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          {
            id: "message-volume",
            title: "Daily Message Volume",
            type: "chart",
            chartType: "bar",
            dataSource: "messages",
            filters: [],
            groupBy: "date",
            aggregation: "count"
          },
          {
            id: "response-times",
            title: "Average Response Times",
            type: "chart",
            chartType: "line",
            dataSource: "conversations",
            filters: [],
            groupBy: "date",
            aggregation: "avg"
          },
          {
            id: "engagement-rates",
            title: "Engagement Rates",
            type: "metric",
            dataSource: "conversations",
            filters: []
          }
        ]
      },
      {
        id: "business-overview",
        name: "Business Overview Dashboard",
        description: "High-level business metrics and KPIs",
        category: "analytics",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          {
            id: "lead-summary",
            title: "Lead Summary",
            type: "metric",
            dataSource: "leads",
            filters: []
          },
          {
            id: "conversation-trends",
            title: "Conversation Trends",
            type: "chart",
            chartType: "area",
            dataSource: "conversations",
            filters: [],
            groupBy: "week",
            aggregation: "count"
          },
          {
            id: "project-performance",
            title: "Project Performance",
            type: "table",
            dataSource: "projects",
            filters: [],
            columns: ["name", "lead_count", "conversion_rate", "status"]
          }
        ]
      }
    ];
  }

  /**
   * Create custom report template
   */
  static async createCustomTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>): Promise<ReportTemplate> {
    try {
      const newTemplate: ReportTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const customTemplates = await this.getCustomTemplates();
      customTemplates.push(newTemplate);
      
      await this.saveCustomTemplates(customTemplates);
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating custom template:', error);
      throw new Error('Failed to create custom template');
    }
  }

  /**
   * Update custom report template
   */
  static async updateCustomTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const customTemplates = await this.getCustomTemplates();
      const templateIndex = customTemplates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error('Template not found');
      }

      const updatedTemplate = {
        ...customTemplates[templateIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      customTemplates[templateIndex] = updatedTemplate;
      await this.saveCustomTemplates(customTemplates);
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating custom template:', error);
      throw new Error('Failed to update custom template');
    }
  }

  /**
   * Delete custom report template
   */
  static async deleteCustomTemplate(templateId: string): Promise<boolean> {
    try {
      const customTemplates = await this.getCustomTemplates();
      const filteredTemplates = customTemplates.filter(t => t.id !== templateId);
      
      await this.saveCustomTemplates(filteredTemplates);
      return true;
    } catch (error) {
      console.error('Error deleting custom template:', error);
      return false;
    }
  }

  // =========================
  // REPORT GENERATION
  // =========================

  /**
   * Generate report from template
   */
  static async generateReport(
    templateId: string, 
    filters: ReportFilter[] = [],
    exportOptions?: ReportExportOptions
  ): Promise<any> {
    try {
      const templates = await this.getReportTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Report template not found');
      }

      // Load base data
      const [leads, conversations, messages, projects] = await Promise.all([
        simpleProjectService.getAllLeads(),
        simpleProjectService.getAllConversations(),
        simpleProjectService.getWhatsAppMessages(2000),
        simpleProjectService.getAllProjects()
      ]);

      const reportData = {
        template,
        generatedAt: new Date().toISOString(),
        sections: []
      };

      // Process each section
      for (const section of template.sections) {
        const sectionData = await this.processSectionData(section, {
          leads, conversations, messages, projects
        }, filters);
        
        reportData.sections.push({
          ...section,
          data: sectionData
        });
      }

      // Apply export options if specified
      if (exportOptions) {
        return await this.exportReport(reportData, exportOptions);
      }

      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Process section data based on section configuration
   */
  private static async processSectionData(
    section: ReportSection,
    data: any,
    additionalFilters: ReportFilter[] = []
  ): Promise<any> {
    try {
      let sourceData = data[section.dataSource] || [];
      
      // Apply filters
      const allFilters = [...section.filters, ...additionalFilters];
      sourceData = this.applyFilters(sourceData, allFilters);

      switch (section.type) {
        case 'metric':
          return this.calculateMetrics(sourceData, section);
          
        case 'chart':
          return this.generateChartData(sourceData, section);
          
        case 'table':
          return this.generateTableData(sourceData, section);
          
        default:
          return sourceData;
      }
    } catch (error) {
      console.error('Error processing section data:', error);
      return [];
    }
  }

  /**
   * Calculate metrics for metric sections
   */
  private static calculateMetrics(data: any[], section: ReportSection): any {
    const metrics: any = {
      total: data.length,
      trend: 0,
      breakdown: {},
      average: 0,
      sum: 0,
      max: 0,
      min: 0
    };

    if (section.groupBy) {
      metrics.breakdown = data.reduce((acc, item) => {
        const key = item[section.groupBy];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }

    if (section.aggregation && section.aggregation !== 'count') {
      const values = data.map(item => parseFloat(item[section.groupBy] || 0)).filter(v => !isNaN(v));
      
      switch (section.aggregation) {
        case 'avg':
          metrics.average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'sum':
          metrics.sum = values.reduce((a, b) => a + b, 0);
          break;
        case 'max':
          metrics.max = values.length > 0 ? Math.max(...values) : 0;
          break;
        case 'min':
          metrics.min = values.length > 0 ? Math.min(...values) : 0;
          break;
      }
    } else {
      // Provide basic aggregations even without specific aggregation type
      const values = data.map(item => parseFloat(item.value || 1)).filter(v => !isNaN(v));
      if (values.length > 0) {
        metrics.average = values.reduce((a, b) => a + b, 0) / values.length;
        metrics.sum = values.reduce((a, b) => a + b, 0);
        metrics.max = Math.max(...values);
        metrics.min = Math.min(...values);
      }
    }

    return metrics;
  }

  /**
   * Generate chart data for chart sections
   */
  private static generateChartData(data: any[], section: ReportSection): any[] {
    if (!section.groupBy) return [];

    const grouped = data.reduce((acc, item) => {
      const key = item[section.groupBy] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let chartData = Object.entries(grouped).map(([key, value]) => ({
      name: key,
      value: value,
      count: value
    }));

    // Apply sorting
    if (section.sortBy) {
      chartData.sort((a, b) => {
        const aVal = a[section.sortBy];
        const bVal = b[section.sortBy];
        const order = section.sortOrder === 'desc' ? -1 : 1;
        return (aVal > bVal ? 1 : -1) * order;
      });
    }

    // Apply limit
    if (section.limit) {
      chartData = chartData.slice(0, section.limit);
    }

    return chartData;
  }

  /**
   * Generate table data for table sections
   */
  private static generateTableData(data: any[], section: ReportSection): any[] {
    let tableData = data;

    // Select columns if specified
    if (section.columns && section.columns.length > 0) {
      tableData = data.map(item => {
        const filtered = {};
        section.columns.forEach(col => {
          filtered[col] = item[col];
        });
        return filtered;
      });
    }

    // Apply sorting
    if (section.sortBy) {
      tableData.sort((a, b) => {
        const aVal = a[section.sortBy];
        const bVal = b[section.sortBy];
        const order = section.sortOrder === 'desc' ? -1 : 1;
        return (aVal > bVal ? 1 : -1) * order;
      });
    }

    // Apply limit
    if (section.limit) {
      tableData = tableData.slice(0, section.limit);
    }

    return tableData;
  }

  /**
   * Apply filters to data
   */
  private static applyFilters(data: any[], filters: ReportFilter[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'gt':
            return parseFloat(value) > parseFloat(filter.value);
          case 'lt':
            return parseFloat(value) < parseFloat(filter.value);
          case 'gte':
            return parseFloat(value) >= parseFloat(filter.value);
          case 'lte':
            return parseFloat(value) <= parseFloat(filter.value);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'between':
            return Array.isArray(filter.value) && 
                   parseFloat(value) >= parseFloat(filter.value[0]) && 
                   parseFloat(value) <= parseFloat(filter.value[1]);
          default:
            return true;
        }
      });
    });
  }

  // =========================
  // SCHEDULED REPORTS
  // =========================

  /**
   * Schedule a report for automatic generation
   */
  static async scheduleReport(scheduledReport: Omit<ScheduledReport, 'id' | 'createdAt'>): Promise<ScheduledReport> {
    try {
      const newSchedule: ScheduledReport = {
        ...scheduledReport,
        id: `schedule-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      // Calculate next run time
      newSchedule.nextRun = this.calculateNextRun(scheduledReport.schedule, scheduledReport.customSchedule);

      const schedules = await this.getScheduledReports();
      schedules.push(newSchedule);
      
      await this.saveScheduledReports(schedules);
      
      return newSchedule;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw new Error('Failed to schedule report');
    }
  }

  /**
   * Get all scheduled reports
   */
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      return prefs.advanced_reporting?.scheduled_reports || [];
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      return [];
    }
  }

  /**
   * Update scheduled report
   */
  static async updateScheduledReport(scheduleId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      const schedules = await this.getScheduledReports();
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
      
      if (scheduleIndex === -1) {
        throw new Error('Scheduled report not found');
      }

      const updatedSchedule = {
        ...schedules[scheduleIndex],
        ...updates
      };

      // Recalculate next run if schedule changed
      if (updates.schedule || updates.customSchedule) {
        updatedSchedule.nextRun = this.calculateNextRun(
          updatedSchedule.schedule, 
          updatedSchedule.customSchedule
        );
      }

      schedules[scheduleIndex] = updatedSchedule;
      await this.saveScheduledReports(schedules);
      
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      throw new Error('Failed to update scheduled report');
    }
  }

  /**
   * Delete scheduled report
   */
  static async deleteScheduledReport(scheduleId: string): Promise<boolean> {
    try {
      const schedules = await this.getScheduledReports();
      const filteredSchedules = schedules.filter(s => s.id !== scheduleId);
      
      await this.saveScheduledReports(filteredSchedules);
      return true;
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      return false;
    }
  }

  /**
   * Calculate next run time for scheduled report
   */
  private static calculateNextRun(schedule: string, customSchedule?: string): string {
    const now = new Date();
    
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString();
      case 'custom':
        // For custom schedules, add 1 day as fallback (would need cron parser in production)
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // =========================
  // EXPORT FUNCTIONALITY
  // =========================

  /**
   * Export report to specified format
   */
  static async exportReport(reportData: any, options: ReportExportOptions): Promise<Blob | string> {
    try {
      switch (options.format) {
        case 'json':
          return JSON.stringify(reportData, null, 2);
          
        case 'csv':
          return this.exportToCSV(reportData);
          
        case 'pdf':
          return await this.exportToPDF(reportData, options);
          
        case 'xlsx':
          return await this.exportToXLSX(reportData);
          
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  }

  /**
   * Export report data to CSV format
   */
  private static exportToCSV(reportData: any): string {
    const csvRows = [];
    
    // Add header
    csvRows.push(`"Report: ${reportData.template.name}"`);
    csvRows.push(`"Generated: ${new Date(reportData.generatedAt).toLocaleString()}"`);
    csvRows.push(''); // Empty row

    // Process each section
    reportData.sections.forEach(section => {
      csvRows.push(`"Section: ${section.title}"`);
      
      if (section.type === 'table' && Array.isArray(section.data)) {
        // Table data
        if (section.data.length > 0) {
          const headers = Object.keys(section.data[0]);
          csvRows.push(headers.map(h => `"${h}"`).join(','));
          
          section.data.forEach(row => {
            const values = headers.map(h => `"${row[h] || ''}"`);
            csvRows.push(values.join(','));
          });
        }
      } else if (section.type === 'chart' && Array.isArray(section.data)) {
        // Chart data
        csvRows.push('"Name","Value"');
        section.data.forEach(item => {
          csvRows.push(`"${item.name}","${item.value}"`);
        });
      } else if (section.type === 'metric') {
        // Metric data
        csvRows.push('"Metric","Value"');
        csvRows.push(`"Total","${section.data.total}"`);
        if (section.data.average) csvRows.push(`"Average","${section.data.average}"`);
        if (section.data.sum) csvRows.push(`"Sum","${section.data.sum}"`);
      }
      
      csvRows.push(''); // Empty row between sections
    });

    return csvRows.join('\n');
  }

  /**
   * Export report to PDF format (simplified implementation)
   */
  private static async exportToPDF(reportData: any, options: ReportExportOptions): Promise<Blob> {
    // This is a simplified implementation
    // In production, you'd use a library like jsPDF or Puppeteer
    const content = `
      <html>
        <head>
          <title>${reportData.template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #eee; }
            h2 { color: #555; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .metric { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>${reportData.template.name}</h1>
          <p><strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
          ${reportData.sections.map(section => this.renderSectionHTML(section)).join('')}
        </body>
      </html>
    `;

    return new Blob([content], { type: 'text/html' });
  }

  /**
   * Render section as HTML for PDF export
   */
  private static renderSectionHTML(section: any): string {
    let html = `<h2>${section.title}</h2>`;
    
    if (section.type === 'table' && Array.isArray(section.data) && section.data.length > 0) {
      const headers = Object.keys(section.data[0]);
      html += '<table>';
      html += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      section.data.forEach(row => {
        html += '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>';
      });
      html += '</table>';
    } else if (section.type === 'metric') {
      html += '<div class="metric">';
      html += `<p><strong>Total:</strong> ${section.data.total}</p>`;
      if (section.data.average) html += `<p><strong>Average:</strong> ${section.data.average}</p>`;
      if (section.data.sum) html += `<p><strong>Sum:</strong> ${section.data.sum}</p>`;
      html += '</div>';
    } else if (section.type === 'chart' && Array.isArray(section.data)) {
      html += '<table>';
      html += '<tr><th>Name</th><th>Value</th></tr>';
      section.data.forEach(item => {
        html += `<tr><td>${item.name}</td><td>${item.value}</td></tr>`;
      });
      html += '</table>';
    }
    
    return html;
  }

  /**
   * Export report to XLSX format (placeholder)
   */
  private static async exportToXLSX(reportData: any): Promise<Blob> {
    // Using exceljs for Excel export functionality
    // For now, return CSV content as xlsx placeholder
    const csvContent = this.exportToCSV(reportData);
    return new Blob([csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  // =========================
  // ANALYTICS & INSIGHTS
  // =========================

  /**
   * Get report analytics and usage insights
   */
  static async getReportAnalytics(): Promise<ReportAnalytics> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      const reportUsage = prefs.advanced_reporting?.usage_analytics || {};
      
      return {
        totalReports: reportUsage.total_reports || 0,
        reportsGenerated: reportUsage.reports_generated || 0,
        mostUsedTemplate: reportUsage.most_used_template || 'lead-performance-summary',
        averageGenerationTime: reportUsage.average_generation_time || 2.5,
        popularDataSources: reportUsage.popular_data_sources || ['leads', 'conversations', 'messages'],
        userEngagement: {
          dailyUsers: reportUsage.daily_users || 0,
          weeklyUsers: reportUsage.weekly_users || 0,
          monthlyUsers: reportUsage.monthly_users || 0
        }
      };
    } catch (error) {
      console.error('Error loading report analytics:', error);
      return {
        totalReports: 0,
        reportsGenerated: 0,
        mostUsedTemplate: 'lead-performance-summary',
        averageGenerationTime: 0,
        popularDataSources: [],
        userEngagement: {
          dailyUsers: 0,
          weeklyUsers: 0,
          monthlyUsers: 0
        }
      };
    }
  }

  /**
   * Track report generation for analytics
   */
  static async trackReportGeneration(templateId: string, generationTime: number): Promise<void> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      const usage = prefs.advanced_reporting?.usage_analytics || {};
      
      usage.total_reports = (usage.total_reports || 0) + 1;
      usage.reports_generated = (usage.reports_generated || 0) + 1;
      usage.average_generation_time = 
        ((usage.average_generation_time || 0) * (usage.total_reports - 1) + generationTime) / usage.total_reports;
      
      await userSettingsService.updateAppPreferences({
        ...prefs,
        advanced_reporting: {
          ...prefs.advanced_reporting,
          usage_analytics: usage
        }
      });
    } catch (error) {
      console.error('Error tracking report generation:', error);
    }
  }

  // =========================
  // HELPER METHODS
  // =========================

  /**
   * Get custom templates from user settings
   */
  private static async getCustomTemplates(): Promise<ReportTemplate[]> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      // Handle null or undefined preferences gracefully
      if (!prefs || !prefs.advanced_reporting || !prefs.advanced_reporting.custom_templates) {
        return [];
      }
      return prefs.advanced_reporting.custom_templates || [];
    } catch (error) {
      console.error('Error loading custom templates:', error);
      return [];
    }
  }

  /**
   * Save custom templates to user settings
   */
  private static async saveCustomTemplates(templates: ReportTemplate[]): Promise<void> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      await userSettingsService.updateAppPreferences({
        ...prefs,
        advanced_reporting: {
          ...prefs.advanced_reporting,
          custom_templates: templates
        }
      });
    } catch (error) {
      console.error('Error saving custom templates:', error);
      throw error;
    }
  }

  /**
   * Save scheduled reports to user settings
   */
  private static async saveScheduledReports(schedules: ScheduledReport[]): Promise<void> {
    try {
      const prefs = await userSettingsService.getAppPreferences();
      await userSettingsService.updateAppPreferences({
        ...prefs,
        advanced_reporting: {
          ...prefs.advanced_reporting,
          scheduled_reports: schedules
        }
      });
    } catch (error) {
      console.error('Error saving scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Get available data sources for report building
   */
  static getAvailableDataSources(): string[] {
    return ['leads', 'conversations', 'messages', 'projects', 'clients'];
  }

  /**
   * Get available fields for a data source
   */
  static getDataSourceFields(dataSource: string): string[] {
    const fieldMaps = {
      leads: ['id', 'first_name', 'last_name', 'phone', 'company', 'status', 'temperature', 'created_at', 'updated_at'],
      conversations: ['id', 'lead_id', 'status', 'created_at', 'updated_at', 'last_message_at'],
      messages: ['id', 'conversation_id', 'message', 'sender', 'timestamp', 'message_type'],
      projects: ['id', 'name', 'status', 'created_at', 'updated_at'],
      clients: ['id', 'name', 'email', 'company', 'created_at']
    };
    
    return fieldMaps[dataSource] || [];
  }
}

export default AdvancedReportingService; 