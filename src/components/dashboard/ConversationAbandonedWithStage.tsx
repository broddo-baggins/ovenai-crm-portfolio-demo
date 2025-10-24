import React from "react";
import { BarChart2, TrendingDown, TrendingUp, Clock } from "lucide-react";
import { WidgetSettings } from "@/types/widgets";

interface ConversationAbandonedWithStageProps {
  settings?: WidgetSettings;
  data?: {
    total: number;
    percentage: number;
    trend: number;
    timeRange: string;
    stageBreakdown: {
      initial: number;
      middle: number;
      final: number;
    };
    averageTimeToAbandon: number; // in hours
  };
}

const mockData = {
  total: 127,
  percentage: 15.8,
  trend: -2.3,
  timeRange: "This Week",
  stageBreakdown: {
    initial: 45,
    middle: 52,
    final: 30,
  },
  averageTimeToAbandon: 18.5,
};

/**
 * Calculation Logic:
 * - Total: Count of conversations with no reply after threshold time
 * - Percentage: (Abandoned conversations / Total conversations) * 100
 * - Stage tracking: Initial (0-1 messages), Middle (2-5 messages), Final (6+ messages)
 * - Threshold: Configurable hours (default 24h) since last message
 */
const ConversationAbandonedWithStage: React.FC<
  ConversationAbandonedWithStageProps
> = ({ settings, data = mockData }) => {
  const isPositive = data.trend >= 0;
  const abandonmentThreshold = settings?.abandonmentThreshold || 24;
  const stage = settings?.abandonmentStage || "all";

  // Filter data based on stage setting
  const getStageData = () => {
    switch (stage) {
      case "initial":
        return { count: data.stageBreakdown.initial, label: "Initial Stage" };
      case "middle":
        return { count: data.stageBreakdown.middle, label: "Middle Stage" };
      case "final":
        return { count: data.stageBreakdown.final, label: "Final Stage" };
      default:
        return { count: data.total, label: "All Stages" };
    }
  };

  const stageData = getStageData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Conversations Abandoned
          </p>
          <h2 className="text-3xl font-bold">
            {stageData.count.toLocaleString()}
          </h2>
          <p className="text-sm text-muted-foreground">{stageData.label}</p>
        </div>
        <BarChart2 className="h-8 w-8 text-orange-500" />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-lg font-semibold text-orange-600">
          {data.percentage}%
        </span>
        <span className="text-sm text-muted-foreground">abandonment rate</span>
      </div>

      <div className="flex items-center space-x-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-red-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-green-500" />
        )}
        <span
          className={`text-sm ${isPositive ? "text-red-500" : "text-green-500"}`}
        >
          {Math.abs(data.trend)}% {isPositive ? "increase" : "decrease"}
        </span>
        <span className="text-sm text-muted-foreground">
          vs {data.timeRange}
        </span>
      </div>

      {stage === "all" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Initial Stage:</span>
            <span className="font-medium">{data.stageBreakdown.initial}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Middle Stage:</span>
            <span className="font-medium">{data.stageBreakdown.middle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Final Stage:</span>
            <span className="font-medium">{data.stageBreakdown.final}</span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2 border-t">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Avg. time to abandon: {data.averageTimeToAbandon}h
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        Threshold: {abandonmentThreshold}h since last message
      </div>
    </div>
  );
};

export default ConversationAbandonedWithStage;
