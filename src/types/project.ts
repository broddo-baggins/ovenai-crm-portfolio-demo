// Base project interface
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'archived' | 'completed';
  created_at: string;
  updated_at?: string;
  client_id: string;
  owner_id?: string;
  team_members?: string[];
}

// Extended project interface with statistics
export interface ProjectWithStats extends Project {
  // Basic stats
  leads_count: number;
  active_conversations: number;
  conversion_rate: number;
  last_activity?: string;
  
  // Additional metadata
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  color?: string;
  
  // Computed fields
  leadCount?: number;
  isActive?: boolean;
  
  // Client information
  client?: {
    id: string;
    name: string;
  };
  client_name?: string;
  
  // Progress tracking
  completion_percentage?: number;
  
  // Activity metrics
  recent_activity?: number;
} 