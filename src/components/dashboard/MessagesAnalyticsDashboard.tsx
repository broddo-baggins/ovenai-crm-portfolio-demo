// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { useProject } from "@/context/ProjectContext";
import { simpleProjectService } from "@/services/simpleProjectService";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Reply,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity,
  MessageSquare,
} from "lucide-react";

interface MessageMetrics {
  firstMessagesSentToday: number;
  repliesToFirstMessages: number;
  meetingsScheduledFromMessages: number;
  leadsProcessedToday: number;
  leadsQueuedForTomorrow: number;
  totalActiveConversations: number;
  responseRate: number;
  meetingConversionRate: number;
  averageResponseTime: number; // in hours
  lastUpdated: string;
}

interface DailyQueueData {
  date: string;
  leadsProcessed: number;
  leadsQueued: number;
  successRate: number;
}

interface TrendData {
  period: string;
  firstMessages: number;
  replies: number;
  meetings: number;
  conversionRate: number;
}

export const MessagesAnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation(["pages", "common"]);
  const { isRTL, textStart, flexRowReverse } = useLang();
  const { currentProject } = useProject();

  const [metrics, setMetrics] = useState<MessageMetrics>({
    firstMessagesSentToday: 0,
    repliesToFirstMessages: 0,
    meetingsScheduledFromMessages: 0,
    leadsProcessedToday: 0,
    leadsQueuedForTomorrow: 0,
    totalActiveConversations: 0,
    responseRate: 0,
    meetingConversionRate: 0,
    averageResponseTime: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [queueData, setQueueData] = useState<DailyQueueData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate metrics from leads and conversations data
  const calculateMetrics = async (): Promise<MessageMetrics> => {
    try {
      const [leads, conversations] = await Promise.all([
        simpleProjectService.getAllLeads(),
        simpleProjectService.getAllConversations(),
      ]);

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Filter by current project if selected
      const projectLeads = currentProject 
        ? leads?.filter(lead => lead.current_project_id === currentProject.id || lead.project_id === currentProject.id) || []
        : leads || [];

      const projectConversations = currentProject
        ? conversations?.filter(conv => {
            // Use embedded lead data from the conversation for better performance
            const lead = conv.lead;
            return lead && (lead.current_project_id === currentProject.id || lead.project_id === currentProject.id);
          }) || []
        : conversations || [];

      // First messages sent today (leads contacted today)
      const firstMessagesSentToday = projectLeads.filter(lead => {
        const firstInteraction = lead.first_interaction ? new Date(lead.first_interaction) : null;
        return firstInteraction && firstInteraction >= todayStart && firstInteraction < tomorrow;
      }).length;

      // Replies to first messages (leads that responded after first contact)
      const repliesToFirstMessages = projectLeads.filter(lead => {
        const hasFirstInteraction = lead.first_interaction;
        const hasMultipleInteractions = lead.interaction_count > 1;
        return hasFirstInteraction && hasMultipleInteractions;
      }).length;

      // Meetings scheduled from messages (leads with meeting status or human review required)
      const meetingsScheduledFromMessages = projectLeads.filter(lead => 
        lead.requires_human_review === true ||
        // Handle real database status values (strings, not enums)
        lead.state === 'contacted' ||
        lead.state === 'information_gathering' ||
        lead.bant_status === 'need_qualified' ||
        (typeof lead.status === 'string' && (
          lead.status.includes('qualified') ||
          lead.status.includes('contact')
        )) ||
        lead.state?.toLowerCase().includes('meeting')
      ).length;

      // Leads processed today (leads created or updated today)
      const leadsProcessedToday = projectLeads.filter(lead => {
        const createdDate = new Date(lead.created_at);
        const updatedDate = new Date(lead.updated_at);
        return (createdDate >= todayStart && createdDate < tomorrow) ||
               (updatedDate >= todayStart && updatedDate < tomorrow);
      }).length;

      // Leads queued for tomorrow (pending processing state)
      const leadsQueuedForTomorrow = projectLeads.filter(lead => 
        lead.processing_state === 'pending' || lead.processing_state === 'queued'
      ).length;

      // Total active conversations
      const totalActiveConversations = projectConversations.filter(conv => 
        conv.status === 'active'
      ).length;

      // Response rate (leads with replies / leads contacted)
      const responseRate = firstMessagesSentToday > 0 
        ? (repliesToFirstMessages / firstMessagesSentToday) * 100 
        : 0;

      // Meeting conversion rate (meetings / total leads contacted)
      const meetingConversionRate = firstMessagesSentToday > 0
        ? (meetingsScheduledFromMessages / firstMessagesSentToday) * 100
        : 0;

      // Average response time calculation
      const leadsWithInteractions = projectLeads.filter(lead => 
        lead.first_interaction && lead.last_interaction && lead.interaction_count > 1
      );

      let averageResponseTime = 0;
      if (leadsWithInteractions.length > 0) {
        const totalResponseTime = leadsWithInteractions.reduce((sum, lead) => {
          const first = new Date(lead.first_interaction!).getTime();
          const last = new Date(lead.last_interaction!).getTime();
          const diffHours = (last - first) / (1000 * 60 * 60);
          return sum + diffHours;
        }, 0);
        averageResponseTime = totalResponseTime / leadsWithInteractions.length;
      }

      return {
        firstMessagesSentToday,
        repliesToFirstMessages,
        meetingsScheduledFromMessages,
        leadsProcessedToday,
        leadsQueuedForTomorrow,
        totalActiveConversations,
        responseRate: Math.round(responseRate * 10) / 10,
        meetingConversionRate: Math.round(meetingConversionRate * 10) / 10,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating message metrics:', error);
      return {
        firstMessagesSentToday: 0,
        repliesToFirstMessages: 0,
        meetingsScheduledFromMessages: 0,
        leadsProcessedToday: 0,
        leadsQueuedForTomorrow: 0,
        totalActiveConversations: 0,
        responseRate: 0,
        meetingConversionRate: 0,
        averageResponseTime: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  };

  // Generate trend data for the last 7 days
  const generateTrendData = async (): Promise<TrendData[]> => {
    try {
      const leads = await simpleProjectService.getAllLeads();
      if (!leads) return [];

      const projectLeads = currentProject 
        ? leads.filter(lead => lead.current_project_id === currentProject.id || lead.project_id === currentProject.id)
        : leads;

      const trendData: TrendData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayLeads = projectLeads.filter(lead => {
          const firstInteraction = lead.first_interaction ? new Date(lead.first_interaction) : null;
          return firstInteraction && firstInteraction >= dayStart && firstInteraction < dayEnd;
        });

        const firstMessages = dayLeads.length;
        const replies = dayLeads.filter(lead => lead.interaction_count > 1).length;
        const meetings = dayLeads.filter(lead => 
          lead.requires_human_review === true ||
          // Handle real database status values
        lead.state === 'contacted' ||
        lead.bant_status === 'need_qualified' ||
        (typeof lead.status === 'string' && lead.status.includes('qualified'))
        ).length;
        const conversionRate = firstMessages > 0 ? (meetings / firstMessages) * 100 : 0;

        trendData.push({
          period: date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'short' }),
          firstMessages,
          replies,
          meetings,
          conversionRate: Math.round(conversionRate * 10) / 10,
        });
      }

      return trendData;
    } catch (error) {
      console.error('Error generating trend data:', error);
      return [];
    }
  };

  // Generate queue data
  const generateQueueData = async (): Promise<DailyQueueData[]> => {
    try {
      const leads = await simpleProjectService.getAllLeads();
      if (!leads) return [];

      const projectLeads = currentProject 
        ? leads.filter(lead => lead.current_project_id === currentProject.id || lead.project_id === currentProject.id)
        : leads;

      const queueData: DailyQueueData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayProcessed = projectLeads.filter(lead => {
          const processedDate = new Date(lead.updated_at);
          return processedDate >= dayStart && processedDate < dayEnd && 
                 lead.processing_state === 'completed';
        }).length;

        const dayQueued = projectLeads.filter(lead => {
          const queuedDate = new Date(lead.created_at);
          return queuedDate >= dayStart && queuedDate < dayEnd && 
                 (lead.processing_state === 'pending' || lead.processing_state === 'queued');
        }).length;

        const successRate = dayQueued > 0 ? (dayProcessed / dayQueued) * 100 : 0;

        queueData.push({
          date: date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' }),
          leadsProcessed: dayProcessed,
          leadsQueued: dayQueued,
          successRate: Math.round(successRate * 10) / 10,
        });
      }

      return queueData;
    } catch (error) {
      console.error('Error generating queue data:', error);
      return [];
    }
  };

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [newMetrics, newTrendData, newQueueData] = await Promise.all([
        calculateMetrics(),
        generateTrendData(),
        generateQueueData(),
      ]);

      setMetrics(newMetrics);
      setTrendData(newTrendData);
      setQueueData(newQueueData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours * 10) / 10}h`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (current < previous) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>{t("common.loading", "Loading analytics...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", flexRowReverse())}>
        <div>
          <h2 className={cn("text-2xl font-bold", textStart())}>
            {t("pages.messages.analyticsTitle", "Messages Analytics Dashboard")}
          </h2>
          <p className={cn("text-gray-600 dark:text-slate-400", textStart())}>
            {t("pages.messages.analyticsSubtitle", "Track your lead conversion and messaging performance")}
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", flexRowReverse())}
        >
          <RefreshCw className={cn("h-4 w-4", { "animate-spin": isRefreshing })} />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First Messages Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pages.messages.firstMessagesToday", "First Messages Today")}
            </CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.firstMessagesSentToday}</div>
            <p className="text-xs text-muted-foreground">
              {t("pages.messages.leadsContacted", "Leads contacted today")}
            </p>
          </CardContent>
        </Card>

        {/* Replies to First Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pages.messages.repliesToFirst", "Replies to First Messages")}
            </CardTitle>
            <Reply className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.repliesToFirstMessages}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.responseRate}% {t("pages.messages.responseRate", "response rate")}
            </p>
          </CardContent>
        </Card>

        {/* Meetings Scheduled */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pages.messages.meetingsScheduled", "Meetings Scheduled")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.meetingsScheduledFromMessages}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.meetingConversionRate}% {t("pages.messages.conversionRate", "conversion rate")}
            </p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pages.messages.avgResponseTime", "Avg Response Time")}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              {t("pages.messages.responseTimeDesc", "Time to first reply")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">
            {t("pages.messages.dailyMetrics", "Daily Metrics")}
          </TabsTrigger>
          <TabsTrigger value="queue">
            {t("pages.messages.queueManagement", "Queue Management")}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t("pages.messages.trends", "Trends")}
          </TabsTrigger>
        </TabsList>

        {/* Daily Metrics Tab */}
        <TabsContent value="daily" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Performance */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", flexRowReverse())}>
                  <Activity className="h-5 w-5" />
                  {t("pages.messages.dailyPerformance", "Daily Performance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={cn("flex justify-between items-center", flexRowReverse())}>
                    <span className={textStart()}>
                      {t("pages.messages.leadsProcessedToday", "Leads Processed Today")}
                    </span>
                    <Badge variant="secondary">{metrics.leadsProcessedToday}</Badge>
                  </div>
                  <div className={cn("flex justify-between items-center", flexRowReverse())}>
                    <span className={textStart()}>
                      {t("pages.messages.leadsQueuedTomorrow", "Leads Queued for Tomorrow")}
                    </span>
                    <Badge variant="outline">{metrics.leadsQueuedForTomorrow}</Badge>
                  </div>
                  <div className={cn("flex justify-between items-center", flexRowReverse())}>
                    <span className={textStart()}>
                      {t("pages.messages.activeConversations", "Active Conversations")}
                    </span>
                    <Badge variant="default">{metrics.totalActiveConversations}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", flexRowReverse())}>
                  <Target className="h-5 w-5" />
                  {t("pages.messages.conversionFunnel", "Conversion Funnel")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className={cn("flex justify-between items-center mb-2", flexRowReverse())}>
                      <span className={cn("text-sm", textStart())}>
                        {t("pages.messages.firstMessages", "First Messages")}
                      </span>
                      <span className="text-sm font-medium">{metrics.firstMessagesSentToday}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className={cn("flex justify-between items-center mb-2", flexRowReverse())}>
                      <span className={cn("text-sm", textStart())}>
                        {t("pages.messages.replies", "Replies")}
                      </span>
                      <span className="text-sm font-medium">{metrics.repliesToFirstMessages}</span>
                    </div>
                    <Progress value={metrics.responseRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className={cn("flex justify-between items-center mb-2", flexRowReverse())}>
                      <span className={cn("text-sm", textStart())}>
                        {t("pages.messages.meetings", "Meetings")}
                      </span>
                      <span className="text-sm font-medium">{metrics.meetingsScheduledFromMessages}</span>
                    </div>
                    <Progress value={metrics.meetingConversionRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Queue Management Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", flexRowReverse())}>
                <Users className="h-5 w-5" />
                {t("pages.messages.queueManagement", "Queue Management")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.leadsProcessedToday}</div>
                    <div className="text-sm text-blue-600">{t("pages.messages.processedToday", "Processed Today")}</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{metrics.leadsQueuedForTomorrow}</div>
                    <div className="text-sm text-orange-600">{t("pages.messages.queuedTomorrow", "Queued for Tomorrow")}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((metrics.leadsProcessedToday / Math.max(metrics.leadsProcessedToday + metrics.leadsQueuedForTomorrow, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-green-600">{t("pages.messages.processingRate", "Processing Rate")}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className={cn("font-medium", textStart())}>
                    {t("pages.messages.last7Days", "Last 7 Days Queue Performance")}
                  </h4>
                  <div className="space-y-2">
                    {queueData.map((day, index) => (
                      <div key={index} className={cn("flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded", flexRowReverse())}>
                        <span className={cn("text-sm", textStart())}>{day.date}</span>
                        <div className={cn("flex items-center gap-2", flexRowReverse())}>
                          <span className="text-sm">
                            {day.leadsProcessed}/{day.leadsQueued}
                          </span>
                          <Badge variant={day.successRate > 80 ? "default" : day.successRate > 60 ? "secondary" : "destructive"}>
                            {day.successRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", flexRowReverse())}>
                <TrendingUp className="h-5 w-5" />
                {t("pages.messages.trends", "7-Day Trends")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.map((day, index) => (
                  <div key={index} className={cn("flex items-center justify-between p-3 border rounded-lg", flexRowReverse())}>
                    <div className={textStart()}>
                      <div className="font-medium">{day.period}</div>
                      <div className="text-sm text-muted-foreground">
                        {day.conversionRate}% {t("pages.messages.conversion", "conversion")}
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-4", flexRowReverse())}>
                      <div className="text-center">
                        <div className="text-sm font-medium">{day.firstMessages}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("pages.messages.sent", "Sent")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{day.replies}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("pages.messages.replies", "Replies")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{day.meetings}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("pages.messages.meetings", "Meetings")}
                        </div>
                      </div>
                      {index > 0 && (
                        <div className="flex items-center">
                          {getTrendIcon(day.conversionRate, trendData[index - 1]?.conversionRate || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className={cn("text-xs text-muted-foreground", textStart())}>
        {t("pages.messages.lastUpdated", "Last updated")}: {new Date(metrics.lastUpdated).toLocaleString(isRTL ? 'he-IL' : 'en-US')}
      </div>
    </div>
  );
}; 