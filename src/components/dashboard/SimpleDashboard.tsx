import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "@/context/ProjectContext";
import { simpleProjectService } from "@/services/simpleProjectService";
import { isLegacyPendingStatus, isLegacyQueuedStatus, isLegacyActiveStatus } from "@/utils/statusMapping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Database,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardData {
  leads: any[];
  conversations: any[];
  isLoading: boolean;
  error: string | null;
}

const SimpleDashboard: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const { currentProject } = useProject();

  const [data, setData] = useState<DashboardData>({
    leads: [],
    conversations: [],
    isLoading: true,
    error: null,
  });

  const fetchData = async () => {
    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      const [allLeads, allConversations] = await Promise.all([
        simpleProjectService.getAllLeads(),
        simpleProjectService.getAllConversations(),
      ]);

      setData({
        leads: allLeads || [],
        conversations: allConversations || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load dashboard data",
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject?.id]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const projectName = currentProject?.name || "All Projects";
    const projectId = currentProject?.id;

    // Filter data by project if one is selected
    const projectLeads = projectId
      ? data.leads.filter(
          (lead) =>
            lead.current_project_id === projectId ||
            lead.project_id === projectId,
        )
      : data.leads;

    const projectConversations = projectId
      ? data.conversations.filter((conv) =>
          projectLeads.some((lead) => lead.id === conv.lead_id),
        )
      : data.conversations;

    // Calculate metrics
    const totalLeads = projectLeads.length;
    const conversationsWithMessages = projectConversations.filter(
      (conv) => conv.messageCount && conv.messageCount > 0,
    ).length;
    const totalMessages = projectConversations.reduce(
      (sum, conv) => sum + (conv.messageCount || 0),
      0,
    );
    const activeLeads = projectLeads.filter(
      (lead) => isLegacyPendingStatus(lead.status) || isLegacyQueuedStatus(lead.status) || isLegacyActiveStatus(lead.status),
    ).length;

    return {
      projectName,
      totalLeads,
      conversationsWithMessages,
      totalMessages,
      activeLeads,
      projectConversations: projectConversations.length,
    };
  }, [data.leads, data.conversations, currentProject]);

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            {data.error}
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {stats.projectName}
          </h2>
          <p className="text-muted-foreground">Dashboard Analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 rounded-full border border-green-200 dark:border-green-800">
          <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Live Data
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.isLoading ? "..." : stats.totalLeads}
            </div>
            <p className="text-xs text-muted-foreground">
              Active prospects in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.isLoading ? "..." : stats.conversationsWithMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              Conversations with activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.isLoading ? "..." : stats.totalMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              Total message exchanges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.isLoading ? "..." : stats.activeLeads}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being worked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={() => (window.location.href = "/leads")}
              variant="outline"
              className="h-auto p-4 justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Manage Leads</div>
                <div className="text-xs text-muted-foreground">
                  View and edit lead information
                </div>
              </div>
            </Button>

            <Button
              onClick={() => (window.location.href = "/messages")}
              variant="outline"
              className="h-auto p-4 justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">View Messages</div>
                <div className="text-xs text-muted-foreground">
                  Check conversation history
                </div>
              </div>
            </Button>

            <Button
              onClick={fetchData}
              variant="outline"
              className="h-auto p-4 justify-start"
              disabled={data.isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${data.isLoading ? "animate-spin" : ""}`}
              />
              <div className="text-left">
                <div className="font-medium">Refresh Data</div>
                <div className="text-xs text-muted-foreground">
                  Update dashboard metrics
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Database Connection</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Data Sync</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Last Updated</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDashboard;
