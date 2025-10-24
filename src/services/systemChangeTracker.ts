// @ts-nocheck
import { supabase } from "@/lib/supabase";
import logger from "@/services/base/logger";

// Types for system change tracking
export interface SystemChange {
  id?: string;
  user_id: string;
  entity_type: 'lead' | 'project' | 'message' | 'meeting' | 'system';
  entity_id: string;
  change_type: 'created' | 'updated' | 'deleted' | 'status_changed';
  old_values?: any;
  new_values?: any;
  description: string;
  metadata?: any;
  created_at?: string;
  read_at?: string;
  is_read: boolean;
}

export interface AggregatedNotification {
  id?: string;
  user_id: string;
  notification_type: 'leads' | 'projects' | 'messages' | 'meetings';
  count: number;
  title: string;
  description: string;
  last_updated: string;
  created_at?: string;
  read_at?: string;
  is_read: boolean;
  metadata?: any;
}

// Helper function to get user ID from auth context
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

class SystemChangeTracker {
  
  // ===== TRACKING CHANGES =====
  
  async trackChange(change: Omit<SystemChange, 'id' | 'created_at' | 'is_read' | 'user_id'>): Promise<boolean> {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.error('No user ID available for tracking change');
        return false;
      }

      const { data, error } = await supabase
        .from('system_changes')
        .insert({
          user_id: userId,
          is_read: false,
          created_at: new Date().toISOString(),
          ...change
        })
        .select()
        .single();

      if (error) {
        logger.error('Error tracking system change:', error.message);
        return false;
      }

      logger.info('System change tracked successfully', data);
      
      // Update aggregated notifications
      await this.updateAggregatedNotifications(userId, change.entity_type, change.change_type);
      
