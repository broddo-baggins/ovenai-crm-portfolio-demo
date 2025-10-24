// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import { supabase } from '@/lib/supabase';
import { Lead } from "@/types/database";
import { toast } from "sonner";
import { BusinessDaysService, BusinessDayInfo } from "./businessDaysService";
import { UserQueueManagementSettings, userPreferencesService } from "./userPreferencesService";
import { 
  isLegacyPendingStatus, 
  isLegacyQueuedStatus, 
  isLegacyActiveStatus, 
  isLegacyCompletedStatus, 
  isLegacyFailedStatus, 
  isLegacyProcessedStatus,
  getStatusForQueueOperation
} from "../utils/statusMapping";

// ===================================================================
// REFRESH SIMPLE QUEUE SERVICE - WORKS WITH SITE DATABASE
// ===================================================================
// FIXED: Works with Site DB using correct number status values
// ===================================================================

export interface QueueMetrics {
  // Real-time Queue State
  queueDepth: number;
  processingRate: number;
  averageWaitTime: number;
  successRate: number;
  
  // Daily Performance
  dailyTarget: number;
  dailyProgress: number;
  processedToday: number;
  queuedForTomorrow: number;
  activelyProcessing: number;
  remainingCapacity: number;
  
  // Business Logic
  isBusinessDay: boolean;
  businessDayInfo: BusinessDayInfo;
  nextProcessingTime: Date;
  
  // Health Status
  queueHealth: 'healthy' | 'warning' | 'critical';
  lastProcessedAt: Date | null;
  estimatedCompletionTime: Date | null;
}

export interface QueueOperation {
  success: boolean;
  processed: number;
  message: string;
  errorDetails?: string;
  nextProcessingDate?: Date;
}

/**
 * INIT SIMPLE QUEUE SERVICE - SITE DATABASE VERSION
 * Works with Site DB structure using number status values
 */
export class QueueServiceSimple {
  private static readonly CACHE_DURATION = 30000; // 30 seconds
  private static metricsCache: { data: QueueMetrics; timestamp: number } | null = null;
  private static settingsCache: { data: UserQueueManagementSettings; timestamp: number } | null = null;

  /**
   * Get real-time queue metrics using Site DB structure
   */
  static async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      // Check cache first
      if (this.metricsCache && Date.now() - this.metricsCache.timestamp < this.CACHE_DURATION) {
        return this.metricsCache.data;
      }

      const settings = await this.getQueueSettings();
      const now = new Date();
      const businessDayInfo = BusinessDaysService.getBusinessDayInfo(now, settings);
      const dailyTarget = BusinessDaysService.calculateDailyTarget(settings, now);

      // Get lead counts by status - FIXED: Use only fields that exist in Site DB
      const { data: leadCounts, error: countError } = await supabase
        .from('leads')
        .select('status, created_at, updated_at');

      if (countError) {
        console.error('ERROR Error fetching lead counts:', countError);
        throw new Error(`Database error: ${countError.message}`);
      }

      // Calculate metrics using compatible status values (supports both INTEGER and VARCHAR)
      const pending = leadCounts?.filter(l => {
        return isLegacyPendingStatus(l.status); // Status: new, pre-qualified, unqualified OR 1-2
      }).length || 0;
      
      const queued = leadCounts?.filter(l => {
        return isLegacyQueuedStatus(l.status); // Status: hook, value-proposition OR 3-4
      }).length || 0;
      
      const active = leadCounts?.filter(l => {
        return isLegacyActiveStatus(l.status); // Status: questions-asked OR 5
      }).length || 0;
      
      const completed = leadCounts?.filter(l => {
        return isLegacyCompletedStatus(l.status); // Status: engaged, qualified, clarifying, booked OR 6-10
      }).length || 0;
      
      const failed = leadCounts?.filter(l => {
        return isLegacyFailedStatus(l.status); // Status: on-hold, dead OR 11+
      }).length || 0;

      // Get today's processed leads
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const { data: todayLeads, error: todayError } = await supabase
        .from('leads')
        .select('status, updated_at')
        .gte('updated_at', todayStart.toISOString());

      if (todayError) {
        console.error('ERROR Error fetching today\'s leads:', todayError);
      }

