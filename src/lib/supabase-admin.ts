import { createClient } from '@supabase/supabase-js';

// DEPRECATED: This file is no longer used with the simplified approach
// The new simpleProjectService uses direct anon key access instead

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use anon key instead of service role for client-side safety
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// Note: This admin client is deprecated in favor of simpleProjectService
// which uses direct anon key access for better security

// Type definitions for our database tables
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  status: string | null;
  settings: any | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  project_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions for common operations
export const adminOperations = {
  // Profile operations
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Client operations
  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert(client)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getClients() {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Client member operations
  async addClientMember(clientId: string, userId: string, role: string = 'member') {
    const { data, error } = await supabaseAdmin
      .from('client_members')
      .insert({
        client_id: clientId,
        user_id: userId,
        role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Project operations
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getProjectsByClient(clientId: string) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Lead operations
  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLeadsByProject(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Relationship queries
  async getClientsWithProjects() {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        projects:projects(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getProjectsWithLeads(clientId?: string) {
    let query = supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:clients(*),
        leads:leads(*)
      `);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Export supabaseAdmin for backward compatibility (may be null)
export default supabaseAdmin; 