import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Terminal,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Settings,
  Info,
  Bug,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/ClientAuthContext";
import { useProject } from "@/context/ProjectContext";
import { simpleProjectService } from "@/services/simpleProjectService";
import { cn } from "@/lib/utils";

interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  source: string;
  message: string;
  data?: any;
}

interface DatabaseStatus {
  connected: boolean;
  tables: Record<string, { count: number; error?: string }>;
  lastCheck: string;
}

interface SystemStats {
  totalLeads: number;
  totalProjects: number;
  totalClients: number;
  totalConversations: number;
  activeConnections: number;
  lastSync: string;
}

export const DebugPanel: React.FC = () => {
  const { user } = useAuth();
  const { currentProject } = useProject();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [verboseMode, setVerboseMode] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Add log entry
  const addLog = (
    level: LogEntry["level"],
    source: string,
    message: string,
    data?: any,
  ) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    };

    setLogs((prev) => [entry, ...prev.slice(0, 99)]); // Keep last 100 logs

    if (verboseMode || level === "error") {
      console.log(`[${level.toUpperCase()}] ${source}: ${message}`, data);
    }
  };

  // Check database status
  const checkDatabaseStatus = async () => {
    addLog("info", "DEBUG_PANEL", "Starting database status check");
    setIsLoading(true);

    try {
      const tables = [
        "clients",
        "projects",
        "leads",
        "conversations",
        "whatsapp_messages",
      ];
      const tableStatus: Record<string, { count: number; error?: string }> = {};

      for (const table of tables) {
        try {
          let count = 0;
          switch (table) {
            case "leads":
              const leads = await simpleProjectService.getAllLeads();
              count = leads?.length || 0;
              break;
            case "projects":
              const projects = await simpleProjectService.getProjects();
              count = projects?.length || 0;
              break;
            case "conversations":
              const conversations =
                await simpleProjectService.getAllConversations();
              count = conversations?.length || 0;
              break;
            case "whatsapp_messages":
              const messages =
                await simpleProjectService.getWhatsAppMessages(100);
              count = messages?.length || 0;
              break;
            default:
              count = 0;
          }

          tableStatus[table] = { count };
          addLog("success", "DB_CHECK", `${table}: ${count} records`);
        } catch (error) {
          tableStatus[table] = { count: 0, error: error.message };
          addLog("error", "DB_CHECK", `${table}: ${error.message}`);
        }
      }

      setDbStatus({
        connected: Object.values(tableStatus).some((t) => !t.error),
        tables: tableStatus,
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      addLog("error", "DEBUG_PANEL", `Database check failed: ${error.message}`);
      setDbStatus({
        connected: false,
        tables: {},
        lastCheck: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get system statistics
  const getSystemStats = async () => {
    addLog("info", "DEBUG_PANEL", "Loading system statistics");

    try {
      const stats = await simpleProjectService.getDashboardStats();

      setSystemStats({
        totalLeads: stats.totalLeads,
        totalProjects: stats.totalProjects,
        totalClients: stats.totalClients,
        totalConversations: stats.totalConversations,
        activeConnections: 1, // User is connected
        lastSync: new Date().toISOString(),
      });

      addLog(
        "success",
        "STATS",
        `Loaded stats: ${stats.totalLeads} leads, ${stats.totalProjects} projects`,
      );
    } catch (error) {
      addLog("error", "STATS", `Failed to load stats: ${error.message}`);
    }
  };

  // Test API endpoints
  const testAPIEndpoints = async () => {
    addLog("info", "API_TEST", "Testing API endpoints");

    const endpoints = [
      { name: "Leads", test: () => simpleProjectService.getAllLeads() },
      { name: "Projects", test: () => simpleProjectService.getProjects() },
      {
        name: "Conversations",
        test: () => simpleProjectService.getAllConversations(),
      },
      {
        name: "Messages",
        test: () => simpleProjectService.getWhatsAppMessages(5),
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await endpoint.test();
        const count = Array.isArray(result) ? result.length : 1;
        addLog("success", "API_TEST", `${endpoint.name}: OK (${count} items)`);
      } catch (error) {
        addLog("error", "API_TEST", `${endpoint.name}: ${error.message}`);
      }
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog("info", "DEBUG_PANEL", "Logs cleared");
  };

  // Export logs
  const exportLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog("info", "DEBUG_PANEL", "Logs exported");
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkDatabaseStatus();
        getSystemStats();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    addLog("info", "DEBUG_PANEL", "Debug panel initialized");
    checkDatabaseStatus();
    getSystemStats();
  }, []);

  // Log level colors
  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-slate-400";
    }
  };

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Debug Tools</h2>
          {currentProject && (
            <Badge variant="outline">Project: {currentProject.name}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVerboseMode(!verboseMode)}
            className={cn(verboseMode && "bg-blue-50 text-blue-700")}
          >
            {verboseMode ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Verbose
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "bg-green-50 text-green-700")}
          >
            <RefreshCw
              className={cn("h-4 w-4", autoRefresh && "animate-spin")}
            />
            Auto Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge
                    variant={dbStatus?.connected ? "default" : "destructive"}
                  >
                    {dbStatus?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">User</span>
                  <Badge variant={user ? "default" : "destructive"}>
                    {user ? "Authenticated" : "Not authenticated"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Project</span>
                  <Badge variant={currentProject ? "default" : "secondary"}>
                    {currentProject ? "Selected" : "None"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {systemStats ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Leads</span>
                      <Badge variant="secondary">
                        {systemStats.totalLeads}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Projects</span>
                      <Badge variant="secondary">
                        {systemStats.totalProjects}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Conversations
                      </span>
                      <Badge variant="secondary">
                        {systemStats.totalConversations}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              onClick={checkDatabaseStatus}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
              />
              Check Status
            </Button>
            <Button onClick={testAPIEndpoints} variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Test APIs
            </Button>
          </div>

          {dbStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dbStatus.tables).map(([table, status]) => (
                <Card key={table}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{table}</span>
                      {status.error ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {status.error ? (
                      <p className="text-sm text-red-600">{status.error}</p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {status.count} records
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={clearLogs} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Badge variant="secondary">{logs.length} entries</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="p-4 space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No logs yet. Debug actions will appear here.
                    </p>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <div className={cn("mt-0.5", getLevelColor(log.level))}>
                          {getLevelIcon(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                          </div>
                          <p className="text-sm">{log.message}</p>
                          {log.data && (
                            <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  API Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={testAPIEndpoints}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Test All Endpoints
                </Button>
                <Button
                  onClick={getSystemStats}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Refresh Statistics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Data Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() =>
                    addLog("info", "MANUAL", "Manual test log entry")
                  }
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Add Test Log
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertDescription>
              Debug tools help identify issues with data loading, API
              connectivity, and project switching. Use verbose mode to see
              detailed logging in the browser console.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};
