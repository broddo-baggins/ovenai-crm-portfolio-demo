/**
 * Real-Time Dashboard Metrics Component
 * Displays BANT qualification rate, heat distribution, first message rate,
 * and meeting pipeline metrics using real database data
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  MessageSquare,
  Calendar,
  Thermometer,
  Target,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  dashboardAnalyticsService,
  DashboardMetrics,
} from "@/services/dashboardAnalyticsService";
import { useProject } from "@/context/ProjectContext";

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
  unit = "",
  trend,
  trendLabel = "from last week",
  icon: Icon,
  color,
  loading = false,
  subtitle,
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    red: "text-red-600 bg-red-50 border-red-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
  };

  const iconColors = {
    blue: "text-blue-500",
    green: "text-green-500",
    orange: "text-orange-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <Card className={cn("h-full border", colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconColors[color])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {value}
          {unit}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center space-x-1">
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositiveTrend ? "text-green-600" : "text-red-600",
              )}
            >
              {Math.abs(trend)}
              {unit} {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">
            Lead Temperature Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
        </CardContent>
      </Card>
    );
  }

  const temperatureConfig = [
    {
      label: "Cold",
      key: "cold",
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "Warm",
      key: "warm",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
    },
    {
      label: "Hot",
      key: "hot",
      color: "bg-orange-500",
      textColor: "text-orange-700",
    },
    {
      label: "Burning",
      key: "burning",
      color: "bg-red-500",
      textColor: "text-red-700",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium">
          Lead Temperature Distribution
        </CardTitle>
        <Thermometer className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold text-gray-900">
          {distribution.cold}/{distribution.warm}/{distribution.hot}/
          {distribution.burning}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          C/W/H/B distribution
        </p>

        {temperatureConfig.map((temp) => {
          const count = distribution[
            temp.key as keyof typeof distribution
          ] as number;
          const percentage =
            distribution.total > 0 ? (count / distribution.total) * 100 : 0;

          return (
            <div key={temp.key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-medium", temp.textColor)}>
                  {temp.label}
                </span>
                <span className="text-xs font-mono text-gray-600">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                style={{
                  backgroundColor: `${temp.color.replace("bg-", "")}20`,
                }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const RealTimeDashboardMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentProject } = useProject();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardAnalyticsService.getDashboardMetrics(
        currentProject?.id || undefined,
      );

      setMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Failed to load metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    // REMOVED: 5-minute refresh interval causing excessive requests
    // Dashboard will refresh via project change events only
    // Listen for project change events instead
    const handleProjectChange = () => {
      loadMetrics();
    };
    
    window.addEventListener('project-changed', handleProjectChange);
    window.addEventListener('force-dashboard-refresh', handleProjectChange);

    return () => {
      window.removeEventListener('project-changed', handleProjectChange);
      window.removeEventListener('force-dashboard-refresh', handleProjectChange);
    };
  }, [currentProject?.id]);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadMetrics}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time metrics from your lead pipeline
            {metrics && (
              <span className="ml-2">
                • Updated{" "}
                {new Date(metrics.calculation_timestamp).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last 30 Days
        </Badge>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BANT Qualification Rate */}
        <MetricCard
          title="BANT Qualification Rate"
          value={metrics?.bant_qualification_rate.percentage || 0}
          unit="%"
          trend={metrics?.bant_qualification_rate.trend_weekly}
          icon={UserCheck}
          color="green"
          loading={loading}
          subtitle={`${metrics?.bant_qualification_rate.qualified_count || 0} of ${metrics?.bant_qualification_rate.total_assessed || 0} leads`}
        />

        {/* Hot & Burning Leads */}
        <MetricCard
          title="Hot & Burning Leads"
          value={
            (metrics?.lead_temperature_distribution.hot || 0) +
            (metrics?.lead_temperature_distribution.burning || 0)
          }
          trend={metrics?.lead_temperature_distribution.trend_weekly}
          trendLabel="% change from last week"
          icon={TrendingUp}
          color="red"
          loading={loading}
          subtitle={
            `${(((metrics?.lead_temperature_distribution.hot || 0) + (metrics?.lead_temperature_distribution.burning || 0)) / Math.max(metrics?.lead_temperature_distribution.total || 1, 1)) * 100}% of total leads`.slice(
              0,
              15,
            ) + "%"
          }
        />

        {/* First Message Rate */}
        <MetricCard
          title="First Message Rate"
          value={metrics?.first_message_rate.percentage || 0}
          unit="%"
          trend={metrics?.first_message_rate.trend_weekly}
          icon={MessageSquare}
          color="blue"
          loading={loading}
          subtitle={`${metrics?.first_message_rate.contacted_count || 0} of ${metrics?.first_message_rate.total_leads || 0} reached`}
        />

        {/* Meeting Pipeline */}
        <MetricCard
          title="Meeting Pipeline"
          value={metrics?.meeting_pipeline.total_meetings || 0}
          trend={metrics?.meeting_pipeline.trend_weekly}
          trendLabel="change this week"
          icon={Calendar}
          color="purple"
          loading={loading}
          subtitle={`${metrics?.meeting_pipeline.conversion_rate || 0}% conversion rate`}
        />
      </div>

      {/* Temperature Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Temperature Distribution */}
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
          loading={loading}
        />

        {/* Additional metrics cards can go here */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Leads</span>
                    <div className="text-lg font-semibold">
                      {metrics?.lead_temperature_distribution.total || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      This Week's Meetings
                    </span>
                    <div className="text-lg font-semibold">
                      {metrics?.meeting_pipeline.meetings_this_week || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      BANT Qualified
                    </span>
                    <div className="text-lg font-semibold">
                      {metrics?.bant_qualification_rate.qualified_count || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Active Conversations
                    </span>
                    <div className="text-lg font-semibold">
                      {metrics?.first_message_rate.contacted_count || 0}
                    </div>
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Pipeline Health</span>
                    <span>
                      {Math.round(
                        ((metrics?.bant_qualification_rate.percentage || 0) +
                          (metrics?.first_message_rate.percentage || 0)) /
                          2,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.round(
                      ((metrics?.bant_qualification_rate.percentage || 0) +
                        (metrics?.first_message_rate.percentage || 0)) /
                        2,
                    )}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on qualification rate and outreach success
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Metrics auto-refresh every 5 minutes •
          <button
            onClick={loadMetrics}
            className="ml-1 text-blue-600 hover:text-blue-800 underline"
            disabled={loading}
          >
            Refresh Now
          </button>
        </p>
      </div>
    </div>
  );
};

export default RealTimeDashboardMetrics;
