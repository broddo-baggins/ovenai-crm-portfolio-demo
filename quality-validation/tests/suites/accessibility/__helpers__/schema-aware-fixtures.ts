/**
 * 🔧 SCHEMA-AWARE TEST FIXTURES
 * 
 * These fixtures use ACTUAL database field types instead of mock string data.
 * This prevents bugs like the getLeadTemperature TypeError that occurred because
 * tests used string status but the database stores integer status.
 */

import { testCredentials } from './test-credentials';

// Database-accurate Lead fixtures with INTEGER status values
export const schemaAwareLeadFixtures = {
  pending: {
    id: 'test-lead-pending',
    project_id: 'test-project-1',
    first_name: 'John',
    last_name: 'Pending',
    phone: '+1234567890',
    email: 'john.pending@test.test',
    status: 1, // INTEGER - Pending (this is what caused the original bug!)
    temperature: '40',
    type: 'test_lead',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    notes: 'Test lead in pending state'
  },

  queued: {
    id: 'test-lead-queued',
    project_id: 'test-project-1', 
    first_name: 'Jane',
    last_name: 'Queued',
    phone: '+1234567891',
    email: 'jane.queued@test.test',
    status: 3, // INTEGER - Queued
    temperature: '60',
    type: 'test_lead',
    created_at: '2025-01-15T11:00:00Z',
    updated_at: '2025-01-15T11:00:00Z',
    notes: 'Test lead in queued state'
  },

  active: {
    id: 'test-lead-active',
    project_id: 'test-project-1',
    first_name: 'Bob',
    last_name: 'Active', 
    phone: '+1234567892',
    email: 'bob.active@test.test',
    status: 5, // INTEGER - Active
    temperature: '80',
    type: 'test_lead',
    created_at: '2025-01-15T12:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
    notes: 'Test lead in active state'
  },

  completed: {
    id: 'test-lead-completed',
    project_id: 'test-project-1',
    first_name: 'Alice',
    last_name: 'Completed',
    phone: '+1234567893',
    email: 'alice.completed@test.test',
    status: 6, // INTEGER - Completed/Success
    temperature: '90',
    type: 'test_lead',
    created_at: '2025-01-15T13:00:00Z',
    updated_at: '2025-01-15T13:00:00Z',
    notes: 'Test lead in completed state'
  },

  failed: {
    id: 'test-lead-failed',
    project_id: 'test-project-1',
    first_name: 'Charlie',
    last_name: 'Failed',
    phone: '+1234567894',
    email: 'charlie.failed@test.test',
    status: 11, // INTEGER - Failed/Dead
    temperature: '10',
    type: 'test_lead',
    created_at: '2025-01-15T14:00:00Z',
    updated_at: '2025-01-15T14:00:00Z',
    notes: 'Test lead in failed state'
  }
};

// Extended Lead fixtures with additional schema fields (if they exist)
export const extendedLeadFixtures = {
  withMetadata: {
    ...schemaAwareLeadFixtures.active,
    id: 'test-lead-with-metadata',
    // Extended fields that may exist in actual database
    state: 'information_gathering',
    bant_status: 'need_qualified',
    lead_metadata: {
      lead_score: 85,
      ai_analysis: {
        lead_qualification: {
          confidence_score: 75,
          progression_status: 'engaged'
        },
        suggested_next_action: 'schedule_demo',
        conversation_summary_points: [
          'Interested in enterprise features',
          'Budget confirmed: $10k+ annually',
          'Decision timeline: 30 days'
        ],
        requires_human_intervention: false
      },
      campaign_id: 'campaign-123',
      custom_fields: {
        company: 'Test Corp',
        position: 'CTO',
        industry: 'Technology'
      }
    },
    state_status_metadata: {
      bant_assessment: {
        need: {
          notes: 'Clear need for lead management solution',
          requirements: ['CRM integration', 'API access', 'Mobile app'],
          assessment_flag: 'qualified'
        },
        budget: {
          notes: 'Confirmed budget range',
          amount: 15000,
          currency: 'USD',
          assessment_flag: 'qualified'
        },
        timeline: {
          notes: 'Looking to implement within Q1',
          urgency_level: 'high',
          expected_purchase_date: '2025-03-01T00:00:00Z',
          assessment_flag: 'qualified'
        },
        authority: {
          notes: 'Speaking with decision maker',
          contact_role: 'CTO',
          assessment_flag: 'qualified',
          decision_maker_identified: true
        }
      },
      last_updated_by: testCredentials.email,
      additional_notes: 'High-quality lead with clear buying intent'
    },
    interaction_count: 5,
    first_interaction: '2025-01-15T08:00:00Z',
    last_interaction: '2025-01-15T16:30:00Z',
    next_follow_up: '2025-01-18T09:00:00Z',
    follow_up_count: 2,
    requires_human_review: false,
    last_agent_processed_at: '2025-01-15T16:00:00Z'
  }
};

