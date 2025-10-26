/**
 * Mock Admin Service
 * 
 * Provides fake admin dashboard data for demonstration purposes.
 * All data reflects the mock projects, leads, and users in the system.
 */

import { mockProjects } from '@/data/mockData';
import { mockLeads } from '@/data/mockData';

export interface AdminStats {
  // Project Statistics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  
  // Client Statistics  
  totalClients: number;
  activeClients: number;
  
  // Lead Statistics
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  burningLeads: number;
  
  // User Statistics
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  
  // System Status
  systemHealth: 'healthy' | 'warning' | 'error';
  databaseStatus: 'connected' | 'disconnected' | 'demo';
  supabaseConnection: 'active' | 'inactive' | 'demo_mode';
  rlsEnabled: boolean;
  webhooksActive: number;
  totalWebhooks: number;
  
  // Performance Metrics
  apiResponseTime: number; // ms
  uptime: number; // percentage
  errorRate: number; // percentage
}

export interface SystemInfo {
  environment: 'production' | 'staging' | 'demo';
  version: string;
  database: string;
  backend: string;
  features: {
    name: string;
    status: 'active' | 'inactive' | 'demo';
    description: string;
  }[];
}

/**
 * Calculate admin statistics from mock data
 */
export function getAdminStats(): AdminStats {
  // Calculate from mock data
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completedProjects = mockProjects.filter(p => p.status === 'completed').length;
  
  // Count unique clients from projects
  const uniqueClients = new Set(mockProjects.map(p => p.client_id));
  const totalClients = uniqueClients.size;
  const activeClients = totalClients; // All clients are considered active in demo
  
  // Calculate lead statistics
  const totalLeads = mockLeads.length;
  const qualifiedLeads = mockLeads.filter(l => {
    // Consider a lead qualified if BANT score > 50%
    const bantAvg = (
      (l.bant_scores?.budget || 0) +
      (l.bant_scores?.authority || 0) +
      (l.bant_scores?.need || 0) +
      (l.bant_scores?.timeline || 0)
    ) / 4;
    return bantAvg > 50;
  }).length;
  
  const hotLeads = mockLeads.filter(l => {
    const heatScore = l.heat_score || 0;
    return heatScore >= 51 && heatScore <= 75;
  }).length;
  
  const burningLeads = mockLeads.filter(l => {
    const heatScore = l.heat_score || 0;
    return heatScore > 75;
  }).length;
  
  // User counts (5 pending + 3 active from mock data)
  const totalUsers = 8;
  const pendingUsers = 5;
  const activeUsers = 3;
  
  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalClients,
    activeClients,
    totalLeads,
    qualifiedLeads,
    hotLeads,
    burningLeads,
    totalUsers,
    pendingUsers,
    activeUsers,
    systemHealth: 'healthy',
    databaseStatus: 'demo',
    supabaseConnection: 'demo_mode',
    rlsEnabled: false, // Demo mode - RLS not active
    webhooksActive: 0, // Demo mode - no active webhooks
    totalWebhooks: 3, // Would have 3 webhooks in production
    apiResponseTime: 45, // Simulated response time
    uptime: 99.9,
    errorRate: 0.1,
  };
}

/**
 * Get system information
 */
export function getSystemInfo(): SystemInfo {
  return {
    environment: 'demo',
    version: '2.0.0-demo',
    database: 'Mock Data (Originally Supabase PostgreSQL)',
    backend: 'Demo Mode (Originally Supabase + Row Level Security)',
    features: [
      {
        name: 'Database Connection',
        status: 'demo',
        description: 'Using mock data. Production would use Supabase PostgreSQL with connection pooling.',
      },
      {
        name: 'Row Level Security (RLS)',
        status: 'inactive',
        description: 'Disabled in demo. Production uses Supabase RLS for data isolation and security.',
      },
      {
        name: 'Webhooks',
        status: 'inactive',
        description: 'Not active in demo. Production has 3 webhooks for real-time lead updates.',
      },
      {
        name: 'WhatsApp Business API',
        status: 'demo',
        description: 'Using mock conversations. Was powered by Meta WhatsApp Business API.',
      },
      {
        name: 'Calendly Integration',
        status: 'demo',
        description: 'Mock meeting data. Production integrates with Calendly API for scheduling.',
      },
      {
        name: 'BANT Scoring Engine',
        status: 'active',
        description: 'Fully functional with mock data. Tracks Budget, Authority, Need, Timeline.',
      },
      {
        name: 'HEAT Lead Temperature',
        status: 'active',
        description: 'Fully functional with mock data. Progressive scoring: Cold → Warm → Hot → Burning.',
      },
      {
        name: 'Real-time Notifications',
        status: 'demo',
        description: 'Mock notifications. Production uses Supabase Realtime for live updates.',
      },
      {
        name: 'Multi-tenancy',
        status: 'inactive',
        description: 'Disabled in demo. Production uses RLS policies for tenant isolation.',
      },
      {
        name: 'Audit Logging',
        status: 'inactive',
        description: 'Not active in demo. Production logs all admin actions to audit trail.',
      },
    ],
  };
}

