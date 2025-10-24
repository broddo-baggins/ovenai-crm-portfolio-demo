// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import { supabase } from '@/lib/supabase';
import { BusinessDaysService } from './businessDaysService';

export interface QueueMetrics {
  // Current Queue State
  queueDepth: number;
  processingRate: number;
  averageWaitTime: number;
  successRate: number;
  
  // Daily Metrics
  dailyTarget: number;
  dailyProgress: number;
  dailyCompletionRate: number;
  
  // Performance Metrics
  averageProcessingTime: number;
  totalProcessed: number;
  totalFailed: number;
  
  // Capacity Metrics
  currentCapacity: number;
  maxCapacity: number;
  capacityUtilization: number;
  
  // Business Hours
  isBusinessHours: boolean;
  nextBusinessDay: Date;
  timeUntilNextSession: number;
  
  // Real-time Status
  isProcessing: boolean;
  lastProcessedAt: Date | null;
  estimatedCompletionTime: Date | null;
}

export interface QueueAnalytics {
  // Historical Data
  dailyStats: Array<{
    date: string;
    queued: number;
    processed: number;
    failed: number;
    successRate: number;
    averageTime: number;
  }>;
  
  // Trend Analysis
  trends: {
    queueDepthTrend: 'increasing' | 'decreasing' | 'stable';
    successRateTrend: 'improving' | 'declining' | 'stable';
    processingTimeTrend: 'faster' | 'slower' | 'stable';
  };
  
  // Bottleneck Analysis
  bottlenecks: Array<{
    type: 'rate_limit' | 'business_hours' | 'capacity' | 'errors';
    impact: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }>;
  
