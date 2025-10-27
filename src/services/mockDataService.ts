/**
 * Mock Data Service
 * 
 * DEMO MODE: Provides comprehensive mock data for portfolio demonstration
 * All data is sanitized and fictional for showcase purposes
 */

import { 
  mockLeads, 
  mockProjects, 
  mockConversations,
  mockTemplates,
  mockCalendarBookings,
  mockReports,
  mockAnalytics 
} from '@/data/mockData';

export const mockDataService = {
  // Mock projects - returns 3 comprehensive projects with all stats
  getMockProjects() {
    return mockProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      client_id: project.client_id,
      status: project.status,
      created_at: project.start_date,
      updated_at: project.updated_at,
      start_date: project.start_date,
      estimated_completion: project.estimated_completion,
      value: project.value,
      team: project.team,
      progress: project.progress,
      leads_count: project.leads_count,
      active_conversations: project.active_conversations,
      conversion_rate: project.conversion_rate,
      last_activity: project.last_activity,
      last_activity_at: project.last_activity_at,
      priority: project.priority,
      color: project.color,
      tags: project.tags,
      milestones: project.milestones,
      notes: project.notes,
      client: {
        id: project.client_id,
        name: project.client
      }
    }));
  },

  // Mock leads - returns 20 comprehensive leads
  getMockLeads() {
    return mockLeads.map(lead => {
      // Parse name into first and last
      const nameParts = lead.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: lead.id,
        first_name: firstName,
        last_name: lastName,
        full_name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        state: lead.state,
        region: lead.region,
        temperature: lead.bant_score >= 75 ? 'hot' : lead.bant_score >= 50 ? 'warm' : 'cold',
        current_project_id: lead.current_project_id || null,
        project_id: lead.project_id || null,
        value: lead.value,
        created_at: lead.created_at || lead.last_contact,
        updated_at: lead.last_contact,
        bant_budget: lead.budget !== 'Unknown',
        bant_authority: lead.authority === 'Decision Maker',
        bant_need: lead.need !== 'General Inquiry',
        bant_timeline: lead.timeline !== 'Unknown',
        bant_score: Math.round(lead.bant_score / 25), // Convert 0-100 to 0-4 scale
        bant_status: lead.bant_status,
        interaction_count: lead.interaction_count || 0,
        tags: lead.tags,
        notes: lead.notes,
        source: lead.source,
        assigned_agent: lead.assigned_agent,
        next_followup: lead.next_followup,
        last_contact: lead.last_contact
      };
    });
  },

  // Mock conversations - returns 4 full conversations
  getMockConversations() {
    const conversations = [];
    mockConversations.forEach(conv => {
      conv.messages.forEach(msg => {
        conversations.push({
          id: msg.id,
          lead_id: conv.lead_id,
          message_content: msg.content,
          message_type: msg.sender === 'lead' ? 'inbound' : 'outbound',
          timestamp: msg.timestamp,
          status: msg.status,
          created_at: msg.timestamp,
          updated_at: msg.timestamp
        });
      });
    });
    return conversations;
  },

  // Mock templates - returns 6 message templates
  getMockTemplates() {
    return mockTemplates;
  },

  // Mock calendar bookings - returns 7 meetings
  getMockCalendarBookings() {
    return mockCalendarBookings;
  },

  // Mock reports
  getMockReports() {
    return mockReports;
  },

  // Mock analytics
  getMockAnalytics() {
    return mockAnalytics;
  },

  // Mock client memberships
  getMockClientMemberships(userId: string) {
    return [
      {
        id: 'mock-membership-1',
        client_id: 'mock-client-1',
        user_id: userId,
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ];
  },

  // Mock dashboard stats - using analytics data
  getMockDashboardStats() {
    const { overview } = mockAnalytics;
    return {
      totalProjects: 2,
      totalLeads: overview.total_leads,
      totalClients: 1,
      totalConversations: 4,
      activeProjects: 2,
      activeLeads: overview.qualified_leads,
      leadsByStatus: {
        new: mockLeads.filter(l => l.status === 'new').length,
        qualified: mockLeads.filter(l => l.status === 'qualified').length,
        nurturing: mockLeads.filter(l => l.status === 'nurturing').length,
        'meeting-scheduled': mockLeads.filter(l => l.status === 'meeting-scheduled').length,
        disqualified: mockLeads.filter(l => l.status === 'disqualified').length
      },
      leadsByTemperature: {
        cold: mockLeads.filter(l => l.bant_score < 50).length,
        warm: mockLeads.filter(l => l.bant_score >= 50 && l.bant_score < 75).length,
        hot: mockLeads.filter(l => l.bant_score >= 75).length
      },
      recentActivity: [
        {
          type: 'meeting_scheduled',
          message: 'Meeting scheduled with David Park',
          timestamp: '2024-01-22T14:15:00Z'
        },
        {
          type: 'lead_qualified',
          message: 'Sarah Johnson qualified with BANT score 85',
          timestamp: '2024-01-20T10:47:00Z'
        },
        {
          type: 'conversation_started',
          message: 'New conversation with Emily Rodriguez',
          timestamp: '2024-01-22T09:15:00Z'
        }
      ]
    };
  }
}; 