// 🎭 OVENAI CRM - PORTFOLIO DEMO MOCK DATA
// This file contains sanitized, hardcoded data for demonstration purposes
// All data is fictional and for portfolio showcase only

export const mockLeads = [
  {
    id: 'lead-001',
    name: 'Sarah Johnson',
    company: 'TechStart Solutions',
    phone: '+1-555-0101',
    email: 'sarah.j@techstart.demo',
    status: 'qualified',
    bant_score: 85,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'CRM Automation',
    timeline: '1-3 months',
    last_contact: '2024-01-20T10:30:00Z',
    next_followup: '2024-01-25T14:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['enterprise', 'hot-lead', 'demo-scheduled'],
    notes: 'Very interested in AI automation features. Demo scheduled for next week.'
  },
  {
    id: 'lead-002',
    name: 'Michael Chen',
    company: 'Growth Marketing Co',
    phone: '+1-555-0102',
    email: 'mchen@growthmarket.demo',
    status: 'nurturing',
    bant_score: 62,
    budget: 'Medium ($10k-$50k)',
    authority: 'Influencer',
    need: 'Lead Management',
    timeline: '3-6 months',
    last_contact: '2024-01-18T15:45:00Z',
    next_followup: '2024-01-30T11:00:00Z',
    assigned_agent: 'Agent B',
    tags: ['mid-market', 'warm-lead'],
    notes: 'Needs to consult with team before moving forward.'
  },
  {
    id: 'lead-003',
    name: 'Emily Rodriguez',
    company: 'Innovate Labs',
    phone: '+1-555-0103',
    email: 'emily@innovatelabs.demo',
    status: 'new',
    bant_score: 45,
    budget: 'Unknown',
    authority: 'Unknown',
    need: 'General Inquiry',
    timeline: 'Unknown',
    last_contact: '2024-01-22T09:15:00Z',
    next_followup: '2024-01-23T10:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['new', 'needs-qualification'],
    notes: 'Initial contact made via WhatsApp. Gathering requirements.'
  },
  {
    id: 'lead-004',
    name: 'David Park',
    company: 'Enterprise Systems Inc',
    phone: '+1-555-0104',
    email: 'dpark@entsystems.demo',
    status: 'meeting-scheduled',
    bant_score: 92,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'WhatsApp Business Integration',
    timeline: 'Immediate (<1 month)',
    last_contact: '2024-01-21T16:20:00Z',
    next_followup: '2024-01-24T13:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['enterprise', 'hot-lead', 'high-priority'],
    notes: 'Calendly meeting booked for demo presentation. Very qualified lead.'
  },
  {
    id: 'lead-005',
    name: 'Lisa Thompson',
    company: 'Small Biz Consulting',
    phone: '+1-555-0105',
    email: 'lisa@smallbizconsult.demo',
    status: 'disqualified',
    bant_score: 28,
    budget: 'Low (<$10k)',
    authority: 'Individual Contributor',
    need: 'Basic CRM',
    timeline: '>6 months',
    last_contact: '2024-01-15T11:30:00Z',
    next_followup: null,
    assigned_agent: 'Agent B',
    tags: ['small-business', 'budget-constraint'],
    notes: 'Budget too low for our solution. Referred to alternative providers.'
  },
  {
    id: 'lead-006',
    name: 'James Wilson',
    company: 'Digital Dynamics',
    phone: '+1-555-0106',
    email: 'jwilson@digitaldynamics.demo',
    status: 'qualified',
    bant_score: 78,
    budget: 'Medium ($10k-$50k)',
    authority: 'Decision Maker',
    need: 'Sales Automation',
    timeline: '1-3 months',
    last_contact: '2024-01-19T14:00:00Z',
    next_followup: '2024-01-26T15:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['mid-market', 'qualified'],
    notes: 'Strong fit. Reviewing proposal with finance team.'
  },
  {
    id: 'lead-007',
    name: 'Maria Garcia',
    company: 'FutureTech Ventures',
    phone: '+1-555-0107',
    email: 'mgarcia@futuretech.demo',
    status: 'nurturing',
    bant_score: 55,
    budget: 'Medium ($10k-$50k)',
    authority: 'Influencer',
    need: 'Customer Engagement',
    timeline: '3-6 months',
    last_contact: '2024-01-17T10:45:00Z',
    next_followup: '2024-01-29T12:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['startup', 'nurture'],
    notes: 'Interested but waiting for next funding round.'
  },
  {
    id: 'lead-008',
    name: 'Robert Kim',
    company: 'Global Solutions Ltd',
    phone: '+1-555-0108',
    email: 'rkim@globalsolutions.demo',
    status: 'meeting-scheduled',
    bant_score: 88,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Enterprise CRM',
    timeline: 'Immediate (<1 month)',
    last_contact: '2024-01-22T13:30:00Z',
    next_followup: '2024-01-25T10:00:00Z',
    assigned_agent: 'Agent B',
    tags: ['enterprise', 'hot-lead', 'demo-scheduled'],
    notes: 'C-level meeting scheduled. Prepare custom demo.'
  },
  {
    id: 'lead-009',
    name: 'Jennifer Lee',
    company: 'Creative Agency Pro',
    phone: '+1-555-0109',
    email: 'jlee@creativeagency.demo',
    status: 'new',
    bant_score: 40,
    budget: 'Unknown',
    authority: 'Unknown',
    need: 'Client Management',
    timeline: 'Unknown',
    last_contact: '2024-01-22T16:00:00Z',
    next_followup: '2024-01-24T09:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['new', 'creative-industry'],
    notes: 'First WhatsApp conversation initiated. Needs follow-up.'
  },
  {
    id: 'lead-010',
    name: 'Thomas Anderson',
    company: 'Matrix Technologies',
    phone: '+1-555-0110',
    email: 'tanderson@matrix.demo',
    status: 'qualified',
    bant_score: 82,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'AI-Powered Automation',
    timeline: '1-3 months',
    last_contact: '2024-01-20T12:00:00Z',
    next_followup: '2024-01-27T14:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['enterprise', 'ai-focused', 'technical'],
    notes: 'Very technical buyer. Impressed by AI capabilities.'
  }
];

