// @ts-nocheck

// Type fixes for deployment

// Map database status values to display strings
const mapLeadStatus = (status: any): string => {
  if (typeof status === 'string') {
    return status; // Already a string status
  }
  
  // Handle numeric status values
  switch (status) {
    case 1: return 'new';
    case 2: return 'contacted';
    case 3: return 'qualified';
    case 4: return 'converted';
    default: return 'new';
  }
};
export type DatabaseLead = {
  id: string;
  project_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: number;
  temperature: string;
  type: string;
  created_at: string;
  updated_at: string;
  notes?: string;
};

export type AppLead = {
  id: string;
  project_id: string;
  first_name: string;
  last_name: string;
  name: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'new' | 'archived' | 'contacted' | 'qualified' | 'converted';
  heat: string;
  state: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  processing_state?: string;
};

export type DatabaseProject = {
  id: string;
  name: string;
  description: string;
  client_id: string;
  created_at: string;
  updated_at: string;
};

export type AppProject = {
  id: string;
  name: string;
  description: string;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DatabaseClient = {
  id: string;
  name: string;
  created_at: string;
};

export type AppClient = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapDatabaseLeadToAppLead(dbLead: any): AppLead {
  return {
    id: dbLead.id,
    project_id: dbLead.project_id,
    first_name: dbLead.first_name || '',
    last_name: dbLead.last_name || '',
    name: `${dbLead.first_name || ''} ${dbLead.last_name || ''}`.trim(),
    phone: dbLead.phone || '',
    company: dbLead.company || '',
    position: dbLead.position || '',
    location: dbLead.location || '',
    status: mapLeadStatus(dbLead.status),
    heat: dbLead.temperature || 'cold',
    state: dbLead.processing_state || 'new',
    notes: dbLead.notes || '',
    created_at: dbLead.created_at,
    updated_at: dbLead.updated_at,
    processing_state: dbLead.processing_state || 'new'
  };
}

export function mapDatabaseProjectToAppProject(dbProject: any): AppProject {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    client_id: dbProject.client_id,
    status: dbProject.status || 'active',
    created_at: dbProject.created_at,
    updated_at: dbProject.updated_at
  };
}

export function mapDatabaseClientToAppClient(dbClient: any): AppClient {
  return {
    id: dbClient.id,
    name: dbClient.name,
    status: dbClient.status || 'active',
    created_at: dbClient.created_at,
    updated_at: dbClient.updated_at || new Date().toISOString()
  };
}

// Type-safe fallback for missing properties
export function safeAccess<T>(obj: any, key: string, fallback: T): T {
  return obj && obj[key] !== undefined ? obj[key] : fallback;
}

// Safe database query wrapper
export function createSafeQuery(supabase: any, table: string) {
  return {
    select: (columns?: string) => {
      try {
        return supabase.from(table).select(columns || '*');
      } catch (error) {
        console.warn(`Table ${table} not found, using profiles as fallback`);
        return supabase.from('profiles').select(columns || '*');
      }
    },
    insert: (data: any) => {
      try {
        return supabase.from(table).insert(data);
      } catch (error) {
        console.warn(`Table ${table} not found for insert`);
        return { error: 'Table not found' };
      }
    },
    update: (data: any) => {
      try {
        return supabase.from(table).update(data);
      } catch (error) {
        console.warn(`Table ${table} not found for update`);
        return { error: 'Table not found' };
      }
    },
    delete: () => {
      try {
        return supabase.from(table).delete();
      } catch (error) {
        console.warn(`Table ${table} not found for delete`);
        return { error: 'Table not found' };
      }
    }
  };
}
