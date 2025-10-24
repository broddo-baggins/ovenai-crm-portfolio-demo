import React from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import EnhancedStatsCard from "./EnhancedStatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsSectionProps {
  enhancedStats: any[];
  isLoading: boolean;
  onToggleVisibility: () => void;
  visibleWidgetsCount: number;
}

const DashboardStatsSection: React.FC<DashboardStatsSectionProps> = ({
  enhancedStats,
  isLoading,
  onToggleVisibility,
  visibleWidgetsCount,
}) => {
  const { t } = useTranslation("dashboard");
  const { flexRowReverse } = useLang();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-xl shadow-sm bg-card dark:bg-card border-border dark:border-border"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {enhancedStats.map((stat, index) => (
        <EnhancedStatsCard key={`${stat.title}-${index}`} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStatsSection;
