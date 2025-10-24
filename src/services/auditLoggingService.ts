// @ts-nocheck
/**
 * Enhanced Audit Logging Service for OvenAI
 * 
 * Provides comprehensive user activity tracking across the entire system including:
 * - Authentication events (login, logout, failed attempts)
 * - User management (creation, updates, deletions)
 * - Data access (viewing, creating, updating, deleting records)
 * - System interactions (dashboard views, exports, imports)
 * - Security events (permission changes, suspicious activity)
 * - Integration events (WhatsApp messages, Calendly bookings)
 */

import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  session_id?: string;
  action_type: string; // 'auth', 'data', 'system', 'security', 'integration'
  action: string; // Specific action performed
  resource_type?: string; // 'user', 'lead', 'project', 'client', 'message', etc.
  resource_id?: string; // ID of the affected resource
  resource_name?: string; // Human-readable name of resource
  old_values?: Record<string, any>; // Previous state (for updates)
  new_values?: Record<string, any>; // New state (for updates/creates)
  metadata?: Record<string, any>; // Additional context
  ip_address?: string;
  user_agent?: string;
  route?: string; // App route/page where action occurred
  severity: 'low' | 'medium' | 'high' | 'critical'; // Security/importance level
  success: boolean; // Whether the action succeeded
  error_message?: string; // If action failed
  created_at?: string;
}

export interface AuditQueryFilters {
  user_id?: string;
  action_type?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  date_from?: Date;
  date_to?: Date;
  severity?: string[];
  success?: boolean;
  limit?: number;
  offset?: number;
}

class AuditLoggingService {
  /**
   * Log a user action to the audit trail
   */
  static async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user session info if not provided
      if (!entry.user_id || !entry.session_id) {
        const { data: { session } } = await supabase.auth.getSession();
        entry.user_id = entry.user_id || session?.user?.id;
        entry.session_id = entry.session_id || session?.access_token;
      }

      // Get browser info if running in browser
      if (typeof window !== 'undefined' && !entry.ip_address) {
        entry.user_agent = navigator.userAgent;
        entry.route = window.location.pathname + window.location.search;
      }

      const { error } = await supabase
        .from('user_audit_logs')
        .insert({
          user_id: entry.user_id,
          session_id: entry.session_id?.substring(0, 50), // Truncate for storage
          action_type: entry.action_type,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          resource_name: entry.resource_name,
          old_values: entry.old_values,
          new_values: entry.new_values,
          metadata: entry.metadata,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent?.substring(0, 500), // Truncate for storage
          route: entry.route,
          severity: entry.severity,
          success: entry.success,
          error_message: entry.error_message,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw error to avoid breaking the main application flow
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silent fail to not disrupt application
    }
  }

  /**
   * Authentication Events
   */
  static async logLogin(userId: string, success: boolean, errorMessage?: string, metadata?: Record<string, any>) {
    await this.logAction({
      user_id: userId,
      action_type: 'auth',
      action: 'login',
      metadata: { ...metadata, timestamp: new Date().toISOString() },
      severity: success ? 'low' : 'medium',
      success,
      error_message: errorMessage
    });
  }