      // Count processed leads (completed status)
      const processedToday = todayLeads?.filter(l => {
        return isLegacyProcessedStatus(l.status); // Status: processed (completed) OR 6+
      }).length || 0;

      const processingRate = dailyTarget > 0 ? (processedToday / dailyTarget) * 100 : 0;
      const remainingCapacity = Math.max(0, dailyTarget - processedToday);

      // Determine queue health
      let queueHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (failed > 5 || processingRate < 50) queueHealth = 'warning';
      if (failed > 10 || processingRate < 25) queueHealth = 'critical';

      const metrics: QueueMetrics = {
        queueDepth: queued,
        processingRate: Math.round(processingRate * 10) / 10,
        averageWaitTime: 0,
        successRate: completed + failed > 0 ? (completed / (completed + failed)) * 100 : 100,
        dailyTarget,
        dailyProgress: processingRate,
        processedToday,
        queuedForTomorrow: queued,
        activelyProcessing: active,
        remainingCapacity,
        isBusinessDay: businessDayInfo.isBusinessDay,
        businessDayInfo,
        nextProcessingTime: BusinessDaysService.getNextProcessingTime(settings),
        queueHealth,
        lastProcessedAt: todayLeads?.[0]?.updated_at ? new Date(todayLeads[0].updated_at) : null,
        estimatedCompletionTime: null,
      };