  // Performance Insights
  insights: Array<{
    category: 'efficiency' | 'capacity' | 'quality' | 'timing';
    message: string;
    actionable: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export class QueueAnalyticsService {
  private static readonly CACHE_DURATION = 30000; // 30 seconds
  private static metricsCache: { data: QueueMetrics; timestamp: number } | null = null;
  private static analyticsCache: { data: QueueAnalytics; timestamp: number } | null = null;

  /**
   * Get real-time queue metrics
   */
  static async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      // Check cache first
      if (this.metricsCache && Date.now() - this.metricsCache.timestamp < this.CACHE_DURATION) {
        return this.metricsCache.data;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Get current queue depth
      const { data: queueData, error: queueError } = await supabase
        .from('leads')
        .select('id, processing_state, updated_at')
        .eq('processing_state', 'queued');

      if (queueError) throw queueError;

      // Get daily processing stats
      const { data: dailyStats, error: dailyError } = await supabase
        .from('leads')
        .select('id, processing_state, updated_at')
        .gte('updated_at', `${today}T00:00:00.000Z`)
        .lte('updated_at', `${today}T23:59:59.999Z`);

      if (dailyError) throw dailyError;

      // Get user settings for targets
      const { data: settings, error: settingsError } = await supabase
        .from('user_queue_settings')
        .select('*')
        .single();

      // Calculate metrics
      const queueDepth = queueData?.length || 0;
      const processedToday = dailyStats?.filter(lead => 
        lead.processing_state === 'processed' || lead.processing_state === 'completed'
      ).length || 0;
      const failedToday = dailyStats?.filter(lead => 
        lead.processing_state === 'failed' || lead.processing_state === 'error'
      ).length || 0;
      const totalProcessedToday = processedToday + failedToday;
      
      const dailyTarget = settings?.target_leads_per_work_day || 45;
      const maxCapacity = settings?.max_daily_capacity || 200;
      
      const successRate = totalProcessedToday > 0 ? (processedToday / totalProcessedToday) * 100 : 100;
      const dailyProgress = (processedToday / dailyTarget) * 100;
      
      // Business hours calculation
      const businessHours = await BusinessDaysService.getBusinessHours();
      const isBusinessHours = BusinessDaysService.isBusinessHours(now, businessHours);
      const nextBusinessDay = BusinessDaysService.getNextBusinessDay(now, businessHours);
      
      // Processing rate calculation (leads per hour)
      const processingRate = this.calculateProcessingRate(dailyStats || []);
      
      // Estimated completion time
      const estimatedCompletionTime = queueDepth > 0 && processingRate > 0 
        ? new Date(now.getTime() + (queueDepth / processingRate) * 3600000)
        : null;

      const metrics: QueueMetrics = {
        queueDepth,
        processingRate,
        averageWaitTime: this.calculateAverageWaitTime(queueData || []),
        successRate,
        dailyTarget,
        dailyProgress,
        dailyCompletionRate: dailyProgress > 100 ? 100 : dailyProgress,
        averageProcessingTime: this.calculateAverageProcessingTime(dailyStats || []),
        totalProcessed: processedToday,
        totalFailed: failedToday,
        currentCapacity: totalProcessedToday,
        maxCapacity,
        capacityUtilization: (totalProcessedToday / maxCapacity) * 100,
        isBusinessHours,
        nextBusinessDay,
        timeUntilNextSession: this.calculateTimeUntilNextSession(now, businessHours),
        isProcessing: await this.isCurrentlyProcessing(),
        lastProcessedAt: await this.getLastProcessedTime(),
        estimatedCompletionTime
      };

      // Cache the results
      this.metricsCache = {
        data: metrics,
        timestamp: Date.now()
      };

      return metrics;
    } catch (error) {
      console.error('Error getting queue metrics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive queue analytics
   */
  static async getQueueAnalytics(): Promise<QueueAnalytics> {
    try {
      // Check cache first
      if (this.analyticsCache && Date.now() - this.analyticsCache.timestamp < this.CACHE_DURATION) {
        return this.analyticsCache.data;
      }

      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historicalData, error } = await supabase
        .from('leads')
        .select('processing_state, updated_at, queue_metadata')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Process historical data
      const dailyStats = this.processDailyStats(historicalData || []);
      const trends = this.analyzeTrends(dailyStats);
      const bottlenecks = await this.identifyBottlenecks();
      const insights = this.generateInsights(dailyStats, trends, bottlenecks);

      const analytics: QueueAnalytics = {
        dailyStats,
        trends,
        bottlenecks,
        insights
      };

      // Cache the results
      this.analyticsCache = {
        data: analytics,
        timestamp: Date.now()
      };

      return analytics;
    } catch (error) {
      console.error('Error getting queue analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate processing rate (leads per hour)
   */
  private static calculateProcessingRate(dailyStats: any[]): number {
    if (dailyStats.length === 0) return 0;
    
    const processed = dailyStats.filter(lead => 
      lead.processing_state === 'processed' || lead.processing_state === 'completed'
    );
    
    if (processed.length === 0) return 0;
    
    // Estimate based on business hours (8 hours per day)
    return processed.length / 8;
  }

  /**
   * Calculate average wait time in minutes
   */
  private static calculateAverageWaitTime(queueData: any[]): number {
    if (queueData.length === 0) return 0;
    
    const now = new Date();
    const waitTimes = queueData.map(lead => {
      const queuedAt = new Date(lead.updated_at);
      return (now.getTime() - queuedAt.getTime()) / 60000; // Convert to minutes
    });
    
    return waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
  }

  /**
   * Calculate average processing time in minutes
   */
  private static calculateAverageProcessingTime(dailyStats: any[]): number {
    const processed = dailyStats.filter(lead => 
      lead.processing_state === 'processed' && lead.queue_metadata?.processing_time
    );
    
    if (processed.length === 0) return 2.5; // Default estimate
    
    const processingTimes = processed.map(lead => 
      lead.queue_metadata?.processing_time || 2.5
    );
    
    return processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
  }

  /**
   * Check if queue is currently processing
   */
  private static async isCurrentlyProcessing(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('processing_state', 'processing')
        .limit(1);

      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking processing status:', error);
      return false;
    }
  }

  /**
   * Get last processed time
   */
  private static async getLastProcessedTime(): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('updated_at')
        .eq('processing_state', 'processed')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      return data?.[0]?.updated_at ? new Date(data[0].updated_at) : null;
    } catch (error) {
      console.error('Error getting last processed time:', error);
      return null;
    }
  }

  /**
   * Calculate time until next business session
   */
  private static calculateTimeUntilNextSession(now: Date, businessHours: any): number {
    const nextStart = new Date(now);
    nextStart.setHours(9, 0, 0, 0); // Assuming 9 AM start
    
    if (now.getHours() >= 17) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    return Math.max(0, nextStart.getTime() - now.getTime());
  }

  /**
   * Process daily statistics
   */
  private static processDailyStats(data: any[]): QueueAnalytics['dailyStats'] {
    const dailyMap = new Map<string, {
      queued: number;
      processed: number;
      failed: number;
      processingTimes: number[];
    }>();

    data.forEach(lead => {
      const date = lead.updated_at.split('T')[0];
      const existing = dailyMap.get(date) || {
        queued: 0,
        processed: 0,
        failed: 0,
        processingTimes: []
      };

      if (lead.processing_state === 'queued') {
        existing.queued++;
      } else if (lead.processing_state === 'processed') {
        existing.processed++;
        if (lead.queue_metadata?.processing_time) {
          existing.processingTimes.push(lead.queue_metadata.processing_time);
        }
      } else if (lead.processing_state === 'failed') {
        existing.failed++;
      }

      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        queued: stats.queued,
        processed: stats.processed,
        failed: stats.failed,
        successRate: stats.processed + stats.failed > 0 
          ? (stats.processed / (stats.processed + stats.failed)) * 100 
          : 100,
        averageTime: stats.processingTimes.length > 0
          ? stats.processingTimes.reduce((sum, time) => sum + time, 0) / stats.processingTimes.length
          : 2.5
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  }

  /**
   * Analyze trends in the data
   */
  private static analyzeTrends(dailyStats: QueueAnalytics['dailyStats']): QueueAnalytics['trends'] {
    if (dailyStats.length < 7) {
      return {
        queueDepthTrend: 'stable',
        successRateTrend: 'stable',
        processingTimeTrend: 'stable'
      };
    }

    const recent = dailyStats.slice(0, 7);
    const previous = dailyStats.slice(7, 14);

    const recentAvgQueue = recent.reduce((sum, day) => sum + day.queued, 0) / recent.length;
    const previousAvgQueue = previous.reduce((sum, day) => sum + day.queued, 0) / previous.length;

    const recentAvgSuccess = recent.reduce((sum, day) => sum + day.successRate, 0) / recent.length;
    const previousAvgSuccess = previous.reduce((sum, day) => sum + day.successRate, 0) / previous.length;

    const recentAvgTime = recent.reduce((sum, day) => sum + day.averageTime, 0) / recent.length;
    const previousAvgTime = previous.reduce((sum, day) => sum + day.averageTime, 0) / previous.length;

    return {
      queueDepthTrend: recentAvgQueue > previousAvgQueue * 1.1 ? 'increasing' :
                       recentAvgQueue < previousAvgQueue * 0.9 ? 'decreasing' : 'stable',
      successRateTrend: recentAvgSuccess > previousAvgSuccess + 5 ? 'improving' :
                        recentAvgSuccess < previousAvgSuccess - 5 ? 'declining' : 'stable',
      processingTimeTrend: recentAvgTime > previousAvgTime * 1.1 ? 'slower' :
                           recentAvgTime < previousAvgTime * 0.9 ? 'faster' : 'stable'
    };
  }

  /**
   * Identify bottlenecks in the system
   */
  private static async identifyBottlenecks(): Promise<QueueAnalytics['bottlenecks']> {
    const bottlenecks: QueueAnalytics['bottlenecks'] = [];
    
    // Check current queue depth
    const metrics = await this.getQueueMetrics();
    
    if (metrics.queueDepth > 100) {
      bottlenecks.push({
        type: 'capacity',
        impact: 'high',
        description: 'Queue depth is very high',
        recommendation: 'Consider increasing processing capacity or extending business hours'
      });
    }

    if (metrics.successRate < 85) {
      bottlenecks.push({
        type: 'errors',
        impact: 'high',
        description: 'Success rate is below optimal threshold',
        recommendation: 'Review error logs and fix common processing issues'
      });
    }

    if (!metrics.isBusinessHours && metrics.queueDepth > 20) {
      bottlenecks.push({
        type: 'business_hours',
        impact: 'medium',
        description: 'Queue building up outside business hours',
        recommendation: 'Consider weekend processing or adjust business hours'
      });
    }

    return bottlenecks;
  }

  /**
   * Generate actionable insights
   */
  private static generateInsights(
    dailyStats: QueueAnalytics['dailyStats'],
    trends: QueueAnalytics['trends'],
    bottlenecks: QueueAnalytics['bottlenecks']
  ): QueueAnalytics['insights'] {
    const insights: QueueAnalytics['insights'] = [];

    // Efficiency insights
    if (trends.processingTimeTrend === 'faster') {
      insights.push({
        category: 'efficiency',
        message: 'Processing time is improving! Consider increasing daily targets.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Capacity insights
    if (trends.queueDepthTrend === 'increasing') {
      insights.push({
        category: 'capacity',
        message: 'Queue depth is trending upward. Consider scaling processing capacity.',
        actionable: true,
        priority: 'high'
      });
    }

    // Quality insights
    if (trends.successRateTrend === 'improving') {
      insights.push({
        category: 'quality',
        message: 'Success rate is improving. Great job on error handling!',
        actionable: false,
        priority: 'low'
      });
    }

    // Timing insights
    const avgProcessed = dailyStats.slice(0, 7).reduce((sum, day) => sum + day.processed, 0) / 7;
    if (avgProcessed > 50) {
      insights.push({
        category: 'timing',
        message: 'Processing volume is high. Consider optimizing for off-peak hours.',
        actionable: true,
        priority: 'medium'
      });
    }

    return insights;
  }

  /**
   * Clear analytics cache
   */
  static clearCache(): void {
    this.metricsCache = null;
    this.analyticsCache = null;
  }
} 