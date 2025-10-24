import { BaseService } from "./baseService";
import { ServiceErrorHandler } from "./base/errorHandler";
import { EntityValidators } from "./base/validators";
import { Client } from "@/types";
import { DatabaseResult } from "@/types/shared";
import { unifiedApiClient } from "./unifiedApiClient";
import ProjectService from "./projectService";
import LeadService from "./leadService";

/**
 * Client Service - Supabase Implementation
 *
 * This service provides client operations using the BaseService pattern
 * and consolidated utilities for error handling and validation.
 */
export class ClientService extends BaseService<any> {
  protected tableName = "clients" as any;

  /**
   * Get all clients with optional filtering
   */
  async getClients(search?: string): Promise<Client[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const options: any = {
          sort: { field: "created_at", direction: "desc" },
        };

        if (search) {
          options.filters = { search };
        }

        const result = await unifiedApiClient.getClients(options);

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch clients");
        }

        return result.data || [];
      },
      "ClientService",
      "getClients",
    ).then((result) => result.data || []);
  }

  /**
   * Get a single client by ID
   */
  async getClient(id: string): Promise<Client | null> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const result = await this.getById(id);
        return result.data;
      },
      "ClientService",
      "getClient",
    ).then((result) => result.data || null);
  }

  /**
   * Create a new client with validation
   */
  async createClient(
    client: Omit<Client, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseResult<Client>> {
    // Validate client data
    const validation = EntityValidators.validateClient(client);
    if (!validation.isValid) {
      return ServiceErrorHandler.handleValidationError(
        validation.errors,
        "ClientService",
      );
    }

    return this.create(client as any);
  }

  /**
   * Update an existing client with validation
   */
  async updateClient(
    id: string,
    updates: Partial<Omit<Client, "id" | "created_at" | "updated_at">>,
  ): Promise<DatabaseResult<Client>> {
    // Validate updates
    const validation = EntityValidators.validateClient(updates);
    if (!validation.isValid) {
      return ServiceErrorHandler.handleValidationError(
        validation.errors,
        "ClientService",
      );
    }

    return this.update(id, updates as any);
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<DatabaseResult<boolean>> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const result = await this.delete(id);
        return result.success;
      },
      "ClientService",
      "deleteClient",
    );
  }

  /**
   * Search clients by name
   */
  async searchClients(query: string): Promise<Client[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const options = {
          filter: { search: query },
        };

        const result = await this.getAll(options);
        return result.data || [];
      },
      "ClientService",
      "searchClients",
    ).then((result) => result.data || []);
  }

  /**
   * Get client statistics with actual project and lead data
   */
  async getClientStats(clientId: string): Promise<{
    projectCount: number;
    leadCount: number;
    activeProjects: number;
    activeLeads: number;
    convertedLeads: number;
    conversionRate: number;
    recentActivity: number;
  }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Get project statistics for this client
        const projectStats = await ProjectService.getProjectStats(clientId);

        // Get lead statistics for this client
        const leadStats = await LeadService.getLeadStats(undefined, clientId);

        return {
          projectCount: projectStats.totalProjects,
          leadCount: leadStats.totalLeads,
          activeProjects: projectStats.activeProjects,
          activeLeads: leadStats.activeLeads,
          convertedLeads: leadStats.convertedLeads,
          conversionRate: leadStats.conversionRate,
          recentActivity: leadStats.recentActivity,
        };
      },
      "ClientService",
      "getClientStats",
    ).then(
      (result) =>
        result.data || {
          projectCount: 0,
          leadCount: 0,
          activeProjects: 0,
          activeLeads: 0,
          convertedLeads: 0,
          conversionRate: 0,
          recentActivity: 0,
        },
    );
  }

  /**
   * Get clients with their project and lead counts
   */
  async getClientsWithStats(): Promise<
    Array<
      Client & {
        projectCount: number;
        leadCount: number;
        activeProjects: number;
        conversionRate: number;
      }
    >
  > {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const clients = await this.getClients();

        // Get stats for each client in parallel
        const clientsWithStats = await Promise.all(
          clients.map(async (client) => {
            const stats = await this.getClientStats(client.id);
            return {
              ...client,
              projectCount: stats.projectCount,
              leadCount: stats.leadCount,
              activeProjects: stats.activeProjects,
              conversionRate: stats.conversionRate,
            };
          }),
        );

        return clientsWithStats;
      },
      "ClientService",
      "getClientsWithStats",
    ).then((result) => result.data || []);
  }

  /**
   * Get comprehensive client dashboard data
   */
  async getClientDashboard(clientId: string): Promise<{
    client: Client;
    stats: {
      projectCount: number;
      leadCount: number;
      activeProjects: number;
      activeLeads: number;
      convertedLeads: number;
      conversionRate: number;
      recentActivity: number;
    };
    projects: Array<{
      id: string;
      name: string;
      status: string;
      lead_count: number;
      conversion_rate: number;
    }>;
    recentLeads: Array<{
      id: string;
      full_name: string;
      email: string;
      status: string;
      project_name: string;
      created_at: string;
    }>;
    leadFunnel: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Get client data
        const client = await this.getClient(clientId);
        if (!client) {
          throw new Error("Client not found");
        }

        // Get client statistics
        const stats = await this.getClientStats(clientId);

        // Get projects with lead statistics
        const projects = await ProjectService.getProjectsByClient(clientId);

        // Get recent leads (last 10)
        const allLeads = await LeadService.getLeadsByClient(clientId);
        const recentLeads = allLeads.slice(0, 10).map((lead) => ({
          id: lead.id,
          full_name: lead.full_name || "Unknown",
          email: lead.email || "",
          status: lead.status || "unknown",
          project_name: lead.project?.name || "Unknown Project",
          created_at: lead.created_at,
        }));

        // Get lead funnel data
        const leadFunnel = await LeadService.getLeadFunnel(undefined, clientId);

        return {
          client,
          stats,
          projects: projects.map((project) => ({
            id: project.id,
            name: project.name,
            status: project.status || "unknown",
            lead_count: project.lead_count || 0,
            conversion_rate: project.conversion_rate || 0,
          })),
          recentLeads,
          leadFunnel,
        };
      },
      "ClientService",
      "getClientDashboard",
    ).then(
      (result) =>
        result.data || {
          client: {} as Client,
          stats: {
            projectCount: 0,
            leadCount: 0,
            activeProjects: 0,
            activeLeads: 0,
            convertedLeads: 0,
            conversionRate: 0,
            recentActivity: 0,
          },
          projects: [],
          recentLeads: [],
          leadFunnel: [],
        },
    );
  }
}

export default new ClientService();
