import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyStatsProps {
  title?: string;
  isLoading?: boolean;
  className?: string;
  data?: {
    totalProperties?: number;
    successRate?: number;
    trend?: number;
    timeRange?: string;
  };
}

const getWidgetData = (title?: string) => {
  switch (title) {
    case 'Success Rate':
      return {
        value: '0%',
        trend: 3,
        timeRange: 'last week',
        icon: Target,
        label: 'Success Rate'
      };
    default:
      return {
        value: 156,
        trend: 0,
        timeRange: '',
        icon: Building2,
        label: 'Total Properties'
      };
  }
};

const PropertyStats = ({ title, isLoading = false, className = "", data }: PropertyStatsProps) => {
  const widgetData = getWidgetData(title);
  const IconComponent = widgetData.icon;
  const isPositive = widgetData.trend >= 0;

  return (
    <div className={`${className}`}>
      {title === 'Success Rate' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{widgetData.label}</p>
              <h2 className="text-3xl font-bold">{data?.successRate ? `${data.successRate}%` : widgetData.value}</h2>
            </div>
            <IconComponent className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              +{Math.abs(data?.trend || widgetData.trend)}% from {data?.timeRange || widgetData.timeRange}
            </span>
          </div>
        </div>
      ) : (
        <Card className="elevation-1 hover:elevation-3 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{widgetData.label}</CardTitle>
            <IconComponent className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-3/4" />
            ) : (
              <div className="text-2xl font-bold">{data?.totalProperties || widgetData.value}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyStats; 