  static async logLogout(userId: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'auth',
      action: 'logout',
      severity: 'low',
      success: true
    });
  }

  static async logFailedLoginAttempt(email: string, reason: string, metadata?: Record<string, any>) {
    await this.logAction({
      action_type: 'auth',
      action: 'login_failed',
      resource_type: 'user',
      resource_name: email,
      metadata: { email, reason, ...metadata },
      severity: 'medium',
      success: false,
      error_message: reason
    });
  }

  static async logPasswordReset(userId: string, success: boolean, errorMessage?: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'auth',
      action: 'password_reset',
      severity: 'medium',
      success,
      error_message: errorMessage
    });
  }

  /**
   * User Management Events
   */
  static async logUserCreation(createdUserId: string, createdByUserId: string, userData: Record<string, any>) {
    await this.logAction({
      user_id: createdByUserId,
      action_type: 'data',
      action: 'user_create',
      resource_type: 'user',
      resource_id: createdUserId,
      resource_name: `${userData.first_name} ${userData.last_name} (${userData.email})`,
      new_values: userData,
      severity: 'medium',
      success: true
    });
  }

  static async logUserUpdate(updatedUserId: string, updatedByUserId: string, oldValues: Record<string, any>, newValues: Record<string, any>) {
    await this.logAction({
      user_id: updatedByUserId,
      action_type: 'data',
      action: 'user_update',
      resource_type: 'user',
      resource_id: updatedUserId,
      old_values: oldValues,
      new_values: newValues,
      severity: 'medium',
      success: true
    });
  }

  static async logUserDeletion(deletedUserId: string, deletedByUserId: string, userData: Record<string, any>) {
    await this.logAction({
      user_id: deletedByUserId,
      action_type: 'data',
      action: 'user_delete',
      resource_type: 'user',
      resource_id: deletedUserId,
      resource_name: `${userData.first_name} ${userData.last_name} (${userData.email})`,
      old_values: userData,
      severity: 'high',
      success: true
    });
  }

  /**
   * Data Access Events
   */
  static async logDataAccess(userId: string, resourceType: string, resourceId: string, action: 'view' | 'create' | 'update' | 'delete', resourceName?: string, data?: Record<string, any>) {
    const severityMap = {
      view: 'low' as const,
      create: 'medium' as const,
      update: 'medium' as const,
      delete: 'high' as const
    };

    await this.logAction({
      user_id: userId,
      action_type: 'data',
      action: `${resourceType}_${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      new_values: action === 'create' ? data : undefined,
      old_values: action === 'delete' ? data : undefined,
      severity: severityMap[action],
      success: true
    });
  }

  /**
   * System Interaction Events
   */
  static async logDashboardView(userId: string, dashboardType: string, filters?: Record<string, any>) {
    await this.logAction({
      user_id: userId,
      action_type: 'system',
      action: 'dashboard_view',
      resource_type: 'dashboard',
      resource_name: dashboardType,
      metadata: { dashboardType, filters },
      severity: 'low',
      success: true
    });
  }

  static async logDataExport(userId: string, exportType: string, recordCount: number, filters?: Record<string, any>) {
    await this.logAction({
      user_id: userId,
      action_type: 'system',
      action: 'data_export',
      resource_type: 'export',
      resource_name: exportType,
      metadata: { exportType, recordCount, filters },
      severity: 'medium',
      success: true
    });
  }

  static async logDataImport(userId: string, importType: string, recordCount: number, success: boolean, errorMessage?: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'system',
      action: 'data_import',
      resource_type: 'import',
      resource_name: importType,
      metadata: { importType, recordCount },
      severity: 'medium',
      success,
      error_message: errorMessage
    });
  }

  /**
   * Security Events
   */
  static async logPermissionChange(userId: string, targetUserId: string, oldRole: string, newRole: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'security',
      action: 'permission_change',
      resource_type: 'user',
      resource_id: targetUserId,
      old_values: { role: oldRole },
      new_values: { role: newRole },
      severity: 'high',
      success: true
    });
  }

  static async logSuspiciousActivity(userId: string, activityType: string, details: Record<string, any>) {
    await this.logAction({
      user_id: userId,
      action_type: 'security',
      action: 'suspicious_activity',
      metadata: { activityType, ...details },
      severity: 'critical',
      success: true
    });
  }

  /**
   * Integration Events
   */
  static async logWhatsAppMessage(userId: string, messageId: string, direction: 'inbound' | 'outbound', leadId?: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'integration',
      action: 'whatsapp_message',
      resource_type: 'message',
      resource_id: messageId,
      metadata: { direction, leadId, platform: 'whatsapp' },
      severity: 'low',
      success: true
    });
  }

  static async logCalendlyBooking(userId: string, bookingId: string, leadId?: string, eventType?: string) {
    await this.logAction({
      user_id: userId,
      action_type: 'integration',
      action: 'calendly_booking',
      resource_type: 'booking',
      resource_id: bookingId,
      metadata: { leadId, eventType, platform: 'calendly' },
      severity: 'low',
      success: true
    });
  }

  /**
   * Query audit logs with filtering
   */
  static async queryAuditLogs(filters: AuditQueryFilters = {}): Promise<{ data: AuditLogEntry[], count: number }> {
    try {
      let query = supabase
        .from('user_audit_logs')
        .select(`
          *,
          user:user_id(first_name, last_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      
      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }
      
      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }
      
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return { data: [], count: 0 };
    }
  }

  /**
   * Get audit summary statistics
   */
  static async getAuditSummary(userId?: string, days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsBySeverity: Record<string, number>;
    failureRate: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const filters: AuditQueryFilters = {
        date_from: dateFrom,
        limit: 1000 // Increase limit for statistics
      };

      if (userId) {
        filters.user_id = userId;
      }

      const { data } = await this.queryAuditLogs(filters);

      const totalActions = data.length;
      const actionsByType: Record<string, number> = {};
      const actionsBySeverity: Record<string, number> = {};
      const actionCounts: Record<string, number> = {};
      let failures = 0;

      data.forEach(entry => {
        // Count by type
        actionsByType[entry.action_type] = (actionsByType[entry.action_type] || 0) + 1;
        
        // Count by severity
        actionsBySeverity[entry.severity] = (actionsBySeverity[entry.severity] || 0) + 1;
        
        // Count by action
        actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
        
        // Count failures
        if (!entry.success) {
          failures++;
        }
      });

      const failureRate = totalActions > 0 ? (failures / totalActions) * 100 : 0;

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      return {
        totalActions,
        actionsByType,
        actionsBySeverity,
        failureRate,
        topActions
      };
    } catch (error) {
      console.error('Error getting audit summary:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        actionsBySeverity: {},
        failureRate: 0,
        topActions: []
      };
    }
  }

  /**
   * Clean up old audit logs (data retention)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('user_audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return { deleted: data?.length || 0 };
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return { deleted: 0 };
    }
  }
}

export { AuditLoggingService }; 