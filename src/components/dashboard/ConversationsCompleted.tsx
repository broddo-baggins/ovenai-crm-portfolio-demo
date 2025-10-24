import { CheckCircle, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { widgetDataService } from "@/services/widgetDataService";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/context/ProjectContext";

interface ConversationsCompletedProps {
  data?: {
    total: number;
    trend: number;
    timeRange: string;
    conversionRate: number;
    breakdown?: {
      meetings: number;
      sales: number;
      followUps: number;
    };
  };
}

const mockData = {
  total: 89,
  trend: 15.3,
  timeRange: "This Week",
  conversionRate: 27.5,
  breakdown: {
    meetings: 67,
    sales: 15,
    followUps: 7,
  },
};

const ConversationsCompleted = ({ data }: ConversationsCompletedProps) => {
  const { t } = useTranslation("widgets");
  const { isRTL, flexRowReverse, textStart, textEnd } = useLang();
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [realData, setRealData] = useState(data || mockData);
  const [loading, setLoading] = useState(!data);

  // Fetch real data if no data prop is provided
  useEffect(() => {
    const fetchRealData = async () => {
      if (!user || data) {
        setLoading(false);
        return;
      }

      try {
        const widgetData = await widgetDataService.getWidgetData(
          user.id,
          currentProject?.id,
        );
        setRealData(widgetData.conversationsCompleted || mockData);
      } catch (error) {
        console.error("Error fetching conversations completed data:", error);
        setRealData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [user, currentProject?.id, data]);

  const currentData = data || realData;
  const isPositive = currentData.trend >= 0;

  if (loading) {
    return (
      <div className="widget-flex-container animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div
      className={cn("widget-flex-container", isRTL && "font-hebrew")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header Section */}
      <div className={cn("widget-flex-row", flexRowReverse())}>
        <div className="widget-flex-col">
          <p
            className={cn("widget-description widget-header-text", textStart())}
          >
            {t("conversationsCompleted.title", "Conversations Completed")}
          </p>
          <h2 className={cn("widget-value widget-header-text", textStart())}>
            {currentData.total.toLocaleString(isRTL ? "he-IL" : "en-US")}
          </h2>
        </div>
        <div className="flex-shrink-0">
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
      </div>

      {/* Trend Section */}
      <div className={cn("widget-flex-row", flexRowReverse())}>
        <div
          className={cn(
            `flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              isPositive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`,
            flexRowReverse(),
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{Math.abs(currentData.trend)}%</span>
        </div>
        <span
          className={cn("widget-description widget-header-text", textStart())}
        >
          {t("conversationsCompleted.thisWeek", `vs ${currentData.timeRange}`)}
        </span>
      </div>

      {/* Conversion Rate */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 bg-green-50 rounded-lg",
          flexRowReverse(),
        )}
      >
        <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span
          className={cn(
            "widget-breakdown-text font-medium text-green-700",
            textStart(),
          )}
        >
          {currentData.conversionRate}%{" "}
          {t("conversationsCompleted.conversionRate", "conversion rate")}
        </span>
      </div>

      {/* Breakdown Section - Scrollable */}
      {currentData.breakdown && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-2">
            <h3 className={cn("widget-title", textStart())}>
              {t("conversationsCompleted.breakdown", "Breakdown")}
            </h3>
            <div className="space-y-2">
              <div
                className={cn(
                  "flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded",
                  flexRowReverse(),
                )}
              >
                <span
                  className={cn(
                    "widget-breakdown-text text-muted-foreground",
                    textStart(),
                  )}
                >
                  {t("conversationsCompleted.meetings", "Meetings")}:
                </span>
                <span className={cn("widget-breakdown-value", textEnd())}>
                  {currentData.breakdown.meetings.toLocaleString(
                    isRTL ? "he-IL" : "en-US",
                  )}
                </span>
              </div>
              <div
                className={cn(
                  "flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded",
                  flexRowReverse(),
                )}
              >
                <span
                  className={cn(
                    "widget-breakdown-text text-muted-foreground",
                    textStart(),
                  )}
                >
                  {t("conversationsCompleted.sales", "Sales")}:
                </span>
                <span className={cn("widget-breakdown-value", textEnd())}>
                  {currentData.breakdown.sales.toLocaleString(
                    isRTL ? "he-IL" : "en-US",
                  )}
                </span>
              </div>
              <div
                className={cn(
                  "flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded",
                  flexRowReverse(),
                )}
              >
                <span
                  className={cn(
                    "widget-breakdown-text text-muted-foreground",
                    textStart(),
                  )}
                >
                  {t("conversationsCompleted.followUps", "Follow-ups")}:
                </span>
                <span className={cn("widget-breakdown-value", textEnd())}>
                  {currentData.breakdown.followUps.toLocaleString(
                    isRTL ? "he-IL" : "en-US",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsCompleted;
