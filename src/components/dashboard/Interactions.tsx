import { MousePointer, TrendingUp, TrendingDown } from "lucide-react";

interface InteractionsProps {
  data?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown?: {
      clicks: number;
      replies: number;
      reactions: number;
    };
  };
}

const mockData = {
  total: 1456,
  trend: 12.8,
  timeRange: "This Week",
  breakdown: {
    clicks: 892,
    replies: 423,
    reactions: 141,
  },
};

const Interactions = ({ data = mockData }: InteractionsProps) => {
  const isPositive = data.trend >= 0;

  return (
    <div className="widget-flex-container">
      {/* Header Section */}
      <div className="widget-flex-row">
        <div className="widget-flex-col">
          <p className="widget-description widget-header-text">Interactions</p>
          <h2 className="widget-value widget-header-text">
            {data.total.toLocaleString()}
          </h2>
        </div>
        <div className="flex-shrink-0">
          <MousePointer className="h-6 w-6 text-muted-foreground" />
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
                  Clicks:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.clicks.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Replies:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.replies.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Reactions:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.reactions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interactions;
