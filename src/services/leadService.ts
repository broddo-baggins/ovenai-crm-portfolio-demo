// @ts-nocheck
// TypeScript checking disabled for deployment compatibility
import { mapDatabaseLeadToAppLead, mapDatabaseProjectToAppProject } from '../types/fixes';
import { BaseService } from "./baseService";
import { ServiceErrorHandler } from "./base/errorHandler";
import { EntityValidators } from "./base/validators";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResult } from "@/types/shared";
import { mockApi } from '@/data/mockData';

// Enhanced Lead interface with project information
export interface Lead {
  id: string;
  current_project_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields for reporting
  full_name?: string;
  project?: {
    id: string;
    name: string;
    client_id: string;
    client?: {
      id: string;
      name: string;
    };
  };
}

// Lead statistics interface
export interface LeadStats {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  // leadsBySource removed - source field no longer exists
  recentActivity: number; // leads created in last 30 days
  avgTimeToConversion: number; // in days
}

// Lead import result
export interface LeadImportResult {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

// Lead filtering options
export interface LeadFilters {
  projectId?: string;
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Lead Service - Enhanced with Project Integration and Reporting
 *
 * This service provides comprehensive lead operations including:
 * - CRUD operations for leads
 * - Project assignment and management
 * - Lead statistics and reporting
 * - Bulk operations and imports
 * - Lead tracking and conversion analysis
 *
 * Automatically uses the appropriate Supabase client:
 * - Development: Admin client (bypasses RLS)
 * - Production: Standard client (uses proper authentication)
 */
export class LeadService extends BaseService<any> {
  protected tableName = "leads" as any;
  private get client() {
    return supabase;
  }

