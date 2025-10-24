import { supabase } from '@/integrations/supabase/client';

/**
 * Trend calculation interface
 */
export interface TrendData {
  current: number;
  previous: number;
  trend: number;
  direction: 'up' | 'down' | 'stable';
}

/**
 * Date range for calculations
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Consolidated trend calculation utility
 * Eliminates the massive duplication of trend calculation logic across reports
 */
export class TrendCalculator {
  /**
   * Calculate trend percentage between current and previous period
   */
  static calculateTrendPercentage(current: number, previous: number): number {
    // Handle edge cases more accurately
    if (previous === 0 && current === 0) {
      return 0; // No change if both are zero
    }
    
    if (previous === 0) {
      // When starting from zero, show actual increase but cap it reasonably
      return current > 0 ? Math.min(current * 100, 999) : 0;
    }
    
    // Standard percentage change calculation
    const percentChange = ((current - previous) / previous) * 100;
    
    // Cap extreme values to prevent misleading 1000%+ changes
    return Math.max(-99, Math.min(999, percentChange));
  }

  /**
   * Get trend data with direction indicator
   */
  static getTrendData(current: number, previous: number): TrendData {
    const trend = this.calculateTrendPercentage(current, previous);
    
    return {
      current,
      previous,
      trend,
      direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable'
    };
  }

  /**
   * Calculate previous period date range
   */
  static getPreviousPeriodRange(startDate: string, endDate: string): DateRange {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodDiff = end.getTime() - start.getTime();
    
    const previousStart = new Date(start.getTime() - periodDiff);
    const previousEnd = new Date(end.getTime() - periodDiff);
    
    return {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString()
    };
  }

  /**
   * Get count from Supabase table for a date range and project filter
   */
  static async getCountFromTable(
    tableName: string,
    dateField: string,
    dateRange: DateRange,
    projectId?: string,
    additionalFilters?: Record<string, any>
  ): Promise<number> {
    // Use any to bypass TypeScript restrictions on dynamic table names
    let query = (supabase as any)
      .from(tableName)
      .select('id', { count: 'exact' })
      .gte(dateField, dateRange.start)
      .lte(dateField, dateRange.end);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  }

  /**
   * Calculate trend for any metric using table counts
   */
  static async calculateTableTrend(
    tableName: string,
    dateField: string,
    currentRange: DateRange,
    projectId?: string,
    additionalFilters?: Record<string, any>
  ): Promise<TrendData> {
    const previousRange = this.getPreviousPeriodRange(currentRange.start, currentRange.end);
    
    const [currentCount, previousCount] = await Promise.all([
      this.getCountFromTable(tableName, dateField, currentRange, projectId, additionalFilters),
      this.getCountFromTable(tableName, dateField, previousRange, projectId, additionalFilters)
    ]);

    return this.getTrendData(currentCount, previousCount);
  }

  /**
   * Calculate average trend for numeric fields
   */
  static async calculateAverageTrend(
    tableName: string,
    dateField: string,
    valueField: string,
    currentRange: DateRange,
    projectId?: string,
    additionalFilters?: Record<string, any>
  ): Promise<TrendData> {
    const previousRange = this.getPreviousPeriodRange(currentRange.start, currentRange.end);
    
    const [currentData, previousData] = await Promise.all([
      this.getAverageFromTable(tableName, dateField, valueField, currentRange, projectId, additionalFilters),
      this.getAverageFromTable(tableName, dateField, valueField, previousRange, projectId, additionalFilters)
    ]);

    return this.getTrendData(currentData, previousData);
  }

  /**
   * Get average value from Supabase table
   */
  private static async getAverageFromTable(
    tableName: string,
    dateField: string,
    valueField: string,
    dateRange: DateRange,
    projectId?: string,
    additionalFilters?: Record<string, any>
  ): Promise<number> {
    // Use any to bypass TypeScript restrictions on dynamic table names
    let query = (supabase as any)
      .from(tableName)
      .select(valueField)
      .gte(dateField, dateRange.start)
      .lte(dateField, dateRange.end)
      .not(valueField, 'is', null);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const sum = data.reduce((acc: number, row: any) => acc + (row[valueField] || 0), 0);
    return sum / data.length;
  }

  /**
   * Calculate conversion rate trend (completed / total)
   */
  static async calculateConversionTrend(
    tableName: string,
    dateField: string,
    currentRange: DateRange,
    completedStatuses: string[],
    projectId?: string
  ): Promise<TrendData> {
    const previousRange = this.getPreviousPeriodRange(currentRange.start, currentRange.end);
    
    const [currentTotal, previousTotal, currentCompleted, previousCompleted] = await Promise.all([
      this.getCountFromTable(tableName, dateField, currentRange, projectId),
      this.getCountFromTable(tableName, dateField, previousRange, projectId),
      this.getCountFromTable(tableName, dateField, currentRange, projectId, { status: completedStatuses }),
      this.getCountFromTable(tableName, dateField, previousRange, projectId, { status: completedStatuses })
    ]);

    const currentRate = currentTotal > 0 ? (currentCompleted / currentTotal) * 100 : 0;
    const previousRate = previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

    return this.getTrendData(currentRate, previousRate);
  }
} 