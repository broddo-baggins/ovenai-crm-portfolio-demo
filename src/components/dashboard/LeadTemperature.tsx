import React from 'react';
import { Thermometer, TrendingUp, TrendingDown, Users, Flame, Snowflake } from 'lucide-react';
import { WidgetSettings } from '@/types/widgets';

interface LeadTemperatureProps {
  settings?: WidgetSettings;
  data?: {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    trend: {
      hot: number;
      warm: number;
      cold: number;
    };
    timeRange: string;
    breakdown: {
      hotPercentage: number;
      warmPercentage: number;
      coldPercentage: number;
    };
  };
}

const mockData = {
  total: 1247,
  hot: 89,
  warm: 456,
  cold: 702,
  trend: {
    hot: 12.5,
    warm: -3.2,
    cold: -8.1
  },
  timeRange: 'This Week',
  breakdown: {
    hotPercentage: 7.1,
    warmPercentage: 36.6,
    coldPercentage: 56.3
  }
};

/**
 * Calculation Logic:
 * - Hot: Leads with high engagement (replied within 1 hour, multiple interactions)
 * - Warm: Leads with moderate engagement (replied within 24 hours, some interactions)
 * - Cold: Leads with low/no engagement (no reply or replied after 24+ hours)
 * - Percentages: (Count per temperature / Total leads) * 100
 */
const LeadTemperature: React.FC<LeadTemperatureProps> = ({ 
  settings, 
  data = mockData 
}) => {
  const showInactive = settings?.showInactive || false;
  const temperatureLevels = settings?.temperatureLevels || ['hot', 'warm', 'cold'];

  const temperatureData = [
    {
      label: 'Hot',
      count: data.hot,
      percentage: data.breakdown.hotPercentage,
      trend: data.trend.hot,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
      textColor: 'text-red-700',
      icon: Flame,
      emoji: 'HOT'
    },
    {
      label: 'Warm',
      count: data.warm,
      percentage: data.breakdown.warmPercentage,
      trend: data.trend.warm,
      color: 'from-orange-400 to-yellow-500',
      bgColor: 'bg-gradient-to-r from-orange-50 to-yellow-100',
      textColor: 'text-orange-700',
      icon: Thermometer,
      emoji: '🌡️'
    },
    {
      label: 'Cold',
      count: data.cold,
      percentage: data.breakdown.coldPercentage,
      trend: data.trend.cold,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      icon: Snowflake,
      emoji: '❄️'
    }
  ].filter(item => temperatureLevels.includes(item.label.toLowerCase()));

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4 min-h-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-medium text-gray-700">Lead Temperature</p>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {data.total.toLocaleString()}
          </h2>
          <p className="text-xs text-muted-foreground">Total leads tracked</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Thermometer className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Temperature Distribution - Scrollable */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="space-y-3">
          {temperatureData.map((temp) => {
            const isPositive = temp.trend >= 0;
            
            return (
              <div key={temp.label} className={`${temp.bgColor} rounded-lg p-3 border border-gray-200 shadow-sm`}>
                {/* Temperature Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{temp.emoji}</span>
                    <div>
                      <h3 className={`font-semibold text-sm ${temp.textColor}`}>{temp.label} Leads</h3>
                      <p className="text-xs text-gray-600">{temp.percentage.toFixed(1)}% of total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${temp.textColor}`}>
                      {temp.count.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(temp.trend)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-white/60 rounded-full h-2 shadow-inner">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${temp.color} shadow-sm transition-all duration-500 ease-out`}
                      style={{ width: `${Math.min(temp.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>0%</span>
                    <span className="font-medium">{temp.percentage.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="mt-4 p-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Period: {data.timeRange}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Most Active</div>
              <div className="text-xs font-semibold text-gray-800">
                {temperatureData.reduce((max, temp) => 
                  temp.count > max.count ? temp : max
                ).label} ({temperatureData.reduce((max, temp) => 
                  temp.count > max.count ? temp : max
                ).count})
              </div>
            </div>
          </div>
        </div>

        {showInactive && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            * Including inactive leads in calculation
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadTemperature; 