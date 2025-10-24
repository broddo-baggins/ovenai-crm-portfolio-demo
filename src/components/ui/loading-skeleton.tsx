import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: "sm" | "md" | "lg" | "xl";
}

const heightClasses = {
  sm: "h-4",
  md: "h-6", 
  lg: "h-8",
  xl: "h-12"
};

export function LoadingSkeleton({ 
  className, 
  lines = 3, 
  height = "md" 
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-muted rounded",
            heightClasses[height],
            index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

interface MetricSkeletonProps {
  className?: string;
}

export function MetricSkeleton({ className }: MetricSkeletonProps) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-8 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-3/4" />
    </div>
  );
} 