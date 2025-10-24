import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';

/**
 * @deprecated This component is deprecated and will be removed in the next cleanup phase.
 * Use the consolidated MetricCard component from @/components/shared instead.
 * 
 * TODO: Replace all usages with MetricCard and remove this file
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

// Removed unused colorVariants

/**
 * @deprecated Use MetricCard instead
 * 
 * StatsCard Component
 * 
 * Displays a key metric with optional trend indicator and loading state
 * Used on the dashboard to show important statistics from Supabase
 */
export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  className
}: StatsCardProps) {
  const { t: _t } = useTranslation('widgets');
  const { isRTL, flexRowReverse, textStart } = useLang();

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", flexRowReverse())}>
          <CardTitle className={cn("text-sm font-medium text-muted-foreground", textStart())}>
            {title}
          </CardTitle>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={cn("text-2xl font-bold", textStart())}>
          {typeof value === 'number' 
            ? value.toLocaleString(isRTL ? 'he-IL' : 'en-US') 
            : value
          }
        </div>
        
        {change && (
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getChangeColor())}
            >
              {change}
            </Badge>
            {description && (
              <span className={cn("text-xs text-muted-foreground", textStart())}>
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