export const mockConversations = [
  {
    lead_id: 'lead-001',
    lead_name: 'Sarah Johnson',
    messages: [
      {
        id: 'msg-001',
        sender: 'lead',
        timestamp: '2024-01-20T10:30:00Z',
        content: 'Hi! I saw your website and I\'m interested in learning more about your CRM solution.',
        status: 'delivered'
      },
      {
        id: 'msg-002',
        sender: 'agent',
        timestamp: '2024-01-20T10:32:00Z',
        content: 'Hello Sarah! Thanks for reaching out. I\'d be happy to help. Can you tell me a bit about your current challenges with customer management?',
        status: 'read'
      },
      {
        id: 'msg-003',
        sender: 'lead',
        timestamp: '2024-01-20T10:35:00Z',
        content: 'We\'re using spreadsheets right now and it\'s becoming unmanageable. We need automation for WhatsApp communication especially.',
        status: 'delivered'
      },
      {
        id: 'msg-004',
        sender: 'agent',
        timestamp: '2024-01-20T10:37:00Z',
        content: 'That\'s exactly what we specialize in! Our system achieved 70% response rates with automated WhatsApp integration. What\'s your typical monthly lead volume?',
        status: 'read'
      },
      {
        id: 'msg-005',
        sender: 'lead',
        timestamp: '2024-01-20T10:40:00Z',
        content: 'About 200-300 leads per month. What would something like this cost?',
        status: 'delivered'
      },
      {
        id: 'msg-006',
        sender: 'agent',
        timestamp: '2024-01-20T10:42:00Z',
        content: 'For your volume, we have enterprise packages starting at $50k annually. Would you like to schedule a demo to see it in action?',
        status: 'read'
      },
      {
        id: 'msg-007',
        sender: 'lead',
        timestamp: '2024-01-20T10:45:00Z',
        content: 'Yes, that budget works for us. Let\'s schedule something for next week.',
        status: 'delivered'
      },
      {
        id: 'msg-008',
        sender: 'agent',
        timestamp: '2024-01-20T10:47:00Z',
        content: 'Perfect! I\'ll send you a Calendly link. Looking forward to showing you what we can do! 🎯',
        status: 'read'
      }
    ],
    bant_analysis: {
      budget: 'QUALIFIED - Confirmed $50k+ budget available',
      authority: 'QUALIFIED - Decision maker role confirmed',
      need: 'QUALIFIED - Clear pain point with current manual process',
      timeline: 'QUALIFIED - Ready to move within 1-3 months',
      overall_score: 85,
      recommendation: 'High-priority qualified lead. Schedule demo ASAP.'
    }
  },
  {
    lead_id: 'lead-004',
    lead_name: 'David Park',
    messages: [
      {
        id: 'msg-101',
        sender: 'lead',
        timestamp: '2024-01-21T16:20:00Z',
        content: 'Our company needs WhatsApp Business integration yesterday. Can you help?',
        status: 'delivered'
      },
      {
        id: 'msg-102',
        sender: 'agent',
        timestamp: '2024-01-21T16:21:00Z',
        content: 'Absolutely! We specialize in WhatsApp Business API integration. Tell me more about your use case.',
        status: 'read'
      },
      {
        id: 'msg-103',
        sender: 'lead',
        timestamp: '2024-01-21T16:25:00Z',
        content: 'We have 500+ incoming leads per day. Manual handling is killing us. We need AI automation.',
        status: 'delivered'
      },
      {
        id: 'msg-104',
        sender: 'agent',
        timestamp: '2024-01-21T16:27:00Z',
        content: 'We\'ve handled 100+ leads per day per agent with our system. Our AI handles initial qualification automatically. What\'s your decision timeline?',
        status: 'read'
      },
      {
        id: 'msg-105',
        sender: 'lead',
        timestamp: '2024-01-21T16:30:00Z',
        content: 'We need to decide this month. I\'m the VP of Sales and have budget approval. Can we meet this week?',
        status: 'delivered'
      },
      {
        id: 'msg-106',
        sender: 'agent',
        timestamp: '2024-01-21T16:32:00Z',
        content: 'Perfect! Yes, I have availability tomorrow at 1pm or Thursday at 10am. Which works better?',
        status: 'read'
      },
      {
        id: 'msg-107',
        sender: 'lead',
        timestamp: '2024-01-21T16:33:00Z',
        content: 'Tomorrow at 1pm works. Send me the details.',
        status: 'delivered'
      }
    ],
    bant_analysis: {
      budget: 'QUALIFIED - VP level with budget authority',
      authority: 'QUALIFIED - VP of Sales, decision maker',
      need: 'QUALIFIED - Critical pain point, 500+ leads/day',
      timeline: 'QUALIFIED - Immediate need, deciding this month',
      overall_score: 92,
      recommendation: 'URGENT: Highest priority lead. Prepare custom demo.'
    }
  },
  {
    lead_id: 'lead-003',
    lead_name: 'Emily Rodriguez',
    messages: [
      {
        id: 'msg-201',
        sender: 'lead',
        timestamp: '2024-01-22T09:15:00Z',
        content: 'Hey, what does your CRM do?',
        status: 'delivered'
      },
      {
        id: 'msg-202',
        sender: 'agent',
        timestamp: '2024-01-22T09:20:00Z',
        content: 'Hi Emily! Our CRM specializes in AI-powered WhatsApp automation for lead management. What challenges are you facing with your current setup?',
        status: 'read'
      },
      {
        id: 'msg-203',
        sender: 'lead',
        timestamp: '2024-01-22T09:45:00Z',
        content: 'Just exploring options right now. Don\'t have a specific timeline.',
        status: 'delivered'
      },
      {
        id: 'msg-204',
        sender: 'agent',
        timestamp: '2024-01-22T09:50:00Z',
        content: 'No problem! I\'d love to learn more about your needs. What size is your team and how many leads do you typically handle?',
        status: 'sent'
      }
    ],
    bant_analysis: {
      budget: 'UNKNOWN - No budget discussion yet',
      authority: 'UNKNOWN - Role not established',
      need: 'UNKNOWN - General inquiry, no specific pain point',
      timeline: 'UNKNOWN - No timeline mentioned',
      overall_score: 45,
      recommendation: 'Early stage. Continue nurturing and qualification.'
    }
  }
];

