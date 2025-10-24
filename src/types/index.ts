/**
 * Common type definitions for the Lead-Reviver project
 *
 * This file contains shared interfaces and type definitions used across the application.
 * Since we can't modify tsconfig.json to enable strict mode, we define explicit types here
 * to ensure type safety across the project.
 */

import { User, Session } from "@supabase/supabase-js";
import { LeadStatusValue, LeadTemperature } from "@/config/leadStates";

/**
 * Authentication context type for the ClientAuthContext
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (roles: string[]) => boolean;
}

/**
 * API login response structure
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    clientId: string;
    clientName?: string;
    name?: string;
    role?: string;
    status?: string;
  };
}

/**
 * Session data structure for Redis
 */
export interface SessionData {
  userId: string;
  clientId: string;
  email: string;
  role?: string;
  leadStatus?: LeadStatusValue;
  temperature?: LeadTemperature;
  lastMessageTime?: string;
  messageCount?: number;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  clientId: string;
  sessionId: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Client data structure - NEW for target schema
 */
export interface Client {
  id: string;
  name: string;
  contact_info: {
    email?: string | null;
    phone?: string | null;
    address?: {
      street?: string | null;
      city?: string | null;
      zip?: string | null;
      country?: string | null;
    };
    primary_contact_name?: string | null;
  };
  whatsapp_number_id?: number | null;
  whatsapp_phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lead data structure as stored in database - UPDATED to match database schema
 */
export interface Lead {
  id: string;
  current_project_id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  state: string | null;
  bant_status: string | null;
  // Additional fields for UI components
  lastMessage?: string;
  messageCount?: number;
  last_contacted?: string;
  state_status_metadata: {
    bant_assessment?: {
      need?: {
        notes?: string | null;
        requirements?: string[];
        extracted_info?: string | null;
        assessment_flag?: string | null;
        pain_points_identified?: string[];
      };
      budget?: {
        notes?: string | null;
        amount?: number | null;
        currency?: string;
        extracted_info?: string | null;
        assessment_flag?: string | null;
      };
      timeline?: {
        notes?: string | null;
        urgency_level?: string | null;
        extracted_info?: string | null;
        assessment_flag?: string | null;
        expected_purchase_date?: string | null;
      };
      authority?: {
        notes?: string | null;
        contact_role?: string | null;
        extracted_info?: string | null;
        assessment_flag?: string | null;
        decision_maker_identified?: boolean;
      };
    };
    last_updated_by?: string | null;
    additional_notes?: string | null;
  } | null;
  lead_metadata: {
    tags?: string[];
    last_error?: string | null;
    lead_score?: number | null;
    ai_analysis?: {
      lead_qualification?: {
        confidence_score?: number | null;
        progression_status?: string | null;
      };
      suggested_next_action?: string | null;
      conversation_summary_points?: string[];
      requires_human_intervention?: boolean;
    };
    campaign_id?: string | null;
    custom_fields?: Record<string, any>;
  } | null;
  interaction_count: number;
  next_follow_up: string | null;
  follow_up_count: number;
  last_agent_processed_at: string | null;
  first_interaction: string | null;
  last_interaction: string | null;
  processing_state:
    | "pending"
    | "queued"
    | "active"
    | "completed"
    | "failed"
    | "archived"
    | "rate_limited";
  client_id?: string;
  requires_human_review?: boolean;
  messages?: Message[];
  project?: Project;
  conversations?: Conversation[];
  lastConversation?: Conversation;
  hasActiveConversation?: boolean;
}

/**
 * Project data structure - UPDATED to include client_id
 */
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  client_id: string; // Required client relationship
  status: "active" | "archived" | "completed" | "inactive"; // Match database schema
  whatsapp_number?: string | null;
  calendly_url?: string | null;
  metadata?: Record<string, any>; // Match database schema
  created_at: string;
  updated_at: string;
  // Computed statistics fields
  leads_count?: number;
  active_conversations?: number;
  conversion_rate?: number;
}

/**
 * Conversation data structure - UPDATED to match database schema
 */
export interface Conversation {
  id: string;
  project_id: string;
  lead_id: string;
  message_content: string;
  timestamp: string;
  status: "active" | "completed" | "abandoned" | "stalled";
  stage: "initial" | "middle" | "final";
  started_at: string;
  last_message_at: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  meeting_scheduled: boolean;
  meeting_scheduled_at: string | null;
  message_count: number;
  reply_count: number;
  temperature_changes: any;
  metadata: {
    tags: string[];
    channel: string | null;
    language: string | null;
    sentiment_score: number | null;
    external_message_id: string | null;
  };
  message_id: string;
  message_type: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Agent Interaction Log data structure - NEW for target schema
 */
export interface AgentInteractionLog {
  interaction_log_id: string;
  lead_id: string;
  interaction_timestamp: string;
  agent_input_context?: Record<string, any> | null;
  agent_raw_output: Record<string, any>;
  n8n_determined_lead_state?: string | null;
  n8n_determined_lead_status?: string | null;
  n8n_determined_bant_status?: string | null;
  n8n_determined_bant_details?: Record<string, any> | null;
  n8n_action_taken?: string | null;
  triggering_message_id?: string | null;
  created_at: string;
}

/**
 * Lead Project History data structure - NEW for target schema
 */
export interface LeadProjectHistory {
  id: string;
  lead_id: string;
  project_id?: string | null;
  previous_project_id?: string | null;
  reason?: string | null;
  assigned_at: string;
  client_id: string;
  created_at: string;
}

/**
 * Lead Status History data structure - NEW for target schema
 */
export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  status_type: string;
  status: string;
  previous_status?: string | null;
  reason?: string | null;
  status_metadata?: Record<string, any> | null;
  changed_at: string;
  changed_by?: string | null;
  created_at: string;
}

/**
 * Notification data structure - UPDATED for multi-tenant support
 */
export interface Notification {
  id: string;
  user_id: string;
  client_id?: string | null; // NEW: Optional client relationship for multi-tenancy
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Message data structure for WhatsApp messages
 */
export interface Message {
  id: string;
  leadId: string;
  body: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  status: "delivered" | "read" | "failed";
  mediaUrl?: string;
  mediaType?: string;
}

/**
 * Redis session data structure for WhatsApp conversations
 */
export interface WhatsAppSession {
  phone: string;
  state: LeadStatusValue;
  temperature: LeadTemperature;
  lastAgent: string;
  lastLead: string;
  msgCount: number;
  lastTimestamp: string;
  stepCount: number;
  preferredTime?: string;
  language?: string;
  waitingForResponse: boolean;
}

/**
 * Configuration structure for cadence rules
 */
export interface CadenceRules {
  quietHours: {
    start: number;
    end: number;
    weekend: boolean;
  };
  maxMessagesPerDay: Record<LeadStatusValue, number>;
  minTimeBetweenMessages: Record<LeadStatusValue, number>;
  responseTimeTargets: Record<LeadStatusValue, number>;
  followUpDelays: {
    initial: number;
    second: number;
    third: number;
    final: number;
    beforeDead: number;
  };
}

/**
 * Lead import data structure
 */
export interface LeadImportData {
  projectId: string;
  leads: Array<Partial<Lead> & { id: string }>;
}

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  status: "active" | "inactive" | "suspended";
  role?: string;
  client_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Filter parameters for data queries
 */
export interface FilterParams {
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  clientId?: string;
  projectId?: string;
}

export interface WhatsAppMessage {
  id: string;
  lead_id?: string; // Added for lead association
  conversation_id?: string; // Added for conversation association
  sender_number: string | null;
  receiver_number: string | null;
  content: string;
  wa_timestamp: string | null;
  created_at: string;
  updated_at?: string;
  direction?: "inbound" | "outbound" | "unknown";
  message_type?: "text" | "media" | "system";
  payload?: any;
  wamid?: string;
  // Additional fields from transformation
  lead_phone?: string;
  lead_name?: string;
}
