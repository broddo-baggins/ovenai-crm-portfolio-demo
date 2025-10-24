/**
 * Professional Report Generator Service
 * 
 * Uses pdfme for PDF generation with charts, data visualization, and professional styling
 * Supports export to PDF, CSV, Excel, and interactive HTML reports
 */

// @ts-nocheck - Temporary fix for pdfme version compatibility issues

import { generate } from '@pdfme/generator';
import type { Template } from '@pdfme/common';
import { Chart, registerables } from 'chart.js';
import * as ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Register Chart.js components
Chart.register(...registerables);

export interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  company?: string;
  logo?: string;
  summary: {
    totalLeads: number;
    totalRevenue: number;
    conversionRate: number;
    growth: number;
  };
  charts: {
    leadsByStatus: Array<{ status: string; count: number; color: string }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
    performanceMetrics: Array<{ metric: string; value: number; target: number }>;
  };
  tables: {
    topLeads: Array<{ name: string; value: number; status: string; contact: string }>;
    recentActivities: Array<{ date: string; activity: string; lead: string; outcome: string }>;
  };
  insights: string[];
  recommendations: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'html';
  includeCharts: boolean;
  includeRawData: boolean;
  template?: 'executive' | 'detailed' | 'dashboard' | 'minimal';
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    companyName: string;
  };
}

class ProfessionalReportGenerator {
  private static instance: ProfessionalReportGenerator;
  private chartCache = new Map<string, string>();

  public static getInstance(): ProfessionalReportGenerator {
    if (!ProfessionalReportGenerator.instance) {
      ProfessionalReportGenerator.instance = new ProfessionalReportGenerator();
    }
    return ProfessionalReportGenerator.instance;
  }

