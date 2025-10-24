// @ts-nocheck
/**
 * Real Admin Console Service
 * Provides actual database management for all admin levels
 * Supports: System Admin, Client Admin, Regular Users
 */

import { supabase } from "@/integrations/supabase/client";

// ==========================================
// TYPES FOR ADMIN LEVELS
// ==========================================

export type AdminLevel = 'system_admin' | 'client_admin' | 'user';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  admin_level: AdminLevel;
  status: string;
  created_at: string;
}

export interface ClientWithStats {
  id: string;
  name: string;
  description?: string;
  client_status: string;
  created_at: string;
  updated_at?: string;
  user_count: number;
  project_count: number;
  lead_count: number;
  active_leads: number;
}

export interface UserWithStats {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  admin_level: AdminLevel;
  status: string;
  created_at: string;
  client_name?: string;
  client_id?: string;
  api_keys_count: number;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  service_name: string;
  key_name: string;
  encrypted_key: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  timezone: string;
  notification_settings: Record<string, any>;
  integration_settings: Record<string, any>;
  dashboard_layout: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserDashboardSettings {
  id: string;
  user_id: string;
  widget_layout: any[];
  visible_widgets: any[];
  default_filters: Record<string, any>;
  refresh_interval: number;
  created_at: string;
  updated_at: string;
}

export interface SystemPrompt {
  id: string;
  project_id: string;
  project_name: string;
  project_description?: string;
  client_name: string;
  client_id: string;
  system_prompt?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// ADMIN LEVEL DETECTION
// ==========================================

export const getCurrentAdminLevel = async (): Promise<AdminLevel | null> => {
  try {
    // Try the RPC function first
    const { data, error } = await supabase.rpc('get_current_admin_level');
    
    if (error) {
      console.warn('RPC get_current_admin_level failed, using fallback:', error.message);
      
      // Fallback: Get current user and check their profile directly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'user';
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('admin_level, role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn('Profile check failed, defaulting to user:', profileError.message);
        return 'user';
      }
      
      // Return admin level or determine from role
      if (profile?.admin_level) {
        return profile.admin_level as AdminLevel;
      }
      
      // Fallback based on role
      if (profile?.role === 'admin') {
        return 'client_admin';
      }
      
      return 'user';
    }
    
    return (data as AdminLevel) || 'user';
  } catch (error) {
    console.error('Error getting admin level:', error);
    return 'user';
  }
};

export const isSystemAdmin = async (): Promise<boolean> => {
  const level = await getCurrentAdminLevel();
  return level === 'system_admin';
};

export const isClientAdmin = async (): Promise<boolean> => {
  const level = await getCurrentAdminLevel();
  return level === 'client_admin';
};

export const isAdmin = async (): Promise<boolean> => {
  const level = await getCurrentAdminLevel();
  return level === 'system_admin' || level === 'client_admin';
};

// ==========================================
// CLIENT MANAGEMENT - FULL CRUD
// ==========================================

export const getAllClientsWithStats = async (): Promise<ClientWithStats[]> => {
  try {
    if (!(await isSystemAdmin())) {
      throw new Error('Access denied: System admin required');
    }

    const { data, error } = await supabase.rpc('get_all_clients_with_stats');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clients with stats:', error);
    throw error;
  }
};

export const createClient = async (clientData: {
  name: string;
  description?: string;
  status?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  size?: string;
  location?: string;
  user_id?: string;
}): Promise<any> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for client creation');
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...clientData,
        user_id: clientData.user_id || (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (id: string, updates: Record<string, any>): Promise<any> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for client updates');
    }

    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for client deletion');
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// ==========================================
// USER MANAGEMENT - FULL CRUD WITH SETTINGS
// ==========================================

export const getAllUsersWithStats = async (): Promise<UserWithStats[]> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required');
    }

    const { data, error } = await supabase.rpc('get_user_stats_for_admin');

    if (error) throw error;

    // Filter based on admin level
    if (adminLevel === 'client_admin') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get admin's client IDs
      const { data: adminMemberships } = await supabase
        .from('client_members')
        .select('client_id')
        .eq('user_id', user.id);

      const adminClientIds = adminMemberships?.map(m => m.client_id) || [];
      
      // Filter users to only show those in admin's clients
      return (data || []).filter((userData: UserWithStats) => 
        userData.client_id && adminClientIds.includes(userData.client_id)
      );
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users with stats:', error);
    throw error;
  }
};

