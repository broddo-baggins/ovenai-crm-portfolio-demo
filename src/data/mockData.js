// CRM DEMO - PORTFOLIO MOCK DATA
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
    notes: 'Very interested in AI automation features. Demo scheduled for next week.',
    source: 'WhatsApp Inbound',
    created_at: '2024-01-15T09:00:00Z',
    project_id: 'project-001',
    current_project_id: 'project-001'
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
    notes: 'Needs to consult with team before moving forward.',
    source: 'Website Contact',
    created_at: '2024-01-12T14:20:00Z'
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
    notes: 'Initial contact made via WhatsApp. Gathering requirements.',
    source: 'WhatsApp Inbound',
    created_at: '2024-01-22T09:00:00Z'
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
    notes: 'Calendly meeting booked for demo presentation. Very qualified lead.',
    source: 'Referral',
    created_at: '2024-01-20T08:00:00Z'
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
    notes: 'Budget too low for our solution. Referred to alternative providers.',
    source: 'LinkedIn',
    created_at: '2024-01-10T10:00:00Z'
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
    notes: 'Strong fit. Reviewing proposal with finance team.',
    source: 'Website Contact',
    created_at: '2024-01-16T11:00:00Z'
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
    notes: 'Interested but waiting for next funding round.',
    source: 'LinkedIn',
    created_at: '2024-01-14T13:30:00Z'
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
    notes: 'C-level meeting scheduled. Prepare custom demo.',
    source: 'WhatsApp Inbound',
    created_at: '2024-01-19T09:15:00Z'
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
    notes: 'First WhatsApp conversation initiated. Needs follow-up.',
    source: 'Referral',
    created_at: '2024-01-22T15:45:00Z'
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
    notes: 'Very technical buyer. Impressed by AI capabilities.',
    source: 'LinkedIn',
    created_at: '2024-01-18T10:30:00Z'
  },
  {
    id: 'lead-011',
    name: 'Alexandra Martinez',
    company: 'CloudScale Inc',
    phone: '+1-555-0111',
    email: 'amartinez@cloudscale.demo',
    status: 'qualified',
    bant_score: 75,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Sales Pipeline Management',
    timeline: '1-3 months',
    last_contact: '2024-01-21T11:20:00Z',
    next_followup: '2024-01-28T10:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['enterprise', 'saas', 'pipeline-focused'],
    notes: 'Director of Sales Operations. Looking for comprehensive solution.',
    source: 'Website Contact',
    created_at: '2024-01-17T09:00:00Z'
  },
  {
    id: 'lead-012',
    name: 'Kevin O\'Brien',
    company: 'FinTech Solutions',
    phone: '+1-555-0112',
    email: 'kobrien@fintech.demo',
    status: 'meeting-scheduled',
    bant_score: 90,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Compliance-Ready CRM',
    timeline: 'Immediate (<1 month)',
    last_contact: '2024-01-22T14:15:00Z',
    next_followup: '2024-01-25T15:00:00Z',
    assigned_agent: 'Agent B',
    tags: ['enterprise', 'fintech', 'compliance-focused'],
    notes: 'CTO attending meeting. Needs security and compliance discussion.',
    source: 'Referral',
    created_at: '2024-01-21T08:30:00Z'
  },
  {
    id: 'lead-013',
    name: 'Nina Patel',
    company: 'EcoCommerce Ltd',
    phone: '+1-555-0113',
    email: 'npatel@ecocommerce.demo',
    status: 'nurturing',
    bant_score: 58,
    budget: 'Medium ($10k-$50k)',
    authority: 'Influencer',
    need: 'Customer Communication',
    timeline: '3-6 months',
    last_contact: '2024-01-19T16:30:00Z',
    next_followup: '2024-01-31T11:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['ecommerce', 'sustainability', 'warm-lead'],
    notes: 'Growing fast. Will revisit after Q1 results.',
    source: 'LinkedIn',
    created_at: '2024-01-15T14:00:00Z'
  },
  {
    id: 'lead-014',
    name: 'Marcus Johnson',
    company: 'Real Estate Pro Group',
    phone: '+1-555-0114',
    email: 'mjohnson@realestatepro.demo',
    status: 'qualified',
    bant_score: 80,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Lead Follow-up Automation',
    timeline: '1-3 months',
    last_contact: '2024-01-20T15:00:00Z',
    next_followup: '2024-01-27T13:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['real-estate', 'hot-lead', 'automation-focused'],
    notes: 'Managing partner. Loves the 70% response rate metric.',
    source: 'WhatsApp Inbound',
    created_at: '2024-01-19T12:00:00Z'
  },
  {
    id: 'lead-015',
    name: 'Sophia Chen',
    company: 'DataDriven Analytics',
    phone: '+1-555-0115',
    email: 'schen@datadriven.demo',
    status: 'new',
    bant_score: 48,
    budget: 'Unknown',
    authority: 'Unknown',
    need: 'Data Integration',
    timeline: 'Unknown',
    last_contact: '2024-01-23T10:00:00Z',
    next_followup: '2024-01-24T14:00:00Z',
    assigned_agent: 'Agent B',
    tags: ['new', 'data-analytics', 'technical'],
    notes: 'Initial outreach. Wants to understand API capabilities.',
    source: 'Website Contact',
    created_at: '2024-01-23T09:45:00Z'
  },
  {
    id: 'lead-016',
    name: 'Daniel Brown',
    company: 'HealthCare Connect',
    phone: '+1-555-0116',
    email: 'dbrown@healthcareconnect.demo',
    status: 'qualified',
    bant_score: 72,
    budget: 'Medium ($10k-$50k)',
    authority: 'Decision Maker',
    need: 'Patient Communication',
    timeline: '1-3 months',
    last_contact: '2024-01-21T09:30:00Z',
    next_followup: '2024-01-28T11:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['healthcare', 'hipaa', 'qualified'],
    notes: 'Practice manager. Needs HIPAA-compliant solution.',
    source: 'Referral',
    created_at: '2024-01-18T13:00:00Z'
  },
  {
    id: 'lead-017',
    name: 'Rachel Green',
    company: 'Fashion Forward',
    phone: '+1-555-0117',
    email: 'rgreen@fashionforward.demo',
    status: 'nurturing',
    bant_score: 52,
    budget: 'Medium ($10k-$50k)',
    authority: 'Influencer',
    need: 'Customer Engagement',
    timeline: '3-6 months',
    last_contact: '2024-01-18T13:45:00Z',
    next_followup: '2024-02-01T10:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['retail', 'fashion', 'nurture'],
    notes: 'Marketing director. Needs buy-in from operations.',
    source: 'LinkedIn',
    created_at: '2024-01-16T10:00:00Z'
  },
  {
    id: 'lead-018',
    name: 'Christopher Lee',
    company: 'Legal Partners LLC',
    phone: '+1-555-0118',
    email: 'clee@legalpartners.demo',
    status: 'new',
    bant_score: 42,
    budget: 'Unknown',
    authority: 'Unknown',
    need: 'Client Management',
    timeline: 'Unknown',
    last_contact: '2024-01-23T11:15:00Z',
    next_followup: '2024-01-25T09:00:00Z',
    assigned_agent: 'Agent B',
    tags: ['new', 'legal', 'exploring'],
    notes: 'Law firm administrator. Just starting research phase.',
    source: 'Website Contact',
    created_at: '2024-01-23T11:00:00Z'
  },
  {
    id: 'lead-019',
    name: 'Olivia Taylor',
    company: 'EdTech Innovations',
    phone: '+1-555-0119',
    email: 'otaylor@edtech.demo',
    status: 'meeting-scheduled',
    bant_score: 84,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Student Communication Platform',
    timeline: 'Immediate (<1 month)',
    last_contact: '2024-01-22T10:00:00Z',
    next_followup: '2024-01-26T14:00:00Z',
    assigned_agent: 'Agent C',
    tags: ['education', 'enterprise', 'urgent'],
    notes: 'COO. Needs solution before new semester starts.',
    source: 'Referral',
    created_at: '2024-01-21T15:00:00Z'
  },
  {
    id: 'lead-020',
    name: 'Benjamin Wright',
    company: 'Supply Chain Masters',
    phone: '+1-555-0120',
    email: 'bwright@supplychainmasters.demo',
    status: 'qualified',
    bant_score: 76,
    budget: 'High (>$50k)',
    authority: 'Decision Maker',
    need: 'Vendor Communication',
    timeline: '1-3 months',
    last_contact: '2024-01-20T14:30:00Z',
    next_followup: '2024-01-29T10:00:00Z',
    assigned_agent: 'Agent A',
    tags: ['logistics', 'b2b', 'qualified'],
    notes: 'VP of Operations. Interested in multi-channel communication.',
    source: 'WhatsApp Inbound',
    created_at: '2024-01-19T16:00:00Z'
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
        content: 'Perfect! I\'ll send you a Calendly link. Looking forward to showing you what we can do!',
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
      },
      {
        id: 'msg-108',
        sender: 'agent',
        timestamp: '2024-01-21T16:35:00Z',
        content: 'Meeting confirmed for tomorrow at 1pm. I\'ll email you the Zoom link and agenda. Looking forward to it!',
        status: 'read'
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
  },
  {
    lead_id: 'lead-012',
    lead_name: 'Kevin O\'Brien',
    messages: [
      {
        id: 'msg-301',
        sender: 'lead',
        timestamp: '2024-01-22T14:15:00Z',
        content: 'We\'re a FinTech company and need a CRM that meets SOC 2 and GDPR requirements. Do you have this?',
        status: 'delivered'
      },
      {
        id: 'msg-302',
        sender: 'agent',
        timestamp: '2024-01-22T14:17:00Z',
        content: 'Yes absolutely! We\'re SOC 2 Type II certified and fully GDPR compliant. Security and compliance are core to our platform.',
        status: 'read'
      },
      {
        id: 'msg-303',
        sender: 'lead',
        timestamp: '2024-01-22T14:20:00Z',
        content: 'Great. We process 300+ customer inquiries daily. Need automated responses but must maintain audit trails for compliance.',
        status: 'delivered'
      },
      {
        id: 'msg-304',
        sender: 'agent',
        timestamp: '2024-01-22T14:22:00Z',
        content: 'Perfect fit. Our system logs every interaction with timestamps, user IDs, and maintains immutable audit trails. Can I show you a demo?',
        status: 'read'
      },
      {
        id: 'msg-305',
        sender: 'lead',
        timestamp: '2024-01-22T14:25:00Z',
        content: 'Yes, our CTO wants to attend. We need to implement by end of month due to regulatory deadline.',
        status: 'delivered'
      },
      {
        id: 'msg-306',
        sender: 'agent',
        timestamp: '2024-01-22T14:27:00Z',
        content: 'Understood. I can do an expedited demo and technical deep dive. How about Thursday at 3pm for you and your CTO?',
        status: 'read'
      },
      {
        id: 'msg-307',
        sender: 'lead',
        timestamp: '2024-01-22T14:28:00Z',
        content: 'Thursday works. Send the calendar invite. Also, what\'s the budget range for 300 daily interactions?',
        status: 'delivered'
      },
      {
        id: 'msg-308',
        sender: 'agent',
        timestamp: '2024-01-22T14:30:00Z',
        content: 'For your volume with enterprise compliance features, we\'re looking at $60-75k annually. I\'ll prepare detailed pricing for Thursday. Meeting invite coming now.',
        status: 'read'
      },
      {
        id: 'msg-309',
        sender: 'lead',
        timestamp: '2024-01-22T14:32:00Z',
        content: 'Perfect. Budget is approved up to $100k if it solves our compliance gap. See you Thursday.',
        status: 'delivered'
      }
    ],
    bant_analysis: {
      budget: 'QUALIFIED - $100k budget approved, exceeds our pricing',
      authority: 'QUALIFIED - CTO attending, decision maker confirmed',
      need: 'QUALIFIED - Critical compliance requirement with deadline',
      timeline: 'QUALIFIED - Must implement by end of month',
      overall_score: 90,
      recommendation: 'URGENT: Compliance-driven deal with budget approved. High priority close.'
    }
  }
];

