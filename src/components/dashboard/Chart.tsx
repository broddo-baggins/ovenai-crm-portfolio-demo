import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartProps {
  title: string;
  description?: string;
  type: 'line' | 'bar' | 'pie';
  data: Array<Record<string, any>>;
  className?: string;
  isLoading?: boolean;
  config: ChartConfig;
}

export const Chart: React.FC<ChartProps> = memo(({
  title,
  description,
  type,
  data,
  className,
  isLoading = false,
  config,
}) => {
  // Memoize loading skeleton to prevent recreating on every render
  const loadingSkeleton = useMemo(() => (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          {description && <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
      </CardContent>
    </Card>
  ), [className, description]);

  // Memoize chart configuration keys to prevent unnecessary recalculations
  const configKeys = useMemo(() => 
    Object.keys(config).filter(key => key !== 'label'), 
    [config]
  );

  // Memoize chart rendering logic for better performance
  const renderChart = useCallback(() => {
    const commonAxisProps = {
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12 }
    };

    const commonMargin = { top: 5, right: 30, left: 20, bottom: 5 };

    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={commonMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {configKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={commonMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {configKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill || `var(--color-${String(entry.name)})`} 
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        );

      default:
        return null;
    }
  }, [type, data, configKeys]);

  // Early return for loading state
  if (isLoading) {
    return loadingSkeleton;
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

Chart.displayName = 'Chart'; 