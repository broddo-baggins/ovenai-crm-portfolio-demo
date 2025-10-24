import { Users, TrendingUp, TrendingDown } from "lucide-react";

interface AvgMessagesPerCustomerProps {
  data?: {
    average: number;
    trend: number;
    timeRange: string;
    breakdown?: {
      newCustomers: number;
      returningCustomers: number;
      vipCustomers: number;
    };
  };
}

const mockData = {
  average: 8.3,
  trend: 5.7,
  timeRange: "This Week",
  breakdown: {
    newCustomers: 4.2,
    returningCustomers: 9.8,
    vipCustomers: 15.6,
  },
};

const AvgMessagesPerCustomer = ({
  data = mockData,
}: AvgMessagesPerCustomerProps) => {
  const isPositive = data.trend >= 0;

  return (
    <div className="widget-flex-container">
      {/* Header Section */}
      <div className="widget-flex-row">
        <div className="widget-flex-col">
          <p className="widget-description widget-header-text">
            Avg Messages Per Customer
          </p>
          <h2 className="widget-value widget-header-text">
            {data.average.toFixed(1)}
          </h2>
        </div>
        <div className="flex-shrink-0">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Trend Section */}
      <div className="widget-flex-row">
        <div className="flex items-center gap-1 flex-shrink-0">
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
        </div>
        <span className="widget-description widget-header-text">
          vs {data.timeRange}
        </span>
      </div>

      {/* Breakdown Section */}
      {data.breakdown && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-2">
            <h3 className="widget-title">Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  New Customers:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.newCustomers.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  Returning:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.returningCustomers.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                <span className="widget-breakdown-text text-muted-foreground">
                  VIP:
                </span>
                <span className="widget-breakdown-value">
                  {data.breakdown.vipCustomers.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvgMessagesPerCustomer;