export const createUser = async (userData: {
  email: string;
  full_name: string;
  role?: string;
  admin_level?: string;
  status?: string;
  phone?: string;
  department?: string;
  position?: string;
}): Promise<any> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user creation');
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        ...userData,
        admin_level: userData.admin_level || 'user',
        role: userData.role || 'user',
        status: userData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, updates: Record<string, any>): Promise<any> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user updates');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user deletion');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ==========================================
// USER SETTINGS MANAGEMENT
// ==========================================

export const getUserSettings = async (userId: string): Promise<{
  api_credentials: any[];
  app_preferences: any;
  dashboard_settings: any;
  notification_settings: any;
  performance_targets: any;
  queue_settings: any;
  session_state: any;
}> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user settings');
    }

    const [
      apiCredentials,
      appPreferences,
      dashboardSettings,
      notificationSettings,
      performanceTargets,
      queueSettings,
      sessionState
    ] = await Promise.all([
      supabase.from('user_api_credentials').select('*').eq('user_id', userId),
      supabase.from('user_app_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('user_dashboard_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_notification_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_performance_targets').select('*').eq('user_id', userId).single(),
      supabase.from('user_queue_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_session_state').select('*').eq('user_id', userId).single()
    ]);

    return {
      api_credentials: apiCredentials.data || [],
      app_preferences: appPreferences.data || {},
      dashboard_settings: dashboardSettings.data || {},
      notification_settings: notificationSettings.data || {},
      performance_targets: performanceTargets.data || {},
      queue_settings: queueSettings.data || {},
      session_state: sessionState.data || {}
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  userId: string,
  table: 'user_api_credentials' | 'user_app_preferences' | 'user_dashboard_settings' | 
         'user_notification_settings' | 'user_performance_targets' | 'user_queue_settings' | 
         'user_session_state',
  updates: Record<string, any>
): Promise<any> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user settings updates');
    }

    const { data, error } = await supabase
      .from(table)
      .upsert({
        ...updates,
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
};

export const resetUserSettingsToDefault = async (userId: string): Promise<void> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user settings reset');
    }

    // Delete all user settings to reset to defaults
    const tables = [
      'user_api_credentials',
      'user_app_preferences', 
      'user_dashboard_settings',
      'user_notification_settings',
      'user_performance_targets',
      'user_queue_settings',
      'user_session_state'
    ];

    await Promise.all(
      tables.map(table => 
        supabase.from(table).delete().eq('user_id', userId)
      )
    );
  } catch (error) {
    console.error('Error resetting user settings:', error);
    throw error;
  }
};

// ==========================================
// USER API KEYS MANAGEMENT
// ==========================================

export const getUserApiKeys = async (userId: string): Promise<UserApiKey[]> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Users can see their own keys, admins can see any user's keys
    if (userId !== user?.id && !adminLevel) {
      throw new Error('Access denied');
    }

    const { data, error } = await supabase
      .from('user_api_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user API keys:', error);
    throw error;
  }
};

export const createUserApiKey = async (userId: string, keyData: {
  service_name: string;
  key_name: string;
  key_value: string;
}): Promise<UserApiKey> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Users can create their own keys, admins can create for any user
    if (userId !== user?.id && !adminLevel) {
      throw new Error('Access denied');
    }

    const { data, error } = await supabase
      .from('user_api_credentials')
      .insert({
        user_id: userId,
        service_name: keyData.service_name,
        key_name: keyData.key_name,
        encrypted_key: btoa(keyData.key_value), // Simple encoding - use proper encryption in production
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user API key:', error);
    throw error;
  }
};

export const deleteUserApiKey = async (keyId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_api_credentials')
      .delete()
      .eq('id', keyId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user API key:', error);
    throw error;
  }
};

export const toggleUserApiKey = async (keyId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_api_credentials')
      .update({ is_active: isActive })
      .eq('id', keyId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling user API key:', error);
    throw error;
  }
};

// ==========================================
// USER PREFERENCES MANAGEMENT
// ==========================================

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_app_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

export const getUserDashboardSettings = async (userId: string): Promise<UserDashboardSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user dashboard settings:', error);
    throw error;
  }
};

