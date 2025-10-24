import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @deprecated This component is deprecated and will be removed in the next cleanup phase.
 * Use the consolidated MetricCard component from @/components/shared instead.
 * 
 * TODO: Replace all usages with MetricCard and remove this file
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    positive: boolean;
  };
  className?: string;
}

/**
 * @deprecated Use MetricCard instead
 */
const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => {
  return (
    <Card className={`animate-fade-in-up elevation-1 elevation-hover ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? "text-green-500" : "text-red-500"}`}>
            {trend.positive ? "+" : "-"}{trend.value} from last week
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