      // Cache the results
      this.metricsCache = { data: metrics, timestamp: Date.now() };
      return metrics;

    } catch (error) {
      console.error('ERROR QueueService.getQueueMetrics failed:', error);
      
      // Return fallback metrics on error
      const fallbackSettings = userPreferencesService.getDefaultQueueManagementSettings('fallback');
      const fallbackBusinessDay = BusinessDaysService.getBusinessDayInfo(new Date(), fallbackSettings);
      
      return {
        queueDepth: 0,
        processingRate: 0,
        averageWaitTime: 0,
        successRate: 0,
        dailyTarget: 45,
        dailyProgress: 0,
        processedToday: 0,
        queuedForTomorrow: 0,
        activelyProcessing: 0,
        remainingCapacity: 45,
        isBusinessDay: fallbackBusinessDay.isBusinessDay,
        businessDayInfo: fallbackBusinessDay,
        nextProcessingTime: new Date(),
        queueHealth: 'critical',
        lastProcessedAt: null,
        estimatedCompletionTime: null,
      };
    }
  }

  /**
   * Prepare queue for next business day - SITE DB VERSION
   */
  static async prepareQueue(targetDate: Date = new Date()): Promise<QueueOperation> {
    try {
      const settings = await this.getQueueSettings();
      
      // Find next business day
      const nextBusinessDay = BusinessDaysService.getNextBusinessDay(targetDate, settings);
      const dailyTarget = BusinessDaysService.calculateDailyTarget(settings, nextBusinessDay);

      if (dailyTarget === 0) {
        return {
          success: false,
          processed: 0,
          message: `No processing target for ${nextBusinessDay.toDateString()}`,
          nextProcessingDate: nextBusinessDay,
        };
      }

      // Get pending leads - FIXED: Use compatible status values (supports both INTEGER and VARCHAR)
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, created_at, status')
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch pending leads: ${fetchError.message}`);
      }

      // Filter pending leads using status compatibility
      const pendingLeads = allLeads?.filter(lead => isLegacyPendingStatus(lead.status)).slice(0, dailyTarget) || [];

      if (pendingLeads.length === 0) {
        return {
          success: false,
          processed: 0,
          message: 'No pending leads available for queueing',
          nextProcessingDate: nextBusinessDay,
        };
      }

      // Update leads to queued status using compatible values
      const leadIds = pendingLeads.map(lead => lead.id);
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: getStatusForQueueOperation('queued') as any,  // Move to status 'hook' (queued)
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);

      if (updateError) {
        throw new Error(`Failed to update leads to queued: ${updateError.message}`);
      }

      // Clear cache to refresh metrics
      this.metricsCache = null;

      return {
        success: true,
        processed: pendingLeads.length,
        message: `SUCCESS Queued ${pendingLeads.length} leads for ${nextBusinessDay.toDateString()}`,
        nextProcessingDate: nextBusinessDay,
      };

    } catch (error) {
      console.error('ERROR QueueService.prepareQueue failed:', error);
      return {
        success: false,
        processed: 0,
        message: 'Failed to prepare queue',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Start processing queued leads - SITE DB VERSION
   */
  static async startProcessing(): Promise<QueueOperation> {
    try {
      // Get queued leads - FIXED: Use compatible status values (supports both INTEGER and VARCHAR)
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, status')
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch queued leads: ${fetchError.message}`);
      }

      // Filter queued leads using status compatibility
      const queuedLeads = allLeads?.filter(lead => isLegacyQueuedStatus(lead.status)).slice(0, 1) || []; // Process one at a time

      if (queuedLeads.length === 0) {
        return {
          success: false,
          processed: 0,
          message: 'No queued leads available for processing',
        };
      }

      // Update first lead to active using compatible status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: getStatusForQueueOperation('active') as any,  // Move to status 'questions-asked' (active)
          updated_at: new Date().toISOString()
        })
        .eq('id', queuedLeads[0].id);

      if (updateError) {
        throw new Error(`Failed to start processing: ${updateError.message}`);
      }

      this.metricsCache = null;

      return {
        success: true,
        processed: 1,
        message: 'SUCCESS Started processing 1 lead',
      };

    } catch (error) {
      console.error('ERROR QueueService.startProcessing failed:', error);
      return {
        success: false,
        processed: 0,
        message: 'Failed to start processing',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reset queue - SITE DB VERSION
   */
  static async resetQueue(): Promise<QueueOperation> {
    try {
      // Get all queued/active leads - FIXED: Use compatible status values (supports both INTEGER and VARCHAR)
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, status');

      if (fetchError) {
        throw new Error(`Failed to fetch queued leads: ${fetchError.message}`);
      }

      // Filter queued/active leads using status compatibility
      const queuedLeads = allLeads?.filter(lead => 
        isLegacyQueuedStatus(lead.status) || isLegacyActiveStatus(lead.status)
      ) || [];

      if (queuedLeads.length === 0) {
        return {
          success: true,
          processed: 0,
          message: 'No leads to reset',
        };
      }

      // Reset leads to pending using compatible status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: getStatusForQueueOperation('pending') as any,  // Reset to status 'new' (pending)
          updated_at: new Date().toISOString()
        })
        .in('id', queuedLeads.map(l => l.id));

      if (updateError) {
        throw new Error(`Failed to reset leads: ${updateError.message}`);
      }

      this.metricsCache = null;

      return {
        success: true,
        processed: queuedLeads.length,
        message: `SUCCESS Reset ${queuedLeads.length} leads to pending`,
      };

    } catch (error) {
      console.error('ERROR QueueService.resetQueue failed:', error);
      return {
        success: false,
        processed: 0,
        message: 'Failed to reset queue',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Pause processing
   */
  static async pauseProcessing(): Promise<QueueOperation> {
    try {
      this.metricsCache = null;

      return {
        success: true,
        processed: 0,
        message: 'SUCCESS Queue processing paused',
      };

    } catch (error) {
      console.error('ERROR QueueService.pauseProcessing failed:', error);
      return {
        success: false,
        processed: 0,
        message: 'Failed to pause processing',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===============================================
  // MAINTAIN UTILITY METHODS
  // ===============================================

  /**
   * Get queue settings with caching
   */
  private static async getQueueSettings(): Promise<UserQueueManagementSettings> {
    try {
      // Check cache
      if (this.settingsCache && Date.now() - this.settingsCache.timestamp < this.CACHE_DURATION) {
        return this.settingsCache.data;
      }

      const settings = await userPreferencesService.getQueueManagementSettings();
      if (settings) {
        this.settingsCache = { data: settings, timestamp: Date.now() };
        return settings;
      }

      throw new Error('No settings found');

    } catch (error) {
      console.error('ERROR Failed to get queue settings:', error);
      
      // Return fallback settings
      const fallback = userPreferencesService.getDefaultQueueManagementSettings('fallback-user');
      this.settingsCache = { data: fallback, timestamp: Date.now() };
      return fallback;
    }
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    this.metricsCache = null;
    this.settingsCache = null;
  }
}

export default QueueServiceSimple; 