import { useEffect, useCallback, useRef } from 'react';
import { useProject } from '@/context/ProjectContext';
import { simpleProjectService } from '@/services/simpleProjectService';
import { toast } from 'sonner';

interface RefreshOptions {
  /**
   * Whether to show loading indicators during refresh
   */
  showLoading?: boolean;
  
  /**
   * Whether to show success toast after refresh
   */
  showSuccessToast?: boolean;
  
  /**
   * Whether to show error toast on refresh failure
   */
  showErrorToast?: boolean;
  
  /**
   * Custom delay before refresh (in ms)
   */
  delay?: number;
  
  /**
   * Whether to force refresh even if data is cached
   */
  force?: boolean;
}

interface ProjectDataRefreshHook {
  /**
   * Manually trigger refresh for all project data
   */
  refreshAll: (options?: RefreshOptions) => Promise<void>;
  
  /**
   * Manually trigger refresh for leads only
   */
  refreshLeads: (options?: RefreshOptions) => Promise<void>;
  
  /**
   * Manually trigger refresh for messages only
   */
  refreshMessages: (options?: RefreshOptions) => Promise<void>;
  
  /**
   * Whether a refresh is currently in progress
   */
  isRefreshing: boolean;
}

/**
 * Hook that provides unified auto-refresh functionality for project-dependent data
 * Automatically refreshes when project changes and provides manual refresh methods
 */
export const useProjectDataRefresh = (): ProjectDataRefreshHook => {
  const { currentProject } = useProject();
  const refreshingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousProjectIdRef = useRef<string | null>(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeRefresh = useCallback(async (
    refreshFn: () => Promise<void>,
    options: RefreshOptions = {}
  ) => {
    const {
      showLoading = false,
      showSuccessToast = false,
      showErrorToast = true,
      delay = 0,
      force = false
    } = options;

    // Prevent concurrent refreshes
    if (refreshingRef.current && !force) {
      
      return;
    }

    refreshingRef.current = true;

    try {
      // Apply delay if specified
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (showLoading) {
        toast.loading('Refreshing data...', { id: 'refresh-loading' });
      }

      await refreshFn();

      if (showSuccessToast) {
        toast.success('Data refreshed successfully', { id: 'refresh-loading' });
      } else if (showLoading) {
        toast.dismiss('refresh-loading');
      }

    } catch (error) {
      console.error('ERROR Refresh failed:', error);
      
      if (showErrorToast) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
        toast.error(`Refresh failed: ${errorMessage}`, { id: 'refresh-loading' });
      }
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  const refreshLeads = useCallback(async (options: RefreshOptions = {}) => {
    
    await executeRefresh(async () => {
      // Clear leads cache
      simpleProjectService.clearProjectSpecificCache(currentProject?.id);
      
      // Trigger leads refresh events
      const events = [
        'leads-data-refresh',
        'project-data-invalidated',
        'force-dashboard-refresh'
      ];

      events.forEach(eventName => {
        const event = new CustomEvent(eventName, {
          detail: {
            projectId: currentProject?.id,
            projectName: currentProject?.name,
            timestamp: Date.now(),
            source: 'useProjectDataRefresh'
          }
        });
        window.dispatchEvent(event);
      });

      // Small delay to ensure events are processed
      await new Promise(resolve => setTimeout(resolve, 100));
    }, options);
  }, [currentProject?.id, currentProject?.name, executeRefresh]);

  const refreshMessages = useCallback(async (options: RefreshOptions = {}) => {
    
    await executeRefresh(async () => {
      // Clear messages and conversations cache
      simpleProjectService.clearProjectSpecificCache(currentProject?.id);
      
      // Trigger messages refresh events
      const events = [
        'messages-data-refresh',
        'conversations-data-refresh',
        'project-data-invalidated'
      ];

      events.forEach(eventName => {
        const event = new CustomEvent(eventName, {
          detail: {
            projectId: currentProject?.id,
            projectName: currentProject?.name,
            timestamp: Date.now(),
            source: 'useProjectDataRefresh'
          }
        });
        window.dispatchEvent(event);
      });

      // Small delay to ensure events are processed
      await new Promise(resolve => setTimeout(resolve, 100));
    }, options);
  }, [currentProject?.id, currentProject?.name, executeRefresh]);

  const refreshAll = useCallback(async (options: RefreshOptions = {}) => {
    
    await executeRefresh(async () => {
      // Clear all project-specific caches
      simpleProjectService.clearProjectSpecificCache(currentProject?.id);
      simpleProjectService.forceRefreshForProject(currentProject?.id);
      
      // Trigger comprehensive refresh events
      const events = [
        'project-data-refresh',
        'leads-data-refresh',
        'messages-data-refresh',
        'conversations-data-refresh',
        'project-data-invalidated',
        'force-dashboard-refresh'
      ];

      events.forEach(eventName => {
        const event = new CustomEvent(eventName, {
          detail: {
            projectId: currentProject?.id,
            projectName: currentProject?.name,
            timestamp: Date.now(),
            source: 'useProjectDataRefresh'
          }
        });
        window.dispatchEvent(event);
      });

      // Small delay to ensure events are processed
      await new Promise(resolve => setTimeout(resolve, 150));
    }, options);
  }, [currentProject?.id, currentProject?.name, executeRefresh]);

  // Auto-refresh when project changes
  useEffect(() => {
    const currentProjectId = currentProject?.id || null;
    const previousProjectId = previousProjectIdRef.current;

    // Only refresh if project actually changed (not on initial load)
    if (previousProjectId !== null && currentProjectId !== previousProjectId) {
      
      // Clear any pending refresh
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-refresh with a small delay to allow UI to update
      timeoutRef.current = setTimeout(() => {
        refreshAll({
          showLoading: false,
          showSuccessToast: false,
          showErrorToast: true,
          delay: 100
        });
      }, 200);
    }

    // Update previous project ID
    previousProjectIdRef.current = currentProjectId;
  }, [currentProject?.id, refreshAll]);

  return {
    refreshAll,
    refreshLeads,
    refreshMessages,
    isRefreshing: refreshingRef.current
  };
}; 