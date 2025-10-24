import React from 'react';
import { Clock, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { WidgetSettings } from '@/types/widgets';

interface MeanTimeToFirstReplyProps {
  settings?: WidgetSettings;
  data?: {
    meanTime: number; // in minutes
    trend: number;
    timeRange: string;
    unit: 'minutes' | 'hours' | 'days';
    breakdown: {
      businessHours: number;
      afterHours: number;
      weekends: number;
    };
    targetTime?: number;
    totalReplies: number;
  };
}

const mockData = {
  meanTime: 47,
  trend: -12.5,
  timeRange: 'This Week',
  unit: 'minutes' as const,
  breakdown: {
    businessHours: 32,
    afterHours: 78,
    weekends: 156
  },
  targetTime: 30,
  totalReplies: 1247
};

/**
 * Calculation Logic:
 * - Mean Time: Average time between message sent and first reply
 * - Calculation: Sum of all response times / Number of responses
 * - Business Hours: Configurable working hours (default 9-17)
 * - Excludes automated responses and system messages
 * - Can be filtered by project, user, time range
 */
const MeanTimeToFirstReply: React.FC<MeanTimeToFirstReplyProps> = ({ 
  settings, 
  data = mockData 
}) => {
  const isPositive = data.trend >= 0;
  const unit = settings?.responseTimeUnit || data.unit;
  const businessHoursOnly = settings?.businessHoursOnly || false;
  const targetTime = settings?.targetValue || data.targetTime;

  // Convert time to display format
  const formatTime = (timeInMinutes: number) => {
    switch (unit) {
      case 'hours':
        return `${(timeInMinutes / 60).toFixed(1)}h`;
      case 'days':
        return `${(timeInMinutes / (60 * 24)).toFixed(1)}d`;
      default:
        return `${timeInMinutes}m`;
    }
  };

  // Get the relevant time based on settings
  const getDisplayTime = () => {
    if (businessHoursOnly) {
      return data.breakdown.businessHours;
    }
    return data.meanTime;
  };

  const displayTime = getDisplayTime();
  const isOnTarget = targetTime ? displayTime <= targetTime : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Mean Time to First Reply</p>
          <h2 className="text-3xl font-bold">{formatTime(displayTime)}</h2>
          <p className="text-sm text-muted-foreground">
            {businessHoursOnly ? 'Business hours only' : 'All hours'}
          </p>
        </div>
        <Clock className="h-8 w-8 text-blue-500" />
      </div>
      
      <div className="flex items-center space-x-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-red-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-green-500" />
        )}
        <span className={`text-sm ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
          {Math.abs(data.trend)}% {isPositive ? 'slower' : 'faster'}
        </span>
        <span className="text-sm text-muted-foreground">vs {data.timeRange}</span>
      </div>

      {targetTime && (
        <div className="flex items-center space-x-2">
          <Target className={`h-4 w-4 ${isOnTarget ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm ${isOnTarget ? 'text-green-500' : 'text-red-500'}`}>
            {isOnTarget ? 'On target' : 'Above target'} ({formatTime(targetTime)})
          </span>
        </div>
      )}

      {!businessHoursOnly && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Business Hours:</span>
            <span className="font-medium">{formatTime(data.breakdown.businessHours)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">After Hours:</span>
            <span className="font-medium">{formatTime(data.breakdown.afterHours)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekends:</span>
            <span className="font-medium">{formatTime(data.breakdown.weekends)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
        <span>Total replies analyzed:</span>
        <span className="font-medium">{data.totalReplies.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default MeanTimeToFirstReply; 