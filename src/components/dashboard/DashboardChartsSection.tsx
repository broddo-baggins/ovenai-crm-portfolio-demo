import React from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import EnhancedChart from "./EnhancedChart";
import { ChartPieInteractive } from "@/components/ui/chart-pie-interactive";
import { ChartPieSimple } from "@/components/ui/chart-pie-simple";
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardChartsSectionProps {
  widgetVisibility: {
    leadsConversions: boolean;
    revenueChannel: boolean;
    pieCharts: boolean;
    monthlyPerformance: boolean;
    interactiveAreaChart?: boolean;
  };
  leadsConversionsData: any[];
  leadsConversionsConfig: any;
  leadsConversionsAnalytics: any;
  revenueData: any[];
  revenueConfig: any;
  revenueAnalytics: any;
  monthlyPerformanceData: any[];
  monthlyPerformanceConfig: any;
  monthlyPerformanceAnalytics: any;
}

const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({
  widgetVisibility,
  leadsConversionsData,
  leadsConversionsConfig,
  leadsConversionsAnalytics,
  revenueData,
  revenueConfig,
  revenueAnalytics,
  monthlyPerformanceData,
  monthlyPerformanceConfig,
  monthlyPerformanceAnalytics,
}) => {
  const { t } = useTranslation("pages");
  const { t: tWidgets } = useTranslation("widgets");
  const { flexRowReverse } = useLang();

  // Transform monthly performance data for interactive area chart
  const areaChartData = monthlyPerformanceData.map(item => ({
    date: item.date || item.name || item.month || new Date().toISOString().split('T')[0],
    desktop: item.leads || 0,
    mobile: item.conversions || 0,
  }));

  const areaChartConfig = {
    visitors: {
      label: "Performance",
    },
    desktop: {
      label: t("dashboard.charts.leads", "Leads"),
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: t("dashboard.charts.conversions", "Conversions"),
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <>
      {/* Main Charts Section - Mobile-responsive: single column on mobile, 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {widgetVisibility.leadsConversions && (
          <EnhancedChart
            title={t(
              "dashboard.charts.leadsConversions.title",
              "Leads & Conversions",
            )}
            description={t(
              "dashboard.charts.leadsConversions.description",
              "Track your lead generation and conversion performance over time",
            )}
            type="line"
            data={leadsConversionsData}
            config={leadsConversionsConfig}
            xAxis={{
              label: "Month",
              description:
                "Monthly leads and conversions data for the current year",
            }}
            yAxis={{
              label: "Count",
              unit: "leads",
              format: (value) => value.toString(),
              description: "Number of leads generated and converted each month",
            }}
            analytics={leadsConversionsAnalytics}
            height={300} // Reduced height for mobile
            className="w-full min-w-0" // Ensure chart doesn't overflow
          />
        )}

        {widgetVisibility.revenueChannel && (
          <EnhancedChart
            title={t(
              "dashboard.charts.bantHeatProgression.title",
              "BANT/HEAT Lead Progression & Meeting Pipeline",
            )}
            description={t(
              "dashboard.charts.bantHeatProgression.description",
              "Track lead qualification from first contact through BANT assessment to scheduled meetings",
            )}
            type="bar"
            data={revenueData}
            config={revenueConfig}
            xAxis={{
              label: "Month",
              description:
                "Monthly lead qualification and meeting booking data",
            }}
            yAxis={{
              label: "Count",
              unit: "leads",
              format: (value) => value.toString(),
              description:
                "Number of leads at each stage: new → contacted → qualified → meetings scheduled",
            }}
            analytics={revenueAnalytics}
            height={300} // Reduced height for mobile
            className="w-full min-w-0" // Ensure chart doesn't overflow
          />
        )}
      </div>

      {/* Interactive Area Chart Section */}
      {(widgetVisibility.interactiveAreaChart !== false) && (
        <div className="mt-3 sm:mt-4 md:mt-6">
          <ChartAreaInteractive 
            data={areaChartData}
            config={areaChartConfig}
            title={t("dashboard.charts.performanceTrends.title", "Performance Trends")}
            description={t("dashboard.charts.performanceTrends.description", "Interactive view of leads and conversions over time with date range selection")}
          />
        </div>
      )}

      {/* Pie Charts Section - Mobile-responsive: single column on mobile, 2 columns on larger screens */}
      {widgetVisibility.pieCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <ChartPieInteractive />
          <ChartPieSimple />
        </div>
      )}

      {/* Monthly Performance Section */}
      {widgetVisibility.monthlyPerformance && (
        <Card className="bg-card dark:bg-card border-border dark:border-border w-full min-w-0">
          <CardHeader>
            <CardTitle
              className={cn(
                "flex items-center gap-2 text-foreground dark:text-foreground",
                flexRowReverse(),
              )}
            >
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {t(
                "dashboard.charts.monthlyPerformance.title",
                "Monthly Performance Overview",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedChart
              title={t(
                "dashboard.charts.monthlyPerformance.subtitle",
                "Monthly Performance Metrics",
              )}
              description={t(
                "dashboard.charts.monthlyPerformance.description",
                "Comprehensive view of monthly leads, reach, conversions, meetings, and messages",
              )}
              type="line"
              data={monthlyPerformanceData}
              config={monthlyPerformanceConfig}
              xAxis={{
                label: "Month",
                description: "Monthly performance data for the current year",
              }}
              yAxis={{
                label: "Count",
                unit: "activities",
                format: (value) => value.toString(),
                description:
                  "Total count of various business activities per month",
              }}
              analytics={monthlyPerformanceAnalytics}
              height={300} // Reduced height for mobile
              className="w-full min-w-0" // Ensure chart doesn't overflow
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default DashboardChartsSection;
