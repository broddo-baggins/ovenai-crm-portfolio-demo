import { MessageCircle, TrendingUp, TrendingDown } from "lucide-react";

interface ConversationsStartedProps {
  data?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown?: {
      automated: number;
      manual: number;
      inbound: number;
    };
  };
}

const mockData = {
  total: 324,
  trend: 8.5,
  timeRange: "This Week",
  breakdown: {
    automated: 198,
    manual: 89,
    inbound: 37,
  },
};

const ConversationsStarted = ({
  data = mockData,
}: ConversationsStartedProps) => {
  const isPositive = data.trend >= 0;

  return (
    <div className="widget-flex-container">
      {/* Header Section */}
      <div className="widget-flex-row">
        <div className="widget-flex-col">
          <p className="widget-description widget-header-text">
            Conversations Started
          </p>
          <h2 className="widget-value widget-header-text">
            {data.total.toLocaleString()}
          </h2>
        </div>
        <div className="flex-shrink-0">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
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
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Inbound:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.inbound.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsStarted;
