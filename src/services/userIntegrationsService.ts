// @ts-nocheck
/**
 * User Integrations Service
 * Manages secure storage and retrieval of user integration credentials
 */

import { supabase } from "@/integrations/supabase/client";
import { encryptionUtils } from "@/lib/encryption";
import type {
  UserIntegration,
  IntegrationType,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  IntegrationStatus,
  DecryptedCredentials,
  IntegrationApiResponse,
  IntegrationTestResult,
} from "@/types/integrations";
import { INTEGRATION_CONFIGS } from "@/types/integrations";

export class UserIntegrationsService {
  /**
   * Get all integrations for the current user
   */
  async getUserIntegrations(): Promise<
    IntegrationApiResponse<UserIntegration[]>
  > {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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

  /**
   * Get a specific integration by type
   */
  async getIntegration(
    type: IntegrationType,
  ): Promise<IntegrationApiResponse<UserIntegration | null>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("integration_type", type)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create or update an integration
   */
  async saveIntegration(
    request: CreateIntegrationRequest,
  ): Promise<IntegrationApiResponse<UserIntegration>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // Encrypt credentials
      const encryptedCredentials = encryptionUtils.encryptCredentials(
        request.credentials,
        user.id,
      );

      // Check if integration already exists
      const existingResult = await this.getIntegration(
        request.integration_type,
      );
      if (!existingResult.success) {
        return existingResult;
      }

      const integrationData = {
        user_id: user.id,
        integration_type: request.integration_type,
        integration_name:
          request.integration_name ||
          INTEGRATION_CONFIGS[request.integration_type].name,
        ...encryptedCredentials,
        redirect_uri: request.redirect_uri,
        scopes: request.scopes,
        is_configured: this.isConfigurationComplete(
          request.credentials,
          request.integration_type,
        ),
        is_active: true,
      };

      let result;
      if (existingResult.data) {
        // Update existing integration
        const { data, error } = await supabase
          .from("user_integrations")
          .update(integrationData)
          .eq("id", existingResult.data.id)
          .select()
          .single();

        result = { data, error };
      } else {
        // Create new integration
        const { data, error } = await supabase
          .from("user_integrations")
          .insert(integrationData)
          .select()
          .single();

        result = { data, error };
      }

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        data: result.data,
        message: existingResult.data
          ? "Integration updated successfully"
          : "Integration created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update an existing integration
   */
  async updateIntegration(
    type: IntegrationType,
    request: UpdateIntegrationRequest,
  ): Promise<IntegrationApiResponse<UserIntegration>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const existingResult = await this.getIntegration(type);
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: "Integration not found" };
      }

      const updateData: any = {};

      if (request.integration_name !== undefined) {
        updateData.integration_name = request.integration_name;
      }

      if (request.credentials) {
        const encryptedCredentials = encryptionUtils.encryptCredentials(
          request.credentials,
          user.id,
        );
        Object.assign(updateData, encryptedCredentials);
      }

      if (request.redirect_uri !== undefined) {
        updateData.redirect_uri = request.redirect_uri;
      }

      if (request.scopes !== undefined) {
        updateData.scopes = request.scopes;
      }

      if (request.is_active !== undefined) {
        updateData.is_active = request.is_active;
      }

      // Update configuration status if credentials were provided
      if (request.credentials) {
        const allCredentials = {
          ...encryptionUtils.decryptCredentials(existingResult.data, user.id),
          ...request.credentials,
        };
        updateData.is_configured = this.isConfigurationComplete(
          allCredentials,
          type,
        );
      }

      const { data, error } = await supabase
        .from("user_integrations")
        .update(updateData)
        .eq("id", existingResult.data.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data,
        message: "Integration updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(
    type: IntegrationType,
  ): Promise<IntegrationApiResponse<void>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const { error } = await supabase
        .from("user_integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("integration_type", type);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: "Integration deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get decrypted credentials for an integration (use carefully!)
   */
  async getDecryptedCredentials(
    type: IntegrationType,
  ): Promise<IntegrationApiResponse<DecryptedCredentials>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const integrationResult = await this.getIntegration(type);
      if (!integrationResult.success || !integrationResult.data) {
        return { success: false, error: "Integration not found" };
      }

      const decryptedCredentials = encryptionUtils.decryptCredentials(
        integrationResult.data,
        user.id,
      );

      return { success: true, data: decryptedCredentials };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(
    type: IntegrationType,
  ): Promise<IntegrationApiResponse<IntegrationStatus>> {
    try {
      const integrationResult = await this.getIntegration(type);
      if (!integrationResult.success) {
        return { success: false, error: integrationResult.error };
      }

      const integration = integrationResult.data;
      if (!integration) {
        return {
          success: true,
          data: {
            isConfigured: false,
            isActive: false,
            lastVerified: null,
            errorMessage: null,
            hasCredentials: {
              clientId: false,
              clientSecret: false,
              webhookSecret: false,
              accessToken: false,
              refreshToken: false,
            },
          },
        };
      }

      const hasCredentials = {
        clientId: !!integration.encrypted_client_id,
        clientSecret: !!integration.encrypted_client_secret,
        webhookSecret: !!integration.encrypted_webhook_secret,
        accessToken: !!integration.encrypted_access_token,
        refreshToken: !!integration.encrypted_refresh_token,
      };

      return {
        success: true,
        data: {
          isConfigured: integration.is_configured,
          isActive: integration.is_active,
          lastVerified: integration.last_verified_at
            ? new Date(integration.last_verified_at)
            : null,
          errorMessage: integration.error_message,
          hasCredentials,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test integration connectivity
   */
  async testIntegration(
    type: IntegrationType,
  ): Promise<IntegrationApiResponse<IntegrationTestResult>> {
    try {
      const credentialsResult = await this.getDecryptedCredentials(type);
      if (!credentialsResult.success) {
        return { success: false, error: credentialsResult.error };
      }

      const credentials = credentialsResult.data!;

      // Perform basic validation
      const config = INTEGRATION_CONFIGS[type];
      const missingFields = config.required_fields.filter(
        (field) => !credentials[field] || credentials[field].length === 0,
      );

      if (missingFields.length > 0) {
        return {
          success: true,
          data: {
            success: false,
            message: `Missing required fields: ${missingFields.join(", ")}`,
            timestamp: new Date(),
          },
        };
      }

      // TODO: Implement actual API testing for each integration type
      // For now, just validate that required credentials are present

      return {
        success: true,
        data: {
          success: true,
          message: "Integration credentials are properly configured",
          details:
            "Basic validation passed. OAuth connection test coming soon.",
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if integration configuration is complete
   */
  private isConfigurationComplete(
    credentials: any,
    type: IntegrationType,
  ): boolean {
    const config = INTEGRATION_CONFIGS[type];
    return config.required_fields.every(
      (field) => credentials[field] && credentials[field].length > 0,
    );
  }
}

// Export singleton instance
export const userIntegrationsService = new UserIntegrationsService();
