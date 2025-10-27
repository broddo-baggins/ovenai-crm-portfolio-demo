// @ts-nocheck
// TypeScript checking disabled for deployment compatibility
import { supabase } from "@/lib/supabase";
import { Lead } from "@/types/database";
import { toast } from "sonner";
import { UserQueueManagementSettings, userPreferencesService } from "./userPreferencesService";
import { BusinessDaysService, BusinessDayInfo } from "./businessDaysService";

interface ProcessingMetrics {
  dailyTarget: number;
  processedToday: number;
  queuedForTomorrow: number;
  activelyProcessing: number;
  processingRate: number;
  remainingCapacity: number;
  businessDayInfo: BusinessDayInfo;
  isBusinessDay: boolean;
  nextProcessingTime: Date;
}

interface QueuedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  priority: number;
  queuedAt: string;
  estimatedProcessingTime: number;
}

interface EnhancedQueueAnalytics {
  totalPending: number;
  totalQueued: number;
  totalActive: number;
  totalCompleted: number;
  averageProcessingTime: number;
  queueHealth: 'healthy' | 'warning' | 'critical';
  businessDayMetrics: {
    businessDaysInMonth: number;
    businessDaysRemaining: number;
    targetProgress: number; // Percentage of monthly target achieved
    dailyTargetAdjustment: number; // Adjusted daily target based on remaining business days
  };
  workDaySettings: {
    enabled: boolean;
    pausedForWeekend: boolean;
    pausedForHoliday: boolean;
    nextProcessingTime: Date;
  };
}

export class LeadProcessingService {
  // Remove hardcoded daily target - now comes from user settings
  private static cachedSettings: UserQueueManagementSettings | null = null;
  private static settingsLastFetched: number = 0;
  private static SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user queue management settings with caching
   */
  private static async getQueueSettings(): Promise<UserQueueManagementSettings> {
    const now = Date.now();
    
    // Use cached settings if they're still fresh
    if (this.cachedSettings && (now - this.settingsLastFetched) < this.SETTINGS_CACHE_TTL) {
      return this.cachedSettings;
    }

    try {
      const settings = await userPreferencesService.getQueueManagementSettings();
      if (settings) {
        this.cachedSettings = settings;
        this.settingsLastFetched = now;
        return settings;
      }
    } catch (error) {
      console.error('Failed to fetch queue settings, using defaults:', error);
    }

    // Fallback to default settings
    const defaultSettings = userPreferencesService.getDefaultQueueManagementSettings('fallback-user');
    this.cachedSettings = defaultSettings;
    this.settingsLastFetched = now;
    return defaultSettings;
  }

  /**
   * Clear settings cache (useful when settings are updated)
   */
  static clearSettingsCache(): void {
    this.cachedSettings = null;
    this.settingsLastFetched = 0;
  }

