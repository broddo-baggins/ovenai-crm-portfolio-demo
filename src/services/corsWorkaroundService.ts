/**
 * CORS Workaround Service
 * 
 * This service provides fallback mechanisms when Safari or other browsers
 * block cross-origin requests to Supabase
 */

import { supabase } from '@/integrations/supabase/client';

interface CorsConfig {
  maxRetries: number;
  retryDelay: number;
  useFallback: boolean;
}

const defaultConfig: CorsConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  useFallback: true
};

export class CorsWorkaroundService {
  private static instance: CorsWorkaroundService;
  private config: CorsConfig;
  private corsErrors: Map<string, number> = new Map();

  private constructor(config: CorsConfig = defaultConfig) {
    this.config = config;
  }

  static getInstance(): CorsWorkaroundService {
    if (!this.instance) {
      this.instance = new CorsWorkaroundService();
    }
    return this.instance;
  }

  /**
   * Execute a Supabase query with CORS error handling
   */
  async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackData?: T,
    queryName: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await queryFn();
        
        // Reset error count on success
        this.corsErrors.delete(queryName);
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a CORS error
        if (this.isCorsError(error)) {
          console.warn(`🚫 CORS error on attempt ${attempt} for ${queryName}:`, error.message);
          
          // Track CORS errors
          const errorCount = (this.corsErrors.get(queryName) || 0) + 1;
          this.corsErrors.set(queryName, errorCount);
          
          // If too many CORS errors, use fallback
          if (errorCount >= this.config.maxRetries && this.config.useFallback && fallbackData) {
            
            return { data: fallbackData, error: null };
          }
          
          // Wait before retry
          if (attempt < this.config.maxRetries) {
            await this.delay(this.config.retryDelay * attempt);
          }
        } else {
          // Non-CORS error, don't retry
          throw error;
        }
      }
    }
    
    // All retries failed
    if (this.config.useFallback && fallbackData) {
      
      return { data: fallbackData, error: lastError };
    }
    
    return { data: null, error: lastError };
  }

  /**
   * Check if an error is likely a CORS error
   */
  private isCorsError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    return (
      errorMessage.includes('Load failed') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Cross-Origin') ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('access control')
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get CORS error statistics
   */
  getCorsErrorStats(): { total: number; byQuery: Record<string, number> } {
    const byQuery: Record<string, number> = {};
    let total = 0;
    
    this.corsErrors.forEach((count, query) => {
      byQuery[query] = count;
      total += count;
    });
    
    return { total, byQuery };
  }

  /**
   * Clear CORS error history
   */
  clearErrorHistory(): void {
    this.corsErrors.clear();
  }

  /**
   * Check if we should use local storage fallback
   */
  shouldUseLocalFallback(): boolean {
    const stats = this.getCorsErrorStats();
    return stats.total > 5; // Use local fallback if more than 5 CORS errors
  }
}

export const corsWorkaround = CorsWorkaroundService.getInstance(); 