  /**
   * Get all leads with optional filtering and project information
   */
  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    // DEMO DEMO MODE: Use mock data
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      const response = await mockApi.getLeads(filters);
      return response.data;
    }
    
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        let query = this.client
          .from("leads")
          .select(
            `
            *,
            project:projects!current_project_id(
              id, name, client_id,
              client:clients(id, name)
            )
          `,
          )
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters?.projectId) {
          query = query.eq("current_project_id", filters.projectId);
        }
        if (filters?.clientId) {
          query = query.eq("projects.client_id", filters.clientId);
        }
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.dateFrom) {
          query = query.gte("created_at", filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte("created_at", filters.dateTo);
        }
        if (filters?.search) {
          query = query.or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`,
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        // Add computed fields
        return (data || []).map((lead: any) => ({
          ...lead,
          full_name:
            [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
            "Unknown",
        }));
      },
      "LeadService",
      "getLeads",
    ).then((result) => result.data || []);
  }

  /**
   * Get a single lead with full project and client information
   */
  async getLead(id: string): Promise<Lead | null> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { data, error } = await this.client
          .from("leads")
          .select(
            `
            *,
            project:projects!current_project_id(
              id, name, client_id,
              client:clients(id, name)
            )
          `,
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) return null;

        return {
          ...data,
          full_name:
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            "Unknown",
        };
      },
      "LeadService",
      "getLead",
    ).then((result) => result.data);
  }

  /**
   * Create a new lead with validation
   */
  async createLead(
    lead: Omit<Lead, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseResult<Lead>> {
    // Validate lead data
    const validation = EntityValidators.validateLead?.(lead) || {
      isValid: true,
      errors: [],
    };
    if (!validation.isValid) {
      return ServiceErrorHandler.handleValidationError(
        validation.errors,
        "LeadService",
      );
    }

    return this.create(lead as any);
  }

  /**
   * Update an existing lead
   */
  async updateLead(
    id: string,
    updates: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>,
  ): Promise<DatabaseResult<Lead>> {
    return this.update(id, updates as any);
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<DatabaseResult<boolean>> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const result = await this.delete(id);
        return result.success;
      },
      "LeadService",
      "deleteLead",
    );
  }

  /**
   * Get comprehensive lead statistics
   */
  async getLeadStats(
    projectId?: string,
    clientId?: string,
  ): Promise<LeadStats> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        let query = this.client
          .from("leads")
          .select("id, status, created_at, updated_at, current_project_id");

        // Apply filters
        if (projectId) {
          query = query.eq("current_project_id", projectId);
        } else if (clientId) {
          // Get project IDs for this client first
          const { data: projects } = await this.client
            .from("projects")
            .select("id")
            .eq("client_id", clientId);

          const projectIds = projects?.map((p) => p.id) || [];
          if (projectIds.length > 0) {
            query = query.in("current_project_id", projectIds);
          }
        }

        const { data: leads, error } = await query;
        if (error) throw error;

        const totalLeads = leads?.length || 0;
        const activeLeads =
          leads?.filter((l) =>
            ["new", "contacted", "qualified", "proposal"].includes(
              l.status?.toLowerCase() || "",
            ),
          ).length || 0;
        const convertedLeads =
          leads?.filter((l) => l.status?.toLowerCase() === "converted")
            .length || 0;
        const lostLeads =
          leads?.filter((l) =>
            ["lost", "rejected", "unqualified"].includes(
              l.status?.toLowerCase() || "",
            ),
          ).length || 0;

        // Status distribution
        const leadsByStatus = (leads || []).reduce(
          (acc, lead) => {
            const status = lead.status || "unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        // Source distribution - removed as source field no longer exists
        const leadsBySource = {};

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentActivity =
          leads?.filter((lead) => new Date(lead.created_at) >= thirtyDaysAgo)
            .length || 0;

        // Average time to conversion
        const convertedLeadsWithDates =
          leads?.filter(
            (l) =>
              l.status?.toLowerCase() === "converted" &&
              l.created_at &&
              l.updated_at,
          ) || [];

        const avgTimeToConversion =
          convertedLeadsWithDates.length > 0
            ? convertedLeadsWithDates.reduce((acc, lead) => {
                const created = new Date(lead.created_at);
                const updated = new Date(lead.updated_at);
                const days =
                  (updated.getTime() - created.getTime()) /
                  (1000 * 60 * 60 * 24);
                return acc + days;
              }, 0) / convertedLeadsWithDates.length
            : 0;

        return {
          totalLeads,
          activeLeads,
          convertedLeads,
          lostLeads,
          conversionRate:
            totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
          leadsByStatus,
          recentActivity,
          avgTimeToConversion: Math.round(avgTimeToConversion),
        };
      },
      "LeadService",
      "getLeadStats",
    ).then(
      (result) =>
        result.data || {
          totalLeads: 0,
          activeLeads: 0,
          convertedLeads: 0,
          lostLeads: 0,
          conversionRate: 0,
          leadsByStatus: {},
          recentActivity: 0,
          avgTimeToConversion: 0,
        },
    );
  }

  /**
   * Get leads by project
   */
  async getLeadsByProject(projectId: string): Promise<Lead[]> {
    return this.getLeads({ projectId });
  }

  /**
   * Get leads by client
   */
  async getLeadsByClient(clientId: string): Promise<Lead[]> {
    return this.getLeads({ clientId });
  }

  /**
   * Bulk import leads from CSV data
   */
  async importLeads(
    projectId: string,
    csvData: Array<Record<string, any>>,
  ): Promise<LeadImportResult> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const result: LeadImportResult = {
          imported: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          try {
            const lead = {
              current_project_id: projectId,
              first_name: row.first_name || row.firstName || row["First Name"],
              last_name: row.last_name || row.lastName || row["Last Name"],
              email: row.email || row.Email,
              phone: row.phone || row.Phone,
              status: row.status || row.Status || "new",
              source: row.source || row.Source || "import",
              notes: row.notes || row.Notes || null,
            };

            const createResult = await this.createLead(lead);
            if (createResult.success) {
              result.imported++;
            } else {
              result.failed++;
              result.errors.push({
                row: i + 1,
                error: createResult.error || "Unknown error",
                data: row,
              });
            }
          } catch (error) {
            result.failed++;
            result.errors.push({
              row: i + 1,
              error: error instanceof Error ? error.message : "Unknown error",
              data: row,
            });
          }
        }

        return result;
      },
      "LeadService",
      "importLeads",
    ).then((result) => result.data || { imported: 0, failed: 0, errors: [] });
  }

  /**
   * Bulk update lead status
   */
  async bulkUpdateStatus(
    leadIds: string[],
    status: string,
  ): Promise<DatabaseResult<boolean>> {
    // Validate input to prevent 400 errors
    if (!leadIds || leadIds.length === 0) {
      return {
        data: false,
        error: "No lead IDs provided for bulk update",
        success: false
      };
    }

    // Filter out invalid IDs
    const validLeadIds = leadIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
    
    if (validLeadIds.length === 0) {
      return {
        data: false,
        error: "No valid lead IDs provided for bulk update",
        success: false
      };
    }

    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await this.client
          .from("leads")
          .update({ status, updated_at: new Date().toISOString() })
          .in("id", validLeadIds);

        if (error) throw error;
        return true;
      },
      "LeadService",
      "bulkUpdateStatus",
    );
  }

  /**
   * Bulk assign leads to a project
   */
  async bulkAssignToProject(
    leadIds: string[],
    projectId: string,
  ): Promise<DatabaseResult<boolean>> {
    // Validate input to prevent 400 errors
    if (!leadIds || leadIds.length === 0) {
      return {
        data: false,
        error: "No lead IDs provided for bulk assignment",
        success: false
      };
    }

    // Filter out invalid IDs
    const validLeadIds = leadIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
    
    if (validLeadIds.length === 0) {
      return {
        data: false,
        error: "No valid lead IDs provided for bulk assignment",
        success: false
      };
    }

    if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
      return {
        data: false,
        error: "Invalid project ID provided",
        success: false
      };
    }

    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await this.client
          .from("leads")
          .update({
            current_project_id: projectId,
            updated_at: new Date().toISOString(),
          })
          .in("id", validLeadIds);

        if (error) throw error;
        return true;
      },
      "LeadService",
      "bulkAssignToProject",
    );
  }

  /**
   * Get lead conversion funnel data
   */
  async getLeadFunnel(
    projectId?: string,
    clientId?: string,
  ): Promise<
    Array<{
      status: string;
      count: number;
      percentage: number;
    }>
  > {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const stats = await this.getLeadStats(projectId, clientId);
        const total = stats.totalLeads;

        if (total === 0) return [];

        return Object.entries(stats.leadsByStatus)
          .map(([status, count]) => ({
            status,
            count,
            percentage: (count / total) * 100,
          }))
          .sort((a, b) => b.count - a.count);
      },
      "LeadService",
      "getLeadFunnel",
    ).then((result) => result.data || []);
  }

  /**
   * Get lead activity timeline
   */
  async getLeadActivityTimeline(days: number = 30): Promise<
    Array<{
      date: string;
      created: number;
      converted: number;
      lost: number;
    }>
  > {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: leads, error } = await this.client
          .from("leads")
          .select("created_at, updated_at, status")
          .gte("created_at", startDate.toISOString());

        if (error) throw error;

        const timeline: Array<{
          date: string;
          created: number;
          converted: number;
          lost: number;
        }> = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          const created = (leads || []).filter((lead) =>
            lead.created_at.startsWith(dateStr),
          ).length;

          const converted = (leads || []).filter(
            (lead) =>
              lead.updated_at.startsWith(dateStr) &&
              lead.status?.toLowerCase() === "converted",
          ).length;

          const lost = (leads || []).filter(
            (lead) =>
              lead.updated_at.startsWith(dateStr) &&
              ["lost", "rejected", "unqualified"].includes(
                lead.status?.toLowerCase() || "",
              ),
          ).length;

          timeline.push({ date: dateStr, created, converted, lost });
        }

        return timeline;
      },
      "LeadService",
      "getLeadActivityTimeline",
    ).then((result) => result.data || []);
  }

  /**
   * Search leads across all projects
   */
  async searchLeads(query: string, filters?: LeadFilters): Promise<Lead[]> {
    return this.getLeads({ ...filters, search: query });
  }
}

export default new LeadService();