      return true;
    } catch (error) {
      logger.error('Error in trackChange:', error);
      return false;
    }
  }

  // ===== LEAD TRACKING =====
  
  async trackLeadChange(leadId: string, changeType: SystemChange['change_type'], oldValues?: any, newValues?: any): Promise<boolean> {
    const descriptions = {
      created: 'New lead created',
      updated: 'Lead information updated',
      deleted: 'Lead deleted',
      status_changed: 'Lead status changed'
    };

    return this.trackChange({
      entity_type: 'lead',
      entity_id: leadId,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      description: descriptions[changeType],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'system'
      }
    });
  }

  // ===== PROJECT TRACKING =====
  
  async trackProjectChange(projectId: string, changeType: SystemChange['change_type'], oldValues?: any, newValues?: any): Promise<boolean> {
    const descriptions = {
      created: 'New project created',
      updated: 'Project information updated',
      deleted: 'Project deleted',
      status_changed: 'Project status changed'
    };

    return this.trackChange({
      entity_type: 'project',
      entity_id: projectId,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      description: descriptions[changeType],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'system'
      }
    });
  }

  // ===== MESSAGE TRACKING =====
  
  async trackMessageChange(messageId: string, changeType: SystemChange['change_type'], oldValues?: any, newValues?: any): Promise<boolean> {
    const descriptions = {
      created: 'New message received',
      updated: 'Message updated',
      deleted: 'Message deleted',
      status_changed: 'Message status changed'
    };

    return this.trackChange({
      entity_type: 'message',
      entity_id: messageId,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      description: descriptions[changeType],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'system'
      }
    });
  }

  // ===== MEETING TRACKING =====
  
  async trackMeetingChange(meetingId: string, changeType: SystemChange['change_type'], oldValues?: any, newValues?: any): Promise<boolean> {
    const descriptions = {
      created: 'New meeting scheduled',
      updated: 'Meeting details updated',
      deleted: 'Meeting cancelled',
      status_changed: 'Meeting status changed'
    };

    return this.trackChange({
      entity_type: 'meeting',
      entity_id: meetingId,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      description: descriptions[changeType],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'calendly'
      }
    });
  }

  // ===== AGGREGATED NOTIFICATIONS =====
  
  private async updateAggregatedNotifications(userId: string, entityType: string, changeType: string): Promise<void> {
    try {
      // Get current aggregated notification for this type
      const { data: existing, error: fetchError } = await supabase
        .from('aggregated_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', entityType)
        .eq('is_read', false)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Error fetching aggregated notification:', fetchError.message);
        return;
      }

      const now = new Date().toISOString();
      
      if (existing) {
        // Update existing notification
        const newCount = existing.count + 1;
        const title = this.getAggregatedTitle(entityType, newCount);
        const description = this.getAggregatedDescription(entityType, newCount);

        const { error: updateError } = await supabase
          .from('aggregated_notifications')
          .update({
            count: newCount,
            title,
            description,
            last_updated: now,
            metadata: {
              ...existing.metadata,
              latest_change: changeType,
              last_change_time: now
            }
          })
          .eq('id', existing.id);

        if (updateError) {
          logger.error('Error updating aggregated notification:', updateError.message);
        }
      } else {
        // Create new aggregated notification
        const title = this.getAggregatedTitle(entityType, 1);
        const description = this.getAggregatedDescription(entityType, 1);

        const { error: insertError } = await supabase
          .from('aggregated_notifications')
          .insert({
            user_id: userId,
            notification_type: entityType,
            count: 1,
            title,
            description,
            last_updated: now,
            created_at: now,
            is_read: false,
            metadata: {
              latest_change: changeType,
              last_change_time: now
            }
          });

        if (insertError) {
          logger.error('Error creating aggregated notification:', insertError.message);
        }
      }
    } catch (error) {
      logger.error('Error in updateAggregatedNotifications:', error);
    }
  }

  private getAggregatedTitle(entityType: string, count: number): string {
    const titles = {
      lead: count === 1 ? 'New Lead Update' : `${count} Lead Updates`,
      project: count === 1 ? 'New Project Update' : `${count} Project Updates`,
      message: count === 1 ? 'New Message' : `${count} New Messages`,
      meeting: count === 1 ? 'New Meeting' : `${count} Meeting Updates`
    };
    return titles[entityType] || `${count} Updates`;
  }

  private getAggregatedDescription(entityType: string, count: number): string {
    const descriptions = {
      lead: count === 1 ? 'You have a new lead update' : `You have ${count} new lead updates`,
      project: count === 1 ? 'You have a new project update' : `You have ${count} new project updates`,
      message: count === 1 ? 'You have a new message' : `You have ${count} new messages`,
      meeting: count === 1 ? 'You have a new meeting update' : `You have ${count} new meeting updates`
    };
    return descriptions[entityType] || `You have ${count} new updates`;
  }

  // ===== RETRIEVING NOTIFICATIONS =====
  
  async getAggregatedNotifications(userId?: string): Promise<AggregatedNotification[]> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getAggregatedNotifications');
        return [];
      }

      const { data, error } = await supabase
        .from('aggregated_notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_read', false)
        .order('last_updated', { ascending: false });

      if (error) {
        logger.error('Error fetching aggregated notifications:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAggregatedNotifications:', error);
      return [];
    }
  }

  async getRecentChanges(userId?: string, limit: number = 50): Promise<SystemChange[]> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getRecentChanges');
        return [];
      }

      const { data, error } = await supabase
        .from('system_changes')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent changes:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getRecentChanges:', error);
      return [];
    }
  }

  // ===== MARKING AS READ =====
  
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('aggregated_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        logger.error('Error marking notification as read:', error.message);
        return false;
      }

      logger.info('Notification marked as read successfully', data);
      return true;
    } catch (error) {
      logger.error('Error in markNotificationAsRead:', error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for markAllNotificationsAsRead');
        return false;
      }

      const { data, error } = await supabase
        .from('aggregated_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)
        .eq('is_read', false);

      if (error) {
        logger.error('Error marking all notifications as read:', error.message);
        return false;
      }

      logger.info('All notifications marked as read successfully');
      return true;
    } catch (error) {
      logger.error('Error in markAllNotificationsAsRead:', error);
      return false;
    }
  }

  // ===== STATISTICS =====
  
  async getChangeStatistics(userId?: string, days: number = 30): Promise<any> {
    try {
      const targetUserId = userId || await getUserId();
      if (!targetUserId) {
        logger.error('No user ID available for getChangeStatistics');
        return null;
      }

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const { data, error } = await supabase
        .from('system_changes')
        .select('entity_type, change_type, created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', sinceDate.toISOString());

      if (error) {
        logger.error('Error fetching change statistics:', error.message);
        return null;
      }

      // Process statistics
      const stats = {
        totalChanges: data.length,
        byEntityType: {},
        byChangeType: {},
        byDay: {}
      };

      data.forEach(change => {
        // Count by entity type
        stats.byEntityType[change.entity_type] = (stats.byEntityType[change.entity_type] || 0) + 1;
        
        // Count by change type
        stats.byChangeType[change.change_type] = (stats.byChangeType[change.change_type] || 0) + 1;
        
        // Count by day
        const day = new Date(change.created_at).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error in getChangeStatistics:', error);
      return null;
    }
  }
}

export const systemChangeTracker = new SystemChangeTracker();
export default systemChangeTracker; 