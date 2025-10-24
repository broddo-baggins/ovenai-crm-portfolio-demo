import { Send, TrendingUp, TrendingDown } from "lucide-react";

interface MessagesSentProps {
  data?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown?: {
      automated: number;
      manual: number;
    };
  };
}

const mockData = {
  total: 2847,
  trend: 18.2,
  timeRange: "This Week",
  breakdown: {
    automated: 2156,
    manual: 691,
  },
};

const MessagesSent = ({ data = mockData }: MessagesSentProps) => {
  const isPositive = data.trend >= 0;

  return (
    <div className="widget-flex-container">
      {/* Header Section */}
      <div className="widget-flex-row">
        <div className="widget-flex-col">
          <p className="widget-description widget-header-text">Messages Sent</p>
          <h2 className="widget-value widget-header-text">
            {data.total.toLocaleString()}
          </h2>
        </div>
        <div className="flex-shrink-0">
          <Send className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Trend Section */}
      <div className="widget-flex-row">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{Math.abs(data.trend)}%</span>
        </div>
        <span className="widget-description widget-header-text">
          vs {data.timeRange}
        </span>
      </div>

      {/* Breakdown Section - Scrollable */}
      {data.breakdown && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-2">
            <h3 className="widget-title">Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Automated:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.automated.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Manual:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.manual.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesSent;