/**
 * Get recent admin activity (mock data)
 */
export interface AdminActivity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  details: string;
}

export function getRecentAdminActivity(): AdminActivity[] {
  return [
    {
      id: 'activity-1',
      action: 'User Approved',
      user: 'Honored Guest',
      target: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      details: 'Approved user registration for TechStart Solutions',
    },
    {
      id: 'activity-2',
      action: 'Project Created',
      user: 'Honored Guest',
      target: 'Enterprise Rollout',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      details: 'Created new project for TechStart Solutions',
    },
    {
      id: 'activity-3',
      action: 'System Settings Updated',
      user: 'Honored Guest',
      target: 'WhatsApp Configuration',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      details: 'Updated WhatsApp Business API settings',
    },
    {
      id: 'activity-4',
      action: 'Lead Transferred',
      user: 'Honored Guest',
      target: 'David Park',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      details: 'Transferred hot lead to Enterprise Systems project',
    },
    {
      id: 'activity-5',
      action: 'Webhook Configured',
      user: 'Honored Guest',
      target: 'Lead Status Updates',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      details: 'Configured webhook for real-time lead status notifications',
    },
  ];
}

/**
 * Get database connection info (mock)
 */
export interface DatabaseInfo {
  type: string;
  status: 'connected' | 'disconnected' | 'demo';
  host: string;
  database: string;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  performance: {
    queryTime: number; // ms
    connectionPool: string;
    caching: boolean;
  };
}

export function getDatabaseInfo(): DatabaseInfo {
  return {
    type: 'PostgreSQL (Supabase)',
    status: 'demo',
    host: 'Demo Mode (Originally: supabase.co)',
    database: 'crm_demo_portfolio',
    connections: {
      active: 0,
      idle: 0,
      max: 100, // Production would have connection pooling
    },
    performance: {
      queryTime: 12, // ms - simulated
      connectionPool: 'PgBouncer (Demo)',
      caching: false, // Not active in demo
    },
  };
}

/**
 * Get security status
 */
export interface SecurityStatus {
  rlsEnabled: boolean;
  rlsPolicies: {
    name: string;
    table: string;
    enabled: boolean;
    description: string;
  }[];
  apiKeys: {
    name: string;
    status: 'active' | 'inactive';
    lastUsed: string;
  }[];
  webhookSecurity: {
    signatureVerification: boolean;
    rateLimiting: boolean;
    ipWhitelist: boolean;
  };
}

export function getSecurityStatus(): SecurityStatus {
  return {
    rlsEnabled: false, // Demo mode
    rlsPolicies: [
      {
        name: 'tenant_isolation',
        table: 'projects',
        enabled: false, // Demo
        description: 'Ensures users only see their own tenant data',
      },
      {
        name: 'lead_access_control',
        table: 'leads',
        enabled: false, // Demo
        description: 'Restricts lead access based on project membership',
      },
      {
        name: 'admin_only_settings',
        table: 'system_settings',
        enabled: false, // Demo
        description: 'Only admins can view/modify system settings',
      },
    ],
    apiKeys: [
      {
        name: 'WhatsApp Business API',
        status: 'inactive', // Demo
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        name: 'Calendly API',
        status: 'inactive', // Demo
        lastUsed: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        name: 'Gemini AI',
        status: 'active', // May be active in demo
        lastUsed: new Date().toISOString(),
      },
    ],
    webhookSecurity: {
      signatureVerification: false, // Demo
      rateLimiting: false, // Demo
      ipWhitelist: false, // Demo
    },
  };
}

export const mockAdminService = {
  getAdminStats,
  getSystemInfo,
  getRecentAdminActivity,
  getDatabaseInfo,
  getSecurityStatus,
};

export default mockAdminService;

