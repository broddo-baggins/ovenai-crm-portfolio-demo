/**
 * Unified API Client - Site DB Only
 *
 * Simple client that communicates ONLY with Site DB.
 * Site DB ↔ Agent DB sync is handled by Supabase functions (backend responsibility).
 *
 * TOOL SIMPLIFIED ARCHITECTURE:
 * - Web App → Site DB ONLY
 * - Site DB → Agent DB (via Supabase functions)
 * - NO cross-database operations from frontend
 */

import { createClient } from "@supabase/supabase-js";
import { supabase as authenticatedSupabase } from "../integrations/supabase/client";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CRUDOptions {
  include?: string[];
  filters?: Record<string, any>;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

/**
 * Helper function to safely access environment variables
 */
function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  if (typeof window !== "undefined" && (window as any).ENV) {
    return (window as any).ENV[key];
  }
  return undefined;
}

export class UnifiedApiClient {
  private readonly supabase: any; // Site DB client only

  constructor() {
    // TOOL SITE DB ONLY: No Agent DB connection needed
    this.supabase = this.initializeSiteDB();
  }

  private initializeSiteDB() {
    try {
      // Use the authenticated Supabase client (Site DB)
      if (authenticatedSupabase) {
        console.log("SECURITY Using authenticated Site DB client");
        return authenticatedSupabase;
      }

      // Fallback to creating Site DB client
      const siteDbUrl =
        getEnvVar("VITE_SUPABASE_URL") ||
        getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
        "https://ajszzemkpenbfnghqiyz.supabase.co";
      const siteDbKey =
        getEnvVar("VITE_SUPABASE_ANON_KEY") ||
        getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
        "";

      console.log("BUILD Creating Site DB client as fallback");
      return createClient(siteDbUrl, siteDbKey);
    } catch (error) {
      console.warn("Site DB client initialization failed:", error);
      return null;
    }
  }

  /**
   * Test connection to Site DB
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.supabase) return false;

      // Simple test - check if we can read clients table
      const { data, error } = await this.supabase
        .from("clients")
        .select("id")
        .limit(1);

      return !error;
    } catch (error) {
      console.warn("Site DB connection test failed:", error);
      return false;
    }
  }

  // ============================================================================
  // CLIENT OPERATIONS (Site DB Only)
  // ============================================================================

  async getClients(options: CRUDOptions = {}): Promise<ApiResponse<any[]>> {
    try {
      let query = this.supabase.from("clients").select("*");

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply sorting
      if (options.sort) {
        query = query.order(options.sort.field, {
          ascending: options.sort.direction === "asc",
        });
      }

      // Apply pagination
      if (options.pagination) {
        const { page, limit } = options.pagination;
        const start = (page - 1) * limit;
        query = query.range(start, start + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createClient(clientData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateClient(
    clientId: string,
    updates: any,
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("clients")
        .update(updates)
        .eq("id", clientId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteClient(clientId: string): Promise<ApiResponse<any>> {
    try {
      const { error } = await this.supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { id: clientId } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // PROJECT OPERATIONS (Site DB Only)
  // ============================================================================

  async getProjects(options: CRUDOptions = {}): Promise<ApiResponse<any[]>> {
    try {
      let query = this.supabase.from("projects").select("*");

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.sort) {
        query = query.order(options.sort.field, {
          ascending: options.sort.direction === "asc",
        });
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createProject(projectData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateProject(
    projectId: string,
    updates: any,
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteProject(projectId: string): Promise<ApiResponse<any>> {
    try {
      const { error } = await this.supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { id: projectId } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // LEAD OPERATIONS (Site DB Only)
  // ============================================================================

  async getLeads(options: CRUDOptions = {}): Promise<ApiResponse<any[]>> {
    try {
      let query = this.supabase.from("leads").select("*");

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.sort) {
        query = query.order(options.sort.field, {
          ascending: options.sort.direction === "asc",
        });
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createLead(leadData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateLead(leadId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("leads")
        .update(updates)
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteLead(leadId: string): Promise<ApiResponse<any>> {
    try {
      const { error } = await this.supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { id: leadId } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // CONVERSATION OPERATIONS (Site DB Only)
  // ============================================================================

  async getConversations(leadId?: string): Promise<ApiResponse<any[]>> {
    try {
      let query = this.supabase.from("conversations").select("*");

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createConversation(conversationData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .insert(conversationData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateConversation(
    conversationId: string,
    updates: any,
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .update(updates)
        .eq("id", conversationId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<ApiResponse<any>> {
    try {
      const { error } = await this.supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { id: conversationId } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const unifiedApiClient = new UnifiedApiClient();
