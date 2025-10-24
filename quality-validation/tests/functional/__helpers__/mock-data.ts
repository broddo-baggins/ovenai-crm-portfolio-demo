// Mock data for testing components
export const mockLeads = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+1-555-0123',
    status: 'new',
    state: 'new_lead',
    notes: 'Interested in premium package',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    lead_metadata: {
      ai_analysis: {
        lead_qualification: {
          confidence_score: 0.7
        }
      }
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+1-555-0124',
    status: 'contacted',
    state: 'contacted',
    notes: 'Follow up next week',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-16T09:15:00Z',
    lead_metadata: {
      ai_analysis: {
        lead_qualification: {
          confidence_score: 0.85
        }
      }
    }
  },
  {
    id: '3',
    name: 'Ahmad Al-Rahman',
    phone: '+972-50-555-0125',
    status: 'qualified',
    state: 'qualified',
    notes: 'RTL text testing - מעוניין בפתרון מקצועי',
    created_at: '2024-01-13T16:45:00Z',
    updated_at: '2024-01-17T11:30:00Z',
    lead_metadata: {
      ai_analysis: {
        lead_qualification: {
          confidence_score: 0.95
        }
      }
    }
  },
];

export const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    status: 'in-progress',
    priority: 'high',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-18T16:20:00Z',
    lead_id: '1',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    status: 'planning',
    priority: 'medium',
    created_at: '2024-01-12T10:15:00Z',
    updated_at: '2024-01-17T14:45:00Z',
    lead_id: '2',
  },
];

export const mockMessages = [
  {
    id: '1',
    content: 'Hello! I am interested in your services.',
    sender: 'John Doe',
    senderId: 'lead-1',
    timestamp: '2024-01-18T09:30:00Z',
    senderAvatar: '/avatars/john-doe.jpg',
  },
  {
    id: '2',
    content: 'Thank you for your interest! I will send you more details.',
    sender: 'Agent',
    senderId: 'current-user',
    timestamp: '2024-01-18T09:35:00Z',
    senderAvatar: '/avatars/agent.jpg',
  },
  {
    id: '3',
    content: 'مرحبا! أنا مهتم بخدماتكم المميزة',
    sender: 'Ahmad Al-Rahman',
    senderId: 'lead-3',
    timestamp: '2024-01-18T10:15:00Z',
    senderAvatar: '/avatars/ahmad.jpg',
  },
];

export const mockCalendarEvents = [
  {
    id: '1',
    title: 'Client Meeting - John Doe',
    start: new Date(2024, 0, 20, 10, 0),
    end: new Date(2024, 0, 20, 11, 0),
    type: 'meeting',
  },
  {
    id: '2',
    title: 'Follow-up Call - Jane Smith',
    start: new Date(2024, 0, 21, 14, 30),
    end: new Date(2024, 0, 21, 15, 0),
    type: 'call',
  },
  {
    id: '3',
    title: 'Project Deadline - Website Redesign',
    start: new Date(2024, 0, 25, 17, 0),
    end: new Date(2024, 0, 25, 17, 30),
    type: 'deadline',
  },
];

export const mockDashboardStats = [
  {
    title: 'Total Leads',
    value: '2,847',
    trend: 12.5,
    description: '+12.5% from last month',
  },
  {
    title: 'Conversion Rate',
    value: '18.2%',
    trend: -2.3,
    description: '-2.3% from last month', 
  },
  {
    title: 'Active Projects',
    value: '24',
    trend: 8.1,
    description: '+8.1% from last month',
  },
  {
    title: 'Revenue',
    value: '$124,580',
    trend: 15.7,
    description: '+15.7% from last month',
  },
];

export const mockChartData = [
  { month: 'Jan', sales: 65000, leads: 120 },
  { month: 'Feb', sales: 78000, leads: 145 },
  { month: 'Mar', sales: 82000, leads: 160 },
  { month: 'Apr', sales: 95000, leads: 180 },
  { month: 'May', sales: 88000, leads: 155 },
  { month: 'Jun', sales: 112000, leads: 200 },
];

export const mockUser = {
  id: 'current-user',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  avatar: '/avatars/admin.jpg',
}; 