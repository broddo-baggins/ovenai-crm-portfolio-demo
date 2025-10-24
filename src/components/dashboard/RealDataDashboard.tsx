import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
  Target,
  Phone,
  Mail,
  Calendar,
  PieChart,
  DollarSign,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { simpleProjectService } from "@/services/simpleProjectService";
import { ConversationService } from "@/services/conversationService";
import { useProject } from "@/context/ProjectContext";
import { toast } from "sonner";
import { Lead } from "@/types";

type LeadTemperature = "hot" | "warm" | "cold";

interface TimeFrameStats {
  leadsThisWeek: number;
  leadsLastWeek: number;
  conversionsThisWeek: number;
  conversionsLastWeek: number;
  responseTimeThisWeek: number;
  responseTimeLastWeek: number;
}

const conversationService = new ConversationService();

const RealDataDashboard: React.FC = () => {
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Real data state
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    activeChats: 0,
    conversionRate: 0,
    responseTime: 0,
    recentLeads: [] as any[],
    recentConversations: [] as any[],
    performanceMetrics: {
      leadsThisWeek: 0,
      leadsLastWeek: 0,
      conversionsThisWeek: 0,
      conversionsLastWeek: 0,
      responseTimeThisWeek: 0,
      responseTimeLastWeek: 0,
    },
    conversationAnalytics: {
      messageVolume: [] as Array<{ date: string; count: number }>,
      responseRates: [] as Array<{ date: string; rate: number }>,
      activeConversations: 0,
      totalMessages: 0,
    },
  });

  // Load dashboard data - refreshes when project changes
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel data loading with reduced WhatsApp message requests
      const [allLeads, allConversations, whatsappMessages, conversationAnalytics] = await Promise.all([
        simpleProjectService.getAllLeads().catch((err) => {
          console.warn("Failed to load leads:", err);
          return [];
        }),
        simpleProjectService.getAllConversations().catch((err) => {
          console.warn("Failed to load conversations:", err);
          return [];
        }),
        // REDUCED: Only get 50 messages instead of 1000 to prevent excessive requests
        simpleProjectService.getWhatsAppMessages(50).catch((err) => {
          console.warn("Failed to load WhatsApp messages:", err);
          return [];
        }),
        conversationService.getConversationAnalytics("week").catch((err) => {
          console.warn("Failed to load conversation analytics:", err);
          return {
            messageVolume: [],
            responseRates: [],
            activeConversations: 0,
            totalMessages: 0,
          };
        }),
      ]);

      // Filter data by current project if selected
      const projectFilteredLeads = currentProject
        ? allLeads.filter(
            (lead) =>
              lead.current_project_id === currentProject.id ||
              lead.project_id === currentProject.id,
          )
        : allLeads;

      const projectFilteredConversations = currentProject
        ? allConversations.filter((conv) => {
            // Use embedded lead data from the conversation if available
            const lead = conv.lead;
            if (lead && (lead.current_project_id === currentProject.id || lead.project_id === currentProject.id)) {
              return true;
            }
            
            // Fallback: Check if conversation lead_id matches any lead in current project
            if (conv.lead_id) {
              const matchingLead = projectFilteredLeads.find(l => l.id === conv.lead_id);
              return !!matchingLead;
            }
            
            return false;
          })
        : allConversations;

      // Calculate metrics
      const totalLeads = projectFilteredLeads.length;
      
      // Count unique active conversations (not total conversations) - matches Sidebar logic
      const activeChats = projectFilteredConversations.filter(
        (c) => c.status === "active" || c.status === "in_progress",
      ).length;

              // Count qualified/converted leads based on real database schema
        const convertedLeads = projectFilteredLeads.filter(
          (l) => l.bant_status === "fully_qualified" || 
                 l.state === "qualified" || 
                 l.status === "qualified" ||
                 l.status === "converted" || 
                 l.status === "closed-won",
        ).length;
      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average response time from messages
      const messagesWithTimestamp = whatsappMessages.filter(
        (m) => m.wa_timestamp,
      );
      const avgResponseTime =
        messagesWithTimestamp.length > 0
          ? messagesWithTimestamp.reduce((acc, msg, index) => {
              if (index === 0) return acc;
              const prevMsg = messagesWithTimestamp[index - 1];
              const timeDiff =
                new Date(msg.wa_timestamp).getTime() -
                new Date(prevMsg.wa_timestamp).getTime();
              return acc + timeDiff / (1000 * 60); // Convert to minutes
            }, 0) /
            (messagesWithTimestamp.length - 1)
          : 0;

      // Get recent data (last 10 items)
      const recentLeads = projectFilteredLeads
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 10);

      const recentConversations = projectFilteredConversations
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 10);

      // Calculate week-over-week performance
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const leadsThisWeek = projectFilteredLeads.filter(
        (l) => new Date(l.created_at) >= oneWeekAgo,
      ).length;
      const leadsLastWeek = projectFilteredLeads.filter(
        (l) =>
          new Date(l.created_at) >= twoWeeksAgo &&
          new Date(l.created_at) < oneWeekAgo,
      ).length;

      const conversionsThisWeek = projectFilteredLeads.filter(
        (l) =>
          (l.bant_status === "fully_qualified" || 
           l.state === "qualified" || 
           l.status === "qualified" ||
           l.status === "converted" || 
           l.status === "closed-won") &&
          new Date(l.updated_at) >= oneWeekAgo,
      ).length;
      const conversionsLastWeek = projectFilteredLeads.filter(
        (l) =>
          (l.bant_status === "fully_qualified" || 
           l.state === "qualified" || 
           l.status === "qualified" ||
           l.status === "converted" || 
           l.status === "closed-won") &&
          new Date(l.updated_at) >= twoWeeksAgo &&
          new Date(l.updated_at) < oneWeekAgo,
      ).length;

      setDashboardData({
        totalLeads,
        activeChats,
        conversionRate,
        responseTime: Math.round(avgResponseTime),
        recentLeads,
        recentConversations,
        performanceMetrics: {
          leadsThisWeek,
          leadsLastWeek,
          conversionsThisWeek,
          conversionsLastWeek,
          responseTimeThisWeek: Math.round(avgResponseTime),
          responseTimeLastWeek: Math.round(avgResponseTime * 1.1), // Placeholder
        },
        conversationAnalytics,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("ERROR Error loading dashboard data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      toast.error("Failed to load dashboard: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when project changes
  useEffect(() => {
    loadDashboardData();
  }, [currentProject?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    // REMOVED: Aggressive 5-minute interval causing performance issues
    // Dashboard will refresh via project change events only
    // Manual refresh available via refresh button if needed
    
    return () => {
      // No interval to clean up
    };
  }, [currentProject?.id]);

  // Listen for project data refresh events
  useEffect(() => {
    const handleProjectDataRefresh = (event: any) => {
      
      loadDashboardData();
    };

    const handleProjectChange = (event: any) => {
      
      // Clear current data and reload
      setDashboardData({
        totalLeads: 0,
        activeChats: 0,
        conversionRate: 0,
        responseTime: 0,
        recentLeads: [],
        recentConversations: [],
        performanceMetrics: {
          leadsThisWeek: 0,
          leadsLastWeek: 0,
          conversionsThisWeek: 0,
          conversionsLastWeek: 0,
          responseTimeThisWeek: 0,
          responseTimeLastWeek: 0,
        },
        conversationAnalytics: {
          messageVolume: [],
          responseRates: [],
          activeConversations: 0,
          totalMessages: 0,
        },
      });
      loadDashboardData();
    };

    window.addEventListener('project-data-refresh', handleProjectDataRefresh);
    window.addEventListener('project-changed', handleProjectChange);

    return () => {
      window.removeEventListener('project-data-refresh', handleProjectDataRefresh);
      window.removeEventListener('project-changed', handleProjectChange);
    };
  }, []);

  const getStatusColor = (status: string) => {
    // Handle real database status values
    switch (status?.toLowerCase()) {
      case "awareness":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "unqualified":
        return "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200";
      case "qualified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "converted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "closed-won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed-lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      // Handle state values too
      case "new_lead":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "information_gathering":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper function to determine lead temperature based on status
  const getLeadTemperature = (status?: string): LeadTemperature => {
    // Ensure status is a string before calling toLowerCase
    const statusStr = typeof status === 'string' ? status : '';
    
    switch (statusStr.toLowerCase()) {
      case "hot":
      case "qualified":
      case "proposal":
      case "negotiation":
        return "hot";
      case "warm":
      case "interested":
      case "contacted":
        return "warm";
      case "cold":
      case "new":
      case "unqualified":
        return "cold";
      default:
        return "cold";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading real dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard: {error}
          <Button
            onClick={loadDashboardData}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { performanceMetrics } = dashboardData;
  const leadsChange = calculatePercentageChange(
    performanceMetrics.leadsThisWeek,
    performanceMetrics.leadsLastWeek,
  );
  const conversionsChange = calculatePercentageChange(
    performanceMetrics.conversionsThisWeek,
    performanceMetrics.conversionsLastWeek,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {currentProject
              ? `${currentProject.name} Dashboard`
              : "All Projects Dashboard"}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {leadsChange >= 0 ? "+" : ""}
              {Math.round(leadsChange)}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.activeChats}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.conversationAnalytics.totalMessages} total messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dashboardData.conversionRate * 100) / 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              {conversionsChange >= 0 ? "+" : ""}
              {Math.round(conversionsChange)}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.responseTime}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Recent Leads</TabsTrigger>
          <TabsTrigger value="conversations">Recent Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentLeads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recent leads found
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lead.email || lead.phone || "No contact info"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status || "new"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentConversations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recent conversations found
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {conv.sender_number
                              ? `+${conv.sender_number}`
                              : "System Message"}
                          </p>
                          <p className="text-sm text-gray-600 truncate max-w-md">
                            {conv.message_content || "No content"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(conv.status)}>
                          {conv.status || "active"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealDataDashboard;