// Project fixtures
export const schemaAwareProjectFixtures = {
  testProject1: {
    id: 'test-project-1',
    name: 'Test Marketing Campaign',
    description: 'Test project for schema validation',
    client_id: 'test-client-1',
    status: 'active',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },

  testProject2: {
    id: 'test-project-2', 
    name: 'Demo Lead Generation',
    description: 'Demo project for testing purposes',
    client_id: 'test-client-1',
    status: 'active',
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  }
};

// Client fixtures
export const schemaAwareClientFixtures = {
  testClient1: {
    id: 'test-client-1',
    name: 'Test Corporation',
    created_at: '2025-01-01T10:00:00Z'
  }
};

// Profile fixtures for auth testing
export const schemaAwareProfileFixtures = {
  testUser: {
    id: 'test-user-1',
    email: testCredentials.email,
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567895',
    role: 'member',
    status: 'active',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },

  adminUser: {
    id: 'test-admin-1',
    email: testCredentials.adminEmail,
    first_name: 'Admin',
    last_name: 'User',
    phone: '+1234567896',
    role: 'admin',
    status: 'active',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  }
};

/**
 * 🧪 TEMPERATURE CALCULATION TEST DATA
 * 
 * These fixtures specifically test the integer status to temperature mapping
 * that was failing due to the toLowerCase() bug
 */
export const temperatureCalculationFixtures = [
  {
    name: 'Pending Lead',
    lead: {
      ...schemaAwareLeadFixtures.pending,
      lead_metadata: null // Force fallback to status-based calculation
    },
    expectedTemperatureRange: [30, 50]
  },
  {
    name: 'Queued Lead',
    lead: {
      ...schemaAwareLeadFixtures.queued,
      lead_metadata: null
    },
    expectedTemperatureRange: [50, 70]
  },
  {
    name: 'Active Lead',
    lead: {
      ...schemaAwareLeadFixtures.active,
      lead_metadata: null
    },
    expectedTemperatureRange: [70, 90]
  },
  {
    name: 'Completed Lead',
    lead: {
      ...schemaAwareLeadFixtures.completed,
      lead_metadata: null
    },
    expectedTemperatureRange: [80, 100]
  },
  {
    name: 'Failed Lead',
    lead: {
      ...schemaAwareLeadFixtures.failed,
      lead_metadata: null
    },
    expectedTemperatureRange: [0, 10]
  },
  {
    name: 'Lead with AI Score Override',
    lead: {
      ...schemaAwareLeadFixtures.active,
      lead_metadata: {
        ai_analysis: {
          lead_qualification: {
            confidence_score: 95 // Should override status-based calculation
          }
        }
      }
    },
    expectedTemperatureRange: [94, 96] // Should use AI score directly
  }
];

/**
 * 🔧 UTILITY FUNCTIONS FOR SCHEMA-AWARE TESTING
 */

/**
 * Create a test lead with proper database types
 */
export function createSchemaAwareLead(overrides: Partial<any> = {}) {
  return {
    ...schemaAwareLeadFixtures.pending,
    ...overrides,
    // Ensure status is always an integer
    status: typeof overrides.status === 'number' ? overrides.status : 1
  };
}

/**
 * Validate that a lead object has the correct types
 */
export function validateLeadSchema(lead: any): boolean {
  return (
    typeof lead.id === 'string' &&
    typeof lead.status === 'number' &&
    Number.isInteger(lead.status) &&
    (lead.first_name === null || typeof lead.first_name === 'string') &&
    (lead.last_name === null || typeof lead.last_name === 'string') &&
    (lead.phone === null || typeof lead.phone === 'string')
  );
}

/**
 * Get test credentials for database connections
 */
export function getTestCredentials() {
  return {
    email: testCredentials.email,
    password: testCredentials.password,
    adminEmail: testCredentials.adminEmail,
    adminPassword: testCredentials.adminPassword
  };
}

export default {
  leads: schemaAwareLeadFixtures,
  extendedLeads: extendedLeadFixtures,
  projects: schemaAwareProjectFixtures,
  clients: schemaAwareClientFixtures,
  profiles: schemaAwareProfileFixtures,
  temperatureTests: temperatureCalculationFixtures,
  utils: {
    createSchemaAwareLead,
    validateLeadSchema,
    getTestCredentials
  }
}; 