export const mockAnalytics = {
  overview: {
    total_leads: 247,
    qualified_leads: 89,
    meetings_scheduled: 34,
    response_rate: 70,
    avg_response_time: '2.5 hours',
    conversion_rate: 36
  },
  monthly_trends: [
    { month: 'Jul', leads: 45, qualified: 18, meetings: 7 },
    { month: 'Aug', leads: 62, qualified: 24, meetings: 10 },
    { month: 'Sep', leads: 78, qualified: 31, meetings: 12 },
    { month: 'Oct', leads: 95, qualified: 38, meetings: 15 },
    { month: 'Nov', leads: 112, qualified: 45, meetings: 18 },
    { month: 'Dec', leads: 134, qualified: 52, meetings: 21 },
    { month: 'Jan', leads: 247, qualified: 89, meetings: 34 }
  ],
  lead_sources: [
    { source: 'WhatsApp Inbound', count: 89, percentage: 36 },
    { source: 'Website Contact', count: 67, percentage: 27 },
    { source: 'Referral', count: 45, percentage: 18 },
    { source: 'LinkedIn', count: 31, percentage: 13 },
    { source: 'Other', count: 15, percentage: 6 }
  ],
  bant_distribution: [
    { score_range: '0-25', count: 28, label: 'Unqualified' },
    { score_range: '26-50', count: 45, label: 'Low' },
    { score_range: '51-75', count: 85, label: 'Medium' },
    { score_range: '76-100', count: 89, label: 'High' }
  ],
  agent_performance: [
    { agent: 'Agent A', leads_handled: 98, meetings_booked: 15, avg_response_time: '2.1h' },
    { agent: 'Agent B', leads_handled: 87, meetings_booked: 12, avg_response_time: '2.8h' },
    { agent: 'Agent C', leads_handled: 62, meetings_booked: 7, avg_response_time: '3.2h' }
  ]
};

