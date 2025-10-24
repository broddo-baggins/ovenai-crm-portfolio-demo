import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { useProjectData } from "@/hooks/useProjectData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageSquare,
  Users,
  Activity,
  Clock,
  RefreshCw,
  Send,
  Paperclip,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { simpleProjectService } from "@/services/simpleProjectService";
import { Lead, WhatsAppMessage } from "@/types";
import { useProject } from "@/context/ProjectContext";

// Modern WhatsApp® Chat Interface Component
interface ModernChatInterfaceProps {
  messages: WhatsAppMessage[];
  selectedLead: Lead | null;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ModernChatInterface: React.FC<ModernChatInterfaceProps> = ({
  messages,
  selectedLead,
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[480px] bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white font-semibold">
              {selectedLead
                ? `${selectedLead.first_name?.charAt(0) || ""}${selectedLead.last_name?.charAt(0) || ""}`
                : "?"}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {selectedLead
                  ? `${selectedLead.first_name} ${selectedLead.last_name}`
                  : "Select a conversation"}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedLead?.phone}
              </p>
            </div>
          </div>
          {selectedLead && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {selectedLead.status}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {messages.length} msgs
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - Fixed Height with Internal Scroll */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto p-3"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="space-y-3">
            {messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === "outbound"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        message.direction === "outbound"
                          ? "bg-[#25D366] text-white"
                          : "bg-gray-100 text-gray-900 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(
                            message.wa_timestamp || message.created_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.message_type &&
                          message.message_type !== "text" && (
                            <span className="text-xs opacity-60 ml-2">
                              {message.message_type === "media" ? "📎" : "CONFIG"}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-3 py-2 border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">
                    Start a conversation with this lead
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-3 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <Button size="icon" variant="outline" className="shrink-0 h-10 w-10">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedLead
                  ? "Type your message..."
                  : "Select a conversation to start messaging"
              }
              disabled={!selectedLead}
              className="w-full min-h-[40px] max-h-[80px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !selectedLead}
            size="icon"
            className="shrink-0 rounded-lg h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Conversation List Component
interface ConversationItemProps {
  lead: Lead;
  messageCount: number;
  lastMessage: string;
  lastActive: string;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  lead,
  messageCount,
  lastMessage,
  lastActive,
  isSelected,
  onClick,
}) => {
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
        isSelected
          ? "bg-green-50 border-l-[#25D366] shadow-sm"
          : "border-l-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#1eb85e] rounded-full flex items-center justify-center text-white font-semibold shadow-md text-sm">
          {`${lead.first_name?.charAt(0) || ""}${lead.last_name?.charAt(0) || "?"}`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-medium text-gray-900 truncate text-sm">
              {`${lead.first_name} ${lead.last_name}`.trim() || "Unknown Lead"}
            </h4>
            <span className="text-xs text-gray-500 ml-2 shrink-0">
              {formatTimeAgo(lastActive)}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate mb-2">
            {lastMessage || "No messages yet"}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 truncate">
              {lead.phone?.slice(-10)}
            </span>
            <div className="flex items-center space-x-1">
              <Badge
                variant={lead.status === "active" ? "default" : "secondary"}
                className="text-xs px-1 py-0"
              >
                {lead.status}
              </Badge>
              {messageCount > 0 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {messageCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Enhanced Messages Component
export const EnhancedMessagesPage: React.FC = () => {
  const { t } = useTranslation('common');

  // Use the new project data hook for automatic refresh
  const {
    leads,
    whatsappMessages: allMessages,
    loading,
    error,
    refresh: refreshData,
    currentProject
  } = useProjectData({
    autoRefresh: false, // Disabled auto-refresh to prevent infinite loop
    includeWhatsAppMessages: true,
    onError: (error) => {
      console.error("Messages data error:", error);
      toast.error("Failed to load messages data");
    }
  });

  // State for UI
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentMessages, setCurrentMessages] = useState<WhatsAppMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Auto-select first lead with messages when data changes
  useEffect(() => {
    if (leads.length > 0 && allMessages.length > 0 && !selectedLead) {
      const leadsWithMessages = leads
        .map((lead) => {
          const leadMessages = allMessages.filter(
            (msg) => msg.lead_id === lead.id,
          );
          return {
            lead,
            messageCount: leadMessages.length,
            messages: leadMessages,
          };
        })
        .filter((item) => item.messageCount > 0);

      if (leadsWithMessages.length > 0) {
        const firstLead = leadsWithMessages[0];
        setSelectedLead(firstLead.lead);
        setCurrentMessages(firstLead.messages);
      }
    }
  }, [leads, allMessages, selectedLead]);

  // Handle lead selection
  const handleLeadSelect = useCallback(
    (lead: Lead) => {
      setSelectedLead(lead);
      const leadMessages = allMessages.filter((msg) => msg.lead_id === lead.id);
      setCurrentMessages(leadMessages);
    },
    [allMessages],
  );

  // Send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      if (!selectedLead) return;

      console.log("Sending message:", message, "to lead:", selectedLead.id);
      toast.info(
        "Message sending will be implemented with WhatsApp integration",
      );
    },
    [selectedLead],
  );

  // Filter and paginate leads
  const { filteredLeads, paginatedLeads, totalPages } = useMemo(() => {
    const leadsWithMessages = leads.map((lead) => {
      const leadMessages = allMessages.filter((msg) => msg.lead_id === lead.id);
      const lastMessage = leadMessages[leadMessages.length - 1];
      return {
        lead,
        messageCount: leadMessages.length,
        lastMessage: lastMessage?.content || "",
        lastActive:
          lastMessage?.wa_timestamp ||
          lastMessage?.created_at ||
          lead.updated_at,
      };
    });

    let filtered = leadsWithMessages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          `${item.lead.first_name} ${item.lead.last_name}`
            .toLowerCase()
            .includes(query) ||
          item.lead.phone?.includes(query),
      );
    }

    // Sort by message activity
    filtered.sort((a, b) => {
      if (a.messageCount !== b.messageCount) {
        return b.messageCount - a.messageCount;
      }
      return (
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return {
      filteredLeads: filtered,
      paginatedLeads: paginated,
      totalPages,
    };
  }, [leads, allMessages, searchQuery, currentPage, itemsPerPage]);

  // Stats
  const stats = useMemo(
    () => ({
      totalLeads: leads.length,
      withMessages: leads.filter((lead) =>
        allMessages.some((msg) => msg.lead_id === lead.id),
      ).length,
      totalMessages: allMessages.length,
      activeConversations: leads.filter((lead) => lead.status === "active")
        .length,
    }),
    [leads, allMessages],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">
          {t("loadingConversations", "Loading conversations...")}
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#25D366] to-[#1eb85e] bg-clip-text text-transparent">
            Enhanced Messages
          </h1>
          <p className="text-gray-600 mt-1">
            Professional WhatsApp® conversation management
            {currentProject && (
              <span className="text-[#25D366] ml-2">
                • {currentProject.name}
              </span>
            )}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" className="shadow-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Leads",
            value: stats.totalLeads,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "With Messages",
            value: stats.withMessages,
            icon: MessageSquare,
            color: "text-green-500",
          },
          {
            label: "Total Messages",
            value: stats.totalMessages,
            icon: Activity,
            color: "text-purple-500",
          },
          {
            label: "Active",
            value: stats.activeConversations,
            icon: Clock,
            color: "text-orange-500",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#25D366]"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
                <span>
                  {filteredLeads.length > 0
                    ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredLeads.length)} of ${filteredLeads.length}`
                    : "No conversations found"}
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  {filteredLeads.length > itemsPerPage && (
                    <Badge variant="outline" className="text-xs">
                      {filteredLeads.length} conversations
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div className="max-h-[420px] overflow-y-auto">
              {paginatedLeads.map((item) => (
                <ConversationItem
                  key={item.lead.id}
                  lead={item.lead}
                  messageCount={item.messageCount}
                  lastMessage={item.lastMessage}
                  lastActive={item.lastActive}
                  isSelected={selectedLead?.id === item.lead.id}
                  onClick={() => handleLeadSelect(item.lead)}
                />
              ))}

              {paginatedLeads.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              )}
            </div>

            {/* Pagination - Only show if more than one page */}
            {totalPages > 1 && (
              <div className="p-3 border-t bg-gray-50">
                <Pagination>
                  <PaginationContent className="justify-center">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Show current page and nearby pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else {
                        // Smart pagination: show current page and surrounding pages
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, start + 4);
                        page = start + i;
                        if (page > end) return null;
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationEllipsis />
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <ModernChatInterface
            messages={currentMessages}
            selectedLead={selectedLead}
            onSendMessage={handleSendMessage}
            isLoading={false}
          />
        </div>
      </div>

      {/* Meta Attribution - Required for WhatsApp® Business API */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <span>Powered by</span>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Meta-Logo.png/120px-Meta-Logo.png" 
            alt="Meta" 
            className="h-4 w-auto"
          />
          <span>Meta</span>
        </p>
      </div>
    </div>
  );
};
