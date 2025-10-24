import React, { memo, useMemo, useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Info,
  HelpCircle,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AxisConfig {
  label: string;
  unit?: string;
  format?: (value: any) => string;
  description?: string;
}

interface ChartAnalytics {
  summary: string;
  insights: string[];
  trends: {
    direction: "up" | "down" | "stable";
    percentage: number;
    description: string;
  }[];
  recommendations?: string[];
}

interface EnhancedChartProps {
  title: string;
  description?: string;
  type: "line" | "bar" | "pie";
  data: Array<Record<string, any>>;
  className?: string;
  isLoading?: boolean;
  config: ChartConfig;
  xAxis: AxisConfig;
  yAxis?: AxisConfig;
  analytics: ChartAnalytics;
  height?: number;
  exportable?: boolean;
  interactive?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  config,
  xAxis,
  yAxis,
}: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="space-y-3">
        {/* Header with period */}
        <div className="border-b pb-2">
          <p className="font-semibold text-foreground">
            {xAxis.label}: {label}
          </p>
          {xAxis.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {xAxis.description}
            </p>
          )}
        </div>

        {/* Data points */}
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const configKey = entry.dataKey;
            const configItem = config[configKey];
            const value = entry.value;
            const formattedValue = yAxis?.format
              ? yAxis.format(value)
              : value.toLocaleString();

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">
                    {configItem?.label || entry.dataKey}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">
                    {formattedValue}
                    {yAxis?.unit && ` ${yAxis.unit}`}
                  </span>
                  {/* Show percentage change if available */}
                  {entry.payload.previousValue && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const current = entry.value;
                        const previous = entry.payload.previousValue;
                        const change = ((current - previous) / previous) * 100;
                        return (
                          <span
                            className={cn(
                              "inline-flex items-center",
                              change > 0
                                ? "text-green-600"
                                : change < 0
                                  ? "text-red-600"
                                  : "text-gray-600",
                            )}
                          >
                            {change > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : change < 0 ? (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            ) : null}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional context */}
        {yAxis?.description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">{yAxis.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedChart: React.FC<EnhancedChartProps> = memo(
  ({
    title,
    description,
    type,
    data,
    className,
    isLoading = false,
    config,
    xAxis,
    yAxis,
    analytics,
    height = 300,
    exportable = true,
    interactive = true,
  }) => {
    const [activeIndex, setActiveIndex] = useState<number | undefined>();

    const configKeys = useMemo(() => Object.keys(config), [config]);

    const loadingSkeleton = useMemo(
      () => (
        <Card className={cn("transition-all hover:shadow-md", className)}>
          <CardHeader>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </CardContent>
        </Card>
      ),
      [className],
    );

    const handleExport = useCallback(() => {
      // Implement chart export functionality
      const csvContent = [
        [
          xAxis.label,
          ...configKeys.map((key) => config[key]?.label || key),
        ].join(","),
        ...data.map((row) =>
          [
            row.name || row[Object.keys(row)[0]],
            ...configKeys.map((key) => row[key] || 0),
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-data.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }, [data, title, configKeys, config, xAxis.label]);

    const renderChart = useCallback(() => {
      const commonAxisProps = {
        axisLine: true,
        tickLine: true,
        tick: { fontSize: 12, fontWeight: 500 },
      };

      const commonMargin = { top: 20, right: 30, left: 20, bottom: 60 };

      switch (type) {
        case "line":
          return (
            <LineChart data={data} margin={commonMargin}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                {...commonAxisProps}
                label={{
                  value: `${xAxis.label}${xAxis.unit ? ` (${xAxis.unit})` : ""}`,
                  position: "insideBottom",
                  offset: -10,
                  style: {
                    textAnchor: "middle",
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                }}
              />
              <YAxis
                {...commonAxisProps}
                tickFormatter={
                  yAxis?.format || ((value) => value.toLocaleString())
                }
                label={{
                  value: `${yAxis?.label || "Value"}${yAxis?.unit ? ` (${yAxis.unit})` : ""}`,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                }}
              />
              <ChartTooltip
                content={
                  <CustomTooltip config={config} xAxis={xAxis} yAxis={yAxis} />
                }
              />
              {configKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: `var(--color-${key})`,
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: `var(--color-${key})`,
                    fill: "white",
                  }}
                />
              ))}
            </LineChart>
          );

        case "bar":
          return (
            <BarChart data={data} margin={commonMargin}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                {...commonAxisProps}
                label={{
                  value: `${xAxis.label}${xAxis.unit ? ` (${xAxis.unit})` : ""}`,
                  position: "insideBottom",
                  offset: -10,
                  style: {
                    textAnchor: "middle",
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                }}
              />
              <YAxis
                {...commonAxisProps}
                tickFormatter={
                  yAxis?.format || ((value) => value.toLocaleString())
                }
                label={{
                  value: `${yAxis?.label || "Value"}${yAxis?.unit ? ` (${yAxis.unit})` : ""}`,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                }}
              />
              <ChartTooltip
                content={
                  <CustomTooltip config={config} xAxis={xAxis} yAxis={yAxis} />
                }
              />
              {configKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={[4, 4, 0, 0]}
                  strokeWidth={1}
                  stroke={`var(--color-${key})`}
                />
              ))}
            </BarChart>
          );

        case "pie":
          const pieData = data.map((item, index) => ({
            name: item.name,
            value: item[configKeys[0]],
            fill: `var(--color-${configKeys[0]}${index})`,
          }));

          return (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke={activeIndex === index ? "white" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <CustomTooltip config={config} xAxis={xAxis} yAxis={yAxis} />
                }
              />
            </PieChart>
          );

        default:
          return null;
      }
    }, [type, data, configKeys, config, xAxis, yAxis, activeIndex]);

    if (isLoading) {
      return loadingSkeleton;
    }

    return (
      <TooltipProvider>
        <Card className={cn("transition-all hover:shadow-md", className)}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg font-semibold">
                    {title}
                  </CardTitle>
                </div>

                {description && (
                  <CardDescription className="text-sm text-muted-foreground">
                    {description}
                  </CardDescription>
                )}
              </div>

              {exportable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={config}
              className={`w-full`}
              style={{ height }}
            >
              {renderChart()}
            </ChartContainer>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  },
);

EnhancedChart.displayName = "EnhancedChart";

export default EnhancedChart;
