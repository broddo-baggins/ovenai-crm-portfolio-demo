// @ts-nocheck
/**
 * Real Notification Service
 * Collects and manages real notifications from system events
 */

import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'lead' | 'message' | 'meeting' | 'system' | 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationEvent {
  type: 'lead_created' | 'lead_updated' | 'message_received' | 'message_sent' | 'meeting_scheduled' | 'meeting_cancelled' | 'system_update' | 'user_login' | 'user_registration' | 'whatsapp_status' | 'calendly_booking' | 'bant_progression' | 'heat_progression';
  userId: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

class NotificationService {
  /**
   * Create a new notification from a system event
   */
  async createNotification(event: NotificationEvent): Promise<boolean> {
    try {
      const notificationType = this.mapEventToNotificationType(event.type);
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: event.userId,
          title: event.title,
          message: event.message,
          type: notificationType,
          read: false,
          action_url: event.actionUrl,
          metadata: {
            event_type: event.type,
            priority: event.priority || 'medium',
            timestamp: new Date().toISOString(),
            ...event.metadata
          }
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      console.log(`📣 Notification created: ${event.type} for user ${event.userId}`);
      return true;
    } catch (error) {
      console.error('Exception in createNotification:', error);
      return false;
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getUserNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('NOTIFY Real-time notification received:', payload.new);
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      return error ? 0 : (count || 0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true)
        .lt('created_at', cutoffDate.toISOString());

      return !error;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return false;
    }
  }

  // ================== EVENT HANDLERS ==================

  /**
   * Handle lead-related events
   */
  async notifyLeadEvent(userId: string, leadId: string, eventType: 'created' | 'updated' | 'qualified' | 'converted', leadData?: any): Promise<void> {
    const events = {
      created: {
        title: 'New Lead Created',
        message: `A new lead has been added to your pipeline: ${leadData?.name || leadId}`,
        actionUrl: `/leads?highlight=${leadId}`
      },
      updated: {
        title: 'Lead Updated',
        message: `Lead ${leadData?.name || leadId} has been updated`,
        actionUrl: `/leads?highlight=${leadId}`
      },
      qualified: {
        title: 'Lead Qualified',
        message: `Lead ${leadData?.name || leadId} has been qualified with BANT/HEAT scoring`,
        actionUrl: `/leads?highlight=${leadId}`
      },
      converted: {
        title: 'Lead Converted! COMPLETE',
        message: `Congratulations! Lead ${leadData?.name || leadId} has been converted to a customer`,
        actionUrl: `/leads?highlight=${leadId}`
      }
    };

    const event = events[eventType];
    await this.createNotification({
      type: eventType === 'created' ? 'lead_created' : 'lead_updated',
      userId,
      title: event.title,
      message: event.message,
      actionUrl: event.actionUrl,
      metadata: { leadId, leadData },
      priority: eventType === 'converted' ? 'high' : 'medium'
    });
  }

  /**
   * Handle WhatsApp message events
   */
  async notifyWhatsAppEvent(userId: string, phoneNumber: string, eventType: 'received' | 'sent' | 'failed', messageData?: any): Promise<void> {
    const events = {
      received: {
        title: 'New WhatsApp Message',
        message: `New message received from ${phoneNumber}`,
        actionUrl: `/messages?phone=${phoneNumber}`
      },
      sent: {
        title: 'Message Sent',
        message: `Message successfully sent to ${phoneNumber}`,
        actionUrl: `/messages?phone=${phoneNumber}`
      },
      failed: {
        title: 'Message Failed',
        message: `Failed to send message to ${phoneNumber}`,
        actionUrl: `/messages?phone=${phoneNumber}`
      }
    };

    const event = events[eventType];
    await this.createNotification({
      type: eventType === 'received' ? 'message_received' : 'message_sent',
      userId,
      title: event.title,
      message: event.message,
      actionUrl: event.actionUrl,
      metadata: { phoneNumber, messageData },
      priority: eventType === 'failed' ? 'high' : 'medium'
    });
  }

  /**
   * Handle meeting/calendar events
   */
  async notifyMeetingEvent(userId: string, eventType: 'scheduled' | 'cancelled' | 'reminder', meetingData?: any): Promise<void> {
    const events = {
      scheduled: {
        title: 'Meeting Scheduled',
        message: `New meeting scheduled: ${meetingData?.title || 'Untitled Meeting'}`,
        actionUrl: `/calendar`
      },
      cancelled: {
        title: 'Meeting Cancelled',
        message: `Meeting cancelled: ${meetingData?.title || 'Untitled Meeting'}`,
        actionUrl: `/calendar`
      },
      reminder: {
        title: 'Meeting Reminder',
        message: `Meeting starting soon: ${meetingData?.title || 'Untitled Meeting'}`,
        actionUrl: `/calendar`
      }
    };

    const event = events[eventType];
    await this.createNotification({
      type: eventType === 'scheduled' ? 'meeting_scheduled' : 'meeting_cancelled',
      userId,
      title: event.title,
      message: event.message,
      actionUrl: event.actionUrl,
      metadata: { meetingData },
      priority: eventType === 'reminder' ? 'high' : 'medium'
    });
  }

  /**
   * Handle system events
   */
  async notifySystemEvent(userId: string, eventType: 'update' | 'maintenance' | 'security' | 'feature', message: string, metadata?: any): Promise<void> {
    await this.createNotification({
      type: 'system_update',
      userId,
      title: `System ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      message,
      metadata: { eventType, ...metadata },
      priority: eventType === 'security' ? 'urgent' : 'low'
    });
  }

  // ================== HELPERS ==================

  private mapEventToNotificationType(eventType: string): Notification['type'] {
    const mapping: Record<string, Notification['type']> = {
      'lead_created': 'lead',
      'lead_updated': 'lead',
      'message_received': 'message',
      'message_sent': 'message',
      'meeting_scheduled': 'meeting',
      'meeting_cancelled': 'meeting',
      'system_update': 'system',
      'user_login': 'info',
      'user_registration': 'success',
      'whatsapp_status': 'info',
      'calendly_booking': 'meeting',
      'bant_progression': 'success',
      'heat_progression': 'success'
    };

    return mapping[eventType] || 'info';
  }
}

export const notificationService = new NotificationService();
export default notificationService; 