export const mockProjects = [
  {
    id: 'project-001',
    name: 'TechStart Solutions - Enterprise Rollout',
    client: 'TechStart Solutions',
    lead_id: 'lead-001',
    status: 'in-progress',
    start_date: '2024-01-15T00:00:00Z',
    estimated_completion: '2024-03-15T00:00:00Z',
    value: '$75,000',
    team: ['Agent A', 'Implementation Team'],
    progress: 35,
    milestones: [
      { name: 'Requirements Gathering', status: 'completed', date: '2024-01-20' },
      { name: 'System Configuration', status: 'in-progress', date: '2024-02-01' },
      { name: 'Data Migration', status: 'pending', date: '2024-02-15' },
      { name: 'Training', status: 'pending', date: '2024-03-01' },
      { name: 'Go Live', status: 'pending', date: '2024-03-15' }
    ],
    description: 'Full CRM implementation with WhatsApp integration for 200-300 monthly leads',
    notes: 'Client very engaged. Weekly sync meetings going well.'
  },
  {
    id: 'project-002',
    name: 'Enterprise Systems - WhatsApp API Integration',
    client: 'Enterprise Systems Inc',
    lead_id: 'lead-004',
    status: 'planning',
    start_date: '2024-02-01T00:00:00Z',
    estimated_completion: '2024-04-01T00:00:00Z',
    value: '$120,000',
    team: ['Agent C', 'Technical Team', 'Integration Specialist'],
    progress: 10,
    milestones: [
      { name: 'Technical Discovery', status: 'in-progress', date: '2024-02-01' },
      { name: 'API Setup', status: 'pending', date: '2024-02-10' },
      { name: 'AI Configuration', status: 'pending', date: '2024-02-20' },
      { name: 'Integration Testing', status: 'pending', date: '2024-03-10' },
      { name: 'Production Launch', status: 'pending', date: '2024-04-01' }
    ],
    description: 'High-volume WhatsApp Business API integration with AI automation for 500+ daily leads',
    notes: 'VP of Sales championing internally. Fast-track for month-end launch.'
  }
];

