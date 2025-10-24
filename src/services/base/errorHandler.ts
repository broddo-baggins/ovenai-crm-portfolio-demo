import { toast } from 'sonner';
import { DatabaseResult } from '@/types/shared';

/**
 * Standard error result interface
 */
export interface ServiceError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Consolidated error handling for all services
 * Eliminates duplicate error handling patterns across the codebase
 */
export class ServiceErrorHandler {
  /**
   * Handle service errors with consistent logging and user feedback
   */
  static handleError<T>(error: unknown, serviceName: string, operation?: string): DatabaseResult<T> {
    const errorMessage = this.extractErrorMessage(error);
    const contextMessage = operation ? `${serviceName}.${operation}` : serviceName;
    
    console.error(`Error in ${contextMessage}:`, error);
    toast.error(errorMessage);
    
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }

  /**
   * Handle async service errors with consistent patterns
   */
  static async handleAsyncError<T>(
    operation: () => Promise<T>,
    serviceName: string,
    operationName?: string
  ): Promise<DatabaseResult<T>> {
    try {
      const data = await operation();
      return {
        data,
        error: null,
        success: true
      };
    } catch (error: unknown) {
      return this.handleError<T>(error, serviceName, operationName);
    }
  }

  /**
   * Extract meaningful error message from various error types
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if (error && typeof error === 'object' && 'error_description' in error && typeof error.error_description === 'string') {
      return error.error_description;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Handle validation errors specifically
   */
  static handleValidationError(errors: string[], serviceName: string): DatabaseResult<null> {
    const errorMessage = errors.join(', ');
    console.error(`Validation error in ${serviceName}:`, errors);
    toast.error(errorMessage);
    
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }

  /**
   * Handle network errors with retry suggestions
   */
  static handleNetworkError(error: unknown, serviceName: string): DatabaseResult<null> {
        const isNetworkError = (error as any)?.name === 'AbortError' ||
                          (error as any)?.message?.includes('fetch') ||
                          (error as any)?.message?.includes('network');
    
    const errorMessage = isNetworkError 
      ? 'Network error occurred. Please check your connection and try again.'
      : this.extractErrorMessage(error);
    
    console.error(`Network error in ${serviceName}:`, error);
    toast.error(errorMessage);
    
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }
} 