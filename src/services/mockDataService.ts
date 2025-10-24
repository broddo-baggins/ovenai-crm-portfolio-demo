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
  // Mock projects - returns 2 comprehensive projects
  getMockProjects() {
    return mockProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      client_id: project.lead_id,
      status: project.status,
      created_at: project.start_date,
      updated_at: project.start_date,
      client: {
        id: project.lead_id,
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
        temperature: lead.bant_score >= 75 ? 'hot' : lead.bant_score >= 50 ? 'warm' : 'cold',
        current_project_id: 'mock-project-1',
        project_id: 'mock-project-1',
        created_at: lead.created_at || lead.last_contact,
        updated_at: lead.last_contact,
        bant_budget: lead.budget !== 'Unknown',
        bant_authority: lead.authority === 'Decision Maker',
        bant_need: lead.need !== 'General Inquiry',
        bant_timeline: lead.timeline !== 'Unknown',
        bant_score: Math.round(lead.bant_score / 25), // Convert 0-100 to 0-4 scale
        tags: lead.tags,
        notes: lead.notes,
        source: lead.source,
        assigned_agent: lead.assigned_agent,
        next_followup: lead.next_followup
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