export const mockTemplates = [
  {
    id: 'template-001',
    name: 'Initial Contact - General Inquiry',
    category: 'First Contact',
    message: 'Hi {name}! Thanks for reaching out to OvenAI. I\'d love to learn more about your needs. What challenges are you facing with your current lead management process?',
    variables: ['name'],
    usage_count: 234,
    avg_response_rate: 68,
    last_used: '2024-01-23T10:00:00Z'
  },
  {
    id: 'template-002',
    name: 'Budget Qualification',
    category: 'Qualification',
    message: 'Thanks for sharing that, {name}. To ensure I recommend the right solution, what budget range are you working with for this project?',
    variables: ['name'],
    usage_count: 189,
    avg_response_rate: 72,
    last_used: '2024-01-22T15:30:00Z'
  },
  {
    id: 'template-003',
    name: 'Demo Scheduling',
    category: 'Meeting',
    message: 'Great! I\'d love to show you our platform in action. I have availability this week on {day1} at {time1} or {day2} at {time2}. Which works better for you?',
    variables: ['day1', 'time1', 'day2', 'time2'],
    usage_count: 156,
    avg_response_rate: 85,
    last_used: '2024-01-23T09:15:00Z'
  },
  {
    id: 'template-004',
    name: 'Follow-up After No Response',
    category: 'Follow-up',
    message: 'Hi {name}, just checking in! I wanted to make sure you received my previous message about {topic}. Do you have any questions I can help with?',
    variables: ['name', 'topic'],
    usage_count: 312,
    avg_response_rate: 45,
    last_used: '2024-01-23T11:20:00Z'
  },
  {
    id: 'template-005',
    name: 'Meeting Confirmation',
    category: 'Meeting',
    message: 'Perfect! Your demo is confirmed for {date} at {time}. I\'ll send you the meeting link via email. Looking forward to showing you how we achieved 70% response rates!',
    variables: ['date', 'time'],
    usage_count: 98,
    avg_response_rate: 95,
    last_used: '2024-01-22T16:45:00Z'
  },
  {
    id: 'template-006',
    name: 'High-Priority Hot Lead',
    category: 'Qualification',
    message: 'Thanks {name}! Based on what you\'ve shared, it sounds like we\'re a great fit. Given your timeline of {timeline}, I\'d love to fast-track a demo. Are you available tomorrow or Thursday?',
    variables: ['name', 'timeline'],
    usage_count: 76,
    avg_response_rate: 88,
    last_used: '2024-01-21T14:00:00Z'
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
  ],
  weekly_activity: [
    { day: 'Mon', messages_sent: 156, messages_received: 134, meetings: 5 },
    { day: 'Tue', messages_sent: 189, messages_received: 167, meetings: 8 },
    { day: 'Wed', messages_sent: 178, messages_received: 145, meetings: 6 },
    { day: 'Thu', messages_sent: 203, messages_received: 178, meetings: 9 },
    { day: 'Fri', messages_sent: 145, messages_received: 123, meetings: 6 }
  ]
};

