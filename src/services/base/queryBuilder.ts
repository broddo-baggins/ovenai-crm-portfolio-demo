import { supabase } from '@/integrations/supabase/client';

/**
 * Common query options interface
 */
export interface BaseQueryOptions {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string | string[];
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    ascending?: boolean;
  };
}

/**
 * Consolidated query builder utility
 * Eliminates duplicate query patterns across services
 */
export class QueryBuilder {
  /**
   * Build a basic select query with common filters
   */
  static buildQuery(
    tableName: string, 
    selectFields: string = '*',
    options: BaseQueryOptions = {}
  ) {
    // Use any to bypass TypeScript restrictions on dynamic table names
    const query = (supabase as any).from(tableName).select(selectFields);

    return this.applyCommonFilters(query, options);
  }

  /**
   * Build a count query
   */
  static buildCountQuery(
    tableName: string,
    options: BaseQueryOptions = {}
  ) {
    const query = (supabase as any)
      .from(tableName)
      .select('id', { count: 'exact' });

    return this.applyCommonFilters(query, options);
  }

  /**
   * Apply common filters to any query
   */
  static applyCommonFilters(query: any, options: BaseQueryOptions) {
    const { 
      projectId, 
      startDate, 
      endDate, 
      status, 
      limit, 
      offset, 
      orderBy 
    } = options;

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (startDate && endDate) {
      // Try common date field patterns
      const dateFields = ['created_at', 'sent_at', 'started_at', 'scheduled_at'];
      for (const field of dateFields) {
        try {
          query = query.gte(field, startDate).lte(field, endDate);
          break;
        } catch {
          // Continue to next field if this one doesn't exist
          continue;
        }
      }
    } else if (startDate) {
      const dateFields = ['created_at', 'sent_at', 'started_at', 'scheduled_at'];
      for (const field of dateFields) {
        try {
          query = query.gte(field, startDate);
          break;
        } catch {
          continue;
        }
      }
    } else if (endDate) {
      const dateFields = ['created_at', 'sent_at', 'started_at', 'scheduled_at'];
      for (const field of dateFields) {
        try {
          query = query.lte(field, endDate);
          break;
        } catch {
          continue;
        }
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (orderBy) {
      query = query.order(orderBy.field, { ascending: orderBy.ascending ?? true });
    }

    if (limit) {
      if (offset) {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }
    }

    return query;
  }

  /**
   * Build query for metrics with date range
   */
  static buildMetricsQuery(
    tableName: string,
    dateField: string,
    startDate: string,
    endDate: string,
    projectId?: string,
    additionalFilters?: Record<string, any>
  ) {
    let query = (supabase as any)
      .from(tableName)
      .select('*')
      .gte(dateField, startDate)
      .lte(dateField, endDate);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    return query;
  }

  /**
   * Build paginated query
   */
  static buildPaginatedQuery(
    tableName: string,
    page: number,
    limit: number,
    options: BaseQueryOptions = {}
  ) {
    const offset = (page - 1) * limit;
    const query = this.buildQuery(tableName, '*', {
      ...options,
      limit,
      offset
    });

    return query;
  }

  /**
   * Build search query with text matching
   */
  static buildSearchQuery(
    tableName: string,
    searchFields: string[],
    searchTerm: string,
    options: BaseQueryOptions = {}
  ) {
    let query = (supabase as any).from(tableName).select('*');

    // Apply search across multiple fields
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => 
        `${field}.ilike.%${searchTerm}%`
      ).join(',');
      query = query.or(searchConditions);
    }

    return this.applyCommonFilters(query, options);
  }

  /**
   * Build aggregation query (count, sum, avg)
   */
  static buildAggregationQuery(
    tableName: string,
    aggregationType: 'count' | 'sum' | 'avg',
    field?: string,
    options: BaseQueryOptions = {}
  ) {
    let selectClause: string;
    
    switch (aggregationType) {
      case 'count':
        selectClause = 'id';
        break;
      case 'sum':
        selectClause = field ? `${field}.sum()` : '*';
        break;
      case 'avg':
        selectClause = field ? `${field}.avg()` : '*';
        break;
      default:
        selectClause = '*';
    }

    let query = (supabase as any).from(tableName).select(selectClause);

    if (aggregationType === 'count') {
      query = query.select('id', { count: 'exact' });
    }

    return this.applyCommonFilters(query, options);
  }
} 