export const mockCalendarBookings = [
  {
    id: 'booking-001',
    lead_name: 'Sarah Johnson',
    lead_company: 'TechStart Solutions',
    meeting_type: 'Product Demo',
    scheduled_time: '2024-01-25T14:00:00Z',
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/abc123',
    notes: 'Focus on WhatsApp automation features'
  },
  {
    id: 'booking-002',
    lead_name: 'David Park',
    lead_company: 'Enterprise Systems Inc',
    meeting_type: 'Executive Demo',
    scheduled_time: '2024-01-24T13:00:00Z',
    duration: 90,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/xyz789',
    notes: 'VP of Sales attending. Prepare custom presentation'
  },
  {
    id: 'booking-003',
    lead_name: 'Robert Kim',
    lead_company: 'Global Solutions Ltd',
    meeting_type: 'Product Demo',
    scheduled_time: '2024-01-25T10:00:00Z',
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/def456',
    notes: 'C-level meeting. High priority'
  },
  {
    id: 'booking-004',
    lead_name: 'James Wilson',
    lead_company: 'Digital Dynamics',
    meeting_type: 'Follow-up Call',
    scheduled_time: '2024-01-26T15:00:00Z',
    duration: 30,
    status: 'pending',
    meeting_link: 'https://meet.demo/ghi789',
    notes: 'Discuss proposal and pricing'
  },
  {
    id: 'booking-005',
    lead_name: 'Thomas Anderson',
    lead_company: 'Matrix Technologies',
    meeting_type: 'Technical Deep Dive',
    scheduled_time: '2024-01-27T14:00:00Z',
    duration: 90,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/jkl012',
    notes: 'Technical buyer. Focus on AI architecture'
  }
];

export const mockUserProfile = {
  name: 'Demo Agent',
  role: 'Sales Agent',
  email: 'demo@ovenai.example',
  avatar: null,
  stats: {
    total_leads: 98,
    qualified_leads: 38,
    meetings_booked: 15,
    avg_bant_score: 68,
    response_rate: 72
  },
  preferences: {
    notifications: true,
    auto_assign: true,
    theme: 'light'
  }
};

// Helper function to simulate API delay
export const simulateApiDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API functions
export const mockApi = {
  getLeads: async (filters = {}) => {
    await simulateApiDelay();
    let filtered = [...mockLeads];
    
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }
    if (filters.agent) {
      filtered = filtered.filter(lead => lead.assigned_agent === filters.agent);
    }
    
    return { data: filtered, total: filtered.length };
  },
  
  getLead: async (leadId) => {
    await simulateApiDelay();
    const lead = mockLeads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');
    return { data: lead };
  },
  
  getConversation: async (leadId) => {
    await simulateApiDelay();
    const conversation = mockConversations.find(c => c.lead_id === leadId);
    return { data: conversation || { lead_id: leadId, messages: [], bant_analysis: null } };
  },
  
  getAnalytics: async () => {
    await simulateApiDelay();
    return { data: mockAnalytics };
  },
  
  getCalendarBookings: async () => {
    await simulateApiDelay();
    return { data: mockCalendarBookings };
  },
  
  getUserProfile: async () => {
    await simulateApiDelay();
    return { data: mockUserProfile };
  }
};

export default {
  mockLeads,
  mockConversations,
  mockAnalytics,
  mockCalendarBookings,
  mockUserProfile,
  mockApi
};

