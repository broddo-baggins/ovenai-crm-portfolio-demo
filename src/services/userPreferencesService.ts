// @ts-nocheck
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/ClientAuthContext";
import logger from "@/services/base/logger";

// Helper function to get user ID from auth context
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Types for user preferences
export interface UserAppPreferences {
  id?: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  auto_refresh: boolean;
  refresh_interval: number;
  show_debug_info: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserNotificationSettings {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_schedule: any; // JSON field for schedule settings
  created_at?: string;
  updated_at?: string;
}

export interface UserPerformanceTargets {
  id?: string;
  user_id: string;
  client_id?: string;
  project_id?: string;
  target_leads_per_month: number;
  target_conversion_rate: number;
  target_meetings_per_month: number;
  target_messages_per_week: number;
  target_response_rate: number;
  target_reach_rate: number;
  target_bant_qualification_rate: number;
  target_cold_to_warm_rate: number;
  target_warm_to_hot_rate: number;
  target_hot_to_burning_rate: number;
  target_burning_to_meeting_rate: number;
  target_calendly_booking_rate: number;
  custom_targets?: any; // JSON field for custom targets
  created_at?: string;
  updated_at?: string;
}

export interface UserDashboardSettings {
  id?: string;
  user_id: string;
  client_id?: string;
  project_id?: string;
  widget_visibility: any; // JSON field for widget visibility settings
  widget_layout: any; // JSON field for widget layout settings
  dashboard_preferences: any; // JSON field for dashboard preferences
  created_at?: string;
  updated_at?: string;
}

export interface UserQueueManagementSettings {
  id?: string;
  user_id: string;
  client_id?: string;
  project_id?: string;
  
  // Work Days Configuration
  work_days: {
    enabled: boolean;
    work_days: number[]; // 0=Sunday, 1=Monday, etc. Default: [1,2,3,4,5] for Mon-Fri
    business_hours: {
      start: string; // "09:00"
      end: string;   // "17:00"
      timezone: string;
    };
    exclude_holidays: boolean;
    custom_holidays: string[]; // Array of ISO date strings "2025-12-25"
  };
  
  // Processing Targets
  processing_targets: {
    target_leads_per_month: number; // e.g., 1000
    target_leads_per_work_day: number; // Calculated: 1000 / ~22 work days = ~45
    override_daily_target?: number; // Manual override if needed
    max_daily_capacity: number; // Safety limit e.g., 200
    weekend_processing: {
      enabled: boolean;
      reduced_target_percentage: number; // e.g., 50 = 50% of normal target
    };
  };
  
  // Automation Settings
  automation: {
    auto_queue_preparation: boolean; // Automatically prepare tomorrow's queue
    queue_preparation_time: string; // "18:00" - when to prepare queue
    auto_start_processing: boolean; // Auto-start processing at business hours
    processing_start_time: string; // "09:00" - when to start processing
    pause_on_weekends: boolean;
    pause_on_holidays: boolean;
  };
  
  // Advanced Settings
  advanced: {
    priority_weights: {
      new_leads: number; // 1-10 priority
      follow_ups: number;
      qualified_leads: number;
      hot_leads: number;
    };
    batch_size: number; // How many leads to process in each batch
    processing_delay_minutes: number; // Delay between lead processing
    retry_failed_leads: boolean;
    max_retry_attempts: number;
  };
  
  created_at?: string;
  updated_at?: string;
}

class UserPreferencesService {
  
  // ===== USER APP PREFERENCES =====
  
  async getAppPreferences(userId?: string): Promise<UserAppPreferences | null> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getAppPreferences');
        return null;
      }

