import React from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  MessageSquare,
  Users,
  Calendar,
  Zap,
} from "lucide-react";
import { DashboardMetrics } from "@/services/dashboardAnalyticsService";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface DashboardInsightsSectionProps {
  metrics?: DashboardMetrics | null;
  loading?: boolean;
}

const DashboardInsightsSection: React.FC<DashboardInsightsSectionProps> = ({ 
  metrics, 
  loading = false 
}) => {
  const { t } = useTranslation("tables");
  const { flexRowReverse, textStart, textEnd } = useLang();

  // Calculate real values from metrics data
  const bantQualificationRate = metrics?.bant_qualification_rate?.percentage || 0;
  const leadReachRate = metrics?.first_message_rate?.percentage || 0;
  const temperatureDistribution = metrics?.lead_temperature_distribution;
  const warmToHotRate = temperatureDistribution ? 
    Math.round(((temperatureDistribution.hot + temperatureDistribution.burning) / temperatureDistribution.total) * 100) : 0;
  const meetingConversionRate = metrics?.meeting_pipeline?.conversion_rate || 0;

  // Calculate dynamic insights based on real data
  const calculateReachRateStatus = (rate: number) => {
    if (rate >= 85) return { status: "excellent", color: "green", icon: CheckCircle };
    if (rate >= 70) return { status: "good", color: "blue", icon: Activity };
    return { status: "needs_improvement", color: "orange", icon: AlertTriangle };
  };

  const reachRateStatus = calculateReachRateStatus(leadReachRate);
  const bantQualificationStatus = calculateReachRateStatus(bantQualificationRate);
  const meetingRateStatus = calculateReachRateStatus(meetingConversionRate);

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
      <CardHeader className="pb-4">
        <div
          className={cn("flex items-center justify-between", flexRowReverse())}
        >
          <div className={cn("flex items-center gap-3", flexRowReverse())}>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={textStart()}>
              <CardTitle className="text-xl font-semibold">
                {t("insights.title", "Performance Analytics")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t(
                  "insights.description",
                  "AI-powered insights and recommendations for business growth",
                )}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
          >
            {loading ? t("insights.badge.loading", "Loading...") : t("insights.badge", "Live Analysis")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/60 dark:bg-slate-900/60">
            <CardContent className="p-4">
              <div className={cn("flex items-center gap-3", flexRowReverse())}>
                <div className={`p-2 ${reachRateStatus.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' : reachRateStatus.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-orange-100 dark:bg-orange-900/50'} rounded-full`}>
                  <reachRateStatus.icon className={`h-5 w-5 ${reachRateStatus.color === 'green' ? 'text-green-600 dark:text-green-400' : reachRateStatus.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                </div>
                <div className={textStart()}>
                  <p className={`text-sm font-medium ${reachRateStatus.color === 'green' ? 'text-green-700 dark:text-green-400' : reachRateStatus.color === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {reachRateStatus.status === "excellent" 
                      ? t("insights.performance.excellent", "Excellent")
                      : reachRateStatus.status === "good"
                      ? t("insights.performance.good", "Good Progress") 
                      : t("insights.performance.needs_improvement", "Needs Focus")
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("insights.performance.reach", "Lead Reach Rate")}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{loading ? "..." : `${leadReachRate}%`}</span>
                  <span className="text-muted-foreground">{t("insights.performance.target", "Target")}: 85%</span>
                </div>
                <Progress value={loading ? 0 : leadReachRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-900/60">
            <CardContent className="p-4">
              <div className={cn("flex items-center gap-3", flexRowReverse())}>
                <div className={`p-2 ${meetingRateStatus.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' : meetingRateStatus.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-orange-100 dark:bg-orange-900/50'} rounded-full`}>
                  <meetingRateStatus.icon className={`h-5 w-5 ${meetingRateStatus.color === 'green' ? 'text-green-600 dark:text-green-400' : meetingRateStatus.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                </div>
                <div className={textStart()}>
                  <p className={`text-sm font-medium ${meetingRateStatus.color === 'green' ? 'text-green-700 dark:text-green-400' : meetingRateStatus.color === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {meetingRateStatus.status === "excellent" 
                      ? t("insights.performance.excellent", "Excellent")
                      : meetingRateStatus.status === "good"
                      ? t("insights.performance.good", "Good Progress") 
                      : t("insights.performance.needs_improvement", "Needs Focus")
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("insights.performance.conversion", "Meeting Conversion Rate")}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{loading ? "..." : `${meetingConversionRate}%`}</span>
                  <span className="text-muted-foreground">{t("insights.performance.target", "Target")}: 15%</span>
                </div>
                <Progress value={loading ? 0 : meetingConversionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-900/60">
            <CardContent className="p-4">
              <div className={cn("flex items-center gap-3", flexRowReverse())}>
                <div className={`p-2 ${bantQualificationStatus.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' : bantQualificationStatus.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-orange-100 dark:bg-orange-900/50'} rounded-full`}>
                  <bantQualificationStatus.icon className={`h-5 w-5 ${bantQualificationStatus.color === 'green' ? 'text-green-600 dark:text-green-400' : bantQualificationStatus.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                </div>
                <div className={textStart()}>
                  <p className={`text-sm font-medium ${bantQualificationStatus.color === 'green' ? 'text-green-700 dark:text-green-400' : bantQualificationStatus.color === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {bantQualificationStatus.status === "excellent" 
                      ? t("insights.performance.excellent", "Excellent")
                      : bantQualificationStatus.status === "good"
                      ? t("insights.performance.good", "Good Progress") 
                      : t("insights.performance.needs_improvement", "Needs Focus")
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("insights.performance.activity", "BANT Qualification Rate")}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{loading ? "..." : `${bantQualificationRate}%`}</span>
                  <span className="text-muted-foreground">{t("insights.performance.target", "Target")}: 80%</span>
                </div>
                <Progress value={loading ? 0 : bantQualificationRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <div className={cn("flex items-center gap-2", flexRowReverse())}>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg text-green-800 dark:text-green-300">
                  {t("insights.strengths.title", "Key Strengths")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  {t(
                    "insights.strengths.bant.title",
                    "BANT Qualification System",
                  )}
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {loading 
                    ? t("insights.loading", "Loading qualification data...")
                    : t(
                        "insights.strengths.bant.desc",
                        `${bantQualificationRate}% of leads successfully BANT qualified - ${bantQualificationRate >= 50 ? 'strong' : 'developing'} budget, authority, need, and timeline assessment.`,
                      )
                  }
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  {t(
                    "insights.strengths.heat.title",
                    "Lead Temperature System",
                  )}
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {loading 
                    ? t("insights.loading", "Loading temperature data...")
                    : t(
                        "insights.strengths.heat.desc",
                        `${warmToHotRate}% of leads progressed to warm/hot status through automated nurturing sequences.`,
                      )
                  }
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  {t(
                    "insights.strengths.calendly.title",
                    "Meeting Pipeline Success",
                  )}
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {loading 
                    ? t("insights.loading", "Loading meeting data...")
                    : t(
                        "insights.strengths.calendly.desc",
                        `${meetingConversionRate}% meeting conversion rate - ${meetingConversionRate >= 10 ? 'excellent' : 'improving'} lead-to-meeting pipeline performance.`,
                      )
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <div className={cn("flex items-center gap-2", flexRowReverse())}>
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-800 dark:text-orange-300">
                  {t("insights.opportunities.title", "Growth Opportunities")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-300">
                  {t(
                    "insights.opportunities.cold_leads.title",
                    "Temperature Optimization",
                  )}
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  {loading ? (
                    <LoadingSkeleton lines={2} height="sm" className="mt-1" />
                  ) : temperatureDistribution && temperatureDistribution.total > 0 ? (
                    t(
                      "insights.opportunities.cold_leads.desc",
                      `${Math.round((temperatureDistribution.cold / temperatureDistribution.total) * 100)}% of leads still in cold status - optimize automated sequences to increase temperature faster.`,
                    )
                  ) : (
                    t("insights.opportunities.cold_leads.desc.nodata", "No temperature data available - implement lead warming sequences.")
                  )}
                </AlertDescription>
              </Alert>

              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <Users className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-300">
                  {t(
                    "insights.opportunities.bant_improvement.title",
                    "BANT Process Enhancement",
                  )}
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  {loading ? (
                    <LoadingSkeleton lines={2} height="sm" className="mt-1" />
                  ) : bantQualificationRate < 80 ? (
                    t(
                      "insights.opportunities.bant_improvement.desc",
                      `Improve BANT qualification rate from ${bantQualificationRate}% to 80% through better discovery questions and timing.`,
                    )
                  ) : (
                    t(
                      "insights.opportunities.bant_improvement.desc.excellent",
                      `Excellent BANT performance at ${bantQualificationRate}% - maintain current qualification processes.`,
                    )
                  )}
                </AlertDescription>
              </Alert>

              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <Calendar className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-300">
                  {t(
                    "insights.opportunities.calendly_optimization.title",
                    "Meeting Conversion Boost",
                  )}
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  {loading ? (
                    <LoadingSkeleton lines={2} height="sm" className="mt-1" />
                  ) : meetingConversionRate < 15 ? (
                    t(
                      "insights.opportunities.calendly_optimization.desc",
                      `Only ${meetingConversionRate}% of burning leads book meetings - optimize calendar links and scheduling flow.`,
                    )
                  ) : (
                    t(
                      "insights.opportunities.calendly_optimization.desc.excellent",
                      `Strong meeting conversion at ${meetingConversionRate}% - focus on meeting quality optimization.`,
                    )
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className={cn("flex items-center gap-2", flexRowReverse())}>
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg text-blue-800 dark:text-blue-300">
                {t("insights.actions.title", "Recommended Actions")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                >
                  {t("insights.actions.priority.high", "High Priority")}
                </Badge>
                <ul className={cn("space-y-1 text-sm", textStart())}>
                  <li
                    className={cn("flex items-center gap-2", flexRowReverse())}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    {t(
                      "insights.actions.high.1",
                      "Optimize cold→warm lead warming sequences",
                    )}
                  </li>
                  <li
                    className={cn("flex items-center gap-2", flexRowReverse())}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    {t(
                      "insights.actions.high.2",
                      "Improve BANT qualification questions",
                    )}
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                >
                  {t("insights.actions.priority.medium", "Medium Priority")}
                </Badge>
                <ul className={cn("space-y-1 text-sm", textStart())}>
                  <li
                    className={cn("flex items-center gap-2", flexRowReverse())}
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    {t(
                      "insights.actions.medium.1",
                      "A/B test Calendly booking flow CTAs",
                    )}
                  </li>
                  <li
                    className={cn("flex items-center gap-2", flexRowReverse())}
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    {t(
                      "insights.actions.medium.2",
                      "Analyze burning→meeting conversion gaps",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default DashboardInsightsSection;
