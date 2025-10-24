/**
 * Shared types and utilities
 * Consolidates common type patterns to eliminate redundancy
 */

/**
 * Generic database operation result
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Base pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Base sorting options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Base filter options for data queries
 */
export interface FilterOptions {
  search?: string;
  status?: string | string[];
  dateRange?: {
    start: string;
    end: string;
  };
  clientId?: string;
  projectId?: string;
}

/**
 * Complete query options combining filters, sorting, and pagination
 */
export interface QueryOptions {
  filter?: FilterOptions;
  sort?: SortOptions;
  pagination?: PaginationParams;
}

/**
 * Base entity metadata for tracking
 */
export interface EntityMetadata {
  created_at: string;
  updated_at: string;
}

/**
 * Base entity with ID and metadata
 */
export interface BaseEntity extends EntityMetadata {
  id: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Address information structure
 */
export interface Address {
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  email?: string | null;
  phone?: string | null;
  address?: Address;
  primary_contact_name?: string | null;
}

/**
 * Generic metadata structure for extensible entities
 */
export interface GenericMetadata {
  tags?: string[];
  source?: string | null;
  [key: string]: any;
} 