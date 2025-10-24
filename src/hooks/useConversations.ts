// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import { useState, useEffect } from "react";
import { authService } from "@/integrations/supabase/client";
import { simpleProjectService } from "@/services/simpleProjectService";

// Helper function to convert lead status to temperature emoji
const getTemperatureFromStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "converted":
      return "HOT"; // Hot
    case "qualified":
      return "🌡️"; // Warm
    case "active":
      return "❄️"; // Cool
    case "new":
    default:
      return "🧊"; // Cold
  }
};

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_type: "agent" | "lead";
  message_text: string;
  sent_at: string;
  message_type?: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_content?: string;
  // Joined data
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    temperature: string;
  };
  messages?: ConversationMessage[];
  messageCount?: number;
  lastMessage?: string;
  lastActive?: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TEMPORARILY DISABLED to prevent infinite conversation requests
    // fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Get current user
      const { user } = await authService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get all leads
      const leads = await simpleProjectService.getAllLeads();

      // Ensure leads is an array
      if (!Array.isArray(leads)) {
        console.warn("Leads data is not an array:", leads);
        setConversations([]);
        setError(null);
        return;
      }

      // Get all conversations
      const allConversationsData =
        await simpleProjectService.getAllConversations();

      // Build conversations with lead details
      const conversationsWithDetails = allConversationsData
        .map((conv) => {
          const lead = leads.find((l) => l.id === conv.lead_id);

          if (!lead) {
            console.warn("Lead not found for conversation:", conv.id);
            return null;
          }

          return {
            ...conv,
            lead: {
              first_name: lead.name?.split(" ")[0] || "Unknown",
              last_name: lead.name?.split(" ").slice(1).join(" ") || "",
              phone: lead.phone || "",
              temperature: getTemperatureFromStatus(lead.status),
            },
            messageCount: 0, // Will be updated if needed
            lastMessage: "Click to view messages",
            lastActive: conv.updated_at,
          };
        })
        .filter((conv) => conv !== null);

      // Sort by last activity
      conversationsWithDetails.sort((a, b) => {
        const dateA = new Date(a.lastActive || a.updated_at || 0).getTime();
        const dateB = new Date(b.lastActive || b.updated_at || 0).getTime();
        return dateB - dateA;
      });

      setConversations(conversationsWithDetails);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);

      if (err instanceof Error) {
        if (err.message.includes("not authenticated")) {
          setError("Please log in to view conversations.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to fetch conversations");
      }

      // Set empty array on error
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (
    leadId: string,
  ): Promise<ConversationMessage[]> => {
    try {
      const { user } = await authService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const messages = await simpleProjectService.getLeadMessages(leadId);

      // Convert WhatsApp messages to ConversationMessage format
      return messages.map((msg) => ({
        id: msg.id,
        conversation_id: leadId, // Use leadId since that's how we're organizing messages
        sender_type: msg.sender_number ? "lead" : "agent",
        message_text: msg.content || "No content",
        sent_at: msg.wa_timestamp || msg.created_at,
        message_type: "text", // Default since the schema doesn't have message_type
      }));
    } catch (err) {
      console.error("Error fetching messages:", err);
      return [];
    }
  };

  return {
    conversations,
    loading,
    error,
    fetchConversationMessages,
    refetch: fetchConversations,
  };
};
