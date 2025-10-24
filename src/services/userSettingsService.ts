// @ts-nocheck
/**
 * Comprehensive User Settings Service
 * Handles all user preferences, settings, and application state persistence
 */

import { supabase } from "@/integrations/supabase/client";

// Type definitions for all settings
export interface DashboardSettings {
  widget_visibility: {
    metrics: boolean;
    monthlyPerformance: boolean;
    leadsConversions: boolean;
    revenueChannel: boolean;
    pieCharts: boolean;
    recentActivity: boolean;
    insights: boolean;
    performanceTargets: boolean;
  };
  widget_layout: any[];
  dashboard_preferences: {
    defaultView: "enhanced" | "compact" | "minimal";
    autoRefresh: boolean;
    refreshInterval: number;
    compactMode: boolean;
    showTooltips: boolean;
    animationsEnabled: boolean;
  };
}

export interface NotificationSettings {
  email_notifications: {
    leadUpdates: boolean;
    meetingReminders: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    bantQualifications: boolean;
    calendlyBookings: boolean;
    heatProgressions: boolean;
  };
  push_notifications: {
    leadUpdates: boolean;
    meetingReminders: boolean;
    systemAlerts: boolean;
    realTimeUpdates: boolean;
  };
  sms_notifications: {
    urgentAlerts: boolean;
    meetingReminders: boolean;
    leadUpdates: boolean;
  };
  notification_schedule: {
    workingHours: { start: string; end: string };
    timezone: string;
    weekends: boolean;
    quietHours: { enabled: boolean; start: string; end: string };
  };
}

export interface AppPreferences {
  interface_settings: {
    theme: "light" | "dark" | "system";
    language: string;
    rtl: boolean;
    density: "compact" | "comfortable" | "spacious";
    sidebarCollapsed: boolean;
    colorScheme: string;
  };
  data_preferences: {
    dateFormat: string;
    timeFormat: "12h" | "24h";
    numberFormat: string;
    currency: string;
    pagination: number;
    sortPreferences: Record<string, any>;
  };
  feature_preferences: {
    betaFeatures: boolean;
    advancedMode: boolean;
    debugMode: boolean;
    analytics: boolean;
    tutorials: boolean;
  };
  integration_settings: IntegrationSettings;
  advanced_reporting?: {
    custom_templates: any[];
    scheduled_reports: any[];
    usage_analytics: any;
  };
}

export interface PerformanceTargets {
  // Basic Targets
  target_leads_per_month: number;
  target_conversion_rate: number;
  target_meetings_per_month: number;
  target_messages_per_week: number;
  target_response_rate: number;
  target_reach_rate: number;

  // BANT/HEAT Specific Targets
  target_bant_qualification_rate: number;
  target_cold_to_warm_rate: number;
  target_warm_to_hot_rate: number;
  target_hot_to_burning_rate: number;
  target_burning_to_meeting_rate: number;
  target_calendly_booking_rate: number;

  // Custom Targets
  custom_targets: Record<string, any>;

  // Target Periods
  target_period: {
    type: "daily" | "weekly" | "monthly" | "quarterly";
    startDate: string | null;
    endDate: string | null;
    recurring: boolean;
  };
}

export interface SessionState {
  current_context: {
    selectedProject: string | null;
    selectedClient: string | null;
    currentPage: string;
    filters: Record<string, any>;
    searches: Record<string, any>;
  };
  ui_state: {
    openPanels: string[];
    selectedItems: string[];
    viewModes: Record<string, any>;
    temporarySettings: Record<string, any>;
  };
}

interface IntegrationSettings {
  calendly: {
    enabled: boolean;
    autoSync: boolean;
    // OAuth method fields
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    // PAT method fields
    method?: 'oauth' | 'pat' | null;
    pat?: string;
    user_uri?: string;
    scheduling_url?: string;
    name?: string;
    email?: string;
    last_verified?: string;
    connected_at?: string | null;
  };
  whatsapp: { enabled: boolean; autoSync: boolean };
  email: { enabled: boolean; provider: string | null };
}

class UserSettingsService {
  // ================== DASHBOARD SETTINGS ==================

