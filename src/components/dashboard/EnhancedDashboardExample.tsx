import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { useProject } from "@/context/ProjectContext";
import { useProjectData } from "@/hooks/useProjectData";
import { simpleProjectService } from "@/services/simpleProjectService";
import { 
  isLegacyPendingStatus, 
  isLegacyQueuedStatus, 
  isLegacyActiveStatus, 
  isLegacyCompletedStatus,
  isLegacyFailedStatus,
  stringStatusToInt
} from "@/utils/statusMapping";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  TrendingUp,
  Target,
  MessageSquare,
  Calendar,
  FolderOpen,
  UserCheck,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Thermometer,
} from "lucide-react";
import {
  DashboardAnalyticsService,
  DashboardMetrics,
} from "@/services/dashboardAnalyticsService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import MobileDashboardLayout from "./MobileDashboardLayout";
import MobileOptimizedCharts from "./MobileOptimizedCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { debounce } from 'lodash';
import { EnglishText } from '@/components/common/RTLProvider';

// Import split components
import DashboardStatsSection from "./DashboardStatsSection";
import DashboardChartsSection from "./DashboardChartsSection";
import DashboardInsightsSection from "./DashboardInsightsSection";
import DashboardRecentActivity from "./DashboardRecentActivity";
import EditablePerformanceTargets from "./EditablePerformanceTargets";