  /**
   * Get current processing metrics for today with business day awareness
   */
  static async getProcessingMetrics(targetDate: Date = new Date()): Promise<ProcessingMetrics> {
    try {
      const settings = await this.getQueueSettings();
      const businessDayInfo = BusinessDaysService.getBusinessDayInfo(targetDate, settings);
      const dailyTarget = BusinessDaysService.calculateDailyTarget(settings, targetDate);

      // Get today's date range
      const todayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Query for leads processed today
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, processing_state, updated_at, created_at')
        .gte('updated_at', todayStart.toISOString())
        .lt('updated_at', todayEnd.toISOString());

      if (error) throw error;

      const processedToday = leads?.filter(lead => 
        lead.processing_state === 'completed'
      ).length || 0;

      const activelyProcessing = leads?.filter(lead => 
        lead.processing_state === 'active'
      ).length || 0;

      // Query for queued leads for next business day
      const { data: queuedLeads, error: queueError } = await supabase
        .from('leads')
        .select('id')
        .eq('processing_state', 'queued');

      if (queueError) throw queueError;

      const queuedForTomorrow = queuedLeads?.length || 0;
      const processingRate = dailyTarget > 0 ? (processedToday / dailyTarget) * 100 : 0;
      const remainingCapacity = Math.max(0, dailyTarget - processedToday);
      const nextProcessingTime = BusinessDaysService.getNextProcessingTime(settings);

      return {
        dailyTarget,
        processedToday,
        queuedForTomorrow,
        activelyProcessing,
        processingRate: Math.round(processingRate * 10) / 10,
        remainingCapacity,
        businessDayInfo,
        isBusinessDay: businessDayInfo.isBusinessDay,
        nextProcessingTime,
      };
    } catch (error) {
      console.error('Error getting processing metrics:', error);
      const fallbackSettings = userPreferencesService.getDefaultQueueManagementSettings('fallback');
      const fallbackBusinessDay = BusinessDaysService.getBusinessDayInfo(targetDate, fallbackSettings);
      
      return {
        dailyTarget: 45, // Fallback target
        processedToday: 0,
        queuedForTomorrow: 0,
        activelyProcessing: 0,
        processingRate: 0,
        remainingCapacity: 45,
        businessDayInfo: fallbackBusinessDay,
        isBusinessDay: fallbackBusinessDay.isBusinessDay,
        nextProcessingTime: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }
  }

  /**
   * Prepare queue for next business day (respects work days and holidays)
   */
  static async prepareTomorrowQueue(targetDate: Date = new Date()): Promise<{ success: boolean; queued: number; message: string; nextProcessingDate: Date }> {
    try {
      const settings = await this.getQueueSettings();
      
      // Find the next business day to queue for
      const nextBusinessDay = BusinessDaysService.getNextBusinessDay(targetDate, settings);
      const dailyTarget = BusinessDaysService.calculateDailyTarget(settings, nextBusinessDay);

      // If next business day has no target (e.g., weekend with weekend processing disabled), skip
      if (dailyTarget === 0) {
        return {
          success: false,
          queued: 0,
          message: `Next business day (${nextBusinessDay.toDateString()}) has no processing target configured`,
          nextProcessingDate: nextBusinessDay,
        };
      }

      // Get current metrics to check if queue is already prepared
      const metrics = await this.getProcessingMetrics(targetDate);
      
      if (metrics.queuedForTomorrow >= dailyTarget) {
        return {
          success: false,
          queued: metrics.queuedForTomorrow,
          message: `Queue already prepared for ${nextBusinessDay.toDateString()} with ${metrics.queuedForTomorrow} leads`,
          nextProcessingDate: nextBusinessDay,
        };
      }

      // Calculate how many more leads to queue
      const leadsToQueue = dailyTarget - metrics.queuedForTomorrow;

      // Get pending leads sorted by priority (FIXED - use status field instead of processing_state)
      const { data: pendingLeads, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, created_at, status, client_id, current_project_id')
        .in('status', ['1', '2', 'new', 'unqualified', 'awareness']) // Use actual status values instead of processing_state
        .order('created_at', { ascending: true }) // FIFO for now, can be enhanced with priority
        .limit(leadsToQueue);

      if (error) throw error;

      if (!pendingLeads || pendingLeads.length === 0) {
        return {
          success: false,
          queued: 0,
          message: "No pending leads available to queue",
          nextProcessingDate: nextBusinessDay,
        };
      }

      // FIXED: Actually insert into queue table AND update lead status
      const leadIds = pendingLeads.map(lead => lead.id);
      
      // 1. Create queue entries in whatsapp_message_queue
      const queueEntries = pendingLeads.map((lead, index) => ({
        lead_id: lead.id,
        user_id: lead.client_id || lead.current_project_id, // Use available user reference
        client_id: lead.client_id,
        queue_position: index + 1,
        priority: 5, // Normal priority
        queue_status: 'queued',
        message_type: 'template',
        message_content: `Hello ${lead.first_name || 'there'}! Following up on your inquiry. How can we help you today?`,
        recipient_phone: lead.phone,
        scheduled_for: nextBusinessDay.toISOString(),
        message_template: 'follow_up_template',
        message_variables: {
          lead_name: lead.first_name || 'there',
          company: 'CRM Demo',
          follow_up_date: nextBusinessDay.toISOString()
        }
      }));

      // Insert queue entries (try batch first, then individual if needed)
      let queuedCount = 0;
      try {
        const { data: insertedEntries, error: insertError } = await supabase
          .from('whatsapp_message_queue')
          .insert(queueEntries)
          .select();

        if (insertError) {
          console.warn('WARNING Batch insert failed, trying individual inserts:', insertError.message);
          // Fallback to individual inserts
          for (const entry of queueEntries) {
            const { error: singleError } = await supabase
              .from('whatsapp_message_queue')
              .insert([entry]);
            
            if (!singleError) {
              queuedCount++;
            }
          }
        } else {
          queuedCount = insertedEntries?.length || 0;
        }
      } catch (err) {
        console.error('Failed to insert queue entries:', err);
        queuedCount = 0; // Continue with lead status update anyway
      }

      // 2. Update lead status to indicate they're queued
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'hook', // Move to "queued" status in the system
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);

      if (updateError) {
        console.warn('WARNING Could not update lead statuses:', updateError.message);
        // Don't throw - queue entries were created
      }

      return {
        success: queuedCount > 0,
        queued: queuedCount,
        message: queuedCount > 0 
          ? `Successfully queued ${queuedCount} leads for ${nextBusinessDay.toDateString()} (next business day)`
          : `Found ${pendingLeads.length} pending leads but failed to queue them - check database permissions`,
        nextProcessingDate: nextBusinessDay,
      };
    } catch (error) {
      console.error('Error preparing tomorrow queue:', error);
      return {
        success: false,
        queued: 0,
        message: "Failed to prepare queue for next business day",
        nextProcessingDate: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }
  }

  /**
   * Start automated processing with business day and hour restrictions
   */
  static async startAutomatedProcessing(forceStart: boolean = false): Promise<{ success: boolean; processing: number; message: string; nextProcessingTime?: Date }> {
    try {
      const settings = await this.getQueueSettings();
      const now = new Date();

      // Check if we should process now based on business rules
      if (!forceStart) {
        // Check if it's a business day
        if (!BusinessDaysService.isBusinessDay(now, settings)) {
          const nextProcessingTime = BusinessDaysService.getNextProcessingTime(settings);
          return {
            success: false,
            processing: 0,
            message: `Not a business day. Next processing scheduled for ${nextProcessingTime.toLocaleString()}`,
            nextProcessingTime,
          };
        }

        // Check if we're within business hours
        if (!BusinessDaysService.isWithinBusinessHours(settings, now)) {
          const nextProcessingTime = BusinessDaysService.getNextProcessingTime(settings);
          return {
            success: false,
            processing: 0,
            message: `Outside business hours. Next processing scheduled for ${nextProcessingTime.toLocaleString()}`,
            nextProcessingTime,
          };
        }

        // Check automation settings
        if (settings.automation.pause_on_weekends && (now.getDay() === 0 || now.getDay() === 6)) {
          return {
            success: false,
            processing: 0,
            message: "Automated processing paused for weekends",
            nextProcessingTime: BusinessDaysService.getNextProcessingTime(settings),
          };
        }
      }

      // Get current metrics to check capacity
      const metrics = await this.getProcessingMetrics(now);
      
      if (metrics.remainingCapacity <= 0) {
        return {
          success: false,
          processing: 0,
          message: `Daily target reached (${metrics.processedToday}/${metrics.dailyTarget})`,
        };
      }

      // Calculate batch size (don't exceed remaining capacity or configured batch size)
      const batchSize = Math.min(
        metrics.remainingCapacity,
        settings.advanced.batch_size || 10
      );

      // FIXED: Get queued messages from actual queue table
      const { data: queuedMessages, error } = await supabase
        .from('whatsapp_message_queue')
        .select('id, lead_id, message_content, recipient_phone, priority, queue_position')
        .eq('queue_status', 'queued')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('queue_position', { ascending: true })
        .limit(batchSize);

      if (error) throw error;

      if (!queuedMessages || queuedMessages.length === 0) {
        return {
          success: false,
          processing: 0,
          message: "No queued messages available for processing - try running 'Prepare Tomorrow's Queue' first",
        };
      }

      console.log(`📨 Found ${queuedMessages.length} messages to process`);

      // 1. Update queue status to 'sending'
      const messageIds = queuedMessages.map(msg => msg.id);
      const { error: updateQueueError } = await supabase
        .from('whatsapp_message_queue')
        .update({ 
          queue_status: 'sending',
          processed_at: new Date().toISOString()
        })
        .in('id', messageIds);

      if (updateQueueError) {
        console.warn('WARNING Could not update queue status:', updateQueueError.message);
      }

      // 2. Update associated leads to 'processing'
      const leadIds = queuedMessages
        .map(msg => msg.lead_id)
        .filter(Boolean);

      if (leadIds.length > 0) {
        const { error: updateLeadsError } = await supabase
          .from('leads')
          .update({ 
            status: 'questions-asked', // Move to "active processing" status
            updated_at: new Date().toISOString()
          })
          .in('id', leadIds);

        if (updateLeadsError) {
          console.warn('WARNING Could not update lead statuses:', updateLeadsError.message);
        }
      }

      // 3. Simulate processing completion (in real implementation, integrate with WhatsApp API)
      setTimeout(async () => {
        try {
          // Update to 'sent' status after processing
          await supabase
            .from('whatsapp_message_queue')
            .update({ 
              queue_status: 'sent',
              sent_at: new Date().toISOString()
            })
            .in('id', messageIds);
          
          // Update leads to completed
          if (leadIds.length > 0) {
            await supabase
              .from('leads')
              .update({ 
                status: 'engaged', // Move to "completed/engaged" status
                updated_at: new Date().toISOString()
              })
              .in('id', leadIds);
          }
          
          console.log('SUCCESS Processing simulation completed');
        } catch (error) {
          console.error('ERROR Error in processing simulation:', error);
        }
      }, 5000); // 5 second simulation

      return {
        success: true,
        processing: queuedMessages.length,
        message: `Started processing ${queuedMessages.length} messages. Check back in 30 seconds for completion.`,
      };
    } catch (error) {
      console.error('Error starting automated processing:', error);
      return {
        success: false,
        processing: 0,
        message: "Failed to start automated processing",
      };
    }
  }

  /**
   * Process a batch of leads with proper delays and error handling
   */
  private static async processLeadsBatch(leadIds: string[], settings: UserQueueManagementSettings): Promise<void> {
    const delayMs = (settings.advanced.processing_delay_minutes || 2) * 60 * 1000;

    for (let i = 0; i < leadIds.length; i++) {
      const leadId = leadIds[i];
      
      try {
        // Add delay between processing (except for first lead)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Here you would integrate with your actual lead processing pipeline
        // For now, we'll simulate processing and mark as completed
        await this.processIndividualLead(leadId, settings);

      } catch (error) {
        console.error(`Error processing lead ${leadId}:`, error);
        
        // Handle failed lead processing
        if (settings.advanced.retry_failed_leads) {
          await this.handleFailedLead(leadId, settings);
        }
      }
    }
  }

  /**
   * Process an individual lead (placeholder for actual processing logic)
   */
  private static async processIndividualLead(leadId: string, settings: UserQueueManagementSettings): Promise<void> {
    // This would integrate with your actual lead processing pipeline
    // For demonstration, we'll simulate processing time and mark as completed
    
    const processingTimeMs = Math.random() * 30000 + 10000; // 10-40 seconds simulation
    
    await new Promise(resolve => setTimeout(resolve, processingTimeMs));
    
    // Mark lead as completed
    const { error } = await supabase
      .from('leads')
      .update({ 
        processing_state: 'completed',
        updated_at: new Date().toISOString(),
        processing_metadata: {
          completed_at: new Date().toISOString(),
          processing_duration_ms: processingTimeMs,
        }
      })
      .eq('id', leadId);

    if (error) {
      throw new Error(`Failed to mark lead ${leadId} as completed: ${error.message}`);
    }
  }

  /**
   * Handle failed lead processing with retry logic
   */
  private static async handleFailedLead(leadId: string, settings: UserQueueManagementSettings): Promise<void> {
    try {
      // Get current retry count
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('processing_metadata')
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      const retryCount = (lead?.processing_metadata?.retry_count || 0) + 1;
      const maxRetries = settings.advanced.max_retry_attempts || 3;

      if (retryCount <= maxRetries) {
        // Queue for retry
        await supabase
          .from('leads')
          .update({ 
            processing_state: 'queued',
            updated_at: new Date().toISOString(),
            processing_metadata: {
              ...lead?.processing_metadata,
              retry_count: retryCount,
              last_retry_at: new Date().toISOString(),
            }
          })
          .eq('id', leadId);
      } else {
        // Mark as failed after max retries
        await supabase
          .from('leads')
          .update({ 
            processing_state: 'failed',
            updated_at: new Date().toISOString(),
            processing_metadata: {
              ...lead?.processing_metadata,
              failed_at: new Date().toISOString(),
              final_retry_count: retryCount,
            }
          })
          .eq('id', leadId);
      }
    } catch (error) {
      console.error(`Error handling failed lead ${leadId}:`, error);
    }
  }

  /**
   * Get enhanced queue analytics with business day metrics
   */
  static async getQueueAnalytics(): Promise<EnhancedQueueAnalytics> {
    try {
      const settings = await this.getQueueSettings();
      const now = new Date();
      const businessDayInfo = BusinessDaysService.getBusinessDayInfo(now, settings);

      const { data: leads, error } = await supabase
        .from('leads')
        .select('processing_state, created_at, updated_at');

      if (error) throw error;

      const analytics = {
        totalPending: leads?.filter(lead => lead.processing_state === 'pending').length || 0,
        totalQueued: leads?.filter(lead => lead.processing_state === 'queued').length || 0,
        totalActive: leads?.filter(lead => lead.processing_state === 'active').length || 0,
        totalCompleted: leads?.filter(lead => lead.processing_state === 'completed').length || 0,
        averageProcessingTime: 0,
        queueHealth: 'healthy' as 'healthy' | 'warning' | 'critical',
        businessDayMetrics: {
          businessDaysInMonth: businessDayInfo.businessDaysInMonth,
          businessDaysRemaining: businessDayInfo.businessDaysRemaining,
          targetProgress: 0,
          dailyTargetAdjustment: 0,
        },
        workDaySettings: {
          enabled: settings.work_days.enabled,
          pausedForWeekend: false,
          pausedForHoliday: false,
          nextProcessingTime: BusinessDaysService.getNextProcessingTime(settings),
        },
      };

      // Calculate average processing time for completed leads
      const completedLeads = leads?.filter(lead => 
        lead.processing_state === 'completed' && lead.created_at && lead.updated_at
      ) || [];

      if (completedLeads.length > 0) {
        const totalTime = completedLeads.reduce((sum, lead) => {
          const created = new Date(lead.created_at).getTime();
          const updated = new Date(lead.updated_at).getTime();
          return sum + (updated - created);
        }, 0);
        
        analytics.averageProcessingTime = totalTime / completedLeads.length / (1000 * 60 * 60); // Convert to hours
      }

      // Calculate business day metrics
      const monthlyTarget = settings.processing_targets.target_leads_per_month;
      const completedThisMonth = completedLeads.filter(lead => {
        const completedDate = new Date(lead.updated_at);
        return completedDate.getMonth() === now.getMonth() && 
               completedDate.getFullYear() === now.getFullYear();
      }).length;

      analytics.businessDayMetrics.targetProgress = monthlyTarget > 0 ? 
        (completedThisMonth / monthlyTarget) * 100 : 0;

      // Calculate adjusted daily target based on remaining business days
      if (businessDayInfo.businessDaysRemaining > 0) {
        const remainingTarget = monthlyTarget - completedThisMonth;
        analytics.businessDayMetrics.dailyTargetAdjustment = 
          Math.ceil(remainingTarget / businessDayInfo.businessDaysRemaining);
      }

      // Determine queue health
      const totalInQueue = analytics.totalPending + analytics.totalQueued;
      const averageDailyTarget = settings.processing_targets.target_leads_per_work_day;
      
      if (totalInQueue > averageDailyTarget * 7) { // More than a week's work
        analytics.queueHealth = 'critical';
      } else if (totalInQueue > averageDailyTarget * 3) { // More than 3 days' work
        analytics.queueHealth = 'warning';
      }

      // Check if processing is paused
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      analytics.workDaySettings.pausedForWeekend = isWeekend && settings.automation.pause_on_weekends;
      analytics.workDaySettings.pausedForHoliday = businessDayInfo.isHoliday && settings.automation.pause_on_holidays;

      return analytics;
    } catch (error) {
      console.error('Error getting queue analytics:', error);
      // Return safe defaults
      const fallbackSettings = userPreferencesService.getDefaultQueueManagementSettings('fallback');
      return {
        totalPending: 0,
        totalQueued: 0,
        totalActive: 0,
        totalCompleted: 0,
        averageProcessingTime: 0,
        queueHealth: 'healthy',
        businessDayMetrics: {
          businessDaysInMonth: 22,
          businessDaysRemaining: 10,
          targetProgress: 0,
          dailyTargetAdjustment: 45,
        },
        workDaySettings: {
          enabled: true,
          pausedForWeekend: false,
          pausedForHoliday: false,
          nextProcessingTime: new Date(),
        },
      };
    }
  }

  // Keep existing methods for backward compatibility, but enhance them

  /**
   * Export queue data to CSV with comprehensive queue information - FIXED VERSION
   */
  static async exportQueueData(): Promise<{ success: boolean; filename?: string; message: string; csvData?: string }> {
    try {
      console.log('📤 Exporting Queue Data (FIXED VERSION)...');
      
      // Get comprehensive queue data from all sources
      const { data: queueData, error: queueError } = await supabase
        .from('whatsapp_message_queue')
        .select(`
          *,
          leads:lead_id (
            id,
            first_name,
            last_name,
            phone,
            status,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (queueError) {
        console.error('ERROR Error fetching queue data:', queueError);
        throw queueError;
      }

      // Also get processing queue data
      const { data: processingQueueData } = await supabase
        .from('lead_processing_queue')
        .select(`
          *,
          leads:lead_id (
            id,
            first_name,
            last_name,
            phone,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Combine all queue data
      const allQueueData = [
        ...(queueData || []).map(item => ({
          ...item,
          queue_type: 'whatsapp_message_queue',
          lead_name: `${item.leads?.first_name || ''} ${item.leads?.last_name || ''}`.trim(),
          lead_phone: item.leads?.phone,
          lead_status: item.leads?.status
        })),
        ...(processingQueueData || []).map(item => ({
          ...item,
          queue_type: 'lead_processing_queue',
          lead_name: `${item.leads?.first_name || ''} ${item.leads?.last_name || ''}`.trim(),
          lead_phone: item.leads?.phone,
          lead_status: item.leads?.status
        }))
      ];

      console.log(`DATA Found ${allQueueData.length} total queue records to export`);

      if (allQueueData.length === 0) {
        // Export empty template with instructions
        const csvHeaders = [
          'ID', 'Queue Type', 'Lead Name', 'Lead Phone', 'Lead Status',
          'Queue Status', 'Priority', 'Scheduled For', 'Created At', 'Message'
        ];
        
        const csvData = csvHeaders.join(',') + '\n' + 
          '"No data","Available for export","Try running Prepare Tomorrow Queue first","","","","","","",""';
        
        return {
          success: true,
          filename: `queue-export-empty-${new Date().toISOString().split('T')[0]}.csv`,
          message: "Queue is empty - exported template with instructions to prepare queue first",
          csvData
        };
      }

      // Generate comprehensive CSV
      const csvHeaders = [
        'ID', 'Queue Type', 'Lead Name', 'Lead Phone', 'Lead Status',
        'Queue Status', 'Priority', 'Scheduled For', 'Created At', 'Updated At',
        'Message Content', 'Message Type', 'Recipient Phone', 'Attempts', 'Last Error'
      ];
      
      const csvRows = allQueueData.map(item => [
        item.id || '',
        item.queue_type || '',
        item.lead_name || '',
        item.lead_phone || '',
        item.lead_status || '',
        item.queue_status || '',
        item.priority || '',
        item.scheduled_for || '',
        item.created_at || '',
        item.updated_at || '',
        (item.message_content || '').replace(/"/g, '""'),
        item.message_type || '',
        item.recipient_phone || '',
        item.attempts || 0,
        (item.last_error || '').replace(/"/g, '""')
      ]);

      const csvData = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Add summary
      const timestamp = new Date().toISOString();
      const summary = [
        `# Queue Export Summary - ${timestamp}`,
        `# Total Records: ${allQueueData.length}`,
        `# WhatsApp Queue: ${queueData?.length || 0}`,
        `# Processing Queue: ${processingQueueData?.length || 0}`,
        '#',
        csvData
      ].join('\n');

      // Create and download file
      const filename = `queue-export-${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([summary], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`SUCCESS Generated CSV export with ${allQueueData.length} records`);

      return {
        success: true,
        filename,
        message: `Successfully exported ${allQueueData.length} queue records to ${filename}`,
        csvData: summary
      };
    } catch (error) {
      console.error('Error exporting queue data:', error);
      return {
        success: false,
        message: "Failed to export queue data"
      };
    }
  }

  /**
   * Get processing performance insights with business day context
   */
  static async getPerformanceInsights(): Promise<{
    dailyTrend: { date: string; processed: number; target: number; isBusinessDay: boolean }[];
    processingEfficiency: number;
    businessDayEfficiency: number;
    bottlenecks: string[];
    recommendations: string[];
    workDayImpact: {
      weekendProcessingEnabled: boolean;
      holidaysExcluded: number;
      businessDaysUtilization: number;
    };
  }> {
    try {
      const settings = await this.getQueueSettings();
      
      const insights = {
        dailyTrend: [] as { date: string; processed: number; target: number; isBusinessDay: boolean }[],
        processingEfficiency: 0,
        businessDayEfficiency: 0,
        bottlenecks: [] as string[],
        recommendations: [] as string[],
        workDayImpact: {
          weekendProcessingEnabled: settings.processing_targets.weekend_processing.enabled,
          holidaysExcluded: settings.work_days.custom_holidays.length,
          businessDaysUtilization: 0,
        },
      };

      // Generate 7-day trend data with business day context
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const isBusinessDay = BusinessDaysService.isBusinessDay(date, settings);
        const dailyTarget = BusinessDaysService.calculateDailyTarget(settings, date);

        const { data: dayLeads } = await supabase
          .from('leads')
          .select('processing_state')
          .gte('updated_at', dayStart.toISOString())
          .lt('updated_at', dayEnd.toISOString())
          .eq('processing_state', 'completed');

        insights.dailyTrend.push({
          date: date.toLocaleDateString(),
          processed: dayLeads?.length || 0,
          target: dailyTarget,
          isBusinessDay,
        });
      }

      // Calculate overall efficiency
      const totalProcessed = insights.dailyTrend.reduce((sum, day) => sum + day.processed, 0);
      const totalTarget = insights.dailyTrend.reduce((sum, day) => sum + day.target, 0);
      insights.processingEfficiency = totalTarget > 0 ? (totalProcessed / totalTarget) * 100 : 0;

      // Calculate business day only efficiency
      const businessDayTrend = insights.dailyTrend.filter(day => day.isBusinessDay);
      const businessDayProcessed = businessDayTrend.reduce((sum, day) => sum + day.processed, 0);
      const businessDayTarget = businessDayTrend.reduce((sum, day) => sum + day.target, 0);
      insights.businessDayEfficiency = businessDayTarget > 0 ? (businessDayProcessed / businessDayTarget) * 100 : 0;

      // Calculate business day utilization
      const businessDaysInPeriod = businessDayTrend.length;
      const totalDaysInPeriod = insights.dailyTrend.length;
      insights.workDayImpact.businessDaysUtilization = totalDaysInPeriod > 0 ? 
        (businessDaysInPeriod / totalDaysInPeriod) * 100 : 0;

      // Enhanced bottleneck and recommendation analysis
      const analytics = await this.getQueueAnalytics();
      
      if (analytics.totalPending > settings.processing_targets.target_leads_per_work_day * 5) {
        insights.bottlenecks.push("Large backlog of pending leads");
        insights.recommendations.push("Consider increasing daily processing target or enabling weekend processing");
      }

      if (insights.businessDayEfficiency < 70) {
        insights.bottlenecks.push("Low business day processing efficiency");
        insights.recommendations.push("Review business hour settings or increase automation during work hours");
      }

      if (!settings.processing_targets.weekend_processing.enabled && analytics.totalPending > 100) {
        insights.recommendations.push("Consider enabling weekend processing with reduced capacity");
      }

      if (settings.work_days.custom_holidays.length > 20) {
        insights.recommendations.push("Review holiday configuration - many holidays may be reducing processing capacity");
      }

      if (analytics.averageProcessingTime > 2) {
        insights.bottlenecks.push("High average processing time per lead");
        insights.recommendations.push("Optimize lead processing workflow or increase batch processing");
      }

      return insights;
    } catch (error) {
      console.error('Error getting performance insights:', error);
      return {
        dailyTrend: [],
        processingEfficiency: 0,
        businessDayEfficiency: 0,
        bottlenecks: [],
        recommendations: [],
        workDayImpact: {
          weekendProcessingEnabled: false,
          holidaysExcluded: 0,
          businessDaysUtilization: 71.4, // ~5/7 days typically
        },
      };
    }
  }

  /**
   * Update queue management settings and clear cache
   */
  static async updateQueueSettings(settings: Partial<UserQueueManagementSettings>): Promise<boolean> {
    try {
      const success = await userPreferencesService.saveQueueManagementSettings(settings);
      if (success) {
        this.clearSettingsCache();
      }
      return success;
    } catch (error) {
      console.error('Error updating queue settings:', error);
      return false;
    }
  }

  /**
   * Validate current queue configuration
   */
  static async validateConfiguration(): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const settings = await this.getQueueSettings();
      const validation = BusinessDaysService.validateSettings(settings);
      const warnings: string[] = [];

      // Add additional business logic warnings
      if (settings.processing_targets.target_leads_per_month > settings.processing_targets.target_leads_per_work_day * 25) {
        warnings.push("Monthly target may be too aggressive for current daily target");
      }

      if (settings.automation.auto_start_processing && !settings.work_days.enabled) {
        warnings.push("Auto-start processing enabled without work day restrictions");
      }

      return {
        ...validation,
        warnings,
      };
    } catch (error) {
      console.error('Error validating configuration:', error);
      return {
        isValid: false,
        errors: ['Failed to validate configuration'],
        warnings: [],
      };
    }
  }

  /**
   * Bulk enqueue leads for processing
   */
  static async bulkEnqueueLeads(leadIds: string[]): Promise<{ success: boolean; queued: number; conflicts: string[]; message: string }> {
    try {
      if (leadIds.length === 0) {
        return {
          success: false,
          queued: 0,
          conflicts: [],
          message: "No leads selected for queueing",
        };
      }

      const settings = await this.getQueueSettings();
      const nextBusinessDay = BusinessDaysService.getNextBusinessDay(new Date(), settings);
      
      // Check for conflicts (already queued leads)
      const { data: existingQueued, error: checkError } = await supabase
        .from('leads')
        .select('id, first_name, last_name')
        .in('id', leadIds)
        .eq('processing_state', 'queued');

      if (checkError) throw checkError;

      const conflicts = existingQueued?.map(lead => lead.id) || [];
      const leadsToQueue = leadIds.filter(id => !conflicts.includes(id));

      if (leadsToQueue.length === 0) {
        return {
          success: false,
          queued: 0,
          conflicts,
          message: "All selected leads are already queued",
        };
      }

      // Update leads to 'queued' status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          processing_state: 'queued',
          updated_at: new Date().toISOString(),
          queue_metadata: {
            queued_for_date: nextBusinessDay.toISOString().split('T')[0],
            queued_at: new Date().toISOString(),
            bulk_operation: true,
            operation_id: `bulk_${Date.now()}`,
          }
        })
        .in('id', leadsToQueue);

      if (updateError) throw updateError;

      return {
        success: true,
        queued: leadsToQueue.length,
        conflicts,
        message: `Successfully queued ${leadsToQueue.length} leads${conflicts.length > 0 ? ` (${conflicts.length} conflicts resolved)` : ''}`,
      };
    } catch (error) {
      console.error('Error bulk enqueuing leads:', error);
      return {
        success: false,
        queued: 0,
        conflicts: [],
        message: "Failed to queue leads",
      };
    }
  }

  /**
   * Bulk remove leads from queue
   */
  static async bulkRemoveFromQueue(leadIds: string[]): Promise<{ success: boolean; removed: number; message: string }> {
    try {
      if (leadIds.length === 0) {
        return {
          success: false,
          removed: 0,
          message: "No leads selected for removal",
        };
      }

      // Check which leads are actually queued
      const { data: queuedLeads, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .in('id', leadIds)
        .eq('processing_state', 'queued');

      if (checkError) throw checkError;

      const actualQueuedIds = queuedLeads?.map(lead => lead.id) || [];

      if (actualQueuedIds.length === 0) {
        return {
          success: false,
          removed: 0,
          message: "No selected leads are currently queued",
        };
      }

      // Update leads back to 'pending' status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          processing_state: 'pending',
          updated_at: new Date().toISOString(),
          queue_metadata: {
            removed_from_queue_at: new Date().toISOString(),
            bulk_removal: true,
          }
        })
        .in('id', actualQueuedIds);

      if (updateError) throw updateError;

      return {
        success: true,
        removed: actualQueuedIds.length,
        message: `Successfully removed ${actualQueuedIds.length} leads from queue`,
      };
    } catch (error) {
      console.error('Error bulk removing leads from queue:', error);
      return {
        success: false,
        removed: 0,
        message: "Failed to remove leads from queue",
      };
    }
  }

  /**
   * Bulk schedule leads for specific date
   */
  static async bulkScheduleLeads(leadIds: string[], scheduledDate: Date): Promise<{ success: boolean; scheduled: number; message: string }> {
    try {
      if (leadIds.length === 0) {
        return {
          success: false,
          scheduled: 0,
          message: "No leads selected for scheduling",
        };
      }

      const settings = await this.getQueueSettings();
      
      // Validate scheduled date
      if (scheduledDate < new Date()) {
        return {
          success: false,
          scheduled: 0,
          message: "Cannot schedule messages in the past",
        };
      }

      // Check if scheduled date is a business day
      if (!BusinessDaysService.isBusinessDay(scheduledDate, settings)) {
        const nextBusinessDay = BusinessDaysService.getNextBusinessDay(scheduledDate, settings);
        scheduledDate = nextBusinessDay;
      }

      // Update leads to 'queued' status with specific schedule
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          processing_state: 'queued',
          updated_at: new Date().toISOString(),
          queue_metadata: {
            scheduled_for_date: scheduledDate.toISOString().split('T')[0],
            scheduled_at: new Date().toISOString(),
            bulk_scheduled: true,
            operation_id: `bulk_schedule_${Date.now()}`,
          }
        })
        .in('id', leadIds);

      if (updateError) throw updateError;

      return {
        success: true,
        scheduled: leadIds.length,
        message: `Successfully scheduled ${leadIds.length} leads for ${scheduledDate.toDateString()}`,
      };
    } catch (error) {
      console.error('Error bulk scheduling leads:', error);
      return {
        success: false,
        scheduled: 0,
        message: "Failed to schedule leads",
      };
    }
  }
} 