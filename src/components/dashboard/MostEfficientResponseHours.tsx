import React from 'react';
import { Clock, Star, BarChart3 } from 'lucide-react';
import { WidgetSettings } from '@/types/widgets';

interface MostEfficientResponseHoursProps {
  settings?: WidgetSettings;
  data?: {
    peakHours: Array<{
      hour: number;
      replyRate: number; // percentage
      avgResponseTime: number; // in minutes
      totalMessages: number;
    }>;
    bestHour: {
      hour: number;
      replyRate: number;
      avgResponseTime: number;
    };
    worstHour: {
      hour: number;
      replyRate: number;
      avgResponseTime: number;
    };
    timeRange: string;
    timezone: string;
  };
}

const mockData = {
  peakHours: [
    { hour: 9, replyRate: 87.5, avgResponseTime: 23, totalMessages: 156 },
    { hour: 10, replyRate: 92.1, avgResponseTime: 18, totalMessages: 203 },
    { hour: 11, replyRate: 89.3, avgResponseTime: 21, totalMessages: 187 },
    { hour: 14, replyRate: 85.7, avgResponseTime: 28, totalMessages: 142 },
    { hour: 15, replyRate: 88.9, avgResponseTime: 25, totalMessages: 168 }
  ],
  bestHour: { hour: 10, replyRate: 92.1, avgResponseTime: 18 },
  worstHour: { hour: 17, replyRate: 45.2, avgResponseTime: 78 },
  timeRange: 'This Week',
  timezone: 'UTC-5'
};

/**
 * Calculation Logic:
 * - Reply Rate: (Messages with replies / Total messages sent) * 100 per hour
 * - Avg Response Time: Mean time to first reply for each hour
 * - Efficiency Score: Combination of high reply rate and low response time
 * - Peak Hours: Top 5 hours with highest efficiency scores
 * - Excludes weekends if businessHoursOnly is enabled
 */
const MostEfficientResponseHours: React.FC<MostEfficientResponseHoursProps> = ({ 
  settings, 
  data = mockData 
}) => {
  const timezone = settings?.timezone || data.timezone;
  const businessHoursOnly = settings?.businessHoursOnly || false;

  // Format hour for display
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Calculate efficiency score (higher reply rate + lower response time = better)
  const calculateEfficiencyScore = (replyRate: number, responseTime: number) => {
    // Normalize response time (lower is better, so invert)
    const normalizedResponseTime = Math.max(0, 100 - (responseTime / 2));
    return (replyRate * 0.7) + (normalizedResponseTime * 0.3);
  };

  // Sort peak hours by efficiency
  const sortedPeakHours = [...data.peakHours].sort((a, b) => 
    calculateEfficiencyScore(b.replyRate, b.avgResponseTime) - 
    calculateEfficiencyScore(a.replyRate, a.avgResponseTime)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Most Efficient Hours</p>
          <h2 className="text-2xl font-bold">{formatHour(data.bestHour.hour)}</h2>
          <p className="text-sm text-muted-foreground">
            Peak efficiency ({timezone})
          </p>
        </div>
        <Clock className="h-8 w-8 text-green-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Best Hour</span>
          </div>
          <p className="font-medium">{data.bestHour.replyRate}% reply rate</p>
          <p className="text-muted-foreground">{data.bestHour.avgResponseTime}m avg response</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-3 w-3 text-red-500" />
            <span className="text-muted-foreground">Worst Hour</span>
          </div>
          <p className="font-medium">{data.worstHour.replyRate}% reply rate</p>
          <p className="text-muted-foreground">{data.worstHour.avgResponseTime}m avg response</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Top Performing Hours</p>
        <div className="space-y-1">
          {sortedPeakHours.slice(0, 5).map((hour, index) => (
            <div key={hour.hour} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === 0 ? 'bg-green-100 text-green-700' : 
                  index === 1 ? 'bg-blue-100 text-blue-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium">{formatHour(hour.hour)}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{hour.replyRate}%</p>
                <p className="text-muted-foreground text-xs">{hour.avgResponseTime}m</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
        <span>Analysis period:</span>
        <span className="font-medium">{data.timeRange}</span>
      </div>

      {businessHoursOnly && (
        <div className="text-xs text-muted-foreground">
          * Business hours only (excludes weekends)
        </div>
      )}
    </div>
  );
};

export default MostEfficientResponseHours; 