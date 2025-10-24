import React from "react";
import { Calendar, TrendingDown, TrendingUp, Target, Send } from "lucide-react";
import { WidgetSettings } from "@/types/widgets";

interface MeetingsSetPercentageProps {
  settings?: WidgetSettings;
  data?: {
    percentage: number;
    trend: number;
    timeRange: string;
    totalInitialMessages: number;
    totalMeetingsSet: number;
    conversionFunnel: {
      initialMessages: number;
      replies: number;
      qualified: number;
      meetingsSet: number;
    };
    targetPercentage?: number;
    breakdown: {
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
}

const mockData = {
  percentage: 0,
  trend: 0,
  timeRange: "This Week",
  totalInitialMessages: 0,
  totalMeetingsSet: 0,
  conversionFunnel: {
    initialMessages: 0,
    replies: 0,
    qualified: 0,
    meetingsSet: 0,
  },
  targetPercentage: 15,
  breakdown: {
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  },
};

/**
 * BANT/HEAT Lead Qualification Logic:
 * - Percentage: (Meetings scheduled / Initial outbound messages) * 100
 * - Initial Messages: First BANT qualification attempt to prospects
 * - Meetings Set: Confirmed meetings with qualified BANT/HEAT leads
 * - BANT/HEAT Pipeline: Cold → Warm → Hot → Burning → Meeting
 * - Tracks lead temperature progression and BANT qualification
 */
const MeetingsSetPercentage: React.FC<MeetingsSetPercentageProps> = ({
  settings,
  data = mockData,
}) => {
  const isPositive = data.trend >= 0;
  const targetPercentage = settings?.targetValue || data.targetPercentage;
  const isOnTarget = targetPercentage
    ? data.percentage >= targetPercentage
    : true;

  // Calculate BANT/HEAT progression rates
  const responseRate = (
    (data.conversionFunnel.replies / data.conversionFunnel.initialMessages) *
    100
  ).toFixed(1);
  const bantQualificationRate = (
    (data.conversionFunnel.qualified / data.conversionFunnel.replies) *
    100
  ).toFixed(1);
  const heatConversionRate = (
    (data.conversionFunnel.meetingsSet / data.conversionFunnel.qualified) *
    100
  ).toFixed(1);

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden widget-content">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0 widget-text-content">
          <p className="widget-description text-muted-foreground">
            Meetings Set
          </p>
          <h2 className="widget-value font-bold text-gray-900">
            {data.percentage.toFixed(1)}%
          </h2>
          <p className="widget-description text-muted-foreground">
            of initial messages
          </p>
        </div>
        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
      </div>

      <div className="flex items-center space-x-2 mb-3">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span
          className={`widget-description ${isPositive ? "text-green-500" : "text-red-500"}`}
        >
          {Math.abs(data.trend)}% {isPositive ? "increase" : "decrease"}
        </span>
        <span className="widget-description text-muted-foreground">
          vs {data.timeRange}
        </span>
      </div>

      {targetPercentage && (
        <div className="flex items-center space-x-2 mb-3">
          <Target
            className={`h-3 w-3 ${isOnTarget ? "text-green-500" : "text-orange-500"}`}
          />
          <span
            className={`widget-description ${isOnTarget ? "text-green-500" : "text-orange-500"}`}
          >
            {isOnTarget ? "Above target" : "Below target"} ({targetPercentage}%)
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Send className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="widget-title font-medium truncate">
              {data.totalInitialMessages.toLocaleString()}
            </p>
            <p className="widget-description text-muted-foreground truncate">
              Initial Messages
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="widget-title font-medium truncate">
              {data.totalMeetingsSet.toLocaleString()}
            </p>
            <p className="widget-description text-muted-foreground truncate">
              Meetings Set
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto breakdown-section">
        <div className="space-y-3">
          <div>
            <p className="widget-title font-medium text-muted-foreground mb-2">
              BANT/HEAT Pipeline
            </p>
            <div className="space-y-1">
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">Initial Outreach:</span>
                <span className="font-medium">
                  {data.conversionFunnel.initialMessages.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">
                  Responses ({responseRate}%):
                </span>
                <span className="font-medium">
                  {data.conversionFunnel.replies.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">
                  BANT Qualified ({bantQualificationRate}%):
                </span>
                <span className="font-medium">
                  {data.conversionFunnel.qualified.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">
                  Meetings Booked ({heatConversionRate}%):
                </span>
                <span className="font-medium">
                  {data.conversionFunnel.meetingsSet.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="widget-title font-medium text-muted-foreground mb-2">
              Historical Performance
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">This Week:</span>
                <span className="font-medium">{data.breakdown.thisWeek}%</span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">Last Week:</span>
                <span className="font-medium">{data.breakdown.lastWeek}%</span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">This Month:</span>
                <span className="font-medium">{data.breakdown.thisMonth}%</span>
              </div>
              <div className="flex justify-between widget-description">
                <span className="text-muted-foreground">Last Month:</span>
                <span className="font-medium">{data.breakdown.lastMonth}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsSetPercentage;
