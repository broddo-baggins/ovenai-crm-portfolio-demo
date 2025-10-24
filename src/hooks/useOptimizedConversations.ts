import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { simpleProjectService } from "@/services/simpleProjectService";
import { queryKeys, trackDatabasePerformance } from "@/lib/react-query";
import { useProject } from "@/context/ProjectContext";
import { useMemo } from "react";

// Types for optimized data structures
export interface OptimizedConversation {
  id: string;
  lead_id: string;
  message_content: string;
  timestamp: string;
  status: string;
  metadata: any;
  message_type: string;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  lead: any;
  messageCount: number;
  lastMessage: string;
  lastActive: string;
  requiresHumanReview: boolean;
  leadStatus: string;
  projectId: string | null;
  projectName?: string;
}

export interface OptimizedMessage {
  id: string;
  content: string;
  sender_number?: string;
  receiver_number?: string;
  wa_timestamp: string;
  created_at: string;
  direction: "inbound" | "outbound";
  message_type: "text" | "media" | "system";
}

// Hook to fetch all conversations with caching and project filtering
export const useOptimizedConversations = () => {
  const { currentProject } = useProject();
  const queryKey = queryKeys.conversationsList(currentProject?.id);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<OptimizedConversation[]> => {
      const startTime = performance.now();

      try {
        console.log("INIT [OPTIMIZED] Starting optimized conversations fetch...");

        // Parallel data loading - the key optimization!
        const [conversationsData, leadsData, messagesData] = await Promise.all([
          simpleProjectService.getAllConversations(),
          simpleProjectService.getAllLeads(),
          simpleProjectService.getWhatsAppMessages(5000),
        ]);

        // Data loading completed

        // Efficient data processing with Maps for O(1) lookups
        const leadsMap = new Map(
          (leadsData || []).map((lead) => [lead.id, lead]),
        );

        // Helper function for phone number matching
        const findMessagesForLead = (lead: any, allMessages: any[]): any[] => {
          if (!lead.phone || !allMessages?.length) return [];

          const leadPhone = lead.phone.replace(/[^\d]/g, "");
          const phoneVariants = [
            leadPhone,
            leadPhone.slice(-10),
            leadPhone.slice(-9),
            "972" + leadPhone.slice(-9),
          ];

          return allMessages.filter((msg) => {
            const senderPhone = msg.sender_number?.replace(/[^\d]/g, "") || "";
            const receiverPhone =
              msg.receiver_number?.replace(/[^\d]/g, "") || "";

            return phoneVariants.some(
              (variant) =>
                senderPhone.includes(variant) ||
                receiverPhone.includes(variant) ||
                variant.includes(senderPhone) ||
                variant.includes(receiverPhone),
            );
          });
        };

        // Process and filter conversations efficiently
        const processedConversations: OptimizedConversation[] = (
          conversationsData || []
        )
          .map((conv) => {
            const lead = leadsMap.get(conv.lead_id);

            if (!lead) {
              console.warn(
                `WARNING [OPTIMIZED] No lead found for conversation: ${conv.id}`,
              );
              return null;
            }

            // Project filtering - only include if matches current project
            if (currentProject) {
              const leadProjectMatch =
                lead.current_project_id === currentProject.id;
              if (!leadProjectMatch) {
                return null;
              }
            }

            const leadMessages = findMessagesForLead(lead, messagesData || []);

            return {
              ...conv,
              lead: {
                ...lead,
                // Lead already has 'name' property, no need to construct it
              },
              messageCount: leadMessages.length,
              lastMessage: conv.message_content || "No preview available",
              lastActive: conv.updated_at,
              requiresHumanReview: lead.requires_human_review || false,
              leadStatus: lead.status || "new",
              projectId: lead.current_project_id,
              projectName: currentProject?.name,
            };
          })
          .filter(Boolean) as OptimizedConversation[];

        // Optimized sorting with priority rules
        processedConversations.sort((a, b) => {
          // Priority 1: Human review required
          if (a.requiresHumanReview !== b.requiresHumanReview) {
            return a.requiresHumanReview ? -1 : 1;
          }

          // Priority 2: Message count (conversations with messages first)
          if (a.messageCount !== b.messageCount) {
            return b.messageCount - a.messageCount;
          }

          // Priority 3: Most recent activity
          return (
            new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
          );
        });

        const queryTime = performance.now() - startTime;
        trackDatabasePerformance("conversations-list", queryTime, true);

        // Processing completed successfully

        return processedConversations;
      } catch (error) {
        const queryTime = performance.now() - startTime;
        trackDatabasePerformance("conversations-list", queryTime, false);
        console.error("ERROR [OPTIMIZED] Conversations fetch failed:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for conversations
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false,
    enabled: true, // FIXED: Re-enabled with circuit breaker protection
    retry: (failureCount, error) => {
      // Circuit breaker: Stop retrying after 2 failures to prevent infinite loops
      if (failureCount >= 2) {
        console.warn('🔴 [CIRCUIT BREAKER] Conversations disabled after 2 failures to prevent infinite loops');
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

// Hook to fetch messages for a specific conversation with caching
export const useOptimizedConversationMessages = (
  conversation: OptimizedConversation | null,
) => {
  const queryKey = conversation
    ? queryKeys.conversationMessages(conversation.id)
    : null;

  return useQuery({
    queryKey: queryKey || ["no-conversation"],
    queryFn: async (): Promise<OptimizedMessage[]> => {
      if (!conversation) {
        throw new Error("No conversation provided");
      }

      const startTime = performance.now();

      try {
        // Try the complete conversation method first
        const completeConversation =
          await simpleProjectService.getCompleteConversation(conversation.id);

        let messages: any[] = [];

        if (
          completeConversation.whatsappMessages &&
          completeConversation.whatsappMessages.length > 0
        ) {
          messages = completeConversation.whatsappMessages;
        } else {
          // Fallback to lead messages
          const leadMessages = await simpleProjectService.getLeadMessages(
            conversation.lead_id,
          );
          messages = leadMessages || [];
        }

        // Enhanced message processing with direction detection
        const enhancedMessages: OptimizedMessage[] = messages.map((msg) => {
          const leadPhone = conversation.lead.phone;
          const senderPhone = msg.sender_number?.replace(/[^\d]/g, "") || "";
          const receiverPhone =
            msg.receiver_number?.replace(/[^\d]/g, "") || "";
          const cleanLeadPhone = leadPhone?.replace(/[^\d]/g, "") || "";

          // Determine message direction
          let direction: "inbound" | "outbound" = "outbound";
          if (senderPhone && cleanLeadPhone) {
            if (
              senderPhone.includes(cleanLeadPhone) ||
              cleanLeadPhone.includes(senderPhone)
            ) {
              direction = "inbound";
            }
          }

          // Detect message type
          let message_type: "text" | "media" | "system" = "text";
          if (
            msg.content?.includes("[Image]") ||
            msg.content?.includes("[Document]") ||
            msg.content?.includes("[Video]")
          ) {
            message_type = "media";
          }

          return {
            id: msg.id,
            content: msg.content || "No content",
            sender_number: msg.sender_number,
            receiver_number: msg.receiver_number,
            wa_timestamp: msg.wa_timestamp || msg.created_at,
            created_at: msg.created_at,
            direction,
            message_type,
          };
        });

        const queryTime = performance.now() - startTime;
        trackDatabasePerformance("conversation-messages", queryTime, true);

        return enhancedMessages;
      } catch (error) {
        const queryTime = performance.now() - startTime;
        trackDatabasePerformance("conversation-messages", queryTime, false);
        console.error("ERROR [OPTIMIZED] Messages fetch failed:", error);
        throw error;
      }
    },
    enabled: !!conversation,
    staleTime: 1 * 60 * 1000, // 1 minute for messages (more dynamic)
    gcTime: 3 * 60 * 1000, // 3 minutes garbage collection
  });
};

// Hook for filtered conversations with search and priority filtering
export const useFilteredConversations = (
  searchQuery: string = "",
  priorityFilter: "all" | "human_review" | "active" = "all",
) => {
  const {
    data: conversations = [],
    isLoading,
    error,
  } = useOptimizedConversations();

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.lead.name?.toLowerCase().includes(query) ||
          conv.lead.email?.toLowerCase().includes(query) ||
          conv.lead.phone?.includes(query) ||
          conv.lastMessage.toLowerCase().includes(query) ||
          conv.leadStatus.toLowerCase().includes(query),
      );
    }

    // Apply priority filter
    if (priorityFilter === "human_review") {
      filtered = filtered.filter((conv) => conv.requiresHumanReview);
    } else if (priorityFilter === "active") {
      filtered = filtered.filter(
        (conv) => conv.status === "active" && conv.messageCount > 0,
      );
    }

    return filtered;
  }, [conversations, searchQuery, priorityFilter]);

  // Calculate stats for the filtered results
  const stats = useMemo(() => {
    const totalConversations = conversations.length;
    const filteredCount = filteredConversations.length;
    const activeConversations = conversations.filter(
      (c) => c.status === "active",
    ).length;
    const requiresReview = conversations.filter(
      (c) => c.requiresHumanReview,
    ).length;
    const withMessages = conversations.filter((c) => c.messageCount > 0).length;
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0,
    );

    return {
      totalConversations,
      filteredCount,
      activeConversations,
      requiresReview,
      withMessages,
      totalMessages,
      reductionFromFilter:
        totalConversations > 0
          ? Math.round((1 - filteredCount / totalConversations) * 100)
          : 0,
    };
  }, [conversations, filteredConversations]);

  return {
    conversations: filteredConversations,
    isLoading,
    error,
    stats,
    totalCount: conversations.length,
  };
};

// Mutation hook for sending messages (placeholder for future implementation)
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: string;
    }) => {
      // Placeholder for WhatsApp integration
      console.log("📤 Sending message:", { conversationId, message });
      // TODO: Implement actual message sending
      return { success: true, messageId: Date.now().toString() };
    },
    onSuccess: (data, variables) => {
      // Invalidate conversation messages to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(variables.conversationId),
      });

      // Also invalidate conversations list to update last message
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations,
      });
    },
  });
};
