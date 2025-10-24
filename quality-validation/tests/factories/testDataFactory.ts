/**
 * Test Data Factory
 * Provides consistent test data creation for CRUD operations
 */

export class TestDataFactory {
  static createClient(overrides: any = {}) {
    return {
      name: `Test Client ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      description: "Test client for integration testing",
      ...overrides,
    };
  }

  static createProject(clientId: string, overrides: any = {}) {
    return {
      name: `Test Project ${Date.now()}`,
      client_id: clientId,
      status: "active",
      processing_state: "initial",
      ...overrides,
    };
  }

  static createLead(projectId: string, overrides: any = {}) {
    return {
      first_name: "Test",
      last_name: "Lead",
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      current_project_id: projectId,
      state: "new_lead",
      status: "new",
      lead_metadata: {
        ai_analysis: {
          lead_qualification: {
            confidence_score: Math.random() * 0.5 + 0.5 // Random score between 0.5-1.0
          }
        }
      },
      ...overrides,
    };
  }

  static createConversation(leadId: string, overrides: any = {}) {
    return {
      lead_id: leadId,
      content: "Test conversation content",
      sender_number: "+1-555-TEST",
      receiver_number: "+1-555-RECEIVE",
      wamid: `test_wamid_${Date.now()}`,
      wa_timestamp: new Date().toISOString(),
      last_message_from: "lead",
      ...overrides,
    };
  }

  /**
   * Creates a complete test data hierarchy
   * Returns IDs for cleanup
   */
  static async createFullHierarchy(apiClient: any) {
    const client = await apiClient.enhancedCRUD(
      "clients",
      "CREATE",
      this.createClient(),
    );
    if (!client.success) throw new Error("Failed to create test client");

    const project = await apiClient.enhancedCRUD(
      "projects",
      "CREATE",
      this.createProject(client.data.id),
    );
    if (!project.success) throw new Error("Failed to create test project");

    const lead = await apiClient.enhancedCRUD(
      "leads",
      "CREATE",
      this.createLead(project.data.id),
    );
    if (!lead.success) throw new Error("Failed to create test lead");

    const conversation = await apiClient.enhancedCRUD(
      "conversations",
      "CREATE",
      this.createConversation(lead.data.id),
    );
    if (!conversation.success)
      throw new Error("Failed to create test conversation");

    return {
      clientId: client.data.id,
      projectId: project.data.id,
      leadId: lead.data.id,
      conversationId: conversation.data.id,
    };
  }
}
