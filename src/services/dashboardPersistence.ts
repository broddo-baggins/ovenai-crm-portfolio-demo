import { WidgetConfig } from '@/types/widgets';
import logger from './base/logger';

export interface DashboardLayout {
  widgets: WidgetConfig[];
  timestamp: string;
  version: string;
  userId?: string;
  projectId?: string;
}

export interface SaveResult {
  success: boolean;
  savedToServer: boolean;
  savedLocally: boolean;
  error?: string;
}

class DashboardPersistenceService {
  private readonly LOCAL_STORAGE_KEY = 'dashboard-layout';
  private readonly SERVER_ENDPOINT = '/api/dashboard/layout'; // Not implemented yet
  private retryCount = 0;
  private maxRetries = 3;

  /**
   * Save dashboard layout with fallback strategy:
   * 1. Save to localStorage (server endpoint not implemented yet)
   * 2. Skip server save to avoid 405 errors
   */
  async saveDashboardLayout(layout: DashboardLayout): Promise<SaveResult> {
    const result: SaveResult = {
      success: false,
      savedToServer: false,
      savedLocally: false
    };

    // Create a copy of the layout to prevent race conditions
    const layoutCopy = {
      ...layout,
      widgets: layout.widgets.map(w => ({...w}))
    };

    // Save to localStorage only (server endpoint not implemented)
    try {
      const serializedLayout = JSON.stringify(layoutCopy);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, serializedLayout);
      result.savedLocally = true;
      result.success = true;
      logger.info('Dashboard layout saved to localStorage', 'DashboardPersistence');
    } catch (error) {
      logger.error('Failed to save dashboard layout to localStorage', 'DashboardPersistence', error);
      result.error = 'Failed to save locally';
      return result;
    }

    // Skip server save (endpoint not implemented)
    result.savedToServer = false;
    logger.debug('Server save skipped (endpoint not implemented)', 'DashboardPersistence');

    return result;
  }

  /**
   * Load dashboard layout from localStorage only
   * (server endpoint not implemented yet)
   */
  async loadDashboardLayout(userId?: string, projectId?: string): Promise<DashboardLayout | null> {
    // Skip server load (endpoint not implemented)
    logger.debug('Server load skipped (endpoint not implemented)', 'DashboardPersistence', { userId, projectId });

    // Load from localStorage
    try {
      const localData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (localData) {
        const layout = JSON.parse(localData) as DashboardLayout;
        logger.info('Dashboard layout loaded from localStorage', 'DashboardPersistence');
        return layout;
      }
    } catch (error) {
      logger.error('Failed to load dashboard layout from localStorage', 'DashboardPersistence', error);
    }

    return null;
  }

  /**
   * Force save to localStorage (server not available)
   */
  async forceSaveToServer(layout: DashboardLayout): Promise<SaveResult> {
    const result: SaveResult = {
      success: false,
      savedToServer: false,
      savedLocally: false
    };

    // Save to localStorage (server endpoint not implemented)
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(layout));
      result.savedLocally = true;
      result.success = true;
      result.savedToServer = false; // Not actually saved to server
      
      logger.info('Dashboard layout force-saved to localStorage only', 'DashboardPersistence');
    } catch (error) {
      logger.error('Failed to force-save dashboard layout to localStorage', 'DashboardPersistence', error);
      result.error = `Local save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  /**
   * Check if there are unsaved changes by comparing with localStorage
   */
  async hasUnsavedChanges(currentLayout: DashboardLayout): Promise<boolean> {
    try {
      const localData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!localData) return true; // No local data means unsaved
      
      const localLayout = JSON.parse(localData) as DashboardLayout;
      
      // Compare timestamps or widget configurations
      return localLayout.timestamp !== currentLayout.timestamp ||
             JSON.stringify(localLayout.widgets) !== JSON.stringify(currentLayout.widgets);
    } catch (error) {
      logger.warn('Could not check localStorage for changes:', error, 'DashboardPersistence');
      return false; // Assume saved if we can't check
    }
  }

  /**
   * Clear all saved data (useful for testing or reset)
   */
  async clearSavedData(): Promise<void> {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      logger.info('Dashboard layout data cleared', 'DashboardPersistence');
    } catch (error) {
      logger.error('Failed to clear dashboard layout data', 'DashboardPersistence', error);
    }
  }

  /**
   * Schedule a retry for server save (currently disabled)
   */
  private scheduleRetry(layout: DashboardLayout): void {
    // Skip retry since server endpoint is not implemented
    logger.debug('Server retry skipped (endpoint not implemented)', 'DashboardPersistence', { widgets: layout.widgets.length });
  }

  /**
   * Server save method (currently disabled)
   */
  private async saveToServer(layout: DashboardLayout): Promise<Response> {
    // Return fake successful response to avoid errors
    logger.debug('Server save disabled', 'DashboardPersistence', { widgets: layout.widgets.length });
    return new Response('{"success": true}', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Load from server method (currently disabled)
   */
  private async loadFromServer(): Promise<DashboardLayout | null> {
    // Return null since server endpoint is not implemented
    return null;
  }


}

export const dashboardPersistence = new DashboardPersistenceService();
export default dashboardPersistence;

// Export types
export type { DashboardPersistenceService }; 