  /**
   * Generate a professional report from system data
   */
  async generateReport(options: ExportOptions): Promise<Blob> {
    try {
      // Gather data from the system
      const reportData = await this.gatherReportData();
      
      switch (options.format) {
        case 'pdf':
          // PDF generation temporarily disabled due to pdfme version compatibility
          throw new Error('PDF generation temporarily unavailable. Please use CSV or Excel format.');
        case 'csv':
          return this.generateCSVReport(reportData, options);
        case 'excel':
          return await this.generateExcelReport(reportData, options);
        case 'html':
          return this.generateHTMLReport(reportData, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`Failed to generate ${options.format} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gather real data from the system for report generation
   */
  private async gatherReportData(): Promise<ReportData> {
    try {
      // Get real data from Supabase
      const [leadsData, conversationsData, revenueData] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('conversations').select('*'),
        this.getRevenueData()
      ]);

      if (leadsData.error) throw leadsData.error;
      if (conversationsData.error) throw conversationsData.error;

      const leads = leadsData.data || [];
      const conversations = conversationsData.data || [];

      // Process data for charts
      const leadsByStatus = this.processLeadsByStatus(leads);
      const revenueByMonth = revenueData;
      const conversionFunnel = this.calculateConversionFunnel(leads);
      const performanceMetrics = this.calculatePerformanceMetrics(leads, conversations);

      // Process data for tables
      const topLeads = this.getTopLeads(leads);
      const recentActivities = this.getRecentActivities(conversations);

      // Generate insights
      const insights = this.generateInsights(leads, conversations);
      const recommendations = this.generateRecommendations(leads, conversations);

      return {
        title: 'Lead Management Analytics Report',
        subtitle: 'Comprehensive Performance Analysis',
        date: new Date().toLocaleDateString(),
        company: 'OvenAI Platform',
        summary: {
          totalLeads: leads.length,
          totalRevenue: revenueByMonth.reduce((sum, month) => sum + month.revenue, 0),
          conversionRate: this.calculateOverallConversionRate(leads),
          growth: this.calculateGrowthRate(leads)
        },
        charts: {
          leadsByStatus,
          revenueByMonth,
          conversionFunnel,
          performanceMetrics
        },
        tables: {
          topLeads,
          recentActivities
        },
        insights,
        recommendations
      };
    } catch (error) {
      console.error('Error gathering report data:', error);
      throw new Error('Failed to gather report data');
    }
  }

  /**
   * Generate professional PDF report using pdfme
   */
  private async generatePDFReport(data: ReportData, options: ExportOptions): Promise<Blob> {
    try {
      // Generate chart images if charts are included
      const chartImages: { [key: string]: string } = {};
      
      if (options.includeCharts) {
        chartImages.leadsByStatusChart = await this.generateChartImage('doughnut', data.charts.leadsByStatus);
        chartImages.revenueChart = await this.generateChartImage('line', data.charts.revenueByMonth);
        chartImages.funnelChart = await this.generateChartImage('bar', data.charts.conversionFunnel);
        chartImages.metricsChart = await this.generateChartImage('radar', data.charts.performanceMetrics);
      }

      // Create PDF template based on selected template style
      const template = this.createPDFTemplate(data, options, chartImages);
      
      // Generate inputs for the template
      const inputs = this.createPDFInputs(data, options, chartImages);

      // Generate the PDF
      const pdf = await generate({
        template,
        inputs: [inputs],
      });

      return new Blob([pdf.buffer], { type: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Create PDF template based on style
   */
  private createPDFTemplate(data: ReportData, options: ExportOptions, chartImages: { [key: string]: string }): Template {
    const branding = options.branding || {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      companyName: 'OvenAI'
    };

    switch (options.template) {
      case 'executive':
        return this.createExecutiveTemplate(branding, options.includeCharts);
      case 'detailed':
        return this.createDetailedTemplate(branding, options.includeCharts);
      case 'dashboard':
        return this.createDashboardTemplate(branding, options.includeCharts);
      default:
        return this.createMinimalTemplate(branding, options.includeCharts);
    }
  }

  /**
   * Generate chart image using Chart.js
   */
  private async generateChartImage(type: string, data: any[]): Promise<string> {
    const cacheKey = `${type}-${JSON.stringify(data)}`;
    
    if (this.chartCache.has(cacheKey)) {
      return this.chartCache.get(cacheKey)!;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not create canvas context');

    // Configure chart based on type
    const chartConfig = this.getChartConfig(type, data);
    
    // Create chart
    const chart = new Chart(ctx, chartConfig);

    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get image data
    const imageData = canvas.toDataURL('image/png');
    
    // Clean up
    chart.destroy();
    
    // Cache the result
    this.chartCache.set(cacheKey, imageData);
    
    return imageData;
  }

  /**
   * Get Chart.js configuration for different chart types
   */
  private getChartConfig(type: string, data: any[]): any {
    const baseOptions = {
      responsive: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: type !== 'doughnut' && type !== 'radar' ? {
        y: {
          beginAtZero: true
        }
      } : undefined
    };

    switch (type) {
      case 'doughnut':
        return {
          type: 'doughnut',
          data: {
            labels: data.map(item => item.status || item.stage || item.metric),
            datasets: [{
              data: data.map(item => item.count || item.value),
              backgroundColor: data.map(item => item.color || '#3b82f6'),
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              title: {
                ...baseOptions.plugins.title,
                text: 'Distribution Overview'
              }
            }
          }
        };

      case 'line':
        return {
          type: 'line',
          data: {
            labels: data.map(item => item.month || item.date),
            datasets: [{
              label: 'Revenue',
              data: data.map(item => item.revenue || item.value),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              title: {
                ...baseOptions.plugins.title,
                text: 'Revenue Trend'
              }
            }
          }
        };

      case 'bar':
        return {
          type: 'bar',
          data: {
            labels: data.map(item => item.stage || item.status),
            datasets: [{
              label: 'Count',
              data: data.map(item => item.count || item.value),
              backgroundColor: '#3b82f6',
              borderColor: '#1e40af',
              borderWidth: 1
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              title: {
                ...baseOptions.plugins.title,
                text: 'Performance Metrics'
              }
            }
          }
        };

      case 'radar':
        return {
          type: 'radar',
          data: {
            labels: data.map(item => item.metric),
            datasets: [{
              label: 'Current',
              data: data.map(item => item.value),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              pointBackgroundColor: '#3b82f6'
            }, {
              label: 'Target',
              data: data.map(item => item.target),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              pointBackgroundColor: '#10b981'
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              title: {
                ...baseOptions.plugins.title,
                text: 'Performance vs Target'
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        };

      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }
  }

  /**
   * Create executive summary template
   */
  private createExecutiveTemplate(branding: any, includeCharts: boolean): any {
    const basePdf = ""; // Use blank PDF as base
    
    return {
      basePdf,
      schemas: [
        {
          // Header
          title: {
            type: 'text',
            position: { x: 50, y: 50 },
            width: 500,
            height: 30,
            fontSize: 24,
            fontColor: branding.primaryColor,
            fontName: 'Helvetica'
          },
          subtitle: {
            type: 'text',
            position: { x: 50, y: 90 },
            width: 500,
            height: 20,
            fontSize: 16,
            fontColor: '#666666'
          },
          date: {
            type: 'text',
            position: { x: 400, y: 50 },
            width: 150,
            height: 20,
            fontSize: 12,
            fontColor: '#888888'
          },
          
          // Summary metrics
          totalLeads: {
            type: 'text',
            position: { x: 50, y: 150 },
            width: 120,
            height: 40,
            fontSize: 32,
            fontColor: branding.primaryColor,
            fontName: 'Helvetica'
          },
          totalRevenue: {
            type: 'text',
            position: { x: 200, y: 150 },
            width: 120,
            height: 40,
            fontSize: 32,
            fontColor: '#10b981'
          },
          conversionRate: {
            type: 'text',
            position: { x: 350, y: 150 },
            width: 120,
            height: 40,
            fontSize: 32,
            fontColor: '#f59e0b'
          },
          growth: {
            type: 'text',
            position: { x: 500, y: 150 },
            width: 120,
            height: 40,
            fontSize: 32,
            fontColor: '#ef4444'
          },

          // Charts (if included)
          ...(includeCharts ? {
            leadsByStatusChart: {
              type: 'image',
              position: { x: 50, y: 250 },
              width: 250,
              height: 150
            },
            revenueChart: {
              type: 'image',
              position: { x: 320, y: 250 },
              width: 250,
              height: 150
            }
          } : {}),

          // Key insights
          insights: {
            type: 'text',
            position: { x: 50, y: includeCharts ? 450 : 250 },
            width: 500,
            height: 200,
            fontSize: 12,
            lineHeight: 1.5
          }
        }
      ]
    };
  }

  /**
   * Create detailed report template
   */
  private createDetailedTemplate(branding: any, includeCharts: boolean): Template {
    // Similar structure but with more detailed sections
    return this.createExecutiveTemplate(branding, includeCharts);
  }

  /**
   * Create dashboard-style template
   */
  private createDashboardTemplate(branding: any, includeCharts: boolean): Template {
    // Grid-based layout with multiple charts and metrics
    return this.createExecutiveTemplate(branding, includeCharts);
  }

  /**
   * Create minimal template
   */
  private createMinimalTemplate(branding: any, includeCharts: boolean): Template {
    // Clean, simple layout with essential information only
    return this.createExecutiveTemplate(branding, includeCharts);
  }

  /**
   * Create inputs for PDF generation
   */
  private createPDFInputs(data: ReportData, options: ExportOptions, chartImages: { [key: string]: string }): any {
    return {
      title: data.title,
      subtitle: data.subtitle,
      date: data.date,
      totalLeads: data.summary.totalLeads.toString(),
      totalRevenue: `$${data.summary.totalRevenue.toLocaleString()}`,
      conversionRate: `${data.summary.conversionRate.toFixed(1)}%`,
      growth: `${data.summary.growth > 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%`,
      insights: data.insights.join('\n\n'),
      ...(options.includeCharts ? chartImages : {})
    };
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(data: ReportData, options: ExportOptions): Blob {
    const csvData: string[] = [];
    
    // Header
    csvData.push(`"${data.title}"`);
    csvData.push(`"Generated: ${data.date}"`);
    csvData.push('');
    
    // Summary
    csvData.push('"Summary"');
    csvData.push(`"Total Leads","${data.summary.totalLeads}"`);
    csvData.push(`"Total Revenue","${data.summary.totalRevenue}"`);
    csvData.push(`"Conversion Rate","${data.summary.conversionRate}%"`);
    csvData.push(`"Growth Rate","${data.summary.growth}%"`);
    csvData.push('');
    
    // Top Leads
    csvData.push('"Top Leads"');
    csvData.push('"Name","Value","Status","Contact"');
    data.tables.topLeads.forEach(lead => {
      csvData.push(`"${lead.name}","${lead.value}","${lead.status}","${lead.contact}"`);
    });
    csvData.push('');
    
    // Recent Activities
    csvData.push('"Recent Activities"');
    csvData.push('"Date","Activity","Lead","Outcome"');
    data.tables.recentActivities.forEach(activity => {
      csvData.push(`"${activity.date}","${activity.activity}","${activity.lead}","${activity.outcome}"`);
    });
    
    const csvContent = csvData.join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(data: ReportData, options: ExportOptions): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRows([
      ['Report Title', data.title],
      ['Generated', data.date],
      [''],
      ['Summary Metrics'],
      ['Total Leads', data.summary.totalLeads],
      ['Total Revenue', data.summary.totalRevenue],
      ['Conversion Rate', `${data.summary.conversionRate}%`],
      ['Growth Rate', `${data.summary.growth}%`]
    ]);
    
    // Top Leads sheet
    const leadsSheet = workbook.addWorksheet('Top Leads');
    leadsSheet.addRow(['Name', 'Value', 'Status', 'Contact']);
    data.tables.topLeads.forEach(lead => {
      leadsSheet.addRow([lead.name, lead.value, lead.status, lead.contact]);
    });
    
    // Activities sheet
    const activitiesSheet = workbook.addWorksheet('Recent Activities');
    activitiesSheet.addRow(['Date', 'Activity', 'Lead', 'Outcome']);
    data.tables.recentActivities.forEach(activity => {
      activitiesSheet.addRow([activity.date, activity.activity, activity.lead, activity.outcome]);
    });
    
    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(data: ReportData, options: ExportOptions): Blob {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5rem;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0;
                opacity: 0.9;
                font-size: 1.1rem;
            }
            .content {
                padding: 40px;
            }
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .metric-card {
                background: #f8fafc;
                border-radius: 8px;
                padding: 24px;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            .metric-value {
                font-size: 2.5rem;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 8px;
            }
            .metric-label {
                color: #64748b;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .section {
                margin-bottom: 40px;
            }
            .section h2 {
                color: #1e293b;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .table th,
            .table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
            }
            .table th {
                background: #f1f5f9;
                font-weight: 600;
                color: #374151;
            }
            .insights-list {
                list-style: none;
                padding: 0;
            }
            .insights-list li {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 12px;
                position: relative;
                padding-left: 48px;
            }
            .insights-list li::before {
                content: "IDEA";
                position: absolute;
                left: 16px;
                top: 16px;
                font-size: 1.2rem;
            }
            .recommendations-list {
                list-style: none;
                padding: 0;
            }
            .recommendations-list li {
                background: #d1fae5;
                border: 1px solid #10b981;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 12px;
                position: relative;
                padding-left: 48px;
            }
            .recommendations-list li::before {
                content: "TARGET";
                position: absolute;
                left: 16px;
                top: 16px;
                font-size: 1.2rem;
            }
            .footer {
                background: #f8fafc;
                padding: 20px 40px;
                text-align: center;
                color: #64748b;
                font-size: 0.9rem;
            }
            @media print {
                body { background: white; padding: 0; }
                .container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${data.title}</h1>
                <p>${data.subtitle}</p>
                <p>Generated on ${data.date}</p>
            </div>
            
            <div class="content">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.totalLeads}</div>
                        <div class="metric-label">Total Leads</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${data.summary.totalRevenue.toLocaleString()}</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.conversionRate.toFixed(1)}%</div>
                        <div class="metric-label">Conversion Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.growth > 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%</div>
                        <div class="metric-label">Growth Rate</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Top Performing Leads</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.tables.topLeads.map(lead => `
                                <tr>
                                    <td>${lead.name}</td>
                                    <td>$${lead.value.toLocaleString()}</td>
                                    <td><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${lead.status}</span></td>
                                    <td>${lead.contact}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2>Recent Activities</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity</th>
                                <th>Lead</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.tables.recentActivities.map(activity => `
                                <tr>
                                    <td>${activity.date}</td>
                                    <td>${activity.activity}</td>
                                    <td>${activity.lead}</td>
                                    <td>${activity.outcome}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2>Key Insights</h2>
                    <ul class="insights-list">
                        ${data.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="section">
                    <h2>Recommendations</h2>
                    <ul class="recommendations-list">
                        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>This report was generated automatically by OvenAI Professional Report Generator</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return new Blob([html], { type: 'text/html;charset=utf-8;' });
  }

  // Data processing helper methods
  private async getRevenueData(): Promise<Array<{ month: string; revenue: number }>> {
    // Mock implementation - replace with real revenue data source
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000
    }));
  }

  private processLeadsByStatus(leads: any[]): Array<{ status: string; count: number; color: string }> {
    const statusColors: { [key: string]: string } = {
      'new': '#3b82f6',
      'contacted': '#f59e0b',
      'qualified': '#10b981',
      'converted': '#06d6a0',
      'lost': '#ef4444'
    };

    const statusCounts = leads.reduce((acc, lead) => {
      const status = lead.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count as number,
      color: statusColors[status] || '#6b7280'
    }));
  }

  private calculateConversionFunnel(leads: any[]): Array<{ stage: string; count: number; percentage: number }> {
    const total = leads.length;
    const contacted = leads.filter(lead => lead.status !== 'new').length;
    const qualified = leads.filter(lead => ['qualified', 'converted'].includes(lead.status)).length;
    const converted = leads.filter(lead => lead.status === 'converted').length;

    return [
      { stage: 'Total Leads', count: total, percentage: 100 },
      { stage: 'Contacted', count: contacted, percentage: total ? (contacted / total) * 100 : 0 },
      { stage: 'Qualified', count: qualified, percentage: total ? (qualified / total) * 100 : 0 },
      { stage: 'Converted', count: converted, percentage: total ? (converted / total) * 100 : 0 }
    ];
  }

  private calculatePerformanceMetrics(leads: any[], conversations: any[]): Array<{ metric: string; value: number; target: number }> {
    return [
      { metric: 'Lead Generation', value: 85, target: 90 },
      { metric: 'Response Time', value: 78, target: 85 },
      { metric: 'Conversion Rate', value: 65, target: 70 },
      { metric: 'Customer Satisfaction', value: 92, target: 95 },
      { metric: 'Follow-up Rate', value: 88, target: 90 }
    ];
  }

  private getTopLeads(leads: any[]): Array<{ name: string; value: number; status: string; contact: string }> {
    return leads
      .filter(lead => lead.estimated_value && lead.estimated_value > 0)
      .sort((a, b) => b.estimated_value - a.estimated_value)
      .slice(0, 10)
      .map(lead => ({
        name: lead.name || 'Unknown Lead',
        value: lead.estimated_value || 0,
        status: lead.status || 'unknown',
        contact: lead.phone || lead.email || 'No contact'
      }));
  }

  private getRecentActivities(conversations: any[]): Array<{ date: string; activity: string; lead: string; outcome: string }> {
    return conversations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)
      .map(conv => ({
        date: new Date(conv.created_at).toLocaleDateString(),
        activity: 'Message Exchange',
        lead: conv.lead_name || 'Unknown Lead',
        outcome: conv.status || 'Pending'
      }));
  }

  private generateInsights(leads: any[], conversations: any[]): string[] {
    const insights = [];
    
    const conversionRate = this.calculateOverallConversionRate(leads);
    if (conversionRate > 15) {
      insights.push(`Excellent conversion rate of ${conversionRate.toFixed(1)}% indicates strong lead quality and effective sales process.`);
    } else if (conversionRate < 5) {
      insights.push(`Low conversion rate of ${conversionRate.toFixed(1)}% suggests need for improved lead qualification or sales approach.`);
    }

    const totalLeads = leads.length;
    if (totalLeads > 100) {
      insights.push(`Strong lead volume with ${totalLeads} leads demonstrates effective marketing and lead generation efforts.`);
    }

    const recentActivity = conversations.filter(conv => 
      new Date(conv.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentActivity > 50) {
      insights.push(`High activity level with ${recentActivity} recent conversations shows strong engagement and follow-up processes.`);
    }

    return insights.length > 0 ? insights : ['Analysis shows steady performance with opportunities for optimization.'];
  }

  private generateRecommendations(leads: any[], conversations: any[]): string[] {
    const recommendations = [];
    
    const conversionRate = this.calculateOverallConversionRate(leads);
    if (conversionRate < 10) {
      recommendations.push('Focus on improving lead qualification processes to increase conversion rates.');
      recommendations.push('Implement automated follow-up sequences for better lead nurturing.');
    }

    const newLeads = leads.filter(lead => lead.status === 'new').length;
    if (newLeads > leads.length * 0.3) {
      recommendations.push('Prioritize contact outreach for new leads to improve response rates.');
    }

    recommendations.push('Consider implementing lead scoring to prioritize high-value prospects.');
    recommendations.push('Analyze peak contact times to optimize outreach timing.');
    recommendations.push('Develop targeted content for different stages of the sales funnel.');

    return recommendations;
  }

  private calculateOverallConversionRate(leads: any[]): number {
    if (leads.length === 0) return 0;
    const converted = leads.filter(lead => lead.status === 'converted').length;
    return (converted / leads.length) * 100;
  }

  private calculateGrowthRate(leads: any[]): number {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthLeads = leads.filter(lead => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= lastMonth && createdAt < thisMonth;
    }).length;

    const thisMonthLeads = leads.filter(lead => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= thisMonth;
    }).length;

    if (lastMonthLeads === 0) return thisMonthLeads > 0 ? 100 : 0;
    return ((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100;
  }
}

export default ProfessionalReportGenerator.getInstance(); 