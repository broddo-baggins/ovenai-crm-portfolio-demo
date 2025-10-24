/**
 * TypeScript types for user integration management
 */

export type IntegrationType =
  | "calendly"
  | "whatsapp"
  | "slack"
  | "zoom"
  | "google_calendar";

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: IntegrationType;
  integration_name?: string;

  // Encrypted fields (as stored in database)
  encrypted_client_id?: string | null;
  encrypted_client_secret?: string | null;
  encrypted_webhook_secret?: string | null;
  encrypted_access_token?: string | null;
  encrypted_refresh_token?: string | null;

  // Non-sensitive configuration
  redirect_uri?: string | null;
  scopes?: string[] | null;

  // Status and metadata
  is_active: boolean;
  is_configured: boolean;
  last_verified_at?: string | null;
  error_message?: string | null;

  // Audit fields
  created_at: string;
  updated_at: string;
}

export interface DecryptedCredentials {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  accessToken: string;
  refreshToken: string;
}

export interface IntegrationCredentials {
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface CreateIntegrationRequest {
  integration_type: IntegrationType;
  integration_name?: string;
  credentials: IntegrationCredentials;
  redirect_uri?: string;
  scopes?: string[];
}

export interface UpdateIntegrationRequest {
  integration_name?: string;
  credentials?: Partial<IntegrationCredentials>;
  redirect_uri?: string;
  scopes?: string[];
  is_active?: boolean;
}

export interface IntegrationStatus {
  isConfigured: boolean;
  isActive: boolean;
  lastVerified?: Date | null;
  errorMessage?: string | null;
  hasCredentials: {
    clientId: boolean;
    clientSecret: boolean;
    webhookSecret: boolean;
    accessToken: boolean;
    refreshToken: boolean;
  };
}

export interface IntegrationConfig {
  type: IntegrationType;
  name: string;
  description: string;
  required_fields: Array<keyof IntegrationCredentials>;
  optional_fields: Array<keyof IntegrationCredentials>;
  oauth_enabled: boolean;
  webhook_required: boolean;
  setup_instructions: string;
  docs_url?: string;
}

// Predefined integration configurations
export const INTEGRATION_CONFIGS: Record<IntegrationType, IntegrationConfig> = {
  calendly: {
    type: "calendly",
    name: "Calendly",
    description: "Sync calendar events and manage appointments",
    required_fields: ["clientId", "clientSecret"],
    optional_fields: ["webhookSecret", "accessToken", "refreshToken"],
    oauth_enabled: true,
    webhook_required: true,
    setup_instructions:
      "Get your Client ID and Secret from your Calendly Developer Account",
    docs_url: "https://developer.calendly.com/",
  },
  whatsapp: {
    type: "whatsapp",
    name: "WhatsApp Business",
    description: "Send and receive WhatsApp messages",
    required_fields: ["clientId", "clientSecret"],
    optional_fields: ["webhookSecret", "accessToken"],
    oauth_enabled: false,
    webhook_required: true,
    setup_instructions: "Get your credentials from Meta Business Manager",
    docs_url: "https://developers.facebook.com/docs/whatsapp",
  },
  slack: {
    type: "slack",
    name: "Slack",
    description: "Send notifications and manage team communication",
    required_fields: ["clientId", "clientSecret"],
    optional_fields: ["webhookSecret", "accessToken", "refreshToken"],
    oauth_enabled: true,
    webhook_required: false,
    setup_instructions: "Create a Slack app and get OAuth credentials",
    docs_url: "https://api.slack.com/",
  },
  zoom: {
    type: "zoom",
    name: "Zoom",
    description: "Schedule and manage video meetings",
    required_fields: ["clientId", "clientSecret"],
    optional_fields: ["accessToken", "refreshToken"],
    oauth_enabled: true,
    webhook_required: false,
    setup_instructions: "Create a Zoom app and configure OAuth",
    docs_url: "https://marketplace.zoom.us/docs/guides",
  },
  google_calendar: {
    type: "google_calendar",
    name: "Google Calendar",
    description: "Sync with Google Calendar events",
    required_fields: ["clientId", "clientSecret"],
    optional_fields: ["accessToken", "refreshToken"],
    oauth_enabled: true,
    webhook_required: false,
    setup_instructions: "Create credentials in Google Cloud Console",
    docs_url: "https://developers.google.com/calendar",
  },
};

export interface IntegrationFormData {
  integration_type: IntegrationType;
  integration_name: string;
  client_id: string;
  client_secret: string;
  webhook_secret: string;
  redirect_uri: string;
  scopes: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: string;
  timestamp: Date;
}

export interface IntegrationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type IntegrationEvent =
  | "integration_created"
  | "integration_updated"
  | "integration_deleted"
  | "integration_verified"
  | "integration_failed"
  | "oauth_completed"
  | "oauth_failed";

export interface IntegrationEventPayload {
  event: IntegrationEvent;
  integration_id: string;
  integration_type: IntegrationType;
  user_id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
