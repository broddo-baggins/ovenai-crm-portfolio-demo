import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  MessageSquare,
  Calendar,
  MoreVertical,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MobileDashboardLayoutProps {
  metrics: Array<{
    id: string;
    title: string;
    value: string | number;
    trend?: {
      direction: "up" | "down" | "stable";
      percentage: number;
      label: string;
    };
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
  }>;
  onToggleWidget: (id: string) => void;
  onRefreshData?: () => void;
  className?: string;
}

const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({
  metrics,
  onToggleWidget,
  onRefreshData,
  className,
}) => {
  const { t } = useTranslation();
  const [isWidgetControlOpen, setIsWidgetControlOpen] = useState(false);

  const visibleMetrics = metrics.filter((metric) => metric.visible);
  const hiddenCount = metrics.length - visibleMetrics.length;

  const handleRefresh = useCallback(() => {
    if (onRefreshData) {
      onRefreshData();
    }
  }, [onRefreshData]);

  const renderTrendIndicator = (trend?: {
    direction: "up" | "down" | "stable";
    percentage: number;
    label: string;
  }) => {
    if (!trend) return null;

    const isPositive = trend.direction === "up";
    const isNegative = trend.direction === "down";

    return (
      <div
        className={cn(
          "flex items-center space-x-1 text-xs",
          isPositive && "text-green-600 dark:text-green-400",
          isNegative && "text-red-600 dark:text-red-400",
          trend.direction === "stable" && "text-gray-600 dark:text-slate-400",
        )}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        <span className="font-medium">
          {isPositive ? "+" : ""}
          {trend.percentage}%
        </span>
        <span className="text-muted-foreground">{trend.label}</span>
      </div>
    );
  };

  const renderMetricCard = (metric: (typeof metrics)[0], index: number) => {
    const Icon = metric.icon;

    return (
      <Card
        key={metric.id}
        className={cn(
          "touch-manipulation transition-all duration-200",
          "hover:shadow-md active:scale-[0.98]",
          "min-h-[120px]", // Ensure adequate touch target
        )}
        style={{
          animationDelay: `${index * 100}ms`,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold">{metric.value}</div>
            {renderTrendIndicator(metric.trend)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {t("dashboard.title", "Dashboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.subtitle", "Your business overview")}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 touch-manipulation"
            aria-label={t("dashboard.refresh", "Refresh data")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Widget Controls */}
          <Sheet
            open={isWidgetControlOpen}
            onOpenChange={setIsWidgetControlOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 touch-manipulation relative"
                aria-label={t("dashboard.widgetControls", "Widget controls")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {t("dashboard.widgetControls", "Widget Controls")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "dashboard.widgetControlsDesc",
                      "Show or hide dashboard widgets",
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {metric.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleWidget(metric.id)}
                        className="h-8 w-8 touch-manipulation"
                        aria-label={
                          metric.visible
                            ? t("dashboard.hideWidget", "Hide widget")
                            : t("dashboard.showWidget", "Show widget")
                        }
                      >
                        {metric.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dashboard.visibleWidgets", "Visible widgets")}
                    </span>
                    <span className="font-medium">
                      {visibleMetrics.length}/{metrics.length}
                    </span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Metrics Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleMetrics.map((metric, index) => renderMetricCard(metric, index))}
      </div>

      {/* Empty State */}
      {visibleMetrics.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <EyeOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {t("dashboard.noWidgets", "No widgets visible")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "dashboard.noWidgetsDesc",
                  "Enable some widgets to see your dashboard data",
                )}
              </p>
            </div>
            <Button
              onClick={() => setIsWidgetControlOpen(true)}
              className="touch-manipulation"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t("dashboard.manageWidgets", "Manage Widgets")}
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Stats Summary for Mobile */}
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.quickStats", "Quick Stats")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {
                  visibleMetrics.filter((m) => m.trend?.direction === "up")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.improving", "Improving")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {
                  visibleMetrics.filter((m) => m.trend?.direction === "down")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.declining", "Declining")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDashboardLayout;