// Generate calendar events for the current month with realistic meeting times
const generateCalendarEvents = () => {
  const today = new Date();
  const events = [];
  
  // This week's meetings
  events.push({
    id: 'booking-001',
    lead_name: 'Sarah Johnson',
    lead_company: 'TechStart Solutions',
    lead_id: 'lead-001',
    meeting_type: 'Product Demo',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0).toISOString(),
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/abc123',
    notes: 'Focus on WhatsApp automation features. Customer very interested in 70% response rate metric.',
    attendees: ['sarah.j@techstart.demo', 'agent-a@ovenai.demo'],
    color: '#3b82f6',
    title: 'Product Demo - TechStart Solutions'
  });
  
  events.push({
    id: 'booking-002',
    lead_name: 'David Park',
    lead_company: 'Enterprise Systems Inc',
    lead_id: 'lead-004',
    meeting_type: 'Executive Demo',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
    duration: 90,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/xyz789',
    notes: 'VP of Sales attending. Prepare custom presentation. Budget approved up to $150k.',
    attendees: ['dpark@entsystems.demo', 'vp-sales@entsystems.demo', 'agent-c@ovenai.demo', 'tech-lead@ovenai.demo'],
    color: '#8b5cf6',
    title: 'Executive Demo - Enterprise Systems'
  });
  
  events.push({
    id: 'booking-003',
    lead_name: 'Robert Kim',
    lead_company: 'Global Solutions Ltd',
    lead_id: 'lead-008',
    meeting_type: 'Product Demo',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(),
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/def456',
    notes: 'C-level meeting. High priority. Show AI BANT scoring demo.',
    attendees: ['rkim@globalsolutions.demo', 'ceo@globalsolutions.demo', 'agent-b@ovenai.demo'],
    color: '#10b981',
    title: 'Product Demo - Global Solutions'
  });
  
  events.push({
    id: 'booking-004',
    lead_name: 'James Wilson',
    lead_company: 'Digital Dynamics',
    lead_id: 'lead-006',
    meeting_type: 'Follow-up Call',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0).toISOString(),
    duration: 30,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/ghi789',
    notes: 'Discuss proposal and pricing. Finance team reviewing. Answer ROI questions.',
    attendees: ['jwilson@digitaldynamics.demo', 'agent-a@ovenai.demo'],
    color: '#f59e0b',
    title: 'Follow-up - Digital Dynamics'
  });
  
  events.push({
    id: 'booking-005',
    lead_name: 'Thomas Anderson',
    lead_company: 'Matrix Technologies',
    lead_id: 'lead-010',
    meeting_type: 'Technical Deep Dive',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0).toISOString(),
    duration: 90,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/jkl012',
    notes: 'Technical buyer. Focus on AI architecture, API integrations, and security. Bring technical spec sheet.',
    attendees: ['tanderson@matrix.demo', 'cto@matrix.demo', 'agent-c@ovenai.demo', 'cto@ovenai.demo'],
    color: '#6366f1',
    title: 'Technical Deep Dive - Matrix Technologies'
  });
  
  events.push({
    id: 'booking-006',
    lead_name: 'Kevin O\'Brien',
    lead_company: 'FinTech Solutions',
    lead_id: 'lead-012',
    meeting_type: 'Compliance & Security Demo',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0).toISOString(),
    duration: 90,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/mno345',
    notes: 'CTO attending. Cover SOC 2, GDPR compliance, data encryption, audit trails. Critical regulatory deadline.',
    attendees: ['kobrien@fintech.demo', 'cto@fintech.demo', 'compliance@fintech.demo', 'agent-b@ovenai.demo', 'security@ovenai.demo'],
    color: '#ef4444',
    title: 'Compliance Demo - FinTech Solutions'
  });
  
  events.push({
    id: 'booking-007',
    lead_name: 'Olivia Taylor',
    lead_company: 'EdTech Innovations',
    lead_id: 'lead-019',
    meeting_type: 'Implementation Planning',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 11, 0).toISOString(),
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/pqr678',
    notes: 'COO attending. Needs solution before new semester. Discuss timeline, training, go-live date.',
    attendees: ['otaylor@edtech.demo', 'coo@edtech.demo', 'agent-c@ovenai.demo', 'implementation@ovenai.demo'],
    color: '#ec4899',
    title: 'Implementation Planning - EdTech'
  });
  
  // Next week's meetings
  events.push({
    id: 'booking-008',
    lead_name: 'Alexandra Martinez',
    lead_company: 'CloudScale Inc',
    lead_id: 'lead-011',
    meeting_type: 'Discovery Call',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 10, 0).toISOString(),
    duration: 45,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/stu901',
    notes: 'Director of Sales Ops. Understand current pain points and workflow bottlenecks.',
    attendees: ['amartinez@cloudscale.demo', 'agent-a@ovenai.demo'],
    color: '#14b8a6',
    title: 'Discovery Call - CloudScale'
  });
  
  events.push({
    id: 'booking-009',
    lead_name: 'Marcus Johnson',
    lead_company: 'Real Estate Pro Group',
    lead_id: 'lead-014',
    meeting_type: 'Product Demo',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 13, 30).toISOString(),
    duration: 60,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/vwx234',
    notes: 'Managing partner. Real estate industry specific features. Show lead follow-up automation.',
    attendees: ['mjohnson@realestatepro.demo', 'agent-a@ovenai.demo'],
    color: '#f97316',
    title: 'Product Demo - Real Estate Pro'
  });
  
  events.push({
    id: 'booking-010',
    lead_name: 'Internal Team Sync',
    lead_company: 'OvenAI',
    meeting_type: 'Team Meeting',
    scheduled_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 0).toISOString(),
    duration: 30,
    status: 'confirmed',
    meeting_link: 'https://meet.demo/internal-001',
    notes: 'Weekly sales team sync. Review pipeline, share wins, discuss challenges.',
    attendees: ['agent-a@ovenai.demo', 'agent-b@ovenai.demo', 'agent-c@ovenai.demo', 'sales-manager@ovenai.demo'],
    color: '#64748b',
    title: 'Sales Team Sync'
  });
  
  return events;
};

