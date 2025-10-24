import { useState, useEffect, useCallback, useRef } from 'react';
import { useProject } from '@/context/ProjectContext';
import { simpleProjectService } from '@/services/simpleProjectService';
import { Lead, Project } from '@/types';

interface UseProjectDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  includeWhatsAppMessages?: boolean; // Make WhatsApp messages optional to reduce requests
  whatsAppMessageLimit?: number; // Allow customizable limit (default 50)
}

interface ProjectDataState {
  leads: Lead[];
  projects: Project[];
  conversations: any[];
  whatsappMessages: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useProjectData(options: UseProjectDataOptions = {}) {
  const { currentProject } = useProject();
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    onError,
    includeWhatsAppMessages = false, // Default to false to reduce requests
    whatsAppMessageLimit = 50 // Smaller default limit
  } = options;

  const [state, setState] = useState<ProjectDataState>({
    leads: [],
    projects: [],
    conversations: [],
    whatsappMessages: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Clear any existing timeout
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Load data function
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const projectId = currentProject?.id;

      // Conditional loading - DISABLED conversation loading to prevent infinite loops
      const promises = [
        simpleProjectService.getAllProjects(),
        simpleProjectService.getAllLeads(projectId),
        // DISABLED: simpleProjectService.getAllConversations(projectId), // Causes infinite throttling
      ];

      // Only add WhatsApp messages if explicitly requested (reduces excessive requests)
      if (includeWhatsAppMessages) {
        promises.push(simpleProjectService.getWhatsAppMessages(whatsAppMessageLimit, projectId));
      }

      const results = await Promise.all(promises);
      const projects = results[0] as Project[];
      const leads = results[1] as Lead[];
      const whatsappMessages = includeWhatsAppMessages ? (results[2] as any[]) : [];

      if (mountedRef.current) {
        setState({
          projects: projects || [],
          leads: leads || [],
          conversations: [], // DISABLED: Empty array to prevent infinite conversation loading
          whatsappMessages: whatsappMessages || [],
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [currentProject?.id, onError, includeWhatsAppMessages, whatsAppMessageLimit]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    simpleProjectService.forceRefresh();
    loadData(true);
  }, [loadData]);

  // Setup auto-refresh
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh) return;

    clearRefreshTimeout();
    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        loadData(false); // Silent refresh
        setupAutoRefresh(); // Schedule next refresh
      }
    }, refreshInterval);
  }, [autoRefresh, refreshInterval, loadData, clearRefreshTimeout]);

  // Load data when project changes
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Setup auto-refresh
  useEffect(() => {
    setupAutoRefresh();
    return clearRefreshTimeout;
  }, [setupAutoRefresh, clearRefreshTimeout]);

  // Listen for project changes
  useEffect(() => {
    const handleProjectChange = (event: CustomEvent) => {
      
      loadData(true);
    };

    const handleDataInvalidation = (event: CustomEvent) => {
      
      loadData(false); // Silent refresh
    };

    const handleForceRefresh = (event: CustomEvent) => {
      
      loadData(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('project-changed', handleProjectChange as EventListener);
      window.addEventListener('data-invalidated', handleDataInvalidation as EventListener);
      window.addEventListener('force-refresh', handleForceRefresh as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('project-changed', handleProjectChange as EventListener);
        window.removeEventListener('data-invalidated', handleDataInvalidation as EventListener);
        window.removeEventListener('force-refresh', handleForceRefresh as EventListener);
      }
    };
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout]);

  return {
    ...state,
    currentProject,
    refresh: forceRefresh,
    isProjectSelected: !!currentProject,
    stats: {
      totalProjects: state.projects.length,
      totalLeads: state.leads.length,
      totalConversations: state.conversations.length,
      totalMessages: state.whatsappMessages.length,
      activeLeads: state.leads.filter(lead => 
        ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(
          lead.status?.toString().toLowerCase() || ''
        )
      ).length,
      projectLeads: state.leads.filter(lead => 
        lead.current_project_id === currentProject?.id ||
        lead.current_project_id === currentProject?.id
      ).length
    }
  };
}

// Simpler hook for just leads with automatic project filtering
export function useProjectLeads(options: UseProjectDataOptions = {}) {
  const { currentProject } = useProject();
  const { onError } = options;
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<{
    leads: Lead[];
    loading: boolean;
    error: string | null;
  }>({
    leads: [],
    loading: true,
    error: null
  });

  const loadLeads = useCallback(async () => {
    if (isLoadingRef.current) {
      
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const projectId = currentProject?.id;
      const leads = await simpleProjectService.getAllLeads(projectId);
      
      setState({
        leads: leads || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading leads:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load leads';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [currentProject?.id, onError]);

  // Load leads when project changes
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Listen for data changes
  useEffect(() => {
    const handleDataChange = () => {
      loadLeads();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('project-changed', handleDataChange);
      window.addEventListener('data-invalidated', handleDataChange);
      window.addEventListener('force-refresh', handleDataChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('project-changed', handleDataChange);
        window.removeEventListener('data-invalidated', handleDataChange);
        window.removeEventListener('force-refresh', handleDataChange);
      }
    };
  }, [loadLeads]);

  return {
    ...state,
    currentProject,
    refresh: loadLeads,
    isProjectSelected: !!currentProject,
    projectLeads: state.leads.filter(lead => 
      lead.current_project_id === currentProject?.id ||
      lead.current_project_id === currentProject?.id
    )
  };
} 