  async getDashboardSettings(
    projectId?: string,
    clientId?: string,
  ): Promise<DashboardSettings | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("project_id", projectId || null)
        .eq("client_id", clientId || null)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      return data
        ? {
            widget_visibility: (data as any).widget_visibility || null,
            widget_layout: (data as any).widget_layout || null,
            dashboard_preferences: (data as any).dashboard_preferences || null,
          }
        : null;
    } catch (error) {
      console.error("Error getting dashboard settings:", error);
      return null;
    }
  }

  async updateDashboardSettings(
    settings: Partial<DashboardSettings>,
    projectId?: string,
    clientId?: string,
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        project_id: projectId || null,
        client_id: clientId || null,
        ...settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating dashboard settings:", error);
      return false;
    }
  }

  // ================== NOTIFICATION SETTINGS ==================

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      return data
        ? {
            email_notifications: (data as any).email_notifications || null,
            push_notifications: (data as any).push_notifications || null,
            sms_notifications: (data as any).sms_notifications || null,
            notification_schedule: (data as any).notification_schedule || null,
          }
        : null;
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return null;
    }
  }

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>,
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating notification settings:", error);
      return false;
    }
  }

  // ================== APP PREFERENCES ==================

  async getAppPreferences(): Promise<AppPreferences | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      return data
        ? {
            interface_settings: (data as any).interface_settings || null,
            data_preferences: (data as any).data_preferences || null,
            feature_preferences: (data as any).feature_preferences || null,
            integration_settings: (data as any).integration_settings || null,
          }
        : null;
    } catch (error) {
      console.error("Error getting app preferences:", error);
      return null;
    }
  }

  async updateAppPreferences(
    preferences: Partial<AppPreferences>,
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating app preferences:", error);
      return false;
    }
  }

  // ================== PERFORMANCE TARGETS ==================

  async getPerformanceTargets(
    projectId?: string,
    clientId?: string,
  ): Promise<PerformanceTargets | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("project_id", projectId || null)
        .eq("client_id", clientId || null)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST301") {
          console.warn(
            `Performance targets table issue (${error.code}): ${error.message}`,
          );
          return null; // Table doesn't exist, return null
        }
        throw error;
      }

      return data
        ? {
            target_leads_per_month: (data as any).target_leads_per_month || null,
            target_conversion_rate: (data as any).target_conversion_rate || null,
            target_meetings_per_month: (data as any).target_meetings_per_month || null,
            target_messages_per_week: (data as any).target_messages_per_week || null,
            target_response_rate: (data as any).target_response_rate || null,
            target_reach_rate: (data as any).target_reach_rate || null,
            target_bant_qualification_rate: (data as any).target_bant_qualification_rate || null,
            target_cold_to_warm_rate: (data as any).target_cold_to_warm_rate || null,
            target_warm_to_hot_rate: (data as any).target_warm_to_hot_rate || null,
            target_hot_to_burning_rate: (data as any).target_hot_to_burning_rate || null,
            target_burning_to_meeting_rate: (data as any).target_burning_to_meeting_rate || null,
            target_calendly_booking_rate: (data as any).target_calendly_booking_rate || null,
            custom_targets: (data as any).custom_targets || null,
            target_period: (data as any).target_period || null,
          }
        : null;
    } catch (error) {
      console.error("Error getting performance targets:", error);
      return null;
    }
  }

  async updatePerformanceTargets(
    targets: Partial<PerformanceTargets>,
    projectId?: string,
    clientId?: string,
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        project_id: projectId || null,
        client_id: clientId || null,
        ...targets,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST301") {
          console.warn(
            `Performance targets table issue (${error.code}): ${error.message}`,
          );
          return false; // Table doesn't exist, but don't crash
        }
        throw error;
      }
      return true;
    } catch (error) {
      console.error("Error updating performance targets:", error);
      return false;
    }
  }

  // ================== SESSION STATE ==================

  async getSessionState(sessionId: string): Promise<SessionState | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      return data
        ? {
            current_context: (data as any).current_context || null,
            ui_state: (data as any).ui_state || null,
          }
        : null;
    } catch (error) {
      console.error("Error getting session state:", error);
      return null;
    }
  }

  async updateSessionState(
    sessionId: string,
    state: Partial<SessionState>,
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        session_id: sessionId,
        ...state,
        last_activity: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating session state:", error);
      return false;
    }
  }

  // ================== UTILITY METHODS ==================

  async getAllUserSettings(projectId?: string, clientId?: string) {
    try {
      const [dashboard, notifications, app, targets, session] =
        await Promise.all([
          this.getDashboardSettings(projectId, clientId),
          this.getNotificationSettings(),
          this.getAppPreferences(),
          this.getPerformanceTargets(projectId, clientId),
          this.getSessionState(this.generateSessionId()),
        ]);

      return {
        dashboard,
        notifications,
        app,
        targets,
        session,
      };
    } catch (error) {
      console.error("Error getting all user settings:", error);
      return null;
    }
  }

  async resetAllSettings(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const tables = [
        "user_dashboard_settings",
        "user_notification_settings",
        "user_app_preferences",
        "user_performance_targets",
        "user_session_state",
      ];

      const promises = tables.map((table) =>
        supabase.from(table).delete().eq("id", user.id),
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error resetting all settings:", error);
      return false;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ================== DEFAULT VALUES ==================

  getDefaultDashboardSettings(): DashboardSettings {
    return {
      widget_visibility: {
        metrics: true,
        monthlyPerformance: true,
        leadsConversions: true,
        revenueChannel: true,
        pieCharts: true,
        recentActivity: true,
        insights: true,
        performanceTargets: true,
      },
      widget_layout: [],
      dashboard_preferences: {
        defaultView: "enhanced",
        autoRefresh: true,
        refreshInterval: 300000,
        compactMode: false,
        showTooltips: true,
        animationsEnabled: true,
      },
    };
  }

  getDefaultNotificationSettings(): NotificationSettings {
    return {
      email_notifications: {
        leadUpdates: true,
        meetingReminders: true,
        systemAlerts: true,
        weeklyReports: true,
        bantQualifications: true,
        calendlyBookings: true,
        heatProgressions: true,
      },
      push_notifications: {
        leadUpdates: true,
        meetingReminders: true,
        systemAlerts: true,
        realTimeUpdates: false,
      },
      sms_notifications: {
        urgentAlerts: false,
        meetingReminders: false,
        leadUpdates: false,
      },
      notification_schedule: {
        workingHours: { start: "09:00", end: "18:00" },
        timezone: "UTC",
        weekends: false,
        quietHours: { enabled: true, start: "22:00", end: "08:00" },
      },
    };
  }

  getDefaultAppPreferences(): AppPreferences {
    return {
      interface_settings: {
        theme: "system",
        language: "en",
        rtl: false,
        density: "comfortable",
        sidebarCollapsed: false,
        colorScheme: "default",
      },
      data_preferences: {
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
        numberFormat: "en-US",
        currency: "USD",
        pagination: 25,
        sortPreferences: {},
      },
      feature_preferences: {
        betaFeatures: false,
        advancedMode: false,
        debugMode: false,
        analytics: true,
        tutorials: true,
      },
      integration_settings: {
        calendly: { enabled: false, autoSync: false },
        whatsapp: { enabled: true, autoSync: true },
        email: { enabled: false, provider: null },
      },
    };
  }

  getDefaultPerformanceTargets(): PerformanceTargets {
    return {
      target_leads_per_month: 100,
      target_conversion_rate: 15.0,
      target_meetings_per_month: 20,
      target_messages_per_week: 150,
      target_response_rate: 70.0,
      target_reach_rate: 85.0,
      target_bant_qualification_rate: 70.0,
      target_cold_to_warm_rate: 40.0,
      target_warm_to_hot_rate: 60.0,
      target_hot_to_burning_rate: 80.0,
      target_burning_to_meeting_rate: 75.0,
      target_calendly_booking_rate: 25.0,
      custom_targets: {},
      target_period: {
        type: "monthly",
        startDate: null,
        endDate: null,
        recurring: true,
      },
    };
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: {
    title: string;
    message: string;
    type: "success" | "info" | "warning" | "error";
    action_url?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      await supabase.from("profiles").insert({
        id: user.user.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.action_url,
        metadata: notification.metadata || {},
      });
    } catch (error) {
      console.error("ERROR Failed to create notification:", error);
      // Don't throw - notifications are non-critical
    }
  }
}

export const userSettingsService = new UserSettingsService();