export const mockCalendarBookings = generateCalendarEvents();

export const mockReports = {
  weekly_summary: {
    week_ending: '2024-01-26',
    total_leads: 67,
    new_leads: 23,
    qualified_leads: 18,
    meetings_scheduled: 9,
    deals_closed: 2,
    revenue: '$195,000',
    avg_deal_size: '$97,500',
    top_performer: 'Agent A'
  },
  pipeline_health: {
    total_pipeline_value: '$2.4M',
    stages: [
      { stage: 'New', count: 23, value: '$345,000' },
      { stage: 'Qualifying', count: 45, value: '$675,000' },
      { stage: 'Demo Scheduled', count: 18, value: '$810,000' },
      { stage: 'Proposal', count: 12, value: '$480,000' },
      { stage: 'Negotiation', count: 5, value: '$225,000' }
    ]
  },
  conversion_funnel: [
    { stage: 'Leads Generated', count: 247, percentage: 100 },
    { stage: 'Contacted', count: 223, percentage: 90 },
    { stage: 'Qualified', count: 89, percentage: 36 },
    { stage: 'Demo Scheduled', count: 34, percentage: 14 },
    { stage: 'Proposal Sent', count: 18, percentage: 7 },
    { stage: 'Closed Won', count: 6, percentage: 2.4 }
  ]
};

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
  },
  
  getProjects: async () => {
    await simulateApiDelay();
    return { data: mockProjects };
  },
  
  getTemplates: async () => {
    await simulateApiDelay();
    return { data: mockTemplates };
  },
  
  getReports: async () => {
    await simulateApiDelay();
    return { data: mockReports };
  }
};

export default {
  mockLeads,
  mockConversations,
  mockProjects,
  mockTemplates,
  mockAnalytics,
  mockCalendarBookings,
  mockReports,
  mockUserProfile,
  mockApi
};
