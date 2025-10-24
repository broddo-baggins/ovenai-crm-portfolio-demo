import { ServiceErrorHandler } from './base/errorHandler';

/**
 * Lead types based on Supabase schema
 */
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'MEETING_SCHEDULED' | 'CLOSED_WON' | 'CLOSED_LOST';
  temperature: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

/**
 * Lead import data structure
 */
export interface LeadImportData {
  leads: Partial<Lead>[];
  projectId: string;
}

/**
 * Report types for generation
 */
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * API Service
 * 
 * Centralized service for API calls to n8n workflows and AWS services
 * Uses consolidated error handling patterns for consistency
 */
const apiService = {
  /**
   * Configuration for AWS API
   */
  awsConfig: {
    apiUrl: '',  // Set from environment or config
    region: 'us-east-1',
  },

  /**
   * Set configurations for the API service
   * @param config Configuration object with keys to set
   */
  setConfig(config: { awsApiUrl?: string }) {
    if (config.awsApiUrl) this.awsConfig.apiUrl = config.awsApiUrl;
  },

  /**
   * Get leads from API
   * @returns Promise with array of leads
   */
  async getLeads(): Promise<Lead[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const response = await fetch('/api/leads');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads');
        }
        
        return response.json();
      },
      'ApiService',
      'getLeads'
    ).then(result => result.data || []);
  },
  
  /**
   * Import leads to n8n workflow
   * @param data Lead import data
   * @returns Promise with import results
   */
  async importLeadsToN8n(data: LeadImportData): Promise<{ success: boolean }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const response = await fetch('/leads/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to import leads to n8n');
        }
        
        return response.json();
      },
      'ApiService',
      'importLeadsToN8n'
    ).then(result => result.data || { success: false });
  },
  
  /**
   * Generate report using AWS Lambda
   * @param type Report type
   * @param params Optional parameters
   * @returns Promise with report blob
   */
  async generateReport(type: ReportType, params?: Record<string, any>): Promise<Blob> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value.toString());
          });
        }
        
        const response = await fetch(`/api/reports/${type}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate report with AWS Lambda');
        }
        
        return response.blob();
      },
      'ApiService',
      'generateReport'
    ).then(result => result.data || new Blob());
  },
  
  /**
   * Schedule report generation using AWS EventBridge
   * @param type Report type
   * @param email Email to send report to
   * @param schedule Cron expression for schedule
   * @returns Promise with scheduling result
   */
  async scheduleReport(type: ReportType, email: string, schedule: string): Promise<{ success: boolean }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const response = await fetch(`/api/reports/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, email, schedule }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to schedule report with AWS EventBridge');
        }
        
        return response.json();
      },
      'ApiService',
      'scheduleReport'
    ).then(result => result.data || { success: false });
  },

  /**
   * Get notifications from API
   * @returns Promise with array of notifications
   */
  async getNotifications(): Promise<Notification[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        return response.json();
      },
      'ApiService',
      'getNotifications'
    ).then(result => result.data || []);
  }
};

export default apiService;
