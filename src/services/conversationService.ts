/**
 * Conversation Service
 *
 * Service providing conversation and WhatsApp message access via unified API.
 * WhatsApp messages are stored in the conversations table with additional columns.
 */

import { unifiedApiClient } from "./unifiedApiClient";
import { ServiceErrorHandler } from "./base/errorHandler";
import { DatabaseResult } from "@/types/shared";
import { mockApi } from '@/data/mockData';

export interface ConversationLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export interface ConversationMessage {
  id: string;
  content: string;
  direction: "inbound" | "outbound";
  wa_timestamp: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  lead: ConversationLead;
  lastMessage: string;
  messageCount: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  sender_number: string;
  content: string;
  wamid: string;
  payload?: any;
  created_at: string;
  updated_at: string;
  awaits_response?: boolean;
  receiver_id?: string;
  receiver_number?: string;
  wa_timestamp?: string;
  test_mode?: boolean;
  test_session_id?: string;
  test_scenario_name?: string;
}

export interface ConversationSummary {
  totalConversations: number;
  totalMessages: number;
  lastActivity: string;
  responseRate: number;
  averageResponseTime: number;
}

export class ConversationService {
  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      // DEMO DEMO MODE: Always use comprehensive mock data
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        // Convert mock conversations to expected format
        const response = await mockApi.getConversation('lead-001');
        return [
          {
            id: "conv-1",
            lead: {
              id: "lead-001",
              name: "Sarah Johnson",
              email: "sarah.j@techstart.demo",
              phone: "+1-555-0101",
              status: "qualified",
            },
            lastMessage: "Perfect! I'll send you a Calendly link.",
            messageCount: 8,
            created_at: "2024-01-20T10:30:00Z",
            updated_at: "2024-01-20T10:47:00Z",
          },
        ];
      }
      
      // Original code for production
      return [];
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    try {
      // Mock implementation - in production this would fetch from WhatsApp API
      return [
        {
          id: "msg-1",
          content: "Hello, I'm interested in your services",
          direction: "inbound",
          wa_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "msg-2",
          content: "Thank you for your interest! How can we help you?",
          direction: "outbound",
          wa_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error("Failed to fetch conversation messages:", error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<ConversationMessage> {
    try {
      // Mock implementation - in production this would send via WhatsApp API
      const message: ConversationMessage = {
        id: `msg-${Date.now()}`,
        content,
        direction: "outbound",
        wa_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return message;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Get conversations for a specific lead
   */
  async getConversationsByLead(leadId: string): Promise<Conversation[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const result = await unifiedApiClient.getConversations(leadId);

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch conversations");
        }

        return result.data || [];
      },
      "ConversationService",
      "getConversationsByLead",
    ).then((result) => result.data || []);
  }

  /**
   * Get WhatsApp messages for a specific lead
   * WhatsApp messages are stored in conversations table with sender_number
   */
  async getWhatsAppMessagesByLead(leadId: string): Promise<WhatsAppMessage[]> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Use conversations table since that's where WhatsApp messages are stored
        const result = await unifiedApiClient.getConversations(leadId);

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch WhatsApp messages");
        }

        // Convert conversation records to WhatsApp message format
        const conversations = result.data || [];
        return conversations.map((conv: any) => ({
          id: conv.id,
          sender_number: conv.sender_number,
          receiver_number: conv.receiver_number,
          content: conv.message_content || conv.content,
          wamid: conv.wamid,
          payload: conv.metadata || {},
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          awaits_response: conv.awaits_response,
          wa_timestamp: conv.wa_timestamp,
        }));
      },
      "ConversationService",
      "getWhatsAppMessagesByLead",
    ).then((result) => result.data || []);
  }

  /**
   * Get complete conversation timeline for a lead
   */
  async getConversationTimeline(leadId: string): Promise<{
    conversations: Conversation[];
    messages: WhatsAppMessage[];
    timeline: Array<{
      type: "conversation" | "message";
      timestamp: string;
      data: Conversation | WhatsAppMessage;
    }>;
  }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const [conversations, messages] = await Promise.all([
          this.getConversationsByLead(leadId),
          this.getWhatsAppMessagesByLead(leadId),
        ]);

        // Create unified timeline
        const timeline = [
          ...conversations.map((conv) => ({
            type: "conversation" as const,
            timestamp: conv.created_at,
            data: conv,
          })),
          ...messages.map((msg) => ({
            type: "message" as const,
            timestamp: msg.wa_timestamp || msg.created_at,
            data: msg,
          })),
        ].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        return {
          conversations,
          messages,
          timeline,
        };
      },
      "ConversationService",
      "getConversationTimeline",
    ).then(
      (result) =>
        result.data || { conversations: [], messages: [], timeline: [] },
    );
  }

  /**
   * Get conversation summary statistics
   */
  async getConversationSummary(leadId: string): Promise<ConversationSummary> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { conversations, messages } =
          await this.getConversationTimeline(leadId);

        const totalConversations = conversations.length;
        const totalMessages = messages.length;

        const lastActivity =
          messages.length > 0
            ? messages[messages.length - 1].wa_timestamp ||
              messages[messages.length - 1].created_at
            : conversations.length > 0
              ? conversations[conversations.length - 1].created_at
              : new Date().toISOString();

        // Calculate response metrics (simplified)
        const awaitingResponse = messages.filter(
          (msg) => msg.awaits_response,
        ).length;
        const responseRate =
          totalMessages > 0
            ? ((totalMessages - awaitingResponse) / totalMessages) * 100
            : 0;

        return {
          totalConversations,
          totalMessages,
          lastActivity,
          responseRate,
          averageResponseTime: 0, // Placeholder for future implementation
        };
      },
      "ConversationService",
      "getConversationSummary",
    ).then(
      (result) =>
        result.data || {
          totalConversations: 0,
          totalMessages: 0,
          lastActivity: new Date().toISOString(),
          responseRate: 0,
          averageResponseTime: 0,
        },
    );
  }

  /**
   * Send a new WhatsApp message (stored in conversations table)
   */
  async sendWhatsAppMessage(
    leadId: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<DatabaseResult<WhatsAppMessage>> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Store WhatsApp message in conversations table
        const result = await unifiedApiClient.createConversation({
          lead_id: leadId,
          message_content: content,
          sender_number: null, // Agent message
          receiver_number: metadata?.receiver_number,
          message_type: "outgoing",
          wa_timestamp: new Date().toISOString(),
          awaits_response: true,
          payload: metadata,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to send message");
        }

        return result.data;
      },
      "ConversationService",
      "sendWhatsAppMessage",
    );
  }

  /**
   * Mark messages as read (update conversations table)
   */
  async markMessagesAsRead(
    messageIds: string[],
  ): Promise<DatabaseResult<boolean>> {
    try {
      // Update each message in conversations table
      const updatePromises = messageIds.map((id) =>
        unifiedApiClient.updateConversation(id, {
          awaits_response: false,
          updated_at: new Date().toISOString(),
        }),
      );

      const results = await Promise.all(updatePromises);
      const allSuccessful = results.every((result) => result.success);

      return { success: allSuccessful, data: allSuccessful, error: null };
    } catch (error) {
      return {
        success: false,
        data: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark messages as read",
      };
    }
  }

  /**
   * Get conversation analytics for dashboard
   */
  async getConversationAnalytics(
    timeframe: "day" | "week" | "month" = "week",
  ): Promise<{
    messageVolume: Array<{ date: string; count: number }>;
    responseRates: Array<{ date: string; rate: number }>;
    activeConversations: number;
    totalMessages: number;
  }> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Get all conversations and calculate analytics locally
        const result = await unifiedApiClient.getConversations();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch conversations");
        }

        const conversations = result.data || [];

        // Calculate basic analytics from conversations
        const totalMessages = conversations.length;
        const activeConversations = conversations.filter(
          (conv) => conv.status === "active",
        ).length;

        // Simple analytics calculation - could be enhanced
        return {
          messageVolume: [
            {
              date: new Date().toISOString().split("T")[0],
              count: totalMessages,
            },
          ],
          responseRates: [
            { date: new Date().toISOString().split("T")[0], rate: 85 },
          ], // Placeholder
          activeConversations,
          totalMessages,
        };
      },
      "ConversationService",
      "getConversationAnalytics",
    ).then(
      (result) =>
        result.data || {
          messageVolume: [],
          responseRates: [],
          activeConversations: 0,
          totalMessages: 0,
        },
    );
  }
}

// Export singleton instance
export const conversationService = new ConversationService();

// Export named functions for easier mocking in tests
export const getConversations =
  conversationService.getConversations.bind(conversationService);
export const getConversationMessages =
  conversationService.getConversationMessages.bind(conversationService);
export const sendMessage =
  conversationService.sendMessage.bind(conversationService);