const EnhancedDashboardExample: React.FC = () => {
  const { t } = useTranslation("widgets");
  const { t: tDashboard } = useTranslation("pages");
  const { isRTL, flexRowReverse, textStart, textEnd } = useLang();
  const { currentProject, projects } = useProject();

  // Memoize useProjectData options to prevent infinite re-renders
  const projectDataOptions = useMemo(() => ({
    autoRefresh: false, // Disable auto-refresh to prevent excessive requests
    includeWhatsAppMessages: false, // Disable to prevent excessive requests
    onError: (error: Error) => {
      console.error("Dashboard data error:", error);
      toast.error("Failed to load dashboard data");
    }
  }), []);

  // Use the new project data hook WITHOUT conversation loading to prevent infinite loop
  const {
    leads: allLeads,
    loading: realDataLoading,
    error: realDataError,
    refresh: refreshData,
    stats: dataStats
  } = useProjectData(projectDataOptions);

  // Create legacy format for compatibility (conversations not needed for dashboard stats)
  const realData = {
    leads: allLeads,
    conversations: [], // Empty array - dashboard doesn't need conversation data
    isLoading: realDataLoading,
    error: realDataError,
  };

  // Use stable mobile detection to prevent infinite re-renders
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    const debouncedResize = debounce(checkMobile, 100);
    window.addEventListener("resize", debouncedResize);
    
    return () => window.removeEventListener("resize", debouncedResize);
  }, []);

  // Simple debounce function to prevent excessive re-renders
  function debounce(func: () => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction() {
      const later = () => {
        clearTimeout(timeout);
        func();
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Load real-time metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setMetricsLoading(true);
        const analyticsService = new DashboardAnalyticsService();
        const metricsData = await analyticsService.getDashboardMetrics(
          currentProject?.id,
        );
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error loading real-time metrics:", error);
        // Keep existing metrics on error
      } finally {
        setMetricsLoading(false);
      }
    };

    loadMetrics();
  }, [currentProject?.id]);

  // Helper function to format percentages
  const formatPercentage = (value: number): string => {
    return Number(value.toFixed(3)).toString();
  };

  // MetricCard component for real-time metrics
  interface MetricCardProps {
    title: string;
    value: number | string;
    unit?: string;
    trend?: number;
    trendLabel?: string;
    icon: React.ElementType;
    color: "blue" | "green" | "orange" | "red" | "purple";
    loading?: boolean;
    subtitle?: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    unit,
    subtitle,
    trend,
    icon: Icon,
    color,
    loading,
    trendLabel = t("dashboard.fromLastWeek", "from last week"),
  }) => {
    const { isRTL, textStart } = useLang();
    const colorClasses = {
      blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
      green:
        "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800",
      orange:
        "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800",
      red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
      purple:
        "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
    };

    const iconColors = {
      blue: "text-blue-500 dark:text-blue-400",
      green: "text-green-500 dark:text-green-400",
      orange: "text-orange-500 dark:text-orange-400",
      red: "text-red-500 dark:text-red-400",
      purple: "text-purple-500 dark:text-purple-400",
    };

    if (loading) {
      return (
        <Card className="h-full bg-card dark:bg-card border-border dark:border-border" data-testid="metric-card-loading">
          <CardHeader
            className={cn(
              "flex flex-row items-center justify-between space-y-0 pb-2",
              isRTL ? "space-x-reverse" : "",
            )}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      );
    }

    const formatPercentage = (num: number): string => String(Math.round(num * 10) / 10);
    const isPositiveTrend = trend !== undefined && trend >= 0;

    return (
      <Card 
        className={cn(
          "h-full bg-card dark:bg-card border-border dark:border-border transition-colors hover:shadow-md",
          colorClasses[color],
        )}
        data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            isRTL ? "space-x-reverse" : "",
          )}
        >
          <CardTitle className={cn("text-sm font-medium text-foreground dark:text-foreground", textStart())}>
            {title}
          </CardTitle>
          <Icon className={cn("h-4 w-4", iconColors[color])} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold text-foreground dark:text-foreground metric", textStart())} data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
            {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
          </div>
          {subtitle && (
            <p className={cn("text-xs text-muted-foreground mt-1", textStart())}>{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={cn("text-xs text-muted-foreground mt-1", textStart())}>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  isPositiveTrend
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                <span className="font-medium">
                  {isPositiveTrend ? "+" : ""}
                  {formatPercentage(trend)}%
                </span>
              </span>{" "}
              {trendLabel}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // TemperatureDistribution component
  interface TemperatureDistributionProps {
    distribution: {
      cold: number;
      warm: number;
      hot: number;
      burning: number;
      total: number;
    };
    loading?: boolean;
  }

  const TemperatureDistribution: React.FC<TemperatureDistributionProps> = ({
    distribution,
    loading = false,
  }) => {
    if (loading) {
      return (
        <Card className="h-full" data-testid="temperature-distribution-loading">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Cold", "Warm", "Hot", "Burning"].map((temp) => (
                <div key={temp} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    const temperatureData = [
      {
        name: "Cold",
        value: distribution.cold,
        color: "#8E9196",
        percentage: distribution.total > 0 ? (distribution.cold / distribution.total) * 100 : 0,
      },
      {
        name: "Warm",
        value: distribution.warm,
        color: "#D3E4FD",
        percentage: distribution.total > 0 ? (distribution.warm / distribution.total) * 100 : 0,
      },
      {
        name: "Hot",
        value: distribution.hot,
        color: "#FEC6A1",
        percentage: distribution.total > 0 ? (distribution.hot / distribution.total) * 100 : 0,
      },
      {
        name: "Burning",
        value: distribution.burning,
        color: "#ea384c",
        percentage: distribution.total > 0 ? (distribution.burning / distribution.total) * 100 : 0,
      },
    ];

    return (
      <Card className="h-full" data-testid="temperature-distribution-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground">
            {t("leadTemperature.distribution", "Lead Temperature Distribution")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("leadTemperature.distributionDescription", "Current heat levels across your pipeline")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {temperatureData.map((item) => (
              <div key={item.name} className="flex items-center justify-between" data-testid={`temperature-${item.name.toLowerCase()}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-foreground dark:text-foreground">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-semibold text-foreground dark:text-foreground">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // The project change handling is now automatic via useProjectData hook
  // This effect is no longer needed but kept for any additional custom handling

  // Real-time metrics state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Widget visibility state
  const [widgetVisibility, setWidgetVisibility] = useState({
    // Real-time metrics widgets
    totalLeads: true,
    bantQualification: true,
    hotBurningLeads: true,
    firstMessageRate: true,
    meetingPipeline: true,
    temperatureDistribution: true,
    pipelineOverview: true,
    // Charts widgets
    interactiveAreaChart: true, // Performance Trends chart
    // Existing widgets - DISABLE LEGACY METRICS TO PREVENT DUPLICATION
    metrics: false,
    monthlyPerformance: true,
    leadsConversions: true,
    revenueChannel: true,
    pieCharts: true,
  });

  const toggleWidget = (widgetKey: keyof typeof widgetVisibility) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetKey]: !prev[widgetKey],
    }));
  };

  const hideAllWidgets = () => {
    setWidgetVisibility({
      // Real-time metrics widgets
      totalLeads: false,
      bantQualification: false,
      hotBurningLeads: false,
      firstMessageRate: false,
      meetingPipeline: false,
      temperatureDistribution: false,
      pipelineOverview: false,
      // Charts widgets
      interactiveAreaChart: false,
      // Existing widgets
      metrics: false,
      monthlyPerformance: false,
      leadsConversions: false,
      revenueChannel: false,
      pieCharts: false,
    });
  };

  const showAllWidgets = () => {
    setWidgetVisibility({
      // Real-time metrics widgets
      totalLeads: true,
      bantQualification: true,
      hotBurningLeads: true,
      firstMessageRate: true,
      meetingPipeline: true,
      temperatureDistribution: true,
      pipelineOverview: true,
      // Charts widgets
      interactiveAreaChart: true,
      // Existing widgets - KEEP LEGACY METRICS DISABLED TO PREVENT DUPLICATION
      metrics: false,
      monthlyPerformance: true,
      leadsConversions: true,
      revenueChannel: true,
      pieCharts: true,
    });
  };

  const visibleWidgetsCount =
    Object.values(widgetVisibility).filter(Boolean).length;

  // Filter data based on current project
  const projectName = currentProject?.name || "All Projects";
  const projectId = currentProject?.id;

  // Calculate real stats based on fetched data
  const enhancedStats = useMemo(() => {
    // Filter data by project if one is selected
    const projectLeads = projectId
      ? realData.leads.filter(
          (lead) =>
            lead.current_project_id === projectId,
        )
      : realData.leads;

    const projectConversations = projectId
      ? realData.conversations.filter((conv) =>
          projectLeads.some((lead) => lead.id === conv.lead_id),
        )
      : realData.conversations;

    // Calculate BANT/HEAT focused metrics
    const totalLeads = projectLeads.length;
    
    // Use compatible status checking for both integer and string status values
    const reachedLeads = projectLeads.filter(
      (lead) => {
        return isLegacyPendingStatus(lead.status) || isLegacyQueuedStatus(lead.status) || isLegacyActiveStatus(lead.status);
      }
    ).length;

    // BANT qualification rate (assuming queued+ are qualified)
    const bantQualified = projectLeads.filter(
      (lead) => isLegacyQueuedStatus(lead.status) || isLegacyActiveStatus(lead.status) || isLegacyCompletedStatus(lead.status),
    ).length;
    const bantQualificationRate =
      totalLeads > 0 ? Math.round((bantQualified / totalLeads) * 100) : 0;

    // Lead heat progression (compatible with both integer and string status)
    const coldLeads = projectLeads.filter((lead) => isLegacyPendingStatus(lead.status)).length;
    const warmLeads = projectLeads.filter((lead) => isLegacyQueuedStatus(lead.status)).length;
    const hotLeads = projectLeads.filter((lead) => isLegacyActiveStatus(lead.status)).length;
    const burningLeads = projectLeads.filter((lead) => isLegacyCompletedStatus(lead.status)).length;

    // First message automation (leads that have been contacted)
    const firstMessageSent = projectLeads.filter(
      (lead) => isLegacyQueuedStatus(lead.status) || isLegacyActiveStatus(lead.status) || isLegacyCompletedStatus(lead.status),
    ).length;
    const firstMessageRate =
      totalLeads > 0 ? Math.round((firstMessageSent / totalLeads) * 100) : 0;

    // Meeting scheduling (assuming requires_human_review means meeting scheduled)
    const meetingsScheduled = projectLeads.filter(
      (lead) => lead.requires_human_review === true,
    ).length;
    const meetingRate =
      totalLeads > 0 ? Math.round((meetingsScheduled / totalLeads) * 100) : 0;

    return [
      {
        title: t("totalLeads.title", "Total Leads"),
        value: totalLeads,
        trend: {
          value: 8.5,
          label: t("trends.fromLastWeek", "from last week"),
        },
        icon: Users,
        color: "blue" as const,
        details: {
          explanation: "Total leads in your pipeline across all heat levels",
          importance:
            "Your complete lead database for outreach and qualification",
          timeframe: "Current total count",
        },
      },
      // SUCCESS REMOVED DUPLICATE METRICS (these are now in the top RealTimeDashboardMetrics section):
      // - BANT Qualification Rate (duplicate with top section)
      // - Hot & Burning Leads (duplicate with top section)
      // - First Message Rate (duplicate with top section)
      // - Lead Temperature Distribution (duplicate with top section)
      // - Meeting Pipeline (duplicate with top section)
      //
      // SUCCESS Keeping only unique metrics in this section
    ];
  }, [projectId, projects.length, realData.leads, realData.conversations, t]);

  // Enhanced chart data (simplified for bundler efficiency)
  const leadsConversionsData = [
    { month: "Jan", leads: 120, conversions: 12 },
    { month: "Feb", leads: 135, conversions: 18 },
    { month: "Mar", leads: 142, conversions: 25 },
    { month: "Apr", leads: 158, conversions: 32 },
    { month: "May", leads: 167, conversions: 28 },
    { month: "Jun", leads: 175, conversions: 35 },
  ];

  const leadsConversionsConfig = {
    leads: {
      label: t("totalLeads.title", "Leads"),
      color: "hsl(var(--chart-1))",
    },
    conversions: {
      label: t("conversationsCompleted.conversionRate", "Conversions"),
      color: "hsl(var(--chart-2))",
    },
  };

  // Replace Revenue data with BANT/HEAT Lead Progression data
  const leadStatusData = [
    { month: "Jan", cold: 45, warm: 38, hot: 28, burning: 12, meetings: 8 },
    { month: "Feb", cold: 52, warm: 45, hot: 35, burning: 18, meetings: 12 },
    { month: "Mar", cold: 48, warm: 42, hot: 32, burning: 25, meetings: 15 },
    { month: "Apr", cold: 58, warm: 52, hot: 38, burning: 32, meetings: 18 },
    { month: "May", cold: 62, warm: 55, hot: 41, burning: 28, meetings: 16 },
    { month: "Jun", cold: 68, warm: 61, hot: 47, burning: 35, meetings: 22 },
  ];

  const leadStatusConfig = {
    cold: {
      label: t("leadTemperature.cold", "Cold Leads"),
      color: "hsl(var(--chart-1))",
    },
    warm: {
      label: t("leadTemperature.warm", "Warm Leads"),
      color: "hsl(var(--chart-2))",
    },
    hot: {
      label: t("leadTemperature.hot", "Hot Leads"),
      color: "hsl(var(--chart-3))",
    },
    burning: {
      label: t("leadTemperature.burning", "Burning Leads"),
      color: "hsl(var(--chart-4))",
    },
    meetings: {
      label: t("meetings.calendlyMeetingsBooked", "Calendly Meetings"),
      color: "hsl(var(--chart-5))",
    },
  };

  // Generate real monthly performance data from actual leads
  const generateMonthlyPerformanceData = useMemo(() => {
    if (!allLeads || allLeads.length === 0) {
      // Return empty data if no leads available
      return [];
    }

    // Get last 6 months of data
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      // Filter leads for this month
      const monthLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= month && leadDate < nextMonth;
      });

      // Calculate metrics for this month
      const totalLeads = monthLeads.length;
      const reachedLeads = monthLeads.filter(lead => 
        lead.interaction_count && lead.interaction_count > 0
      ).length;
      
      // Count conversions (qualified leads)
      const conversions = monthLeads.filter(lead => {
        const qualifiedStatuses = [
          "partially_qualified", "fully_qualified", "budget_qualified",
          "authority_qualified", "need_qualified", "timing_qualified"
        ];
        return qualifiedStatuses.includes(lead.bant_status);
      }).length;

      // Count meetings based on REAL database schema
      const meetings = monthLeads.filter(lead => 
        lead.requires_human_review || 
        // Real status values from database: "awareness", "unqualified", etc.
        lead.state === 'contacted' ||
        lead.state === 'information_gathering' ||
        lead.bant_status === 'need_qualified' ||
        
        // Fallback for legacy status checking
        (typeof lead.status === 'string' && (
          lead.status.includes('qualified') ||
          lead.status.includes('meeting') ||
          lead.status.includes('contacted')
        ))
      ).length;

      // Estimate messages (interaction count * average messages per interaction)
      const messages = monthLeads.reduce((sum, lead) => 
        sum + (lead.interaction_count || 0), 0
      ) * 2; // Assume average 2 messages per interaction

      months.push({
        date: month.toISOString().split('T')[0], // Proper date format for chart
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        leads: totalLeads,
        reach: reachedLeads,
        conversions: conversions,
        meetings: meetings,
        messages: messages,
      });
    }

    return months;
  }, [allLeads]);

  const monthlyPerformanceConfig = {
    leads: {
      label: t("totalLeads.title", "Leads"),
      color: "hsl(var(--chart-1))",
    },
    reach: {
      label: t("reachedLeads.title", "Reach"),
      color: "hsl(var(--chart-2))",
    },
    conversions: {
      label: t("conversationsCompleted.conversionRate", "Conversions"),
      color: "hsl(var(--chart-3))",
    },
    meetings: {
      label: t("conversationsCompleted.meetings", "Meetings"),
      color: "hsl(var(--chart-4))",
    },
    messages: {
      label: t("messagesSent.title", "Messages"),
      color: "hsl(var(--chart-5))",
    },
  };

  // Mobile Layout - Use proper mobile-first responsive design
  if (isMobile) {
    return (
      <div
        key={currentProject?.id || 'no-project'}
        className={cn(
          "min-h-screen w-full bg-background dark:bg-background",
          "overflow-x-hidden max-w-full", // Prevent horizontal overflow
          "p-3 space-y-3", // Tighter mobile spacing
          "box-border" // Ensure padding doesn't cause overflow
        )}
        data-testid="mobile-dashboard"
      >
        <h2 className="text-xl font-bold text-foreground dark:text-foreground">
          {tDashboard("dashboard.title", "Dashboard")}
        </h2>
        <p className="text-sm text-muted-foreground">{projectName}</p>

        {realData.isLoading ? (
          <div className="grid gap-3 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted dark:bg-muted rounded animate-pulse w-full"
                data-testid={`mobile-metric-skeleton-${i}`}
              />
            ))}
          </div>
        ) : (
          <div 
            data-testid="mobile-dashboard-stats" 
            className={cn(
              "w-full space-y-3",
              "isolate", // Create new stacking context
              "overflow-visible", // Ensure content isn't clipped
              "flex flex-col", // Explicit flex column layout
              "min-w-0" // Prevent shrinking below content size
            )}
          >
            {/* Main Metric Cards - Independent sizing container */}
            <div 
              className={cn(
                "grid gap-3 grid-cols-1 w-full",
                "auto-rows-fr", // Equal height rows
                "place-items-stretch", // Stretch items to fill space
                "isolate" // Create new stacking context
              )}
            >
              {/* Total Leads */}
              {widgetVisibility.totalLeads && (
                <div className="w-full">
                  <MetricCard
                    title={tDashboard("dashboard.totalLeads", "Total Leads")}
                    value={metrics?.lead_temperature_distribution.total || 0}
                    trend={8.5}
                    icon={Users}
                    color="blue"
                    loading={metricsLoading}
                    subtitle={tDashboard("dashboard.allLeadsInPipeline", "All leads in pipeline")}
                  />
                </div>
              )}

              {/* BANT Qualification Rate */}
              {widgetVisibility.bantQualification && (
                <div className="w-full">
                  <MetricCard
                    title={tDashboard("dashboard.bantQualificationRate", "BANT Qualification Rate")}
                    value={formatPercentage(
                      metrics?.bant_qualification_rate.percentage || 0,
                    )}
                    unit="%"
                    trend={metrics?.bant_qualification_rate.trend_weekly}
                    icon={UserCheck}
                    color="green"
                    loading={metricsLoading}
                    subtitle={`${metrics?.bant_qualification_rate.qualified_count || 0} ${tDashboard("dashboard.of", "of")} ${metrics?.bant_qualification_rate.total_assessed || 0} ${tDashboard("dashboard.leads", "leads")}`}
                  />
                </div>
              )}

              {/* Hot & Burning Leads */}
              {widgetVisibility.hotBurningLeads && (
                <div className="w-full">
                  <MetricCard
                    title={tDashboard("dashboard.hotBurningLeads", "Hot & Burning Leads")}
                    value={
                      (metrics?.lead_temperature_distribution.hot || 0) +
                      (metrics?.lead_temperature_distribution.burning || 0)
                    }
                    trend={12.3}
                    icon={Thermometer}
                    color="orange"
                    loading={metricsLoading}
                    subtitle={tDashboard("dashboard.highPriorityLeads", "High priority leads requiring immediate attention")}
                  />
                </div>
              )}

              {/* First Message Rate */}
              {widgetVisibility.firstMessageRate && (
                <div className="w-full">
                  <MetricCard
                    title={tDashboard("dashboard.firstMessageRate", "First Message Rate")}
                    value={formatPercentage(
                      metrics?.first_message_rate.percentage || 0,
                    )}
                    unit="%"
                    trend={metrics?.first_message_rate.trend_weekly}
                    icon={MessageSquare}
                    color="purple"
                    loading={metricsLoading}
                    subtitle={`${metrics?.first_message_rate.contacted_count || 0} ${tDashboard("dashboard.messagesSent", "messages sent")}`}
                  />
                </div>
              )}
            </div>

            {/* Temperature Distribution */}
            {widgetVisibility.temperatureDistribution && (
              <div className="w-full">
                <TemperatureDistribution
                  distribution={
                    metrics?.lead_temperature_distribution || {
                      cold: 0,
                      warm: 0,
                      hot: 0,
                      burning: 0,
                      total: 0,
                    }
                  }
                  loading={metricsLoading}
                />
              </div>
            )}

            {/* Enhanced Stats Section */}
            <div className="w-full">
              <DashboardStatsSection
                enhancedStats={enhancedStats}
                isLoading={realData.isLoading}
                onToggleVisibility={() => {}}
                visibleWidgetsCount={visibleWidgetsCount}
              />
            </div>
          </div>
        )}

        {/* Charts Section - ENHANCED MOBILE WITH FULL PARITY */}
        <div className="w-full">
          <MobileOptimizedCharts
            leadsData={leadsConversionsData.map(d => ({ 
              name: d.month, 
              value: d.leads, 
              trend: Math.random() * 20 - 10 
            }))}
            conversionsData={leadsConversionsData.map(d => ({ 
              name: d.month, 
              value: d.conversions, 
              trend: Math.random() * 15 - 5 
            }))}
            temperatureData={[
              { name: 'Cold', value: metrics?.lead_temperature_distribution?.cold || 25, fill: 'hsl(var(--chart-1))' },
              { name: 'Warm', value: metrics?.lead_temperature_distribution?.warm || 35, fill: 'hsl(var(--chart-2))' },
              { name: 'Hot', value: metrics?.lead_temperature_distribution?.hot || 28, fill: 'hsl(var(--chart-3))' },
              { name: 'Burning', value: metrics?.lead_temperature_distribution?.burning || 12, fill: 'hsl(var(--chart-4))' }
            ]}
            performanceData={generateMonthlyPerformanceData.map(d => ({ 
              name: d.name || d.date || d.month, 
              value: d.leads || d.desktop || 0,
              trend: Math.random() * 25 - 10 
            }))}
            className="mt-4"
          />
        </div>

        {/* Recent Activity Section */}
        <div className="w-full overflow-hidden">
          <DashboardRecentActivity />
        </div>

        {/* Performance Analytics Section - MOBILE PARITY FIX */}
        <div className="w-full">
          <DashboardInsightsSection metrics={metrics} loading={metricsLoading} />
        </div>

        {/* Editable Performance Targets Section - MOBILE PARITY FIX */}
        <div className="w-full">
          <EditablePerformanceTargets
            projectId={projectId}
            clientId={undefined}
            className="mt-6"
          />
        </div>
      </div>
    );
  }

  // Desktop Layout - Clean and organized with mobile-first responsive design
  return (
    <div
      key={currentProject?.id || 'no-project'}
      className={cn(
        "min-h-screen w-full bg-background dark:bg-background",
        "overflow-x-hidden max-w-full", // Prevent horizontal overflow
        "p-3 sm:p-4 md:p-6", // Mobile-first responsive padding
        "space-y-3 sm:space-y-4 md:space-y-6", // Mobile-first responsive spacing
        "box-border" // Ensure padding doesn't cause overflow
      )}
      data-testid="desktop-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground">
            {tDashboard("dashboard.title", "Dashboard")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {projectName} • {t("dashboard.lastUpdated", "Last updated")}: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {realData.isLoading ? (
              t("dashboard.loading", "Loading...")
            ) : (
              <>
                {visibleWidgetsCount} <EnglishText>{t("dashboard.activeWidgets", "Active Widgets")}</EnglishText>
              </>
            )}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                <EnglishText>{t("dashboard.customize", "Customize")}</EnglishText>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {t("dashboard.showHideWidgets", "Show/Hide Widgets")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => toggleWidget("totalLeads")}
              >
                {widgetVisibility.totalLeads ? (
                  <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                ) : (
                  <EyeOff className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                )}
                {t("totalLeads.title", "Total Leads")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleWidget("bantQualification")}
              >
                {widgetVisibility.bantQualification ? (
                  <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                ) : (
                  <EyeOff className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                )}
                <EnglishText>{t("bantQualification.title", "BANT Qualification")}</EnglishText>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleWidget("monthlyPerformance")}
              >
                {widgetVisibility.monthlyPerformance ? (
                  <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                ) : (
                  <EyeOff className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                )}
                {tDashboard("dashboard.monthlyPerformance", "Monthly Performance")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={showAllWidgets}>
                <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                <EnglishText>Show All</EnglishText>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={hideAllWidgets}>
                <EyeOff className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                <EnglishText>Hide All</EnglishText>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            data-testid="dashboard-refresh-button"
          >
            <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            <EnglishText>Refresh</EnglishText>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {realData.error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200" data-testid="dashboard-error">
          {realData.error}
        </div>
      )}

      {/* Real-Time Analytics Section */}
      <div className={cn(
        "space-y-3 sm:space-y-4 md:space-y-6",
        "w-full overflow-hidden" // Prevent content overflow
      )}>
        <div className={cn(
          "grid gap-3 sm:gap-4 w-full",
          "grid-cols-1", // Always single column on mobile
          "sm:grid-cols-2", // Two columns on small screens
          "lg:grid-cols-4", // Four columns on large screens
          "max-w-full" // Ensure grid doesn't exceed screen width
        )} data-testid="dashboard-metrics-grid">
          {/* Total Leads */}
          {widgetVisibility.totalLeads && (
            <MetricCard
              title={tDashboard("dashboard.totalLeads", "Total Leads")}
              value={metrics?.lead_temperature_distribution.total || 0}
              trend={8.5} // Placeholder trend - could be calculated from weekly data
              icon={Users}
              color="blue"
              loading={metricsLoading}
              subtitle={tDashboard("dashboard.allLeadsInPipeline", "All leads in pipeline")}
            />
          )}

          {/* BANT Qualification Rate */}
          {widgetVisibility.bantQualification && (
            <MetricCard
              title={tDashboard("dashboard.bantQualificationRate", "BANT Qualification Rate")}
              value={formatPercentage(
                metrics?.bant_qualification_rate.percentage || 0,
              )}
              unit="%"
              trend={metrics?.bant_qualification_rate.trend_weekly}
              icon={UserCheck}
              color="green"
              loading={metricsLoading}
              subtitle={`${metrics?.bant_qualification_rate.qualified_count || 0} ${tDashboard("dashboard.of", "of")} ${metrics?.bant_qualification_rate.total_assessed || 0} ${tDashboard("dashboard.leads", "leads")}`}
            />
          )}

          {/* Hot & Burning Leads */}
          {widgetVisibility.hotBurningLeads && (
            <MetricCard
              title={tDashboard("dashboard.hotBurningLeads", "Hot & Burning Leads")}
              value={
                (metrics?.lead_temperature_distribution.hot || 0) +
                (metrics?.lead_temperature_distribution.burning || 0)
              }
              trend={metrics?.lead_temperature_distribution.trend_weekly}
              icon={Thermometer}
              color="orange"
              loading={metricsLoading}
              subtitle={tDashboard("dashboard.highPriorityLeads", "High priority leads")}
            />
          )}

          {/* First Message Rate */}
          {widgetVisibility.firstMessageRate && (
            <MetricCard
              title={tDashboard("dashboard.firstMessageRate", "First Message Rate")}
              value={formatPercentage(
                metrics?.first_message_rate.percentage || 0,
              )}
              unit="%"
              trend={metrics?.first_message_rate.trend_weekly}
              icon={MessageSquare}
              color="purple"
              loading={metricsLoading}
              subtitle={`${metrics?.first_message_rate.contacted_count || 0} ${tDashboard("dashboard.contacted", "contacted")}`}
            />
          )}

          {/* Meeting Pipeline */}
          {widgetVisibility.meetingPipeline && (
            <MetricCard
              title={tDashboard("dashboard.meetingPipeline", "Meeting Pipeline")}
              value={metrics?.meeting_pipeline.total_meetings || 0}
              trend={metrics?.meeting_pipeline.trend_weekly}
              icon={Calendar}
              color="green"
              loading={metricsLoading}
              subtitle={`${formatPercentage(
                metrics?.meeting_pipeline.conversion_rate || 0,
              )}% ${tDashboard("dashboard.conversionRate", "conversion rate")}`}
            />
          )}

          {/* Temperature Distribution */}
          {widgetVisibility.temperatureDistribution && (
            <TemperatureDistribution
              distribution={
                metrics?.lead_temperature_distribution || {
                  cold: 0,
                  warm: 0,
                  hot: 0,
                  burning: 0,
                  total: 0,
                }
              }
              loading={metricsLoading}
            />
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      {widgetVisibility.metrics && (
        <DashboardStatsSection
          enhancedStats={enhancedStats}
          isLoading={realData.isLoading}
          onToggleVisibility={() => toggleWidget("metrics")}
          visibleWidgetsCount={visibleWidgetsCount}
        />
      )}

      {/* Charts Section */}
      <DashboardChartsSection
        widgetVisibility={widgetVisibility}
        leadsConversionsData={leadsConversionsData}
        leadsConversionsConfig={leadsConversionsConfig}
        leadsConversionsAnalytics={{}}
        revenueData={leadStatusData}
        revenueConfig={leadStatusConfig}
        revenueAnalytics={{}}
        monthlyPerformanceData={generateMonthlyPerformanceData}
        monthlyPerformanceConfig={monthlyPerformanceConfig}
        monthlyPerformanceAnalytics={{}}
      />

      {/* Recent Activity Section */}
      <DashboardRecentActivity />

      {/* Performance Analytics Section */}
      <DashboardInsightsSection metrics={metrics} loading={metricsLoading} />

      {/* Editable Performance Targets Section */}
      <EditablePerformanceTargets
        projectId={projectId}
        clientId={undefined}
        className="mt-6"
      />
    </div>
  );
};

export default EnhancedDashboardExample;