      const { data, error } = await supabase
        .from('user_app_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return defaults
          return this.getDefaultAppPreferences(targetUserId);
        }
        logger.error('Error fetching app preferences:', error.message);
        return null;
      }

      return data as any; // TODO: Fix type definitions
    } catch (error) {
      logger.error('Error in getAppPreferences:', error);
      return null;
    }
  }

  async saveAppPreferences(preferences: Partial<UserAppPreferences>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for saveAppPreferences');
        return false;
      }

      const { data, error } = await supabase
        .from('user_app_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving app preferences:', error.message);
        return false;
      }

      logger.info('App preferences saved successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in saveAppPreferences:', error);
      return false;
    }
  }

  private getDefaultAppPreferences(userId: string): UserAppPreferences {
    return {
      user_id: userId,
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      auto_refresh: true,
      refresh_interval: 30000, // 30 seconds
      show_debug_info: false,
    };
  }

  // ===== USER NOTIFICATION SETTINGS =====

  async getNotificationSettings(userId?: string): Promise<UserNotificationSettings | null> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getNotificationSettings');
        return null;
      }

      const { data, error } = await supabase
        .from("user_notification_settings")
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return defaults
          return this.getDefaultNotificationSettings(targetUserId);
        }
        logger.error('Error fetching notification settings:', error.message);
        return null;
      }

      return data as any; // TODO: Fix type definitions
    } catch (error) {
      logger.error('Error in getNotificationSettings:', error);
      return null;
    }
  }

  async saveNotificationSettings(settings: Partial<UserNotificationSettings>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for saveNotificationSettings');
        return false;
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving notification settings:', error.message);
        return false;
      }

      logger.info('Notification settings saved successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in saveNotificationSettings:', error);
      return false;
    }
  }

  private getDefaultNotificationSettings(userId: string): UserNotificationSettings {
    return {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_schedule: {
        whatsapp_notifications: true,
        lead_notifications: true,
        meeting_notifications: true,
        system_notifications: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        notification_frequency: 'real-time',
      },
    };
  }

  // ===== USER PERFORMANCE TARGETS =====

  async getPerformanceTargets(userId?: string): Promise<UserPerformanceTargets | null> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getPerformanceTargets');
        return null;
      }

      const { data, error } = await supabase
        .from("user_performance_targets")
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No targets found, return defaults
          return this.getDefaultPerformanceTargets(targetUserId);
        }
        logger.error('Error fetching performance targets:', error.message);
        return null;
      }

      return data as any; // TODO: Fix type definitions
    } catch (error) {
      logger.error('Error in getPerformanceTargets:', error);
      return null;
    }
  }

  async savePerformanceTargets(targets: Partial<UserPerformanceTargets>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for savePerformanceTargets');
        return false;
      }

      const { data, error } = await supabase
        .from("user_performance_targets")
        .upsert({
          user_id: userId,
          ...targets,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving performance targets:', error.message);
        return false;
      }

      logger.info('Performance targets saved successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in savePerformanceTargets:', error);
      return false;
    }
  }

  private getDefaultPerformanceTargets(userId: string): UserPerformanceTargets {
    return {
      user_id: userId,
      target_leads_per_month: 50,
      target_conversion_rate: 0.15, // 15%
      target_meetings_per_month: 20,
      target_messages_per_week: 100,
      target_response_rate: 0.80, // 80%
      target_reach_rate: 0.90, // 90%
      target_bant_qualification_rate: 0.25, // 25%
      target_cold_to_warm_rate: 0.30, // 30%
      target_warm_to_hot_rate: 0.40, // 40%
      target_hot_to_burning_rate: 0.60, // 60%
      target_burning_to_meeting_rate: 0.80, // 80%
      target_calendly_booking_rate: 0.70, // 70%
      custom_targets: {},
    };
  }

  // ===== USER DASHBOARD SETTINGS =====

  async getDashboardSettings(userId?: string): Promise<UserDashboardSettings | null> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getDashboardSettings');
        return null;
      }

      const { data, error } = await supabase
        .from("user_dashboard_settings")
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return defaults
          return this.getDefaultDashboardSettings(targetUserId);
        }
        logger.error('Error fetching dashboard settings:', error.message);
        return null;
      }

      return data as any; // TODO: Fix type definitions
    } catch (error) {
      logger.error('Error in getDashboardSettings:', error);
      return null;
    }
  }

  async saveDashboardSettings(settings: Partial<UserDashboardSettings>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for saveDashboardSettings');
        return false;
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving dashboard settings:', error.message);
        return false;
      }

      logger.info('Dashboard settings saved successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in saveDashboardSettings:', error);
      return false;
    }
  }

  private getDefaultDashboardSettings(userId: string): UserDashboardSettings {
    return {
      user_id: userId,
      widget_visibility: {
        leads: true,
        meetings: true,
        performance: true,
        messages: true,
        calendar: true,
        analytics: false,
      },
      widget_layout: {
        layout: 'grid',
        widget_order: ['leads', 'meetings', 'performance', 'messages'],
        columns: 2,
      },
      dashboard_preferences: {
        default_date_range: '30d',
        auto_refresh_dashboard: true,
        dashboard_refresh_interval: 60000, // 1 minute
        show_advanced_metrics: false,
        theme: 'system',
      },
    };
  }

  // ===== USER QUEUE MANAGEMENT SETTINGS =====

  async getQueueManagementSettings(userId?: string): Promise<UserQueueManagementSettings | null> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getQueueManagementSettings');
        return this.getDefaultQueueManagementSettings('system-fallback');
      }

      const { data, error } = await supabase
        .from("user_queue_settings")
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, initialize with defaults and save them
          logger.info('No queue settings found, initializing defaults for user:', targetUserId);
          const defaultSettings = this.getDefaultQueueManagementSettings(targetUserId);
          
          // Try to save the default settings to the database
          await this.saveQueueManagementSettings(defaultSettings);
          
          return defaultSettings;
        }
        logger.error('Error fetching queue management settings:', error.message);
        return this.getDefaultQueueManagementSettings(targetUserId);
      }

      return data as any; // TODO: Fix type definitions
    } catch (error) {
      logger.error('Error in getQueueManagementSettings:', error);
      return this.getDefaultQueueManagementSettings('error-fallback');
    }
  }

  async saveQueueManagementSettings(settings: Partial<UserQueueManagementSettings>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for saveQueueManagementSettings');
        return false;
      }

      const { data, error } = await supabase
        .from("user_queue_settings")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving queue management settings:', error.message);
        return false;
      }

      logger.info('Queue management settings saved successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in saveQueueManagementSettings:', error);
      return false;
    }
  }

  // Make this method public so it can be accessed from LeadProcessingService
  getDefaultQueueManagementSettings(userId: string): UserQueueManagementSettings {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
      user_id: userId,
      work_days: {
        enabled: true,
        work_days: [1, 2, 3, 4, 5], // Monday to Friday
        business_hours: {
          start: "09:00",
          end: "17:00",
          timezone: timezone,
        },
        exclude_holidays: true,
        custom_holidays: [
          // Common holidays - users can customize
          "2025-01-01", // New Year's Day
          "2025-07-04", // Independence Day (US)
          "2025-12-25", // Christmas Day
        ],
      },
      processing_targets: {
        target_leads_per_month: 1000,
        target_leads_per_work_day: 45, // ~1000 / 22 work days per month
        max_daily_capacity: 200,
        weekend_processing: {
          enabled: false,
          reduced_target_percentage: 25, // 25% of normal target on weekends
        },
      },
      automation: {
        auto_queue_preparation: true,
        queue_preparation_time: "18:00", // Prepare queue at 6 PM
        auto_start_processing: true,
        processing_start_time: "09:00", // Start processing at 9 AM
        pause_on_weekends: true,
        pause_on_holidays: true,
      },
      advanced: {
        priority_weights: {
          new_leads: 3,
          follow_ups: 7,
          qualified_leads: 9,
          hot_leads: 10,
        },
        batch_size: 10, // Process 10 leads per batch
        processing_delay_minutes: 2, // 2 minutes between leads
        retry_failed_leads: true,
        max_retry_attempts: 3,
      },
    };
  }

  // ===== UTILITY METHODS =====

  async resetAllPreferences(): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for resetAllPreferences');
        return false;
      }

      // Reset all tables
      const tables = [
        'user_app_preferences',
        'user_notification_settings',
        'user_performance_targets',
        'user_dashboard_settings'
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);

        if (error) {
          logger.error(`Error resetting ${table}:`, error.message);
          return false;
        }
      }

      logger.info('All user preferences reset successfully');
      return true;
    } catch (error) {
      logger.error('Error in resetAllPreferences:', error);
      return false;
    }
  }

  async exportUserPreferences(): Promise<any> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for exportUserPreferences');
        return null;
      }

      const [appPrefs, notificationSettings, performanceTargets, dashboardSettings, queueSettings] = await Promise.all([
        this.getAppPreferences(userId),
        this.getNotificationSettings(userId),
        this.getPerformanceTargets(userId),
        this.getDashboardSettings(userId),
        this.getQueueManagementSettings(userId)
      ]);

      return {
        exported_at: new Date().toISOString(),
        user_id: userId,
        app_preferences: appPrefs,
        notification_settings: notificationSettings,
        performance_targets: performanceTargets,
        dashboard_settings: dashboardSettings,
        queue_management_settings: queueSettings
      };
    } catch (error) {
      logger.error('Error in exportUserPreferences:', error);
      return null;
    }
  }
}

export const userPreferencesService = new UserPreferencesService(); 