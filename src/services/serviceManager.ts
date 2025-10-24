/**
 * Service Manager
 * Manages singleton services and coordinates cache clearing on auth state changes
 */

import { SimpleProjectService } from './simpleProjectService';
import { supabase } from '@/integrations/supabase/client';

class ServiceManager {
  private static instance: ServiceManager;
  private simpleProjectService: SimpleProjectService;

  private constructor() {
    this.simpleProjectService = new SimpleProjectService();
    this.setupAuthStateListener();
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  getSimpleProjectService(): SimpleProjectService {
    return this.simpleProjectService;
  }

  private setupAuthStateListener() {
    if (!supabase) return;

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || !session) {
        // Clear all service caches when user signs out or session changes
        this.simpleProjectService.clearUserCache();
        console.log('Service caches cleared due to auth state change');
      }
      
      // If there's an auth error, also clear the cache
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('Token refresh failed, clearing service caches');
        this.simpleProjectService.clearUserCache();
      }
    });
  }

  private clearAllCaches() {
    this.simpleProjectService.clearUserCache();
  }
}

// Export singleton instances
export const serviceManager = ServiceManager.getInstance();
export const simpleProjectService = serviceManager.getSimpleProjectService(); 