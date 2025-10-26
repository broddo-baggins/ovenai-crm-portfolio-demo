/**
 * Mock Integrations Data
 * 
 * Fake integrations to show what the CRM is "connected" to
 * for portfolio demonstration purposes
 */

export interface MockIntegration {
  id: string;
  name: string;
  type: 'communication' | 'calendar' | 'crm' | 'analytics' | 'payment' | 'marketing';
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  lastSync?: string;
  features: string[];
  connectedDate: string;
  metrics?: {
    label: string;
    value: string | number;
  }[];
  icon: string; // emoji or identifier
}

export const mockIntegrations: MockIntegration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    type: 'communication',
    status: 'connected',
    description: 'Was powered by Meta. Send and receive messages, automate conversations, and manage customer interactions.',
    lastSync: '2024-12-22T10:30:00Z',
    features: [
      'Automated message templates',
      'Two-way messaging',
      'Media sharing (images, videos, documents)',
      'Message status tracking',
      'Webhook integration',
      'BANT qualification via chat'
    ],
    connectedDate: '2024-01-15T00:00:00Z',
    metrics: [
      { label: 'Messages Sent', value: 2847 },
      { label: 'Response Rate', value: '72%' },
      { label: 'Active Conversations', value: 45 },
    ],
    icon: '💬'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    type: 'calendar',
    status: 'connected',
    description: 'Schedule meetings automatically. Sync availability and book demos directly from lead conversations.',
    lastSync: '2024-12-22T09:15:00Z',
    features: [
      'Automated scheduling',
      'Calendar sync',
      'Meeting reminders',
      'Booking page integration',
      'Time zone detection',
      'Custom availability rules'
    ],
    connectedDate: '2024-02-01T00:00:00Z',
    metrics: [
      { label: 'Meetings Scheduled', value: 67 },
      { label: 'Show Rate', value: '85%' },
      { label: 'Avg Book Time', value: '2.3 days' },
    ],
    icon: '📅'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    type: 'crm',
    status: 'disconnected',
    description: 'PostgreSQL database with Row Level Security (RLS). Originally used for data storage and real-time updates. (Demo mode - using mock data)',
    features: [
      'Real-time subscriptions',
      'Row Level Security (RLS)',
      'PostgreSQL database',
      'RESTful API',
      'Authentication',
      'File storage'
    ],
    connectedDate: '2024-01-10T00:00:00Z',
    icon: '🗄️'
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    type: 'analytics',
    status: 'connected',
    description: 'Track user behavior, conversion funnels, and campaign performance.',
    lastSync: '2024-12-22T10:00:00Z',
    features: [
      'Event tracking',
      'Conversion tracking',
      'User flow analysis',
      'Real-time reporting',
      'Custom dimensions',
      'Goal tracking'
    ],
    connectedDate: '2024-01-20T00:00:00Z',
    metrics: [
      { label: 'Visitors (30d)', value: 3542 },
      { label: 'Conversion Rate', value: '12.3%' },
      { label: 'Avg Session', value: '4m 32s' },
    ],
    icon: '📊'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'payment',
    status: 'connected',
    description: 'Process payments, manage subscriptions, and handle invoicing automatically.',
    lastSync: '2024-12-22T08:45:00Z',
    features: [
      'Payment processing',
      'Subscription management',
      'Invoice generation',
      'Payment links',
      'Recurring billing',
      'Webhook notifications'
    ],
    connectedDate: '2024-02-15T00:00:00Z',
    metrics: [
      { label: 'Revenue (30d)', value: '$45,230' },
      { label: 'Transactions', value: 89 },
      { label: 'Active Subscriptions', value: 34 },
    ],
    icon: '💳'
  },
  {
    id: 'slack',
    name: 'Slack',
    type: 'communication',
    status: 'connected',
    description: 'Get real-time notifications for hot leads, BANT qualifications, and meeting bookings in your team channels.',
    lastSync: '2024-12-22T10:20:00Z',
    features: [
      'Lead notifications',
      'Team alerts',
      'Meeting reminders',
      'Custom channels',
      'Thread updates',
      'Slash commands'
    ],
    connectedDate: '2024-01-25T00:00:00Z',
    metrics: [
      { label: 'Notifications Sent', value: 342 },
      { label: 'Active Channels', value: 5 },
      { label: 'Team Members', value: 8 },
    ],
    icon: '📢'
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    type: 'marketing',
    status: 'connected',
    description: 'Sync qualified leads to email campaigns and nurture sequences automatically.',
    lastSync: '2024-12-22T07:30:00Z',
    features: [
      'Email campaigns',
      'List segmentation',
      'Automation workflows',
      'A/B testing',
      'Analytics & reporting',
      'Template library'
    ],
    connectedDate: '2024-03-01T00:00:00Z',
    metrics: [
      { label: 'Subscribers', value: 1243 },
      { label: 'Open Rate', value: '34.2%' },
      { label: 'Click Rate', value: '4.8%' },
    ],
    icon: '📧'
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    type: 'crm',
    status: 'disconnected',
    description: 'Bi-directional sync with HubSpot for contacts, deals, and activities.',
    features: [
      'Contact sync',
      'Deal pipeline sync',
      'Activity logging',
      'Custom properties',
      'Workflow triggers',
      'Report integration'
    ],
    connectedDate: '2024-01-05T00:00:00Z',
    icon: '🔄'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    type: 'marketing',
    status: 'connected',
    description: 'Connect to 5000+ apps with custom workflows and automations.',
    lastSync: '2024-12-22T09:50:00Z',
    features: [
      'Custom workflows',
      '5000+ app integrations',
      'Multi-step Zaps',
      'Filters & formatters',
      'Schedule triggers',
      'Error handling'
    ],
    connectedDate: '2024-02-20T00:00:00Z',
    metrics: [
      { label: 'Active Zaps', value: 12 },
      { label: 'Tasks (30d)', value: 1847 },
      { label: 'Success Rate', value: '99.2%' },
    ],
    icon: '⚡'
  },
  {
    id: 'twilio',
    name: 'Twilio',
    type: 'communication',
    status: 'error',
    description: 'SMS messaging and voice calls for lead follow-ups and notifications.',
    features: [
      'SMS messaging',
      'Voice calls',
      'Number management',
      'Programmable messaging',
      'Call recording',
      'Delivery tracking'
    ],
    connectedDate: '2024-03-10T00:00:00Z',
    icon: '📱'
  },
];

/**
 * Get integration by ID
 */
export function getIntegrationById(id: string): MockIntegration | undefined {
  return mockIntegrations.find(int => int.id === id);
}

/**
 * Get integrations by type
 */
export function getIntegrationsByType(type: MockIntegration['type']): MockIntegration[] {
  return mockIntegrations.filter(int => int.type === type);
}

/**
 * Get connected integrations
 */
export function getConnectedIntegrations(): MockIntegration[] {
  return mockIntegrations.filter(int => int.status === 'connected');
}

/**
 * Get integration stats
 */
export function getIntegrationStats() {
  const total = mockIntegrations.length;
  const connected = mockIntegrations.filter(int => int.status === 'connected').length;
  const disconnected = mockIntegrations.filter(int => int.status === 'disconnected').length;
  const errors = mockIntegrations.filter(int => int.status === 'error').length;

  return {
    total,
    connected,
    disconnected,
    errors,
    connectionRate: Math.round((connected / total) * 100)
  };
}

export default mockIntegrations;

