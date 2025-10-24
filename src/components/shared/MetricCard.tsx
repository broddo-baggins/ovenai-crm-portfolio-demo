import { ReactNode, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props for the MetricCard component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    positive: boolean;
    label?: string;
  };
  className?: string;
  isLoading?: boolean;
  subtitle?: string;
  animate?: boolean;
}

/**
 * Consolidated MetricCard Component
 * 
 * Replaces duplicate StatsCard and StatCard components
 * Displays a key metric with optional trend indicator and loading state
 * Used throughout the dashboard to show important statistics
 */
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className = "",
  isLoading = false,
  subtitle,
  animate = true
}: MetricCardProps) => {
  const [animateState, setAnimateState] = useState(!animate);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  useEffect(() => {
    if (animate && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimateState(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAnimateState(true);
    }
  }, [animate, prefersReducedMotion]);

  const baseClasses = "elevation-1 hover:elevation-3 transition-all duration-200";
  const animationClasses = animate 
    ? `${animateState ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` 
    : 'animate-fade-in-up elevation-hover';

  return (
    <Card className={`${baseClasses} ${animationClasses} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 ${trend.positive ? "text-green-500" : "text-red-500"}`}>
                {trend.positive ? "+" : ""}{trend.value} {trend.label || "from last week"}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 