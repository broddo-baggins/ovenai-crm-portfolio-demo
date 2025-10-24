// Safe Service Wrapper to prevent infinite loops and reduce bundle size

import { supabase } from '@/integrations/supabase/client';
import { Project, Lead } from '@/types/index';

class SafeServiceWrapper {
  private projectCache: Project[] = [];
  private leadCache: Lead[] = [];
  private projectCacheTime = 0;
  private leadCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DEBOUNCE_DELAY = 1000; // 1 second
  
  private lastProjectCall = 0;
  private lastLeadCall = 0;
  
  // Safe project fetching with caching and debouncing
  async getProjects(): Promise<Project[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (now - this.projectCacheTime < this.CACHE_DURATION && this.projectCache.length > 0) {
      return this.projectCache;
    }
    
    // Debounce rapid calls
    if (now - this.lastProjectCall < this.DEBOUNCE_DELAY) {
      return this.projectCache;
    }
    
    this.lastProjectCall = now;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        return this.projectCache; // Return cached data on error
      }
      
      this.projectCache = (data || []) as unknown as Project[];
      this.projectCacheTime = now;
      
      return this.projectCache;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return this.projectCache; // Return cached data on error
    }
  }
  
  // Safe lead fetching with caching and debouncing
  async getAllLeads(projectId?: string): Promise<Lead[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (now - this.leadCacheTime < this.CACHE_DURATION && this.leadCache.length > 0) {
      return projectId ? 
        this.leadCache.filter(lead => lead.current_project_id === projectId) : 
        this.leadCache;
    }
    
    // Debounce rapid calls
    if (now - this.lastLeadCall < this.DEBOUNCE_DELAY) {
      return projectId ? 
        this.leadCache.filter(lead => lead.current_project_id === projectId) : 
        this.leadCache;
    }
    
    this.lastLeadCall = now;
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching leads:', error);
        return this.leadCache; // Return cached data on error
      }
      
      this.leadCache = (data || []) as unknown as Lead[];
      this.leadCacheTime = now;
      
      return projectId ? 
        this.leadCache.filter(lead => lead.current_project_id === projectId) : 
        this.leadCache;
    } catch (error) {
      console.error('Error fetching leads:', error);
      return this.leadCache; // Return cached data on error
    }
  }
  
  // Clear cache when needed
  clearCache(): void {
    this.projectCache = [];
    this.leadCache = [];
    this.projectCacheTime = 0;
    this.leadCacheTime = 0;
  }
  
  // Get cache status for debugging
  getCacheStatus(): { projects: number, leads: number, projectAge: number, leadAge: number } {
    const now = Date.now();
    return {
      projects: this.projectCache.length,
      leads: this.leadCache.length,
      projectAge: now - this.projectCacheTime,
      leadAge: now - this.leadCacheTime
    };
  }
}

export const safeServiceWrapper = new SafeServiceWrapper();