export const resetUserPreferences = async (userId: string): Promise<void> => {
  try {
    if (!(await isSystemAdmin())) {
      throw new Error('Access denied: System admin required');
    }

    const { data, error } = await supabase.rpc('reset_user_preferences', {
      target_user_id: userId
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to reset user preferences');
    }
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    throw error;
  }
};

// ==========================================
// SYSTEM PROMPTS MANAGEMENT (ADMIN-ONLY)
// ==========================================

export const getSystemPrompts = async (): Promise<SystemPrompt[]> => {
  try {
    
    const adminLevel = await getCurrentAdminLevel();
    
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for system prompts');
    }

    // Try the RPC function first
    try {
      
      const { data, error } = await supabase.rpc('get_projects_with_system_prompts');
      
      
      if (!error && data) {
        
        return (data || []).map(project => ({
          id: project.id,
          project_id: project.project_id,
          project_name: project.project_name,
          project_description: project.project_description,
          client_name: project.client_name || 'Unknown',
          client_id: project.client_id || '',
          // Use client description as system prompt
          system_prompt: project.client_description,
          created_at: project.created_at,
          updated_at: project.updated_at
        }));
      }
    } catch (rpcError) {
      console.warn('ERROR [SystemPrompts] RPC get_projects_with_system_prompts failed, using fallback:', rpcError);
    }

    // Fallback: Get clients with descriptions directly
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .not('description', 'is', null)
      .neq('description', '');

    
    if (clientsError) {
      console.error('ERROR [SystemPrompts] Clients query failed:', clientsError);
      throw clientsError;
    }

    
    // Map clients to system prompts format
    const systemPrompts = (clients || []).map(client => ({
      id: client.id,
      project_id: client.id, // Use client ID as project ID for now
      project_name: client.name,
      project_description: client.description,
      client_name: client.name,
      client_id: client.id,
      // Client description IS the system prompt
      system_prompt: client.description,
      created_at: client.created_at,
      updated_at: client.updated_at
    }));

    console.log('COMPLETE [SystemPrompts] Final system prompts:', systemPrompts);
    return systemPrompts;
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    throw error;
  }
};

export const updateSystemPrompt = async (projectId: string, updates: {
  name?: string;
  description?: string;
}): Promise<SystemPrompt> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for system prompts');
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        clients (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      project_id: data.id,
      project_name: data.name,
      project_description: data.description,
      client_name: data.clients?.name || 'Unknown',
      client_id: data.clients?.id || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error updating system prompt:', error);
    throw error;
  }
};

// ==========================================
// ANALYTICS & INSIGHTS
// ==========================================

export const getSystemAnalytics = async (): Promise<{
  totalClients: number;
  totalUsers: number;
  totalProjects: number;
  totalLeads: number;
  activeLeads: number;
  totalApiKeys: number;
}> => {
  try {
    if (!(await isSystemAdmin())) {
      throw new Error('Access denied: System admin required');
    }

    const [clientsRes, usersRes, projectsRes, leadsRes, apiKeysRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('projects').select('id', { count: 'exact' }),
      supabase.from('leads').select('id, status', { count: 'exact' }),
      supabase.from('user_api_credentials').select('id', { count: 'exact', head: true })
    ]);

    const activeLeadsRes = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('status', ['qualified', 'engaged', 'new']);

    return {
      totalClients: clientsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalProjects: projectsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      activeLeads: activeLeadsRes.count || 0,
      totalApiKeys: apiKeysRes.count || 0
    };
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    throw error;
  }
};

// ==========================================
// DATABASE CONSOLE (READ-ONLY)
// ==========================================

export const executeDatabaseQuery = async (query: string): Promise<any> => {
  try {
    if (!(await isSystemAdmin())) {
      throw new Error('Access denied: System admin required');
    }

    // Only allow SELECT queries for security
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    const { data, error } = await supabase.rpc('execute_read_only_query', {
      sql_query: query
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error executing database query:', error);
    throw error;
  }
};

// ==========================================
// USER MANAGEMENT ADDITIONAL FUNCTIONS
// ==========================================

export const changeUserClient = async (userId: string, newClientId: string): Promise<void> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user client changes');
    }

    // Update user's client association
    const { error } = await supabase
      .from('profiles')
      .update({ client_id: newClientId })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error changing user client:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
  try {
    const adminLevel = await getCurrentAdminLevel();
    if (!adminLevel || adminLevel === 'user') {
      throw new Error('Access denied: Admin required for user role changes');
    }

    // Update user's role
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}; 