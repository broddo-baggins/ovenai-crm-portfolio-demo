/**
 * TypeScript Types for Leads Queue System
 * Defines interfaces and types for WhatsApp message queue management
 */

// Base Queue Status and Priority Types
export type QueueStatus = 'pending' | 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';
export type QueuePriority = 'low' | 'normal' | 'high' | 'immediate';

// Queue Item Interface
export interface QueueItem {
  id: string;
  lead_id: string;
  client_id: string;
  user_id: string;
  
  // Queue Management
  status: QueueStatus;
  priority: QueuePriority;
  scheduled_for?: string;
  queued_at: string;
  processed_at?: string;
  
  // Message Content
  message_template: string;
  message_variables: Record<string, any>;
  
  // Processing Details
  attempts: number;
  last_error?: string;
  error_code?: string;
  
  // Agent DB Integration
  agent_trigger_id?: string;
  agent_conversation_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Populated fields (from joins)
  lead?: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    temperature?: string;
    score?: number;
  };
}

// Business Hours Configuration
export interface BusinessHours {
  sunday: { start: string; end: string; enabled: boolean };
  monday: { start: string; end: string; enabled: boolean };
  tuesday: { start: string; end: string; enabled: boolean };
  wednesday: { start: string; end: string; enabled: boolean };
  thursday: { start: string; end: string; enabled: boolean };
  friday: { start: string; end: string; enabled: boolean };
  saturday: { enabled: boolean };
}

// Priority Weights Configuration
export interface PriorityWeights {
  hot: number;
  warm: number;
  cool: number;
  cold: number;
  new_lead: number;
  follow_up: number;
}

// User Queue Settings Interface
export interface UserQueueSettings {
  id: string;
  user_id: string;
  
  // Business Hours (Israeli Time)
  business_hours: BusinessHours;
  
  // Processing Targets
  target_leads_per_day: number;
  target_leads_per_month: number;
  max_daily_capacity: number;
  
  // Automation Settings
  auto_queue_enabled: boolean;
  processing_delay_seconds: number;
  batch_size: number;
  
  // Priority Weights (1-10)
  priority_weights: PriorityWeights;
  
  // Holiday Settings
  exclude_holidays: boolean;
  custom_holidays: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Queue Performance Metrics Interface
export interface QueuePerformanceMetrics {
  id: string;
  user_id: string;
  client_id: string;
  metric_date: string;
  
  // Daily Metrics
  leads_queued: number;
  leads_processed: number;
  leads_sent: number;
  leads_failed: number;
  leads_cancelled: number;
  
  // Performance Metrics
  average_processing_time_seconds?: number;
  success_rate?: number;
  failure_rate?: number;
  
  // Hourly Distribution
  hourly_distribution: Record<string, number>;
  
  // Error Analysis
  error_breakdown: Record<string, number>;
  
  // Metadata
  created_at: string;
}

// Queue Operation DTOs
export interface QueueOperation {
  leadIds: string[];
  priority?: QueuePriority;
  scheduledFor?: Date;
  messageTemplate?: string;
  messageVariables?: Record<string, any>;
}

export interface QueueResult {
  success: boolean;
  queued: number;
  queueIds: string[];
  errors?: string[];
}

// Queue Status Summary
export interface QueueStatusSummary {
  depth: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
  averageProcessingTime: number;
}

// Business Rules Validation
export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  warning?: string;
}

// Queue Filter and Search Options
export interface QueueFilters {
  status?: QueueStatus[];
  priority?: QueuePriority[];
  leadName?: string;
  phoneNumber?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  clientId?: string;
}

// Agent DB Integration Types
export interface AgentDBTrigger {
  event: string;
  leads: {
    lead_id: string;
    priority: QueuePriority;
    template: string;
    variables: Record<string, any>;
  }[];
  metadata: {
    triggered_by: string;
    timestamp: string;
  };
}

export interface TriggerResult {
  success: boolean;
  triggerId?: string;
  error?: string;
}

// Rate Limiting Types
export interface RateLimitConfig {
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  burstLimit: number;
  retryAfterSeconds: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
  resetTime: Date;
}

// Queue Processing Context
export interface ProcessingContext {
  userId: string;
  clientId: string;
  timezone: string;
  businessHours: BusinessHours;
  settings: UserQueueSettings;
}

// Bulk Operation Types
export interface BulkQueueOperation {
  action: 'queue' | 'cancel' | 'retry' | 'prioritize';
  itemIds: string[];
  priority?: QueuePriority;
  scheduledFor?: Date;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

// Dashboard Widget Data
export interface QueueDashboardData {
  status: QueueStatusSummary;
  todayMetrics: QueuePerformanceMetrics;
  recentActivity: QueueItem[];
  upcomingJobs: QueueItem[];
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    count: number;
  }[];
}

// Israeli Holiday Types
export interface Holiday {
  date: string;
  name: string;
  type: 'jewish' | 'national' | 'custom';
}

// Export utility types
export type QueueItemWithLead = QueueItem & {
  lead: NonNullable<QueueItem['lead']>;
};

export type CreateQueueItemDTO = Omit<QueueItem, 'id' | 'created_at' | 'updated_at' | 'attempts' | 'lead'>;
export type UpdateQueueItemDTO = Partial<Pick<QueueItem, 'status' | 'priority' | 'scheduled_for' | 'message_template' | 'message_variables'>>;

export type CreateQueueSettingsDTO = Omit<UserQueueSettings, 'id' | 'created_at' | 'updated_at'>;
export type UpdateQueueSettingsDTO = Partial<Omit<UserQueueSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Component Props Types
export interface QueueManagementProps {
  initialFilters?: QueueFilters;
  onSelectionChange?: (selectedIds: string[]) => void;
  maxHeight?: string;
}

export interface QueueSettingsProps {
  userId: string;
  onSave?: (settings: UserQueueSettings) => void;
  readOnly?: boolean;
}

export interface QueueMetricsProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  showHourlyBreakdown?: boolean;
}

// Error Types
export class QueueError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'QueueError';
  }
}

export class BusinessRuleError extends QueueError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'BUSINESS_RULE_VIOLATION', details);
    this.name = 'BusinessRuleError';
  }
}

export class RateLimitError extends QueueError {
  constructor(message: string, retryAfter: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
} 