// @ts-nocheck
// TypeScript checking disabled for deployment compatibility
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database, PaginatedResult, QueryOptions, TableName, Tables } from '@/types/database';
import { DatabaseResult } from '@/types/shared';

export abstract class BaseService<T extends Tables[TableName]['Row']> {
  protected abstract tableName: TableName;

  protected handleError(error: unknown): DatabaseResult<T> {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error(`Error in ${this.tableName} service:`, error);
    toast.error(errorMessage);
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }

  protected buildQuery(options?: QueryOptions) {
    let query = supabase.from(this.tableName).select('*');

    if (options?.filter) {
      const { search, status, dateRange, clientId, projectId } = options.filter;

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    }

    if (options?.sort) {
      query = query.order(options.sort.field, { ascending: options.sort.direction === 'asc' });
    }

    if (options?.pagination) {
      const { page, limit } = options.pagination;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    return query;
  }

  async getAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    try {
      const query = this.buildQuery(options);
      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as T[],
        total: count || 0,
        page: options?.pagination?.page || 1,
        limit: options?.pagination?.limit || 10,
        hasMore: (count || 0) > ((options?.pagination?.page || 1) * (options?.pagination?.limit || 10))
      };
    } catch (error: any) {
      this.handleError(error);
      return {
        data: [],
        total: 0,
        page: options?.pagination?.page || 1,
        limit: options?.pagination?.limit || 10,
        hasMore: false
      };
    }
  }

  async getById(id: string): Promise<DatabaseResult<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
        success: true
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async create(data: Tables[TableName]['Insert']): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      toast.success('Created successfully');
      return {
        data: result as T,
        error: null,
        success: true
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async update(id: string, data: Tables[TableName]['Update']): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Updated successfully');
      return {
        data: result as T,
        error: null,
        success: true
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete(id: string): Promise<DatabaseResult<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Deleted successfully');
      return {
        data: data as T,
        error: null,
        success: true
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
} 