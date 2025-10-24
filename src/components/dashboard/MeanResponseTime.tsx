import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface MeanResponseTimeProps {
  data?: {
    averageTime: number;
    unit: 'minutes' | 'hours' | 'days';
    trend: number;
    timeRange: string;
    breakdown?: {
      automated: number;
      manual: number;
      peak: number;
      offPeak: number;
    };
  };
}

const mockData = {
  averageTime: 12.5,
  unit: 'minutes' as const,
  trend: -15.2,
  timeRange: 'This Week',
  breakdown: {
    automated: 2.1,
    manual: 18.7,
    peak: 15.3,
    offPeak: 8.9
  }
};

const MeanResponseTime = ({ data = mockData }: MeanResponseTimeProps) => {
  const isPositive = data.trend <= 0; // For response time, negative trend is positive (faster response)

  const formatTime = (time: number, unit: string) => {
    return `${time.toFixed(1)} ${unit}`;
  };

  return (
    <div className="widget-flex-container">
      {/* Header Section */}
      <div className="widget-flex-row">
        <div className="widget-flex-col">
          <p className="widget-description widget-header-text">Mean Response Time</p>
          <h2 className="widget-value widget-header-text">{formatTime(data.averageTime, data.unit)}</h2>
        </div>
        <div className="flex-shrink-0">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      
      {/* Trend Section */}
      <div className="widget-flex-row">
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPositive ? (
            <TrendingDown className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingUp className="h-3 w-3 text-red-500" />
          )}
          <span className={`widget-description ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(data.trend)}% {isPositive ? 'faster' : 'slower'}
          </span>
        </div>
        <span className="widget-description widget-header-text">vs {data.timeRange}</span>
      </div>

      {/* Breakdown Section */}
      {data.breakdown && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-2">
            <h3 className="widget-title">Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">Automated:</span>
                <span className="widget-breakdown-value">{formatTime(data.breakdown.automated, data.unit)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">Manual:</span>
                <span className="widget-breakdown-value">{formatTime(data.breakdown.manual, data.unit)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">Peak Hours:</span>
                <span className="widget-breakdown-value">{formatTime(data.breakdown.peak, data.unit)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">Off-Peak:</span>
                <span className="widget-breakdown-value">{formatTime(data.breakdown.offPeak, data.unit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeanResponseTime; 